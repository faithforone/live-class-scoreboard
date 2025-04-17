// live-class-scoreboard/server/middlewares/auth.js

const jwt = require('jsonwebtoken'); // jsonwebtoken 라이브러리 import
const { SystemSetting } = require('../models'); // verifyAdminPassword 에서 사용

// --- NEW: JWT 토큰 검증 미들웨어 (교사용) ---
exports.verifyTeacherToken = (req, res, next) => {
  try {
    // 1. Authorization 헤더에서 토큰 추출 ('Bearer <token>' 형식)
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // console.log('Token verification: Authorization header missing or invalid format.'); // 디버깅 로그
      return res.status(401).json({ message: '인증 토큰이 필요합니다. (Bearer 토큰 형식)' }); // 401 Unauthorized
    }

    const token = authHeader.split(' ')[1]; // 'Bearer' 다음의 토큰 부분 추출

    // 2. 토큰 유효성 검증
    // JWT_SECRET 값은 반드시 .env 파일에 정의되어 있어야 합니다!
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
        console.error('CRITICAL ERROR: JWT_SECRET is not defined in .env file.');
        // 실제 서비스에서는 로깅 시스템에 기록하는 것이 좋습니다.
        return res.status(500).json({ message: '서버 내부 설정 오류입니다.' });
    }

    jwt.verify(token, jwtSecret, (err, decoded) => {
      // err 객체로 유효성 검사 실패 또는 만료 여부 확인
      if (err) {
        // console.log('Token verification failed:', err.name, err.message); // 디버깅 로그
        if (err.name === 'TokenExpiredError') {
             // 토큰 만료 시 클라이언트가 재로그인하거나 토큰 갱신 로직 필요
             return res.status(401).json({ message: '인증 토큰이 만료되었습니다.', code: 'TOKEN_EXPIRED' });
        }
        // 그 외 서명 불일치, 형식 오류 등
        return res.status(403).json({ message: '유효하지 않은 인증 토큰입니다.', code: 'INVALID_TOKEN' }); // 403 Forbidden
      }

      // 3. 토큰이 유효한 경우, decoded 된 정보(payload)를 req 객체에 추가
      //    - 토큰 생성 시 넣은 정보를 여기서 사용할 수 있습니다.
      //    - 예: payload 에 { role: 'teacher' } 가 포함되어 있는지 확인
      if (decoded.role !== 'teacher') {
           // console.log('Token verification: Role mismatch.', decoded.role); // 디버깅 로그
           return res.status(403).json({ message: '접근 권한이 없습니다 (교사 역할 아님).', code: 'INSUFFICIENT_ROLE' }); // 403 Forbidden
      }

      // console.log('Token verified successfully. Attaching user:', decoded); // 디버깅 로그
      // req.user 에 디코딩된 페이로드 전체 또는 필요한 정보 저장
      // 이후 라우트 핸들러에서 req.user 를 통해 인증된 사용자 정보 접근 가능
      req.user = decoded;
      next(); // 다음 미들웨어 또는 라우트 핸들러로 진행
    });

  } catch (error) {
    // 예상치 못한 오류 처리 (예: 헤더 파싱 오류 등)
    console.error('Token verification middleware internal error:', error);
    res.status(500).json({ message: '인증 처리 중 예기치 않은 오류가 발생했습니다.' });
  }
};


// --- OLD: 선생님 비밀번호 확인 미들웨어 (더 이상 사용 안 함) ---
/*
exports.verifyTeacherPassword = async (req, res, next) => {
  try {
    const passwordFromBody = req.body.password;
    const passwordFromHeader = req.headers.password;
    const password = passwordFromBody || passwordFromHeader;

    if (!password) {
      return res.status(400).json({ message: '비밀번호가 필요합니다.' });
    }

    const teacherPassword = await SystemSetting.findOne({
      where: { settingKey: 'teacher_password' }
    });

    if (!teacherPassword || teacherPassword.settingValue !== password) {
      return res.status(401).json({ message: '잘못된 비밀번호입니다.' });
    }

    next();
  } catch (error) {
    console.error('선생님 인증 오류:', error);
    res.status(500).json({ message: '인증 처리 중 오류가 발생했습니다.' });
  }
};
*/

// --- 관리자 비밀번호 확인 미들웨어 (일단 유지) ---
exports.verifyAdminPassword = async (req, res, next) => {
  try {
    const { password } = req.body; // 관리자 비밀번호는 보통 요청 본문에서 받음

    if (!password) {
      return res.status(400).json({ message: '비밀번호가 필요합니다.' });
    }

    // DB 또는 환경 변수에서 관리자 비밀번호 조회
    const adminPasswordSetting = await SystemSetting.findOne({
      where: { settingKey: 'admin_password' }
    });
    // DB에 없으면 환경 변수 확인 (선택적)
    const correctPassword = adminPasswordSetting ? adminPasswordSetting.settingValue : process.env.ADMIN_PASSWORD;

    if (!correctPassword) {
        console.error("Admin password not found in SystemSetting or .env.");
        // 실제 서비스에서는 관리자에게 알림 등 조치 필요
        return res.status(500).json({ message: '관리자 비밀번호가 설정되지 않았습니다.' });
    }

    if (correctPassword !== password) {
      return res.status(401).json({ message: '잘못된 관리자 비밀번호입니다.' });
    }

    // 필요 시 관리자 정보 추가
    // req.user = { role: 'admin' };

    next();
  } catch (error) {
    console.error('관리자 인증 오류:', error);
    res.status(500).json({ message: '인증 처리 중 오류가 발생했습니다.' });
  }
};