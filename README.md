# 라이브 클래스 스코어보드 (Live Class Scoreboard)

실시간으로 수업 중 학생들의 점수를 관리하고 표시하는 웹 기반 플랫폼입니다.

## 기능 요약

- 선생님이 수업 세션을 동적으로 생성하고 관리
- 실시간으로 학생들에게 점수 부여/차감
- 실시간 점수 변동 피드 및 위젯 제공
- 주별, 월별, 학기별 랭킹 제공
- 모바일 환경 최적화
- 학생 및 그룹 관리

## 기술 스택

- **Frontend**: React.js
- **Backend**: Node.js + Express
- **Database**: PostgreSQL
- **실시간 통신**: Socket.IO
- **배포**: AWS

## 설치 및 실행 방법

### 필수 요구사항

- Node.js (v14 이상)
- npm 또는 yarn
- PostgreSQL

### 백엔드 설정

```bash
# 서버 디렉토리로 이동
cd server

# 의존성 설치
npm install

# 환경 변수 설정 (.env 파일 수정)
# DB_USERNAME, DB_PASSWORD, DB_DATABASE 등 설정

# 개발 서버 실행
npm run dev
```

### 프론트엔드 설정

```bash
# 클라이언트 디렉토리로 이동
cd client

# 의존성 설치
npm install

# 환경 변수 설정 (.env 파일 수정)
# REACT_APP_API_URL, REACT_APP_SOCKET_URL 등 설정

# 개발 서버 실행
npm start
```

## 주요 URL 및 접근 방법

- **관리자 페이지**: `/admin/login` (관리자 비밀번호로 접근)
- **선생님 페이지**: `/teacher/login` (선생님 공유 비밀번호로 접근)
- **점수 피드**: `/feed/:urlIdentifier` (비밀번호 없이 URL로 접근)
- **점수 위젯**: `/widget/:urlIdentifier` (비밀번호 없이 URL로 접근)
- **랭킹 페이지**: `/rankings` (비밀번호 없이 URL로 접근)

## 배포 방법

### AWS 배포 방법

1. EC2 인스턴스 생성
2. RDS PostgreSQL 데이터베이스 설정
3. 프로젝트 클론 및 의존성 설치
4. PM2 또는 Docker를 사용하여 서버 실행
5. Nginx를 사용하여 리버스 프록시 설정

## 프로젝트 구조

```
live-class-scoreboard/
├── client/                 # 프론트엔드 (React)
│   ├── public/
│   └── src/
│       ├── components/     # 재사용 가능한 컴포넌트
│       ├── contexts/       # React 컨텍스트
│       ├── hooks/          # 커스텀 훅
│       ├── pages/          # 페이지 컴포넌트
│       ├── services/       # API 서비스
│       └── utils/          # 유틸리티 함수
│
├── server/                 # 백엔드 (Node.js + Express)
│   ├── config/             # 환경 설정
│   ├── controllers/        # 비즈니스 로직
│   ├── middlewares/        # 미들웨어
│   ├── models/             # 데이터베이스 모델
│   ├── routes/             # API 라우트
│   └── utils/              # 유틸리티 함수
```

## 라이센스

[MIT](LICENSE)
