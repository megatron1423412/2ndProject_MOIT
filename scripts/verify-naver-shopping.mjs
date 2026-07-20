import assert from "node:assert/strict";
import { getNaverCredentials, loadServerEnv } from "../server/serverEnv.mjs";
import { NaverShoppingServiceError, searchNaverShopping } from "../server/naverShoppingService.mjs";

try {
  const result = await searchNaverShopping({ query: "에어컨", ...getNaverCredentials(loadServerEnv()) });
  assert.ok(Array.isArray(result.items), "Naver response must contain an items array");
  const representative = result.items.find((item) => item.title && item.link && (item.lowestPrice ?? 0) > 0);
  assert.ok(representative, "Naver response must contain a titled item with a link and positive lowest price");
  console.log(JSON.stringify({ status: 200, itemCount: result.items.length, result: { title: representative.title, lowestPrice: representative.lowestPrice, mallName: representative.mallName } }));
} catch (error) {
  if (error instanceof NaverShoppingServiceError) {
    console.error(JSON.stringify({ status: error.upstreamStatus ?? error.status, code: error.code, errorCode: error.errorCode ?? null }));
  } else {
    console.error(JSON.stringify({ status: 0, code: "NAVER_REQUEST_FAILED", errorCode: null }));
  }
  process.exitCode = 1;
}
