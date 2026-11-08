# Actions #2 — SVG 줄바꿈 해시 검사 보완

2026-11-08. 대상 run42432905061, main 커밋23546777952e661d62f31584650b17386f7b7710. 사용자 제공 오류는 tests/react-services.test.js 약27행의 images/icons/behance-white.svg AssertionError(expected true, actual false)다.

## 원인

해당 행은 파일 존재 검사가 아니라 `matchesOriginal`의 **원본 내용 해시 검사**다. 파일이 없으면 readFileSync에서 ENOENT가 발생한다. 이번에는 파일을 읽었지만 허용 해시와 불일치해 assert.ok가 실패한 것이다.

Behance SVG는 로컬에 존재(434바이트)하고, Git HEAD에 정확히 images/icons/behance-white.svg로 추적된다. 원격 main을 ls-remote로 확인해 HEAD와 같은2354677임을 확인했으므로 원격 커밋에도 해당 파일이 있다. check-ignore 결과에도 제외 규칙이 없으며, 파일명 대소문자 문제도 아니다. index.html의 두 사용 위치와 src/layouts/Footer.jsx가 같은 경로를 사용한다.

별도 기존 HTML 프로젝트의 파일과 로컬 SVG는 바이트 단위로 동일하다. 기준/로컬 SHA256은 af41b20b8e511e6d78a29785fb32839ebf51a46ece1eab2e6dd56a13ac813082, Git LF SHA는431e0e25d8bdea497f55a77b4bbad62c93e30fc487699207af3cb998bba57905다. Git 텍스트를 CRLF로 정규화하면 원본 기준과 정확히 일치한다. 디자인/내용 변경은 없다.

이전 수정이 HTML/CSS/JS/JSON/rules만 텍스트로 분류해 **텍스트 이미지 SVG를 누락했다.** 이전 LF 모사 하네스도 SVG를 제외했으므로 이 결함을 잡지 못했다. 이번 수정은 그 누락을 보완한다.

## 최소 수정

tests/react-services.test.js의 텍스트 확장자 목록에 svg를 추가하고, 기존 원본 보호 테스트 안에서 모든 해당 텍스트의 LF 형태도 검사하게 했다. Windows에서 실행해도 SVG 포함 LF 호환성 회귀를 탐지한다. 기존 해시 목록·필수 파일 검사·바이너리 바이트 동일성 검사를 삭제하거나 완화하지 않았다. SVG 원본·이미지 경로·앱·Firebase·workflow는 수정하지 않았다.

## 실제 검증

- 필수 이미지175개 모두 로컬 존재 및 Git의 정확한 파일명/대소문자 추적 확인. 누락0. Git 경로 검사는 NUL 구분 출력으로 한글 파일명도 정확히 대조했다.
- Git cat-file --batch로 원본 보호 대상 텍스트71개(SVG17개 포함)를 **실제 HEAD blob 바이트**로 읽어 로컬 검사에 주입했다. 이전 확장자 기반 LF 변환 모사보다 실제 Git 체크아웃 내용을 직접 사용하는 검사다. 수정 후5/5 PASS.
- npm test:5/5 PASS. 이어 npm run build 성공, check-dist 성공.
- 실제 Linux 실행 자체는 로컬에서 하지 않았다. 수정 Push 후 새 Actions의 원격 결과는 아직 미검증이며, LF Git 바이트 검증을 Linux 성공으로 확대 보고하지 않는다.

ignored test-results/ci-failure/git-text-map.json, git-lf-checkout.cjs는 로컬 재현용이며 커밋 대상이 아니다.

## 변경 범위·승인

승인 요청 파일은 tests/react-services.test.js, document/ACTIONS_RUN2_DIAGNOSIS.md, document/REACT_MIGRATION.md, task-history/task.md의4개다. 승인 전 Commit·Push·Actions 재실행 없음. 필수 이미지는 이미 추적되어 별도 이미지 추가가 필요하지 않다. 기존 HTML 운영 사이트·mandaco.co.kr·Firebase 데이터/Security Rules·React 기능·이미지 디자인·Git 기록은 보존했다.
