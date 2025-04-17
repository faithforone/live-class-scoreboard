// React와 필요한 훅(hook)들을 가져옵니다.
import React, { useState } from 'react'; // useState: 컴포넌트 내부의 상태(값)를 관리
import { useNavigate } from 'react-router-dom'; // useNavigate: 페이지 이동 기능 제공
import { useAuth } from '../../contexts/AuthContext'; // useAuth: 우리가 만든 인증 관련 Context 사용

// TeacherLoginPage 컴포넌트(페이지) 정의
function TeacherLoginPage() {
  // --- 상태(State) 정의 ---
  // password: 사용자가 입력한 비밀번호를 저장할 변수
  // setPassword: password 변수의 값을 변경하는 함수
  const [password, setPassword] = useState(''); // 초기값은 빈 문자열

  // error: 로그인 시도 중 오류가 발생하면 오류 메시지를 저장할 변수
  // setError: error 변수의 값을 변경하는 함수
  const [error, setError] = useState(''); // 초기값은 빈 문자열

  // --- 훅(Hook) 사용 ---
  // AuthContext에서 제공하는 기능 중 teacherLogin 함수를 가져옵니다.
  const { teacherLogin } = useAuth();
  // react-router-dom에서 제공하는 페이지 이동 함수를 가져옵니다.
  const navigate = useNavigate();

  // --- 이벤트 핸들러 함수 ---
  // 사용자가 로그인 버튼을 클릭하거나 폼을 제출했을 때 실행될 함수
  const handleLogin = async (event) => {
    // 폼 제출 시 브라우저가 기본적으로 페이지를 새로고침하는 동작을 막습니다.
    event.preventDefault();
    // 새로운 로그인 시도를 하므로, 이전의 오류 메시지는 지웁니다.
    setError('');

    // 비밀번호가 입력되지 않았는지 확인합니다.
    if (!password) {
      setError('비밀번호를 입력해주세요.');
      return; // 함수 실행 중단
    }

    // try...catch 블록: 로그인 과정 중 발생할 수 있는 오류를 처리하기 위함입니다.
    try {
      // AuthContext에서 가져온 teacherLogin 함수를 호출합니다.
      // 사용자가 입력한 password 상태 값을 인자로 전달합니다.
      // await 키워드는 teacherLogin 함수가 완료될 때까지 기다리게 합니다.
      // teacherLogin 함수는 성공 시 resolve된 Promise를, 실패 시 reject된 Promise(오류)를 반환합니다.
      console.log('TeacherLoginPage: 로그인 시도...'); // 개발 확인용 로그
      await teacherLogin(password);

      // teacherLogin 함수가 성공적으로 완료되면 (오류가 발생하지 않으면) 이 코드가 실행됩니다.
      console.log('TeacherLoginPage: 로그인 성공, 페이지 이동...'); // 개발 확인용 로그
      // '/teacher/prepare' 경로로 페이지를 이동시킵니다.
      navigate('/teacher/prepare');

    } catch (err) {
      // teacherLogin 함수 실행 중 오류가 발생하면 (AuthContext에서 오류를 throw하면) 이 코드가 실행됩니다.
      console.error('TeacherLoginPage: 로그인 실패:', err); // 개발 확인용 로그
      // 사용자에게 보여줄 오류 메시지를 설정합니다.
      // err 객체에 message 속성이 있으면 그 값을 사용하고, 없으면 기본 메시지를 사용합니다.
      setError(err.message || '로그인에 실패했습니다. 비밀번호를 확인해주세요.');
    }
  };

  // --- JSX: 화면에 보여질 내용 ---
  return (
    // CSS 스타일링을 위한 클래스 이름들을 지정합니다. (index.css 참고)
    <div className="container">
      {/* 카드 형태로 감싸서 보기 좋게 만듭니다. style 속성으로 직접 스타일을 줄 수도 있습니다. */}
      <div className="card" style={{ maxWidth: '400px', margin: '50px auto' }}>
        <h2 className="card-title">선생님 로그인</h2>
        {/* onSubmit 이벤트를 사용하여 폼 제출 시 handleLogin 함수가 호출되도록 합니다. */}
        <form onSubmit={handleLogin}>
          {/* form-group 클래스로 라벨과 입력 필드를 묶습니다. */}
          <div className="form-group">
            <label htmlFor="password">비밀번호:</label>
            {/* 비밀번호 입력 필드 */}
            <input
              type="password" // 입력 내용을 점으로 표시
              id="password" // 라벨과 연결하기 위한 id
              value={password} // input의 값을 password 상태와 동기화
              onChange={(e) => setPassword(e.target.value)} // 입력값이 바뀔 때마다 password 상태 업데이트
              placeholder="비밀번호를 입력하세요" // 안내 문구
              required // HTML5 기본 유효성 검사 (필수 입력)
            />
          </div>

          {/* error 상태에 메시지가 있을 경우에만 <p> 태그를 화면에 렌더링합니다. */}
          {error && (
            <p style={{ color: 'red', marginBottom: '1rem', fontSize: '0.9em' }}>
              {error}
            </p>
          )}

          {/* 로그인 버튼 */}
          <button type="submit" className="btn btn-large">로그인</button>
        </form>
      </div>
    </div>
  );
}

// 다른 파일에서 이 컴포넌트를 사용할 수 있도록 내보냅니다.
export default TeacherLoginPage;