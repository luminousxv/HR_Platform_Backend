# HR-MATE Backend

중소/중견기업(SMB)을 위한 종합 HR 플랫폼, HR-MATE의 백엔드 서버입니다.

## ✨ 주요 기능

- **사용자 관리:** 회원가입, 로그인 (JWT 기반 인증)
- **직원 정보 관리:** 직원 정보 등록, 조회, 수정, 삭제 (민감 정보 암호화)
- **근태 관리:** 출/퇴근 시간 기록
- **휴가 관리:** 휴가 신청, 조회 및 관리자의 승인/반려 처리
- **급여 관리 (예정):** 월별 급여 명세서 생성 및 직원 급여 정보 관리
- **역할 기반 접근 제어 (RBAC):** 관리자와 일반 직원 역할 분리

## 🛠️ 기술 스택

- **Framework:** [NestJS](https://nestjs.com/)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Database:** [PostgreSQL](https://www.postgresql.org/)
- **ORM:** [TypeORM](https://typeorm.io/)
- **Authentication:** [JWT](https://jwt.io/), [Passport](http://www.passportjs.org/)
- **Containerization:** [Docker](https://www.docker.com/), [Docker Compose](https://docs.docker.com/compose/)
- **API Documentation:** [Swagger](https://swagger.io/)

---

## 🚀 시작하기

### 1. 요구 사항

- [Node.js](https://nodejs.org/) (v18 이상 권장)
- [npm](https://www.npmjs.com/)
- [Docker](https://www.docker.com/products/docker-desktop/)

### 2. 프로젝트 클론 및 의존성 설치

```bash
# git clone [저장소_URL] # 아직 원격 저장소가 없으므로, 로컬에서 진행
cd HR_Backend
npm install
```

### 3. 환경 변수 설정

`HR_Backend` 루트 디렉토리에 `.env.dev` 파일을 생성하고 아래 내용을 복사하여 붙여넣습니다.
이 파일은 `docker-compose.yml` 실행 시 데이터베이스 컨테이너와 NestJS 애플리케이션에서 사용됩니다.

**`.env.dev` 내용:**

```env
# 데이터베이스 설정 (docker-compose.yml과 연동)
DB_HOST=postgres_db
DB_PORT=5432
DB_USERNAME=admin
DB_PASSWORD=admin
DB_DATABASE=hr_mate_db

# JWT 설정 (운영 환경에서는 반드시 변경)
JWT_SECRET=your_super_secret_jwt_key_for_development
JWT_EXPIRES_IN=1h

# 데이터 암호화 키 (아래는 예시 값이므로, 실제로는 openssl 명령어로 새로 생성하여 사용하세요)
# openssl rand -hex 32  (32바이트 키 생성)
# openssl rand -hex 16  (16바이트 IV 생성)
CRYPTO_KEY=c3a5e7d2f9b1c8e4a9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0e9d8c7b6
CRYPTO_IV=b2a1f0e9d8c7b6a5e4d3c2b1a0f9e8d7

# 서버 포트
PORT=3000
```

> **보안 경고:** 위 예시에 포함된 `JWT_SECRET`, `CRYPTO_KEY`, `CRYPTO_IV`는 개발용 예시입니다. 실제 운영 환경에서는 반드시 `openssl` 등의 도구를 사용하여 예측 불가능한 강력한 무작위 문자열로 교체해야 합니다.

### 4. Docker를 이용한 개발 환경 실행

1.  **Docker Compose로 데이터베이스 및 서버 실행:**

    아래 명령어를 실행하면 `docker-compose.yml`에 정의된 `postgres_db` 서비스와 `app` 서비스(NestJS)가 함께 실행됩니다.
    `-d` 옵션은 백그라운드에서 실행하도록 합니다.

    ```bash
    docker-compose --env-file ./.env.dev up -d --build
    ```

2.  **서버 접속 확인:**

    서버가 성공적으로 실행되면, `http://localhost:3000` 에서 접속할 수 있습니다.

---

## 📖 API 문서

서버 실행 후, `http://localhost:3000/api` 로 접속하면 Swagger API 문서를 확인할 수 있습니다. 각 API에 대한 상세한 설명과 테스트 기능을 제공합니다.

---

## 📁 프로젝트 구조

```
src
├── core/                # 인증, 가드 등 전역적으로 사용되는 핵심 모듈
├── domains/             # 비즈니스 로gic을 담는 도메인별 모듈 (users, employees 등)
│   ├── [domain_name]/
│   │   ├── dto/
│   │   ├── entities/
│   │   ├── enums/
│   │   ├── [domain_name].controller.ts
│   │   ├── [domain_name].module.ts
│   │   └── [domain_name].service.ts
│   └── ...
└── shared/              # 여러 도메인에서 공유되는 유틸리티, 서비스 등
```

---

## 🧪 테스트

현재 프로젝트는 초기 개발 단계로, 안정적인 기능 구현에 집중하기 위해 단위/통합 테스트 코드(`*.spec.ts`) 대신 Postman을 이용한 E2E 테스트 및 수동 검증을 우선으로 진행하고 있습니다.

`HR_Backend/HR_Platform_API.postman_collection.json` 파일을 사용하여 모든 API를 테스트할 수 있습니다.

추후 주요 기능들이 안정화되면 Jest를 사용한 단위 및 통합 테스트 코드를 작성할 예정입니다.
