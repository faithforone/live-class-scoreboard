// --- 여기부터 복사 ---
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom'; // 페이지 이동 시 필요
// 이렇게 수정하세요:
import * as teacherService from '../../services/teacherService'; // 서버와 통신하는 함수들 가져오기
// import './ClassPreparation.css'; // 만약 CSS 파일이 있다면 주석 해제

function ClassPreparation() {
  // --- 화면이 기억해야 할 정보들 ---
  const [allStudents, setAllStudents] = useState([]); // 전체 학생 목록 (검색 대상)
  const [lobbyStudents, setLobbyStudents] = useState([]); // 수업 참여 확정 학생 목록 (로비)
  const [groups, setGroups] = useState([]); // 불러올 수 있는 템플릿 목록
  const [searchTerm, setSearchTerm] = useState(''); // 학생 검색창에 입력된 내용
  const [loading, setLoading] = useState(true); // 데이터 로딩 상태 (true: 로딩중)
  const [error, setError] = useState(null); // 오류 메시지
  // ---------------------------------

  const navigate = useNavigate(); // 다른 페이지로 이동시키는 함수

  // --- 화면이 처음 나타날 때 실행할 작업 ---
  useEffect(() => {
    // 서버로부터 학생 목록과 템플릿 목록을 가져오는 함수
    const fetchData = async () => {
      try {
        setLoading(true); // 로딩 시작
        setError(null);   // 이전 오류 메시지 초기화
        // 학생 목록과 그룹 목록을 동시에 요청해서 더 빠르게 가져옴
        // teacherService 에서 정의한 함수 이름 확인! (getAllStudents, getGroups)
        const [fetchedStudents, fetchedGroups] = await Promise.all([
          teacherService.getAllStudents(),
          teacherService.getGroups()
        ]);
        // 가져온 데이터로 화면 정보 업데이트
        setAllStudents(fetchedStudents || []); // 학생 목록 업데이트 (없으면 빈 목록)
        setGroups(fetchedGroups || []);       // 템플릿 목록 업데이트 (없으면 빈 목록)
      } catch (err) {
        console.error("초기 데이터 로딩 실패:", err);
        setError("데이터를 불러오는데 실패했습니다. 인터넷 연결을 확인하거나 새로고침 해보세요.");
      } finally {
        setLoading(false); // 로딩 끝
      }
    };
    fetchData(); // 위에서 만든 함수 실행
  }, []); // []는 "화면이 처음 나타날 때 딱 한 번만 실행하세요" 라는 의미
  // ------------------------------------

  // --- 버튼 클릭 등으로 실행될 함수들 ---

  // '추가' 버튼: 학생을 로비 목록에 추가 (이미 있으면 추가 안 함)
  const handleAddStudent = useCallback((studentToAdd) => {
    setLobbyStudents(currentLobby => {
      // student.js 모델의 기본 키는 'student_id' 입니다. 이를 기준으로 중복 체크.
      const isAlreadyInLobby = currentLobby.some(s => s.student_id === studentToAdd.student_id);

      if (!isAlreadyInLobby) { // 로비에 없다면
        return [...currentLobby, studentToAdd]; // 새 학생 추가된 목록 반환
      }
      return currentLobby; // 이미 있다면 아무것도 바꾸지 않음
    });
  }, []);

  // '제거' 버튼: 학생을 로비 목록에서 제거
  const handleRemoveStudent = useCallback((studentIdToRemove) => {
    // student.js 모델의 기본 키 'student_id' 기준으로 제거
    setLobbyStudents(currentLobby =>
      currentLobby.filter(s => s.student_id !== studentIdToRemove)
    );
  }, []);

  // '템플릿 불러오기' 버튼: 해당 템플릿의 학생들을 로비에 추가
  const handleLoadTemplate = useCallback(async (groupId) => {
    try {
      setError(null);
      // teacherService 에서 정의한 함수 이름 확인! (getGroupStudents)
      const templateStudents = await teacherService.getGroupStudents(groupId);

      if (templateStudents && templateStudents.length > 0) { // 학생 목록이 제대로 왔다면
        setLobbyStudents(currentLobby => {
          // 현재 로비 학생 ID 목록 (student_id 기준)
          const lobbyStudentIds = new Set(currentLobby.map(s => s.student_id));
          // 템플릿 학생 목록(templateStudents) 중에서,
          // 현재 로비에 없는(lobbyStudentIds에 포함되지 않은) 학생만 골라서 studentsToAdd에 저장 (student_id 기준)
          // 주의: getGroupStudents API가 반환하는 학생 객체에 student_id 필드가 포함되어야 합니다!
          // (teacherController.js의 getGroupStudents 함수에서 attributes 확인 필요)
          // 일단 student_id 가 있다고 가정하고 진행합니다. 없다면 수정 필요.
          const studentsToAdd = templateStudents.filter(ts => ts.student_id && !lobbyStudentIds.has(ts.student_id));
          // 기존 로비 목록(currentLobby)과 새로 추가할 학생 목록(studentsToAdd)을 합쳐서 최종 로비 목록 반환
          return [...currentLobby, ...studentsToAdd];
        });
      } else {
         console.log(`템플릿 ID ${groupId}에 학생이 없거나 불러오지 못했습니다.`);
         alert('템플릿에 포함된 학생이 없습니다.'); // 사용자에게 알림
      }
    } catch (err) {
      console.error(`템플릿 ${groupId} 로딩 실패:`, err);
      setError("템플릿 정보를 불러오는 중 오류가 발생했습니다.");
    }
  }, []);

  // 검색창 내용이 바뀔 때마다 실행됨
  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value); // 검색어 상태 업데이트
  };

  // 검색창 내용(searchTerm)으로 전체 학생(allStudents) 목록을 필터링
  // 조건 1: 학생 이름에 검색어가 포함되어야 함 (대소문자 무시)
  // 조건 2: 이미 로비(lobbyStudents)에 있는 학생은 결과에서 제외 (student_id 기준)
  const filteredStudents = allStudents.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) && // 조건 1
    !lobbyStudents.some(lobbyStudent => lobbyStudent.student_id === student.student_id) // 조건 2
  );

  // '수업 시작' 버튼: 현재 로비 목록으로 새 수업 세션 생성 요청
  const handleStartClass = async () => {
    if (lobbyStudents.length === 0) {
      alert('수업을 시작하려면 학생을 1명 이상 추가해야 합니다.');
      return;
    }
    try {
      // 로비 학생들의 ID 목록 만들기 (student_id 기준)
      const studentIds = lobbyStudents.map(s => s.student_id);
      // teacherService 에서 정의한 함수 이름 확인! (createClassSession)
      const sessionData = await teacherService.createClassSession(studentIds);
      console.log('Session created:', sessionData);

      // 생성된 수업 ID를 가지고 실제 수업 화면으로 이동
      // sessionData 안에 session 객체가 있고 그 안에 session_id 가 있는지 확인
      if (sessionData && sessionData.session && sessionData.session.session_id) {
          navigate(`/class/${sessionData.session.session_id}`);
      } else {
          console.error('Could not find session_id in response:', sessionData);
          setError('수업은 생성되었으나 ID를 찾지 못해 이동할 수 없습니다.');
      }

    } catch (err) {
      console.error('Failed to start class:', err);
      // 서버에서 보낸 구체적인 오류 메시지 표시 시도
      const message = err.response?.data?.message || err.message || '수업 시작 중 오류가 발생했습니다.';
      setError(message);
      // 이미 수업 중인 학생 목록 표시 (오류 객체 구조 확인 필요)
      if (err.response?.data?.students) {
         const busyStudentNames = err.response.data.students.map(s => s.name).join(', ');
         alert(`다음 학생들은 이미 다른 수업에 참여 중입니다: ${busyStudentNames}`);
      }
    }
  };
  // ------------------------------------

  // --- 화면 그리는 부분 (HTML과 비슷) ---
  return (
    <div style={styles.container}> {/* 스타일 객체 사용 */}
      <h2>수업 준비</h2>

      {/* 로딩 중일 때 표시 */}
      {loading && <p>데이터 로딩 중...</p>}
      {/* 에러 발생 시 표시 */}
      {error && <p style={styles.errorText}>오류: {error}</p>}

      {/* 로딩 끝나고 에러 없을 때만 내용 표시 */}
      {!loading && !error && (
        <>
          {/* === 템플릿(그룹) 불러오기 섹션 === */}
          {groups.length > 0 && ( // 그룹이 1개 이상 있을 때만 보여줌
            <div style={styles.section}>
              <h3>템플릿 불러오기</h3>
              {groups.map(group => (
                <button key={group.id} onClick={() => handleLoadTemplate(group.id)} style={styles.button}>
                  {group.name} 불러오기
                </button>
              ))}
            </div>
          )}

          {/* === 학생 검색 및 추가 섹션 === */}
          <div style={styles.section}>
            <h3>학생 검색 및 추가</h3>
            <input
              type="text"
              placeholder="학생 이름으로 검색..."
              value={searchTerm}
              onChange={handleSearchChange}
              style={styles.input}
            />
            {/* 검색 결과 목록 (검색어가 있고 결과가 있을 때만) */}
            {searchTerm && filteredStudents.length > 0 && (
              <ul style={styles.list}>
                {filteredStudents.map(student => (
                  // 학생 모델의 기본 키 'student_id' 사용
                  <li key={student.student_id} style={styles.listItem}>
                    <span>{student.name}</span> {/* 이름만 표시 */}
                    <button onClick={() => handleAddStudent(student)} style={styles.addButton}>
                      추가
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {/* 검색어는 있는데 결과가 없을 때 */}
            {searchTerm && filteredStudents.length === 0 && <p>검색 결과가 없습니다.</p>}
          </div>

          {/* === 현재 로비 학생 목록 섹션 === */}
          <div style={styles.section}>
            <h3>참여 학생 목록 ({lobbyStudents.length}명)</h3>
            {lobbyStudents.length === 0 ? (
              <p>위에서 학생을 추가하거나 템플릿을 불러오세요.</p>
            ) : (
              <ul style={{ listStyle: 'none', paddingLeft: '0' }}>
                {lobbyStudents.map(student => (
                  // 학생 모델의 기본 키 'student_id' 사용
                  <li key={student.student_id} style={styles.lobbyItem}>
                    <span>{student.name}</span> {/* 이름만 표시 */}
                    <button
                      onClick={() => handleRemoveStudent(student.student_id)}
                      style={styles.removeButton}
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
            disabled={lobbyStudents.length === 0} // 로비에 학생 없으면 비활성화
            style={lobbyStudents.length === 0 ? styles.disabledButton : styles.startButton}
          >
            수업 시작 ({lobbyStudents.length}명)
          </button>
        </>
      )}
    </div>
  );
}

// --- 간단한 스타일 객체들 (CSS 파일 대신 사용) ---
// 컴포넌트 외부에 정의
const styles = {
  container: {
    padding: '20px',
    fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' // 좀 더 나은 폰트 예시
  },
  section: {
    marginBottom: '25px',
    paddingBottom: '15px',
    borderBottom: '1px solid #eee'
  },
  errorText: {
    color: '#dc3545', // 빨간색 계열
    fontWeight: 'bold'
  },
  input: {
    marginRight: '10px',
    padding: '8px 12px',
    minWidth: '250px', // 너비 증가
    border: '1px solid #ced4da', // 약간 연한 회색 테두리
    borderRadius: '4px',
    fontSize: '14px'
  },
  button: {
    marginRight: '5px',
    marginBottom: '5px',
    padding: '8px 12px',
    cursor: 'pointer',
    border: '1px solid #adb5bd', // 약간 진한 회색 테두리
    borderRadius: '4px',
    background: '#e9ecef', // 연한 회색 배경
    fontSize: '14px'
  },
  addButton: {
    marginLeft: '10px',
    padding: '3px 8px', // 좀 더 작은 버튼
    cursor: 'pointer',
    border: '1px solid #198754', // 초록색 계열
    borderRadius: '4px',
    background: '#d1e7dd', // 연한 초록 배경
    color: '#0f5132', // 진한 초록 글씨
    fontSize: '12px'
  },
  removeButton: {
    marginLeft: '10px',
    padding: '3px 8px', // 좀 더 작은 버튼
    cursor: 'pointer',
    border: '1px solid #dc3545', // 빨간색 계열
    borderRadius: '4px',
    background: '#f8d7da', // 연한 빨강 배경
    color: '#842029', // 진한 빨강 글씨
    fontSize: '12px'
  },
  list: {
    listStyle: 'none',
    paddingLeft: '0',
    maxHeight: '200px',
    overflowY: 'auto',
    border: '1px solid #dee2e6', // 약간 더 연한 테두리
    marginTop: '10px',
    borderRadius: '4px'
  },
  listItem: {
    padding: '10px 12px', // 패딩 증가
    borderBottom: '1px solid #f8f9fa', // 매우 연한 구분선
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '14px'
  },
  lobbyItem: {
    padding: '8px 0', // 로비 아이템 패딩 조정
    borderBottom: '1px dotted #e9ecef', // 점선 구분
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '14px'
  },
  startButton: {
    padding: '12px 25px', // 패딩 증가
    fontSize: '16px',
    cursor: 'pointer',
    background: '#0d6efd', // 파란색 계열 (Bootstrap primary)
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontWeight: 'bold'
  },
  disabledButton: { // startButton 스타일 상속 후 변경
    padding: '12px 25px',
    fontSize: '16px',
    cursor: 'not-allowed',
    background: '#6c757d', // 회색 계열 (Bootstrap secondary)
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontWeight: 'bold',
    opacity: 0.65 // 약간 투명하게
  }
};
// -------------------------------------------

export default ClassPreparation;
// --- 여기까지 복사 ---