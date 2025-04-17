const express = require('express');
const cors = require('cors');
const { sequelize } = require('./models');

// 라우트 임포트
const adminRoutes = require('./routes/admin');
const teacherRoutes = require('./routes/teacher');
const viewerRoutes = require('./routes/viewer');

const app = express();

// 미들웨어
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 라우트
app.use('/api/admin', adminRoutes);
app.use('/api/teacher', teacherRoutes);
app.use('/api/viewer', viewerRoutes);

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
