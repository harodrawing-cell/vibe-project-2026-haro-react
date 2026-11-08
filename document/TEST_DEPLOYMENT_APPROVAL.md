# React GitHub Pages 테스트 배포 승인 대상

2026-11-08. 이번 단계는 최종 로컬 확인과 승인 대상 작성까지만 수행했다.

- 대상: `harodrawing-cell/vibe-project-2026-haro-react`, `main`.
- 읽기 전용 ls-remote 확인: 원격 main은 `ee8470c9f8cf72544735f79e3a5fd9c633be9a5e`, 로컬 HEAD와 일치.
- 기존 HTML은 별도 `harodrawing-cell/vibe-project-2026-haro` origin. 이 저장소 및 사용자 지정 운영 도메인 `mandaco.co.kr`은 변경 대상이 아니다.
- GitHub Desktop 내장 git을 발견해 사용했다. 시스템 PATH·전역 설정은 변경하지 않았다. 최초 sandbox 네트워크 자격 증명 오류 후 읽기 전용 재시도로 원격 main 확인 성공.
- 두 저장소 Pages API의 비인증 조회는404였다. 미활성·권한 제한 등을 구분할 수 없으므로 Pages/도메인 설정 미확인으로 유지한다.

## 승인 요청 범위

1. 아래 변경 파일만 리뷰·stage·commit 후 React main으로 Push. 기존 원격 기록을 보존하며 force push/기존 HTML 소스 수정 없음. 실행 직전 상태와 원격 갱신 여부를 다시 확인한다.
2. React 저장소 Pages의 기존 배포/Custom domain을 인증된 조회로 먼저 확인. `mandaco.co.kr` 또는 예상 밖 도메인 연결이 발견되면 제거·교체하지 말고 중단 보고한다. 문제가 없을 때 이 React 저장소만 Pages Source를 GitHub Actions로 설정한다.
3. 수동 workflow를 deploy:false로 실행해 빌드·artifact 확인 후 deploy:true로 테스트 배포. 자동 push 배포는 활성화하지 않는다. 예상 URL은 `https://harodrawing-cell.github.io/vibe-project-2026-haro-react/`다. 배포 성공 후 실제 반환 URL을 따로 기록한다.
4. 게시 사이트 읽기·이미지/CSS·HERO/Swiper·해시 라우트/새로고침·모바일 UI·공개 Firebase 연결·비로그인 비공개 접근을 검사한다. 실제 로그인/가입/답변·게시글 작성이 필요한 검사는 사전 안내하고, 임의로 기존 계정·운영 문서를 변경하지 않는다.

## 커밋 예정 파일

- `.github/workflows/deploy.yml`: workflow_dispatch 전용, deploy 기본 false, React repo/main 제한, Pages URL·도메인 검사.
- `scripts/check-dist.mjs`: React 산출물·자산 경로·CNAME 부재·개인키/서비스 계정 패턴 검사.
- `tests/react-build.cjs`: 테스트용 mount 경로 매개변수 추가. 애플리케이션 코드 수정 없음.
- `README.react.md`
- `document/DEPLOYMENT_PREPARATION.md`
- `document/TEST_DEPLOYMENT_APPROVAL.md`
- `document/REACT_MIGRATION.md`
- `document/REACT_VALIDATION.md`
- `task-history/task.md`

## 최종 확인 결과

`npm run build -- --base=/vibe-project-2026-haro-react/`와 `node scripts/check-dist.mjs /vibe-project-2026-haro-react/`를 이번에 실행해 성공했다. 현재 dist는 테스트 프로젝트 경로용이다. 로컬 기본 base:'./'는 유지하고 Actions가 빌드 CLI로 경로를 지정한다. 배포 루트는 dist/index.html의 React이며 원본 index.html은 보존한다. 민감정보 검사는 알려진 개인키·서비스 계정 패턴에 대한 검사로 모든 비밀 부재를 보장하는 것은 아니다.

같은 코드의 직전 검증에서 프로젝트 경로 이미지175개·7개 해시 라우트 직접 접근/새로고침, 52개 화면 상태·10개 기능 검사, 4너비 메인 비교를 통과했다. 변경 없는 기능을 불필요하게 재작성·중복 검사하지 않았다. 회원 Q&A5개 PASS·회원 로그인 결과를 유지한다. 사용자가 실제 iPhone 화면 문제 확인 완료를 보고했으며 상세 항목별 결과/수정 필요 여부는 별도 제공되지 않아 모든 iPhone 항목 PASS로 확대하지 않는다.

현재 실제 GitHub Actions 실행·배포 URL·배포 후 인증/신규가입/관리자 기능 검증은 미실행이다. 신규 가입, 관리자 명단 정당성 감사 및 AUTH-PRIVACY-01 등 기존 잔여 과제를 유지한다. 기존 운영 사이트와 분리된 호스팅이어도 Firebase는 동일 프로젝트이므로 테스트 사이트 쓰기는 운영 DB에 반영된다.

