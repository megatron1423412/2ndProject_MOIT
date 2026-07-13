import type { FavoriteRepository } from "./FavoriteRepository";
import { getFavoriteProductIdentity } from "./favoriteIdentity";
import type { FavoriteDraft } from "./types";

export const toggleFavoriteInRepository = (repository: FavoriteRepository, draft: FavoriteDraft) => {
  const identity = getFavoriteProductIdentity(draft);
  const existing = repository.getFavoritesForUser(draft.userId).find((favorite) => getFavoriteProductIdentity(favorite) === identity);
  if (existing) {
    repository.removeFavorite(existing.id);
    return false;
  }
  repository.addFavorite(draft);
  return true;
};
