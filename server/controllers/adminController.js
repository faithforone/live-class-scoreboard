const { Student, Group, ClassSession, ScoreLog, SystemSetting, sequelize, StudentGroup, Template } = require('../models');
const bcrypt = require('bcrypt');

// 학생 목록 조회
exports.getAllStudents = async (req, res) => {
  try {
    const students = await Student.findAll({
      include: [
        {
          model: Group,
          as: 'groups',
          through: { attributes: [] } // Don't include junction table attributes
        }
      ],
      order: [['name', 'ASC']]
    });
    
    res.status(200).json(students);
  } catch (error) {
    console.error('학생 목록 조회 오류:', error);
    res.status(500).json({ message: '학생 목록을 조회하는 중 오류가 발생했습니다.' });
  }
};

// 학생 등록
exports.createStudent = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { name, groupIds } = req.body;
    
    if (!name) {
      return res.status(400).json({ message: '학생 이름은 필수 항목입니다.' });
    }
    
    // Create student
    const newStudent = await Student.create({
      name,
      status: '대기중'
    }, { transaction });
    
    // Associate student with groups if groupIds are provided
    if (groupIds && groupIds.length > 0) {
      // Create associations in the junction table
      const groupAssociations = groupIds.map(groupId => ({
        studentId: newStudent.id,
        groupId
      }));
      
      await StudentGroup.bulkCreate(groupAssociations, { transaction });
    }
    
    await transaction.commit();
    
    // Fetch the student with its groups to return in the response
    const studentWithGroups = await Student.findByPk(newStudent.id, {
      include: [
        {
          model: Group,
          as: 'groups',
          through: { attributes: [] }
        }
      ]
    });
    
    res.status(201).json(studentWithGroups);
  } catch (error) {
    await transaction.rollback();
    console.error('학생 등록 오류:', error);
    res.status(500).json({ message: '학생 등록 중 오류가 발생했습니다.' });
  }
};

// 학생 정보 수정
exports.updateStudent = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { student_id } = req.params;
    const { name, groupIds } = req.body;
    
    const student = await Student.findByPk(student_id);
    
    if (!student) {
      await transaction.rollback();
      return res.status(404).json({ message: '학생을 찾을 수 없습니다.' });
    }
    
    // Update student name if provided
    if (name) {
      await student.update({ name }, { transaction });
    }
    
    // Update group associations if groupIds are provided
    if (groupIds !== undefined) {
      // Remove all current group associations
      await StudentGroup.destroy({
        where: { studentId: student_id },
        transaction
      });
      
      // Create new associations if there are any groups
      if (groupIds && groupIds.length > 0) {
        const groupAssociations = groupIds.map(groupId => ({
          studentId: student_id,
          groupId
        }));
        
        await StudentGroup.bulkCreate(groupAssociations, { transaction });
      }
    }
    
    await transaction.commit();
    
    // Fetch the updated student with its groups
    const updatedStudent = await Student.findByPk(student_id, {
      include: [
        {
          model: Group,
          as: 'groups',
          through: { attributes: [] }
        }
      ]
    });
    
    res.status(200).json(updatedStudent);
  } catch (error) {
    await transaction.rollback();
    console.error('학생 정보 수정 오류:', error);
    res.status(500).json({ message: '학생 정보 수정 중 오류가 발생했습니다.' });
  }
};

// 학생 삭제
exports.deleteStudent = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { student_id } = req.params;
    
    const student = await Student.findByPk(student_id);
    
    if (!student) {
      await transaction.rollback();
      return res.status(404).json({ message: '학생을 찾을 수 없습니다.' });
    }
    
    // 활성 세션에 참여 중인지 확인
    if (student.status === '수업중') {
      await transaction.rollback();
      return res.status(400).json({ message: '현재 수업 중인 학생은 삭제할 수 없습니다.' });
    }
    
    // First delete all associations in the junction table
    await StudentGroup.destroy({
      where: { studentId: student_id },
      transaction
    });
    
    // Then delete the student
    await student.destroy({ transaction });
    
    await transaction.commit();
    
    res.status(200).json({ message: '학생이 삭제되었습니다.' });
  } catch (error) {
    await transaction.rollback();
    console.error('학생 삭제 오류:', error);
    res.status(500).json({ message: '학생 삭제 중 오류가 발생했습니다.' });
  }
};

