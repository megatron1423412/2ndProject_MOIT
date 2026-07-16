import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const debugPort = Number(process.env.MOIT_CDP_PORT ?? 9222);
const appUrl = process.env.MOIT_APP_URL ?? "http://127.0.0.1:5174/";
const mode = process.argv.includes("--flow-inspect") ? "flow-inspect" : process.argv.includes("--inspect") ? "inspect" : process.argv.includes("--measure") ? "measure" : "verify";

const delay = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

function findBrowserExecutables() {
  const candidates = [
    process.env.MOIT_BROWSER_EXECUTABLE,
    join(process.env["ProgramFiles(x86)"] ?? "C:\\Program Files (x86)", "Microsoft/Edge/Application/msedge.exe"),
    join(process.env.ProgramFiles ?? "C:\\Program Files", "Microsoft/Edge/Application/msedge.exe"),
    join(process.env.ProgramFiles ?? "C:\\Program Files", "Google/Chrome/Application/chrome.exe"),
    join(process.env["ProgramFiles(x86)"] ?? "C:\\Program Files (x86)", "Google/Chrome/Application/chrome.exe"),
  ];
  const executables = [...new Set(candidates.filter((candidate) => candidate && existsSync(candidate)))];
  if (!executables.length) throw new Error("Installed Edge or Chrome was not found.");
  return executables;
}

async function connectToBrowserPipe(executable) {
  const profile = mkdtempSync(join(tmpdir(), "moit-cdp-"));
  const child = spawn(executable, [
    "--headless=new",
    "--remote-debugging-pipe",
    `--user-data-dir=${profile}`,
    "--no-first-run",
    "--disable-default-apps",
    "--disable-gpu",
    "--disable-dev-shm-usage",
    "--no-sandbox",
    "about:blank",
  ], { stdio: ["ignore", "ignore", "pipe", "pipe", "pipe"], windowsHide: true });
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
      const payload = buffer.subarray(0, delimiter).toString("utf8");
      buffer = buffer.subarray(delimiter + 1);
      if (!payload) continue;
      const message = JSON.parse(payload);
      if (!message.id) continue;
      const waiter = pending.get(message.id);
      if (!waiter) continue;
      pending.delete(message.id);
      if (message.error) waiter.reject(new Error(message.error.message));
      else waiter.resolve(message.result);
    }
  });
  child.once("exit", (code) => {
    for (const waiter of pending.values()) waiter.reject(new Error(`Browser exited before CDP completed (${code}).`));
    pending.clear();
  });
  const rawSend = (method, params = {}, sessionId) => new Promise((resolve, reject) => {
    const id = ++sequence;
    pending.set(id, { resolve, reject });
    input.write(`${JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) })}\0`);
  });
  const cleanup = async () => {
    if (child.exitCode === null && !child.killed) child.kill();
    await delay(100);
    try { rmSync(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 }); } catch {}
  };
  try {
    const version = await rawSend("Browser.getVersion");
    const { targetId } = await rawSend("Target.createTarget", { url: appUrl });
    const { sessionId } = await rawSend("Target.attachToTarget", { targetId, flatten: true });
    return {
      browserExecutable: executable,
      browserVersion: version.product,
      send: (method, params = {}) => rawSend(method, params, sessionId),
      close: async () => {
      rawSend("Browser.close").catch(() => {});
      await Promise.race([new Promise((resolve) => child.once("exit", resolve)), delay(1_000)]);
        await cleanup();
      },
    };
  } catch (error) {
    await cleanup();
    throw error;
  }
}

