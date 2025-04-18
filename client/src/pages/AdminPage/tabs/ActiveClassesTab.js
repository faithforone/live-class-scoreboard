import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import * as adminService from '../../../services/adminService';

const Container = styled.div`
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  padding: 20px;
`;

const Title = styled.h2`
  color: #333;
  margin-bottom: 20px;
`;

const ClassesList = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
  margin-top: 20px;
`;

const ClassCard = styled.div`
  background-color: #f9f9f9;
  border-radius: 8px;
  padding: 15px;
  border: 1px solid #eee;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
  display: flex;
  flex-direction: column;
`;

const ClassTitle = styled.h3`
  color: #3f51b5;
  margin: 0 0 10px 0;
  font-size: 18px;
`;

const ClassInfo = styled.div`
  margin-bottom: 15px;
  font-size: 14px;
  color: #666;
`;

const InfoRow = styled.div`
  display: flex;
  margin-bottom: 5px;
  
  strong {
    min-width: 120px;
  }
`;

const ParticipantsList = styled.div`
  background-color: #fff;
  border: 1px solid #eee;
  border-radius: 4px;
  padding: 10px;
  margin-bottom: 15px;
  max-height: 150px;
  overflow-y: auto;
`;

const Participant = styled.div`
  padding: 5px;
  border-bottom: 1px solid #f0f0f0;
  font-size: 14px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  
  &:last-child {
    border-bottom: none;
  }
`;

const ScoreControls = styled.div`
  display: flex;
  align-items: center;
  gap: 5px;
`;

const ScoreButton = styled.button`
  background-color: ${props => props.$type === 'minus' ? '#ffebee' : '#e8f5e9'};
  color: ${props => props.$type === 'minus' ? '#d32f2f' : '#388e3c'};
  border: 1px solid ${props => props.$type === 'minus' ? '#ffcdd2' : '#c8e6c9'};
  width: 24px;
  height: 24px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 12px;
  cursor: pointer;
  
  &:hover {
    background-color: ${props => props.$type === 'minus' ? '#ffcdd2' : '#c8e6c9'};
  }
`;

const ScoreInput = styled.input`
  width: 40px;
  text-align: center;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 2px 4px;
`;

const Score = styled.span`
  font-weight: bold;
  color: ${props => props.$value >= 0 ? '#4caf50' : '#f44336'};
`;

const ActionButton = styled.button`
  background-color: ${props => props.$danger ? '#f44336' : '#4caf50'};
  color: white;
  border: none;
  padding: 8px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
  margin-top: auto;
  
  &:hover {
    background-color: ${props => props.$danger ? '#d32f2f' : '#388e3c'};
  }
  
  &:disabled {
    background-color: #ccc;
    cursor: not-allowed;
  }
`;

const LoadingMessage = styled.div`
  text-align: center;
  padding: 20px;
  color: #666;
`;

const ErrorMessage = styled.div`
  background-color: #ffebee;
  color: #c62828;
  padding: 10px;
  border-radius: 4px;
  margin-bottom: 20px;
`;

const NoClassesMessage = styled.div`
  text-align: center;
  padding: 40px;
  color: #666;
  font-style: italic;
