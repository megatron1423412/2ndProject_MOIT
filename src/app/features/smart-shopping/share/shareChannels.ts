export type ShareChannel = {
  id: "instagram" | "threads" | "tiktok";
  label: string;
  iconPath?: string;
  iconPolicy: "official-local-asset" | "generic-fallback";
};

// Official assets are intentionally not bundled: replace these local paths with approved original files.
export const PURCHASE_GRADE_SHARE_CHANNELS: readonly ShareChannel[] = [
  { id: "instagram", label: "Instagram", iconPath: "/assets/brands/social/instagram.svg", iconPolicy: "official-local-asset" },
  { id: "threads", label: "Threads", iconPath: "/assets/brands/social/threads.svg", iconPolicy: "official-local-asset" },
  { id: "tiktok", label: "TikTok", iconPolicy: "generic-fallback" },
];
