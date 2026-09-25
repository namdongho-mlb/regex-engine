# Regex Sequential Processor

텍스트 파일에 최대 6개의 정규표현식 치환 규칙을 정의된 순서대로 연속 적용하고, 원본과 결과를 나란히 비교하는 클라이언트 사이드 웹 앱입니다.

앱 시작 시 [`public/convert.py`](public/convert.py)의 `RULES` 목록을 자동으로 읽어 규칙을 로딩합니다. 각 규칙 행의 **적용/제외** 버튼으로 실행 여부를 토글할 수 있습니다.

- `convert.py 다시 불러오기`: 패턴·치환·플래그를 py 파일 기준으로 갱신 (적용/제외 설정은 유지)
- `규칙 가져오기`: `.py` 또는 `.json` 파일 업로드
- 텍스트 파일 인코딩 선택: UTF-8, EUC-KR, CP949 (Windows), ISO-8859-1 (변경 시 동일 파일 재디코딩)

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