async function connectWithPipe() {
  const errors = [];
  for (const executable of findBrowserExecutables()) {
    try {
      return await connectToBrowserPipe(executable);
    } catch (error) {
      errors.push(`${executable}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  throw new Error(`Unable to start a local Chromium CDP pipe.\n${errors.join("\n")}`);
}

async function connectWithWebSocket() {
  const suppliedWebSocketUrl = process.env.MOIT_CDP_WS;
  let targets;
  let lastError;
  for (let attempt = 0; !suppliedWebSocketUrl && attempt < 30; attempt += 1) {
    try {
      targets = await fetch(`http://127.0.0.1:${debugPort}/json/list`).then((response) => response.json());
      break;
    } catch (error) {
      lastError = error;
      await delay(100);
    }
  }
  if (!suppliedWebSocketUrl && !targets) throw lastError ?? new Error("CDP target list was unavailable.");
  const target = targets?.find((item) => item.type === "page") ?? targets?.[0];
  const webSocketUrl = suppliedWebSocketUrl ?? target?.webSocketDebuggerUrl;
  if (!webSocketUrl) throw new Error("CDP page target was not found.");
  const socket = new WebSocket(webSocketUrl);
  await new Promise((resolve, reject) => {
    socket.addEventListener("open", resolve, { once: true });
    socket.addEventListener("error", reject, { once: true });
  });
  let sequence = 0;
  const pending = new Map();
  socket.addEventListener("message", (event) => {
    const message = JSON.parse(String(event.data));
    if (!message.id) return;
    const waiter = pending.get(message.id);
    if (!waiter) return;
    pending.delete(message.id);
    if (message.error) waiter.reject(new Error(message.error.message));
    else waiter.resolve(message.result);
  });
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const id = ++sequence;
    pending.set(id, { resolve, reject });
    socket.send(JSON.stringify({ id, method, params }));
  });
  return { send, close: async () => socket.close(), browserExecutable: "external CDP target", browserVersion: "external" };
}

async function evaluate(send, expression) {
  const result = await send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.text);
  return result.result.value;
}

async function waitFor(send, expression, description, timeout = 10_000) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeout) {
    if (await evaluate(send, expression)) return;
    await delay(100);
  }
  throw new Error(`Timed out waiting for ${description}.`);
}

const clickButton = (send, text) => evaluate(send, `(() => {
  const expected = ${JSON.stringify(text)};
  const buttons = [...document.querySelectorAll('button')];
  const label = (item) => item.innerText.trim() || item.getAttribute('aria-label') || item.getAttribute('title') || '';
  const exact = buttons.filter((item) => !item.disabled && label(item) === expected);
  const partial = buttons.filter((item) => !item.disabled && label(item).includes(expected));
  const button = exact.at(-1) ?? partial.at(-1);
  if (!button) return false;
  button.click();
  return true;
})()`);

const fillNumberInput = async (send, placeholder, value) => {
  return evaluate(send, `(() => {
  const input = [...document.querySelectorAll('input[type="number"]')].find((item) => item.placeholder === ${JSON.stringify(placeholder)});
  if (!input) return false;
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
  setter.call(input, ${JSON.stringify(String(value))});
  const reactPropsKey = Object.keys(input).find((key) => key.startsWith('__reactProps$'));
  const onChange = reactPropsKey ? input[reactPropsKey]?.onChange : null;
  if (typeof onChange !== 'function') return false;
  onChange({ target: input, currentTarget: input });
  return true;
})()`);
};

const readPageSnapshot = (send) => evaluate(send, `(() => ({
  url: location.href,
  title: document.title,
  text: document.body.innerText,
  controls: [...document.querySelectorAll('button, a, input')].map((element) => ({
    tag: element.tagName,
    text: element.innerText || element.getAttribute('aria-label') || element.getAttribute('placeholder') || '',
    type: element.getAttribute('type'),
    disabled: element.disabled,
  })),
}))()`);

