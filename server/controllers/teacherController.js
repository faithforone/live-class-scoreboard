// server/controllers/teacherController.js

// 1. 필요한 모델과 유틸리티 가져오기
const db = require('../models'); // db 객체를 통해 모든 모델 접근
const { Op } = require("sequelize"); // 필요에 따라 Sequelize 연산자 사용
const { v4: uuidv4 } = require('uuid'); // uuid 사용 시

// --- 학생 관련 ---

// 모든 학생 목록 조회 (id 사용)
exports.getAllStudents = async (req, res) => {
  console.log('teacherController: getAllStudents triggered');
  try {
    const students = await db.Student.findAll({
      // attributes: ['id', 'name', 'status', 'currentSessionId'], // 모델 정의에 따라 camelCase 사용 가능성 확인
      attributes: ['id', 'name', 'status', 'current_session_id'], // 원본 코드 유지 (모델 정의 확인 필요)
      order: [['name', 'ASC']]
    });
    res.status(200).json(students);
  } catch (error) {
    console.error('Error fetching all students:', error.stack || error);
    res.status(500).json({ message: '전체 학생 목록 조회 중 오류가 발생했습니다.' });
  }
};

// 대기 중인 학생 목록 조회 (id 사용)
exports.getAvailableStudents = async (req, res) => {
  console.log('teacherController: getAvailableStudents triggered');
  try {
    const students = await db.Student.findAll({
      where: { status: '대기중' }, // 모델의 status 값 확인
      // attributes: ['id', 'name'],
      attributes: ['student_id', 'name'], // 원본 코드 우선 사용 (student 모델 PK 확인 필요!) - 일단 id 로 가정하고 아래 로직 진행
      order: [['name', 'ASC']]
    });
     // 임시: student_id를 id로 매핑 (student 모델 PK가 id일 경우 대비)
     const studentsMapped = students.map(s => ({ id: s.student_id, name: s.name }));
     res.status(200).json(studentsMapped);
     //res.status(200).json(students); // 원본 유지 시
  } catch (error) {
    console.error('Error fetching available students:', error.stack || error);
    res.status(500).json({ message: '대기 중인 학생 목록 조회 중 오류가 발생했습니다.' });
  }
};


// --- 그룹(템플릿) 관련 ---

// 모든 그룹(템플릿) 목록 가져오기 (db 사용)
exports.getGroups = async (req, res) => {
  console.log('teacherController: getGroups triggered');
  try {
    const groups = await db.Group.findAll({
      attributes: ['id', 'name'],
      order: [['name', 'ASC']],
    });
    console.log(`teacherController: Found ${groups.length} groups`);
    res.json(groups);
  } catch (error) {
    console.error('Error fetching groups:', error.stack || error);
    res.status(500).json({ message: '그룹 목록 조회 중 오류가 발생했습니다.' });
  }
};

// 특정 그룹(템플릿)의 학생 목록 가져오기 (EagerLoadingError 수정, db 사용, id 사용)
exports.getGroupStudents = async (req, res) => {
  console.log(`teacherController: getGroupStudents triggered for group ${req.params.groupId}`);
  try {
    const groupId = req.params.groupId;
    const group = await db.Group.findByPk(groupId, {
      include: [{
        model: db.Student,
        as: 'students', // <<< 모델 관계 정의 시 사용한 별명 (대소문자 주의!)
        attributes: ['id', 'name'], // <<< 실제 학생 모델의 컬럼 (id, name)
        through: { attributes: [] } // ManyToMany 관계의 중간 테이블 정보 제외
      }],
    });

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // 별명(as)에 따라 group.students 또는 group.Students
    const students = group.students || group.Students || [];
    console.log(`teacherController: Found ${students.length} students in group ${groupId}`);
    res.json(students);
  } catch (error) {
    console.error('Error fetching group students:', error.stack || error);
    res.status(500).json({ message: '그룹 학생 목록 조회 중 오류가 발생했습니다.' });
  }
};


// --- 수업 세션 관련 ---

