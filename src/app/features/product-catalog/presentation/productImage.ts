/** Product catalog images are Vite public assets, not module imports. */
export const resolveProductImagePath = (imagePath: string | null | undefined): string | undefined => {
  const path = imagePath?.trim();
  if (!path) return undefined;
  // Explicit support for the former public-directory spelling only.
  if (path.startsWith("/public/assets/")) return path.slice("/public".length);
  return path;
};
