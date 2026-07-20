# 📍 작업 폴더 안내 및 구조

## 💻 실행 방법 (Running the Code)
패키지 설치
  Run `npm i`
실행 
  Run `npm run dev`

## 🚀 핵심 작업 경로
* **메인 작업 위치:** `src/app/features/chat-flow/flows/`

---

## 🏗️ 폴더 구조

src/ ⭐
└── app/ ⭐
    ├── components/
    ├── config/
    ├── data/               
    ├── features/ ⭐
    │   └── chat-flow/
    │       ├── core/
    │       ├── engine/
    │       └── flows/ ⭐
    │           ├── appliances/          # 가전제품
    │           │   ├── air-conditioner/ # 🟢 에어컨
    │           │   ├── refrigerator/    # 🟢 냉장고
    │           │   ├── tv/              # 🟢 TV
    │           │   └── vacuum/          # 🟢 청소기
    │           └── telecom/             # 통신비
    │               ├── bundle/          # 🟢 결합 상품
    │               ├── internet/        # 🟢 인터넷
    │               ├── iptv/            # 🟢 IPTV
    │               └── phone/           # 🟢 폰
    ├── registry/
    └── shared/

**mockData.ts 각 소분류 카테고리의 더미데이터** 
