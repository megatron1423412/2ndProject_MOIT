import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const debugPort = Number(process.env.MOIT_CDP_PORT ?? 9222);
const appUrl = process.env.MOIT_APP_URL ?? "http://127.0.0.1:5173/";
const mode = process.argv.includes("--flow-inspect") ? "flow-inspect" : process.argv.includes("--inspect") ? "inspect" : process.argv.includes("--baseline") ? "baseline" : process.argv.includes("--measure") ? "measure" : "verify";
const artifactDirectory = process.env.MOIT_CDP_ARTIFACT_DIR ?? join(process.cwd(), ".tmp", "chat-alignment");

const delay = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

async function startVite() {
  if (process.env.MOIT_SKIP_VITE === "1") return null;
  try {
    const response = await fetch(appUrl);
    if (response.ok) throw new Error(`${appUrl} is already serving content. Stop the existing server or set MOIT_SKIP_VITE=1 explicitly.`);
  } catch (error) {
    if (error instanceof Error && error.message.includes("already serving content")) throw error;
  }
  const command = "npm run dev -- --host 127.0.0.1";
  const child = process.platform === "win32"
    ? spawn(process.env.ComSpec ?? "cmd.exe", ["/d", "/s", "/c", command], { cwd: process.cwd(), windowsHide: true, stdio: ["ignore", "pipe", "pipe"] })
    : spawn("npm", ["run", "dev", "--", "--host", "127.0.0.1"], { cwd: process.cwd(), stdio: ["ignore", "pipe", "pipe"] });
  let output = "";
  child.stdout?.on("data", (chunk) => { output = `${output}${chunk}`.slice(-8_000); });
  child.stderr?.on("data", (chunk) => { output = `${output}${chunk}`.slice(-8_000); });
  for (let attempt = 0; attempt < 200; attempt += 1) {
    if (child.exitCode !== null) throw new Error(`Vite exited before becoming ready (${child.exitCode}).\n${output}`);
    try {
      const response = await fetch(appUrl);
      if (response.ok) return {
        command,
        stop: () => {
          if (process.platform === "win32") {
            spawnSync("taskkill", ["/pid", String(child.pid), "/t", "/f"], { windowsHide: true, stdio: "ignore" });
            const port = new URL(appUrl).port || "5173";
            const stopListener = `$owner = Get-NetTCPConnection -LocalAddress '127.0.0.1' -LocalPort ${port} -State Listen -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -First 1; if ($owner) { Stop-Process -Id $owner -Force }`;
            spawnSync("powershell.exe", ["-NoProfile", "-Command", stopListener], { windowsHide: true, stdio: "ignore" });
          } else if (child.exitCode === null) child.kill("SIGTERM");
        },
      };
    } catch {}
    await delay(100);
  }
  if (child.exitCode === null) child.kill();
  throw new Error(`Timed out waiting for ${command}.\n${output}`);
}

function findBrowserExecutables() {
  const candidates = [
    process.env.MOIT_BROWSER_EXECUTABLE,
    join(process.env.ProgramFiles ?? "C:\\Program Files", "Google/Chrome/Application/chrome.exe"),
    join(process.env["ProgramFiles(x86)"] ?? "C:\\Program Files (x86)", "Google/Chrome/Application/chrome.exe"),
  ];
  const executables = [...new Set(candidates.filter((candidate) => candidate && existsSync(candidate)))];
  if (!executables.length) throw new Error("Installed Edge or Chrome was not found.");
  return executables;
}

