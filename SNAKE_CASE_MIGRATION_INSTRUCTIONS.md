# snake_case 마이그레이션 적용 가이드

이 프로젝트는 데이터베이스 컬럼명에 일관된 `snake_case` 규칙을 적용하기로 했습니다. 현재 발생하는 오류는 일부 코드에서 `camelCase`와 `snake_case`가 혼합되어 사용되어 발생한 것입니다.

## 중요: 마이그레이션 순서

마이그레이션을 시작하기 전 주의사항:
- 모든 데이터베이스 컬럼은 현재 `camelCase`로 되어 있습니다.
- 마이그레이션이 실행되기 전까지는 모든 쿼리에서 `camelCase` 컬럼명을 사용해야 합니다.
- 마이그레이션 후 모든 코드는 `snake_case` 컬럼명을 사용하도록 수정해야 합니다.

## 문제 해결 단계

### 1. 백엔드 서버 중지
```bash
# 현재 실행 중인 서버 중지
```

### 2. 새 마이그레이션 파일 확인
`server/migrations/20250417100000-fix-column-naming-conflicts.js` 파일이 생성되었는지 확인합니다. 이 파일은 다양한 테이블에서 `camelCase` 컬럼 이름을 `snake_case`로 변환하는 작업을 수행합니다.

### 3. 마이그레이션 실행
```bash
cd server
npx sequelize-cli db:migrate
```

### 4. 마이그레이션 후 모델 코드 변경
마이그레이션이 완료된 후, `adminController.js`에서 컬럼명 참조를 다시 `snake_case`로 변경해야 합니다:

1. `attributes: ['id', 'name', 'createdAt', 'updatedAt']` → `attributes: ['id', 'name', 'created_at', 'updated_at']`
2. `order: [['startTime', 'DESC']]` → `order: [['start_time', 'DESC']]`
3. `order: [['endTime', 'DESC']]` → `order: [['end_time', 'DESC']]`
4. `endTime: new Date()` → `end_time: new Date()`
5. `currentSessionId: null` → `current_session_id: null`
6. `where: { currentSessionId: session_id }` → `where: { current_session_id: session_id }`
7. `where: { sessionId: session_id }` → `where: { session_id: session_id }`
8. `whereClause.studentId = studentIds` → `whereClause.student_id = studentIds`

이러한 변경 사항은 마이그레이션이 성공적으로 실행된 후에만 적용해야 합니다.

### 5. Sequelize 모델 확인
모든 모델에 `underscored: true` 옵션이 설정되어 있는지 확인합니다. 이 옵션이 있어야 Sequelize가 JavaScript의 `camelCase` 속성 이름을 SQL의 `snake_case` 컬럼 이름으로 자동 변환합니다.

예시:
```javascript
{
  sequelize,
  modelName: 'ModelName',
  tableName: 'table_names',
  underscored: true  // 이 옵션이 중요합니다!
}
```

### 6. 명시적 속성 사용
SQL 쿼리에서 문제가 발생한 경우, Sequelize 쿼리에서 명시적으로 속성 이름을 지정하세요:

```javascript
Model.findAll({
  attributes: ['id', 'name', 'created_at', 'updated_at'], // snake_case 컬럼명 사용
  // ...
})
```

### 7. 주의사항
1. SQL 쿼리를 직접 작성할 때는 항상 `snake_case` 컬럼명을 사용하세요.
2. JavaScript 코드에서는 `camelCase` 속성명을 사용하세요.
3. 모든 Sequelize 모델에 `underscored: true` 옵션을 설정하세요.
4. Raw SQL 쿼리를 사용할 때는 특히 주의가 필요합니다.

### 8. 백엔드 서버 재시작
```bash
cd server
npm run dev
```

### 9. 프론트엔드 서버 재시작
```bash
cd client
npm start
```

## 향후 개발 시 가이드라인

1. 모든 테이블명은 복수형 `snake_case`를 사용합니다: `students`, `class_sessions`
2. 모든 컬럼명은 `snake_case`를 사용합니다: `first_name`, `created_at`
3. JavaScript/TypeScript 코드에서는 `camelCase`를 사용합니다: `firstName`, `createdAt`
4. 새 모델 생성 시 반드시 `underscored: true` 옵션을 추가합니다
5. README.md의 "데이터베이스 명명 규칙" 섹션을 참고하세요

문제가 지속될 경우 다음을 확인하세요:
1. 데이터베이스 스키마의 실제 컬럼명
2. Sequelize 모델의 속성명과 옵션
3. SQL 쿼리에서 사용된 컬럼명 