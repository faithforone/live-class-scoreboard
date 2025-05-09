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
      reconnectionDelay: 1000
    };

    // 네임스페이스가 있는 경우에만 연결 시도
    if (namespace) {
      console.log(`Attempting to connect to socket at ${socketUrl}${namespace}`);
      
      // 네임스페이스가 있는 경우 해당 네임스페이스로 연결
      socketRef.current = io(`${socketUrl}${namespace}`, socketOptions);

      // 연결 이벤트 리스너
      socketRef.current.on('connect', () => {
        console.log(`소켓 연결됨 (${namespace}), socket ID: ${socketRef.current.id}`);
        setIsConnected(true);

        // 세션 ID가 제공된 경우 해당 세션 구독
        if (sessionId) {
          socketRef.current.emit('joinSession', sessionId);
          console.log(`세션 구독: ${sessionId}`);
        }
      });

      // 연결 해제 이벤트 리스너
      socketRef.current.on('disconnect', (reason) => {
        console.log(`소켓 연결 해제됨 (${namespace}), reason: ${reason}`);
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

      // 연결 오류 처리
      socketRef.current.on('connect_error', (error) => {
        console.error(`Socket connection error (${namespace}):`, error);
      });

      // 클린업 함수
      return () => {
        console.log(`소켓 연결 종료 (${namespace})`);
        if (socketRef.current) {
          socketRef.current.disconnect();
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
