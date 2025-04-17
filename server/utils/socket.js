const socketIo = require('socket.io');
const { ClassSession, Student, ScoreLog } = require('../models');

module.exports = (server) => {
  const io = socketIo(server, {
    cors: {
      origin: process.env.NODE_ENV === 'production' 
        ? ['https://your-production-domain.com'] 
        : ['http://localhost:3000'],
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  // 네임스페이스: 실시간 점수 피드
  const scoreFeed = io.of('/score-feed');
  scoreFeed.on('connection', (socket) => {
    console.log('사용자가 점수 피드에 연결됨:', socket.id);

    // 특정 세션의 피드 구독
    socket.on('joinSession', (sessionId) => {
      socket.join(`session-${sessionId}`);
      console.log(`소켓 ${socket.id}가 세션 ${sessionId}에 참여함`);
    });

    // 연결 종료
    socket.on('disconnect', () => {
      console.log('사용자가 점수 피드 연결 해제:', socket.id);
    });
  });

  // 네임스페이스: 랭킹 페이지
  const rankingFeed = io.of('/ranking');
  rankingFeed.on('connection', (socket) => {
    console.log('사용자가 랭킹 피드에 연결됨:', socket.id);

    // 연결 종료
    socket.on('disconnect', () => {
      console.log('사용자가 랭킹 피드 연결 해제:', socket.id);
    });
  });

  // 점수 업데이트 이벤트를 보내는 함수
  const emitScoreUpdate = async (scoreLog) => {
    try {
      const student = await Student.findByPk(scoreLog.student_id);
      
      // 해당 세션의 피드에 점수 변동 알림
      scoreFeed.to(`session-${scoreLog.session_id}`).emit('scoreUpdate', {
        studentName: student.name,
        points: scoreLog.points,
        timestamp: scoreLog.timestamp
      });

      // 랭킹 피드에도 변동 알림 (주기적 업데이트용)
      rankingFeed.emit('scoreChanged', {
        studentId: scoreLog.student_id,
        sessionId: scoreLog.session_id
      });
    } catch (error) {
      console.error('점수 업데이트 이벤트 발송 오류:', error);
    }
  };

  return {
    io,
    scoreFeed,
    rankingFeed,
    emitScoreUpdate
  };
};