async function completeAirConditionerConditions(send) {
  assert.equal(await clickButton(send, "에어컨"), true, "air-conditioner entry button");
  await waitFor(send, "document.body.innerText.includes('에어컨을 주로 어디에 설치할 예정인가요?')", "air-conditioner first question");
  assert.equal(await clickButton(send, "거실"), true, "living-room choice");
  await waitFor(send, "document.body.innerText.includes('스탠드형으로 진행')", "inferred standing type");
  assert.equal(await clickButton(send, "스탠드형으로 진행"), true, "standing type confirmation");
  await waitFor(send, "document.querySelector('input[placeholder=\"냉방 공간 크기\"]') !== null", "cooling-area input");
  assert.equal(await fillNumberInput(send, "냉방 공간 크기", 16), true, "cooling-area input value");
  await delay(250);
  if (process.env.MOIT_CDP_DEBUG === "1") console.error(JSON.stringify(await evaluate(send, `(() => { const input=document.querySelector('input[placeholder="냉방 공간 크기"]'); const button=document.querySelector('button[aria-label="답변 전송"]'); return { value: input?.value, reactKeys: input ? Object.keys(input).filter((key)=>key.startsWith('__react')) : [], buttonDisabled: button?.disabled, bodyTail: document.body.innerText.slice(-300) }; })()`), null, 2));
  await waitFor(send, "[...document.querySelectorAll('button[aria-label=\"답변 전송\"]')].some((item) => !item.disabled)", "enabled cooling-area submit");
  assert.equal(await clickButton(send, "답변 전송"), true, "cooling-area submit");
  await waitFor(send, "document.body.innerText.includes('여름철 하루에 몇 시간 정도 사용할 예정인가요?')", "usage question");
  assert.equal(await clickButton(send, "4~8시간"), true, "usage choice");
  await waitFor(send, "document.body.innerText.includes('어떤 기준의 가성비를 가장 중요하게 볼까요?')", "priority question");
  assert.equal(await clickButton(send, "가격·효율 균형 추천"), true, "balanced priority");
  await waitFor(send, "document.body.innerText.includes('에어컨 제품 가격은 최대 얼마까지 생각하고 있나요?')", "budget question");
  assert.equal(await clickButton(send, "예산 제한 없음"), true, "unlimited budget");
  await waitFor(send, "document.body.innerText.includes('이 조건으로 추천을 시작할까요?')", "confirmation question");
  assert.equal(await clickButton(send, "추천 시작"), true, "recommendation start");
  await waitFor(send, "document.body.innerText.includes('AI 최적화 재정렬')", "internal recommendation list", 20_000);
  await waitFor(send, "!document.body.innerText.includes('네이버 쇼핑 가격을 불러오는 중이에요')", "settled recommendation snapshot", 20_000);
}

async function selectFirstInternalRecommendation(send) {
  const clicked = await evaluate(send, `(() => {
    const section = [...document.querySelectorAll('section')].filter((item) => item.innerText.includes('AI 최적화 재정렬') && [...item.querySelectorAll('button')].some((button) => !button.disabled && !button.hasAttribute('aria-pressed'))).at(-1);
    const button = section ? [...section.querySelectorAll('button')].find((item) => !item.disabled && !item.hasAttribute('aria-pressed')) : null;
    if (!button) return false;
    button.click();
    return true;
  })()`);
  if (!clicked && process.env.MOIT_CDP_DEBUG === "1") console.error(JSON.stringify(await readPageSnapshot(send), null, 2));
  assert.equal(clicked, true, "first internal recommendation");
  await waitFor(send, "document.querySelector('[data-product-action-toolbar]') !== null", "product detail action toolbar", 10_000);
}

const assistantCount = (send) => evaluate(send, "document.querySelectorAll('[data-chat-timeline-row=\"assistant\"]').length");

async function clickActionAndWaitForAssistant(send, label) {
  const before = await assistantCount(send);
  assert.equal(await clickButton(send, label), true, `product action: ${label}`);
  try {
    await waitFor(send, `document.querySelectorAll('[data-chat-timeline-row="assistant"]').length > ${before}`, `${label} assistant response`, 10_000);
  } catch (error) {
    if (process.env.MOIT_CDP_DEBUG === "1") {
      console.error(JSON.stringify(await evaluate(send, `(() => ({
        label: ${JSON.stringify(label)},
        before: ${before},
        assistantRows: [...document.querySelectorAll('[data-chat-timeline-row="assistant"]')].map((row) => row.innerText),
        wideRows: [...document.querySelectorAll('[data-chat-wide-content]')].map((row) => row.innerText),
        bodyTail: document.body.innerText.slice(-3000),
      }))()`), null, 2));
    }
    throw error;
  }
}

