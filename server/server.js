const http = require('http');
const app = require('./app');
const { sequelize } = require('./models');
// --- 아래 줄 추가 ---
const { Student, Group, SystemSetting } = require('./models'); // Student와 Group, SystemSetting 모델 가져오기 (SystemSetting은 이미 아래에서 사용 중)
// --- 위 줄 추가 ---
const setupSocket = require('./utils/socket');

const PORT = process.env.PORT || 5001;

// HTTP 서버 생성
const server = http.createServer(app);

// Socket.IO 설정
const socketIO = setupSocket(server);
app.set('socketIO', socketIO);

// 서버 시작
server.listen(PORT, async () => {
  console.log(`서버가 포트 ${PORT}에서 실행 중입니다.`);
  
  // 개발 환경에서는 테이블 동기화 (프로덕션에서는 마이그레이션 권장)
  if (process.env.NODE_ENV === 'development') {
    try {
      await sequelize.sync({ alter: true });
      console.log('데이터베이스 테이블이 동기화되었습니다.');
      
      // 초기 비밀번호 설정 (없는 경우에만)
      const { SystemSetting } = require('./models');
      
      // 교사 비밀번호 확인/생성
      const teacherPassword = await SystemSetting.findOne({
        where: { setting_key: 'teacher_password' }
      });
      
      if (!teacherPassword) {
        await SystemSetting.create({
          setting_key: 'teacher_password',
          setting_value: process.env.TEACHER_PASSWORD || 'teacher123'
        });
        console.log('기본 교사 비밀번호가 생성되었습니다.');
      }
      
      // 관리자 비밀번호 확인/생성
      const adminPassword = await SystemSetting.findOne({
        where: { setting_key: 'admin_password' }
      });
      
      if (!adminPassword) {
        await SystemSetting.create({
          setting_key: 'admin_password',
          setting_value: process.env.ADMIN_PASSWORD || 'admin123'
        });
        console.log('기본 관리자 비밀번호가 생성되었습니다.');
      }
      
       // 1. 그룹 데이터 시딩 (그룹 테이블이 비어있을 경우)
       const groupCount = await Group.count();
       if (groupCount === 0) {
         console.log('기본 그룹 데이터 생성 중...');
         await Group.bulkCreate([
           { name: '레드팀' },
           { name: '블루팀' }
         ]);
         console.log('기본 그룹 데이터 생성 완료.');
       } else {
         console.log('그룹 데이터가 이미 존재합니다. (시딩 건너뜀)');
       }
 
       // 2. 학생 데이터 시딩 (학생 테이블이 비어있을 경우)
       const studentCount = await Student.count();
       if (studentCount === 0) {
         console.log('기본 학생 데이터 생성 중...');
         // 참고: 지금은 그룹 없이 생성합니다. 필요시 위에서 생성된 그룹의 ID를 찾아서 넣어줄 수도 있습니다.
         await Student.bulkCreate([
           { name: '김민준', status: '대기중' },
           { name: '이서연', status: '대기중' },
           { name: '박하늘', status: '대기중' },
           { name: '최지우', status: '대기중' }
         ]);
         console.log('기본 학생 데이터 생성 완료.');
       } else {
         console.log('학생 데이터가 이미 존재합니다. (시딩 건너뜀)');
       }
 
       console.log('초기 데이터 확인 완료.');
 
       // --- 여기까지 초기 데이터 시딩 로직 추가 ---

    } catch (error) {
      console.error('데이터베이스 동기화 오류:', error);
    }
  }
});

// 종료 시그널 처리
process.on('SIGTERM', () => {
  console.info('SIGTERM 신호 수신. 서버를 종료합니다.');
  server.close(() => {
    console.log('프로세스 종료');
    process.exit(0);
  });
});
