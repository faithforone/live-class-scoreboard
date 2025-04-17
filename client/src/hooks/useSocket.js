import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

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
    const socketUrl = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';
    const socketOptions = {
      path: '/socket.io',
      transports: ['websocket', 'polling']
    };

    // 네임스페이스가 있는 경우 해당 네임스페이스로 연결
    socketRef.current = io(`${socketUrl}${namespace}`, socketOptions);

    // 연결 이벤트 리스너
    socketRef.current.on('connect', () => {
      console.log(`소켓 연결됨 (${namespace})`);
      setIsConnected(true);

      // 세션 ID가 제공된 경우 해당 세션 구독
      if (sessionId) {
        socketRef.current.emit('joinSession', sessionId);
        console.log(`세션 구독: ${sessionId}`);
      }
    });

    // 연결 해제 이벤트 리스너
    socketRef.current.on('disconnect', () => {
      console.log(`소켓 연결 해제됨 (${namespace})`);
      setIsConnected(false);
    });

    // 점수 업데이트 이벤트 리스너 (점수 피드 네임스페이스용)
    if (namespace === '/score-feed') {
      socketRef.current.on('scoreUpdate', (data) => {
        console.log('점수 업데이트 이벤트 수신:', data);
        setLastMessage(data);
      });
    }

    // 랭킹 변동 이벤트 리스너 (랭킹 네임스페이스용)
    if (namespace === '/ranking') {
      socketRef.current.on('scoreChanged', (data) => {
        console.log('랭킹 변동 이벤트 수신:', data);
        setLastMessage(data);
      });
    }

    // 클린업 함수
    return () => {
      console.log(`소켓 연결 종료 (${namespace})`);
      socketRef.current.disconnect();
    };
  }, [namespace, sessionId]);

  return {
    socket: socketRef.current,
    isConnected,
    lastMessage
  };
};

export default useSocket;
