import api from '../utils/api';

// 실시간 피드 데이터 조회
export const getSessionFeed = async (urlIdentifier) => {
  try {
    const response = await api.get(`/viewer/feed/${urlIdentifier}`);
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error('서버 연결 오류');
  }
};

// 위젯 데이터 조회
export const getSessionWidget = async (urlIdentifier) => {
  try {
    const response = await api.get(`/viewer/widget/${urlIdentifier}`);
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error('서버 연결 오류');
  }
};

// 랭킹 데이터 조회
export const getRankings = async (period = 'week', groupId = null) => {
  try {
    let url = `/viewer/rankings?period=${period}`;
    if (groupId) url += `&groupId=${groupId}`;
    
    const response = await api.get(url);
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error('서버 연결 오류');
  }
};

// 그룹 목록 조회 (랭킹 필터용)
export const getGroups = async () => {
  try {
    const response = await api.get('/viewer/groups');
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error('서버 연결 오류');
  }
};
