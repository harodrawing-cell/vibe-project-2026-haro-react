# 로그인 신뢰성·iframe 보안 보완

작성일: 2026-11-08(KST). **로컬 구현·검증 완료, 미배포.** Google Search Console의 ‘사용자 로그인 시 의심되는 피싱 감지됨’ 경고 원인을 확정하거나 자동 해제를 보장하지 않는다. 예시 URL은 제공되지 않았다는 사용자 보고를 기준으로 한다.

## 반영한 변경

- src/pages/AccountPage.jsx: 로그인·가입 카드 안에 ‘이 페이지는 만다꼬에서 운영하는 HARO 웹사이트의 React 테스트 버전입니다.’를 작게 표시했다. 만다꼬(MANDACO)/HARO, 공식 사이트 https://www.mandaco.co.kr 링크, mailto:harodrawing@gmail.com 링크를 제공한다. 비밀번호 복구 안내의 기존 이메일 철자도 확인된 주소로 수정했다.
- src/layouts/Footer.jsx: 문의 이메일을 확인된 harodrawing@gmail.com으로 수정했다. 기존 이미지·소셜 링크·배치/설명은 보존했다.
- src/styles/react.css: 안내 영역에만13px 글자·줄바꿈·링크 밑줄·여백을 적용했다. 기존 버튼·색상·반응형 규칙은 변경하지 않았다. 안내 추가에 따른 카드 높이 증가는 의도된 변화다.
- vercel.json 신규: 모든 응답에 CSP `frame-ancestors 'none'; object-src 'none'; base-uri 'self'`, X-Frame-Options DENY, X-Content-Type-Options nosniff, Referrer-Policy strict-origin-when-cross-origin을 설정했다. 기존 vercel.json이 없어 덮어쓴 설정은 없다.
- tests/react-security-headers.cjs 신규: 같은 설정의 응답 헤더를 적용하는 로컬 정적 서버·다른 origin의 iframe 대조군·반응형/해시 새로고침 검사를 추가했다. 실제 Vercel 배포 검증과 구분한다.

header 설정만 추가했고 rewrites/redirects/functions/buildCommand/outputDirectory/API 라우팅은 추가·변경하지 않았다. CSP에 connect-src/script-src/frame-src 제한을 추가하지 않아 Firebase 요청/SDK나 자식 인증 프레임을 차단하는 정책을 만들지 않았다. frame-ancestors는 이 페이지가 다른 프레임에 삽입되는 것을 제한한다. 기존 코드·API의 실제 원격 동작 전체를 검증한 것은 아니다.

GitHub Pages workflow/base와 HashRouter, 원본 HTML/CSS/JS/이미지, Firebase/Supabase 설정·데이터·규칙·계정은 변경하지 않았다. 이 Vercel 설정은 별도 React 저장소를 사용하는 새 프로젝트에 적용할 목적이며 기존 haro-website나 mandaco.co.kr에 적용하지 않는다.

## 개인정보 안내의 확인 범위와 누락

현재 소스·기존 HTML 페이지에서 연결 가능한 개인정보처리방침 문서/라우트를 찾지 못했다. 새 가짜 방침이나 잘못된 링크는 만들지 않았다. 가입 화면에는 실제 입력 항목(이름·아이디·이메일·비밀번호)과 개인정보 처리 관련 문의처만 추가했다. 이것을 완성된 개인정보처리방침이나 법적 적합성 확인으로 표현하지 않는다.

운영자가 확정해야 할 내용:

1. 항목별 실제 수집·이용 목적과 필요성.
2. 보관 기간·기산 시점·예외·삭제/파기 기준.
3. 탈퇴·삭제 요청 접수/본인 확인/처리 절차. 현재 기능 이상으로 즉시 삭제나 자동 탈퇴를 약속하지 않음.
4. 실제 정책 문서의 내용·URL 및 필요한 안내/동의 방식.
5. Firebase 등 외부 처리 서비스에 관한 실제 운영 정보와 안내 범위.

비밀번호는 기존 Auth SDK로 전달하고 Firestore 프로필에 저장하지 않는 기존 구조를 유지했다. 추가 동의 이력 필드/컬렉션·규칙 변경은 하지 않았다. 확인되지 않은 법적 사업자 정보·정책·보관 기간은 작성하지 않았다.

## 실제 실행한 검증

