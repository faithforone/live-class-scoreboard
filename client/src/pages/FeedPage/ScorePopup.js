import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import io from 'socket.io-client';
import './ScorePopup.css';

function ScorePopup() {
  const { feedId } = useParams();
  const [connected, setConnected] = useState(false);
  const [scoreUpdates, setScoreUpdates] = useState([]);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    if (!feedId) {
      setError('피드 ID가 제공되지 않았습니다.');
      return;
    }
    
    // Socket.io 연결 설정
    const socketUrl = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5001';
    const socket = io(socketUrl);
    
    // 연결 이벤트 리스너
    socket.on('connect', () => {
      console.log('Socket connected');
      setConnected(true);
      
      // 특정 피드룸에 참여
      socket.emit('joinFeed', feedId);
    });
    
    // 연결 오류 리스너
    socket.on('connect_error', (err) => {
      console.error('Socket connection error:', err);
      setError('실시간 서버 연결에 실패했습니다.');
      setConnected(false);
    });
    
    // 점수 업데이트 리스너
    socket.on('scoreUpdate', (data) => {
      console.log('Score update received:', data);
      
      // 새 업데이트를 배열 앞에 추가하고 최대 10개만 유지
      setScoreUpdates(prev => {
        const newUpdates = [data, ...prev];
        if (newUpdates.length > 10) {
          return newUpdates.slice(0, 10);
        }
        return newUpdates;
      });
      
      // 새 업데이트 알림 효과
      const newUpdate = document.getElementById(`update-${data.logId}`);
      if (newUpdate) {
        newUpdate.classList.add('highlight');
        setTimeout(() => {
          newUpdate.classList.remove('highlight');
        }, 3000);
      }
    });
    
    // 세션 종료 리스너
    socket.on('sessionEnded', () => {
      setError('수업 세션이 종료되었습니다.');
    });
    
    // 컴포넌트 언마운트 시 소켓 연결 해제
    return () => {
      console.log('Disconnecting socket');
      socket.disconnect();
    };
  }, [feedId]);
  
  return (
    <div className="score-popup-container">
      <header className="popup-header">
        <h1>실시간 점수 변동</h1>
        <div className="connection-status">
          <span className={`status-indicator ${connected ? 'connected' : 'disconnected'}`}></span>
          {connected ? '연결됨' : '연결 끊김'}
        </div>
      </header>
      
      {error && (
        <div className="error-banner">{error}</div>
      )}
      
      <div className="updates-container">
        {scoreUpdates.length === 0 ? (
          <div className="no-updates">
            점수 변경 사항이 여기에 표시됩니다.
          </div>
        ) : (
          <div className="updates-list">
            {scoreUpdates.map((update) => (
              <div 
                key={update.logId} 
                id={`update-${update.logId}`}
                className={`update-item ${update.change > 0 ? 'positive' : update.change < 0 ? 'negative' : ''}`}
              >
                <div className="update-info">
                  <span className="student-name">{update.studentName}</span>
                  <span className="timestamp">{new Date(update.timestamp).toLocaleTimeString()}</span>
                </div>
                <div className="score-change">
                  <span className="change-value">
                    {update.change > 0 ? '+' : ''}{update.change}
                  </span>
                  <span className="new-score">
                    총점: {update.newScore}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default ScorePopup; 