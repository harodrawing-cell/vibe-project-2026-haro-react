# Actions #1 실패 분석 및 로컬 최소 수정

2026-11-08. 대상 [실행 #1](https://github.com/harodrawing-cell/vibe-project-2026-haro-react/actions/runs/42432041762), 커밋 b9102ff7cc141ea65e7a97594a7475505d6aa6d1. 원격 작업 변경·재실행·Commit·Push는 하지 않았다.

## 원격에서 실제 확인된 결과

GitHub API jobs/annotations 조회로 checkout 성공, setup-node 성공, **npm ci 성공, npm test 실패(exit1)**를 확인했다. Vite build·산출물 검사·artifact 업로드는 모두 skipped, deploy도 skipped다. 따라서 ‘build job 실패’와 ‘npm run build 실패’는 구분해야 한다. 이번 실행에서 Vite는 아직 실행되지 않았다.

원문 job 로그 API는 인증 필요로403, 공개 HTML도 Sign in to view logs였다. 사용자가 Run npm test 전체 오류를 제공하도록 요청했다. 원격의 정확한 실패 테스트명·expected/actual·설치된 Node/npm 패치 버전은 아직 확인하지 못했다. Ubuntu 전환 알림은 있으나 실패 원인이라는 증거는 없다.

## 독립 재현된 문제

원본 해시 기준은 Windows CRLF 파일에서 생성됐지만 Git HEAD의 텍스트는 LF다. git ls-files --eol에서 index.html 및 원본 규칙 백업의 index LF/worktree CRLF를 확인했다. 원본 inventory 중67개 경로의 HEAD 바이트 해시가 기준과 달랐다.

실제 HEAD index.html의 SHA256은 f873d4f54f5ee39d0ebd87bca61f7216c8cdcb85aac65a38f0e923ec2c7098e7, 기준은2090ca42bced7afb7271c6e43cf4c0519f063f8b0202ca096cbce675b943c40b다. 파일 읽기를 LF로 만드는 로컬 하네스로 npm test를 실행하면 첫 원본 보존 검사에서 이 index.html 해시 불일치가 발생하고 다른4개는 통과했다.

이는 CI를 막는 재현 가능한 테스트 결함이다. 다만 원문 로그 미확보 상태이므로 **이 재현 오류가 Actions #1의 실제 오류와 일치하는지는 추가 확인 필요**다.

## 최소 수정

tests/react-services.test.js만 수정했다. 원본 해시는 보존한다. HTML/CSS/JS/JSON/rules 텍스트는 원시 해시 또는 LF→CRLF 정규화 해시가 기존 기준과 일치해야 한다. 규칙 보존 블록 비교도 줄바꿈만 정규화한다. 이미지 등 바이너리는 바이트 단위 검사 그대로 유지한다. 원본 파일·백업·앱·Vite·workflow·의존성·lockfile은 변경하지 않았다. 테스트 단계를 제거하거나 실패를 무시하지 않았다.

## 점검 및 검증

| 항목 | 결과와 한계 |
|---|---|
| Windows npm test | 수정 전/후5개 PASS |
| LF 체크아웃 모사 | 수정 전 index.html 실패, 수정 후5개 PASS. 실제 Linux 실행과 구분 |
| 검사 강도 | 텍스트 줄바꿈 차이 허용, 내용 변조 거절, 바이너리 줄바꿈 변경 거절 확인 |
| Node/npm | workflow Node26, 로컬 Node26.13.0/npm11.20.0. Vite 지원 범위 충족. 원격 setup-node/npm ci 성공, 원격 세부 버전 로그는 미확보 |
| npm ci/lock | 원격 ci 성공이므로 이번 실패 단계는 의존성 설치가 아님. 로컬에서 ci를 불필요하게 재실행하거나 lockfile을 갱신하지 않음 |
| 누락/대소문자 | HEAD에서 react.html, vite.config.mjs, package/lock, check-dist 추적 확인. src의 정적 상대 import 경로를 Git 추적 파일명과 정확히 대조해 누락·대소문자 불일치0. 동적 런타임 경로 전체를 증명하는 검사는 아님 |
| 배포용 build | npm run build -- --base=/vibe-project-2026-haro-react/ 성공 |
| 산출물 검사 | node scripts/check-dist.mjs /vibe-project-2026-haro-react/ 성공 |
| build/deploy 구성 | 수동 dispatch, main/정확한 저장소 제한, deploy:true와 build 성공 필요. 이번에는 npm test 실패로 후속 단계 미실행. 원격 수정 후 재실행 성공은 미확인 |

ignored test-results/ci-failure/에 원문 HTML·LF 재현 로그·하네스를 보관했다. 자격 증명을 추출하거나 공유하지 않았다.

## 승인 및 다음 단계

수정 예정 커밋 범위는 tests/react-services.test.js, 이 분석 문서, document/REACT_MIGRATION.md, task-history/task.md의4개다. 사용자에게 원문 npm test 로그로 실패 일치 여부를 확인받고 Commit·Push 승인을 요청한다. 승인 전 Commit·Push·workflow 재실행 없음. 기존 HTML 운영 사이트·mandaco.co.kr·Firebase 데이터/규칙 변경 없음.

## 사용자 오류 확인 및 원본 대조 확정 — 2026-11-08

사용자가 Actions #1의 tests/react-services.test.js에서 index.html 실제 SHA와 기준 SHA 불일치 AssertionError였음을 확인했다. 이는 위 LF 재현 실패와 일치한다. 원문 전체 로그의 별도 확보 여부와 구분하며, Node/의존성 오류로 추정하지 않는다.

현재 index.html과 형제 HTML 프로젝트 vibe-project-2026-haro/index.html은 **바이트 단위로 동일**하다. 두 파일 모두 기준 SHA256 2090ca42bced7afb7271c6e43cf4c0519f063f8b0202ca096cbce675b943c40b와 일치하며 CRLF600개다. HEAD, HEAD^, ee8470c, 전환 전7083837 및 원본의 마지막 변경 커밋3cb8bd5의 index.html은 모두 LF SHA f873d4f54f5ee39d0ebd87bca61f7216c8cdcb85aac65a38f0e923ec2c7098e7이고, 현재 파일과 줄바꿈 정규화 후 완전히 같다.

판정: 기준이 오래되어 내용이 달라진 것이 아니라 **원본 내용은 보존됐고 체크아웃 줄바꿈만 다르다.** 해시 목록이나 원본 파일·규칙 백업을 수정하지 않고, 기존 테스트가 허용하는 줄바꿈 처리만 최소 보완한 안을 유지한다.

이번 요청에 따라 npm test를 먼저 실행해5/5 PASS를 확인한 다음 npm run build 성공을 확인했다. 이어 LF 모사5/5 PASS 및 기본 상대 base 산출물 검사 성공을 확인했다. 이전 검증의 변조 텍스트 거절·바이너리 바이트 검사도 유지한다. WSL 실행 환경은 사용할 수 없어 실제 로컬 Linux 테스트는 실행하지 않았다. 수정 후 GitHub Linux runner의 실제 성공은 재실행 전까지 미검증이다.

추가 기능 코드는 수정하지 않았다. 최종 변경 범위는 테스트 파일1개와 분석·마이그레이션·작업이력 문서3개다. Commit·Push 승인을 요청하며, 기존 Git 기록·원본 운영 HTML·React 기능·Firebase 데이터/규칙·도메인은 그대로 보존한다.