const measureRenderedAlignment = (send) => evaluate(send, `(() => {
  const rows = [...document.querySelectorAll('[data-chat-timeline-row="assistant"]')];
  const describe = (row) => {
    const logo = row.querySelector('[data-chat-assistant-logo]');
    const bubble = row.querySelector('[data-chat-bubble="assistant"]');
    const rect = row.getBoundingClientRect();
    const logoRect = logo.getBoundingClientRect();
    const bubbleRect = bubble.getBoundingClientRect();
    const ancestors = [];
    for (let element = row; element; element = element.parentElement) {
      const style = getComputedStyle(element);
      const box = element.getBoundingClientRect();
      ancestors.push({
        tag: element.tagName,
        className: typeof element.className === 'string' ? element.className : '',
        timelineRoot: element.hasAttribute('data-chat-timeline-root'),
        conversationRole: element.getAttribute('data-chat-conversation-row') ?? element.getAttribute('data-chat-timeline-row'),
        wideContent: element.hasAttribute('data-chat-wide-content'),
        left: box.left,
        width: box.width,
        display: style.display,
        maxWidth: style.maxWidth,
        marginLeft: style.marginLeft,
        marginInline: style.marginInline,
        paddingLeft: style.paddingLeft,
        paddingInline: style.paddingInline,
        gridColumn: style.gridColumn,
        justifySelf: style.justifySelf,
        alignSelf: style.alignSelf,
      });
      if (element.hasAttribute('data-chat-timeline-root')) break;
    }
    return { rowLeft: rect.left, rowWidth: rect.width, logoLeft: logoRect.left, bubbleLeft: bubbleRect.left, bubbleRight: bubbleRect.right, text: bubble.innerText, ancestors };
  };
  const initialRow = rows.find((row) => row.querySelector('[data-chat-bubble="assistant"]')?.innerText.includes('에어컨을 주로 어디에 설치할 예정인가요?'));
  const saleRow = rows.find((row) => row.dataset.cdpAction === 'sale') ?? rows.at(-2);
  const alternativeRow = rows.find((row) => row.dataset.cdpAction === 'alternative') ?? rows.at(-1);
  const userRows = [...document.querySelectorAll('[data-chat-timeline-row="user"]')];
  const userBubble = (label) => userRows.map((row) => row.querySelector('[data-chat-bubble="user"]')).filter(Boolean).find((bubble) => bubble.innerText.trim() === label);
  const initialUser = userBubble('거실');
  const saleUser = userBubble('예상 세일 달 제안');
  const wideRows = [...document.querySelectorAll('[data-chat-wide-content]')].map((row) => { const rect = row.getBoundingClientRect(); return { left: rect.left, width: rect.width }; });
  const timelineRoot = document.querySelector('[data-chat-timeline-root]');
  const conversationRows = [...document.querySelectorAll('[data-chat-timeline-row="assistant"], [data-chat-timeline-row="user"]')];
  const ownership = {
    conversationCount: conversationRows.length,
    allDirectChildrenOfTimelineRoot: conversationRows.every((row) => row.parentElement === timelineRoot),
    anyWideContentAncestor: conversationRows.some((row) => row.parentElement?.closest('[data-chat-wide-content]')),
    allOwnedByChatScreen: conversationRows.every((row) => row.getAttribute('data-chat-layout-owner') === 'chat-screen'),
  };
  return {
    viewport: { width: innerWidth, height: innerHeight },
    initial: describe(initialRow),
    sale: describe(saleRow),
    alternative: describe(alternativeRow),
    userRight: { initial: initialUser?.getBoundingClientRect().right, sale: saleUser?.getBoundingClientRect().right },
    wideRows,
    ownership,
  };
})()`);

