// live-class-scoreboard/server/routes/teacher.js

const express = require('express');
const router = express.Router();
// auth 미들웨어에서 verifyTeacherToken 함수를 import 합니다.
const { verifyTeacherToken } = require('../middlewares/auth'); // <<< 수정: verifyTeacherToken import
// const { verifyTeacherPassword } = require('../middlewares/auth'); // 이전 import 는 제거하거나 주석처리

// teacherController 객체 전체를 가져옵니다.
const teacherController = require('../controllers/teacherController');

// --- 로그인 라우트 ---
// 로그인은 인증 미들웨어 적용 전에 처리해야 합니다.
router.post('/login', teacherController.login);

// --- 이하 모든 라우트에 선생님 JWT 토큰 인증 미들웨어 적용 ---
router.use(verifyTeacherToken); // <<< 수정: import 한 verifyTeacherToken 사용

// --- 학생 관련 라우트 ---
// (이제 자동으로 verifyTeacherToken 미들웨어가 적용됩니다)
router.get('/students', teacherController.getAllStudents);
router.get('/available-students', teacherController.getAvailableStudents);

// --- 그룹(템플릿) 관련 라우트 ---
router.get('/groups', teacherController.getGroups);
router.get('/groups/:groupId/students', teacherController.getGroupStudents);

// --- 수업 세션 관련 라우트 ---
router.post('/sessions', teacherController.createClassSession);
router.put('/sessions/:sessionId/end', teacherController.endClassSession);
router.get('/active-session', teacherController.getMyActiveSession);

// --- 점수 관련 라우트 ---
router.post('/score', teacherController.updateScore);

// --- 히스토리 관련 라우트 ---
router.get('/my-sessions', teacherController.getMySessionHistory);

// 라우터 모듈을 export 합니다.
module.exports = router;