import React from "react";

interface IconButtonProps {
  label: string;
  children: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
}

export default function IconButton({ label, children, active = false, onClick }: IconButtonProps) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      /* 🎨 [프론트엔드 수정 가능 Zone 1: 원형 아이콘 버튼 외형 및 호버 스타일]
         - h-10 w-10: 버튼 가로/세로 정사각형 크기 (h-9 w-9, h-11 w-11 등)
         - rounded-full: 완벽한 동그라미 원형
         - border-none / shadow-none: 테두리 및 그림자 완벽 제거
         - bg-transparent: 호버하지 않을 때 평소 투명 배경
         - hover:bg-[#2A6CB6]: 마우스 올렸을 때 배경색(#2A6CB6) 변경
         - hover:text-white: 마우스 올렸을 때 내부 아이콘 색상을 흰색으로 변경
         - active:scale-[0.98]: 클릭하는 순간 살짝 눌리는 애니메이션 효과
      */
      className={`flex h-10 w-10 items-center justify-center rounded-full border-none shadow-none transition-all active:scale-[0.98] ${
        active
          ? "bg-[#2A6CB6] text-white"
          : "bg-transparent text-primary hover:bg-[#2A6CB6] hover:text-white"
      }`}
    >
      {children}
    </button>
  );
}