async function connectToBrowserPipe(executable) {
  const profile = mkdtempSync(join(tmpdir(), "moit-cdp-"));
  const launchArguments = [
    ...(process.env.MOIT_HEADLESS === "1" ? ["--headless=new"] : []),
    "--remote-debugging-pipe",
    `--user-data-dir=${profile}`,
    "--no-first-run",
    "--disable-default-apps",
    "--disable-dev-shm-usage",
    "--no-sandbox",
    "--window-size=2048,1363",
    "--force-device-scale-factor=1",
    "about:blank",
  ];
  const child = spawn(executable, launchArguments, { stdio: ["ignore", "ignore", "pipe", "pipe", "pipe"], windowsHide: false });
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
      launchArguments,
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

const tagConversationByText = (send, { role, text, entryId, stage, action }) => evaluate(send, `(() => {
  const role = ${JSON.stringify(role)};
  const expected = ${JSON.stringify(text)};
  const bubbleSelector = '[data-chat-bubble="' + (role === 'assistant' ? 'assistant' : 'user') + '"]';
  const rows = [...document.querySelectorAll('[data-chat-timeline-row="' + role + '"]')];
  const row = rows.find((candidate) => candidate.querySelector(bubbleSelector)?.innerText.includes(expected));
  if (!row) return null;
  row.setAttribute('data-chat-role', role);
  row.setAttribute('data-chat-entry-id', ${JSON.stringify(entryId)});
  if (${JSON.stringify(stage ?? null)}) row.setAttribute('data-chat-stage', ${JSON.stringify(stage ?? null)});
  if (${JSON.stringify(action ?? null)}) row.setAttribute('data-chat-action', ${JSON.stringify(action ?? null)});
  row.setAttribute('data-chat-part', 'row');
  const logo = row.querySelector('[data-chat-assistant-logo]');
  const bubble = row.querySelector(bubbleSelector);
  const timestamp = row.querySelector('[data-chat-turn] > div > span');
  if (logo) logo.setAttribute('data-chat-part', 'logo');
  if (bubble) bubble.setAttribute('data-chat-part', 'bubble');
  if (timestamp) timestamp.setAttribute('data-chat-part', 'timestamp');
  return { entryId: row.getAttribute('data-chat-entry-id'), text: bubble?.innerText ?? '' };
})()`);

async function completeAirConditionerConditions(send) {
  assert.equal(await clickButton(send, "에어컨"), true, "air-conditioner entry button");
  await waitFor(send, "document.body.innerText.includes('에어컨을 주로 어디에 설치할 예정인가요?')", "air-conditioner first question");
  assert.ok(await tagConversationByText(send, { role: "assistant", text: "에어컨을 주로 어디에 설치할 예정인가요?", entryId: "condition-air-location", stage: "condition" }), "semantic condition assistant selector");
  assert.equal(await clickButton(send, "거실"), true, "living-room choice");
  await waitFor(send, "document.body.innerText.includes('스탠드형으로 진행')", "inferred standing type");
  assert.ok(await tagConversationByText(send, { role: "user", text: "거실", entryId: "condition-user-living-room", stage: "condition" }), "semantic condition user selector");
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

async function clickActionAndWaitForAssistant(send, label, requestedAction) {
  const before = await assistantCount(send);
  await evaluate(send, `document.querySelectorAll('[data-chat-timeline-row="assistant"]').forEach((row) => row.setAttribute('data-cdp-seen', 'true'))`);
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
  const action = requestedAction ?? (label === "예상 세일 달 제안" ? "sale-month" : "alternative-product");
  const entryId = `post-detail-${action}`;
  const tagged = await evaluate(send, `(() => {
    const row = document.querySelector('[data-chat-timeline-row="assistant"]:not([data-cdp-seen])');
    if (!row) return null;
    row.setAttribute('data-chat-role', 'assistant');
    row.setAttribute('data-chat-stage', 'post-detail');
    row.setAttribute('data-chat-action', ${JSON.stringify(action)});
    row.setAttribute('data-chat-entry-id', ${JSON.stringify(entryId)});
    row.setAttribute('data-chat-part', 'row');
    const logo = row.querySelector('[data-chat-assistant-logo]');
    const bubble = row.querySelector('[data-chat-bubble="assistant"]');
    const timestamp = row.querySelector('[data-chat-turn] > div > span');
    if (logo) logo.setAttribute('data-chat-part', 'logo');
    if (bubble) bubble.setAttribute('data-chat-part', 'bubble');
    if (timestamp) timestamp.setAttribute('data-chat-part', 'timestamp');
    return { entryId: row.getAttribute('data-chat-entry-id'), text: bubble?.innerText ?? '' };
  })()`);
  assert.ok(tagged, `${label} semantic assistant selector`);
  assert.ok(await tagConversationByText(send, { role: "user", text: label, entryId: `post-detail-user-${action}`, stage: "post-detail", action }), `${label} semantic user selector`);
  return tagged;
}

const measureRenderedAlignment = (send) => evaluate(send, `(() => {
  const scale = devicePixelRatio * (visualViewport?.scale ?? 1);
  const rect = (element) => {
    if (!element) return null;
    const box = element.getBoundingClientRect();
    return {
      left: box.left, right: box.right, top: box.top, bottom: box.bottom, width: box.width, height: box.height,
      screenshot: { left: box.left * scale, right: box.right * scale, top: box.top * scale, bottom: box.bottom * scale },
    };
  };
  const dataAttributes = (element) => Object.fromEntries([...element.attributes].filter(({ name }) => name.startsWith('data-')).map(({ name, value }) => [name, value]));
  const matchingRules = (element) => {
    const matches = [];
    const visit = (rules, media = null) => {
      for (const rule of [...(rules ?? [])]) {
        if (rule.type === CSSRule.MEDIA_RULE) {
          if (matchMedia(rule.conditionText).matches) visit(rule.cssRules, rule.conditionText);
        } else if (rule.type === CSSRule.STYLE_RULE) {
          try {
            if (element.matches(rule.selectorText)) matches.push({ selector: rule.selectorText, media, cssText: rule.style.cssText });
          } catch {}
        }
      }
    };
    for (const sheet of [...document.styleSheets]) {
      try { visit(sheet.cssRules); } catch {}
    }
    return matches;
  };
  const describeAncestor = (element) => {
    const style = getComputedStyle(element);
    const customProperties = {};
    for (const name of [...style]) {
      if (name.startsWith('--') && /(inset|gutter|width|padding|margin|space|rail|content)/i.test(name)) customProperties[name] = style.getPropertyValue(name).trim();
    }
    return {
      tag: element.tagName,
      className: typeof element.className === 'string' ? element.className : '',
      dataAttributes: dataAttributes(element),
      rectangle: rect(element),
      computed: {
        display: style.display, position: style.position, transform: style.transform, zoom: style.zoom,
        boxSizing: style.boxSizing, width: style.width, maxWidth: style.maxWidth,
        marginLeft: style.marginLeft, marginRight: style.marginRight, marginInline: style.marginInline,
        paddingLeft: style.paddingLeft, paddingRight: style.paddingRight, paddingInline: style.paddingInline,
        gap: style.gap, columnGap: style.columnGap, gridColumn: style.gridColumn,
        gridTemplateColumns: style.gridTemplateColumns, justifyContent: style.justifyContent,
        justifySelf: style.justifySelf, alignItems: style.alignItems, flexBasis: style.flexBasis,
      },
      customProperties,
      matchingRules: matchingRules(element),
    };
  };
  const selectorFor = (element) => {
    if (element.hasAttribute('data-chat-entry-id')) return '[data-chat-entry-id="' + element.getAttribute('data-chat-entry-id') + '"]';
    if (element.hasAttribute('data-chat-timeline-root')) return '[data-chat-timeline-root]';
    return element.tagName.toLowerCase() + (element.id ? '#' + element.id : '') + (typeof element.className === 'string' && element.className ? '.' + element.className.trim().split(/\\s+/).join('.') : '');
  };
  const describeTurn = (row) => {
    if (!row) throw new Error('A required semantic chat row was not found.');
    const logo = row.querySelector('[data-chat-part="logo"]');
    const bubble = row.querySelector('[data-chat-part="bubble"]');
    const timestamp = row.querySelector('[data-chat-part="timestamp"]');
    const ancestors = [];
    for (let element = row; element; element = element.parentElement) {
      ancestors.push(describeAncestor(element));
      if (element.hasAttribute('data-chat-timeline-root')) break;
    }
    return {
      selector: selectorFor(row), entryId: row.getAttribute('data-chat-entry-id'), actionId: row.getAttribute('data-chat-action'),
      text: bubble?.innerText ?? '', row: rect(row), logo: rect(logo), bubble: rect(bubble), timestamp: rect(timestamp), ancestors,
    };
  };
  const conditionRow = document.querySelector('[data-chat-role="assistant"][data-chat-stage="condition"][data-chat-entry-id="condition-air-location"]');
  const saleRow = document.querySelector('[data-chat-role="assistant"][data-chat-stage="post-detail"][data-chat-action="sale-month"]');
  const alternativeRow = document.querySelector('[data-chat-role="assistant"][data-chat-stage="post-detail"][data-chat-action="alternative-product"]');
  const repeatedSaleRow = document.querySelector('[data-chat-role="assistant"][data-chat-stage="post-detail"][data-chat-action="sale-month-repeat"]');
  const conditionUser = document.querySelector('[data-chat-role="user"][data-chat-entry-id="condition-user-living-room"] [data-chat-part="bubble"]');
  const timeline = document.querySelector('[data-chat-timeline-root]');
  const aiReorder = document.querySelector('[data-chat-content="ai-reorder"]') ?? [...document.querySelectorAll('section')].find((section) => [...section.querySelectorAll('h3')].some((heading) => heading.textContent?.trim() === 'AI 최적화 재정렬'));
  const recommendationShell = document.querySelector('[data-chat-content="recommendation-shell"]') ?? aiReorder?.closest('[data-chat-wide-content-inner]') ?? aiReorder?.closest('[data-chat-wide-content]');
  const productDetail = document.querySelector('[data-chat-content="product-detail"]') ?? document.querySelector('[data-stage="viewing-product-detail"]');
  const actionToolbar = document.querySelector('[data-chat-content="action-toolbar"]') ?? document.querySelector('[data-product-action-toolbar]')?.parentElement;
  return {
    environment: {
      innerWidth, innerHeight, outerWidth, outerHeight, devicePixelRatio,
      visualViewportWidth: visualViewport?.width ?? null, visualViewportScale: visualViewport?.scale ?? null,
      detectableBrowserZoom: visualViewport?.scale ?? null,
      screenWidth: screen.width, screenHeight: screen.height, cssToScreenshotScale: scale,
    },
    timeline: rect(timeline),
    condition: describeTurn(conditionRow),
    saleMonth: describeTurn(saleRow),
    alternativeProduct: describeTurn(alternativeRow),
    repeatedSaleMonth: describeTurn(repeatedSaleRow),
    protected: {
      userBubble: rect(conditionUser),
      aiReorder: rect(aiReorder),
      recommendationShell: rect(recommendationShell),
      productDetail: rect(productDetail),
      actionToolbar: rect(actionToolbar),
    },
  };
})()`);

function pngDimensions(buffer) {
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

function baselineCoordinates(report) {
  const { condition, protected: protectedLayout, timeline } = report.measurement;
  return {
    conditionRowLeft: condition.row.left,
    conditionRowWidth: condition.row.width,
    conditionLogoLeft: condition.logo.left,
    conditionBubbleLeft: condition.bubble.left,
    conditionBubbleRight: condition.bubble.right,
    conditionBubbleWidth: condition.bubble.width,
    conditionTimestampLeft: condition.timestamp.left,
    userBubbleRight: protectedLayout.userBubble.right,
    aiReorderLeft: protectedLayout.aiReorder.left,
    aiReorderRight: protectedLayout.aiReorder.right,
    recommendationShellLeft: protectedLayout.recommendationShell.left,
    recommendationShellRight: protectedLayout.recommendationShell.right,
    productDetailLeft: protectedLayout.productDetail.left,
    productDetailRight: protectedLayout.productDetail.right,
    actionToolbarLeft: protectedLayout.actionToolbar.left,
    actionToolbarRight: protectedLayout.actionToolbar.right,
    timelineLeft: timeline.left,
    timelineRight: timeline.right,
    timelineWidth: timeline.width,
  };
}

function assertWithinOne(actual, expected, label) {
  const difference = Math.abs(actual - expected);
  assert.ok(difference <= 1, `${label} changed by ${difference}px (${expected} -> ${actual})`);
}

const prepareCompactEvidenceView = (send) => evaluate(send, `(() => {
  const timeline = document.querySelector('[data-chat-timeline-root]');
  const keep = new Set([
    document.querySelector('[data-chat-entry-id="condition-air-location"]'),
    document.querySelector('[data-chat-entry-id="condition-user-living-room"]'),
    document.querySelector('[data-stage="viewing-product-detail"]')?.closest('[data-chat-wide-content]'),
    document.querySelector('[data-product-action-toolbar]')?.closest('[data-chat-wide-content]'),
    document.querySelector('[data-chat-action="sale-month"][data-chat-role="assistant"]'),
    document.querySelector('[data-chat-action="alternative-product"][data-chat-role="assistant"]'),
  ].filter(Boolean));
  for (const child of [...timeline.children]) if (!keep.has(child)) child.style.display = 'none';
  const detail = document.querySelector('[data-stage="viewing-product-detail"]')?.closest('[data-chat-wide-content]');
  if (detail) { detail.style.maxHeight = '260px'; detail.style.overflow = 'hidden'; }
  document.querySelector('main')?.scrollTo({ top: 0, behavior: 'instant' });
  return { kept: [...keep].map((element) => element.getAttribute('data-chat-entry-id') ?? (element.querySelector('[data-stage="viewing-product-detail"]') ? 'product-detail' : 'action-toolbar')) };
})()`);

const vite = await startVite();
let connection;
try {
  connection = process.env.MOIT_CDP_WS || process.env.MOIT_CDP_PORT ? await connectWithWebSocket() : await connectWithPipe();
  const { send } = connection;
  await send("Runtime.enable");
  await send("Page.enable");
  const viewportWidth = Number(process.env.MOIT_VIEWPORT_WIDTH ?? 1638);
  const viewportHeight = Number(process.env.MOIT_VIEWPORT_HEIGHT ?? 1090);
  const deviceScaleFactor = Number(process.env.MOIT_DEVICE_SCALE_FACTOR ?? (2048 / 1638));
  await send("Emulation.setDeviceMetricsOverride", { width: viewportWidth, height: viewportHeight, deviceScaleFactor, mobile: false });
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
    await completeAirConditionerConditions(send);
    await selectFirstInternalRecommendation(send);
    const saleTag = await clickActionAndWaitForAssistant(send, "예상 세일 달 제안");
    const alternativeTag = await clickActionAndWaitForAssistant(send, "다른 제품 추천");
    const repeatedSaleTag = await clickActionAndWaitForAssistant(send, "예상 세일 달 제안", "sale-month-repeat");
    const measurement = await measureRenderedAlignment(send);
    const screenshot = await send("Page.captureScreenshot", { format: "png", fromSurface: true, captureBeyondViewport: false });
    const screenshotBuffer = Buffer.from(screenshot.data, "base64");
    const screenshotSize = pngDimensions(screenshotBuffer);
    const evidenceView = await prepareCompactEvidenceView(send);
    const evidenceScreenshot = await send("Page.captureScreenshot", { format: "png", fromSurface: true, captureBeyondViewport: false });
    const evidenceScreenshotBuffer = Buffer.from(evidenceScreenshot.data, "base64");
    const deltas = {
      saleLogo: Math.abs(measurement.condition.logo.left - measurement.saleMonth.logo.left),
      saleBubble: Math.abs(measurement.condition.bubble.left - measurement.saleMonth.bubble.left),
      alternativeLogo: Math.abs(measurement.condition.logo.left - measurement.alternativeProduct.logo.left),
      alternativeBubble: Math.abs(measurement.condition.bubble.left - measurement.alternativeProduct.bubble.left),
      repeatedSaleLogo: Math.abs(measurement.condition.logo.left - measurement.repeatedSaleMonth.logo.left),
      repeatedSaleBubble: Math.abs(measurement.condition.bubble.left - measurement.repeatedSaleMonth.bubble.left),
    };
    const wideAlignmentDeltas = {
      aiReorder: Math.abs(measurement.protected.aiReorder.left - measurement.condition.bubble.left),
      recommendationShell: Math.abs(measurement.protected.recommendationShell.left - measurement.condition.bubble.left),
      productDetail: Math.abs(measurement.protected.productDetail.left - measurement.condition.bubble.left),
      actionToolbar: Math.abs(measurement.protected.actionToolbar.left - measurement.condition.bubble.left),
    };
    const report = {
      browserExecutable: connection.browserExecutable,
      browserVersion: connection.browserVersion,
      chromeLaunchArguments: connection.launchArguments ?? [],
      applicationCommand: vite?.command ?? "external application server",
      selectedMessages: { condition: { id: measurement.condition.entryId, text: measurement.condition.text }, saleMonth: saleTag, alternativeProduct: alternativeTag, repeatedSaleMonth: repeatedSaleTag },
      screenshotSize,
      evidenceView,
      measurement,
      protectedCoordinates: baselineCoordinates({ measurement }),
      deltas,
      wideAlignmentDeltas,
    };
    mkdirSync(artifactDirectory, { recursive: true });
    const artifactStem = mode === "baseline" ? "post-rollback-baseline" : `chat-alignment-${viewportWidth}x${viewportHeight}`;
    writeFileSync(join(artifactDirectory, `${artifactStem}.json`), `${JSON.stringify(report, null, 2)}\n`);
    writeFileSync(join(artifactDirectory, `${artifactStem}.png`), screenshotBuffer);
    writeFileSync(join(artifactDirectory, `${artifactStem}-evidence.png`), evidenceScreenshotBuffer);
    console.log(JSON.stringify(report, null, 2));
    if (mode === "verify") {
      for (const [name, delta] of Object.entries(deltas)) assert.ok(delta <= 1, `${name} differs by ${delta}px`);
      for (const [name, delta] of Object.entries(wideAlignmentDeltas)) assert.ok(delta <= 1, `${name} left edge differs from the assistant bubble by ${delta}px`);
      const baselinePath = process.env.MOIT_CDP_BASELINE_JSON;
      if (baselinePath) {
        const baseline = JSON.parse(readFileSync(baselinePath, "utf8"));
        const current = report.protectedCoordinates;
        const protectedKeys = [
          "conditionRowLeft", "conditionRowWidth", "conditionLogoLeft", "conditionBubbleLeft", "conditionBubbleRight", "conditionBubbleWidth", "conditionTimestampLeft",
          "userBubbleRight", "recommendationShellRight", "productDetailRight", "actionToolbarRight", "timelineLeft", "timelineRight", "timelineWidth",
        ];
        for (const key of protectedKeys) assertWithinOne(current[key], baseline.protectedCoordinates[key], key);
      }
    }
  }
} finally {
  await connection?.close();
  vite?.stop();
}