// 그룹 목록 조회
exports.getAllGroups = async (req, res) => {
  try {
    const groups = await Group.findAll({
      include: [
        {
          model: Student,
          as: 'students',
          through: { attributes: [] }, // Don't include junction table attributes
          attributes: ['id', 'name'] // Only include necessary attributes
        }
      ],
      order: [['name', 'ASC']]
    });
    
    res.status(200).json(groups);
  } catch (error) {
    console.error('그룹 목록 조회 오류:', error);
    res.status(500).json({ message: '그룹 목록을 조회하는 중 오류가 발생했습니다.' });
  }
};

// 그룹 생성
exports.createGroup = async (req, res) => {
  try {
    const { name } = req.body;
    
    if (!name) {
      return res.status(400).json({ message: '그룹 이름은 필수 항목입니다.' });
    }
    
    const newGroup = await Group.create({ name });
    
    // Return the group with empty students array for consistency
    const groupWithStudents = {
      ...newGroup.toJSON(),
      students: []
    };
    
    res.status(201).json(groupWithStudents);
  } catch (error) {
    console.error('그룹 생성 오류:', error);
    res.status(500).json({ message: '그룹 생성 중 오류가 발생했습니다.' });
  }
};

// 그룹 수정
exports.updateGroup = async (req, res) => {
  try {
    const { group_id } = req.params;
    const { name } = req.body;
    
    const group = await Group.findByPk(group_id, {
      include: [
        {
          model: Student,
          as: 'students',
          through: { attributes: [] },
          attributes: ['id', 'name']
        }
      ]
    });
    
    if (!group) {
      return res.status(404).json({ message: '그룹을 찾을 수 없습니다.' });
    }
    
    await group.update({ name });
    
    res.status(200).json(group);
  } catch (error) {
    console.error('그룹 수정 오류:', error);
    res.status(500).json({ message: '그룹 수정 중 오류가 발생했습니다.' });
  }
};

// 그룹 삭제
exports.deleteGroup = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { group_id } = req.params;
    
    const group = await Group.findByPk(group_id);
    
    if (!group) {
      await transaction.rollback();
      return res.status(404).json({ message: '그룹을 찾을 수 없습니다.' });
    }
    
    // 그룹에 속한 학생 수 확인 (junction table)
    const studentCount = await StudentGroup.count({
      where: { groupId: group_id }
    });
    
    if (studentCount > 0) {
      await transaction.rollback();
      return res.status(400).json({ 
        message: '그룹에 속한 학생이 있습니다. 먼저 학생들을 다른 그룹으로 이동하거나 그룹에서 제외하세요.' 
      });
    }
    
    // Delete the group
    await group.destroy({ transaction });
    
    await transaction.commit();
    
    res.status(200).json({ message: '그룹이 삭제되었습니다.' });
  } catch (error) {
    await transaction.rollback();
    console.error('그룹 삭제 오류:', error);
    res.status(500).json({ message: '그룹 삭제 중 오류가 발생했습니다.' });
  }
};

// 비밀번호 관리
exports.updatePassword = async (req, res) => {
  try {
    const { type, password } = req.body;
    
    if (!type || !password) {
      return res.status(400).json({ message: '비밀번호 타입과 값은 필수 항목입니다.' });
    }
    
    if (type !== 'teacher_password' && type !== 'admin_password') {
      return res.status(400).json({ message: '유효하지 않은 비밀번호 타입입니다.' });
    }
    
    // 비밀번호 업데이트 또는 생성
    const [setting, created] = await SystemSetting.findOrCreate({
      where: { setting_key: type },
      defaults: { setting_value: password }
    });
    
    if (!created) {
      await setting.update({ setting_value: password });
    }
    
    res.status(200).json({ message: '비밀번호가 업데이트되었습니다.' });
  } catch (error) {
    console.error('비밀번호 업데이트 오류:', error);
    res.status(500).json({ message: '비밀번호 업데이트 중 오류가 발생했습니다.' });
  }
};