Commit·Push·Pages 설정 변경은 사용자 명시 지시에 따라 승인 대기 중이다. 이번 작업에서 데이터·계정·규칙·기존 운영 사이트/도메인 변경은 하지 않았다. 최종 mandaco.co.kr 전환은 별도 승인·대상/base/인증 도메인·DNS/HTTPS·롤백 계획 확정 후 수행한다.

## 실제 공개 실행을 위한 재확인 — 승인 대기

2026-11-08 사용자 후속 요청에 따라 현재 origin의 fetch/push 주소가 모두 React 저장소임을 재확인했다. 변경 파일은 위 9개와 같고 stage된 파일은 없다. 아직 Commit·Push하지 않았다.

제외 대상: dist/(CI에서 재생성), node_modules/, test-results/, 로그, .env 및 개인 설정·키·토큰, Firebase 규칙/인덱스·데이터, 원본 HTML/CSS/JS/이미지, .git 내부, 기존 HTML 저장소. 기존에 커밋된 앱·자산은 그대로 저장소에 남아 CI 빌드에 사용된다. 제외는 기존 추적 파일 삭제를 의미하지 않는다.

실제 배포 조건은 workflow_dispatch로 main 선택, 정확한 React 저장소, build 성공, deploy 입력 true, Pages Source가 workflow, custom domain 없음, 예상 프로젝트 URL 일치다. deploy:false 또는 입력 생략은 artifact 생성까지만 수행한다. deploy:true는 build 이후 actions/deploy-pages까지 실행하므로 실제 게시 경로가 이미 구현되어 있다. 자동 push 배포는 없다.

### 소유자의 Pages 설정 절차

React 저장소 `https://github.com/harodrawing-cell/vibe-project-2026-haro-react`에서 Settings → Pages → Build and deployment → Source → GitHub Actions를 선택한다. **Custom domain은 추가하지 않는다.** 기존 연결 도메인이 있거나 mandaco.co.kr이 표시되면 변경하지 말고 중단한다. 기존 HTML 저장소 Settings에는 들어가서 변경하지 않는다. github-pages environment에 reviewer 승인이 있으면 실제 배포 시 해당 승인이 필요하다.

### 승인 후 예정 명령

PowerShell, 현재 React 루트에서 실행한다. 먼저 원격 main 갱신 여부와 작업 파일을 재확인하며 예상 밖 변경은 함께 커밋하지 않는다.

```powershell
$gitExe = 'C:/Users/Administrator/AppData/Local/GitHubDesktop/app-3.6.10/resources/app/git/cmd/git.exe'
& $gitExe status --short
& $gitExe ls-remote origin refs/heads/main
& $gitExe add -- .github/workflows/deploy.yml scripts/check-dist.mjs tests/react-build.cjs README.react.md document/DEPLOYMENT_PREPARATION.md document/TEST_DEPLOYMENT_APPROVAL.md document/REACT_MIGRATION.md document/REACT_VALIDATION.md task-history/task.md
& $gitExe diff --cached --check
& $gitExe diff --cached --stat
& $gitExe commit -m 'Prepare manual React GitHub Pages test deployment'
& $gitExe push origin main
```

각 명령의 성공을 확인한 후 다음 단계로 진행한다. 원격이 앞서 있거나 충돌하면 force push하지 않고 조정한다. Pages 설정 확인 후 아래 명령은 **인증된 gh가 있는 환경에서** main workflow를 실제 배포 입력으로 수동 실행한다.

```powershell
gh workflow run deploy.yml --repo harodrawing-cell/vibe-project-2026-haro-react --ref main -f deploy=true
gh run list --repo harodrawing-cell/vibe-project-2026-haro-react --workflow deploy.yml --limit 5
# 위 결과에서 이번 run ID를 확인한 다음:
gh run watch RUN_ID --repo harodrawing-cell/vibe-project-2026-haro-react --exit-status
```

현재 gh CLI는 PATH에 없고 GitHub 관리 인증도 확보되지 않았다. Git 원격 읽기 성공은 Push·Pages 관리 권한의 증명이 아니다. 임의 도구 설치·토큰 추출 없이 사용 가능한 승인된 인증 경로를 확인하며, 없으면 소유자가 웹 UI로 Settings 설정과 Actions → HARO React Pages (manual) → Run workflow → main → deploy 체크(true) → Run workflow를 수행한다. 토큰을 채팅/저장소에 제공하지 않는다. 이 경우 실제 실행 결과를 확인하기 전 성공으로 보고하지 않는다.

승인 요청 범위는 위 9개 파일 Commit·React main Push, React 저장소 Pages Source 설정, deploy:true 수동 실행 및 배포 후 읽기/화면 검사다. 데이터·회원·Firebase 규칙·기존 운영 도메인 변경은 포함하지 않는다. 실제 회원가입/글쓰기/관리자 답변 재검사는 사전 안내 후 별도 합의된 테스트 대상으로만 수행한다.
