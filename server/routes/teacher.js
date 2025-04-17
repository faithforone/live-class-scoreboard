const express = require('express');
const router = express.Router();
const teacherController = require('../controllers/teacherController');
const { verifyTeacherPassword } = require('../middlewares/auth');
// 이렇게 수정하세요 (쉼표 위치 주의):
const {
    getAllStudents,
    createSession,
    // ... 등등 다른 함수 이름들 ...
    getSessionDetails,
    getGroups,          // 추가
    getGroupStudents    // 추가
  } = require('../controllers/teacherController');

// 선생님 인증 미들웨어 적용 (단일 공유 비밀번호 확인)
router.use(verifyTeacherPassword);

// --- 아래 로그인 라우트 추가 ---
router.post('/login', (req, res) => {
    // verifyTeacherPassword 미들웨어를 통과했다는 것은 비밀번호가 맞았다는 의미입니다.
    // 따라서 여기서는 별다른 로직 없이 성공 응답만 보내주면 됩니다.
    res.status(200).json({ message: 'Teacher login successful' });
  });

// 학생 목록 조회
router.get('/students', teacherController.getAllStudents);
router.get('/available-students', teacherController.getAvailableStudents);

// 새 수업 세션 생성 및 관리
router.post('/sessions', teacherController.createClassSession);
router.put('/sessions/:session_id/end', teacherController.endClassSession);
router.get('/active-session', teacherController.getMyActiveSession);

// 점수 업데이트
router.post('/score', teacherController.updateScore);

// 내 수업 히스토리 조회
router.get('/my-sessions', teacherController.getMySessionHistory);
// 아래 두 줄을 추가하세요:
router.get('/groups', verifyTeacherPassword, getGroups);
router.get('/groups/:groupId/students', verifyTeacherPassword, getGroupStudents);
module.exports = router;
