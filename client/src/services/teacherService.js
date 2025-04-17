// live-class-scoreboard/client/src/services/teacherService.js

// 이 api 객체는 baseURL 및 인증 토큰(예: Authorization 헤더) 자동 포함 설정이
// utils/api.js (Axios Interceptors)에 미리 되어 있다고 가정합니다.
import api from '../utils/api';

// 선생님 로그인 API 호출 함수
export const teacherLogin = async (password) => {
  try {
    console.log('teacherService: 백엔드 /teacher/login API 호출 시도...');
    const response = await api.post('/teacher/login', { password });

    // 중요: 백엔드 teacherController.login은 성공 시
    // JWT 토큰을 반환하도록 수정되어야 합니다.
    // 예: response.data = { token: '...', message: '...' }
    console.log('teacherService: 로그인 API 호출 성공', response.data);

    // 로그인 성공 후 토큰 저장 로직은 이 함수를 호출하는 AuthContext.js 등에서 처리
    // 예: if (response.data.token) localStorage.setItem('teacherToken', response.data.token);

    return response.data; // 백엔드 응답 데이터 전체 반환 (토큰 포함 가능성)

  } catch (error) {
    console.error('teacherService: 로그인 API 호출 실패:', error.response?.data || error.message || error);
    const errorMessage = error.response?.data?.message || '로그인 중 오류가 발생했습니다.';
    // 오류 객체를 그대로 throw하여 AuthContext 등에서 상태 코드 등을 활용할 수 있게 함
    throw error.response?.data || new Error(errorMessage);
  }
};

// --- 수업 준비 관련 API ---

// 모든 학생 목록 조회
export const getAllStudents = async () => {
  try {
    // 헤더에서 비밀번호 제거 (utils/api.js의 인터셉터가 토큰 인증 처리 가정)
    const response = await api.get('/teacher/students');
    return response.data; // 학생 배열 반환: [{ id: 1, name: '...' }, ...]
  } catch (error) {
    console.error('Error fetching all students:', error.response?.data || error.message);
    throw error.response?.data || new Error('학생 목록 조회 중 오류 발생');
  }
};

// 대기 중인(수업 중이 아닌) 학생 목록 조회
export const getAvailableStudents = async () => {
  try {
    // 헤더에서 비밀번호 제거
    const response = await api.get('/teacher/available-students');
    return response.data; // '대기중' 상태 학생 배열 반환
  } catch (error) {
    console.error('Error fetching available students:', error.response?.data || error.message);
    throw error.response?.data || new Error('대기 중 학생 목록 조회 중 오류 발생');
  }
};

// 그룹(템플릿) 목록 가져오기 API 호출 함수
export const getGroups = async () => {
  try {
    // 헤더에서 비밀번호 제거
    const response = await api.get('/teacher/groups');
    return response.data; // 템플릿 배열 반환: [{ id: 1, name: '...' }, ...]
  } catch (error) {
    console.error("Error fetching groups:", error.response?.data || error.message);
    throw error.response?.data || new Error('그룹(템플릿) 목록 조회 중 오류 발생');
  }
};

// 특정 그룹(템플릿)의 학생 목록 가져오기 API 호출 함수
export const getGroupStudents = async (groupId) => {
  // groupId 유효성 검사 (선택적)
  if (!groupId) {
      console.error('getGroupStudents: groupId is required.');
      throw new Error('그룹 ID가 필요합니다.');
  }
  try {
    // 헤더에서 비밀번호 제거
    const response = await api.get(`/teacher/groups/${groupId}/students`);
    return response.data; // 해당 그룹의 학생 배열 반환
  } catch (error) {
    console.error(`Error fetching students for group ${groupId}:`, error.response?.data || error.message);
    throw error.response?.data || new Error('그룹 학생 목록 조회 중 오류 발생');
  }
};


// --- 수업 세션 관련 API ---

