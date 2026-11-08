# HARO React 최종 검증·GitHub Actions 배포 준비

작성일: 2026-11-08(KST). **로컬 준비 완료, 원격 배포 미실행.** 사용자 승인 없이 Push, Pages 설정·도메인 변경, 배포, Firebase 규칙/데이터 변경을 하지 않았다.

## 회원 Q&A 최종 결과

2026-11-08 사용자 실제 브라우저 검증으로 다음 **5개 모두 PASS, 오류 없음**을 확정했다: B의 A 비공개 질문 접근 차단, A의 질문 수정·저장·새로고침 후 유지, M의 답변 등록·수정/답변완료, M의 답변 삭제/답변대기, A의 테스트 질문 삭제/목록 반영. 기존 회원 A 로그인·세션 유지·비공개 작성·본인 열람·제목 마스킹도 사용자 보고 PASS다. 에이전트가 운영 쓰기를 재실행하지 않았다. 신규 회원가입의 실제 운영 성공은 아직 보고되지 않았다.

## 저장소와 원격 확인 범위

| 대상 | 로컬에서 확인한 사실 |
|---|---|
| React 원격 origin | https://github.com/harodrawing-cell/vibe-project-2026-haro-react.git |
| 현재 브랜치 | .git/HEAD 기준 main |
| 별도 HTML 프로젝트 | 형제 폴더 vibe-project-2026-haro의 origin은 https://github.com/harodrawing-cell/vibe-project-2026-haro.git |
| 워크플로 | React 폴더에는 기존 workflows가 없었고 이번에 deploy.yml 신규 작성 |
| CNAME | 두 로컬 프로젝트 루트에서 확인되지 않음. 원격 커스텀 도메인 부재를 증명하지 않음 |

공개 GitHub/API 조회는 네트워크 오류로 완료하지 못했고 gh/git CLI도 현재 PATH에서 사용할 수 없었다. 따라서 원격 저장소 존재/접근 범위·main 최신 커밋·실제 Pages Source/활성 배포/도메인·IAM은 미확인이다. Git 기록·origin·HTML 프로젝트는 수정하지 않았다.

향후 승인 전 소유자가 **두 저장소 각각 Settings → Pages**에서 현재 URL, Source, branch/path 또는 Actions, Custom domain, HTTPS 상태를 읽기 전용 확인한다. 기존 운영 URL은 현재 확보되지 않았다. 이름만으로 운영 도메인을 추정하지 않는다. 사용자/조직 루트 Pages 사이트의 도메인 상속 가능성도 확인한다. 필요 시 원본 운영 설정 화면을 안전하게 보관하되 설정을 바꾸지 않는다.

## 빌드와 진입점

- Node v26.13.0, npm11.20.0. 설치된 Vite8.3.6의 engines(^20.19.0 또는 >=22.12.0)에 부합한다. 전역 설정·의존성 버전 변경 없음.
- npm run build 성공. 산출물 검사 성공. 원본 index.html은 기존 HTML 사이트이며 보존한다. react.html은 src/main.jsx의 React 개발 진입점이다. 빌드 플러그인이 **dist 안에서만** react.html을 index.html로 이름 변경하고 images를 복사한다.
- 개발: http://127.0.0.1:5173/react.html. 개발 서버의 /는 여전히 원본 HTML이다. 배포/preview: http://127.0.0.1:4173/ 는 dist/index.html의 실제 React다. 브라우저 React 컨테이너·컴포넌트 및 비레거시 스크립트 확인 성공.
- 개발·preview 서버를 실행해 유지했다. 직접 실행은 각각 npm run dev, npm run preview. 터미널의 Ctrl+C로 종료한다. preview는 로컬 검사 전용이다.
- 로컬 기본 base:'./' 유지. Actions는 npm run build -- --base=/vibe-project-2026-haro-react/로 프로젝트 경로를 명시한다. 향후 루트 도메인 배포는 --base=/로 별도 빌드한다.
- HashRouter 유지. 테스트 주소의 /#/qna 등은 Pages 서버에 /qna 파일을 요구하지 않는다. /qna 같은 해시 없는 경로와 과거 HTML 개별 주소는 리디렉트하지 않았으며404가 될 수 있다. 지원 URL은 /#/...로 안내한다.

