const { ClassSession, Student, ScoreLog, Group, SystemSetting, sequelize, SessionParticipant } = require('../models');

// 실시간 점수 피드 데이터 조회
exports.getSessionFeed = async (req, res) => {
  try {
    const { urlIdentifier } = req.params;
    
    console.log('피드 요청 URL 식별자:', urlIdentifier);
    
    if (!urlIdentifier) {
      return res.status(400).json({ message: '세션 식별자가 필요합니다.' });
    }
    
    // 디버깅용: 모든 세션의 URL 식별자 조회
    const allSessions = await ClassSession.findAll({
      attributes: ['id', 'url_identifier'],
      limit: 10
    });
    console.log('데이터베이스의 세션 URL 식별자들:', allSessions.map(s => s.url_identifier));
    
    // URL 식별자로 세션 찾기 (url_identifier 필드 사용)
    const session = await ClassSession.findOne({
      where: {
        url_identifier: urlIdentifier
      }
    });
    
    console.log('세션 찾음?', !!session);
    
    if (!session) {
      return res.status(404).json({ message: '세션을 찾을 수 없습니다.' });
    }
    
    // 세션의 참가자 정보 조회
    const participants = await SessionParticipant.findAll({
      where: { session_id: session.id },
      include: [
        {
          model: Student,
          as: 'student',
          attributes: ['id', 'name']
        }
      ]
    });

    // 가져온 참가자 IDs로 로그 쿼리
    const participantIds = participants.map(p => p.id);
    
    // 세션의 점수 로그 조회 (최신 100개)
    const scoreLogs = await ScoreLog.findAll({
      where: { 
        participantId: participantIds 
      },
      include: [
        {
          model: SessionParticipant,
          as: 'participant',
          include: [
            {
              model: Student,
              as: 'student',
              attributes: ['id', 'name']
            }
          ]
        }
      ],
      order: [['timestamp', 'DESC']],
      limit: 100
    });

    console.log(`참가자 수: ${participants.length}, 점수 로그 수: ${scoreLogs.length}`);

    // 응답 형식 변환
    const formattedLogs = scoreLogs.map(log => ({
      timestamp: log.timestamp,
      studentName: log.participant.student.name,
      points: log.change
    }));
    
    // 참가자 정보 변환 - 총점 제외
    const formattedParticipants = participants.map(p => ({
      id: p.id,
      studentId: p.student_id,
      studentName: p.student.name
      // score 필드 제거: 학생 참여율 향상을 위해
    }));
    
    res.status(200).json({
      session: {
        id: session.id,
        title: session.name,
        status: session.status,
        startTime: session.start_time
      },
      participants: formattedParticipants,
      scoreLogs: formattedLogs
    });
  } catch (error) {
    console.error('점수 피드 조회 오류:', error);
    console.error('상세 오류 정보:', {
      message: error.message,
      stack: error.stack,
      urlId: urlIdentifier
    });
    res.status(500).json({ message: '점수 피드를 조회하는 중 오류가 발생했습니다.' });
  }
};

// 위젯 데이터 조회
exports.getSessionWidget = async (req, res) => {
  try {
    const { urlIdentifier } = req.params;
    
    if (!urlIdentifier) {
      return res.status(400).json({ message: '세션 식별자가 필요합니다.' });
    }
    
    // URL 식별자로 세션 찾기
    const session = await ClassSession.findOne({
      where: {
        url_identifier: urlIdentifier
      }
    });
    
    if (!session) {
      return res.status(404).json({ message: '세션을 찾을 수 없습니다.' });
    }
    
    // 세션의 참가자 정보 조회
    const participants = await SessionParticipant.findAll({
      where: { session_id: session.id },
      include: [
        {
          model: Student,
          as: 'student',
          attributes: ['name']
        }
      ]
    });

    // 가져온 참가자 IDs로 로그 쿼리
    const participantIds = participants.map(p => p.id);
    
    // 세션의 점수 로그 조회 (최신 5개)
    const scoreLogs = await ScoreLog.findAll({
      where: { participantId: participantIds },
      include: [
        {
          model: SessionParticipant,
          as: 'participant',
          include: [
            {
              model: Student,
              as: 'student',
              attributes: ['name']
            }
          ]
        }
      ],
      order: [['timestamp', 'DESC']],
      limit: 5
    });
    
    // 응답 형식 변환
    const formattedLogs = scoreLogs.map(log => ({
      timestamp: log.timestamp,
      studentName: log.participant.student.name,
      points: log.change
    }));
    
    res.status(200).json({
      session: {
        id: session.id,
        status: session.status
      },
      scoreLogs: formattedLogs
    });
  } catch (error) {
    console.error('위젯 데이터 조회 오류:', error);
    res.status(500).json({ message: '위젯 데이터를 조회하는 중 오류가 발생했습니다.' });
  }
};

