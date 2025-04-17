import api from '../utils/api';

// 관리자 로그인
export const adminLogin = async (password) => {
  try {
    const response = await api.post('/admin/login', { password });
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error('서버 연결 오류');
  }
};

// 학생 관리 서비스
export const getStudents = async () => {
  try {
    const token = localStorage.getItem('adminAuth');
    const response = await api.get('/admin/students', {
      headers: { 
        Authorization: `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error('서버 연결 오류');
  }
};

export const createStudent = async (studentData) => {
  try {
    const token = localStorage.getItem('adminAuth');
    const response = await api.post('/admin/students', studentData, {
      headers: { 
        Authorization: `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error('서버 연결 오류');
  }
};

export const updateStudent = async (studentId, studentData) => {
  try {
    const token = localStorage.getItem('adminAuth');
    const response = await api.put(`/admin/students/${studentId}`, studentData, {
      headers: { 
        Authorization: `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error('서버 연결 오류');
  }
};

export const deleteStudent = async (studentId) => {
  try {
    const token = localStorage.getItem('adminAuth');
    const response = await api.delete(`/admin/students/${studentId}`, {
      headers: { 
        Authorization: `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error('서버 연결 오류');
  }
};

// 그룹 관리 서비스
export const getGroups = async () => {
  try {
    const adminAuth = JSON.parse(localStorage.getItem('adminAuth') || '{}');
    const token = adminAuth.token || '';
    const response = await api.get('/admin/groups', {
      headers: { 
        'x-auth-token': token
      }
    });
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error('서버 연결 오류');
  }
};

export const createGroup = async (groupData) => {
  try {
    const adminAuth = JSON.parse(localStorage.getItem('adminAuth') || '{}');
    const token = adminAuth.token || '';
    const response = await api.post('/admin/groups', groupData, {
      headers: { 
        'x-auth-token': token
      }
    });
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error('서버 연결 오류');
  }
};

export const updateGroup = async (groupId, groupData) => {
  try {
    const token = localStorage.getItem('adminAuth');
    const response = await api.put(`/admin/groups/${groupId}`, groupData, {
      headers: { 
        Authorization: `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error('서버 연결 오류');
  }
};

export const deleteGroup = async (groupId) => {
  try {
    const token = localStorage.getItem('adminAuth');
    const response = await api.delete(`/admin/groups/${groupId}`, {
      headers: { 
        Authorization: `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error('서버 연결 오류');
  }
};

// 비밀번호 관리
export const updatePassword = async (type, password) => {
  try {
    const token = localStorage.getItem('adminAuth');
    const response = await api.post('/admin/password', { type, password }, {
      headers: { 
        Authorization: `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error('서버 연결 오류');
  }
};

// 랭킹 기간 설정
export const updateRankingPeriod = async (periodData) => {
  try {
    const token = localStorage.getItem('adminAuth');
    const response = await api.post('/admin/ranking-period', periodData, {
      headers: { 
        Authorization: `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error('서버 연결 오류');
  }
};

// 활성 세션 관리
export const getActiveSessions = async () => {
  try {
    const token = localStorage.getItem('adminAuth');
    const response = await api.get('/admin/active-sessions', {
      headers: { 
        Authorization: `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error('서버 연결 오류');
  }
};

export const forceEndSession = async (sessionId) => {
  try {
    const token = localStorage.getItem('adminAuth');
    const response = await api.put(`/admin/active-sessions/${sessionId}/end`, {}, {
      headers: { 
        Authorization: `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error('서버 연결 오류');
  }
};

// 완료된 세션 조회
export const getCompletedSessions = async (page = 1, limit = 10) => {
  try {
    const token = localStorage.getItem('adminAuth');
    const response = await api.get(`/admin/completed-sessions?page=${page}&limit=${limit}`, {
      headers: { 
        Authorization: `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error('서버 연결 오류');
  }
};

export const getSessionScoreLogs = async (sessionId) => {
  try {
    const token = localStorage.getItem('adminAuth');
    const response = await api.get(`/admin/sessions/${sessionId}/logs`, {
      headers: { 
        Authorization: `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error('서버 연결 오류');
  }
};

// 점수 초기화
export const resetScores = async (resetData) => {
  try {
    const token = localStorage.getItem('adminAuth');
    const response = await api.post('/admin/reset-scores', resetData, {
      headers: { 
        Authorization: `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error('서버 연결 오류');
  }
};

// 시스템 설정 조회
export const getSystemSettings = async () => {
  try {
    const token = localStorage.getItem('adminAuth');
    const response = await api.get('/admin/settings', {
      headers: { 
        Authorization: `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error('서버 연결 오류');
  }
};
