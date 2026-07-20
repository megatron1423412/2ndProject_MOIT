import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const appUrl = "http://127.0.0.1:5173/";
const delay = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

async function startVite() {
  const child = spawn(process.env.ComSpec ?? "cmd.exe", ["/d", "/s", "/c", "npm run dev -- --host 127.0.0.1"], { cwd: process.cwd(), windowsHide: true, stdio: ["ignore", "pipe", "pipe"] });
  let output = "";
  child.stdout.on("data", (chunk) => { output = `${output}${chunk}`.slice(-4_000); });
  child.stderr.on("data", (chunk) => { output = `${output}${chunk}`.slice(-4_000); });
  for (let attempt = 0; attempt < 200; attempt += 1) {
    if (child.exitCode !== null) throw new Error(`Vite exited before becoming ready (${child.exitCode}).\n${output}`);
    try {
      if ((await fetch(appUrl)).ok) return () => spawnSync("taskkill", ["/pid", String(child.pid), "/t", "/f"], { windowsHide: true, stdio: "ignore" });
    } catch {}
    await delay(100);
  }
  child.kill();
  throw new Error("Timed out waiting for Vite.");
}

async function connectToChrome() {
  const executable = [
    join(process.env.ProgramFiles ?? "C:\\Program Files", "Google/Chrome/Application/chrome.exe"),
    join(process.env["ProgramFiles(x86)"] ?? "C:\\Program Files (x86)", "Google/Chrome/Application/chrome.exe"),
  ].find(existsSync);
  if (!executable) throw new Error("Installed Chrome was not found.");
  const profile = mkdtempSync(join(tmpdir(), "moit-product-images-"));
  const child = spawn(executable, ["--headless=new", "--remote-debugging-pipe", `--user-data-dir=${profile}`, "--no-first-run", "--disable-default-apps", "--no-sandbox", "--window-size=1440,1000", "about:blank"], { stdio: ["ignore", "ignore", "pipe", "pipe", "pipe"], windowsHide: true });
  const input = child.stdio[3];
  const output = child.stdio[4];
  if (!input || !output) throw new Error("CDP pipe handles were not created.");
  let sequence = 0;
  let buffer = Buffer.alloc(0);
  const pending = new Map();
  output.on("data", (chunk) => {
    buffer = Buffer.concat([buffer, chunk]);
    let delimiter;
    while ((delimiter = buffer.indexOf(0)) >= 0) {
      const message = JSON.parse(buffer.subarray(0, delimiter).toString("utf8"));
      buffer = buffer.subarray(delimiter + 1);
      if (!message.id) continue;
      const waiter = pending.get(message.id);
      if (!waiter) continue;
      pending.delete(message.id);
      if (message.error) waiter.reject(new Error(message.error.message)); else waiter.resolve(message.result);
    }
  });
  const sendRaw = (method, params = {}, sessionId) => new Promise((resolve, reject) => {
    const id = ++sequence;
    pending.set(id, { resolve, reject });
    input.write(`${JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) })}\0`);
  });
  const { targetId } = await sendRaw("Target.createTarget", { url: appUrl });
  const { sessionId } = await sendRaw("Target.attachToTarget", { targetId, flatten: true });
  return {
    send: (method, params = {}) => sendRaw(method, params, sessionId),
    close: async () => {
      sendRaw("Browser.close").catch(() => {});
      await delay(1_000);
      if (child.exitCode === null) child.kill();
      input.destroy();
      output.destroy();
      try { rmSync(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 }); } catch {}
    },
  };
}

async function evaluate(send, expression) {
  const result = await send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.text);
  return result.result.value;
}

async function waitFor(send, expression, description, timeout = 15_000) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeout) {
    if (await evaluate(send, expression)) return;
    await delay(100);
  }
  throw new Error(`Timed out waiting for ${description}.`);
}

const click = (send, label) => evaluate(send, `(() => {
  const label = ${JSON.stringify(label)};
  const buttons = [...document.querySelectorAll("button")].filter((button) => !button.disabled);
  const text = (button) => button.innerText.trim() || button.getAttribute('aria-label') || button.getAttribute('title') || '';
  const button = buttons.filter((button) => text(button) === label).at(-1) ?? buttons.find((button) => text(button).includes(label));
  if (!button) return false;
  button.click();
  return true;
})()`);

async function completeFlow(send, entryLabel, choices) {
  assert.equal(await click(send, entryLabel), true, `${entryLabel} entry`);
  for (const choice of choices) {
    if (typeof choice === "object") {
      const updated = await evaluate(send, `(() => {
        const input = [...document.querySelectorAll('input[type="number"]')].find((item) => item.placeholder === ${JSON.stringify(choice.placeholder)});
        if (!input) return false;
        const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
        setter.call(input, ${JSON.stringify(String(choice.value))});
        const reactPropsKey = Object.keys(input).find((key) => key.startsWith('__reactProps$'));
        input[reactPropsKey]?.onChange?.({ target: input, currentTarget: input });
        return true;
      })()`);
      assert.equal(updated, true, `${entryLabel} number input`);
      await waitFor(send, "[...document.querySelectorAll('button[aria-label=\"답변 전송\"]')].some((button) => !button.disabled)", `${entryLabel} number submit ready`);
      assert.equal(await click(send, "답변 전송"), true, `${entryLabel} number submit`);
      await delay(80);
      continue;
    }
    await waitFor(send, `[...document.querySelectorAll('button')].some((button) => !button.disabled && button.innerText.trim() === ${JSON.stringify(choice)})`, `${entryLabel} choice ready: ${choice}`);
    assert.equal(await click(send, choice), true, `${entryLabel} choice: ${choice}`);
    await delay(80);
  }
  await waitFor(send, "document.body.innerText.includes('AI 최적화 재정렬')", `${entryLabel} recommendation list`, 20_000);
}