// 랭킹 페이지 데이터 조회
exports.getRankings = async (req, res) => {
  try {
    const { period = 'week', groupId } = req.query;
    
    let startDate, endDate;
    const now = new Date();
    
    // 기간 설정
    switch (period) {
      case 'week':
        // 현재 주의 시작일 (일요일 기준)
        startDate = new Date(now);
        startDate.setDate(now.getDate() - now.getDay());
        startDate.setHours(0, 0, 0, 0);
        endDate = now;
        break;
      case 'month':
        // 현재 월의 시작일
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        startDate.setHours(0, 0, 0, 0);
        endDate = now;
        break;
      case 'term':
        // 학기/단계별 기간은 DB에서 조회
        try {
          const termSettings = await SystemSetting.findOne({
            where: { settingKey: 'ranking_period_term' }
          });
          
          if (termSettings) {
            const { startDate: termStart, endDate: termEnd } = JSON.parse(termSettings.settingValue);
            startDate = new Date(termStart);
            endDate = new Date(termEnd);
          } else {
            // 설정이 없는 경우 기본값으로 30일 전부터 현재까지
            startDate = new Date(now);
            startDate.setDate(now.getDate() - 30);
            startDate.setHours(0, 0, 0, 0);
            endDate = now;
          }
        } catch (error) {
          console.error('학기 기간 설정 파싱 오류:', error);
          startDate = new Date(now);
          startDate.setDate(now.getDate() - 30);
          startDate.setHours(0, 0, 0, 0);
          endDate = now;
        }
        break;
      case 'all':
        // 전체 기간
        startDate = new Date(0); // Unix epoch
        endDate = now;
        break;
      default:
        // 기본값: 주별
        startDate = new Date(now);
        startDate.setDate(now.getDate() - now.getDay());
        startDate.setHours(0, 0, 0, 0);
        endDate = now;
    }
    
    // 학생 필터링 조건 설정
    let studentFilter = {};
    if (groupId) {
      studentFilter.group_id = groupId;
    }
    
    // 랭킹 정보를 통합 쿼리로 가져오기
    const rankings = await sequelize.query(`
      SELECT 
        s.id as student_id,
        s.name as student_name,
        SUM(sl.change) as total_points
      FROM 
        students s
      JOIN 
        session_participants sp ON s.id = sp.student_id
      JOIN 
        score_logs sl ON sp.id = sl.participant_id
      WHERE 
        sl.timestamp BETWEEN :startDate AND :endDate
        ${groupId ? 'AND s.group_id = :groupId' : ''}
      GROUP BY 
        s.id, s.name
      ORDER BY 
        total_points DESC
      LIMIT 
        100
    `, {
      replacements: { 
        startDate,
        endDate,
        ...(groupId && { groupId })
      },
      type: sequelize.QueryTypes.SELECT
    });
    
    res.status(200).json({
      rankings: rankings.map((r, idx) => ({
        rank: idx + 1,
        studentId: r.student_id,
        studentName: r.student_name,
        totalPoints: parseInt(r.total_points) || 0
      })),
      period
    });
  } catch (error) {
    console.error('랭킹 데이터 조회 오류:', error);
    res.status(500).json({ message: '랭킹 데이터를 조회하는 중 오류가 발생했습니다.' });
  }
};

// 그룹 목록 조회 (랭킹 필터용)
exports.getGroups = async (req, res) => {
  try {
    const groups = await Group.findAll({
      attributes: ['group_id', 'name'],
      order: [['name', 'ASC']]
    });
    
    res.status(200).json(groups);
  } catch (error) {
    console.error('그룹 목록 조회 오류:', error);
    res.status(500).json({ message: '그룹 목록을 조회하는 중 오류가 발생했습니다.' });
  }
};