// 새 수업 세션 생성 (studentIds 기반, id 사용, busy student 확인)
// 참고: 이전 코드에서 createClassSession 이름 사용. 일관성을 위해 유지.
exports.createClassSession = async (req, res) => {
    // const teacherId = req.user.id; // auth 미들웨어에서 id를 제공한다고 가정
    // 임시: teacherId를 req.ip로 대체 (auth 미들웨어 확인 필요)
    const teacherIdentifier = req.ip || 'unknown';
    const { studentIds } = req.body;

    console.log(`teacherController: createClassSession triggered by ${teacherIdentifier} with student IDs:`, studentIds);

    if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
        return res.status(400).json({ message: '수업에 참여할 학생 ID 목록이 필요합니다.' });
    }
    if (!studentIds.every(id => Number.isInteger(id) && id > 0)) {
         return res.status(400).json({ message: '학생 ID 목록이 유효하지 않습니다.' });
    }

    const t = await db.sequelize.transaction(); // 트랜잭션 시작 (db 객체 통해 sequelize 접근)

    try {
        // 이미 활성 세션('active' 또는 '수업중')에 참여 중인 학생 확인
        const activeSessions = await db.ClassSession.findAll({
            where: { status: 'active' }, // 'active' 상태인 세션만 조회
            attributes: ['id'],
            transaction: t
        });
        const activeSessionIds = activeSessions.map(s => s.id);

        let busyStudentsInfo = [];
        if (activeSessionIds.length > 0) {
            const busyParticipants = await db.SessionParticipant.findAll({
                where: {
                    StudentId: studentIds,
                    ClassSessionId: activeSessionIds
                },
                include: [{ model: db.Student, attributes: ['id', 'name'] }], // 학생 정보 포함
                transaction: t
            });
            busyStudentsInfo = busyParticipants.map(p => p.Student).filter(Boolean); // 바쁜 학생 정보 (null 제외)
        }

        // Student 테이블 자체의 상태도 확인 ('수업중' 상태) - 이중 체크
        const busyStudentsDirect = await db.Student.findAll({
             where: {
               id: studentIds, // id 사용
               status: '수업중' // 모델 정의 확인
             },
             attributes: ['id', 'name'],
             transaction: t
           });

        // 두 검사에서 발견된 바쁜 학생 목록 합치기 (중복 제거)
        const allBusyStudentIds = new Set([
            ...busyStudentsInfo.map(s => s.id),
            ...busyStudentsDirect.map(s => s.id)
        ]);

        if (allBusyStudentIds.size > 0) {
            // 바쁜 학생 정보 조회 (이름 포함)
             const finalBusyStudentDetails = await db.Student.findAll({
                where: { id: [...allBusyStudentIds] },
                attributes: ['id', 'name'],
                transaction: t
            });

            await t.rollback(); // 트랜잭션 롤백
            console.warn('Cannot start session. Busy students:', finalBusyStudentDetails.map(s=>s.name));
            return res.status(409).json({ // 409 Conflict
                message: '일부 학생들이 이미 다른 활성 수업에 참여 중입니다.',
                students: finalBusyStudentDetails
            });
        }

        // 새 수업 세션 생성
        const urlIdentifier = uuidv4().slice(0, 8); // 고유 URL 생성
        const newSession = await db.ClassSession.create({
            // teacherId: teacherId, // 실제 교사 ID 사용 필요
            status: 'active',
            startTime: new Date(),
            feedUrl: `/feed/${urlIdentifier}`, // 모델 필드명 확인
            widgetUrl: `/widget/${urlIdentifier}`, // 모델 필드명 확인
            createdBy: teacherIdentifier // IP 또는 교사 식별자
        }, { transaction: t });
        const sessionId = newSession.id;

        // 세션 참가자 등록 및 학생 상태 변경
        const participantPromises = studentIds.map(studentId => {
            return Promise.all([
                db.SessionParticipant.create({
                    ClassSessionId: sessionId, // 모델 관계/FK 이름 확인
                    StudentId: studentId      // 모델 관계/FK 이름 확인
                }, { transaction: t }),
                db.Student.update(
                    {
                        status: '수업중', // 모델 정의 확인
                        current_session_id: sessionId // FK 이름 확인
                    },
                    {
                        where: { id: studentId }, // id 사용
                        transaction: t
                    }
                )
            ]);
        });
        await Promise.all(participantPromises);

        await t.commit(); // 모든 작업 성공 시 트랜잭션 커밋
        console.log(`Session ${sessionId} created successfully with ${studentIds.length} students.`);

        res.status(201).json({
            message: '수업 세션이 성공적으로 시작되었습니다.',
            sessionId: sessionId,
            session: newSession
        });

    } catch (error) {
        await t.rollback(); // 오류 발생 시 트랜잭션 롤백
        console.error('Error creating class session:', error.stack || error);
        if (error.name === 'SequelizeForeignKeyConstraintError') {
             return res.status(400).json({ message: '유효하지 않은 학생 ID가 포함되어 있습니다.' });
        }
        res.status(500).json({ message: '서버 오류로 세션 생성에 실패했습니다.' });
    }
};

