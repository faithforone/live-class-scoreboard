// live-class-scoreboard/server/config/config.js

// .env 파일의 환경 변수를 로드하기 위해 dotenv 설정
// server.js나 app.js 등 시작 파일에서 이미 로드했다면 여기서 중복 호출할 필요는 없습니다.
// 만약 다른 곳에서 로드하지 않았다면 아래 코드의 주석을 해제하세요.
// require('dotenv').config();

module.exports = {
  development: {
    username: process.env.DB_USERNAME || 'sam', // .env 파일의 DB_USERNAME 또는 기본값
    password: process.env.DB_PASSWORD || null,      // .env 파일의 DB_PASSWORD 또는 기본값
    database: process.env.DB_DATABASE || 'live_class_scoreboard_dev', // .env 또는 기본값
    host: process.env.DB_HOST || '127.0.0.1',       // .env 또는 기본값
    dialect: 'postgres',                             // 수정: postgres 로 변경
    // 필요 시 다른 Sequelize 옵션 추가 가능
    // dialectOptions: {
    //   ssl: { require: true, rejectUnauthorized: false } // 예: Heroku Postgres 등 SSL 필요 시
    // }
  },
  test: {
    username: process.env.DB_USERNAME_TEST || 'postgres',
    password: process.env.DB_PASSWORD_TEST || null,
    database: process.env.DB_DATABASE_TEST || 'live_class_scoreboard_test',
    host: process.env.DB_HOST_TEST || '127.0.0.1',
    dialect: 'postgres', // 수정: postgres 로 변경
    logging: false // 테스트 시에는 로그 끄기
  },
  production: {
    username: process.env.DB_USERNAME_PROD || 'postgres',
    password: process.env.DB_PASSWORD_PROD || null, // 프로덕션 비밀번호는 반드시 .env 에서 설정
    database: process.env.DB_DATABASE_PROD || 'live_class_scoreboard_prod',
    host: process.env.DB_HOST_PROD || '127.0.0.1', // 프로덕션 호스트는 보통 다름
    dialect: 'postgres', // 수정: postgres 로 변경
    logging: false, // 프로덕션에서는 필요한 로그만 남기도록 설정
    // dialectOptions: { // 필요 시 프로덕션 DB 옵션 추가
    //   ssl: { require: true, rejectUnauthorized: false }
    // },
    // pool: { // 프로덕션 환경에서는 커넥션 풀 설정 권장
    //   max: 5,
    //   min: 0,
    //   acquire: 30000,
    //   idle: 10000
    // }
  }
};