import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import io from 'socket.io-client';
import './FeedPage.css';
import * as viewerService from '../../services/viewerService';

function FeedPage() {
  const { urlIdentifier } = useParams();
  const [session, setSession] = useState(null);
  const [connected, setConnected] = useState(false);
  const [scoreUpdates, setScoreUpdates] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const socketRef = useRef(null);
  const [highlightedUpdate, setHighlightedUpdate] = useState(null);
  
  // Load session data and establish socket connection
  useEffect(() => {
    console.log("FeedPage mounted with urlIdentifier:", urlIdentifier);
    
    if (!urlIdentifier) {
      setError('피드 식별자가 제공되지 않았습니다.');
      setLoading(false);
      return;
    }
    
    let sessionData = null;
    
    // Fetch initial data
    const fetchData = async () => {
      try {
        console.log('Fetching session data for URL identifier:', urlIdentifier);
        
        // Get initial session data
        const data = await viewerService.getSessionFeed(urlIdentifier);
        console.log('Session data received:', data);
        
        if (!data || !data.session) {
          setError('세션 데이터가 올바르지 않습니다.');
          setLoading(false);
          return;
        }
        
        // Store session data for socket setup
        sessionData = data;
        
        // Initialize the session state with data from API
        setSession(data);
        
        // Initialize score updates with initial data
        const initialLogs = data.scoreLogs || [];
        // Add unique IDs to each log for tracking
        const logsWithIds = initialLogs.map(log => ({
          ...log, 
          id: `initial-${Math.random().toString(36).substr(2, 9)}`
        }));
        setScoreUpdates(logsWithIds);
        setLoading(false);
        
        // Now that we have the session data, set up the socket
        setupSocketConnection(data.session.id);
      } catch (err) {
        console.error('Error fetching session data:', err);
        setError(err.message || '세션 정보를 불러오는데 실패했습니다.');
        setLoading(false);
      }
    };
    
    // Socket connection setup
    const setupSocketConnection = (sessionId) => {
      console.log('Setting up socket connection with session ID:', sessionId);
      
      // Clean up any existing socket
      if (socketRef.current) {
        console.log('Cleaning up existing socket connection');
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      
      // Socket URL - use environment variable or fall back to origin
      const socketUrl = process.env.REACT_APP_SOCKET_URL || window.location.origin;
      console.log('Connecting to socket at:', socketUrl);
      
      // Create new socket connection with explicit options
      const socket = io(socketUrl, {
        reconnectionDelayMax: 10000,
        reconnectionAttempts: 10,
        transports: ['websocket', 'polling']
      });
      
      // Store socket reference
      socketRef.current = socket;
      
      // Set up catch-all event listener for debugging
      socket.onAny((event, ...args) => {
        console.log(`🌐 Socket event: ${event}`, args);
      });
      
      // Socket event listeners
      socket.on('connect', () => {
        console.log('Socket connected successfully with ID:', socket.id);
        setConnected(true);
        
        // Join the feed room with proper room name format
        const roomName = `feed-${urlIdentifier}`;
        console.log(`Joining feed room: ${roomName}`);
        socket.emit('joinFeed', urlIdentifier);
        
        // Also try joining with session ID as fallback
        if (sessionId) {
          const sessionRoom = `session-${sessionId}`;
          console.log(`Also joining session room: ${sessionRoom}`);
          socket.emit('joinSession', sessionId);
        }
      });
      
      socket.on('connect_error', (err) => {
        console.error('Socket connection error:', err);
        setConnected(false);
      });
      
      socket.on('reconnect_attempt', (attempt) => {
        console.log(`Socket reconnection attempt ${attempt}`);
      });
      
      socket.on('reconnect', () => {
        console.log('Socket reconnected successfully');
        setConnected(true);
      });
      
      socket.on('disconnect', (reason) => {
        console.log('Socket disconnected, reason:', reason);
        setConnected(false);
      });
      
      socket.on('scoreUpdate', (data) => {
        console.log('🔴 REAL-TIME UPDATE RECEIVED:', data);
        
        // Create a unique ID for this update
        const updateId = `live-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
        
        // Add the new update to our list with all necessary data
        const newUpdate = { 
          ...data, 
          id: updateId,
          studentName: data.studentName || 'Unknown Student',
          points: data.points || data.change || 0,
          timestamp: data.timestamp || new Date().toISOString(),
          fadeOut: false
        };
        
        // Update state with the new update at the beginning of the array
        setScoreUpdates(prev => {
          const newUpdates = [newUpdate, ...prev];
          // Limit to 20 items
          return newUpdates.slice(0, 20);
        });
        
        // Highlight this update
        setHighlightedUpdate(updateId);
        
        // Remove highlight after animation completes (5 seconds)
        setTimeout(() => {
          console.log(`Removing highlight for update ${updateId}`);
          setHighlightedUpdate(prev => prev === updateId ? null : prev);
        }, 5000);
        
        // Start fadeout after delay (10 seconds)
        setTimeout(() => {
          console.log(`Setting fadeOut=true for update ${updateId}`);
          setScoreUpdates(prev => 
            prev.map(update => 
              update.id === updateId ? {...update, fadeOut: true} : update
            )
          );
          
          // Remove completely after fadeout animation completes (1 more second)
          setTimeout(() => {
            console.log(`Removing update ${updateId} from DOM`);
            setScoreUpdates(prev => prev.filter(update => update.id !== updateId));
          }, 1000);
        }, 10000);
      });
      
      socket.on('sessionEnded', () => {
        console.log('Received sessionEnded event');
        setError('수업 세션이 종료되었습니다.');
      });
    };
    
    // Start the data fetching process
    fetchData();
    
    // Cleanup function
    return () => {
      console.log('FeedPage unmounting - cleaning up socket');
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [urlIdentifier]);
  
  // Get time difference in a readable format
  const getTimeAgo = (timestamp) => {
    if (!timestamp) return '방금 전';
    
    const seconds = Math.floor((new Date() - new Date(timestamp)) / 1000);
    
    if (seconds < 60) return `${seconds}초 전`;
    
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}분 전`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}시간 전`;
    
    const days = Math.floor(hours / 24);
    return `${days}일 전`;
  };
  
  if (loading) {
    return <div className="feed-loading">로딩 중...</div>;
  }
  
  if (error) {
    return (
      <div className="feed-error">
        <div className="error-icon">⚠️</div>
        <h2>오류 발생</h2>
        <p>{error}</p>
        <p className="identifier-info">세션 식별자: {urlIdentifier}</p>
      </div>
    );
  }
  
  if (!session || !session.session) {
    return (
      <div className="feed-not-found">
        <div className="not-found-icon">🔍</div>
        <h2>세션을 찾을 수 없습니다</h2>
        <p>제공된 식별자로 세션을 찾을 수 없습니다: {urlIdentifier}</p>
      </div>
    );
  }
  
  return (
    <div className="feed-container">
      <header className="feed-header">
        <h1>{session.session.title || '수업 현황'}</h1>
        <div className="connection-status">
          <span className={`status-indicator ${connected ? 'connected' : 'disconnected'}`}></span>
          {connected ? '실시간 연결됨' : '연결 끊김'}
        </div>
      </header>
      
      <div className="feed-content">
        <div className="updates-section">
          <h2>실시간 점수 피드</h2>
          <div className="updates-list">
            {scoreUpdates && scoreUpdates.length > 0 ? (
              scoreUpdates.map((log, index) => (
                <div 
                  key={log.id || index} 
                  className={`update-item ${log.points > 0 ? 'positive' : 'negative'} ${
                    log.id === highlightedUpdate ? 'highlighted' : ''
                  } ${log.fadeOut ? 'fade-out' : ''}`}
                >
                  <div className="update-info">
                    <span className="student-name">{log.studentName}</span>
                    <span className="timestamp">{getTimeAgo(log.timestamp)}</span>
                  </div>
                  <div className="update-score">
                    <span className="change-value">{log.points > 0 ? '+' : ''}{log.points}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="no-updates">
                <p>새로운 점수 업데이트가 곧 표시됩니다!</p>
              </div>
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