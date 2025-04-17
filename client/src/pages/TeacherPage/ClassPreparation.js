// --- 여기부터 복사 ---
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom'; // 페이지 이동 시 필요 (한 번만 import)
// teacherService에서 필요한 함수들을 명시적으로 import
// getAllStudents는 아직 구현되지 않았으므로, 실행 시 오류가 발생할 수 있습니다.
import { getAllStudents, getGroups, getGroupStudents, startSession } from '../../services/teacherService';
// (필요하다면) 로딩 스피너, 에러 메시지 컴포넌트 등 임포트
// import './ClassPreparation.css'; // 만약 CSS 파일이 있다면 주석 해제

function ClassPreparation() {
  // --- 화면이 기억해야 할 정보들 ---
  const [allStudents, setAllStudents] = useState([]); // 전체 학생 목록
  const [groups, setGroups] = useState([]);           // 그룹(템플릿) 목록
  const [lobbyStudents, setLobbyStudents] = useState([]); // 로비에 추가된 학생 목록
  const [searchTerm, setSearchTerm] = useState('');     // 학생 검색어
  const [loading, setLoading] = useState(true);         // 초기 데이터 로딩 상태
  const [error, setError] = useState(null);             // 오류 메시지
  const [startSessionLoading, setStartSessionLoading] = useState(false); // 세션 시작 로딩 상태
  const navigate = useNavigate(); // 페이지 이동 함수 (한 번만 선언)

  // --- 화면이 처음 나타날 때 실행할 작업 ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        // 학생 목록과 그룹 목록 동시 요청
        // !!! 중요: getAllStudents() 및 해당 API(/api/teacher/students)는 아직 구현되지 않았습니다. !!!
        // !!! 이 부분 실행 시 오류가 발생할 수 있습니다. 다음 단계에서 서버/서비스 구현 필요 !!!
        const [fetchedStudents, fetchedGroups] = await Promise.all([
          getAllStudents(), // <<< 아직 구현 안 됨!
          getGroups()
        ]);
        setAllStudents(fetchedStudents || []);
        setGroups(fetchedGroups || []);
      } catch (err) {
        console.error("초기 데이터 로딩 실패:", err);
        // getAllStudents 관련 오류가 발생할 가능성이 높음
        setError("데이터를 불러오는데 실패했습니다. (오류: " + (err.message || 'Unknown error') + ")");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []); // []는 "화면이 처음 나타날 때 딱 한 번만 실행하세요" 라는 의미

  // --- 버튼 클릭 등으로 실행될 함수들 ---

  // '추가' 버튼: 학생을 로비 목록에 추가 (id 기준 중복 체크)
  const handleAddStudent = useCallback((studentToAdd) => {
    setLobbyStudents(currentLobby => {
      const isAlreadyInLobby = currentLobby.some(s => s.id === studentToAdd.id); // <<< id 로 변경
      if (!isAlreadyInLobby) {
        return [...currentLobby, studentToAdd];
      }
      return currentLobby;
    });
  }, []);

  // '제거' 버튼: 학생을 로비 목록에서 제거 (id 기준)
  const handleRemoveStudent = useCallback((studentIdToRemove) => {
    setLobbyStudents(currentLobby =>
      currentLobby.filter(s => s.id !== studentIdToRemove) // <<< id 로 변경
    );
  }, []);

  // '템플릿 불러오기' 버튼: 해당 그룹의 학생들을 로비에 추가 (id 기준 중복 체크)
  const handleLoadTemplate = useCallback(async (groupId) => {
    try {
      setLoading(true); // 로딩 시작 (템플릿 로딩 시)
      setError(null);
      const templateStudents = await getGroupStudents(groupId); // 이미 존재하는 함수 호출

      if (templateStudents && templateStudents.length > 0) {
        setLobbyStudents(currentLobby => {
          const lobbyStudentIds = new Set(currentLobby.map(s => s.id)); // <<< id 로 변경
          // templateStudents에 id 필드가 있다고 가정
          const studentsToAdd = templateStudents.filter(ts => ts.id && !lobbyStudentIds.has(ts.id)); // <<< id 로 변경
          return [...currentLobby, ...studentsToAdd];
        });
      } else {
         console.log(`템플릿 ID ${groupId}에 학생이 없거나 불러오지 못했습니다.`);
         alert('템플릿에 포함된 학생이 없습니다.');
      }
    } catch (err) {
      console.error(`템플릿 ${groupId} 로딩 실패:`, err);
      setError("템플릿 정보를 불러오는 중 오류가 발생했습니다.");
    } finally {
        setLoading(false); // 로딩 종료 (템플릿 로딩 시)
    }
  }, []);

  // 검색창 내용 변경 핸들러
  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  // 검색 결과 필터링 (id 기준 중복 체크)
  // !!! 중요: 이 기능은 getAllStudents()가 정상 작동해야 의미가 있습니다 !!!
  const filteredStudents = allStudents.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
    !lobbyStudents.some(lobbyStudent => lobbyStudent.id === student.id) // <<< id 로 변경
  );

  // '수업 시작' 버튼 핸들러
  const handleStartClass = async () => {
    if (lobbyStudents.length === 0) {
      alert('수업을 시작하려면 학생을 1명 이상 추가해야 합니다.');
      return;
    }

    setStartSessionLoading(true); // <<< 로딩 상태 시작
    setError(null);

    try {
      const studentIds = lobbyStudents.map(s => s.id); // <<< id 로 변경
      // teacherService의 startSession 함수 호출, studentIds를 객체 안에 담아 전달
      const sessionData = await startSession({ studentIds }); // <<< 함수 이름 및 파라미터 구조 수정

      console.log('Session started:', sessionData);

      // 서버 응답에서 sessionId 가져오기 (sessionData.sessionId라고 가정)
      if (sessionData && sessionData.sessionId) {
          // 네비게이션 경로 수정
          navigate(`/teacher/class/${sessionData.sessionId}`); // <<< 경로 수정
      } else {
          console.error('Could not find sessionId in response:', sessionData);
          setError('수업은 생성되었으나 ID를 찾지 못해 이동할 수 없습니다.');
          setStartSessionLoading(false); // <<< 오류 시 로딩 상태 해제
      }

    } catch (err) {
      console.error('Failed to start class:', err);
      const message = err.response?.data?.message || err.message || '수업 시작 중 오류가 발생했습니다.';
      setError(message);

      if (err.response?.data?.students) { // 서버에서 busy 학생 정보를 보내준 경우
         const busyStudentNames = err.response.data.students.map(s => s.name).join(', ');
         alert(`다음 학생들은 이미 다른 수업에 참여 중입니다: ${busyStudentNames}`);
      }
      setStartSessionLoading(false); // <<< 오류 시 로딩 상태 해제
    }
    // 성공 시 페이지 이동하므로 로딩 상태 해제 불필요
  };
  // ------------------------------------

  // --- 화면 그리는 부분 (HTML과 비슷) ---
  return (
    <div style={styles.container}>
      <h2>수업 준비</h2>

      {/* 로딩 중일 때 표시 (초기 로딩) */}
      {loading && <p>데이터 로딩 중...</p>}
      {/* 에러 발생 시 표시 */}
      {error && <p style={styles.errorText}>오류: {error}</p>}

      {/* 로딩 끝나고 에러 없을 때만 내용 표시 */}
      {!loading && ( // 초기 로딩 에러 여부만 체크
        <>
          {/* === 템플릿(그룹) 불러오기 섹션 === */}
          {groups.length > 0 && (
            <div style={styles.section}>
              <h3>템플릿 불러오기</h3>
              {groups.map(group => (
                <button key={group.id} onClick={() => handleLoadTemplate(group.id)} style={styles.button} disabled={startSessionLoading || loading}>
                  {group.name} 불러오기
                </button>
              ))}
            </div>
          )}

          {/* === 학생 검색 및 추가 섹션 === */}
          {/* !!! 중요: 이 섹션은 getAllStudents() 구현 전까지는 제대로 동작하지 않을 수 있습니다 !!! */}
          <div style={styles.section}>
            <h3>학생 검색 및 추가 (전체 학생 목록 로딩 필요)</h3>
            <input
              type="text"
              placeholder="학생 이름으로 검색..."
              value={searchTerm}
              onChange={handleSearchChange}
              style={styles.input}
              disabled={startSessionLoading || loading} // 로딩 중 비활성화
            />
            {/* 검색 결과 목록 */}
            {searchTerm && filteredStudents.length > 0 && (
              <ul style={styles.list}>
                {filteredStudents.map(student => (
                  <li key={student.id} style={styles.listItem}> {/* <<< id 로 변경 */}
                    <span>{student.name}</span>
                    <button onClick={() => handleAddStudent(student)} style={styles.addButton} disabled={startSessionLoading || loading}>
                      추가
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {/* 검색 결과 없음 */}
            {searchTerm && filteredStudents.length === 0 && !loading && <p>검색 결과가 없습니다.</p>}
            {/* 검색어 없고, 학생 목록 로딩 실패 시 메시지 */}
            {!searchTerm && allStudents.length === 0 && !loading && <p>전체 학생 목록을 불러오지 못했습니다.</p>}
          </div>

          {/* === 현재 로비 학생 목록 섹션 === */}
          <div style={styles.section}>
            <h3>참여 학생 목록 ({lobbyStudents.length}명)</h3>
            {lobbyStudents.length === 0 ? (
              <p>위에서 학생을 추가하거나 템플릿을 불러오세요.</p>
            ) : (
              <ul style={{ listStyle: 'none', paddingLeft: '0' }}>
                {lobbyStudents.map(student => (
                  <li key={student.id} style={styles.lobbyItem}> {/* <<< id 로 변경 */}
                    <span>{student.name}</span>
                    <button
                      onClick={() => handleRemoveStudent(student.id)} // <<< id 로 변경
                      style={styles.removeButton}
                      disabled={startSessionLoading || loading} // 로딩 중 비활성화
                    >
                      제거
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* === 수업 시작 버튼 === */}
          <button
            onClick={handleStartClass}
            disabled={lobbyStudents.length === 0 || startSessionLoading || loading} // 로딩 중 비활성화 추가
            style={(lobbyStudents.length === 0 || startSessionLoading || loading) ? styles.disabledButton : styles.startButton}
          >
            {startSessionLoading ? '수업 시작 중...' : `수업 시작 (${lobbyStudents.length}명)`}
          </button>
        </>
      )}
    </div>
  );
}

// --- 간단한 스타일 객체들 ---
// (스타일 부분은 동일하므로 생략)
const styles = {
    container: {
      padding: '20px',
      fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif'
    },
    section: {
      marginBottom: '25px',
      paddingBottom: '15px',
      borderBottom: '1px solid #eee'
    },
    errorText: {
      color: '#dc3545',
      fontWeight: 'bold'
    },
    input: {
      marginRight: '10px',
      padding: '8px 12px',
      minWidth: '250px',
      border: '1px solid #ced4da',
      borderRadius: '4px',
      fontSize: '14px'
    },
    button: {
      marginRight: '5px',
      marginBottom: '5px',
      padding: '8px 12px',
      cursor: 'pointer',
      border: '1px solid #adb5bd',
      borderRadius: '4px',
      background: '#e9ecef',
      fontSize: '14px'
    },
    addButton: {
      marginLeft: '10px',
      padding: '3px 8px',
      cursor: 'pointer',
      border: '1px solid #198754',
      borderRadius: '4px',
      background: '#d1e7dd',
      color: '#0f5132',
      fontSize: '12px'
    },
    removeButton: {
      marginLeft: '10px',
      padding: '3px 8px',
      cursor: 'pointer',
      border: '1px solid #dc3545',
      borderRadius: '4px',
      background: '#f8d7da',
      color: '#842029',
      fontSize: '12px'
    },
    list: {
      listStyle: 'none',
      paddingLeft: '0',
      maxHeight: '200px',
      overflowY: 'auto',
      border: '1px solid #dee2e6',
      marginTop: '10px',
      borderRadius: '4px'
    },
    listItem: {
      padding: '10px 12px',
      borderBottom: '1px solid #f8f9fa',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      fontSize: '14px'
    },
    lobbyItem: {
      padding: '8px 0',
      borderBottom: '1px dotted #e9ecef',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      fontSize: '14px'
    },
    startButton: {
      padding: '12px 25px',
      fontSize: '16px',
      cursor: 'pointer',
      background: '#0d6efd',
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      fontWeight: 'bold'
    },
    disabledButton: {
      padding: '12px 25px',
      fontSize: '16px',
      cursor: 'not-allowed',
      background: '#6c757d',
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      fontWeight: 'bold',
      opacity: 0.65
    }
  };
// -------------------------------------------

export default ClassPreparation;
// --- 여기까지 복사 ---