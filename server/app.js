const express = require('express');
const cors = require('cors');
const { sequelize } = require('./models');

// 라우트 임포트
const adminRoutes = require('./routes/admin');
const teacherRoutes = require('./routes/teacher');
const viewerRoutes = require('./routes/viewer');
const templateRoutes = require('./routes/api/templates');

const app = express();

// 임시 로컬 네트워크 사용을 위한 CORS 옵션 설정
const corsOptions = {
  origin: function (origin, callback) {
    // 개발 환경에서 임시로 모든 출처를 허용
    // 실제 프로덕션 환경에서는 이렇게 하면 안됨!
    callback(null, true);
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Auth-Token', 'Password']
};

// 미들웨어
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 라우트
app.use('/api/admin', adminRoutes);
app.use('/api/teacher', teacherRoutes);
app.use('/api/viewer', viewerRoutes);
app.use('/api/templates', templateRoutes);

// 기본 라우트
app.get('/', (req, res) => {
  res.send('라이브 클래스 스코어보드 API');
});

// 데이터베이스 연결 테스트
sequelize.authenticate()
  .then(() => console.log('데이터베이스 연결 성공'))
  .catch(err => console.error('데이터베이스 연결 실패:', err));

// 에러 핸들링 미들웨어
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send({ message: '서버 오류', error: err.message });
});

module.exports = app;