function imagePathsFrom(sourceFile) {
  return [...readFileSync(sourceFile, "utf8").matchAll(/^\s*imagePath:\s*"([^\"]+)"/gm)].map((match) => match[1]).filter((path) => path.startsWith("/assets/"));
}

const categorySources = {
  "air-conditioner": "src/app/features/product-catalog/data/real/airConditioners.ts",
  tv: "src/app/features/product-catalog/data/real/televisions.ts",
  refrigerator: "src/app/features/product-catalog/data/real/refrigerators.ts",
  vacuum: "src/app/features/product-catalog/data/real/vacuumCleaners.ts",
};
const imagePathsByCategory = Object.fromEntries(Object.entries(categorySources).map(([category, source]) => [category, imagePathsFrom(source)]));
const recentImagePaths = [
  ...imagePathsByCategory["air-conditioner"].slice(17),
  ...imagePathsByCategory.tv.slice(17),
  ...imagePathsByCategory.refrigerator,
  ...imagePathsByCategory.vacuum.slice(15),
];
const visibleTargets = {
  "air-conditioner": ["/assets/products/real/air-conditioner/AF17C5734GZS.jpg", "/assets/products/real/air-conditioner/AF60F17D11WRS.jpg"],
  tv: ["/assets/products/real/televisions/KQ55QD60AFXKR.png", "/assets/products/real/televisions/55UT9300KNA.png"],
  refrigerator: imagePathsFrom(categorySources.refrigerator),
  vacuum: ["/assets/products/real/vacuumCleaners/i50-AI-Detect.jpg", "/assets/products/real/vacuumCleaners/SVC-JS330WK.jpg"],
};

const viteStop = await startVite();
let chrome;
let passed = false;
try {
  chrome = await connectToChrome();
  const { send } = chrome;
  await send("Runtime.enable");
  await send("Page.enable");
  await send("Emulation.setDeviceMetricsOverride", { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
  await send("Page.navigate", { url: appUrl });
  await waitFor(send, "document.readyState === 'complete'", "initial page load");

  const directResults = await evaluate(send, `Promise.all(${JSON.stringify(recentImagePaths)}.map(async (path) => {
    const response = await fetch(path, { cache: "no-store" });
    return { path, status: response.status, ok: response.ok };
  }))`);
  const directFailures = directResults.filter((result) => !result.ok || result.status === 404);
  assert.deepEqual(directFailures, [], "all recently added local image URLs load without 404");

  const flows = [
    ["air-conditioner", "에어컨", ["거실", "스탠드형으로 진행", { placeholder: "냉방 공간 크기", value: 16 }, "4~8시간", "가격·효율 균형 추천", "예산 제한 없음", "추천 시작"]],
    ["tv", "TV", ["1.5~2.5m", "55인치 적용", "방송·유튜브·OTT 시청", "3~6시간", "삼성·LG 등 다른 스마트 OS도 괜찮음", "가격·화질 균형 추천", "예산 제한 없음", "추천 시작"]],
    ["refrigerator", "냉장고", ["3~4명", "일반적인 수준이에요", "추천 범위 적용", "일반 냉장고 설치 공간", "상관없음", "가격·용량·효율 균형 추천", "예산 제한 없음", "추천 시작"]],
    ["vacuum", "청소기", ["일반적인 균형 사용", "이동이 편한 무선", "여러 바닥이 섞여 있음", "어느 정도 중요해요", "가격·성능 균형 추천", "예산 제한 없음", "추천 시작"]],
  ];
  const visibleResults = [];
  for (const [category, entryLabel, choices] of flows) {
    await send("Page.navigate", { url: appUrl });
    await waitFor(send, "document.readyState === 'complete'", `${category} page load`);
    await completeFlow(send, entryLabel, choices);
    const candidates = visibleTargets[category];
    const result = await evaluate(send, `(() => {
      const expected = ${JSON.stringify(candidates)};
      const image = [...document.querySelectorAll('img')].find((item) => expected.some((path) => new URL(item.src).pathname === path));
      if (!image) return null;
      const rect = image.getBoundingClientRect();
      const style = getComputedStyle(image);
      return { expected: new URL(image.src).pathname, resolvedSrc: image.src, visible: rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none', complete: image.complete, naturalWidth: image.naturalWidth };
    })()`);
    assert.ok(result, `${category} includes a newly added product recommendation-card image`);
    assert.equal(result.visible, true, `${category} recommendation-card image is visible`);
    assert.equal(result.complete, true, `${category} recommendation-card image is complete`);
    assert.ok(result.naturalWidth > 0, `${category} recommendation-card image has natural width`);
    visibleResults.push({ category, ...result });
  }
  console.log(JSON.stringify({ directImageCount: directResults.length, browserCategoryResults: visibleResults }, null, 2));
  passed = true;
} finally {
  await chrome?.close();
  viteStop();
}
if (passed) process.exit(0);
