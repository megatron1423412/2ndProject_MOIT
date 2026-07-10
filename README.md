
  # MOIT 생활비 추천 챗봇 앱

  This is a code bundle for MOIT 생활비 추천 챗봇 앱. The original project is available at https://www.figma.com/design/jNTl6y3hFmhWWUu9ciN3ew/MOIT-%EC%83%9D%ED%99%9C%EB%B9%84-%EC%B6%94%EC%B2%9C-%EC%B1%97%EB%B4%87-%EC%95%B1.

  ## Running the code

  Run `npm i` to install the dependencies.

  Run `npm run dev` to start the development server.
  

  # 작업 폴더
    src/⭐
  └── app/⭐
      ├── components/
      ├── config/
      ├── data/
      ├── features/⭐
      │   └── chat-flow/
      │       ├── core/
      │       ├── engine/
      │       └── flows/⭐
      │           ├── appliances/⭐가전제품
      │           │   ├── air-conditioner/ 🟢에어컨
      │           │   ├── refrigerator/ 🟢냉장고
      │           │   ├── tv/ 🟢TV
      │           │   └── vacuum/ 🟢청소기
      │           └── telecom/⭐통신비
      │               ├── bundle/ 🟢결합 상품
      │               ├── internet/ 🟢인터넷
      │               ├── iptv/ 🟢IPTV
      │               └── phone/ 🟢폰
      ├── registry/
      └── shared/