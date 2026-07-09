import type { ConversationHistoryItem } from "../types/moit";

export const MOCK_CONVERSATIONS: ConversationHistoryItem[] = [
  {
    id: "history-aircon",
    title: "거실 에어컨 구매 진단",
    category: "똑똑한 소비 · 가전제품 · 에어컨",
    lastDate: "2026.07.08",
    summary: "설치비 포함 150만원대 인버터 1등급 모델 우선 검토",
    status: "완료",
  },
  {
    id: "history-phone",
    title: "휴대폰 요금제 절감",
    category: "생활비 진단 · 통신비 · 폰",
    lastDate: "2026.07.05",
    summary: "월 26,000원 절감 가능, 선택약정 잔여 기간 확인 필요",
    status: "다시 확인 필요",
  },
  {
    id: "history-tv",
    title: "65인치 TV 구매 비교",
    category: "똑똑한 소비 · 가전제품 · TV",
    lastDate: "2026.07.02",
    summary: "OTT 중심 사용 기준 QLED급 가성비 모델 추천",
    status: "진행 중",
  },
  {
    id: "history-bundle",
    title: "가족 결합상품 재설계",
    category: "생활비 진단 · 통신비 · 결합 상품",
    lastDate: "2026.06.29",
    summary: "휴대폰 3회선 기준 월 33,000원 절감 후보 발견",
    status: "완료",
  },
];
