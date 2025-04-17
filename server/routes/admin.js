const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { verifyAdminPassword } = require('../middlewares/auth');

// 관리자 인증 미들웨어 적용 (비밀번호 확인)
router.use(verifyAdminPassword);

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