`;

function ActiveClassesTab() {
  const [activeSessions, setActiveSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [scoreInputs, setScoreInputs] = useState({});
  const [editingScore, setEditingScore] = useState(null);
  
  const fetchActiveSessions = async () => {
    setIsLoading(true);
    try {
      const data = await adminService.getActiveSessions();
      setActiveSessions(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching active sessions:', err);
      console.error('Error details:', err.response?.data || 'No response data');
      console.error('Status code:', err.response?.status);
      setError('현재 수업 목록을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    fetchActiveSessions();
    
    // Set up polling to refresh active sessions every 30 seconds
    const intervalId = setInterval(fetchActiveSessions, 30000);
    
    return () => clearInterval(intervalId);
  }, []);
  
  const handleEndSession = async (sessionId) => {
    if (!window.confirm('정말 이 수업을 종료하시겠습니까?')) {
      return;
    }
    
    try {
      await adminService.forceEndSession(sessionId);
      // Remove ended session from local state to avoid waiting for next refresh
      setActiveSessions(prevSessions => 
        prevSessions.filter(session => session.id !== sessionId)
      );
    } catch (err) {
      setError('수업 종료 중 오류가 발생했습니다.');
      console.error('Error ending session:', err);
    }
  };
  
  const startEditScore = (sessionId, participantId, currentScore) => {
    setEditingScore(`${sessionId}-${participantId}`);
    setScoreInputs({
      ...scoreInputs,
      [`${sessionId}-${participantId}`]: 0 // Initialize with zero for relative score change
    });
  };
  
  const cancelEditScore = () => {
    setEditingScore(null);
  };
  
  const handleScoreInputChange = (sessionId, participantId, value) => {
    const numValue = parseInt(value, 10) || 0;
    setScoreInputs({
      ...scoreInputs,
      [`${sessionId}-${participantId}`]: numValue
    });
  };
  
  const handleQuickScoreChange = (sessionId, participantId, value) => {
    const currentValue = scoreInputs[`${sessionId}-${participantId}`] || 0;
    setScoreInputs({
      ...scoreInputs,
      [`${sessionId}-${participantId}`]: currentValue + value
    });
  };
  
  const saveScoreChange = async (sessionId, studentId, participantId) => {
    try {
      const points = scoreInputs[`${sessionId}-${participantId}`];
      if (points === 0) {
        setEditingScore(null);
        return;
      }
      
      await adminService.updateStudentScore(sessionId, studentId, points);
      
      // Update local state
      setActiveSessions(prevSessions => 
        prevSessions.map(session => {
          if (session.id === parseInt(sessionId)) {
            return {
              ...session,
              sessionParticipants: session.sessionParticipants.map(participant => {
                if (participant.id === parseInt(participantId)) {
                  return {
                    ...participant,
                    score: participant.score + points
                  };
                }
                return participant;
              })
            };
          }
          return session;
        })
      );
      
      setEditingScore(null);
    } catch (err) {
      console.error('Error updating score:', err);
      alert('점수 변경 중 오류가 발생했습니다.');
    }
  };
  
  if (isLoading && activeSessions.length === 0) {
    return <LoadingMessage>현재 수업 목록을 불러오는 중...</LoadingMessage>;
  }
  
  return (
    <Container>
      <Title>현재 진행 중인 수업</Title>
      
      {error && <ErrorMessage>{error}</ErrorMessage>}
      
      {!isLoading && activeSessions.length === 0 ? (
        <NoClassesMessage>현재 진행 중인 수업이 없습니다.</NoClassesMessage>
      ) : (
        <ClassesList>
          {activeSessions.map(session => (
            <ClassCard key={session.id}>
              <ClassTitle>{session.title || '제목 없음'}</ClassTitle>
              
              <ClassInfo>
                <InfoRow>
                  <strong>수업 ID:</strong> {session.id}
                </InfoRow>
                <InfoRow>
                  <strong>URL 식별자:</strong> {session.urlIdentifier}
                </InfoRow>
                <InfoRow>
                  <strong>시작 시간:</strong> {new Date(session.createdAt).toLocaleString()}
                </InfoRow>
                <InfoRow>
                  <strong>진행 시간:</strong> {formatDuration(new Date() - new Date(session.createdAt))}
                </InfoRow>
                <InfoRow>
                  <strong>참가자 수:</strong> {session.sessionParticipants?.length || 0}명
                </InfoRow>
              </ClassInfo>
              
              <h4>참가자 목록</h4>
              <ParticipantsList>
                {session.sessionParticipants && session.sessionParticipants.length > 0 ? (
                  session.sessionParticipants.map(participant => (
                    <Participant key={participant.id}>
                      <span>{participant.student?.name || '알 수 없음'}</span>
                      
                      {editingScore === `${session.id}-${participant.id}` ? (
                        <ScoreControls>
                          <ScoreButton 
                            $type="minus" 
                            onClick={() => handleQuickScoreChange(session.id, participant.id, -1)}
                          >-1</ScoreButton>
                          <ScoreButton 
                            $type="minus" 
                            onClick={() => handleQuickScoreChange(session.id, participant.id, -5)}
                          >-5</ScoreButton>
                          
                          <ScoreInput 
                            type="number" 
                            value={scoreInputs[`${session.id}-${participant.id}`]} 
                            onChange={(e) => handleScoreInputChange(session.id, participant.id, e.target.value)}
                          />
                          
                          <ScoreButton 
                            $type="plus" 
                            onClick={() => handleQuickScoreChange(session.id, participant.id, 5)}
                          >+5</ScoreButton>
                          <ScoreButton 
                            $type="plus" 
                            onClick={() => handleQuickScoreChange(session.id, participant.id, 1)}
                          >+1</ScoreButton>
                          
                          <ScoreButton onClick={() => saveScoreChange(session.id, participant.studentId, participant.id)}>
                            ✓
                          </ScoreButton>
                          <ScoreButton onClick={cancelEditScore}>
                            ✕
                          </ScoreButton>
                        </ScoreControls>
                      ) : (
                        <ScoreControls>
                          <Score $value={participant.score}>
                            {participant.score > 0 ? '+' : ''}{participant.score}
                          </Score>
                          <ScoreButton onClick={() => startEditScore(session.id, participant.id, participant.score)}>
                            ✏️
                          </ScoreButton>
                        </ScoreControls>
                      )}
                    </Participant>
                  ))
                ) : (
                  <Participant>참가자가 없습니다.</Participant>
                )}
              </ParticipantsList>
              
              <ActionButton 
                $danger 
                onClick={() => handleEndSession(session.id)}
              >
                수업 강제 종료
              </ActionButton>
            </ClassCard>
          ))}
        </ClassesList>
      )}
    </Container>
  );
}

// Helper function to format duration
function formatDuration(ms) {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  const remainingMinutes = minutes % 60;
  const remainingSeconds = seconds % 60;
  
  let result = '';
  if (hours > 0) {
    result += `${hours}시간 `;
  }
  if (remainingMinutes > 0 || hours > 0) {
    result += `${remainingMinutes}분 `;
  }
  result += `${remainingSeconds}초`;
  
  return result;
}

export default ActiveClassesTab; 