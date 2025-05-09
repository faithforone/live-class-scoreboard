import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import * as teacherService from '../../services/teacherService';
import useSocket from '../../hooks/useSocket'; // Import the socket hook
import './ActiveClass.css'; // We'll create this file next

function ActiveClass() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  
  // Initialize socket connection when session is available
  const { socket, isConnected } = useSocket(
    session?.id ? '/score-feed' : null,
    session?.id
  );
  
  // Fetch session data
  useEffect(() => {
    let isMounted = true;
    const fetchSessionData = async () => {
      try {
        setLoading(true);
        const activeSession = await teacherService.getMyActiveSession();
        
        if (!isMounted) return;
        if (!activeSession || (sessionId && activeSession.id !== parseInt(sessionId))) {
          setError('세션을 찾을 수 없거나 이미 종료되었습니다.');
          setSession(null);
          return;
        }
        
        setSession(activeSession);
        setError(null);
      } catch (err) {
        if (!isMounted) return;
        console.error('Error fetching session:', err);
        
        // Check for specific error types
        if (err.code === 'INSUFFICIENT_ROLE' || err.message?.includes('권한이 없습니다') || err.message?.includes('teacher')) {
          setError('인증 오류: 교사 권한으로 로그인되어 있지 않습니다. 로그아웃 후 다시 로그인해주세요.');
        } else if (err.code === 'TOKEN_EXPIRED') {
          setError('세션이 만료되었습니다. 다시 로그인해주세요.');
        } else if (err.response?.status === 401 || err.response?.status === 403) {
          setError('인증 오류: 로그아웃 후 다시 로그인해주세요.');
        } else {
          setError('세션 데이터를 불러오는 중 오류가 발생했습니다.');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    
    fetchSessionData();
    return () => { isMounted = false; };
  }, [sessionId]);
  
  // Socket event listeners
  useEffect(() => {
    if (socket && isConnected && session?.id) {
      console.log(`ActiveClass: Socket connected for session ${session.id}`);
      
      const handleScoreUpdate = (data) => {
        console.log('ActiveClass: Score update received via socket:', data);
        if (data.sessionId === session.id) {
          setSession(prevSession => {
            if (!prevSession) return null;
            return {
              ...prevSession,
              sessionParticipants: prevSession.sessionParticipants.map(p =>
                p.studentId === data.studentId
                  ? { ...p, score: data.newScore }
                  : p
              )
            };
          });
        }
      };
      
      const handleSessionEnded = (data) => {
        console.log('ActiveClass: sessionEnded event received', data);
        // Either check for matching sessionId in data or just navigate away
        alert('수업이 종료되었습니다.');
        navigate('/teacher/prepare');
      };
      
      socket.on('scoreUpdate', handleScoreUpdate);
      socket.on('sessionEnded', handleSessionEnded);
      
      return () => {
        socket.off('scoreUpdate', handleScoreUpdate);
        socket.off('sessionEnded', handleSessionEnded);
      };
    }
  }, [socket, isConnected, session, navigate]);
  
  // Optimistic update pattern for score changes
  const handleQuickPoints = useCallback(async (studentId, pointsValue) => {
    if (!session || submitting) return;
    
    // Save the original state for rollback if needed
    const originalParticipants = [...session.sessionParticipants];
    
    // Optimistically update the UI immediately
    setSession(prevSession => ({
      ...prevSession,
      sessionParticipants: prevSession.sessionParticipants.map(participant => {
        if (participant.studentId === studentId) {
          return { ...participant, score: participant.score + pointsValue };
        }
        return participant;
      })
    }));
    
    try {
      setSubmitting(true);
      // Make API call (server will emit socket events to all clients)
      await teacherService.updateScore(session.id, studentId, pointsValue);
      // Success - the socket event will confirm the update to all clients
    } catch (err) {
      console.error('Error awarding points:', err);
      alert('점수 부여 중 오류가 발생했습니다: ' + (err.message || '알 수 없는 오류'));
      // Rollback to original state on error
      setSession(prevSession => ({ ...prevSession, sessionParticipants: originalParticipants }));
    } finally {
      setSubmitting(false);
    }
  }, [session, submitting]);
  
  // End the session
  const handleEndSession = async () => {
    if (!session || !window.confirm('정말로 수업을 종료하시겠습니까?')) return;
    
    try {
      setSubmitting(true);
      await teacherService.endClassSession(session.id);
      // We'll let the socket event handle the navigation
    } catch (err) {
      console.error('Error ending session:', err);
      alert('수업 종료 중 오류가 발생했습니다.');
      setSubmitting(false);
    }
  };
  
  // Generate QR code URL for feed page
  const getFeedQRUrl = () => {
    const identifier = session?.url_identifier || session?.urlIdentifier;
    if (!session || !identifier) return '';
    const feedUrl = `${window.location.origin}/feed/${identifier}`;
    return `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(feedUrl)}`;
  };
  
  if (loading) return <div className="loading">로딩 중...</div>;
  if (error) return <div className="error-message">{error}</div>;
  if (!session) return <div className="no-session">활성화된 수업이 없습니다. <button onClick={() => navigate('/teacher/prepare')}>수업 준비로 가기</button></div>;
  
  return (
    <div className="active-class-container">
      <header className="class-header">
        <h1>{session.name || '수업 세션'}</h1>
        <p className="session-info">
          세션 ID: {session.id} | 
          시작 시간: {new Date(session.startTime || session.start_time).toLocaleString()}
          {isConnected ? ' (실시간 연결됨)' : ' (연결 중...)'}
        </p>
      </header>
      
      <div className="class-actions">
        <button 
          className="end-session-btn" 
          onClick={handleEndSession}
          disabled={submitting}
        >
          수업 종료
        </button>
      </div>
      
      <div className="students-container">
        <h2>참여 학생 ({session.sessionParticipants?.length || 0}명)</h2>
        
        <div className="students-grid">
          {session.sessionParticipants?.sort((a, b) => {
            // Sort by student name if available
            if (a.student && b.student) {
              return a.student.name.localeCompare(b.student.name);
            }
            return 0;
          }).map(participant => (
            <div key={participant.id || participant.studentId} className="student-card">
              <div className="student-name">{participant.student?.name || '이름 없음'}</div>
              <div className="student-score">{participant.score}</div>
              <div className="quick-buttons">
                <button 
                  className="quick-btn minus"
                  onClick={() => handleQuickPoints(participant.studentId, -1)}
                  disabled={submitting}
                >-1</button>
                <button 
                  className="quick-btn plus"
                  onClick={() => handleQuickPoints(participant.studentId, 1)}
                  disabled={submitting}
                >+1</button>
                <button 
                  className="quick-btn minus"
                  onClick={() => handleQuickPoints(participant.studentId, -5)}
                  disabled={submitting}
                >-5</button>
                <button 
                  className="quick-btn plus"
                  onClick={() => handleQuickPoints(participant.studentId, 5)}
                  disabled={submitting}
                >+5</button>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="feed-info">
        <h3>피드 URL</h3>
        <div className="feed-access">
          <div className="feed-qr">
            <img src={getFeedQRUrl()} alt="Feed QR Code" />
          </div>
          <div className="feed-url">
            <p>
              수업 현황 피드: <a 
                href={`/feed/${session.urlIdentifier || session.url_identifier}`} 
                target="_blank" 
                rel="noopener noreferrer"
              >
                {`${window.location.host}/feed/${session.urlIdentifier || session.url_identifier}`}
              </a>
            </p>
            <p>다른 기기에서 QR코드를 스캔하거나 위 URL을 방문하여 실시간 점수 현황을 확인하세요.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ActiveClass;