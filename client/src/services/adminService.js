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

// 학생 관리
export const getAllStudents = async () => {
  try {
    const response = await api.get('/admin/students');
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error('서버 연결 오류');
  }
};

export const createStudent = async (studentData) => {
  try {
    const response = await api.post('/admin/students', studentData);
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error('서버 연결 오류');
  }
};

export const updateStudent = async (studentId, studentData) => {
  try {
    const response = await api.put(`/admin/students/${studentId}`, studentData);
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error('서버 연결 오류');
  }
};

export const deleteStudent = async (studentId) => {
  try {
    const response = await api.delete(`/admin/students/${studentId}`);
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error('서버 연결 오류');
  }
};

// 그룹 관리
export const getAllGroups = async () => {
  try {
    const response = await api.get('/admin/groups');
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error('서버 연결 오류');
  }
};

// 그룹 관리 서비스
export const getGroups = async () => {
  try {
    const response = await api.get('/admin/groups');
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error('서버 연결 오류');
  }
};

export const createGroup = async (groupData) => {
  try {
    const response = await api.post('/admin/groups', groupData);
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error('서버 연결 오류');
  }
};

export const updateGroup = async (groupId, groupData) => {
  try {
    const response = await api.put(`/admin/groups/${groupId}`, groupData);
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error('서버 연결 오류');
  }
};

export const deleteGroup = async (groupId) => {
  try {
    const response = await api.delete(`/admin/groups/${groupId}`);
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error('서버 연결 오류');
  }
};

// 비밀번호 관리
export const updatePassword = async (type, password) => {
  try {
    const response = await api.post('/admin/password', { type, password });
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error('서버 연결 오류');
  }
};

// 랭킹 기간 설정
export const updateRankingPeriod = async (periodData) => {
  try {
    const response = await api.post('/admin/ranking-period', periodData);
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error('서버 연결 오류');
  }
};

// 활성 세션 관리
export const getActiveSessions = async () => {
  try {
    const response = await api.get('/admin/active-sessions');
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error('서버 연결 오류');
  }
};

export const forceEndSession = async (sessionId) => {
  try {
    const response = await api.put(`/admin/active-sessions/${sessionId}/end`, {});
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error('서버 연결 오류');
  }
};

// 완료된 세션 조회
export const getCompletedSessions = async (page = 1, limit = 10) => {
  try {
    const response = await api.get(`/admin/completed-sessions?page=${page}&limit=${limit}`);
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error('서버 연결 오류');
  }
};

export const getSessionScoreLogs = async (sessionId) => {
  try {
    const response = await api.get(`/admin/sessions/${sessionId}/logs`);
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error('서버 연결 오류');
  }
};

// 점수 초기화
export const resetScores = async (resetData) => {
  try {
    const response = await api.post('/admin/reset-scores', resetData);
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error('서버 연결 오류');
  }
};

// 시스템 설정 조회
export const getSystemSettings = async () => {
  try {
    const response = await api.get('/admin/settings');
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error('서버 연결 오류');
  }
};

// Update a student's score in a session
export const updateStudentScore = async (sessionId, studentId, points) => {
  try {
    const response = await api.put(`/admin/sessions/${sessionId}/participants/${studentId}/score`, { points });
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error('서버 연결 오류');
  }
};