// 새 수업 세션 생성 (학생 ID 목록과 세션 이름 사용)
// ClassPreparation.js 에서 이 함수를 호출할 때 sessionName도 전달하도록 수정 필요
export const createClassSession = async (studentIds, sessionName = '') => {
  // studentIds 유효성 검사 (선택적)
  if (!Array.isArray(studentIds) || studentIds.length === 0) {
      console.error('createClassSession: studentIds array is required.');
      throw new Error('수업에 참여할 학생 ID 목록이 필요합니다.');
  }
  try {
    // 헤더에서 비밀번호 제거
    // 요청 본문에 studentIds 와 sessionName 포함
    const response = await api.post('/teacher/sessions', { studentIds, sessionName });
    // 백엔드는 생성된 세션 상세 정보를 반환 (teacherController.js 확인)
    return response.data; // 예: { message: '...', session: { id: ..., name: ..., participants: [...] } }
  } catch (error) {
    console.error('Error creating class session:', error.response?.data || error.message);
    // 서버에서 보낸 오류 정보(예: 바쁜 학생 목록)를 포함하여 throw
    throw error.response?.data || new Error('수업 세션 생성 중 오류 발생');
  }
};

// 수업 세션 종료
export const endClassSession = async (sessionId) => {
  if (!sessionId) {
      console.error('endClassSession: sessionId is required.');
      throw new Error('세션 ID가 필요합니다.');
  }
  try {
    // 헤더에서 비밀번호 제거
    // PUT 요청의 body는 비워둠 ({})
    const response = await api.put(`/teacher/sessions/${sessionId}/end`, {});
    return response.data; // 예: { message: '수업 세션이 종료되었습니다.' }
  } catch (error) {
    console.error(`Error ending session ${sessionId}:`, error.response?.data || error.message);
    throw error.response?.data || new Error('수업 세션 종료 중 오류 발생');
  }
};

// 내 (교사) 활성 수업 세션 조회
export const getMyActiveSession = async () => {
  try {
    // 헤더에서 비밀번호 제거
    const response = await api.get('/teacher/active-session');
    // 백엔드에서 활성 세션 없으면 null 반환하도록 수정했으므로, 그대로 반환
    return response.data; // 활성 세션 객체 또는 null
  } catch (error) {
    // 404 외 다른 오류 처리
    console.error('Error fetching active session:', error.response?.data || error.message);
    // 404는 정상적으로 null 반환되므로 여기서 처리할 필요 없음
    if (error.response?.status !== 404) {
        throw error.response?.data || new Error('활성 수업 조회 중 오류 발생');
    }
    // 혹시 백엔드가 404를 보내면서 null을 안보내는 경우 대비
    return null;
  }
};

// 학생 점수 업데이트
export const updateScore = async (sessionId, studentId, points) => {
  if (!sessionId || !studentId || points === undefined) {
      console.error('updateScore: sessionId, studentId, and points are required.');
      throw new Error('세션 ID, 학생 ID, 점수 정보가 필요합니다.');
  }
  const parsedPoints = Number(points);
  if (isNaN(parsedPoints)) {
       console.error('updateScore: points must be a number.');
      throw new Error('점수는 숫자여야 합니다.');
  }

  try {
    // 헤더에서 비밀번호 제거
    // 요청 본문 필드명을 camelCase로 수정: sessionId, studentId, points
    const response = await api.post('/teacher/score', {
      sessionId: sessionId,
      studentId: studentId,
      points: parsedPoints // Number 타입으로 변환
    });
    // 백엔드 응답 확인 (teacherController.js updateScore 참고)
    return response.data; // 예: { message: '...', participantId: ..., newScore: ... }
  } catch (error) {
    console.error('Error updating score:', error.response?.data || error.message);
    throw error.response?.data || new Error('점수 업데이트 중 오류 발생');
  }
};

// 내 수업 히스토리 조회 (페이지네이션)
export const getMySessionHistory = async (page = 1, limit = 10) => {
  try {
    // 헤더에서 비밀번호 제거
    const response = await api.get(`/teacher/my-sessions?page=${page}&limit=${limit}`);
    // 백엔드 응답 형식 확인 (teacherController.js getMySessionHistory 참고)
    return response.data; // 예: { totalItems: ..., totalPages: ..., currentPage: ..., sessions: [...] }
  } catch (error) {
    console.error('Error fetching session history:', error.response?.data || error.message);
    throw error.response?.data || new Error('수업 히스토리 조회 중 오류 발생');
  }
};