// 그룹에 학생 추가
exports.addStudentToGroup = async (req, res) => {
  try {
    const { group_id } = req.params;
    const { studentId } = req.body;
    
    // Check if group exists
    const group = await Group.findByPk(group_id);
    if (!group) {
      return res.status(404).json({ message: '그룹을 찾을 수 없습니다.' });
    }
    
    // Check if student exists
    const student = await Student.findByPk(studentId);
    if (!student) {
      return res.status(404).json({ message: '학생을 찾을 수 없습니다.' });
    }
    
    // Check if association already exists
    const existingAssociation = await StudentGroup.findOne({
      where: { studentId, groupId: group_id }
    });
    
    if (existingAssociation) {
      return res.status(400).json({ message: '이미 그룹에 속한 학생입니다.' });
    }
    
    // Create association
    await StudentGroup.create({
      studentId,
      groupId: group_id
    });
    
    // Get updated group with students
    const updatedGroup = await Group.findByPk(group_id, {
      include: [
        {
          model: Student,
          as: 'students',
          through: { attributes: [] },
          attributes: ['id', 'name']
        }
      ]
    });
    
    res.status(200).json(updatedGroup);
  } catch (error) {
    console.error('그룹에 학생 추가 오류:', error);
    res.status(500).json({ message: '그룹에 학생을 추가하는 중 오류가 발생했습니다.' });
  }
};

// 그룹에서 학생 제거
exports.removeStudentFromGroup = async (req, res) => {
  try {
    const { group_id, student_id } = req.params;
    
    // Check if association exists
    const association = await StudentGroup.findOne({
      where: {
        groupId: group_id,
        studentId: student_id
      }
    });
    
    if (!association) {
      return res.status(404).json({ message: '그룹에 속한 학생을 찾을 수 없습니다.' });
    }
    
    // Delete association
    await association.destroy();
    
    // Get updated group with students
    const updatedGroup = await Group.findByPk(group_id, {
      include: [
        {
          model: Student,
          as: 'students',
          through: { attributes: [] },
          attributes: ['id', 'name']
        }
      ]
    });
    
    res.status(200).json(updatedGroup);
  } catch (error) {
    console.error('그룹에서 학생 제거 오류:', error);
    res.status(500).json({ message: '그룹에서 학생을 제거하는 중 오류가 발생했습니다.' });
  }
};

// 랭킹 기간 설정
exports.updateRankingPeriod = async (req, res) => {
  try {
    const { periodType, startDate, endDate } = req.body;
    
    if (!periodType || !startDate || !endDate) {
      return res.status(400).json({ message: '기간 타입, 시작일, 종료일은 필수 항목입니다.' });
    }
    
    // 기간 설정 키 생성 (주별, 월별, 단계별 등)
    const settingKey = `ranking_period_${periodType}`;
    
    // 기간 값을 JSON으로 저장
    const settingValue = JSON.stringify({
      startDate,
      endDate
    });
    
    // 설정 업데이트 또는 생성
    const [setting, created] = await SystemSetting.findOrCreate({
      where: { setting_key: settingKey },
      defaults: { setting_value: settingValue }
    });
    
    if (!created) {
      await setting.update({ setting_value: settingValue });
    }
    
    res.status(200).json({ message: '랭킹 기간이 설정되었습니다.' });
  } catch (error) {
    console.error('랭킹 기간 설정 오류:', error);
    res.status(500).json({ message: '랭킹 기간 설정 중 오류가 발생했습니다.' });
  }
};

// 활성화된(진행 중인) 수업 세션 목록 조회
exports.getActiveSessions = async (req, res) => {
  try {
    const activeSessions = await ClassSession.findAll({
      where: {
        status: '진행 중'
      },
      include: [
        {
          model: Student,
          as: 'currentStudents',
          // Excluding join table attributes to avoid column name conflicts
          through: { attributes: [] }
        },
        {
          model: Template,
          as: 'template'
        },
        {
          model: Group,
          as: 'group'
        }
      ],
      order: [['start_time', 'DESC']]  // Fixed column name to use snake_case
    });

    res.status(200).json(activeSessions);
  } catch (error) {
    console.error('활성화된 수업 세션 조회 오류:', error);
    res.status(500).json({ 
      message: '활성화된 수업 세션 목록을 조회하는 중 오류가 발생했습니다.',
      error: error.message 
    });
  }
};

