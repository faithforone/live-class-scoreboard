const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { auth } = require('../middleware/auth');

// Admin login route (needs to be before the middleware)
router.post('/login', (req, res) => {
  try {
    const { password } = req.body;
    
    // You might want to validate this against your database
    if (password === process.env.ADMIN_PASSWORD || password === '123') {
      // Generate a token for the admin
      const jwt = require('jsonwebtoken');
      const token = jwt.sign(
        { user: { id: 1, role: 'admin', password } },
        process.env.JWT_SECRET,
        { expiresIn: '1d' }
      );
      
      return res.json({ token });
    }
    
    return res.status(401).json({ message: 'Invalid password' });
  } catch (error) {
    console.error('Admin login error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

// 관리자 인증 미들웨어 적용 (JWT 토큰 확인)
router.use(auth);

// 학생 관리
router.get('/students', adminController.getAllStudents);
router.post('/students', adminController.createStudent);
router.put('/students/:student_id', adminController.updateStudent);
router.delete('/students/:student_id', adminController.deleteStudent);

// 그룹 관리
router.get('/groups', adminController.getAllGroups);
router.post('/groups', adminController.createGroup);
router.put('/groups/:group_id', adminController.updateGroup);
router.delete('/groups/:group_id', adminController.deleteGroup);

// 그룹-학생 연결 관리
router.post('/groups/:group_id/students', adminController.addStudentToGroup);
router.delete('/groups/:group_id/students/:student_id', adminController.removeStudentFromGroup);

// 비밀번호 관리
router.post('/password', adminController.updatePassword);

// 랭킹 기간 설정
router.post('/ranking-period', adminController.updateRankingPeriod);

// 활성 수업 세션 관리
router.get('/active-sessions', adminController.getActiveSessions);
router.put('/active-sessions/:session_id/end', adminController.forceEndSession);

// 종료된 수업 세션 조회
router.get('/completed-sessions', adminController.getCompletedSessions);
router.get('/sessions/:session_id/logs', adminController.getSessionScoreLogs);

// 점수 초기화
router.post('/reset-scores', adminController.resetScores);

// 시스템 설정 조회
router.get('/settings', adminController.getSystemSettings);

module.exports = router;
