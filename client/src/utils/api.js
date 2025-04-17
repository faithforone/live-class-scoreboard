import axios from 'axios';

// 토큰을 저장하는 로컬 스토리지 키 (AuthContext.js 와 동일하게 유지)
const TEACHER_TOKEN_KEY = 'teacherToken';
const ADMIN_TOKEN_KEY = 'adminAuth'; // 관리자 토큰 키 추가

// 기본 API 클라이언트 설정
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5001/api',
  headers: {
    'Content-Type': 'application/json'
  }
  // timeout: 10000, // 필요 시 요청 타임아웃 설정
});

// --- 요청 인터셉터 (Request Interceptor) ---
// API 요청을 보내기 전에 헤더에 토큰 추가
api.interceptors.request.use(
  (config) => {
    // DEBUG: 모든 요청 URL 로깅
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    
    // 로컬 스토리지에서 토큰 가져오기
    const teacherToken = localStorage.getItem(TEACHER_TOKEN_KEY);
    const adminAuthItem = localStorage.getItem(ADMIN_TOKEN_KEY);
    
    // DEBUG: 토큰 존재 여부 로깅
    console.log('Tokens in localStorage - Teacher:', !!teacherToken, 'Admin:', !!adminAuthItem);
    
    // 관리자 토큰 추출 (adminAuth는 JSON 형태로 저장됨)
    let adminToken = null;
    try {
      if (adminAuthItem) {
        const adminAuth = JSON.parse(adminAuthItem);
        adminToken = adminAuth.token;
      }
    } catch (e) {
      console.error('Failed to parse admin token:', e);
    }
    
    // 어떤 토큰을 사용할지 결정 (관리자 토큰 우선)
    const token = adminToken || teacherToken;

    if (token) {
      // 토큰이 있으면 Authorization 헤더 추가
      config.headers['Authorization'] = `Bearer ${token}`;
      
      // DEBUG: 디버깅을 위해 토큰의 일부 출력
      console.log('Interceptor: Token added to headers. Token preview:', token.substring(0, 20) + '...');
      
      // 관리자 토큰의 경우 x-auth-token 헤더도 추가 (기존 코드와의 호환성)
      if (adminToken) {
        config.headers['x-auth-token'] = token;
      }
      
      console.log('Interceptor: Token added to headers:', config.headers);
    } else {
      console.log('Interceptor: No token found');
    }
    return config; // 수정된 설정 또는 원본 설정 반환
  },
  (error) => {
    // 요청 설정 중 오류 발생 시 처리
    console.error('API Request Interceptor Error:', error);
    return Promise.reject(error);
  }
);

// --- 응답 인터셉터 (Response Interceptor) - 선택 사항 (401 오류 처리 등) ---
api.interceptors.response.use(
  (response) => {
    // DEBUG: 응답 결과 로깅
    console.log(`API Response (${response.status}): ${response.config.method?.toUpperCase()} ${response.config.url}`);
    console.log('Response data:', response.data);
    
    // 2xx 범위의 상태 코드 - 응답 데이터 그대로 반환
    return response;
  },
  (error) => {
    // DEBUG: 에러 응답 자세히 로깅
    console.error('API Error Response:', {
      url: error.config?.url,
      method: error.config?.method?.toUpperCase(),
      status: error.response?.status,
      data: error.response?.data
    });

    // 2xx 외의 상태 코드 - 오류 처리
    console.error('API Response Interceptor Error:', error.response || error.message);

    // 401 Unauthorized 오류 처리 (토큰 만료 또는 무효)
    if (error.response && error.response.status === 401) {
      console.log('Interceptor: Received 401 Unauthorized. Logging out.');
      // 토큰 제거
      localStorage.removeItem(TEACHER_TOKEN_KEY);
      localStorage.removeItem(ADMIN_TOKEN_KEY); // 관리자 토큰도 제거

      // 로그인 페이지로 리디렉션 (AuthContext 상태 변경도 필요할 수 있으나 여기서 직접 호출은 어려움)
      // window.location.href = '/teacher/login'; // 강제 페이지 이동 방식
      // 또는 React Router 사용 시 history 객체나 커스텀 이벤트 사용 필요

      // 필요 시 사용자에게 알림
      // alert('인증이 만료되었거나 유효하지 않습니다. 다시 로그인해주세요.');

      // 처리 후 오류를 계속 전파하여 개별 컴포넌트의 catch에서도 처리 가능하게 함
      // return Promise.reject(error.response?.data || error.message); // 서버 메시지 전달
      // 또는 여기서 오류 처리를 완료하고 새로운 에러 반환
      return Promise.reject(new Error('인증 실패 또는 토큰 만료'));
    }

    // 다른 종류의 오류는 그대로 전파
    return Promise.reject(error);
  }
);


export default api;