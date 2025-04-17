const { ClassSession, Student, ScoreLog, Group, SystemSetting, sequelize } = require('../models');

// 실시간 점수 피드 데이터 조회
exports.getSessionFeed = async (req, res) => {
  try {
    const { urlIdentifier } = req.params;
    
    if (!urlIdentifier) {
      return res.status(400).json({ message: '세션 식별자가 필요합니다.' });
    }
    
    // URL 식별자로 세션 찾기
    const session = await ClassSession.findOne({
      where: {
        feed_url: `/feed/${urlIdentifier}`
      }
    });
    
    if (!session) {
      return res.status(404).json({ message: '세션을 찾을 수 없습니다.' });
    }
    
    // 세션의 점수 로그 조회 (최신 100개)
    const scoreLogs = await ScoreLog.findAll({
      where: { session_id: session.session_id },
      include: [
        {
          model: Student,
          as: 'student',
          attributes: ['name']
        }
      ],
      order: [['timestamp', 'DESC']],
      limit: 100
    });
    
    // 응답 형식 변환
    const formattedLogs = scoreLogs.map(log => ({
      timestamp: log.timestamp,
      studentName: log.student.name,
      points: log.points
    }));
    
    res.status(200).json({
      session: {
        id: session.session_id,
        status: session.status,
        startTime: session.start_time
      },
      scoreLogs: formattedLogs
    });
  } catch (error) {
    console.error('점수 피드 조회 오류:', error);
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
        widget_url: `/widget/${urlIdentifier}`
      }
    });
    
    if (!session) {
      return res.status(404).json({ message: '세션을 찾을 수 없습니다.' });
    }
    
    // 세션의 점수 로그 조회 (최신 5개)
    const scoreLogs = await ScoreLog.findAll({
      where: { session_id: session.session_id },
      include: [
        {
          model: Student,
          as: 'student',
          attributes: ['name']
        }
      ],
      order: [['timestamp', 'DESC']],
      limit: 5
    });
    
    // 응답 형식 변환
    const formattedLogs = scoreLogs.map(log => ({
      timestamp: log.timestamp,
      studentName: log.student.name,
      points: log.points
    }));
    
    res.status(200).json({
      session: {
        id: session.session_id,
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
            where: { setting_key: 'ranking_period_term' }
          });
          
          if (termSettings) {
            const { startDate: termStart, endDate: termEnd } = JSON.parse(termSettings.setting_value);
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
    
    // 학생 필터링 조건
    let studentFilter = {};
    if (groupId) {
      studentFilter.group_id = groupId;
    }
    
    // 랭킹 쿼리
    const rankings = await ScoreLog.findAll({
      attributes: [
        'student_id',
        [sequelize.fn('SUM', sequelize.col('points')), 'totalPoints']
      ],
      where: {
        timestamp: {
          [sequelize.Op.between]: [startDate, endDate]
        }
      },
      include: [
        {
          model: Student,
          as: 'student',
          attributes: ['name'],
          where: studentFilter
        }
      ],
      group: ['student_id', 'student.name'],
      order: [[sequelize.literal('totalPoints'), 'DESC']],
      raw: true
    });
    
    // 동점자 등수 처리
    let currentRank = 1;
    let previousPoints = null;
    let sameRankCount = 0;
    
    const processedRankings = rankings.map((item, index) => {
      const totalPoints = parseInt(item.totalPoints);
      
      // 동점자 처리
      if (previousPoints !== null && previousPoints !== totalPoints) {
        currentRank += sameRankCount;
        sameRankCount = 1;
      } else {
        sameRankCount++;
      }
      
      previousPoints = totalPoints;
      
      return {
        rank: currentRank,
        student_id: item.student_id,
        name: item['student.name'],
        totalPoints
      };
    });
    
    res.status(200).json({
      period,
      startDate,
      endDate,
      groupId: groupId || null,
      rankings: processedRankings
    });
  } catch (error) {
    console.error('랭킹 조회 오류:', error);
    res.status(500).json({ message: '랭킹을 조회하는 중 오류가 발생했습니다.' });
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
