import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import JSConfetti from 'js-confetti';
import io from 'socket.io-client';
import './FeedPage.css';
import * as viewerService from '../../services/viewerService';

const MAX_LOG_ENTRIES = 20; // 최근 점수 변동 목록 최대 개수

function FeedPage() {
  const { urlIdentifier } = useParams();
  const [session, setSession] = useState(null);
  const [participantsWithScores, setParticipantsWithScores] = useState([]);
  const [scoreUpdatesLog, setScoreUpdatesLog] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);

  const jsConfettiRef = useRef(null);
  const socketRef = useRef(null);
  const previousTopStudentIdRef = useRef(null); // 이전 1등 학생 ID를 ref로 관리

  // Confetti 인스턴스 초기화
  useEffect(() => {
    jsConfettiRef.current = new JSConfetti();
  }, []);

  // 순위 계산 및 참가자 데이터 처리 함수
  const processParticipantsData = useCallback((participants) => {
    if (!participants || participants.length === 0) {
      return [];
    }

    // 1. 점수 내림차순, 이름 오름차순 정렬
    const sorted = [...participants].sort((a, b) => {
      if (b.currentScore !== a.currentScore) {
        return b.currentScore - a.currentScore;
      }
      return (a.studentName || "").localeCompare(b.studentName || "");
    });

    // 2. 공동 순위 부여 (예: 1, 2, 2, 4)
    let rank = 1;
    const rankedParticipants = sorted.map((p, index) => {
      if (index > 0 && p.currentScore < sorted[index - 1].currentScore) {
        rank = index + 1;
      }
      return { ...p, rank };
    });

    // 3. 1등 변경 시 Confetti 효과
    if (rankedParticipants.length > 0) {
      const currentTopStudent = rankedParticipants[0];
      // 여러 명이 공동 1등일 수 있으므로, 점수가 같은 모든 1등을 찾음
      const topScorers = rankedParticipants.filter(p => p.rank === 1);

      if (topScorers.length > 0) {
        const currentTopStudentId = topScorers[0].studentId; // 대표 1등 ID (정렬상 첫번째)
        
        // 이전 1등과 현재 1등이 다르고, 이전 1등이 존재했을 경우 Confetti
        if (previousTopStudentIdRef.current !== null && currentTopStudentId !== previousTopStudentIdRef.current) {
          // 공동 1등 중 새로운 사람이 포함되었는지 확인 (더 정확한 조건)
          const previousTopExistsInNewTop = topScorers.some(ts => ts.studentId === previousTopStudentIdRef.current);
          if (!previousTopExistsInNewTop || topScorers.length > 1) { // 이전 1등이 더이상 1등이 아니거나, 새로운 공동 1등이 나타난 경우
            console.log(`[FeedPage] Top student changed! Old: ${previousTopStudentIdRef.current}, New: ${currentTopStudentId}. Firing confetti!`);
            jsConfettiRef.current?.addConfetti({
              emojis: ['🏆', '🥇', '🎉', '⭐', '🚀'],
              emojiSize: 80,
              confettiNumber: 50,
            });
          }
        }
        previousTopStudentIdRef.current = currentTopStudentId; // 새로운 1등 학생 ID 업데이트 (ref 사용)
      } else {
        previousTopStudentIdRef.current = null; // 1등이 없는 경우
      }
    } else {
      previousTopStudentIdRef.current = null;
    }

    return rankedParticipants;
  }, []); // 의존성 배열 비움, ref는 업데이트해도 리렌더링 유발 안함

  // 초기 데이터 로드
  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      if (!isMounted || !urlIdentifier) {
        if (!urlIdentifier && isMounted) setError("피드 식별자가 제공되지 않았습니다.");
        if (isMounted) setLoading(false);
        return;
      }
      try {
        if (isMounted) setLoading(true);
        console.log('[FeedPage] Fetching initial data for urlIdentifier:', urlIdentifier);
        const data = await viewerService.getSessionFeed(urlIdentifier);
        console.log('[FeedPage] Initial data received:', data);

        if (!isMounted) return;

        if (!data || !data.session) {
          setError('세션 데이터를 가져오지 못했습니다.');
          setParticipantsWithScores([]);
        } else {
          setSession({
            id: data.session.id,
            title: data.session.title || '실시간 스코어보드',
            status: data.session.status
          });
          
          const processedParticipants = processParticipantsData(data.participants || []);
          setParticipantsWithScores(processedParticipants);
          
          // 초기 1등 설정 (processParticipantsData 내부에서 ref로 처리됨)

          setScoreUpdatesLog(
            (data.scoreLogs || []).map(log => ({ 
              ...log, 
              id: `initial-${log.studentId}-${log.timestamp}-${Math.random().toString(36).substr(2, 5)}` // 더 고유한 ID
            })).slice(0, MAX_LOG_ENTRIES)
          );
          setError(null);
        }
      } catch (err) {
        if (!isMounted) return;
        console.error('[FeedPage] Error fetching session data:', err);
        setError(err.message || '세션 정보를 불러오는데 실패했습니다.');
        setParticipantsWithScores([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchData();
    return () => { isMounted = false; };
  }, [urlIdentifier, processParticipantsData]);

  // Socket.IO 연결 및 이벤트 처리
  useEffect(() => {
    if (!session?.id || !urlIdentifier) { // 세션 ID나 urlIdentifier 없으면 실행 안함
        if (socketRef.current) { // 기존 소켓이 있다면 정리
            socketRef.current.disconnect();
            socketRef.current = null;
            setIsConnected(false);
        }
      return;
    }

    let isMounted = true;

    // 기존 소켓 연결이 있다면 정리
    if (socketRef.current) {
      socketRef.current.disconnect();
    }

    const socket_server_url = process.env.REACT_APP_SOCKET_URL || (window.location.hostname === 'localhost' ? `http://${window.location.hostname}:5001` : window.location.origin);
    
    // '/score-feed' 네임스페이스에 연결
    socketRef.current = io(`${socket_server_url}/score-feed`, {
      reconnectionAttempts: 5,
      timeout: 10000,
      transports: ['websocket', 'polling'],
      query: { urlIdentifier: urlIdentifier, sessionId: session.id } // 연결 시 쿼리로 정보 전달
    });
    const socket = socketRef.current;

    console.log(`[FeedPage] Attempting to connect to socket NS: /score-feed for session: ${session.id}, urlId: ${urlIdentifier}`);

    socket.on('connect', () => {
      if (!isMounted) return;
      console.log(`[FeedPage] Socket connected to /score-feed. Socket ID: ${socket.id}`);
      setIsConnected(true);
      // 서버에 `joinFeed` 이벤트 emit (urlIdentifier 또는 sessionId 사용)
      // 서버 측 socket.js 에서 이 이벤트를 받아 해당 room에 join 시켜야 함
      socket.emit('joinFeed', urlIdentifier); // 혹은 session.id (서버 로직에 따라)
      console.log(`[FeedPage] Emitted 'joinFeed' with identifier: ${urlIdentifier}`);
    });

    socket.on('disconnect', (reason) => {
      if (!isMounted) return;
      console.log(`[FeedPage] Socket disconnected from /score-feed. Reason: ${reason}`);
      setIsConnected(false);
    });

    socket.on('connect_error', (err) => {
      if (!isMounted) return;
      console.error(`[FeedPage] Socket connection error to /score-feed:`, err.message);
      setIsConnected(false);
    });

    socket.on('scoreUpdate', (data) => {
      if (!isMounted) return;
      console.log('[FeedPage] Score update received via socket:', data);

      // 세션 ID 일치 확인 (중요)
      if (data.payload && data.payload.sessionId === session.id) {
        const updatePayload = data.payload;
        
        // 1. 오른쪽 점수 변동 로그 업데이트
        const newLogEntry = {
          ...updatePayload,
          id: `live-${updatePayload.studentId}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`, // 더 고유한 ID
        };
        setScoreUpdatesLog(prevLogs => [newLogEntry, ...prevLogs].slice(0, MAX_LOG_ENTRIES));

        // 2. 왼쪽 학생 총점 표 업데이트
        setParticipantsWithScores(prevParticipants => {
          const updatedParticipants = prevParticipants.map(p =>
            p.studentId === updatePayload.studentId
              ? { ...p, currentScore: updatePayload.newScore }
              : p
          );
          return processParticipantsData(updatedParticipants); // 정렬 및 순위 재계산, confetti 처리
        });
      } else if (data.sessionId === session.id) { // 페이로드 형식이 다를 경우 대비
        const updatePayload = data;
         // 1. 오른쪽 점수 변동 로그 업데이트
        const newLogEntry = {
          ...updatePayload,
          id: `live-${updatePayload.studentId}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`, // 더 고유한 ID
        };
        setScoreUpdatesLog(prevLogs => [newLogEntry, ...prevLogs].slice(0, MAX_LOG_ENTRIES));

        // 2. 왼쪽 학생 총점 표 업데이트
        setParticipantsWithScores(prevParticipants => {
          const updatedParticipants = prevParticipants.map(p =>
            p.studentId === updatePayload.studentId
              ? { ...p, currentScore: updatePayload.newScore }
              : p
          );
          return processParticipantsData(updatedParticipants); // 정렬 및 순위 재계산, confetti 처리
        });
      } else {
        console.log('[FeedPage] Received scoreUpdate for different session:', data.payload?.sessionId || data.sessionId);
      }
    });
    
    socket.on('sessionEnded', (data) => {
        if (!isMounted) return;
        // 세션 ID 일치 확인
        const endedSessionId = data.payload?.sessionId || data.sessionId;
        if (endedSessionId === session.id) {
            console.log('[FeedPage] Session ended event received for current session.');
            setError('수업 세션이 종료되었습니다.');
            setSession(prev => prev ? { ...prev, status: '종료됨' } : null);
            setIsConnected(false); // 연결 종료됨으로 표시
            if (socketRef.current) { // 소켓 연결도 명시적으로 끊기
                socketRef.current.disconnect();
            }
        } else {
            console.log('[FeedPage] Received sessionEnded for different session:', endedSessionId);
        }
    });

    return () => {
      isMounted = false;
      if (socketRef.current) {
        console.log(`[FeedPage] Cleaning up socket for /score-feed. Disconnecting.`);
        socketRef.current.off('connect');
        socketRef.current.off('disconnect');
        socketRef.current.off('connect_error');
        socketRef.current.off('scoreUpdate');
        socketRef.current.off('sessionEnded');
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      setIsConnected(false);
    };
  }, [session?.id, urlIdentifier, processParticipantsData]); // session.id 와 urlIdentifier 변경 시 소켓 재설정

  const getTimeAgo = (timestamp) => {
    if (!timestamp) return '방금 전';
    const seconds = Math.floor((new Date().getTime() - new Date(timestamp).getTime()) / 1000);
    if (seconds < 2) return '방금 전';
    if (seconds < 60) return `${seconds}초 전`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}분 전`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}시간 전`;
    const days = Math.floor(hours / 24);
    return `${days}일 전`;
  };

  if (loading) return <div className="feed-loading">피드 로딩 중...</div>;
  if (error && !session) return <div className="feed-error">오류: {error}</div>;

  return (
    <div className="feed-container-split">
      <header className="feed-header">
        <h1>{session?.title || '수업 현황'}</h1>
        <div className="connection-status">
          <span className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`}></span>
          {isConnected ? '실시간 연결됨' : (session?.status === '종료됨' ? '세션 종료됨' : '연결 끊김')}
        </div>
      </header>
      {error && session && <p className="feed-error-inline">{error}</p>}

      <div className="feed-main-content">
        <div className="participants-scores-section">
          <h2>실시간 순위</h2>
          {participantsWithScores.length > 0 ? (
            <ol className="participants-list-ranked">
              {participantsWithScores.map((p) => (
                <li key={p.studentId || p.id} className={`participant-item-ranked rank-${p.rank}`}>
                  <span className="rank-badge-feed">{p.rank}</span>
                  <span className="name-ranked">{p.studentName}</span>
                  <span className="score-ranked">{p.currentScore}점</span>
                </li>
              ))}
            </ol>
          ) : (
            <div className="no-data-placeholder">참가자 정보가 없습니다.</div>
          )}
        </div>

        <div className="score-updates-log-section">
          <h2>최근 점수 변동</h2>
          <div className="updates-list">
            {scoreUpdatesLog.length > 0 ? (
              scoreUpdatesLog.map((log) => (
                <div 
                  key={log.id} 
                  className={`update-item ${log.points > 0 ? 'positive' : 'negative'}`}
                >
                  <div className="update-info">
                    <span className="student-name-log">{log.studentName}</span>
                    <span className="timestamp-log">{getTimeAgo(log.timestamp)}</span>
                  </div>
                  <div className="update-score-details">
                    <span className="change-value-log">{log.points > 0 ? '+' : ''}{log.points}</span> 
                    <span className="new-total-log">→ {log.newScore}점</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="no-data-placeholder">새로운 점수 업데이트가 여기에 표시됩니다.</div>
            )}
          </div>
        </div>
      </div>

      <footer className="feed-footer">
        <p>실시간 수업 점수 현황 - 자동 갱신됩니다.</p>
      </footer>
    </div>
  );
}

export default FeedPage;