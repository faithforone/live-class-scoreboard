const express = require('express');
const router = express.Router();
const viewerController = require('../controllers/viewerController');

// 실시간 점수 피드 (인증 불필요)
router.get('/feed/:urlIdentifier', viewerController.getSessionFeed);

// 위젯 데이터 (인증 불필요)
router.get('/widget/:urlIdentifier', viewerController.getSessionWidget);

// 랭킹 페이지 (인증 불필요)
router.get('/rankings', viewerController.getRankings);

// 그룹 목록 조회 (랭킹 필터용)
router.get('/groups', viewerController.getGroups);

module.exports = router;
