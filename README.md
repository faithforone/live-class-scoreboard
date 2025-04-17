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

## 데이터베이스 명명 규칙 (DB Naming Conventions)

### 중요: 이 프로젝트는 데이터베이스 필드에 camelCase를 사용합니다.

1. **테이블 이름**: 복수형, snake_case (`students`, `class_sessions`, `score_logs`)
2. **컬럼 이름**: camelCase (`firstName`, `createdAt`, `updatedAt`)
3. **외래 키**: camelCase 형식 (`studentId`, `groupId`, `sessionId`)
4. **중간 테이블**: 두 테이블 이름을 조합하여 snake_case (`student_groups`, `template_groups`)

### Sequelize 모델 설정

모든 Sequelize 모델은 다음 설정을 포함해야 합니다:

```javascript
{
  sequelize,
  modelName: 'ModelName', // PascalCase
  tableName: 'table_names', // snake_case, 복수형
  underscored: false // 이 옵션이 필요합니다! DB에서 camelCase 사용
}
```

### JavaScript/TypeScript 코드 작성 시 주의사항

1. 모델 정의 시 속성은 camelCase로 정의하고, `underscored: false` 옵션을 활성화하여 DB에서도 camelCase 사용
2. SQL 쿼리 작성 시 항상 camelCase로 컬럼 참조 (`"updatedAt"`, `"createdAt"`)
3. 기존 모델을 수정할 때는 마이그레이션 파일 생성 필요

### 오류 해결 방법

데이터베이스 column 이름 충돌 오류가 발생하는 경우:

1. 모델 파일에서 `underscored: false` 설정 확인
2. 직접 SQL 쿼리를 사용하는 경우 컬럼 이름을 camelCase로 변경
3. 필요한 경우 마이그레이션 파일을 생성하여 컬럼 이름 변경

## 라이센스

[MIT](LICENSE)
