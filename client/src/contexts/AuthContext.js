import React, { createContext, useState, useEffect, useContext } from 'react';
// teacherService.js 에서 만든 API 서비스 함수들을 가져옵니다.
import * as teacherService from '../services/teacherService';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [teacherAuth, setTeacherAuth] = useState(false);
  const [adminAuth, setAdminAuth] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 로컬 스토리지에서 인증 상태 확인
    const checkAuthStatus = () => {
      const teacherAuthStatus = localStorage.getItem('teacherAuth') === 'true';
      const adminAuthStatus = localStorage.getItem('adminAuth') === 'true';
      setTeacherAuth(teacherAuthStatus);
      setAdminAuth(adminAuthStatus);
      setLoading(false);
    };
    
    checkAuthStatus();
  }, []);

// 선생님 로그인 처리 함수 (TeacherLoginPage에서 이 함수를 호출)
  // async 키워드를 추가하여 비동기 함수로 만듭니다. teacherService.teacherLogin이 비동기이기 때문입니다.
  const teacherLogin = async (password) => {
    // 이 함수는 TeacherLoginPage 컴포넌트로부터 password를 받습니다.
    // try...catch 블록으로 teacherService.teacherLogin 호출 중 발생할 수 있는 오류를 처리합니다.
    try {
      // teacherService의 teacherLogin 함수를 호출하고, 완료될 때까지 기다립니다(await).
      // password를 인자로 전달합니다.
      console.log('AuthContext: teacherService.teacherLogin 호출 시도'); // 개발 확인용 로그
      await teacherService.teacherLogin(password);

      // teacherService.teacherLogin 함수가 성공적으로 완료되면 (오류 없이 끝나면) 아래 코드가 실행됩니다.
      console.log('AuthContext: 로그인 성공! 상태 업데이트 및 저장'); // 개발 확인용 로그
      // 1. 로컬 스토리지에 로그인 상태를 'true'로 저장하여 새로고침해도 유지되도록 합니다.
      localStorage.setItem('teacherAuth', 'true');
      localStorage.setItem('teacherPassword', password);
      // 2. React의 상태 변수 teacherAuth를 true로 변경하여 관련 UI가 업데이트될 수 있도록 합니다.
      setTeacherAuth(true);
      // (성공했으므로 특별히 반환할 값은 없지만, Promise는 자동으로 resolve됩니다.)
      return true;

    } catch (error) {
      // teacherService.teacherLogin 함수에서 오류를 throw하면 이 catch 블록이 실행됩니다.
      console.error('AuthContext: 로그인 처리 중 오류 발생:', error); // 개발 확인용 로그
      // 1. 혹시 로컬 스토리지에 남아있을 수 있는 이전 로그인 정보를 삭제합니다.
      localStorage.removeItem('teacherAuth');
      localStorage.removeItem('teacherPassword');
      // 2. React 상태 변수 teacherAuth를 false로 설정합니다.
      setTeacherAuth(false);
      // 3. 받은 오류(error)를 다시 throw 합니다.
      //    이것이 중요합니다! 이렇게 해야 이 함수를 호출한 TeacherLoginPage 컴포넌트의
      //    catch 블록에서 이 오류를 받아서 사용자에게 오류 메시지를 보여줄 수 있습니다.
      throw error;
    }
  };

  // 선생님 로그아웃
  const teacherLogout = () => {
    localStorage.removeItem('teacherAuth');
    localStorage.removeItem('teacherPassword');
    setTeacherAuth(false);
  };

  // 관리자 로그인
  const adminLogin = (password) => {
    return new Promise((resolve, reject) => {
      // API 호출 코드는 여기에 들어갈 예정
      // 성공하면 로컬 스토리지에 인증 상태 저장 및 상태 업데이트
      localStorage.setItem('adminAuth', 'true');
      setAdminAuth(true);
      resolve(true);
    });
  };

  // 관리자 로그아웃
  const adminLogout = () => {
    localStorage.removeItem('adminAuth');
    setAdminAuth(false);
  };

  const value = {
    teacherAuth,
    adminAuth,
    loading,
    teacherLogin,
    teacherLogout,
    adminLogin,
    adminLogout
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
