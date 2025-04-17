const { Student, Group, ClassSession, ScoreLog, SessionParticipant, sequelize } = require('../models');
const { v4: uuidv4 } = require('uuid');

// 학생 목록 조회
exports.getAllStudents = async (req, res) => {
  try {
    const students = await Student.findAll({
      attributes: ['student_id', 'name', 'status', 'current_session_id'],
      order: [['name', 'ASC']]
    });
    
    res.status(200).json(students);
  } catch (error) {
    console.error('학생 목록 조회 오류:', error);
    res.status(500).json({ message: '학생 목록을 조회하는 중 오류가 발생했습니다.' });
  }
};

// 대기 중인 학생 목록 조회 (로비 구성용)
exports.getAvailableStudents = async (req, res) => {
  try {
    const students = await Student.findAll({
      where: { status: '대기중' },
      attributes: ['student_id', 'name'],
      order: [['name', 'ASC']]
    });
    
    res.status(200).json(students);
  } catch (error) {
    console.error('대기 중인 학생 목록 조회 오류:', error);
    res.status(500).json({ message: '대기 중인 학생 목록을 조회하는 중 오류가 발생했습니다.' });
  }
};

// 새 수업 세션 생성
exports.createClassSession = async (req, res) => {
  const t = await sequelize.transaction();
  
  try {
    const { studentIds } = req.body;
    
    if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
      await t.rollback();
      return res.status(400).json({ message: '최소 한 명 이상의 학생을 선택해야 합니다.' });
    }
    
    // 이미 수업 중인 학생이 있는지 확인
    const busyStudents = await Student.findAll({
      where: {
        student_id: studentIds,
        status: '수업중'
      },
      attributes: ['student_id', 'name'],
      transaction: t
    });
    
    if (busyStudents.length > 0) {
      await t.rollback();
      return res.status(400).json({
        message: '이미 다른 수업에 참여 중인 학생이 있습니다.',
        students: busyStudents
      });
    }
    
    // 고유한 URL 식별자 생성
    const urlIdentifier = uuidv4().slice(0, 8);
    
    // 새 수업 세션 생성
    const newSession = await ClassSession.create({
      status: '활성',
      start_time: new Date(),
      feed_url: `/feed/${urlIdentifier}`,
      widget_url: `/widget/${urlIdentifier}`,
      created_by: req.ip || 'unknown' // IP 또는 기타 식별 정보
    }, { transaction: t });
    
    // 세션 참가자 등록 및 학생 상태 변경
    for (const studentId of studentIds) {
      // 세션 참가자 추가
      await SessionParticipant.create({
        session_id: newSession.session_id,
        student_id: studentId
      }, { transaction: t });
      
      // 학생 상태 변경
      await Student.update(
        {
          status: '수업중',
          current_session_id: newSession.session_id
        },
        {
          where: { student_id: studentId },
          transaction: t
        }
      );
    }
    
    await t.commit();
    
    res.status(201).json({
      session: newSession,
      studentCount: studentIds.length
    });
  } catch (error) {
    await t.rollback();
    console.error('수업 세션 생성 오류:', error);
    res.status(500).json({ message: '수업 세션을 생성하는 중 오류가 발생했습니다.' });
  }
};

// 수업 세션 종료
exports.endClassSession = async (req, res) => {
  const t = await sequelize.transaction();
  
  try {
    const { session_id } = req.params;
    
    const session = await ClassSession.findByPk(session_id, { transaction: t });
    
    if (!session) {
      await t.rollback();
      return res.status(404).json({ message: '수업 세션을 찾을 수 없습니다.' });
    }
    
    if (session.status === '종료됨') {
      await t.rollback();
      return res.status(400).json({ message: '이미 종료된 수업 세션입니다.' });
    }
    
    // 수업 세션 상태 변경
    await session.update(
      { 
        status: '종료됨',
        end_time: new Date()
      },
      { transaction: t }
    );
    
    // 참여 중인 학생들의 상태 변경
    await Student.update(
      { 
        status: '대기중',
        current_session_id: null
      },
      { 
        where: { current_session_id: session_id },
        transaction: t
      }
    );
    
    await t.commit();
    
    res.status(200).json({ message: '수업 세션이 종료되었습니다.' });
  } catch (error) {
    await t.rollback();
    console.error('수업 세션 종료 오류:', error);
    res.status(500).json({ message: '수업 세션 종료 중 오류가 발생했습니다.' });
  }
};