// 수업 세션 강제 종료
exports.forceEndSession = async (req, res) => {
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
    
    res.status(200).json({ message: '수업 세션이 강제 종료되었습니다.' });
  } catch (error) {
    await t.rollback();
    console.error('수업 세션 강제 종료 오류:', error);
    res.status(500).json({ message: '수업 세션 강제 종료 중 오류가 발생했습니다.' });
  }
};

// 종료된 수업 세션 목록 조회
exports.getCompletedSessions = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    
    const completedSessions = await ClassSession.findAndCountAll({
      where: { status: '종료됨' },
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['end_time', 'DESC']]  // Fixed column name to use snake_case
    });
    
    res.status(200).json({
      totalItems: completedSessions.count,
      totalPages: Math.ceil(completedSessions.count / limit),
      currentPage: parseInt(page),
      sessions: completedSessions.rows
    });
  } catch (error) {
    console.error('종료된 수업 세션 조회 오류:', error);
    res.status(500).json({ 
      message: '종료된 수업 세션 목록을 조회하는 중 오류가 발생했습니다.',
      error: error.message 
    });
  }
};

// 특정 세션의 점수 로그 조회
exports.getSessionScoreLogs = async (req, res) => {
  try {
    const { session_id } = req.params;
    
    const scoreLogs = await ScoreLog.findAll({
      where: { session_id: session_id },
      include: [
        {
          model: Student,
          as: 'student',
          attributes: ['id', 'name']
        }
      ],
      order: [['timestamp', 'DESC']]
    });
    
    res.status(200).json(scoreLogs);
  } catch (error) {
    console.error('세션 점수 로그 조회 오류:', error);
    res.status(500).json({ message: '세션 점수 로그를 조회하는 중 오류가 발생했습니다.' });
  }
};

// 학생 점수 초기화
exports.resetScores = async (req, res) => {
  const t = await sequelize.transaction();
  
  try {
    const { type, studentIds, startDate, endDate } = req.body;
    
    if (!type) {
      await t.rollback();
      return res.status(400).json({ message: '초기화 타입은 필수 항목입니다.' });
    }
    
    let whereClause = {};
    
    // 특정 학생들만 초기화
    if (studentIds && studentIds.length > 0) {
      whereClause.student_id = studentIds;
    }
    
    // 특정 기간 초기화
    if (type === 'period' && startDate && endDate) {
      whereClause.timestamp = {
        [sequelize.Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }
    
    // 점수 로그 삭제
    const deletedCount = await ScoreLog.destroy({
      where: whereClause,
      transaction: t
    });
    
    await t.commit();
    
    res.status(200).json({ 
      message: `${deletedCount}개의 점수 기록이 초기화되었습니다.` 
    });
  } catch (error) {
    await t.rollback();
    console.error('점수 초기화 오류:', error);
    res.status(500).json({ message: '점수 초기화 중 오류가 발생했습니다.' });
  }
};

// 시스템 설정 조회
exports.getSystemSettings = async (req, res) => {
  try {
    const settings = await SystemSetting.findAll({
      attributes: ['setting_key', 'setting_value'],
      where: {
        setting_key: {
          [sequelize.Op.notIn]: ['admin_password', 'teacher_password']
        }
      }
    });
    
    const formattedSettings = {};
    
    settings.forEach(setting => {
      // 랭킹 기간 설정은 JSON 파싱
      if (setting.setting_key.startsWith('ranking_period_')) {
        try {
          formattedSettings[setting.setting_key] = JSON.parse(setting.setting_value);
        } catch (e) {
          formattedSettings[setting.setting_key] = setting.setting_value;
        }
      } else {
        formattedSettings[setting.setting_key] = setting.setting_value;
      }
    });
    
    res.status(200).json(formattedSettings);
  } catch (error) {
    console.error('시스템 설정 조회 오류:', error);
    res.status(500).json({ message: '시스템 설정을 조회하는 중 오류가 발생했습니다.' });
  }
};
