// live-class-scoreboard/client/src/pages/TeacherPage/ClassPreparation.js

// --- 여기부터 복사 ---
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
// teacherService에서 필요한 함수들을 명시적으로 import
// createClassSession 으로 수정, getAvailableStudents 도 사용 가능성 있음
import {
    getAllStudents, // <<< 아직 구현 안 됐거나 오류 가능성 있음!
    getGroups,
    getGroupStudents,
    getMyActiveSession, // 추가: 활성 세션 확인 기능
    createClassSession // <<< 함수 이름 수정됨!
} from '../../services/teacherService';
// import './ClassPreparation.css'; // CSS 파일 사용 시 주석 해제

function ClassPreparation() {
  // --- 상태 변수들 ---
  const [allStudents, setAllStudents] = useState([]);      // 전체 학생 목록 (API 구현 확인 필요)
  const [groups, setGroups] = useState([]);                // 그룹(템플릿) 목록
  const [lobbyStudents, setLobbyStudents] = useState([]);  // 로비에 추가된 학생 목록
  const [searchTerm, setSearchTerm] = useState('');        // 학생 검색어
  const [sessionName, setSessionName] = useState('');      // 새 세션 이름 (추가됨)
  const [loading, setLoading] = useState(true);            // 초기 데이터 로딩 상태
  const [error, setError] = useState(null);                // 오류 메시지
  const [startSessionLoading, setStartSessionLoading] = useState(false); // 세션 시작 로딩 상태
  const navigate = useNavigate();

  // --- 초기 데이터 로딩 ---
  useEffect(() => {
    let isMounted = true;
    const fetchInitialDataAndCheckActiveSession = async () => {
      if (!isMounted) return;
      try {
        setLoading(true);
        setError(null);

        // 1. 기존 활성 세션 확인
        const activeSession = await getMyActiveSession();
        
        if (isMounted && activeSession && activeSession.id) {
          // 활성 세션이 있으면 바로 해당 세션으로 이동
          console.log(`기존 활성 세션 (ID: ${activeSession.id}) 발견. 해당 세션으로 이동합니다.`);
          navigate(`/teacher/class/${activeSession.id}`);
          // 여기서 로딩을 멈추거나, navigate 후 컴포넌트가 언마운트되므로 추가 로직 불필요할 수 있음
          // 다만, 만약을 위해 로딩 상태를 false로 설정
          setLoading(false); 
          return; // 추가 데이터 로드 중단
        }
        
        // 2. 활성 세션이 없으면, 학생 및 그룹 목록 로드 (기존 로직)
        if (isMounted) { // navigate가 발생하지 않았을 경우에만 실행
          const [fetchedStudents, fetchedGroups] = await Promise.all([
            getAllStudents().catch(err => { 
              console.warn("getAllStudents 호출 실패:", err.message);
              setError(prev => prev ? `${prev}\n전체 학생 목록 로딩 실패.` : "전체 학생 목록 로딩 실패.");
              return []; 
            }),
            getGroups().catch(err => {
              console.warn("getGroups 호출 실패:", err.message);
              setError(prev => prev ? `${prev}\n그룹 목록 로딩 실패.` : "그룹 목록 로딩 실패.");
              return [];
            })
          ]);
          if (isMounted) {
            setAllStudents(fetchedStudents || []);
            setGroups(fetchedGroups || []);
          }
        }

      } catch (err) {
        if (isMounted) {
          console.error("초기 데이터 로딩 또는 활성 세션 확인 실패:", err);
          setError("데이터를 불러오는데 실패했습니다: " + (err.message || 'Unknown error'));
          setAllStudents([]);
          setGroups([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchInitialDataAndCheckActiveSession();
    return () => { isMounted = false; };
  }, [navigate]); // navigate를 의존성 배열에 추가

  // --- 콜백 함수들 ---

  // 로비에 학생 추가 (중복 방지)
  const handleAddStudent = useCallback((studentToAdd) => {
    setLobbyStudents(currentLobby => {
      const isAlreadyInLobby = currentLobby.some(s => s.id === studentToAdd.id);
      if (!isAlreadyInLobby) {
        // 이름순 정렬하여 추가
        return [...currentLobby, studentToAdd].sort((a, b) => a.name.localeCompare(b.name));
      }
      alert(`${studentToAdd.name} 학생은 이미 로비에 있습니다.`); // 중복 알림
      return currentLobby;
    });
  }, []);

  // 로비에서 학생 제거
  const handleRemoveStudent = useCallback((studentIdToRemove) => {
    setLobbyStudents(currentLobby =>
      currentLobby.filter(s => s.id !== studentIdToRemove)
    );
  }, []);

  // 템플릿(그룹) 학생 불러오기
  const handleLoadTemplate = useCallback(async (groupId) => {
    // 임시 로딩 상태 추가 (템플릿 버튼 개별 로딩 표시용 - 선택적)
    setLoading(true); // 또는 별도 state: setTemplateLoading(groupId)
    setError(null);
    try {
      const templateStudents = await getGroupStudents(groupId);

      if (templateStudents && templateStudents.length > 0) {
        // 로비에 없는 학생들만 골라서 추가 (중복 방지)
        setLobbyStudents(currentLobby => {
          const lobbyStudentIds = new Set(currentLobby.map(s => s.id));
          const studentsToAdd = templateStudents.filter(ts => ts.id && !lobbyStudentIds.has(ts.id));
          // 새로 추가된 학생들과 기존 학생들을 합쳐 이름순 정렬
          return [...currentLobby, ...studentsToAdd].sort((a, b) => a.name.localeCompare(b.name));
        });
      } else {
         console.log(`템플릿 ID ${groupId}에 학생이 없거나 불러오지 못했습니다.`);
         alert('템플릿에 포함된 학생이 없거나 이미 모두 로비에 있습니다.'); // 메시지 개선
      }
    } catch (err) {
      console.error(`템플릿 ${groupId} 로딩 실패:`, err);
      setError("템플릿 정보를 불러오는 중 오류가 발생했습니다: " + (err.message || 'Unknown error'));
    } finally {
        setLoading(false); // 또는 setTemplateLoading(null)
    }
  }, []); // 종속성 배열 비워둠 (함수 재생성 최소화)

  // 검색어 변경 핸들러
  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  // 검색 필터링된 학생 목록 (로비에 없는 학생만)
  // allStudents 상태에 의존
  const filteredStudents = React.useMemo(() => {
      if (!allStudents || allStudents.length === 0) return []; // allStudents 없으면 빈 배열
      const lobbyStudentIds = new Set(lobbyStudents.map(s => s.id));
      return allStudents.filter(student =>
          student.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
          !lobbyStudentIds.has(student.id)
      );
  }, [allStudents, lobbyStudents, searchTerm]); // 종속성 명시

  // 수업 시작 핸들러
  const handleStartClass = async () => {
    if (lobbyStudents.length === 0) {
      alert('수업을 시작하려면 학생을 1명 이상 추가해야 합니다.');
      return;
    }

    setStartSessionLoading(true);
    setError(null);

    try {
      const studentIds = lobbyStudents.map(s => s.id);
      // 서비스 함수 createClassSession 호출 (studentIds와 sessionName 전달)
      const responseData = await createClassSession(studentIds, sessionName); // <<< 함수 이름 및 파라미터 수정됨!

      console.log('Session created response:', responseData);

      // 백엔드 응답 구조 확인: responseData = { message: '...', session: { id: ..., ... } }
      // session 객체와 그 안의 id 확인
      if (responseData && responseData.session && responseData.session.id) {
          const sessionId = responseData.session.id;
          // 네비게이션 경로 확인 필요 (App.js 라우팅 설정 기준)
          // 경로를 '/teacher/class/:sessionId'로 수정
          navigate(`/teacher/class/${sessionId}`);
      } else {
          // 응답은 성공했으나 예상한 데이터 구조가 아닐 경우
          console.error('Could not find session ID in response:', responseData);
          setError('수업은 생성되었으나 응답 데이터 형식이 예상과 다릅니다. 콘솔을 확인하세요.');
          setStartSessionLoading(false); // 로딩 상태 해제
      }

    } catch (err) {
      // createClassSession 에서 throw된 오류 객체 (서버 응답 포함 가능)
      console.error('Failed to start class session:', err);
      // 서버에서 보낸 오류 메시지 우선 사용
      const message = err?.message || '수업 시작 중 알 수 없는 오류가 발생했습니다.';
      setError(message);

      // 서버가 busy 학생 정보를 보냈는지 확인 (err.students 확인)
      if (err?.students && Array.isArray(err.students)) {
         const busyStudentNames = err.students.map(s => s.name).join(', ');
         // alert 보다 에러 메시지 영역에 표시하는 것이 좋을 수 있음
         alert(`수업 시작 실패. 다음 학생들은 이미 다른 수업에 참여 중이거나 수업중 상태입니다: ${busyStudentNames}`);
      }
      setStartSessionLoading(false); // 오류 시 로딩 상태 해제
    }
    // 성공적으로 navigate 되면 로딩 상태 해제 불필요
  };
  // ------------------------------------

  // --- JSX 렌더링 ---
  // 초기 로딩 중이거나, 활성 세션으로 navigate 되기 전까지 로딩 메시지 표시
  if (loading) { 
    return <div style={styles.container}><p>수업 정보 확인 중...</p></div>;
  }

  // 로딩 완료 후 내용 표시 (오류 메시지는 항상 표시될 수 있도록 함)
  return (
    <div style={styles.container}>
      <h2>수업 준비</h2>

      {/* 오류 메시지 표시 영역 */}
      {error && <p style={styles.errorText}>오류: {error}</p>}

      {/* === 템플릿(그룹) 불러오기 === */}
      {groups.length > 0 && (
        <div style={styles.section}>
          <h3>템플릿 불러오기</h3>
          {groups.map(group => (
            <button
                key={group.id}
                onClick={() => handleLoadTemplate(group.id)}
                style={styles.button}
                disabled={startSessionLoading}
            >
              {group.name} 불러오기
            </button>
          ))}
        </div>
      )}
      {groups.length === 0 && !error && <p>사용 가능한 템플릿(그룹)이 없습니다.</p>}

      {/* === 학생 검색 및 추가 === */}
      <div style={styles.section}>
        <h3>학생 검색 및 추가</h3>
        <input
          type="text"
          placeholder="학생 이름 검색"
          value={searchTerm}
          onChange={handleSearchChange}
          style={styles.input}
          disabled={startSessionLoading || allStudents.length === 0}
        />
        {searchTerm && allStudents.length > 0 && (
          <ul style={styles.list}>
            {filteredStudents.length > 0 ? (
              filteredStudents.map(student => (
                <li key={student.id} style={styles.listItem}>
                  <span>{student.name}</span>
                  <button onClick={() => handleAddStudent(student)} style={styles.addButton} disabled={startSessionLoading}>
                    추가
                  </button>
                </li>
              ))
            ) : (
              <li style={styles.listItem}>검색 결과가 없습니다.</li>
            )}
          </ul>
        )}
        {allStudents.length === 0 && !error && <p style={{fontSize: '0.9em', color: '#6c757d'}}>전체 학생 목록을 불러올 수 없어 검색/추가 기능을 사용할 수 없습니다.</p>}
      </div>

      {/* === 현재 로비 학생 목록 === */}
      <div style={styles.section}>
        <h3>참여 학생 목록 ({lobbyStudents.length}명)</h3>
        {lobbyStudents.length === 0 ? (
          <p>위에서 학생을 추가하거나 템플릿을 불러오세요.</p>
        ) : (
          <ul style={{ listStyle: 'none', paddingLeft: '0' }}>
            {lobbyStudents.map(student => (
              <li key={student.id} style={styles.lobbyItem}>
                <span>{student.name}</span>
                <button
                  onClick={() => handleRemoveStudent(student.id)}
                  style={styles.removeButton}
                  disabled={startSessionLoading}
                >
                  제거
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* === 세션 이름 입력 === */}
       <div style={styles.section}>
           <h3>수업 이름 (선택 사항)</h3>
           <input
               type="text"
               value={sessionName}
               onChange={(e) => setSessionName(e.target.value)}
               placeholder="예: 3월 1주차 수학 보충"
               style={{...styles.input, width: 'calc(100% - 28px)'}}
               disabled={startSessionLoading}
           />
       </div>

      {/* === 수업 시작 버튼 === */}
      <button
        onClick={handleStartClass}
        disabled={lobbyStudents.length === 0 || startSessionLoading}
        style={(lobbyStudents.length === 0 || startSessionLoading) ? styles.disabledButton : styles.startButton}
      >
        {startSessionLoading ? '수업 시작 처리 중...' : `수업 시작 (${lobbyStudents.length}명)`}
      </button>
    </div>
  );
}

const styles = {
    container: { padding: '20px', fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' },
    section: { marginBottom: '25px', paddingBottom: '15px', borderBottom: '1px solid #eee' },
    errorText: { color: '#dc3545', fontWeight: 'bold', marginTop: '10px', marginBottom: '10px', padding: '10px', border: '1px solid #f5c6cb', borderRadius: '4px', background: '#f8d7da' },
    input: { marginRight: '10px', padding: '8px 12px', minWidth: '250px', border: '1px solid #ced4da', borderRadius: '4px', fontSize: '14px' },
    button: { marginRight: '5px', marginBottom: '5px', padding: '8px 12px', cursor: 'pointer', border: '1px solid #adb5bd', borderRadius: '4px', background: '#e9ecef', fontSize: '14px' },
    addButton: { marginLeft: '10px', padding: '3px 8px', cursor: 'pointer', border: '1px solid #198754', borderRadius: '4px', background: '#d1e7dd', color: '#0f5132', fontSize: '12px' },
    removeButton: { marginLeft: '10px', padding: '3px 8px', cursor: 'pointer', border: '1px solid #dc3545', borderRadius: '4px', background: '#f8d7da', color: '#842029', fontSize: '12px' },
    list: { listStyle: 'none', paddingLeft: '0', maxHeight: '200px', overflowY: 'auto', border: '1px solid #dee2e6', marginTop: '10px', borderRadius: '4px' },
    listItem: { padding: '10px 12px', borderBottom: '1px solid #f8f9fa', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '14px' },
    lobbyItem: { padding: '8px 0', borderBottom: '1px dotted #e9ecef', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '14px' },
    startButton: { padding: '12px 25px', fontSize: '16px', cursor: 'pointer', background: '#0d6efd', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold', width: '100%', marginTop: '10px' },
    disabledButton: { padding: '12px 25px', fontSize: '16px', cursor: 'not-allowed', background: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold', opacity: 0.65, width: '100%', marginTop: '10px' }
  };

export default ClassPreparation;
// --- 여기까지 복사 ---