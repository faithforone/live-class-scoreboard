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
  const pingIntervalRef = useRef(null);
  const [highlightedUpdate, setHighlightedUpdate] = useState(null);
  // Add a ref to track recently processed updates to avoid duplicates
  const recentUpdatesRef = useRef(new Set());
  
  // Load session data and establish socket connection
  useEffect(() => {
    console.log("FeedPage mounted with urlIdentifier:", urlIdentifier);
    
    let isMounted = true;
    let socket = null;
    
    // Force cleanup on mount to ensure fresh start
    if (socketRef.current) {
      console.log('Forcing disconnection of existing socket');
      socketRef.current.removeAllListeners();
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    
    if (pingIntervalRef.current) {
      console.log('Clearing existing interval');
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }
    
    // Clear deduplication set
    recentUpdatesRef.current.clear();
    
    if (!urlIdentifier) {
      setError('피드 식별자가 제공되지 않았습니다.');
      setLoading(false);
      return;
    }
    
    // Fetch initial data
    const fetchData = async () => {
      if (!isMounted) return;
      
      try {
        console.log('Fetching session data for URL identifier:', urlIdentifier);
        
        // Get initial session data
        const data = await viewerService.getSessionFeed(urlIdentifier);
        console.log('Session data received:', data);
        
        if (!isMounted) return;
        
        if (!data || !data.session) {
          setError('세션 데이터가 올바르지 않습니다.');
          setLoading(false);
          return;
        }
        
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
        if (isMounted) {
          setupSocketConnection(data.session.id);
        }
      } catch (err) {
        console.error('Error fetching session data:', err);
        if (isMounted) {
          setError(err.message || '세션 정보를 불러오는데 실패했습니다.');
          setLoading(false);
        }
      }
    };
    
    // Helper function to generate a hash for deduplication
    const generateUpdateHash = (update) => {
      const { studentId, studentName, points, timestamp } = update;
      return `${studentId}-${studentName}-${points}-${timestamp || Date.now()}`;
    };
    
    // Socket connection setup - completely rewritten for reliability
    const setupSocketConnection = (sessionId) => {
      if (!isMounted) return;
      
      console.log('Setting up NEW socket connection with session ID:', sessionId);
      
      // Socket URL - use environment variable or fall back to origin
      const socketUrl = process.env.REACT_APP_SOCKET_URL || window.location.origin;
      console.log('Connecting to socket at:', socketUrl);
      
      // Create new socket connection with explicit options
      socket = io(socketUrl, {
        reconnectionDelayMax: 10000,
        reconnectionAttempts: 10,
        transports: ['websocket', 'polling'],
        forceNew: true,
        autoConnect: true
      });
      
      // Store socket reference
      socketRef.current = socket;
      
      // Setup all event handlers
      socket.on('connect', () => {
        console.log('Socket connected with ID:', socket.id);
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
      
      // Remove all existing event listeners before adding new ones
      socket.removeAllListeners('scoreUpdate');
      socket.removeAllListeners('sessionEnded');
      socket.removeAllListeners('roomJoined');
      socket.removeAllListeners('roomTest');
      
      // Setup ping interval
      pingIntervalRef.current = setInterval(() => {
        if (socket && socket.connected) {
          console.log('Sending ping');
          socket.emit('ping');
        }
      }, 30000);
      
      // Setup event handlers
      socket.on('pong', () => console.log('Received pong'));
      
      socket.on('connect_error', (err) => {
        console.error('Socket connection error:', err);
        setConnected(false);
      });
      
      socket.on('reconnect_attempt', attempt => {
        console.log(`Reconnection attempt ${attempt}`);
      });
      
      socket.on('reconnect', () => {
        console.log('Socket reconnected');
        setConnected(true);
      });
      
      socket.on('disconnect', reason => {
        console.log(`Socket disconnected: ${reason}`);
        setConnected(false);
      });
      
      socket.on('roomJoined', data => {
        console.log('✅ Room joined:', data);
      });
      
      socket.on('roomTest', data => {
        console.log('✅ Room test:', data);
      });
      
      // Handle score updates - with deduplication
      socket.on('scoreUpdate', (data) => {
        console.log('🔴 SCORE UPDATE:', data);
        
        try {
          // Generate a hash for this update to detect duplicates
          const updateHash = generateUpdateHash(data);
          
          // Check if this is a duplicate update
          if (recentUpdatesRef.current.has(updateHash)) {
            console.log('⚠️ Duplicate update detected and ignored:', updateHash);
            return;
          }
          
          // Add to recent updates set for deduplication
          recentUpdatesRef.current.add(updateHash);
          
          // Remove from deduplication set after 2 seconds to prevent memory buildup
          setTimeout(() => {
            recentUpdatesRef.current.delete(updateHash);
          }, 2000);
          
          const updateId = `live-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
          
          const newUpdate = { 
            ...data, 
            id: updateId,
            studentName: data.studentName || 'Unknown Student',
            points: data.points || data.change || 0,
            timestamp: data.timestamp || new Date().toISOString(),
            animationState: 'new'
          };
          
          console.log('New update:', newUpdate);
          
          setScoreUpdates(prev => {
            const newUpdates = [newUpdate, ...prev];
            return newUpdates.slice(0, 20);
          });
          
          // Set highlighted state
          setHighlightedUpdate(updateId);
          
          // After highlight period, start fade preparation
          setTimeout(() => {
            if (!isMounted) return;
            setHighlightedUpdate(prev => prev === updateId ? null : prev);
            
            // Start fadeout after delay
            setTimeout(() => {
              if (!isMounted) return;
              
              console.log(`Starting fadeout for update ${updateId}`);
              setScoreUpdates(prev => 
                prev.map(update => 
                  update.id === updateId ? {...update, animationState: 'fading'} : update
                )
              );
              
              // Remove after fadeout animation completes
              setTimeout(() => {
                if (!isMounted) return;
                
                console.log(`Removing update ${updateId}`);
                setScoreUpdates(prev => prev.filter(update => update.id !== updateId));
              }, 2100); // Animation duration + small buffer
              
            }, 12000); // Show for 12 seconds before fade starts
          }, 2000); // Highlight duration reduced to 2 seconds to match CSS
        } catch (err) {
          console.error('Error processing update:', err);
        }
      });
      
      socket.on('sessionEnded', () => {
        console.log('Session ended');
        setError('수업 세션이 종료되었습니다.');
      });
    };
    
    // Start data fetching
    fetchData();
    
    // Cleanup function
    return () => {
      console.log('FeedPage unmounting - complete cleanup');
      isMounted = false;
      
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
        pingIntervalRef.current = null;
      }
      
      if (socket) {
        console.log('Disconnecting socket on unmount');
        socket.removeAllListeners();
        socket.disconnect();
      }
      
      if (socketRef.current) {
        console.log('Disconnecting socketRef on unmount');
        socketRef.current.removeAllListeners();
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      
      // Clear deduplication set on unmount
      recentUpdatesRef.current.clear();
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
                  } ${log.animationState === 'fading' ? 'fade-out' : ''}`}
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