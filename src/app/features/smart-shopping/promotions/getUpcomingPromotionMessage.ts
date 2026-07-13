import { summarizePriceHistory } from "../../product-catalog/core/priceHistory";
import type { PriceHistoryPoint, ProductCategoryId } from "../../product-catalog/core/types";
import { PROMOTION_EVENTS } from "./promotionEvents";

const FALLBACK_MESSAGE = "현재 가까운 대형 할인 일정은 확인되지 않았어요. 급하지 않다면 카드 할인, 쇼핑몰 쿠폰, 시즌 종료 프로모션을 함께 확인해보세요.";

export const getUpcomingPromotionMessage = ({
  categoryId,
  currentPrice,
  priceHistory,
  now = new Date(),
}: { categoryId: ProductCategoryId; currentPrice: number; priceHistory: PriceHistoryPoint[]; now?: Date }) => {
  const date = now.getTime();
  const event = PROMOTION_EVENTS
    .filter((item) => item.applicableCategories.includes(categoryId))
    .filter((item) => new Date(`${item.endDate}T23:59:59`).getTime() >= date || new Date(`${item.noticeStartDate}T00:00:00`).getTime() >= date)
    .sort((a, b) => {
      const aDate = Math.max(new Date(`${a.noticeStartDate}T00:00:00`).getTime(), date);
      const bDate = Math.max(new Date(`${b.noticeStartDate}T00:00:00`).getTime(), date);
      return aDate - bDate;
    })[0];
  const message = event?.message ?? FALLBACK_MESSAGE;
  if (priceHistory.length === 0 || !currentPrice) return message;
  const price = summarizePriceHistory(currentPrice, priceHistory);
  const priceNote = currentPrice > price.averagePrice
    ? " 현재가는 내부 더미 이력 평균가보다 높은 편이에요."
    : currentPrice <= price.allTimeLow * 1.05
      ? " 현재가는 내부 더미 이력의 역대 최저가에 비교적 가까운 편이에요."
      : " 현재가와 내부 더미 가격 이력을 함께 비교해보세요.";
  return `${message}${priceNote}`;
};
