import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

// 로컬 네트워크에서 접근할 서버의 IP 주소 (임시 설정)
const LOCAL_SERVER_IP = '172.30.1.75'; // 현재 컴퓨터의 로컬 IP 주소

/**
 * 실시간 소켓 통신을 위한 커스텀 훅
 * @param {string} namespace - 소켓 네임스페이스 ('/score-feed' 또는 '/ranking')
 * @param {string} sessionId - (선택사항) 세션 ID (특정 세션 구독 시 필요)
 * @returns {{ socket, isConnected, lastMessage }}
 */
const useSocket = (namespace, sessionId = null) => {
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState(null);

  useEffect(() => {
    // 소켓 연결 설정
    // 로컬 네트워크용 설정 - 직접 IP 주소 사용
    const socketUrl = `http://${LOCAL_SERVER_IP}:5001`;
    const socketOptions = {
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      autoConnect: true,
      forceNew: true // Always create a new connection
    };

    // 기존 연결 해제
    if (socketRef.current) {
      console.log(`[useSocket] Cleaning up previous socket connection (${namespace})`);
      socketRef.current.removeAllListeners();
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    // 네임스페이스가 있는 경우에만 연결 시도
    if (namespace) {
      console.log(`[useSocket] Attempting to connect to socket at ${socketUrl}${namespace}, sessionId: ${sessionId}`);
      
      // 네임스페이스가 있는 경우 해당 네임스페이스로 연결
      const socket = io(`${socketUrl}${namespace}`, socketOptions);
      socketRef.current = socket;

      // 연결 이벤트 리스너
      socket.on('connect', () => {
        console.log(`[useSocket] 소켓 연결됨 (${namespace}), socket ID: ${socket.id}`);
        setIsConnected(true);

        // 세션 ID가 제공된 경우 해당 세션 구독
        if (sessionId) {
          const parsedId = typeof sessionId === 'string' ? parseInt(sessionId, 10) : sessionId;
          socket.emit('joinSession', parsedId);
          console.log(`[useSocket] 세션 구독: ${parsedId}, socket ID: ${socket.id}`);
        }
      });

      // 연결 해제 이벤트 리스너
      socket.on('disconnect', (reason) => {
        console.log(`[useSocket] 소켓 연결 해제됨 (${namespace}), reason: ${reason}`);
        setIsConnected(false);
      });

      // 서버에서 룸 참여 확인 메시지 수신
      socket.on('roomJoined', (data) => {
        console.log(`[useSocket] Room joined confirmation:`, data);
      });

      // 점수 업데이트 이벤트 리스너 (점수 피드 네임스페이스용)
      if (namespace === '/score-feed') {
        socket.on('scoreUpdate', (data) => {
          console.log('[useSocket] 점수 업데이트 이벤트 수신:', data);
          setLastMessage(data);
        });
      }

      // 랭킹 변동 이벤트 리스너 (랭킹 네임스페이스용)
      if (namespace === '/ranking') {
        socket.on('scoreChanged', (data) => {
          console.log('[useSocket] 랭킹 변동 이벤트 수신:', data);
          setLastMessage(data);
        });
      }

      // 연결 오류 처리
      socket.on('connect_error', (error) => {
        console.error(`[useSocket] Socket connection error (${namespace}):`, error);
      });

      socket.on('reconnect_attempt', (attempt) => {
        console.log(`[useSocket] Reconnection attempt ${attempt} (${namespace})`);
      });

      socket.on('reconnect', () => {
        console.log(`[useSocket] Socket reconnected (${namespace})`);
        setIsConnected(true);
        
        // 재연결 시 세션 재구독
        if (sessionId) {
          const parsedId = typeof sessionId === 'string' ? parseInt(sessionId, 10) : sessionId;
          socket.emit('joinSession', parsedId);
          console.log(`[useSocket] 재연결 후 세션 재구독: ${parsedId}`);
        }
      });

      // 클린업 함수
      return () => {
        console.log(`[useSocket] 소켓 연결 종료 (${namespace}), sessionId: ${sessionId}`);
        if (socketRef.current) {
          socketRef.current.disconnect();
          socketRef.current = null;
        }
      };
    }
    
    // namespace가 없는 경우 아무것도 하지 않음
    return () => {};
  }, [namespace, sessionId]);

  return {
    socket: socketRef.current,
    isConnected,
    lastMessage
  };
};

export default useSocket;
