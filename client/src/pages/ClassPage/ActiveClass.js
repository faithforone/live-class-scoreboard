import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import * as teacherService from '../../services/teacherService';
import './ActiveClass.css'; // We'll create this file next

function ActiveClass() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [points, setPoints] = useState({}); // Map of studentId -> points to award
  const [submitting, setSubmitting] = useState(false);
  
  // Fetch session data
  useEffect(() => {
    const fetchSessionData = async () => {
      try {
        setLoading(true);
        const activeSession = await teacherService.getMyActiveSession();
        
        if (!activeSession || (sessionId && activeSession.id !== parseInt(sessionId))) {
          setError('세션을 찾을 수 없거나 이미 종료되었습니다.');
          return;
        }
        
        setSession(activeSession);
        
        // Initialize points map for all students
        const initialPoints = {};
        activeSession.sessionParticipants.forEach(participant => {
          initialPoints[participant.studentId] = 0;
        });
        setPoints(initialPoints);
        
      } catch (err) {
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
        setLoading(false);
      }
    };
    
    fetchSessionData();
  }, [sessionId]);
  
  // Handle point change for a student
  const handlePointChange = (studentId, value) => {
    setPoints(prev => ({
      ...prev,
      [studentId]: parseInt(value) || 0
    }));
  };
  
  // Quick award points to a student
  const handleQuickPoints = async (studentId, pointsValue) => {
    try {
      setSubmitting(true);
      await teacherService.updateScore(session.id, studentId, pointsValue);
      
      // Refresh session data
      const updatedSession = await teacherService.getMyActiveSession();
      setSession(updatedSession);
    } catch (err) {
      console.error('Error awarding points:', err);
      alert('점수 부여 중 오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  };
  
  // Award points to a student
  const handleAwardPoints = async (studentId) => {
    if (!points[studentId]) return;
    
    try {
      setSubmitting(true);
      await teacherService.updateScore(session.id, studentId, points[studentId]);
      
      // Refresh session data
      const updatedSession = await teacherService.getMyActiveSession();
      setSession(updatedSession);
      
      // Reset points for this student
      setPoints(prev => ({
        ...prev,
        [studentId]: 0
      }));
      
    } catch (err) {
      console.error('Error awarding points:', err);
      alert('점수 부여 중 오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  };
  
  // End the session
  const handleEndSession = async () => {
    if (!window.confirm('정말로 수업을 종료하시겠습니까?')) return;
    
    try {
      setSubmitting(true);
      await teacherService.endClassSession(session.id);
      alert('수업이 성공적으로 종료되었습니다.');
      navigate('/teacher/prepare');
    } catch (err) {
      console.error('Error ending session:', err);
      alert('수업 종료 중 오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  };
  
  if (loading) return <div className="loading">로딩 중...</div>;
  if (error) return <div className="error-message">{error}</div>;
  if (!session) return <div className="no-session">활성화된 수업이 없습니다.</div>;
  
  return (
    <div className="active-class-container">
      <header className="class-header">
        <h1>{session.name || '수업 세션'}</h1>
        <p className="session-info">
          세션 ID: {session.id} | 
          시작 시간: {new Date(session.startTime || session.start_time).toLocaleString()}
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
        
        <table className="students-table">
          <thead>
            <tr>
              <th>이름</th>
              <th>현재 점수</th>
              <th>점수 부여</th>
              <th>동작</th>
            </tr>
          </thead>
          <tbody>
            {session.sessionParticipants?.sort((a, b) => {
              // Sort by student name if available
              if (a.student && b.student) {
                return a.student.name.localeCompare(b.student.name);
              }
              return 0;
            }).map(participant => (
              <tr key={participant.id}>
                <td>{participant.student?.name || '이름 없음'}</td>
                <td className="score">{participant.score}</td>
                <td className="points-input">
                  <div className="quick-buttons">
                    <button 
                      className="quick-btn minus"
                      onClick={() => handleQuickPoints(participant.studentId, -5)}
                    >-5</button>
                    <button 
                      className="quick-btn minus"
                      onClick={() => handleQuickPoints(participant.studentId, -3)}
                    >-3</button>
                    <button 
                      className="quick-btn minus"
                      onClick={() => handleQuickPoints(participant.studentId, -1)}
                    >-1</button>
                    <button 
                      className="quick-btn plus"
                      onClick={() => handleQuickPoints(participant.studentId, 1)}
                    >+1</button>
                    <button 
                      className="quick-btn plus"
                      onClick={() => handleQuickPoints(participant.studentId, 3)}
                    >+3</button>
                    <button 
                      className="quick-btn plus"
                      onClick={() => handleQuickPoints(participant.studentId, 5)}
                    >+5</button>
                  </div>
                  <div className="manual-adjust">
                    <button 
                      className="point-btn minus"
                      onClick={() => handlePointChange(participant.studentId, (points[participant.studentId] || 0) - 1)}
                    >-</button>
                    <input
                      type="number"
                      value={points[participant.studentId] || 0}
                      onChange={(e) => handlePointChange(participant.studentId, e.target.value)}
                      min="-100"
                      max="100"
                    />
                    <button 
                      className="point-btn plus"
                      onClick={() => handlePointChange(participant.studentId, (points[participant.studentId] || 0) + 1)}
                    >+</button>
                  </div>
                </td>
                <td>
                  <button
                    className="award-btn"
                    onClick={() => handleAwardPoints(participant.studentId)}
                    disabled={submitting || !points[participant.studentId]}
                  >
                    부여
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="feed-info">
        <h3>피드 URL</h3>
        <p>수업 현황 피드: <a href={`/feed/${session.urlIdentifier || session.url_identifier}`} target="_blank" rel="noopener noreferrer">/feed/{session.urlIdentifier || session.url_identifier}</a></p>
      </div>
    </div>
  );
}

export default ActiveClass;