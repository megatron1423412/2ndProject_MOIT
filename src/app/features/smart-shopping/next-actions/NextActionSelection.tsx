import React from "react";
import { getVisibleNextActionOptions, type NextActionId } from "./nextActionOptions";

export default function NextActionSelection({
  onSelect,
  showPurchaseGrade = true,
  isActive = true
}: {
  onSelect: (action: NextActionId) => void;
  showPurchaseGrade?: boolean;
  isActive?: boolean;
}) {
  const visibleOptions = getVisibleNextActionOptions(showPurchaseGrade);
  const primary = visibleOptions.find((option) => option.primary);
  const secondary = visibleOptions.filter((option) => !option.primary);

  return (
    <div className="flex max-w-[88%] gap-3 self-start my-2" data-stage="choosing-next-action">
      {/* 🤖 AI 로봇 아바타 아이콘 */}
      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-transparent overflow-hidden select-none">
        <img
          src="/assets/brand/robot_moit_face.png"
          alt="MOIT 챗봇"
          className="h-full w-full object-contain"
        />
      </div>

      {/* 💬 AI 말풍선 전체 영역 */}
      <div className="min-w-0 max-w-full rounded-2xl rounded-tl-sm border border-slate-200 bg-white p-4 sm:p-5 text-sm leading-relaxed shadow-sm space-y-4">
        {/* 상단 안내 문구 */}
        {showPurchaseGrade && (
          <p className="text-xs sm:text-sm font-bold text-slate-800 border-b border-slate-100 pb-3">
            이 상품으로 무엇을 해볼까요? 원하는 다음 단계를 선택해주세요.
          </p>
        )}

        {/* 🏅 구매등급진단 메인 카드 (holographic_medal.png 3D 메달 적용 - 검은 테두리 완벽 제거) */}
        {primary && (
          <div
            onClick={() => isActive && onSelect(primary.id)}
            className={`relative flex flex-col items-center text-center rounded-3xl border border-slate-100 border-t-4 border-t-[#1E3ABA] bg-white p-6 sm:p-7 shadow-md overflow-hidden transition-all duration-200 ${
              isActive ? "hover:shadow-lg cursor-pointer active:scale-[0.995]" : "opacity-80 cursor-not-allowed"
            }`}
          >
            {/* 🎨 [프론트엔드 수정 가능 Zone: 메달 이미지 파일 및 크기 조절]
               - 파일 위치: public/assets/brand/holographic_medal.png
               - 이미지 크기 변경: w-14 h-14 (w-12 h-12, w-16 h-16, w-20 h-20 등 조절)
            */}
            <div className="w-14 h-14 rounded-full overflow-hidden shadow-md mb-4 shrink-0 flex items-center justify-center bg-[#F5F7FA]">
              <img
                src="/assets/brand/holographic_medal.png"
                alt="구매등급진단 메달"
                className="w-full h-full object-cover scale-[1.18]"
              />
            </div>

            {/* 타이틀 */}
            <h4 className="text-lg sm:text-xl font-extrabold text-[#1F2937] mb-1.5 tracking-tight">
              구매등급진단
            </h4>

            {/* 설명 서브 타이틀 */}
            <p className="text-xs sm:text-sm font-medium text-slate-500 leading-relaxed mb-6 max-w-[280px]">
              내 지출 패턴과 예산 기준으로 선택한 구매의 알뜰함 수준을 등급으로 진단해 드려요.
            </p>

            {/* 내 등급 확인하기 메인 블루 버튼 */}
            <button
              type="button"
              disabled={!isActive}
              onClick={(e) => {
                e.stopPropagation();
                if (isActive) onSelect(primary.id);
              }}
              className="w-full rounded-2xl bg-[#1E3ABA] hover:bg-[#152B88] py-3.5 px-6 text-sm sm:text-base font-extrabold text-white shadow-xs transition-all active:scale-[0.99] disabled:opacity-80"
            >
              내 등급 확인하기
            </button>
          </div>
        )}

        {/* 🔘 말풍선 내부 하단 선택 버튼 리스트 (채팅 종료하기 색상 포인트 적용) */}
        <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
          {secondary.map((item) => {
            const isEndChat = item.id === "end-chat" || item.label.includes("종료");
            return (
              <button
                key={item.id}
                type="button"
                disabled={!isActive}
                onClick={() => onSelect(item.id)}
                className={`rounded-xl px-3.5 py-2 text-xs font-bold transition-all active:scale-[0.98] disabled:cursor-default disabled:opacity-60 ${
                  isEndChat
                    ? "border border-[#1E3ABA]/30 bg-[#1E3ABA]/10 text-[#1E3ABA] hover:bg-[#1E3ABA]/20 hover:border-[#1E3ABA]/50 shadow-xs"
                    : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300 shadow-2xs"
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