| 항목 | 결과 및 범위 |
|---|---|
| npm test | 5/5 PASS. 원본 보존·인증 상태·Q&A 메타데이터·장바구니 보호 포함 |
| 기존 기능 회귀 | 31/31 PASS(account/NOTICE/Q&A/shop/story). 위5개와 합계36개. 테스트 대역이며 새 실계정 성공과 다름 |
| npm run build -- --base=/ | 최종 코드로 성공, 산출물 검사 성공 |
| 기존 브라우저 회귀 | 52개 화면 상태·10개 기능 검사 PASS. 오류·깨진 자산0. 운영 Auth/DB 요청 차단 및 테스트 대역 사용 |
| 새 안내 반응형 | 1920/1024/768/390px × login/signup8조합. 운영 안내·공식/문의 링크·새로고침·가로 넘침 없음 확인. 390px 가입 캡처 직접 확인 |
| iframe | 로컬 헤더 없는 대조군 login-form 렌더링 확인 후, 동일 origin 대상에 설정 헤더를 적용하면 다른 origin iframe에서 폼이 표시되지 않고 브라우저 차단 로그가 발생함을 확인 |
| Pages 호환 | /vibe-project-2026-haro-react/ base 빌드 및 mount 검사 통과. 이미지175개 일치,7개 해시 라우트 직접 접근·새로고침, 오류/누락0. 마지막에는 Vercel root-base dist로 재생성 |
| Google 인증 파일 | 기존·신규 public 인증 HTML 두 파일이 dist에 바이트 동일하게 보존됨 |
| 실제 운영 읽기 | 2026-11-08 15:51:22 KST 새 무인증 GET: 공개 목록200, 비공개 메타데이터3개 마스킹, 표본 본문/답변 모두403 PERMISSION_DENIED 및 내용 필드 없음. 데이터 변경 없음 |

초기 새 테스트 하네스에서 hash-only 이동의 page.goto 응답이 null인 문제가 있었으며, 헤더 검사를 별도 서버 GET으로 바꾼 뒤 최종 검사를 재실행해 통과했다. 앱의 오류를 숨기거나 검증을 생략하지 않았다.

근거: test-results/security/local-headers-report.json, signup-trust-390.png, trust-regression.log, test-results/react/report.json, test-results/security/safebrowsing/private-read-report.json. 테스트 산출물은 ignored 경로에 보관한다.

## 미검증·배포 후 확인

- 실제 계정 로그인 → 새로고침 → 로그아웃 연속 수행 및 실제 가입 성공은 이번에 미검증이다. 비밀번호·토큰·실제 계정은 사용/수집하지 않았다.
- Vercel에는 아직 Push/재배포하지 않았으므로 **운영 URL의 새 헤더 적용 및 iframe 차단 성공을 주장하지 않는다.** Vite preview 자체도 vercel.json을 적용하지 않는다. 이번 성공은 설정을 재현한 로컬 서버 기준이다.
- 승인 후 새 React 프로젝트 배포에서 실제 CSP/X-Frame-Options 응답, cross-origin iframe 거절, 정상 top-level 인증/화면, 해시 라우팅과 Google 인증 파일200을 재검증해야 한다.
- GitHub Pages는 Vercel 헤더 설정을 사용하지 않는다. 기존 Pages 배포 설정은 유지하며 Pages의 iframe 차단까지 해결했다고 주장하지 않는다.
- 실제 iPhone에서 이번 안내가 추가된 최종 화면 확인은 아직이다. 기존 버전 iPhone 정상 사용자 보고와 구분한다.
- 개인정보 정책 확인, AUTH-PRIVACY-01, 관리자 명단 감사·미사용 API 의존성 과제는 별도로 남는다.

Google 경고의 확정 원인은 여전히 미상이다. 이번 수정은 운영 관계 명확화와 확인된 방어 공백 보완이며, 오탐 판정이나 자동 경고 해제 조치가 아니다. 실제 배포 재검증·누락 정책 확인·검토 요청 근거 정리가 끝나기 전 ‘모든 문제 해결 완료’로 제출하지 않는다.

## 변경·승인 범위

이번 구현/검증5파일은 AccountPage.jsx, Footer.jsx, react.css, vercel.json, react-security-headers.cjs다. 보고서와 REACT_MIGRATION.md/task-history/task.md에도 기록했다. 기존 미커밋 PRODUCTION_CUTOVER_PLAN.md/SAFE_BROWSING_INVESTIGATION.md는 별도 이전 작업이며 임의 커밋하지 않았다. Commit·Push·Vercel 재배포·운영 전환 없음.

### 배포 준비 시 확정한 커밋 대상 — 총6개

1. src/pages/AccountPage.jsx
2. src/layouts/Footer.jsx
3. src/styles/react.css
4. vercel.json
5. tests/react-security-headers.cjs
6. document/LOGIN_SECURITY_HARDENING.md

document/REACT_MIGRATION.md와 task-history/task.md에는 이전 운영 전환 계획·Safe Browsing 조사와 이번 기록이 함께 섞여 있어 **이번에는 전체 파일을 커밋 대상에서 제외**한다. 해당 로컬 기록은 삭제/되돌림 없이 보존한다. 이전 미커밋 PRODUCTION_CUTOVER_PLAN.md와 SAFE_BROWSING_INVESTIGATION.md도 제외한다. dist/node_modules/test-results/환경변수/키는 포함하지 않는다. 기존 Google 인증 파일·Pages workflow·원본 HTML/이미지·Firebase 파일은 수정하거나 다시 커밋할 필요가 없다.

현재 stage는 비어 있으며 파일 목록만 정리했다. 사용자 승인 후 정확한6개 경로를 명시해 stage/검토하고 Commit·Push한다. 안내 문구와 문의 주소·전용 스타일 추가 외 기존 기능/버튼 디자인·라우팅 변경은 없고, 카드 높이는 안내문 추가만큼 늘어나는 의도된 차이다.
