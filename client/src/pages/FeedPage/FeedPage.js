import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import JSConfetti from 'js-confetti';
import io from 'socket.io-client';
import './FeedPage.css';
import * as viewerService from '../../services/viewerService';

function FeedPage() {
  const { urlIdentifier } = useParams();
  const [session, setSession] = useState(null);
  const [connected, setConnected] = useState(false);
  const [scoreUpdates, setScoreUpdates] = useState([]);
  const [participantsWithScores, setParticipantsWithScores] = useState([]);
  const [previousTopStudentId, setPreviousTopStudentId] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const socketRef = useRef(null);
  const pingIntervalRef = useRef(null);
  const [highlightedUpdate, setHighlightedUpdate] = useState(null);
  const recentUpdatesRef = useRef(new Set());
  const jsConfettiRef = useRef(null);
  
  // Initialize confetti instance
  useEffect(() => {
    jsConfettiRef.current = new JSConfetti();
    return () => {
      jsConfettiRef.current = null;
    };
  }, []);
  
  // Load session data and establish socket connection
  useEffect(() => {
    console.log("[FeedPage] Mounted with urlIdentifier:", urlIdentifier);
    
    let isMounted = true;
    let socket = null;
    
    // Force cleanup on mount to ensure fresh start
    if (socketRef.current) {
      console.log('[FeedPage] Forcing disconnection of existing socket');
      socketRef.current.removeAllListeners();
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    
    if (pingIntervalRef.current) {
      console.log('[FeedPage] Clearing existing interval');
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
        console.log('[FeedPage] Fetching session data for URL identifier:', urlIdentifier);
        
        // Get initial session data
        const data = await viewerService.getSessionFeed(urlIdentifier);
        console.log('[FeedPage] Session data received:', data);
        
        if (!isMounted) return;
        
        if (!data || !data.session) {
          setError('세션 데이터가 올바르지 않습니다.');
          setLoading(false);
          return;
        }
        
        // Initialize the session state with data from API
        setSession(data.session);
        
        // Initialize score updates with initial data
        const initialLogs = data.scoreLogs || [];
        // Add unique IDs to each log for tracking
        const logsWithIds = initialLogs.map(log => ({
          ...log, 
          id: `initial-${Math.random().toString(36).substr(2, 9)}`
        }));
        setScoreUpdates(logsWithIds);
        
        // Initialize participants with scores for ranking
        setParticipantsWithScores(data.participants || []);
        
        // Set initial top student
        if (data.participants && data.participants.length > 0) {
          // Participants are already sorted by score from the server
          setPreviousTopStudentId(data.participants[0].studentId);
          console.log('[FeedPage] Initial top student ID:', data.participants[0].studentId);
        }
        
        setLoading(false);
        
        // Now that we have the session data, set up the socket
        if (isMounted) {
          setupSocketConnection(data.session.id);
        }
      } catch (err) {
        console.error('[FeedPage] Error fetching session data:', err);
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
    
    // Socket connection setup
    const setupSocketConnection = (sessionId) => {
      if (!isMounted) return;
      
      console.log('[FeedPage] Setting up NEW socket connection with session ID:', sessionId);
      
      // Socket URL - use environment variable or fall back to origin
      const socketUrl = process.env.REACT_APP_SOCKET_URL || window.location.origin;
      console.log('[FeedPage] Connecting to socket at:', socketUrl);
      
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
        console.log('[FeedPage] Socket connected with ID:', socket.id);
        setConnected(true);
        
        // Join the feed room with proper room name format
        const roomName = `feed-${urlIdentifier}`;
        console.log(`[FeedPage] Joining feed room: ${roomName}`);
        socket.emit('joinFeed', urlIdentifier);
        
        // Also try joining with session ID as fallback
        if (sessionId) {
          const sessionRoom = `session-${sessionId}`;
          console.log(`[FeedPage] Also joining session room: ${sessionRoom}`);
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
          console.log('[FeedPage] Sending ping');
          socket.emit('ping');
        }
      }, 30000);
      
      // Setup event handlers
      socket.on('pong', () => console.log('[FeedPage] Received pong'));
      
      socket.on('connect_error', (err) => {
        console.error('[FeedPage] Socket connection error:', err);
        setConnected(false);
      });
      
      socket.on('reconnect_attempt', attempt => {
        console.log(`[FeedPage] Reconnection attempt ${attempt}`);
      });
      
      socket.on('reconnect', () => {
        console.log('[FeedPage] Socket reconnected');
        setConnected(true);
      });
      
      socket.on('disconnect', reason => {
        console.log(`[FeedPage] Socket disconnected: ${reason}`);
        setConnected(false);
      });
      
      socket.on('roomJoined', data => {
        console.log('[FeedPage] ✅ Room joined:', data);
      });
      
      socket.on('roomTest', data => {
        console.log('[FeedPage] ✅ Room test:', data);
      });
      
      // Handle score updates - with deduplication
      socket.on('scoreUpdate', (data) => {
        console.log('[FeedPage] 🔴 SCORE UPDATE:', data);
        
        try {
          // Generate a hash for this update to detect duplicates
          const updateHash = generateUpdateHash(data);
          
          // Check if this is a duplicate update
          if (recentUpdatesRef.current.has(updateHash)) {
            console.log('[FeedPage] ⚠️ Duplicate update detected and ignored:', updateHash);
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
          
          console.log('[FeedPage] New update:', newUpdate);
          
          // Update the scoreUpdates state (for the right side of the UI)
          setScoreUpdates(prev => {
            const newUpdates = [newUpdate, ...prev];
            return newUpdates.slice(0, 20);
          });
          
          // Update the participants scores (for the left side/ranking)
          setParticipantsWithScores(prev => {
            // Create new array with updated score for the affected student
            const updated = prev.map(participant => {
              if (participant.studentId === data.studentId) {
                return {
                  ...participant,
                  currentScore: data.newScore
                };
              }
              return participant;
            });
            
            // Sort by score (descending) and then by name (ascending)
            const sorted = [...updated].sort((a, b) => 
              b.currentScore - a.currentScore || 
              a.studentName.localeCompare(b.studentName)
            );
            
            // Check if the top student has changed
            if (sorted.length > 0) {
              const newTopStudentId = sorted[0].studentId;
              
              // If we had a previous top student and it's different now
              if (previousTopStudentId !== null && 
                  newTopStudentId !== previousTopStudentId) {
                console.log(`[FeedPage] 🎉 TOP STUDENT CHANGED: ${previousTopStudentId} -> ${newTopStudentId}`);
                
                // Trigger confetti effect
                if (jsConfettiRef.current) {
                  jsConfettiRef.current.addConfetti({
                    emojis: ['🏆', '🥇', '🎉', '⭐', '🚀'],
                    emojiSize: 70,
                    confettiNumber: 50,
                  });
                }
                
                // Update the previous top student ID for next comparison
                setPreviousTopStudentId(newTopStudentId);
              }
            }
            
            return sorted;
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
              
              console.log(`[FeedPage] Starting fadeout for update ${updateId}`);
              setScoreUpdates(prev => 
                prev.map(update => 
                  update.id === updateId ? {...update, animationState: 'fading'} : update
                )
              );
              
              // Remove after fadeout animation completes
              setTimeout(() => {
                if (!isMounted) return;
                
                console.log(`[FeedPage] Removing update ${updateId}`);
                setScoreUpdates(prev => prev.filter(update => update.id !== updateId));
              }, 2100); // Animation duration + small buffer
              
            }, 12000); // Show for 12 seconds before fade starts
          }, 2000); // Highlight duration reduced to 2 seconds to match CSS
        } catch (err) {
          console.error('[FeedPage] Error processing update:', err);
        }
      });
      
      socket.on('sessionEnded', () => {
        console.log('[FeedPage] Session ended');
        setError('수업 세션이 종료되었습니다.');
        setSession(prev => prev ? { ...prev, status: '종료됨' } : null);
      });
    };
    
    // Start data fetching
    fetchData();
    
    // Cleanup function
    return () => {
      console.log('[FeedPage] Unmounting - complete cleanup');
      isMounted = false;
      
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
        pingIntervalRef.current = null;
      }
      
      if (socket) {
        console.log('[FeedPage] Disconnecting socket on unmount');
        socket.removeAllListeners();
        socket.disconnect();
      }
      
      if (socketRef.current) {
        console.log('[FeedPage] Disconnecting socketRef on unmount');
        socketRef.current.removeAllListeners();
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      
      // Clear deduplication set on unmount
      recentUpdatesRef.current.clear();
    };
  }, [urlIdentifier, previousTopStudentId]);
  
  // Get time difference in a readable format
  const getTimeAgo = (timestamp) => {
    if (!timestamp) return '방금 전';
    
    const seconds = Math.floor((new Date() - new Date(timestamp)) / 1000);
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
          <span className={`status-indicator ${connected ? 'connected' : 'disconnected'}`}></span>
          {connected ? '실시간 연결됨' : (session?.status === '종료됨' ? '세션 종료됨' : '연결 끊김')}
        </div>
      </header>
      {error && session && <p className="feed-error-inline">{error}</p>}

      <div className="feed-main-content">
        {/* 왼쪽: 학생 총점 표 (랭킹) */}
        <div className="participants-scores-section">
          <h2>실시간 순위</h2>
          {participantsWithScores.length > 0 ? (
            <ol className="participants-list-ranked">
              {participantsWithScores.map((participant, index) => (
                <li 
                  key={participant.studentId} 
                  className={`participant-item-ranked rank-${index + 1} ${
                    participant.studentId === previousTopStudentId ? 'current-top' : ''
                  }`}
                >
                  <span className="rank-badge-feed">{index + 1}</span>
                  <span className="name-ranked">{participant.studentName}</span>
                  <span className="score-ranked">{participant.currentScore}점</span>
                </li>
              ))}
            </ol>
          ) : (
            <div className="no-data-placeholder">참가자 정보가 없습니다.</div>
          )}
        </div>

        {/* 오른쪽: 점수 변동 로그 */}
        <div className="score-updates-log-section">
          <h2>최근 점수 변동</h2>
          <div className="updates-list">
            {scoreUpdates.length > 0 ? (
              scoreUpdates.map((update) => (
                <div 
                  key={update.id} 
                  className={`update-item ${update.points > 0 ? 'positive' : 'negative'} ${
                    update.id === highlightedUpdate ? 'highlighted' : ''
                  } ${update.animationState === 'fading' ? 'fade-out' : ''}`}
                >
                  <div className="update-info">
                    <span className="student-name">{update.studentName}</span>
                    <span className="timestamp">{getTimeAgo(update.timestamp)}</span>
                  </div>
                  <div className="update-score">
                    <span className="change-value">{update.points > 0 ? '+' : ''}{update.points}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="no-updates">
                <p>새로운 점수 업데이트가 여기에 표시됩니다.</p>
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