import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
// teacherService import 는 유지
import * as teacherService from '../services/teacherService';
// adminService 등 필요 시 추가

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

// 토큰을 저장할 로컬 스토리지 키 이름 정의
const TEACHER_TOKEN_KEY = 'teacherToken';
const ADMIN_TOKEN_KEY = 'adminToken'; // 관리자용 토큰 키 (필요 시)

export const AuthProvider = ({ children }) => {
  // 초기 상태는 로컬 스토리지의 토큰 존재 여부로 결정
  const [teacherAuth, setTeacherAuth] = useState(!!localStorage.getItem(TEACHER_TOKEN_KEY));
  const [adminAuth, setAdminAuth] = useState(!!localStorage.getItem(ADMIN_TOKEN_KEY));
  // 로딩 상태는 초기에 잠시 true였다가 토큰 확인 후 false로 변경
  const [loading, setLoading] = useState(true);

  // 컴포넌트 마운트 시 토큰 존재 여부만으로 상태 초기화 (더 이상 'true' 문자열 확인 안 함)
  useEffect(() => {
    // console.log('AuthProvider Mounted: Initial check for tokens.');
    setTeacherAuth(!!localStorage.getItem(TEACHER_TOKEN_KEY));
    setAdminAuth(!!localStorage.getItem(ADMIN_TOKEN_KEY));
    setLoading(false); // 토큰 확인 후 로딩 완료
  }, []);

  // 선생님 로그인 처리 함수 (JWT 토큰 사용)
  const teacherLogin = useCallback(async (password) => {
    try {
      console.log('AuthContext: teacherService.teacherLogin 호출 시도');
      // teacherService.teacherLogin 은 성공 시 { message: '...', token: '...' } 형태의 객체를 반환할 것으로 기대
      const responseData = await teacherService.teacherLogin(password);

      // 응답 데이터와 토큰 존재 여부 확인
      if (responseData && responseData.token) {
        console.log('AuthContext: 로그인 성공! 토큰 수신 및 저장');
        // 1. 로컬 스토리지에 JWT 토큰 저장
        localStorage.setItem(TEACHER_TOKEN_KEY, responseData.token);
        // 2. (매우 중요) 비밀번호는 절대 저장하지 않습니다! 아래 라인 제거.
        // localStorage.removeItem('teacherPassword'); // 혹시 남아있을 수 있으니 한번 더 제거
        // 3. React 상태 업데이트
        setTeacherAuth(true);
        // 4. (필요 시) axios 인스턴스에 즉시 헤더 설정 (인터셉터가 잘 동작하면 불필요)
        // api.defaults.headers.common['Authorization'] = `Bearer ${responseData.token}`;
        return true; // 성공 반환
      } else {
        // 백엔드가 토큰을 보내주지 않은 경우 (예상치 못한 상황)
        console.error('AuthContext: 로그인 응답에 토큰이 없습니다.', responseData);
        // 이전 상태 유지 및 오류 throw
        localStorage.removeItem(TEACHER_TOKEN_KEY); // 토큰 확실히 제거
        setTeacherAuth(false);
        throw new Error('로그인 응답 형식이 올바르지 않습니다.');
      }

    } catch (error) {
      console.error('AuthContext: 로그인 처리 중 오류 발생:', error.message || error);
      // 로그인 실패 시 토큰 관련 정보 모두 제거
      localStorage.removeItem(TEACHER_TOKEN_KEY);
      // localStorage.removeItem('teacherPassword'); // 이전 비밀번호 저장 제거
      setTeacherAuth(false);
      // 오류를 다시 throw하여 LoginPage에서 처리할 수 있도록 함
      throw error; // service에서 throw한 오류 객체를 그대로 전달
    }
  }, []); // useCallback으로 감싸 불필요한 재생성 방지

  // 선생님 로그아웃
  const teacherLogout = useCallback(() => {
    console.log('AuthContext: Teacher Logout');
    // 로컬 스토리지에서 토큰 제거
    localStorage.removeItem(TEACHER_TOKEN_KEY);
    // React 상태 업데이트
    setTeacherAuth(false);
    // (필요 시) axios 인스턴스 헤더 제거 (인터셉터가 잘 동작하면 불필요)
    // delete api.defaults.headers.common['Authorization'];
    // (필요 시) 백엔드 로그아웃 API 호출
  }, []);

  // --- 관리자 로그인/로그아웃 (JWT 방식으로 수정 필요 시 유사하게 변경) ---
  const adminLogin = async (password) => {
    // TODO: 관리자 로그인 API 호출 및 토큰 처리 로직 구현
    // try {
    //   const responseData = await adminService.adminLogin(password);
    //   if (responseData && responseData.token) {
    //     localStorage.setItem(ADMIN_TOKEN_KEY, responseData.token);
    //     setAdminAuth(true);
    //     return true;
    //   } else {
    //     throw new Error('관리자 로그인 응답 형식이 올바르지 않습니다.');
    //   }
    // } catch (error) {
    //   localStorage.removeItem(ADMIN_TOKEN_KEY);
    //   setAdminAuth(false);
    //   throw error;
    // }
    // 임시 Placeholder
    console.warn("Admin login logic not implemented with JWT yet.");
    localStorage.setItem('adminAuth', 'true'); // 임시 유지
    setAdminAuth(true);
    return true;
  };

  const adminLogout = useCallback(() => {
    // TODO: 관리자 토큰 제거 로직 구현
    // localStorage.removeItem(ADMIN_TOKEN_KEY);
    localStorage.removeItem('adminAuth'); // 임시 유지
    setAdminAuth(false);
  }, []);
  // --------------------------------------------------------------------

  // Context로 제공할 값들
  const value = {
    teacherAuth,
    adminAuth,
    loading,
    teacherLogin,
    teacherLogout,
    adminLogin, // 관리자 관련 기능 필요 시 유지
    adminLogout // 관리자 관련 기능 필요 시 유지
  };

  // 초기 로딩 중에는 children 렌더링 안 함 (선택적)
  // 로딩 중에도 children을 보여주고 싶다면 {!loading && children} 대신 그냥 {children} 사용
  return (
    <AuthContext.Provider value={value}>
      {children}
      {/* {!loading && children}  */}
      {/* 로딩 상태를 사용하여 초기 깜빡임 방지 가능 */}
    </AuthContext.Provider>
  );
};