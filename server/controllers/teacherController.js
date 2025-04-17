// server/controllers/teacherController.js

// 1. 필요한 모델과 유틸리티 가져오기
// 'db' 객체를 통해 모델에 접근하는 것으로 통일 (models/index.js 구조에 따라)
const db = require('../models');
const { Op } = require("sequelize"); // Sequelize 연산자
const { v4: uuidv4 } = require('uuid'); // uuid 사용
const jwt = require('jsonwebtoken');

// --- 교사 로그인 처리 (JWT 토큰 생성 추가) ---
exports.login = async (req, res) => {
  const { password } = req.body;

  if (!password) {
      return res.status(400).json({ message: '비밀번호를 입력해주세요.' });
  }

  try {
    // 1. 실제 교사 비밀번호 조회 (DB 우선, 없으면 .env fallback)
    const teacherPasswordSetting = await db.SystemSetting.findOne({
      where: { settingKey: 'teacher_password' }
    });
    // DB 설정 값이 없으면 환경 변수 사용
    const correctPassword = teacherPasswordSetting ? teacherPasswordSetting.settingValue : process.env.TEACHER_PASSWORD;

    // 비밀번호 설정이 어디에도 없는 경우
    if (!correctPassword) {
        console.error("Teacher password not found in SystemSetting or .env environment variable.");
        return res.status(500).json({ message: '서버 오류: 교사 비밀번호가 설정되지 않았습니다.' });
    }

    // 2. 비밀번호 비교
    if (password === correctPassword) {
      // 3. 비밀번호 일치 -> JWT 토큰 생성
      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret) {
          console.error('CRITICAL ERROR: JWT_SECRET is not defined in .env file for token signing.');
          return res.status(500).json({ message: '서버 내부 설정 오류입니다.' });
      }

      // 토큰에 포함될 정보 (Payload) - 역할(role)은 필수적
      const payload = {
        // teacherId: foundTeacher.id, // 만약 교사 모델이 있고 ID를 포함시키고 싶다면
        role: 'teacher' // 역할 정보 포함 (verifyTeacherToken 미들웨어에서 사용)
      };

      // 토큰 옵션 (만료 시간 등)
      const options = {
        expiresIn: process.env.JWT_EXPIRES_IN || '8h' // 예: 8시간 (환경 변수로 설정 가능)
      };

      // 토큰 서명 (생성)
      const token = jwt.sign(payload, jwtSecret, options);

      // 4. 생성된 토큰과 함께 성공 응답 전송
      res.status(200).json({
          message: '로그인 성공',
          token: token // 생성된 JWT 토큰
          // 필요하다면 다른 사용자 정보도 포함 가능 (하지만 민감 정보 제외)
      });

    } else {
      // 5. 비밀번호 불일치
      res.status(401).json({ message: '비밀번호가 일치하지 않습니다.' });
    }

  } catch (error) {
    // DB 조회 등에서 오류 발생 시
    console.error('Teacher login error:', error);
    res.status(500).json({ message: '로그인 처리 중 서버 오류가 발생했습니다.' });
  }
};



// --- 학생 관련 ---

// 모든 학생 목록 조회 (id, name 사용)
exports.getAllStudents = async (req, res) => {
    try {
        // Student 모델의 PK는 'id'로 가정 (student.js 확인 결과)
        const students = await db.Student.findAll({
            attributes: ['id', 'name'],
            order: [['name', 'ASC']]
        });
        res.status(200).json(students);
    } catch (error) {
        console.error('Error fetching students:', error);
        res.status(500).json({ message: 'Failed to fetch students' });
    }
};

