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

  // Socket room management utilities
  const socketRooms = {
    // Track active clients in each room
    roomClients: new Map(),
    
    // Add client to room tracking
    addClient: (room, socketId) => {
      if (!socketRooms.roomClients.has(room)) {
        socketRooms.roomClients.set(room, new Set());
      }
      socketRooms.roomClients.get(room).add(socketId);
      console.log(`[Socket] Room ${room} now has ${socketRooms.roomClients.get(room).size} clients`);
    },
    
    // Remove client from room tracking
    removeClient: (room, socketId) => {
      if (socketRooms.roomClients.has(room)) {
        socketRooms.roomClients.get(room).delete(socketId);
        console.log(`[Socket] Client ${socketId} removed from room ${room}`);
        if (socketRooms.roomClients.get(room).size === 0) {
          socketRooms.roomClients.delete(room);
          console.log(`[Socket] Room ${room} is now empty and removed from tracking`);
        } else {
          console.log(`[Socket] Room ${room} now has ${socketRooms.roomClients.get(room).size} clients`);
        }
      }
    },
    
    // Log active rooms and clients
    logRoomStatus: () => {
      console.log('[Socket] === ACTIVE ROOMS STATUS ===');
      socketRooms.roomClients.forEach((clients, room) => {
        console.log(`[Socket] Room ${room}: ${clients.size} clients`);
      });
      console.log('[Socket] === END ROOM STATUS ===');
    }
  };

  // Main socket connection for all clients
  io.on('connection', (socket) => {
    console.log('[Socket] New client connected to default namespace:', socket.id);
    
    // Handle ping for keepalive
    socket.on('ping', () => {
      socket.emit('pong');
    });
    
    // Handle joinFeed event for feed pages
    socket.on('joinFeed', (urlIdentifier) => {
      if (!urlIdentifier) {
        console.log(`[Socket] Socket ${socket.id} tried to join feed with invalid urlIdentifier`);
        return;
      }
      
      const roomName = `feed-${urlIdentifier}`;
      socket.join(roomName);
      socketRooms.addClient(roomName, socket.id);
      console.log(`[Socket] Socket ${socket.id} joined feed room: ${roomName}`);
      
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
        console.log(`[Socket] Sent test message to room: ${roomName}`);
      }, 2000);
    });
    
    // Handle join session event
    socket.on('joinSession', (sessionId) => {
      if (!sessionId) {
        console.log(`[Socket] Socket ${socket.id} tried to join session with invalid sessionId`);
        return;
      }
      
      const roomName = `session-${sessionId}`;
      socket.join(roomName);
      socketRooms.addClient(roomName, socket.id);
      console.log(`[Socket] Socket ${socket.id} joined session room: ${roomName}`);
      
      // Send diagnostic message to confirm room join
      socket.emit('roomJoined', { 
        room: roomName, 
        message: 'Successfully joined session room' 
      });
      
      // Log active rooms periodically
      socketRooms.logRoomStatus();
    });
    
    socket.on('disconnect', (reason) => {
      console.log(`[Socket] Client ${socket.id} disconnected. Reason: ${reason}`);
      
      // Remove client from all tracked rooms
      socketRooms.roomClients.forEach((clients, room) => {
        if (clients.has(socket.id)) {
          socketRooms.removeClient(room, socket.id);
        }
      });
    });
  });

  // 네임스페이스: 실시간 점수 피드
  const scoreFeed = io.of('/score-feed');
  scoreFeed.on('connection', (socket) => {
    console.log('[Socket /score-feed] 사용자가 점수 피드에 연결됨:', socket.id);

    // Handle joinFeed event for feed pages
    socket.on('joinFeed', (urlIdentifier) => {
      if (!urlIdentifier) {
        console.log(`[Socket /score-feed] Socket ${socket.id} tried to join feed with invalid urlIdentifier`);
        return;
      }
      
      const roomName = `feed-${urlIdentifier}`;
      socket.join(roomName);
      socketRooms.addClient(`/score-feed:${roomName}`, socket.id);
      console.log(`[Socket /score-feed] Socket ${socket.id} joined feed room: ${roomName}`);
      
      // Send diagnostic message to confirm room join
      socket.emit('roomJoined', { 
        room: roomName, 
        message: 'Successfully joined feed room in /score-feed namespace' 
      });
    });

    // 특정 세션의 피드 구독
    socket.on('joinSession', (sessionId) => {
      if (!sessionId) {
        console.log(`[Socket /score-feed] Socket ${socket.id} tried to join session with invalid sessionId`);
        return;
      }
      
      const roomName = `session-${sessionId}`;
      socket.join(roomName);
      socketRooms.addClient(`/score-feed:${roomName}`, socket.id);
      console.log(`[Socket /score-feed] Socket ${socket.id} joined session room: ${roomName}`);
      
      // Send diagnostic message to confirm room join
      socket.emit('roomJoined', { 
        room: roomName, 
        message: 'Successfully joined session room in /score-feed namespace' 
      });
      
      // Log active rooms periodically
      socketRooms.logRoomStatus();
    });

    // 연결 종료
    socket.on('disconnect', (reason) => {
      console.log(`[Socket /score-feed] 사용자가 점수 피드 연결 해제: ${socket.id}, reason: ${reason}`);
      
      // Remove from tracked rooms
      socketRooms.roomClients.forEach((clients, room) => {
        if (room.startsWith('/score-feed:') && clients.has(socket.id)) {
          socketRooms.removeClient(room, socket.id);
        }
      });
    });
  });

  // 네임스페이스: 랭킹 페이지
  const rankingFeed = io.of('/ranking');
  rankingFeed.on('connection', (socket) => {
    console.log('[Socket /ranking] 사용자가 랭킹 피드에 연결됨:', socket.id);

    // 연결 종료
    socket.on('disconnect', (reason) => {
      console.log(`[Socket /ranking] 사용자가 랭킹 피드 연결 해제: ${socket.id}, reason: ${reason}`);
      
      // Remove from tracked rooms
      socketRooms.roomClients.forEach((clients, room) => {
        if (room.startsWith('/ranking:') && clients.has(socket.id)) {
          socketRooms.removeClient(room, socket.id);
        }
      });
    });
  });

  // Helper function to check room status and broadcast diagnostics
  const emitRoomStatus = () => {
    socketRooms.logRoomStatus();
    
    // Check each room and broadcast client count to all clients in that room
    socketRooms.roomClients.forEach((clients, room) => {
      if (room.startsWith('/score-feed:')) {
        const actualRoom = room.substring('/score-feed:'.length);
        scoreFeed.to(actualRoom).emit('roomStatus', {
          room: actualRoom,
          clientCount: clients.size,
          timestamp: new Date().toISOString()
        });
      }
    });
  };
  
  // Periodically check and broadcast room status (every 30 seconds)
  setInterval(emitRoomStatus, 30000);

  // Export the io object and namespaces for use in controllers
  return {
    io,
    scoreFeed,
    rankingFeed,
    // Export utility for controllers to use
    broadcastScoreUpdate: (payload, sessionId, urlIdentifier) => {
      try {
        console.log(`[Socket Emit] Broadcasting score update to session-${sessionId} and feed-${urlIdentifier || 'N/A'}`);
        
        // Always log the payload being sent
        console.log('[Socket Emit] Payload:', JSON.stringify(payload));
        
        // Get client counts for debugging
        const sessionRoomKey = `/score-feed:session-${sessionId}`;
        const feedRoomKey = urlIdentifier ? `/score-feed:feed-${urlIdentifier}` : null;
        
        const sessionClients = socketRooms.roomClients.has(sessionRoomKey) 
          ? socketRooms.roomClients.get(sessionRoomKey).size 
          : 0;
          
        const feedClients = feedRoomKey && socketRooms.roomClients.has(feedRoomKey)
          ? socketRooms.roomClients.get(feedRoomKey).size
          : 0;
          
        console.log(`[Socket Emit] Client counts - Session room: ${sessionClients}, Feed room: ${feedClients}`);
        
        // Emit to session room
        scoreFeed.to(`session-${sessionId}`).emit('scoreUpdate', payload);
        
        // If URL identifier is present, also emit to feed room
        if (urlIdentifier) {
          scoreFeed.to(`feed-${urlIdentifier}`).emit('scoreUpdate', payload);
        }
        
        return true;
      } catch (error) {
        console.error('[Socket Emit] Error broadcasting score update:', error);
        return false;
      }
    }
  };
};
