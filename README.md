# Regex Sequential Processor

텍스트 파일에 최대 5개의 정규표현식 치환 규칙을 정의된 순서대로 연속 적용하고, 원본과 결과를 나란히 비교하는 클라이언트 사이드 웹 앱입니다.

## 실행 방법

```bash
npm install
npm run dev
```

빌드:

```bash
npm run build
npm run preview
```

## 기술 스택

- Vite + React 18 + TypeScript
- Tailwind CSS
- Web Worker (정규식 실행, 3초 타임아웃)
- localStorage (규칙 자동 저장)