const connection = process.env.MOIT_CDP_WS || process.env.MOIT_CDP_PORT ? await connectWithWebSocket() : await connectWithPipe();
const { send } = connection;
try {
  await send("Runtime.enable");
  await send("Page.enable");
  await send("Page.navigate", { url: appUrl });
  await waitFor(send, "document.readyState === 'complete'", "page load");

  if (mode === "inspect" || mode === "flow-inspect") {
    if (mode === "flow-inspect") {
      assert.equal(await clickButton(send, "에어컨"), true, "air-conditioner entry button");
      await waitFor(send, "document.body.innerText.includes('에어컨을 주로 어디에 설치할 예정인가요?')", "air-conditioner first question");
      const followupClicks = JSON.parse(process.env.MOIT_FLOW_CLICKS ?? "[]");
      for (const label of followupClicks) {
        assert.equal(await clickButton(send, label), true, `flow button: ${label}`);
        await delay(250);
      }
    }
    const snapshot = await readPageSnapshot(send);
    snapshot.browserExecutable = connection.browserExecutable;
    snapshot.browserVersion = connection.browserVersion;
    console.log(JSON.stringify(snapshot, null, 2));
    process.exitCode = 0;
  } else {
    if (process.env.MOIT_VIEWPORT_WIDTH) {
      await send("Emulation.setDeviceMetricsOverride", { width: Number(process.env.MOIT_VIEWPORT_WIDTH), height: Number(process.env.MOIT_VIEWPORT_HEIGHT ?? 900), deviceScaleFactor: 1, mobile: false });
      await send("Page.navigate", { url: appUrl });
      await waitFor(send, "document.readyState === 'complete'", "viewport reload");
    }
    await completeAirConditionerConditions(send);
    await selectFirstInternalRecommendation(send);
    await clickActionAndWaitForAssistant(send, "예상 세일 달 제안");
    await evaluate(send, `document.querySelectorAll('[data-chat-timeline-row="assistant"]')[document.querySelectorAll('[data-chat-timeline-row="assistant"]').length - 1].dataset.cdpAction = 'sale'`);
    await clickActionAndWaitForAssistant(send, "다른 제품 추천");
    await evaluate(send, `document.querySelectorAll('[data-chat-timeline-row="assistant"]')[document.querySelectorAll('[data-chat-timeline-row="assistant"]').length - 1].dataset.cdpAction = 'alternative'`);
    const measurement = await measureRenderedAlignment(send);
    const deltas = {
      saleLogo: Math.abs(measurement.initial.logoLeft - measurement.sale.logoLeft),
      saleBubble: Math.abs(measurement.initial.bubbleLeft - measurement.sale.bubbleLeft),
      alternativeLogo: Math.abs(measurement.initial.logoLeft - measurement.alternative.logoLeft),
      alternativeBubble: Math.abs(measurement.initial.bubbleLeft - measurement.alternative.bubbleLeft),
      userRight: Math.abs(measurement.userRight.initial - measurement.userRight.sale),
    };
    const report = { browserExecutable: connection.browserExecutable, browserVersion: connection.browserVersion, measurement, deltas };
    console.log(JSON.stringify(report, null, 2));
    if (mode === "verify") {
      for (const [name, delta] of Object.entries(deltas)) assert.ok(delta <= 1, `${name} differs by ${delta}px`);
      assert.equal(measurement.ownership.allDirectChildrenOfTimelineRoot, true, "every conversational row is a direct child of the outer timeline");
      assert.equal(measurement.ownership.anyWideContentAncestor, false, "conversational rows cannot be owned by wide content");
      assert.equal(measurement.ownership.allOwnedByChatScreen, true, "every conversational row uses the ChatScreen layout owner");
      for (const entry of [measurement.initial, measurement.sale, measurement.alternative]) {
        assert.ok(entry.logoLeft >= 0 && entry.bubbleLeft >= 0 && entry.bubbleRight <= measurement.viewport.width + 1, "assistant content stays inside the viewport");
      }
    }
  }
} finally {
  await connection.close();
}