// 현재 진행 중인 내 수업 조회
exports.getMyActiveSession = async (req, res) => {
  try {
    const teacherIdentifier = req.ip || 'unknown';
    
    const activeSession = await ClassSession.findOne({
      where: {
        status: '활성',
        created_by: teacherIdentifier
      },
      include: [
        {
          model: Student,
          as: 'currentStudents',
          attributes: ['student_id', 'name']
        }
      ]
    });
    
    if (!activeSession) {
      return res.status(404).json({ message: '현재 진행 중인 수업이 없습니다.' });
    }
    
    res.status(200).json(activeSession);
  } catch (error) {
    console.error('활성 수업 조회 오류:', error);
    res.status(500).json({ message: '활성 수업을 조회하는 중 오류가 발생했습니다.' });
  }
};

// 점수 부여/차감
exports.updateScore = async (req, res) => {
  try {
    const { session_id, student_id, points } = req.body;
    
    if (!session_id || !student_id || points === undefined) {
      return res.status(400).json({ message: '세션 ID, 학생 ID, 점수는 필수 항목입니다.' });
    }
    
    if (![1, 3, 5, -1, -3, -5].includes(parseInt(points))) {
      return res.status(400).json({ message: '유효하지 않은 점수 값입니다.' });
    }
    
    // 학생이 현재 해당 세션에 참여 중인지 확인
    const student = await Student.findByPk(student_id);
    
    if (!student || student.status !== '수업중' || student.current_session_id !== parseInt(session_id)) {
      return res.status(400).json({ message: '현재 해당 수업에 참여 중이지 않은 학생입니다.' });
    }
    
    // 세션이 활성 상태인지 확인
    const session = await ClassSession.findByPk(session_id);
    
    if (!session || session.status !== '활성') {
      return res.status(400).json({ message: '종료되었거나 존재하지 않는 수업 세션입니다.' });
    }
    
    // 점수 로그 생성
    const scoreLog = await ScoreLog.create({
      session_id,
      student_id,
      points,
      timestamp: new Date(),
      teacher_identifier: req.ip || 'unknown'
    });
    
    // Socket.IO를 통해 실시간 점수 업데이트 이벤트 발송 (utils/socket.js에서 처리)
    if (req.app.get('socketIO')) {
      const io = req.app.get('socketIO');
      io.emit('scoreUpdate', {
        session_id,
        student_id,
        student_name: student.name,
        points,
        timestamp: scoreLog.timestamp
      });
    }
    
    res.status(200).json({
      message: '점수가 업데이트되었습니다.',
      scoreLog
    });
  } catch (error) {
    console.error('점수 업데이트 오류:', error);
    res.status(500).json({ message: '점수 업데이트 중 오류가 발생했습니다.' });
  }
};

// 내 수업 히스토리 조회
exports.getMySessionHistory = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const teacherIdentifier = req.ip || 'unknown';
    const offset = (page - 1) * limit;
    
    const sessions = await ClassSession.findAndCountAll({
      where: { created_by: teacherIdentifier },
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['start_time', 'DESC']],
      include: [
        {
          model: Student,
          as: 'participants',
          through: { attributes: [] },
          attributes: ['student_id', 'name']
        }
      ]
    });
    
    res.status(200).json({
      totalItems: sessions.count,
      totalPages: Math.ceil(sessions.count / limit),
      currentPage: parseInt(page),
      sessions: sessions.rows
    });
  } catch (error) {
    console.error('수업 히스토리 조회 오류:', error);
    res.status(500).json({ message: '수업 히스토리를 조회하는 중 오류가 발생했습니다.' });
  }
};

// 특정 그룹(템플릿)의 학생 목록 가져오기
exports.getGroupStudents = async (req, res) => { // <--- 이렇게 exports. 추가하고 화살표(=>) 사용
  try {
    const groupId = req.params.groupId;
    const group = await Group.findByPk(groupId, {
      include: [{
        model: Student,
        attributes: ['id', 'name', 'studentId'], // studentId 모델 확인 필요 (student_id 일 수도 있음)
        through: { attributes: [] }
      }],
    });

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Sequelize 모델 관계 설정에 따라 group.Students 또는 group.students 일 수 있음
    res.json(group.Students || group.students || []);
  } catch (error) {
    console.error('Error fetching group students:', error);
    res.status(500).json({ message: 'Failed to fetch group students' });
  }
}; // <--- 함수 끝에 세미콜론(;) 추가
// 특정 그룹(템플릿)의 학생 목록 가져오기
// 모든 그룹(템플릿) 목록 가져오기
exports.getGroups = async (req, res) => { // <--- 이렇게 exports. 추가하고 화살표(=>) 사용
  try {
    const groups = await Group.findAll({
      attributes: ['id', 'name'],
      order: [['name', 'ASC']],
    });
    res.json(groups);
  } catch (error) {
    console.error('Error fetching groups:', error);
    res.status(500).json({ message: 'Failed to fetch groups' });
  }
}; // <--- 함수 끝에 세미콜론(;) 추가
