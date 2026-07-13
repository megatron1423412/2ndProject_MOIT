# MOIT 브랜드·카테고리 자산 안내

모든 교체 가능 자산은 Vite의 `public` 폴더에서 제공합니다. 아래 파일을 같은 이름으로 교체하면 코드 수정 없이 메인 헤더와 챗봇 사이드바에 반영됩니다.

## 브랜드 로고

- 전체 로고: `public/assets/brand/moit-logo.svg`
- 접힌 사이드바 로고: `public/assets/brand/moit-logo-compact.svg`
- 권장 포맷: 투명 배경 SVG
- 권장 캔버스: 정사각형 또는 충분한 여백이 있는 SVG. 화면 크기는 컴포넌트 CSS가 고정하므로 파일의 픽셀 크기에 의존하지 않습니다.

파일이 아직 없거나 읽을 수 없으면 기존 Sparkles 기반 브랜드 마크가 자동으로 표시됩니다.

## 카테고리 아이콘

아이콘 위치: `public/assets/icons/categories/`

- `appliances.svg`
- `telecom.svg`
- `air-conditioner.svg`
- `tv.svg`
- `refrigerator.svg`
- `vacuum.svg`
- `phone.svg`
- `internet.svg`
- `iptv.svg`
- `bundle.svg`

이 경로는 `src/app/data/categories.ts`의 `iconPath`에 연결되어 있습니다. 파일이 없을 때는 기존 Lucide 아이콘이 fallback으로 사용되어 깨진 아이콘이 보이지 않습니다.

## 색상과 파일 형식

`CategoryIcon`은 외부 아이콘을 CSS `mask-image`와 `background-color: currentColor`로 표시합니다. 따라서 단색 SVG(권장)는 `fill` 또는 `stroke`를 `currentColor`로 작성하거나, 경로 자체가 마스크로 읽히는 형태로 내보내세요. 활성/hover/라이트/다크 모드의 색상은 기존 테마 CSS 변수와 `currentColor`가 자동 적용합니다.

투명 배경의 단색 PNG도 알파 채널이 뚜렷하면 마스크로 사용할 수 있지만, 해상도와 가장자리는 SVG보다 불리합니다. 여러 색이 들어간 PNG/JPG는 한 색 마스크로 변환하기에 적합하지 않으므로 CSS filter로 억지로 녹색 처리하지 마세요. 원본 색상을 유지하는 별도 표시 방식을 쓰거나, 녹색 단색 SVG를 제공해야 합니다.

## 구매등급진단 SNS 공유 아이콘

- Instagram 공식 원본 아이콘: `public/assets/brands/social/instagram.svg`
- Threads 공식 원본 아이콘: `public/assets/brands/social/threads.svg`
- TikTok 승인 자산 교체 위치: `public/assets/brands/social/tiktok.svg`

Instagram과 Threads는 사용자가 공식 리소스에서 받은 원본 파일을 위 경로에 넣어 교체합니다. 로고는 CSS로 모잇 색상으로 재도색하거나 형태를 변형하지 않으며, 카드의 고정 아이콘 영역 안에서 크기만 제어합니다. TikTok은 현재 사용 허가 범위를 확정하지 않아 일반 공유 아이콘을 사용합니다. 승인된 공식 자산이 준비되면 `shareChannels.ts`의 TikTok `iconPath`와 위 경로를 연결하세요.
