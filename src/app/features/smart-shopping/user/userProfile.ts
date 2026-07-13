export interface UserProfile {
  id: string;
  displayName: string;
}

/** 향후 인증 사용자로 교체할 단일 사용자 정보 경계입니다. */
export const currentUser: UserProfile = {
  id: "mock-user",
  displayName: "김철수",
};
