# 목차
[1.프로젝트 개요](#프로젝트-개요)

[2.프로젝트 설치 및 실행 방법](#프로젝트-설치-및-실행-방법)

[3.팀 소개](#팀-소개)

# 프로젝트 개요
## 프로젝트 명 : GAME NEST
<img src="https://github.com/HA0N1/game-nest/assets/154482801/c36f61b4-f535-4eaf-b64a-047b56c7f34d" width="300" height="300"/>

## stack
### ✔️Frond-end

<img src="https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=Next.js&logoColor=white"><img src="https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=Next.js&logoColor=white"><img src="https://img.shields.io/badge/javascript-F7DF1E?style=for-the-badge&logo=Next.js&logoColor=white"><img src="https://img.shields.io/badge/handlebars.js-000000?style=for-the-badge&logo=Next.js&logoColor=white"><img src="https://img.shields.io/badge/axios-5A29E4?style=for-the-badge&logo=Next.js&logoColor=white">

### ✔️Back-end
<img src="https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=Next.js&logoColor=white"><img src="https://img.shields.io/badge/dotenv-ECD53F?style=for-the-badge&logo=html5&logoColor=white"> 


## 프로젝트 소개
게이머들의 고질적 고민인 '뭔 게임하지?'을 해소하기 위한 웹 서비스입니다.

개발 기간 : 24.03.26 ~ 24.05.02

# 프로젝트 설치 및 실행 방법
## 환경변수
DB_HOST=
<br/>
DB_PORT=
<br/>
DB_USERNAME=
<br/>
DB_PASSWORD=
<br/>
DB_NAME=
<br/>
DB_SYNC=
<br/>
JWT_SECRET_KEY=
<br/>
STATIC_FILES_PATH=boolean
<br/>
REDIS_URL=
<br/>
REDIS_USERNAME=
<br/>
REDIS_PASSWORD=
<br/>
LISTEN_IP=
<br/>
ANNOUNCED_IP=

```bash
npm install
cd public/
browserify chat.js -o bundle.js
cd ..
npm run start
```

# 팀 소개
|이름|역할|맡은 기능|
|:---:|:---|:---:|
|최하온|팀장|게임 채널 및 채팅 CRUD, WebRTC, 실시간통신, 서버 배포 및 관리|
|박세연|부팀장|회원가입, 로그인, 로그아웃, 프로필, DM, 친구 기능, 로드밸런서 및 도메인 인증서 생성|
|우승원|팀원|게임 저장 조회 검색, 댓글 CRUD, 크롤링|
|김상원|팀원|COMMUNITY 글, 댓글 CRUD, 크롤링|