// 수업 세션 종료 (id 사용, FK/상태값 확인 필요)
exports.endClassSession = async (req, res) => {
  const sessionId = req.params.sessionId; // URL 파라미터 이름 확인
  console.log(`teacherController: endClassSession triggered for session ${sessionId}`);
  const t = await db.sequelize.transaction();
  try {
    const session = await db.ClassSession.findByPk(sessionId, { transaction: t });
    if (!session) {
      await t.rollback();
      return res.status(404).json({ message: '수업 세션을 찾을 수 없습니다.' });
    }
    if (session.status === '종료됨') { // 모델 상태값 확인
      await t.rollback();
      return res.status(400).json({ message: '이미 종료된 수업 세션입니다.' });
    }

    await session.update(
      { status: '종료됨', endTime: new Date() }, // 모델 필드명/상태값 확인
      { transaction: t }
    );
    await db.Student.update(
      { status: '대기중', current_session_id: null }, // 모델 필드명/상태값 확인
      { where: { current_session_id: sessionId }, transaction: t } // FK 이름 확인
    );

    await t.commit();
    console.log(`Session ${sessionId} ended successfully.`);
    res.status(200).json({ message: '수업 세션이 종료되었습니다.' });
  } catch (error) {
    await t.rollback();
    console.error(`Error ending class session ${sessionId}:`, error.stack || error);
    res.status(500).json({ message: '수업 세션 종료 중 오류가 발생했습니다.' });
  }
};

// 현재 활성 세션 조회 (id 사용, FK/별명 확인 필요)
exports.getMyActiveSession = async (req, res) => {
  // const teacherId = req.user.id; // 실제 교사 ID 사용 필요
  const teacherIdentifier = req.ip || 'unknown'; // 임시 식별자
  console.log(`teacherController: getMyActiveSession triggered for ${teacherIdentifier}`);
  try {
    const activeSession = await db.ClassSession.findOne({
      where: {
        status: 'active', // 모델 상태값 확인
        // createdBy: teacherIdentifier // 이 방식이 맞는지 확인 필요
      },
      include: [{
        model: db.Student,
        as: 'students', // <<< 모델 관계 별명 확인!
        attributes: ['id', 'name'],
        through: { attributes: [] }
      }]
    });

    if (!activeSession) {
      return res.status(200).json(null); // 404 대신 null 반환 또는 빈 객체 반환 고려
      // return res.status(404).json({ message: '현재 진행 중인 수업이 없습니다.' });
    }
    console.log(`teacherController: Found active session ${activeSession.id}`);
    res.status(200).json(activeSession);
  } catch (error) {
    console.error('Error fetching active session:', error.stack || error);
    res.status(500).json({ message: '활성 수업 조회 중 오류가 발생했습니다.' });
  }
};


// --- 점수 관련 ---

