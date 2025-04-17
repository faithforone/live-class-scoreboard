require('dotenv').config();

const http = require('http');
const app = require('./app');
// sequelize 인스턴스만 가져옵니다. 모델은 필요시 각 파일에서 db 객체를 통해 가져옵니다.
const { sequelize } = require('./models');
// 모델을 직접 가져오는 부분은 시딩 로직에서만 필요했으므로 제거하거나 시딩 로직과 함께 주석 처리합니다.
// const { Student, Group, SystemSetting } = require('./models');
const setupSocket = require('./utils/socket');

const PORT = process.env.PORT || 5001;

// HTTP 서버 생성
const server = http.createServer(app);

// Socket.IO 설정
const io = setupSocket(server); // setupSocket 반환 값을 io 변수에 저장 (app.set 에서 사용 위함)
app.set('io', io); // 수정: socketIO 대신 io 변수 사용, 키 이름도 'io' 로 통일 권장 (컨트롤러에서 app.get('io') 사용)

// 서버 시작 함수
const startServer = async () => {
  try {
    // 데이터베이스 연결 확인
    await sequelize.authenticate();
    console.log('데이터베이스 연결 성공');

    // 서버 리스닝 시작
    server.listen(PORT, () => {
      console.log(`서버가 포트 ${PORT}에서 실행 중입니다.`);
    });

    // --- 개발 환경 초기 데이터 시딩 로직 (시더 파일로 옮기는 것을 권장) ---
    // if (process.env.NODE_ENV === 'development') {
    //   console.log('개발 환경: 초기 데이터 확인/생성 시작...');
    //   try {
    //     // 시딩 로직 시작
    //     const { Student, Group, SystemSetting } = require('./models'); // 시딩에 필요한 모델 로드

    //     // 초기 비밀번호 설정 (없는 경우에만)
    //     await SystemSetting.findOrCreate({
    //       where: { setting_key: 'teacher_password' },
    //       defaults: { setting_key: 'teacher_password', setting_value: process.env.TEACHER_PASSWORD || 'teacher123' }
    //     }).then(([setting, created]) => {
    //       if (created) console.log('기본 교사 비밀번호가 생성되었습니다.');
    //     });

    //     await SystemSetting.findOrCreate({
    //       where: { setting_key: 'admin_password' },
    //       defaults: { setting_key: 'admin_password', setting_value: process.env.ADMIN_PASSWORD || 'admin123' }
    //     }).then(([setting, created]) => {
    //       if (created) console.log('기본 관리자 비밀번호가 생성되었습니다.');
    //     });

    //     // 그룹 데이터 시딩 (그룹 테이블 비어있을 경우)
    //     const groupCount = await Group.count();
    //     if (groupCount === 0) {
    //       console.log('기본 그룹 데이터 생성 중...');
    //       await Group.bulkCreate([
    //         { name: '레드팀' },
    //         { name: '블루팀' }
    //       ]);
    //       console.log('기본 그룹 데이터 생성 완료.');
    //     }

    //     // 학생 데이터 시딩 (학생 테이블 비어있을 경우)
    //     const studentCount = await Student.count();
    //     if (studentCount === 0) {
    //       console.log('기본 학생 데이터 생성 중...');
    //       await Student.bulkCreate([
    //         { name: '김민준', status: '대기중' },
    //         { name: '이서연', status: '대기중' },
    //         { name: '박하늘', status: '대기중' },
    //         { name: '최지우', status: '대기중' }
    //       ]);
    //       console.log('기본 학생 데이터 생성 완료.');
    //     }
    //     console.log('초기 데이터 확인/생성 완료.');
    //   } catch (seedError) {
    //     console.error('초기 데이터 생성 중 오류 발생:', seedError);
    //   }
    // }
    // --- 시딩 로직 끝 ---

  } catch (error) {
    console.error('서버 시작 실패 (DB 연결 오류):', error);
    process.exit(1); // DB 연결 실패 시 프로세스 종료
  }
};

// 서버 시작 실행
startServer();


// !!! 아래 sequelize.sync() 호출 및 관련 로직 제거 !!!
/*
server.listen(PORT, async () => {
  console.log(`서버가 포트 ${PORT}에서 실행 중입니다.`);

  // 개발 환경에서는 테이블 동기화 (프로덕션에서는 마이그레이션 권장)
  // 마이그레이션을 사용하므로 이 블록 전체를 제거하거나 주석 처리합니다.
  if (process.env.NODE_ENV === 'development') {
    try {
      // await sequelize.sync({ alter: true }); // <<< 제거 대상!!!
      // console.log('데이터베이스 테이블이 동기화되었습니다.'); // <<< 제거 대상!!!

      // --- 시딩 로직 (별도 파일로 분리 권장) ---
      const { Student, Group, SystemSetting } = require('./models');

      // ... (시딩 로직) ...

      // --- 시딩 로직 끝 ---

    } catch (error) {
      console.error('데이터베이스 동기화 또는 시딩 오류:', error); // <<< 제거 대상!!!
    }
  }
});
*/


// 종료 시그널 처리 (유지)
process.on('SIGTERM', () => {
  console.info('SIGTERM 신호 수신. 서버를 종료합니다.');
  server.close(() => {
    console.log('HTTP 서버 종료됨.');
    // DB 커넥션 등 다른 리소스 정리 로직 추가 가능
    sequelize.close().then(() => { // DB 연결 종료
        console.log('데이터베이스 연결 종료됨.');
        process.exit(0);
    }).catch(err => {
        console.error('데이터베이스 연결 종료 중 오류 발생:', err);
        process.exit(1);
    });
  });

  // 강제 종료 타이머 (선택적)
  setTimeout(() => {
     console.error('정상 종료 시간 초과. 강제 종료합니다.');
     process.exit(1);
  }, 10000); // 10초
});