## 이번 실제 실행 결과

| 검사 | 결과 |
|---|---|
| npm test | 5/5 PASS, 원본 자산/프런트 설정 보존 포함 |
| npm run test:browser | PASS, 52개 너비/페이지 상태와10개 기능 검사, 가로 넘침0·pageErrors0·brokenAssets0 |
| npm run test:visual | 1920/1024/768/390 비교 성공, 메인 HERO/ABOUT/EMOTICON/STORY/GOODS 위치·높이 차이0 |
| npm run build 및 check-dist | 성공, React 진입점·번들 경로·자격 증명 패턴 검사 통과 |
| npm run test:build | 상대 base의 /haro/ 및 실제 Pages 프로젝트 경로 각각 이미지175개 일치, 주요7개 경로 직접 접근/새로고침, 오류/누락0 |
| 운영 Firebase 읽기 | 2026-11-08 09:24:54 KST 시작한 새 Edge 컨텍스트에서 NOTICE8개/Q&A4개·공개상세 조회, 비공개 메타데이터 마스킹, 비공개 본문·답변 SDK 거절/REST403 확인 |

처음 브라우저·비교 실행은 dev 서버 미실행으로 connection refused였다. dev와 preview를 시작한 뒤 관련 검사를 다시 실행해 통과했다. Pages 경로 빌드를 검사한 후 일반 npm run build로 다시 만들어 현재 dist는 기본 상대 경로와 preview /에 맞춘 상태다. Actions 실행 시에는 잠금파일 기준 npm ci 후 프로젝트 경로 빌드를 새로 만든다. npm ci와 Linux Actions 원격 실행은 이번에 실행하지 않았다.

비교 캡처390px를 직접 확인했고 주요 메인 배치가 같았다. STORY 이미지는 랜덤이므로 서로 다를 수 있다. 단순 섹션 크기 일치로 모든 픽셀·서브페이지의 동일성을 주장하지 않는다. 이전 기록의 NOTICE breadcrumb/안내, 가입 도움말·높이, GOODS 초기 옵션/높이, CART 안내·버튼, 검색 내용/푸터 및 STORY 보조 안내 차이는 수정하지 않았으며 검토·수용 또는 별도 보완이 남는다.

증거: test-results/react/report.json, comparison.json 및 비교 캡처, test-results/deploy-prep-browser.log, deploy-prep-visual.log, test-results/security/deploy-prep-readonly.json/log. 기존 Emulator30·회귀36 PASS는 이전 실행 근거로 유지한다.

## 수동 Actions 구성

