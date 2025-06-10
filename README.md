# HR-MATE Backend

중소/중견기업(SMB)을 위한 종합 HR 플랫폼, HR-MATE의 백엔드 서버입니다.

## ✨ 주요 기능

- **사용자 관리:** 회원가입, 로그인 (JWT 기반 인증)
- **직원 정보 관리:** 직원 정보 등록, 조회, 수정, 삭제 (민감 정보 암호화)
- **근태 관리:** 출/퇴근 시간 기록
- **휴가 관리:** 휴가 신청, 조회 및 관리자의 승인/반려 처리
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
- [Docker Compose](https://docs.docker.com/compose/install/)

### 2. 프로젝트 클론 및 설치

```bash
$ git clone [저장소_URL]
$ cd HR_Backend
$ npm install
```

### 3. 환경 변수 설정

프로젝트 루트 디렉토리에 `.env` 파일을 생성하고 아래 내용을 참고하여 환경에 맞게 설정합니다.

```env
# 데이터베이스 설정
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=your_db_user
DB_PASSWORD=your_db_password
DB_DATABASE=your_db_name

# JWT 설정
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRATION_TIME=3600s

# 데이터 암호화 키 (32바이트, 64자리 16진수 문자열)
CRYPTO_SECRET_KEY=your_64_char_hex_secret_key

# 서버 포트
PORT=3000
```

> **참고:** `docker-compose.yml`에 정의된 기본 데이터베이스 정보를 사용할 수 있습니다.

### 4. 애플리케이션 실행 (개발 모드)

1.  **데이터베이스 컨테이너 실행**

    ```bash
    $ docker-compose up -d
    ```

2.  **NestJS 서버 실행**

    ```bash
    $ npm run start:dev
    ```

서버가 성공적으로 실행되면, `http://localhost:3000` 에서 접속할 수 있습니다.

---

## 📖 API 문서

서버 실행 후, `http://localhost:3000/api` 로 접속하면 Swagger API 문서를 확인할 수 있습니다. 각 API에 대한 상세한 설명과 테스트 기능을 제공합니다.

---

## 📁 프로젝트 구조

```
src
├── core/                # 인증, 가드 등 전역적으로 사용되는 핵심 모듈
├── domains/             # 비즈니스 로직을 담는 도메인별 모듈 (users, employees 등)
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

```bash
# 유닛 테스트
$ npm run test

# 테스트 커버리지
$ npm run test:cov
```