// 점수 업데이트 (id 사용, FK/상태값 확인 필요)
exports.updateScore = async (req, res) => {
  const { sessionId, studentId, points } = req.body; // 요청 필드명 확인
  // const teacherIdentifier = req.user.id || req.ip || 'unknown'; // 점수 부여 주체 식별
  const teacherIdentifier = req.ip || 'unknown'; // 임시

  console.log(`teacherController: updateScore triggered for session ${sessionId}, student ${studentId}, points ${points} by ${teacherIdentifier}`);

  // 입력값 기본 검증
  if (!sessionId || !studentId || points === undefined) {
    return res.status(400).json({ message: '세션 ID, 학생 ID, 점수는 필수 항목입니다.' });
  }
  const parsedPoints = parseInt(points);
  if (isNaN(parsedPoints)) {
      return res.status(400).json({ message: '점수는 숫자여야 합니다.' });
  }
  // 유효 점수 범위 등 추가 규칙 적용 가능

  try {
    // 세션과 학생 유효성 검증 (트랜잭션은 필수는 아님)
    const session = await db.ClassSession.findByPk(sessionId);
    const student = await db.Student.findByPk(studentId);

    if (!session || session.status !== 'active') { // 모델 상태값 확인
      return res.status(400).json({ message: '활성 상태인 수업 세션이 아닙니다.' });
    }
    // 학생이 해당 세션에 참여 중인지 SessionParticipant 테이블로 확인하는 것이 더 정확할 수 있음
    // const participant = await db.SessionParticipant.findOne({ where: { ClassSessionId: sessionId, StudentId: studentId } });
    // if (!participant) { ... }

    if (!student || student.status !== '수업중' || student.current_session_id !== sessionId) { // 모델 필드/상태값 확인
       return res.status(400).json({ message: '현재 해당 수업에 참여 중이지 않은 학생입니다.' });
    }

    // 점수 로그 생성
    const scoreLog = await db.ScoreLog.create({
      // ClassSessionId: sessionId, // 모델 FK 이름 확인
      // StudentId: studentId,     // 모델 FK 이름 확인
      session_id: sessionId, // 원본 코드 유지 시
      student_id: studentId, // 원본 코드 유지 시
      points: parsedPoints,
      timestamp: new Date(),
      teacher_identifier: teacherIdentifier // 모델 필드명 확인
    });

    console.log(`ScoreLog created with ID: ${scoreLog.id}`);

    // (WebSocket 연동)
    const io = req.app.get('io'); // app.js에서 io 설정 필요 (app.set('io', io))
    if (io) {
        const room = `session-${sessionId}`; // 예시 룸 이름
        io.to(room).emit('score_updated', { // 이벤트 이름 확인
            // 필요한 데이터 전달
            sessionId: sessionId,
            studentId: studentId,
            studentName: student.name, // 학생 이름 포함
            points: parsedPoints,
            logId: scoreLog.id,
            timestamp: scoreLog.timestamp
        });
        console.log(`Emitted score_updated to room ${room}`);
    } else {
        console.warn('Socket.io instance not found, cannot emit score_updated event.');
    }


    res.status(200).json({
      message: '점수가 업데이트되었습니다.',
      scoreLog
    });
  } catch (error) {
    console.error('Error updating score:', error.stack || error);
    res.status(500).json({ message: '점수 업데이트 중 오류가 발생했습니다.' });
  }
};


// --- 히스토리 관련 ---

// 내 수업 히스토리 조회 (id 사용, FK/별명 확인 필요)
exports.getMySessionHistory = async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  // const teacherId = req.user.id; // 실제 교사 ID 사용 필요
  const teacherIdentifier = req.ip || 'unknown'; // 임시 식별자
  const offset = (parseInt(page) - 1) * parseInt(limit);

  console.log(`teacherController: getMySessionHistory triggered for ${teacherIdentifier}, page: ${page}, limit: ${limit}`);

  try {
    const sessions = await db.ClassSession.findAndCountAll({
      // where: { createdBy: teacherIdentifier }, // 이 방식이 맞는지 확인
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['startTime', 'DESC']], // 모델 필드명 확인
      include: [{
        model: db.Student,
        as: 'students', // <<< 모델 관계 별명 확인!
        attributes: ['id', 'name'],
        through: { attributes: [] } // 중간 테이블 정보 제외
      }],
      distinct: true // count 계산 시 필요할 수 있음
    });

    res.status(200).json({
      totalItems: sessions.count,
      totalPages: Math.ceil(sessions.count / parseInt(limit)),
      currentPage: parseInt(page),
      sessions: sessions.rows
    });
  } catch (error) {
    console.error('Error fetching session history:', error.stack || error);
    res.status(500).json({ message: '수업 히스토리 조회 중 오류가 발생했습니다.' });
  }
};