파일: [.github/workflows/deploy.yml](../.github/workflows/deploy.yml). 공식 [Vite Pages 가이드](https://vite.dev/guide/static-deploy)와 [GitHub Pages workflow 안내](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)를 바탕으로 구성했다.

- workflow_dispatch만 존재하며 push/pull_request/schedule 자동 실행 없음.
- React 저장소의 main에서만 build 실행. Node26, npm cache, npm ci, npm test, 프로젝트 base 빌드, 산출물 검사, dist Pages artifact 업로드.
- 공식 가이드에 제시된 checkout/setup-node/configure-pages/upload-pages-artifact/deploy-pages를 커밋 SHA로 고정했다.
- deploy 입력 기본 false: 수동 실행해도 기본은 빌드·artifact 준비까지만 수행. true 선택 시에만 별도 deploy job 실행.
- Pages 배포 권한은 deploy job에만 부여. github-pages environment 사용. 보호 reviewer는 원격에서 미설정/미확인이다. 소유자가 배포 승인 정책을 확인해야 한다.
- Pages 자동 활성화 옵션 없음. 소유자가 사전에 승인한 Actions Pages 설정이 필요하다. 배포 job은 현재 Pages가 workflow 방식이고 cname이 없으며 예상 프로젝트 URL과 일치할 때만 배포한다. 다른 도메인·URL이면 중단한다.
- dist만 업로드하며 CNAME·원본 HTML·Firestore 규칙/서버 자격 증명은 배포하지 않는다. check-dist의 비밀 패턴 검사는 서비스 계정/개인키 같은 알려진 패턴 검사이며 모든 가능한 비밀 탐지를 보장하지 않는다.

Actions YAML과 검사 코드는 로컬 검토했으나 실제 GitHub 실행을 하지 않았으므로 runner 권한·Pages environment 승인·artifact 배포 성공은 미검증이다.

## 테스트 배포와 최종 전환

예상 테스트 URL: **https://harodrawing-cell.github.io/vibe-project-2026-haro-react/**. 현재 게시된 주소라는 뜻은 아니다. 상세 페이지 예: /#/qna. 이 저장소의 Pages도 이미 사용 중이라면 배포 시 기존 이 저장소 Pages가 교체되므로 승인 전에 실제 사용처를 확인한다. 별도 브랜치나 environment만으로 Pages가 별도 미리보기 사이트가 되는 것은 아니다.

승인 후 순서: 변경 리뷰 → 사용자 승인 범위의 커밋/Push → React 저장소 Pages Source를 GitHub Actions로 설정(별도 승인) → 먼저 deploy:false 수동 실행·artifact 검토 → 배포 승인 후 deploy:true 수동 실행 → 결과 URL/HTTPS·자산·해시 경로·인증/권한·실기기 재검사. 이 문서 작성으로 어느 원격 단계도 수행하지 않았다.

기존 HTML 저장소/운영 Pages/도메인을 변경하지 않는 별도 프로젝트 테스트 배포다. 단, 동일 Firebase를 사용하므로 테스트 사이트의 사용자가 회원가입/게시글 저장을 하면 운영 Firebase에 실제 데이터가 생긴다. 호스팅 분리와 DB 분리는 다르다. 운영 데이터를 복제하지 않는다.

최종 운영 전환은 별도 결정이다. 대상 저장소·도메인/기존 URL 호환·base:/·Firebase 허용 도메인·DNS/HTTPS·롤백 계획을 확정하고 별도 승인을 받아야 한다. 이 수동 workflow는 프로젝트 테스트 경로 전용이므로 운영 도메인에 그대로 실행하지 않는다.

## Firebase·배포 전 남은 사항

- 기존 프로젝트 haro-web-project 유지. Firebase web 설정은 공개 식별 설정이며 VITE_*는 번들에 포함된다. 개인키·Admin SDK·서버 비밀을 넣지 않는다. .env.example만 존재하며 현재 dist에서 서비스 계정/개인키 패턴을 발견하지 않았다. 별도 비밀을 Actions에 등록하지 않았다.
- Auth Console의 Settings/Authorized domains는 관리 인증이 없어 미조회다. 실제 테스트 호스트 harodrawing-cell.github.io의 허용 여부와 API key의 HTTP referrer 제한, 최종 운영 호스트를 운영자가 확인해야 한다. URL 경로가 아닌 호스트 기준으로 점검한다. 이번에는 도메인 설정을 변경하지 않았다.
- 실계정 로그인·세션 유지와 Q&A 회원/관리자5개는 사용자 PASS. 신규 회원가입은 Emulator 통과 및 운영 가입 전 조회 정상까지이며 운영 가입 완료는 미검증이다.
- 승인된 관리자 M의 기능 성공은 확인됐지만 users.role/admins.enabled 전체 명단 정당성 감사는 미실행이다. 서버 규칙은 보존했으며 Console 원문 일치 여부는 별도 확인 필요.
- AUTH-PRIVACY-01의 UID/계정 존재 노출은 남는다. 테스트 배포 전 공개 범위에 맞는 위험 수용/개선 결정이 필요하다.
- 실제 iPhone Safari/카카오톡 인앱에서 텍스트 색상·첫 터치/HERO·Swiper 제스처·키보드/회전/safe-area·스토리지·로그인 유지 검증은 미완료다. Edge390px 통과와 구분한다.

판정: **로컬 최종 빌드와 수동 배포 준비 완료. 원격 배포 가능 상태의 모든 전제 확인 및 실제 배포는 미완료.**
