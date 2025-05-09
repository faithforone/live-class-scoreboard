const socketIo = require('socket.io');
const { ClassSession, Student, ScoreLog } = require('../models');

module.exports = (server) => {
  const io = socketIo(server, {
    cors: {
      // 임시로 모든 출처 허용 (로컬 네트워크 사용을 위함)
      // 실제 프로덕션 환경에서는 이렇게 하면 안됨!
      origin: "*",
      methods: ['GET', 'POST'],
      credentials: true,
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Auth-Token']
    }
  });

  // Main socket connection for all clients
  io.on('connection', (socket) => {
    console.log('New client connected to default namespace:', socket.id);
    
    // Handle ping for keepalive
    socket.on('ping', () => {
      console.log(`Received ping from client: ${socket.id}`);
      socket.emit('pong');
    });
    
    // Handle joinFeed event for feed pages
    socket.on('joinFeed', (urlIdentifier) => {
      if (!urlIdentifier) {
        console.log(`Socket ${socket.id} tried to join feed with invalid urlIdentifier`);
        return;
      }
      
      const roomName = `feed-${urlIdentifier}`;
      socket.join(roomName);
      console.log(`Socket ${socket.id} joined feed room: ${roomName}`);
      
      // Send diagnostic message to confirm room join
      socket.emit('roomJoined', { 
        room: roomName, 
        message: 'Successfully joined feed room' 
      });
      
      // Broadcast to this room to test if events are properly routed
      setTimeout(() => {
        io.to(roomName).emit('roomTest', { 
          message: 'Test message for feed room',
          room: roomName,
          timestamp: new Date().toISOString()
        });
        console.log(`Sent test message to room: ${roomName}`);
      }, 2000);
    });
    
    // Handle join session event
    socket.on('joinSession', (sessionId) => {
      if (!sessionId) {
        console.log(`Socket ${socket.id} tried to join session with invalid sessionId`);
        return;
      }
      
      const roomName = `session-${sessionId}`;
      socket.join(roomName);
      console.log(`Socket ${socket.id} joined session room: ${roomName}`);
      
      // Send diagnostic message to confirm room join
      socket.emit('roomJoined', { 
        room: roomName, 
        message: 'Successfully joined session room' 
      });
    });
    
    socket.on('disconnect', (reason) => {
      console.log(`Client ${socket.id} disconnected. Reason: ${reason}`);
    });
  });

  // 네임스페이스: 실시간 점수 피드
  const scoreFeed = io.of('/score-feed');
  scoreFeed.on('connection', (socket) => {
    console.log('사용자가 점수 피드에 연결됨:', socket.id);

    // Handle joinFeed event for feed pages
    socket.on('joinFeed', (urlIdentifier) => {
      if (!urlIdentifier) {
        console.log(`Socket ${socket.id} tried to join feed with invalid urlIdentifier in /score-feed namespace`);
        return;
      }
      
      const roomName = `feed-${urlIdentifier}`;
      socket.join(roomName);
      console.log(`Socket ${socket.id} joined feed room: ${roomName} in /score-feed namespace`);
      
      // Send diagnostic message to confirm room join
      socket.emit('roomJoined', { 
        room: roomName, 
        message: 'Successfully joined feed room in /score-feed namespace' 
      });
    });

    // 특정 세션의 피드 구독
    socket.on('joinSession', (sessionId) => {
      if (!sessionId) {
        console.log(`Socket ${socket.id} tried to join session with invalid sessionId in /score-feed namespace`);
        return;
      }
      
      const roomName = `session-${sessionId}`;
      socket.join(roomName);
      console.log(`Socket ${socket.id} joined session room: ${roomName} in /score-feed namespace`);
      
      // Send diagnostic message to confirm room join
      socket.emit('roomJoined', { 
        room: roomName, 
        message: 'Successfully joined session room in /score-feed namespace' 
      });
    });

    // 연결 종료
    socket.on('disconnect', (reason) => {
      console.log(`사용자가 점수 피드 연결 해제: ${socket.id}, reason: ${reason}`);
    });
  });

  // 네임스페이스: 랭킹 페이지
  const rankingFeed = io.of('/ranking');
  rankingFeed.on('connection', (socket) => {
    console.log('사용자가 랭킹 피드에 연결됨:', socket.id);

    // 연결 종료
    socket.on('disconnect', (reason) => {
      console.log(`사용자가 랭킹 피드 연결 해제: ${socket.id}, reason: ${reason}`);
    });
  });

  // Export the io object and namespaces for use in controllers
  return {
    io,
    scoreFeed,
    rankingFeed
  };
};
