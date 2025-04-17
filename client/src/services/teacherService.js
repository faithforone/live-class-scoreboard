// 이 api 객체는 baseURL 등 axios 통신 설정이 미리 되어 있습니다.
import api from '../utils/api';

// 선생님 로그인 API 호출 함수
// async 키워드를 붙여 비동기 함수로 만듭니다. 네트워크 요청은 비동기로 처리해야 합니다.
export const teacherLogin = async (password) => {
  // try...catch 블록으로 API 호출 중 발생할 수 있는 오류를 감지하고 처리합니다.
  try {
    // api 객체의 post 메소드를 사용하여 백엔드의 '/teacher/login' 경로로 POST 요청을 보냅니다.
    // 두 번째 인자로 { password } 객체를 전달하여 요청의 본문(body)에 사용자가 입력한 비밀번호를 담아 보냅니다.
    // 백엔드에서는 이 요청을 받아서middlewares/auth.js의 verifyTeacherPassword 미들웨어가 처리합니다 [cite: uploaded:live-class-scoreboard/server/middlewares/auth.js, uploaded:live-class-scoreboard/server/routes/teacher.js].
    // await 키워드는 서버로부터 응답이 올 때까지 기다립니다.
    console.log('teacherService: 백엔드 /teacher/login API 호출 시도...'); // 개발 확인용 로그
    const response = await api.post('/teacher/login', { password });

    // 백엔드에서 비밀번호가 맞으면 오류 없이 정상 응답(HTTP 2xx)을 보냅니다.
    // 성공했을 경우, 받은 응답 데이터(있다면)를 반환합니다.
    // (현재 백엔드 로직상으로는 성공 시 특별한 데이터를 반환하지 않을 수 있습니다.)
    console.log('teacherService: 로그인 API 호출 성공', response.data); // 개발 확인용 로그
    return response.data || true; // 성공했다는 것을 알리기 위해 true를 반환해도 좋습니다.

  } catch (error) {
    // 네트워크 연결 오류가 발생했거나, 백엔드에서 오류 응답(예: 401 Unauthorized - 비밀번호 틀림)을 보낸 경우
    // 이 catch 블록이 실행됩니다.
    console.error('teacherService: 로그인 API 호출 실패:', error.response || error); // 개발 확인용 로그

    // 사용자에게 보여줄 오류 메시지를 생성합니다.
    // 서버가 오류 메시지를 JSON 형태로 보냈다면 (예: { message: '잘못된 비밀번호입니다.' })
    // error.response.data.message 에서 해당 메시지를 추출합니다.
    // 그렇지 않다면 기본 오류 메시지를 사용합니다.
    const errorMessage = error.response?.data?.message || '로그인 중 오류가 발생했습니다.';

    // 생성된 오류 메시지를 포함하는 새로운 Error 객체를 만들어서 throw 합니다.
    // 이렇게 하면 이 함수(teacherLogin)를 호출한 AuthContext.js 에서 이 오류를 받아서 처리할 수 있습니다.
    throw new Error(errorMessage);
  }
};

// 모든 학생 목록 조회
export const getAllStudents = async () => {
  try {
    const response = await api.get('/teacher/students', {
      headers: { 
        password: localStorage.getItem('teacherPassword') 
      }
    });
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error('서버 연결 오류');
  }
};

// 대기 중인(수업 중이 아닌) 학생 목록 조회
export const getAvailableStudents = async () => {
  try {
    const response = await api.get('/teacher/available-students', {
      headers: { 
        password: localStorage.getItem('teacherPassword') 
      }
    });
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error('서버 연결 오류');
  }
};

// 새 수업 세션 생성
export const createClassSession = async (studentIds) => {
  try {
    const response = await api.post('/teacher/sessions', { studentIds }, {
      headers: { 
        password: localStorage.getItem('teacherPassword') 
      }
    });
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error('서버 연결 오류');
  }
};

// 수업 세션 종료
export const endClassSession = async (sessionId) => {
  try {
    const response = await api.put(`/teacher/sessions/${sessionId}/end`, {}, {
      headers: { 
        password: localStorage.getItem('teacherPassword') 
      }
    });
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error('서버 연결 오류');
  }
};

// 내 활성 수업 세션 조회
export const getMyActiveSession = async () => {
  try {
    const response = await api.get('/teacher/active-session', {
      headers: { 
        password: localStorage.getItem('teacherPassword') 
      }
    });
    return response.data;
  } catch (error) {
    if (error.response && error.response.status === 404) {
      // 활성 세션이 없는 경우는 에러가 아닌 null 반환
      return null;
    }
    throw error.response ? error.response.data : new Error('서버 연결 오류');
  }
};

// 학생 점수 업데이트
export const updateScore = async (sessionId, studentId, points) => {
  try {
    const response = await api.post('/teacher/score', { 
      session_id: sessionId, 
      student_id: studentId, 
      points 
    }, {
      headers: { 
        password: localStorage.getItem('teacherPassword') 
      }
    });
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error('서버 연결 오류');
  }
};

// 내 수업 히스토리 조회
export const getMySessionHistory = async (page = 1, limit = 10) => {
  try {
    const response = await api.get(`/teacher/my-sessions?page=${page}&limit=${limit}`, {
      headers: { 
        password: localStorage.getItem('teacherPassword') 
      }
    });
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error('서버 연결 오류');
  }
};

// 그룹(템플릿) 목록 가져오기 API 호출 함수
export const getGroups = async () => { // 기존 함수들과 동일하게 export const 사용
  try {
    // 다른 함수들처럼 비밀번호 헤더 추가
    const response = await api.get('/teacher/groups', {
      headers: {
        password: localStorage.getItem('teacherPassword')
      }
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching groups:", error.response || error);
    // 다른 함수들과 유사하게 오류 처리
    throw error.response ? error.response.data : new Error('그룹 목록 조회 중 서버 오류');
  }
};

// 특정 그룹(템플릿)의 학생 목록 가져오기 API 호출 함수
export const getGroupStudents = async (groupId) => { // 기존 함수들과 동일하게 export const 사용
  try {
    // 다른 함수들처럼 비밀번호 헤더 추가
    const response = await api.get(`/teacher/groups/${groupId}/students`, {
      headers: {
        password: localStorage.getItem('teacherPassword')
      }
    });
    return response.data;
  } catch (error) {
    console.error(`Error fetching students for group ${groupId}:`, error.response || error);
    // 다른 함수들과 유사하게 오류 처리
    throw error.response ? error.response.data : new Error('그룹 학생 목록 조회 중 서버 오류');
  }
};