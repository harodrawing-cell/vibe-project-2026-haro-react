# Vercel 배포 보안 검증 및 Search Console 재검토 근거

검증일: 2026-11-08. 대상: https://vibe-project-2026-haro-react.vercel.app/
사용자가 확인한 Production 배포 커밋: f8e70aa. 이번 검사는 해당 공개 URL의 실제 응답과 브라우저 동작을 대상으로 했으며, 응답만으로 커밋 ID를 독립적으로 증명한 것은 아니다.

## 실제 검증 결과

| 항목 | 결과 | 확인 방법 및 범위 |
| --- | --- | --- |
| 실제 계정 로그인 | PASS | 사용자 직접 실행 결과 보고 |
| 새로고침 후 로그인 유지 | PASS | 사용자 직접 실행 결과 보고 |
| 로그아웃 | PASS | 사용자 직접 실행 결과 보고 |
| CSP frame-ancestors 'none' | PASS | 공개 URL HTTP 200 응답 헤더 확인 |
| X-Frame-Options: DENY | PASS | 공개 URL HTTP 200 응답 헤더 확인 |
| 로그인·회원가입 헤더 적용 | PASS | HashRouter의 /#/login, /#/signup은 동일 루트 문서를 사용하며 같은 헤더 적용 |
| 외부 iframe 차단 | PASS | 별도 localhost origin의 부모 페이지에서 실제 배포 로그인·회원가입을 iframe으로 요청. 두 경우 모두 폼이 표시되지 않고 브라우저가 frame-ancestors 위반으로 요청 차단을 명시 |
| 주요 화면의 헤더 관련 오류 | PASS (검사 범위) | 메인·로그인·회원가입·NOTICE·Q&A·GOODS·CART 본문 렌더링 확인. JavaScript pageerror 0, 정상 최상위 화면 CSP 오류 0 |

실제 응답:

```http
HTTP 200
Content-Security-Policy: frame-ancestors 'none'; object-src 'none'; base-uri 'self'
X-Frame-Options: DENY
```

실제 iframe 차단 메시지: `Framing 'https://vibe-project-2026-haro-react.vercel.app/' violates the following Content Security Policy directive: "frame-ancestors 'none'". The request has been blocked.`

근거: 로컬 test-results/security/final-deployed-security.json 및 test-results/security/safebrowsing/browser-report.json. 테스트 산출물은 Git 제외 경로에 보관한다. 자동화 검사에서는 인증정보 입력이나 데이터 쓰기를 실행하지 않았다.

frame-ancestors와 X-Frame-Options는 이 사이트를 감싸는 부모 프레임을 제한한다. 현재 CSP에는 Firebase 요청을 제한하는 connect-src 또는 script-src가 없고, HashRouter 경로 변경도 요구하지 않는다. 따라서 검사 범위에서 인증·라우팅과의 충돌은 발견되지 않았다. iframe 거절은 CSP가 명시적으로 확인됐으며 X-Frame-Options 단독 차단은 따로 분리 시험하지 않았다.

## 미검증 및 별도 과제

- 최신 배포에서 회원가입 제출, 모든 인증 상태의 게시판 쓰기·관리자 답변 등 전체 서비스 재검증은 이번 읽기 전용 검사에 포함하지 않았다. 기존 Q&A 권한 PASS 기록은 유지한다.
- 실제 개인정보 수집 목적·보관 기간·삭제/탈퇴 처리 정책은 운영자 확인과 안내 보완이 필요하다. 현재 안내를 완성된 개인정보처리방침으로 표현하지 않는다.
- AUTH-PRIVACY-01(아이디·이메일 정확 일치 조회의 계정 존재 여부/UID 노출), 관리자 명단 적정성 점검 등 기존 별도 과제는 해결 완료로 변경하지 않는다.
- Google은 예시 URL을 제공하지 않았고 경고의 정확한 원인은 미확정이다. 이번 보완이 경고 원인을 제거했다거나 오탐이라고 단정할 수 없다.

## Search Console 재검토 요청 초안

> 이 사이트는 만다꼬(MANDACO)가 운영하는 HARO 공식 웹사이트의 React 전환 테스트 사이트입니다. 기존 공식 사이트는 https://www.mandaco.co.kr/ 이며, 운영 관계를 명확하게 알리기 위해 로그인·회원가입 페이지에 운영 주체, 테스트 사이트 안내, 공식 사이트 링크와 문의 이메일(harodrawing@gmail.com)을 추가했습니다. 인증 처리 코드와 배포 리소스를 조사한 범위에서 비밀번호 탈취 코드나 의심스러운 비밀번호 외부 전송은 발견되지 않았으며, 인증은 Firebase Authentication을 사용합니다. 외부 사이트의 화면 삽입을 방지하도록 CSP frame-ancestors 'none'과 X-Frame-Options: DENY를 적용했습니다. 2026-11-08 실제 공개 URL의 응답 헤더 및 별도 origin에서 로그인·회원가입 iframe 차단을 확인했습니다. 실제 계정의 로그인, 새로고침 후 로그인 유지, 로그아웃도 정상 확인했습니다. 주요 7개 화면에서는 JavaScript 오류와 정상 화면 CSP 오류가 관찰되지 않았습니다. 예시 URL이 제공되지 않아 특정 탐지 원인은 확정하지 않았으며, 위 수정 및 검증 내역을 근거로 사이트 재검토를 요청합니다.

위 사실을 근거로 재검토를 요청할 자료는 준비됐다. 제출 전 Search Console의 다른 미해결 보안 항목 유무를 확인하고 실제 적용 범위와 일치하는 내용만 제출한다. Google의 해제 결정이나 처리 기간은 보장하지 않는다. 이번 작업에서 재검토 요청 자체는 제출하지 않았다.

앱 코드·설정 변경, Commit·Push·재배포, 기존 운영 사이트 및 Firebase/Supabase 데이터·규칙 변경 없음. 문서에 결과만 추가했다.
