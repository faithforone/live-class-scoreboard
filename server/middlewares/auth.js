const { SystemSetting } = require('../models');

// 선생님 비밀번호 확인 미들웨어
exports.verifyTeacherPassword = async (req, res, next) => {
  try {
    const passwordFromBody = req.body.password;
    const passwordFromHeader = req.headers.password;
    const password = passwordFromBody || passwordFromHeader; // 본문에 있으면 그걸 쓰고, 없으면 헤더에서 찾음

    // 비밀번호가 본문에도 헤더에도 없는 경우 오류 처리
    if (!password) {
      // console.log('인증 미들웨어: 요청 본문 및 헤더에 비밀번호 없음'); // 디버깅용 로그
      return res.status(400).json({ message: '비밀번호가 필요합니다.' });
    }

    const teacherPassword = await SystemSetting.findOne({
      where: { setting_key: 'teacher_password' }
    });

    if (!teacherPassword || teacherPassword.setting_value !== password) {
      return res.status(401).json({ message: '잘못된 비밀번호입니다.' });
    }

    next();
  } catch (error) {
    console.error('선생님 인증 오류:', error);
    res.status(500).json({ message: '인증 처리 중 오류가 발생했습니다.' });
  }
};

// 관리자 비밀번호 확인 미들웨어
exports.verifyAdminPassword = async (req, res, next) => {
  try {
    const { password } = req.body;
    
    if (!password) {
      return res.status(400).json({ message: '비밀번호가 필요합니다.' });
    }

    const adminPassword = await SystemSetting.findOne({
      where: { setting_key: 'admin_password' }
    });

    if (!adminPassword || adminPassword.setting_value !== password) {
      return res.status(401).json({ message: '잘못된 관리자 비밀번호입니다.' });
    }

    next();
  } catch (error) {
    console.error('관리자 인증 오류:', error);
    res.status(500).json({ message: '인증 처리 중 오류가 발생했습니다.' });
  }
};
