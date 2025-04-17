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

  // Main socket connection for all clients
  io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);
    
    // Handle joinFeed event for feed pages
    socket.on('joinFeed', (urlIdentifier) => {
      if (!urlIdentifier) return;
      
      const roomName = `feed-${urlIdentifier}`;
      socket.join(roomName);
      console.log(`Socket ${socket.id} joined feed room: ${roomName}`);
    });
    
    // Handle join session event
    socket.on('joinSession', (sessionId) => {
      if (!sessionId) return;
      
      const roomName = `session-${sessionId}`;
      socket.join(roomName);
      console.log(`Socket ${socket.id} joined session room: ${roomName}`);
    });
    
    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
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
      
      if (!student) {
        console.error('점수 업데이트 이벤트 발송 오류: 학생을 찾을 수 없음', scoreLog.student_id);
        return;
      }
      
      // Get the session to access urlIdentifier
      const session = await ClassSession.findByPk(scoreLog.session_id);
      
      if (!session) {
        console.error('점수 업데이트 이벤트 발송 오류: 세션을 찾을 수 없음', scoreLog.session_id);
        return;
      }
      
      const payload = {
        studentName: student.name,
        points: scoreLog.points,
        timestamp: scoreLog.timestamp,
        sessionId: scoreLog.session_id,
        studentId: student.id,
        logId: scoreLog.id
      };
      
      // Room identifiers
      const sessionRoom = `session-${scoreLog.session_id}`;
      const feedRoom = `feed-${session.url_identifier}`;
      
      console.log(`Emitting scoreUpdate to rooms: ${sessionRoom}, ${feedRoom}`);
      
      // 해당 세션의 피드에 점수 변동 알림
      io.to(sessionRoom).emit('scoreUpdate', payload);
      io.to(feedRoom).emit('scoreUpdate', payload);
      
      // Also emit to namespace rooms (legacy support)
      scoreFeed.to(`session-${scoreLog.session_id}`).emit('scoreUpdate', payload);

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
