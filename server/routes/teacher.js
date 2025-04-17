const express = require('express');
const router = express.Router();
// auth 미들웨어를 가져옵니다.
const { verifyTeacherPassword } = require('../middlewares/auth');

// teacherController 객체 전체를 가져옵니다.
const teacherController = require('../controllers/teacherController');

// 선생님 인증 미들웨어 적용 (이 라우터의 모든 경로에 적용)
router.use(verifyTeacherPassword);

// --- 로그인 라우트 ---
// (verifyTeacherPassword를 통과하면 성공으로 간주)
router.post('/login', (req, res) => {
  res.status(200).json({ message: 'Teacher login successful' });
});

// --- 학생 관련 라우트 ---
// teacherController 객체를 통해 함수를 참조합니다.
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