// 대기 중인 학생 목록 조회 ('대기중' 상태, id, name 사용)
exports.getAvailableStudents = async (req, res) => {
  console.log('teacherController: getAvailableStudents triggered');
  try {
    const students = await db.Student.findAll({
      // student.js 모델의 status 필드 값과 '대기중' 문자열 일치 확인
      where: { status: '대기중' },
      // student.js 모델의 PK는 'id'
      attributes: ['id', 'name'],
      order: [['name', 'ASC']]
    });
    res.status(200).json(students);
  } catch (error) {
    console.error('Error fetching available students:', error.stack || error);
    res.status(500).json({ message: '대기 중인 학생 목록 조회 중 오류가 발생했습니다.' });
  }
};


// --- 그룹(템플릿) 관련 ---

// 모든 그룹(템플릿) 목록 가져오기 (id, name 사용)
exports.getGroups = async (req, res) => {
  console.log('teacherController: getGroups triggered');
  try {
    const groups = await db.Group.findAll({
      // group.js 모델의 PK는 'id'
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

// 특정 그룹(템플릿)의 학생 목록 가져오기 (id, name 사용, as: 'students' 확인)
exports.getGroupStudents = async (req, res) => {
  console.log(`teacherController: getGroupStudents triggered for group ${req.params.groupId}`);
  try {
    const groupId = req.params.groupId;
    const group = await db.Group.findByPk(groupId, {
      include: [{
        model: db.Student,
        // models/index.js 에서 Group.belongsToMany(db.Student, { as: 'students' ... }) 확인
        as: 'students',
        // student.js 모델의 PK는 'id'
        attributes: ['id', 'name'],
        through: { attributes: [] } // 중간 테이블 정보 제외
      }],
    });

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // 'as' 설정에 따라 group.students 로 접근
    const students = group.students || [];
    console.log(`teacherController: Found ${students.length} students in group ${groupId}`);
    // 학생 목록 이름순 정렬 추가
    students.sort((a, b) => a.name.localeCompare(b.name));
    res.json(students);
  } catch (error) {
    console.error('Error fetching group students:', error.stack || error);
    res.status(500).json({ message: '그룹 학생 목록 조회 중 오류가 발생했습니다.' });
  }
};


// --- 수업 세션 관련 ---

// 새 수업 세션 생성 (studentIds 기반, 바쁜 학생 확인)
exports.createClassSession = async (req, res) => {
    // const teacherId = req.user.id; // 실제 인증 구현 시 교사 ID 사용
    const teacherIdentifier = req.ip || 'unknown'; // 임시 식별자
    // 프론트에서 sessionName도 받을 수 있도록 수정 (ClassPreparation.js 참고)
    const { studentIds, sessionName } = req.body;

    console.log(`teacherController: createClassSession triggered by ${teacherIdentifier} with student IDs:`, studentIds);

    if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
        return res.status(400).json({ message: '수업에 참여할 학생 ID 목록이 필요합니다.' });
    }
    // ID 유효성 검사 강화
    if (!studentIds.every(id => Number.isInteger(Number(id)) && Number(id) > 0)) {
         return res.status(400).json({ message: '학생 ID 목록이 유효하지 않습니다. 숫자로만 구성되어야 합니다.' });
    }
    // 중복 ID 제거
    const uniqueStudentIds = [...new Set(studentIds.map(Number))];


    const t = await db.sequelize.transaction(); // 트랜잭션 시작

    try {
        // 1. 이미 활성 세션('active')에 참여 중인 학생 확인 (SessionParticipant 기준)
        // classSession.js 모델의 status 필드 값 'active' 확인
        const activeSessions = await db.ClassSession.findAll({
            where: { status: 'active' },
            attributes: ['id'],
            transaction: t
        });
        const activeSessionIds = activeSessions.map(s => s.id);

        let busyStudentsInfo = [];
        if (activeSessionIds.length > 0) {
            // sessionParticipant.js 모델의 FK 이름 'studentId', 'sessionId' 확인
            const busyParticipants = await db.SessionParticipant.findAll({
                where: {
                    studentId: uniqueStudentIds, // 수정됨
                    sessionId: activeSessionIds  // 수정됨
                },
                include: [{ model: db.Student, as: 'student', attributes: ['id', 'name'] }], // index.js 관계 설정 'as' 확인
                transaction: t
            });
            // .student 는 include 시 설정한 as:'student'에 따라 결정됨
            busyStudentsInfo = busyParticipants.map(p => p.student).filter(Boolean);
        }

        // 2. Student 테이블 자체의 상태 확인 ('수업중') - 이중 체크
        // student.js 모델의 status 필드 값 '수업중' 및 PK 'id' 확인
        const busyStudentsDirect = await db.Student.findAll({
             where: {
               id: uniqueStudentIds, // PK 'id' 사용
               status: '수업중'
             },
             attributes: ['id', 'name'],
             transaction: t
           });

        // 3. 두 검사 결과 종합 및 충돌 시 롤백
        const allBusyStudentIds = new Set([
            ...busyStudentsInfo.map(s => s.id),
            ...busyStudentsDirect.map(s => s.id)
        ]);

        if (allBusyStudentIds.size > 0) {
             const finalBusyStudentDetails = await db.Student.findAll({
                where: { id: [...allBusyStudentIds] },
                attributes: ['id', 'name'],
                transaction: t // 트랜잭션 내에서 조회
            });

            await t.rollback(); // 트랜잭션 롤백
            console.warn('Cannot start session. Busy students:', finalBusyStudentDetails.map(s=>s.name));
            return res.status(409).json({ // 409 Conflict 상태 코드 사용
                message: '일부 학생들이 이미 다른 활성 수업에 참여 중이거나 수업중 상태입니다.',
                students: finalBusyStudentDetails // 충돌 학생 목록 반환
            });
        }

        // 4. 새 수업 세션 생성
        // classSession.js 모델 필드 확인: urlIdentifier, status, startTime, name(선택)
        const urlIdentifier = uuidv4(); // 전체 UUID 사용 또는 필요 시 슬라이스
        const newSession = await db.ClassSession.create({
            // name: sessionName || `Session - ${new Date().toISOString()}`, // 세션 이름 설정
            name: sessionName || null, // 이름 없으면 null
            status: 'active',       // 'active' 상태로 시작
            startTime: new Date(),
            urlIdentifier: urlIdentifier // 고유 식별자 저장
            // teacherId: teacherId, // 실제 교사 ID 연결 시
        }, { transaction: t });
        const sessionId = newSession.id;

        // 5. 세션 참가자 등록 및 학생 상태 변경
        const participantPromises = uniqueStudentIds.map(studentId => {
            return Promise.all([
                // sessionParticipant.js 모델 FK 이름 'sessionId', 'studentId' 확인
                db.SessionParticipant.create({
                    sessionId: sessionId,
                    studentId: studentId,
                    score: 0 // 초기 점수 설정
                }, { transaction: t }),
                // student.js 모델 필드 'status', 'currentSessionId' 확인
                db.Student.update(
                    {
                        status: '수업중',
                        currentSessionId: sessionId // FK 필드명 확인
                    },
                    {
                        where: { id: studentId }, // PK 'id' 사용
                        transaction: t
                    }
                )
            ]);
        });
        await Promise.all(participantPromises);

        await t.commit(); // 모든 작업 성공 시 트랜잭션 커밋
        console.log(`Session ${sessionId} (${newSession.name || 'Unnamed'}) created successfully with ${uniqueStudentIds.length} students. Identifier: ${urlIdentifier}`);

        // 생성된 세션의 상세 정보 반환 (프론트엔드에서 바로 이동 등에 사용)
        const createdSessionDetails = await db.ClassSession.findByPk(sessionId, {
             include: [{
                 model: db.SessionParticipant,
                 as: 'sessionParticipants', // index.js 관계 설정 'as' 확인
                 include: [{ model: db.Student, as: 'student', attributes: ['id', 'name'] }]
             }]
        });

        res.status(201).json({
            message: '수업 세션이 성공적으로 시작되었습니다.',
            session: createdSessionDetails // 상세 정보 반환
        });

    } catch (error) {
        await t.rollback(); // 오류 발생 시 트랜잭션 롤백
        console.error('Error creating class session:', error.stack || error);
        // FK 제약 조건 오류 등 특정 오류 처리
        if (error.name === 'SequelizeForeignKeyConstraintError') {
             return res.status(400).json({ message: '유효하지 않은 학생 ID가 포함되어 있습니다.' });
        }
        res.status(500).json({ message: '서버 오류로 세션 생성에 실패했습니다.' });
    }
};

// 수업 세션 종료
exports.endClassSession = async (req, res) => {
  const { sessionId } = req.params; // 라우트 파라미터 이름 확인 필요
  console.log(`teacherController: endClassSession triggered for session ${sessionId}`);
  const t = await db.sequelize.transaction();
  try {
    const session = await db.ClassSession.findByPk(sessionId, { transaction: t });
    if (!session) {
      await t.rollback();
      return res.status(404).json({ message: '수업 세션을 찾을 수 없습니다.' });
    }
    // classSession.js 모델 상태값 '종료됨' 또는 'inactive' 확인
    if (session.status !== 'active') { // 이미 종료되었거나 다른 상태일 수 있음
      await t.rollback();
      // 상태에 따라 메시지 분기 가능
      return res.status(400).json({ message: session.status === '종료됨' ? '이미 종료된 수업 세션입니다.' : '활성 상태인 세션만 종료할 수 있습니다.' });
    }

    // classSession.js 모델 필드 'status', 'endTime' 확인
    await session.update(
      { status: '종료됨', endTime: new Date() }, // 사용자의 '종료됨' 상태 유지
      { transaction: t }
    );

    // 해당 세션 참여 학생들 상태 변경
    // student.js 모델 필드 'status', 'currentSessionId' 확인
    const updatedStudentCount = await db.Student.update(
      { status: '대기중', currentSessionId: null }, // 사용자의 '대기중' 상태 유지
      { where: { currentSessionId: sessionId }, transaction: t } // FK 이름 확인
    );

    await t.commit();
    console.log(`Session ${sessionId} ended successfully. Updated ${updatedStudentCount[0]} students.`);

    // Socket.IO로 세션 종료 알림 (선택적)
    const io = req.app.get('io');
    if (io && session.urlIdentifier) {
        io.to(`session-${sessionId}`).emit('sessionEnded'); // 세션 내부 룸
        io.to(`feed-${session.urlIdentifier}`).emit('sessionEnded'); // 공개 피드/위젯 룸
        console.log(`Emitted sessionEnded event for session ${sessionId}`);
    }

    res.status(200).json({ message: '수업 세션이 종료되었습니다.' });
  } catch (error) {
    await t.rollback();
    console.error(`Error ending class session ${sessionId}:`, error.stack || error);
    res.status(500).json({ message: '수업 세션 종료 중 오류가 발생했습니다.' });
  }
};

// 교사가 생성한 현재 활성 세션 조회
// (주의: 현재 코드는 teacherId를 사용하지 않고 가장 최근 active 세션을 찾는 방식일 수 있음)
exports.getMyActiveSession = async (req, res) => {
  // const teacherId = req.user.id; // 실제 교사 ID 사용 필요
  const teacherIdentifier = req.ip || 'unknown'; // 임시 식별자
  console.log(`teacherController: getMyActiveSession triggered for ${teacherIdentifier}`);
  try {
    // 가장 최근에 시작된 active 세션을 찾는 로직으로 가정 (teacherId 필터링 필요 시 추가)
    const activeSession = await db.ClassSession.findOne({
      where: {
        status: 'active', // classSession.js 상태값 확인
        // createdBy: teacherIdentifier // 이 필드가 모델에 있고, IP 기반 식별이 맞다면 사용
        // teacherId: teacherId // 실제 교사 ID 필터링 시
      },
      order: [['startTime', 'DESC']], // 가장 최근 세션
      include: [{
        model: db.SessionParticipant, // 참여자 정보 포함
        as: 'sessionParticipants',     // index.js 관계 설정 'as' 확인
        include: [{
          model: db.Student,         // 학생 정보 포함
          as: 'student',             // index.js 관계 설정 'as' 확인
          attributes: ['id', 'name']
        }]
      }]
    });

    if (!activeSession) {
      // 404 대신 null 반환하여 프론트에서 처리 용이하게 함
      return res.status(200).json(null);
    }
    console.log(`teacherController: Found active session ${activeSession.id}`);
    // 참여자 목록 이름순 정렬 (선택적)
    if (activeSession.sessionParticipants) {
        activeSession.sessionParticipants.sort((a, b) => {
             if (a.student && b.student) return a.student.name.localeCompare(b.student.name);
             return 0; // 학생 정보 없는 경우 대비
        });
    }
    res.status(200).json(activeSession);
  } catch (error) {
    console.error('Error fetching active session:', error.stack || error);
    res.status(500).json({ message: '활성 수업 조회 중 오류가 발생했습니다.' });
  }
};


// --- 점수 관련 ---

// 점수 업데이트 (SessionParticipant를 통해 ScoreLog 생성)
exports.updateScore = async (req, res) => {
  // 요청 body에서 sessionId, studentId, points 를 받는다고 가정
  const { sessionId, studentId, points } = req.body;
  const teacherIdentifier = req.ip || 'unknown'; // 임시 식별자

  console.log(`teacherController: updateScore triggered for session ${sessionId}, student ${studentId}, points ${points} by ${teacherIdentifier}`);

  if (!sessionId || !studentId || points === undefined) {
    return res.status(400).json({ message: '세션 ID, 학생 ID, 점수는 필수 항목입니다.' });
  }
  const parsedPoints = parseInt(points);
  if (isNaN(parsedPoints)) {
      return res.status(400).json({ message: '점수는 숫자여야 합니다.' });
  }

  const t = await db.sequelize.transaction(); // 점수 업데이트와 로그 기록 원자성 확보

  try {
    // 1. 활성 세션인지 확인
    const session = await db.ClassSession.findByPk(sessionId, { transaction: t });
    if (!session || session.status !== 'active') {
      await t.rollback();
      return res.status(400).json({ message: '활성 상태인 수업 세션이 아닙니다.' });
    }

    // 2. 해당 세션에 참여 중인 학생(SessionParticipant) 찾기
    // sessionParticipant.js 모델 FK 이름 'sessionId', 'studentId' 확인
    const participant = await db.SessionParticipant.findOne({
      where: {
        sessionId: sessionId,
        studentId: studentId
      },
      include: [{ model: db.Student, as: 'student', attributes: ['name']}], // 학생 이름 필요 시
      transaction: t
    });

    if (!participant) {
      await t.rollback();
      return res.status(404).json({ message: '해당 학생은 현재 세션의 참여자가 아닙니다.' });
    }

    // 3. SessionParticipant 점수 업데이트
    const currentScore = participant.score || 0;
    const newScore = currentScore + parsedPoints;
    await participant.update({ score: newScore }, { transaction: t });

    // 4. ScoreLog 생성 (SessionParticipant ID 사용)
    // scoreLog.js 모델 FK 이름 'participantId', 필드 'change', 'timestamp' 확인
    const scoreLog = await db.ScoreLog.create({
      participantId: participant.id, // SessionParticipant의 PK 사용
      change: parsedPoints,          // 점수 변화량 기록
      timestamp: new Date()
      // teacher_identifier 필드는 모델에 없으므로 제거
    }, { transaction: t });

    await t.commit(); // 모든 작업 성공 시 커밋

    console.log(`ScoreLog created (ID: ${scoreLog.id}) for participant ${participant.id}. New score: ${newScore}`);

    // 5. WebSocket으로 점수 업데이트 알림
    const io = req.app.get('io');
    if (io && session.urlIdentifier) {
        const studentName = participant.student ? participant.student.name : 'Unknown'; // 학생 이름
        const payload = {
            sessionId: sessionId,
            participantId: participant.id, // SessionParticipant ID
            studentId: studentId,         // Student ID
            studentName: studentName,     // 학생 이름
            change: parsedPoints,         // 점수 변화량
            newScore: newScore,           // 최종 점수
            logId: scoreLog.id,
            timestamp: scoreLog.timestamp
        };
        const sessionRoom = `session-${sessionId}`;
        const feedRoom = `feed-${session.urlIdentifier}`;

        io.to(sessionRoom).emit('scoreUpdate', payload); // 세션 내부용 이벤트 이름 확인
        io.to(feedRoom).emit('scoreUpdate', payload);    // 공개 피드/위젯용 이벤트 이름 확인

        console.log(`Emitted scoreUpdate to rooms ${sessionRoom}, ${feedRoom}`);
    } else {
        console.warn('Socket.io instance not found or session urlIdentifier missing, cannot emit scoreUpdate event.');
    }

    res.status(200).json({
      message: '점수가 업데이트되었습니다.',
      participantId: participant.id,
      studentId: studentId,
      newScore: newScore,
      logId: scoreLog.id
    });

  } catch (error) {
    await t.rollback(); // 오류 시 롤백
    console.error('Error updating score:', error.stack || error);
    res.status(500).json({ message: '점수 업데이트 중 오류가 발생했습니다.' });
  }
};


// --- 히스토리 관련 ---

// 내 수업 히스토리 조회 (페이지네이션)
exports.getMySessionHistory = async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  // const teacherId = req.user.id; // 실제 교사 ID 사용 필요
  const teacherIdentifier = req.ip || 'unknown'; // 임시 식별자
  const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10); // 기수 지정

  console.log(`teacherController: getMySessionHistory triggered for ${teacherIdentifier}, page: ${page}, limit: ${limit}`);

  try {
    // ClassSession 모델과 Student 모델 간의 관계를 통해 참여 학생 정보 포함
    // teacherId 필터링 필요 시 where 조건 추가
    const sessions = await db.ClassSession.findAndCountAll({
      // where: { teacherId: teacherId }, // 교사 ID 필터링 시
      limit: parseInt(limit, 10),
      offset: offset,
      order: [['startTime', 'DESC']], // classSession.js 필드 'startTime' 확인
      include: [{
          model: db.SessionParticipant, // 중간 테이블을 통해 학생 정보 로드
          as: 'sessionParticipants',      // index.js 관계 설정 'as' 확인
          attributes: ['id'],            // 참여자 ID만 필요 시
          include: [{
              model: db.Student,
              as: 'student',           // index.js 관계 설정 'as' 확인
              attributes: ['id', 'name'] // 학생 ID와 이름만
          }]
      }],
      distinct: true // Count 계산 정확성을 위해
    });

    // 결과 데이터 가공 (필요 시)
    const formattedSessions = sessions.rows.map(session => {
        // 참여자 정보에서 학생 정보만 추출하여 배열로 만듦
        const students = session.sessionParticipants
            ? session.sessionParticipants.map(p => p.student).filter(Boolean) // null 제거
            : [];
        students.sort((a, b) => a.name.localeCompare(b.name)); // 이름순 정렬
        // session 객체에서 sessionParticipants 제거하고 students 배열 추가 (선택적)
        const plainSession = session.get({ plain: true });
        delete plainSession.sessionParticipants;
        plainSession.students = students;
        return plainSession;
    });


    res.status(200).json({
      totalItems: sessions.count,
      totalPages: Math.ceil(sessions.count / parseInt(limit, 10)),
      currentPage: parseInt(page, 10),
      sessions: formattedSessions // 가공된 세션 목록
    });
  } catch (error) {
    console.error('Error fetching session history:', error.stack || error);
    res.status(500).json({ message: '수업 히스토리 조회 중 오류가 발생했습니다.' });
  }
};