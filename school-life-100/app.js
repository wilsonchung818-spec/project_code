(() => {
  "use strict";

  const lesson = window.SCHOOL_LIFE_LESSON;
  const root = document.getElementById("main-content");
  const toast = document.getElementById("toast");
  const installButton = document.getElementById("install-button");
  const languageButton = document.getElementById("language-button");
  const installSheet = document.getElementById("install-sheet");
  const installInstructions = document.getElementById("install-instructions");
  const connectionStatus = document.getElementById("connection-status");

  const STATE_KEY = "school-life-speaking:v1";
  const DEFAULT_STATE = {
    view: "learn",
    showChinese: true,
    sceneIndex: 0,
    role: "A",
    selectedChoices: {},
    completedChunks: [],
    canDo: [false, false, false],
    review: [false, false, false, false]
  };

  let state = loadState();
  let deferredInstallPrompt = null;
  let activeAudio = null;
  let activeAudioButton = null;
  let answerHidden = false;
  let mediaRecorder = null;
  let recorderStream = null;
  let recorderChunks = [];
  let recordingUrl = "";
  let toastTimer = 0;

  function loadState() {
    try {
      const stored = JSON.parse(localStorage.getItem(STATE_KEY) || "null");
      return { ...DEFAULT_STATE, ...(stored || {}) };
    } catch {
      return { ...DEFAULT_STATE };
    }
  }

  function saveState() {
    localStorage.setItem(STATE_KEY, JSON.stringify(state));
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function speakerSvg() {
    return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 9h4l5-4v14l-5-4H5V9Z"/><path d="M17 9a4 4 0 0 1 0 6M19 6a8 8 0 0 1 0 12"/></svg>';
  }

  function micSvg() {
    return '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="3" width="6" height="12" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3M8 21h8"/></svg>';
  }

  function playSvg() {
    return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m8 5 11 7-11 7V5Z"/></svg>';
  }

  function eyeSvg(hidden) {
    return hidden
      ? '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m3 3 18 18M10.6 10.7a2 2 0 0 0 2.7 2.7M9.8 5.2A10 10 0 0 1 12 5c5 0 9 5.5 9 7a10 10 0 0 1-2.1 3.2M6.3 6.3C4.2 7.7 3 10.5 3 12c0 1.5 4 7 9 7a9 9 0 0 0 3-.5"/></svg>'
      : '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 12c0-1.5 4-7 9-7s9 5.5 9 7-4 7-9 7-9-5.5-9-7Z"/><circle cx="12" cy="12" r="2.5"/></svg>';
  }

  function refreshLanguageButton() {
    languageButton.setAttribute("aria-pressed", String(!state.showChinese));
    languageButton.setAttribute("aria-label", state.showChinese ? "隐藏中文" : "显示中文");
    languageButton.title = state.showChinese ? "隐藏中文" : "显示中文";
  }

  function zh(text, className = "") {
    return `<span data-zh class="${className}"${state.showChinese ? "" : " hidden"}>${escapeHtml(text)}</span>`;
  }

  function showToast(message) {
    clearTimeout(toastTimer);
    toast.textContent = message;
    toast.classList.add("is-visible");
    toastTimer = window.setTimeout(() => toast.classList.remove("is-visible"), 2400);
  }

  function stopAudio() {
    if (activeAudio) {
      activeAudio.pause();
      activeAudio.currentTime = 0;
    }
    activeAudioButton?.classList.remove("is-playing");
    activeAudio = null;
    activeAudioButton = null;
  }

  function playAudio(src, button) {
    if (activeAudio && activeAudio.src.endsWith(src.replace("./", ""))) {
      stopAudio();
      return;
    }
    stopAudio();
    const audio = new Audio(src);
    activeAudio = audio;
    activeAudioButton = button;
    button?.classList.add("is-playing");
    audio.addEventListener("ended", stopAudio, { once: true });
    audio.addEventListener("error", () => {
      stopAudio();
      showToast("音频暂时无法播放，请检查网络后重试");
    }, { once: true });
    audio.play().catch(() => {
      stopAudio();
      showToast("请再次点击播放音频");
    });
  }

  function setView(view, updateHash = true) {
    const allowed = ["learn", "speak", "challenge"];
    if (mediaRecorder?.state === "recording") stopRecording();
    state.view = allowed.includes(view) ? view : "learn";
    saveState();
    if (updateHash && location.hash !== `#${state.view}`) {
      history.pushState(null, "", `#${state.view}`);
    }
    answerHidden = false;
    stopAudio();
    render();
    root.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: "auto" });
  }

  function renderNavigation() {
    document.querySelectorAll(".nav-item").forEach(button => {
      const active = button.dataset.view === state.view;
      button.classList.toggle("is-active", active);
      if (active) button.setAttribute("aria-current", "page");
      else button.removeAttribute("aria-current");
    });
  }

  function renderLearn() {
    const chunkRows = lesson.chunks.map((chunk, index) => {
      const done = state.completedChunks.includes(chunk.id);
      return `
        <div class="chunk-item">
          <span class="chunk-number">${index + 1}</span>
          <span class="chunk-copy">
            <strong>${escapeHtml(chunk.text)}</strong>
            ${zh(chunk.zh, "chunk-zh")}
          </span>
          <button class="check-button ${done ? "is-done" : ""}" type="button" data-action="toggle-chunk" data-chunk="${chunk.id}" aria-label="${done ? "取消完成" : "标记已会"} ${escapeHtml(chunk.text)}">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 4 4 10-10"/></svg>
          </button>
        </div>`;
    }).join("");

    const naturalSpeech = lesson.naturalSpeech.map(item => `
      <div class="natural-item">
        <small>${escapeHtml(item.full)}</small>
        <strong>→ ${escapeHtml(item.short)}</strong>
      </div>`).join("");

    return `
      <section class="view learn-view" aria-labelledby="learn-title">
        <div class="can-do-banner">
          <p class="eyebrow">Today's speaking goal</p>
          <h1 id="learn-title">${escapeHtml(lesson.canDo)}</h1>
          ${zh(lesson.canDoZh)}
        </div>

        <article class="word-hero">
          <img src="${lesson.scenes[0].image}" alt="${escapeHtml(lesson.scenes[0].alt)}">
          <div class="word-copy">
            <div class="word-copy-top">
              <div>
                <h2 class="word-title">${escapeHtml(lesson.word)} <span class="word-ipa">${escapeHtml(lesson.ipa)}</span></h2>
                ${zh(`${lesson.meaning} · ${lesson.partOfSpeech}`, "meaning-line")}
              </div>
              <div class="hero-actions">
                <button class="round-action" type="button" data-action="play-audio" data-audio="${lesson.audio.word}" aria-label="播放 book 发音">
                  ${speakerSvg()}
                </button>
              </div>
            </div>
            <div class="phonics-row">
              <div class="phonics-block">
                <span class="phonics-build">${escapeHtml(lesson.phonics.build)}</span>
                <span class="phonics-sound">${escapeHtml(lesson.phonics.sound)}</span>
              </div>
              <div class="family-block">${lesson.phonics.family.map(escapeHtml).join(" · ")}</div>
            </div>
          </div>
        </article>

        <section aria-labelledby="chunks-title">
          <div class="section-heading">
            <div>
              <h2 id="chunks-title">高频语块</h2>
              <p>先听整体，再完整说出来</p>
            </div>
            <button class="text-button" type="button" data-action="play-audio" data-audio="${lesson.audio.chunks}">播放全部</button>
          </div>
          <div class="chunk-list">${chunkRows}</div>
        </section>

        <section aria-labelledby="natural-title">
          <div class="section-heading">
            <div>
              <h2 id="natural-title">自然口语</h2>
              <p>听起来更像真实交流</p>
            </div>
          </div>
          <div class="natural-strip">${naturalSpeech}</div>
        </section>

        <section class="chant-strip" aria-label="开口热身">
          <div>
            <strong>Look at my book!</strong>
            <small>先听 → 指图 → 跟读 → 遮住文字再说</small>
          </div>
          <button class="round-action" type="button" data-action="play-audio" data-audio="${lesson.audio.word}" aria-label="播放开口热身">
            ${speakerSvg()}
          </button>
        </section>

        <a class="pdf-link" href="./assets/downloads/book-optimized.pdf" target="_blank" rel="noopener">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 2h8l4 4v16H6z"/><path d="M14 2v5h5M9 13h6M9 17h6"/></svg>
          查看两页打印版 PDF
        </a>
      </section>`;
  }

  function sceneAccent(scene) {
    return scene.color === "coral" ? "#ff776c" : scene.color === "teal" ? "#16a99a" : "#3d7eff";
  }

  function renderSpeak() {
    const scene = lesson.scenes[state.sceneIndex];
    const selectedIndex = Number(state.selectedChoices[scene.id] ?? -1);
    const selected = selectedIndex >= 0 ? scene.choices[selectedIndex] : null;
    const answer = selected?.answer || scene.answer;
    const choices = scene.choices.map((choice, index) => `
      <button class="choice-chip ${selectedIndex === index ? "is-active" : ""}" type="button" data-action="select-choice" data-choice="${index}">${escapeHtml(choice.label)}</button>
    `).join("");
    const dots = lesson.scenes.map((item, index) => `
      <button class="progress-dot ${index === state.sceneIndex ? "is-active" : ""}" type="button" data-action="go-scene" data-scene="${index}" aria-label="打开情境 ${index + 1}：${escapeHtml(item.label)}"></button>
    `).join("");
    const roleNote = state.role === "A" ? "你先负责 A 提问" : "你先负责 B 回答";

    return `
      <section class="view speak-view" aria-labelledby="speak-title">
        <header class="speak-header">
          <p class="eyebrow">Ask · Answer · Change · Switch</p>
          <h1 id="speak-title">看图问答，真正开口</h1>
          <p>${escapeHtml(roleNote)}；说完后交换角色，再换一个词。</p>
        </header>
        <div class="progress-dots">${dots}</div>

        <article class="scene-stage ${answerHidden ? "is-answer-hidden" : ""}" style="--accent:${sceneAccent(scene)}">
          <div class="scene-image-wrap">
            <img src="${scene.image}" alt="${escapeHtml(scene.alt)}">
            <span class="scene-index">${state.sceneIndex + 1}</span>
            <span class="scene-label">${escapeHtml(scene.label)}</span>
          </div>
          <div class="scene-content">
            <div class="role-line question">
              <span class="role-badge">A</span>
              <span class="role-copy">${escapeHtml(scene.question)}</span>
            </div>
            <div class="role-line answer">
              <span class="role-badge">B</span>
              <span class="role-copy" id="scene-answer">${escapeHtml(answer)}</span>
            </div>
            ${zh(scene.zh, "translation")}

            <div class="change-block">
              <p class="change-title">换一个词 · CHANGE ONE THING</p>
              <div class="choice-list">${choices}</div>
            </div>

            <div class="scene-actions">
              <button class="audio-action" type="button" data-action="play-audio" data-audio="${scene.audio}">
                ${speakerSvg()}<span>听双人对话</span>
              </button>
              <button class="secondary-action" type="button" data-action="toggle-answer">
                ${eyeSvg(answerHidden)}<span>${answerHidden ? "显示答案" : "隐藏答案"}</span>
              </button>
              <button class="secondary-action" type="button" data-action="switch-role">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m7 7-4 4 4 4M3 11h14M17 17l4-4-4-4M21 13H7"/></svg>
                <span>交换角色</span>
              </button>
            </div>
          </div>
        </article>

        <div class="scene-navigation">
          <button type="button" data-action="previous-scene">← 上一个</button>
          <button type="button" data-action="next-scene">下一个 →</button>
        </div>
      </section>`;
  }

  function renderChallenge() {
    const canDoLabels = ["我能用英语提问", "我能不看答案完整回答", "我能换词再说一遍"];
    const reviewLabels = ["今天", "第2天", "第7天", "第14天"];
    return `
      <section class="view challenge-view" aria-labelledby="challenge-title">
        <header class="challenge-header">
          <p class="eyebrow">Speak without looking</p>
          <h1 id="challenge-title">把 book 变成你的话</h1>
          <p>只听问题，留出时间自己回答。录音只保存在当前设备，不会上传。</p>
        </header>

        <section class="mission-panel" aria-labelledby="mission-title">
          <h2 id="mission-title">Find your partner's book.</h2>
          <p>Is this your book? · What color is it? · Where is it?</p>
          <div class="mission-actions">
            <button type="button" data-action="play-audio" data-audio="${lesson.audio.challenge}">${speakerSvg()} 只听问题挑战</button>
            <button type="button" data-view="speak">先复习情境</button>
          </div>
        </section>

        <section class="record-panel" aria-labelledby="record-title">
          <h2 id="record-title">录下你的回答</h2>
          <p>建议连续说 15 秒：先回答，再换一个词，最后交换角色。</p>
          <div class="recorder-actions">
            <button class="record-button" id="record-button" type="button" data-action="toggle-recording">${micSvg()}<span>开始录音</span></button>
            <button class="playback-button" id="playback-button" type="button" data-action="play-recording" ${recordingUrl ? "" : "hidden"}>${playSvg()}<span>回听</span></button>
            <span class="record-status" id="record-status">准备好了就开始</span>
          </div>
        </section>

        <section class="can-do-panel" aria-labelledby="cando-title">
          <h2 id="cando-title">我会了 · CAN-DO</h2>
          <p>完成一项就勾选，下一次复习从没有勾选的地方开始。</p>
          <div class="can-do-list">
            ${canDoLabels.map((label, index) => `
              <label class="can-do-item">
                <input type="checkbox" data-action="toggle-can-do" data-index="${index}" ${state.canDo[index] ? "checked" : ""}>
                <span>${escapeHtml(label)}</span>
              </label>`).join("")}
          </div>
          <div class="review-row" aria-label="间隔复习记录">
            ${reviewLabels.map((label, index) => `
              <button class="review-check ${state.review[index] ? "is-done" : ""}" type="button" data-action="toggle-review" data-index="${index}">${state.review[index] ? "✓ " : ""}${escapeHtml(label)}</button>
            `).join("")}
          </div>
        </section>

        <section class="install-panel" aria-labelledby="install-title">
          <div>
            <h2 id="install-title">安装到手机</h2>
            <p>添加到主屏幕后，可以像普通应用一样打开，并支持离线学习。</p>
          </div>
          <button class="primary-button" type="button" data-action="install">安装</button>
        </section>
      </section>`;
  }

  function render() {
    renderNavigation();
    refreshLanguageButton();
    if (state.view === "speak") root.innerHTML = renderSpeak();
    else if (state.view === "challenge") root.innerHTML = renderChallenge();
    else root.innerHTML = renderLearn();
  }

  function toggleChunk(id) {
    const done = state.completedChunks.includes(id);
    state.completedChunks = done
      ? state.completedChunks.filter(item => item !== id)
      : [...state.completedChunks, id];
    saveState();
    render();
  }

  function moveScene(offset) {
    const count = lesson.scenes.length;
    state.sceneIndex = (state.sceneIndex + offset + count) % count;
    answerHidden = false;
    saveState();
    render();
  }

  function showInstallHelp() {
    const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches || navigator.standalone;
    if (isStandalone) {
      showToast("应用已经安装在这台设备上");
      return;
    }
    installInstructions.innerHTML = isIos
      ? "<p>在 Safari 中完成安装：</p><ol><li>点击底部的“分享”按钮。</li><li>向下滑动，选择“添加到主屏幕”。</li><li>点击右上角“添加”。</li></ol>"
      : "<p>如果浏览器没有直接显示安装提示，请打开浏览器菜单，选择“安装应用”或“添加到主屏幕”。</p>";
    installSheet.showModal();
  }

  async function installApp() {
    if (!deferredInstallPrompt) {
      showInstallHelp();
      return;
    }
    deferredInstallPrompt.prompt();
    await deferredInstallPrompt.userChoice;
    deferredInstallPrompt = null;
  }

  async function startRecording() {
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      showToast("当前浏览器不支持录音，请换用最新版 Safari 或 Chrome");
      return;
    }
    try {
      recorderStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      recorderChunks = [];
      mediaRecorder = new MediaRecorder(recorderStream);
      mediaRecorder.addEventListener("dataavailable", event => {
        if (event.data.size) recorderChunks.push(event.data);
      });
      mediaRecorder.addEventListener("stop", () => {
        if (recordingUrl) URL.revokeObjectURL(recordingUrl);
        recordingUrl = URL.createObjectURL(new Blob(recorderChunks, { type: mediaRecorder.mimeType || "audio/webm" }));
        recorderStream?.getTracks().forEach(track => track.stop());
        recorderStream = null;
        updateRecorderUi(false, "录音完成，可以回听");
      });
      mediaRecorder.start();
      updateRecorderUi(true, "正在录音……说完后点击停止");
    } catch {
      showToast("未获得麦克风权限，录音功能无法使用");
    }
  }

  function stopRecording() {
    if (mediaRecorder?.state === "recording") mediaRecorder.stop();
  }

  function updateRecorderUi(recording, message) {
    const button = document.getElementById("record-button");
    const status = document.getElementById("record-status");
    const playback = document.getElementById("playback-button");
    if (!button || !status) return;
    button.classList.toggle("is-recording", recording);
    button.innerHTML = `${micSvg()}<span>${recording ? "停止录音" : "重新录音"}</span>`;
    status.textContent = message;
    if (playback) playback.hidden = !recordingUrl || recording;
  }

  root.addEventListener("click", event => {
    const viewButton = event.target.closest("[data-view]");
    if (viewButton) {
      setView(viewButton.dataset.view);
      return;
    }

    const button = event.target.closest("[data-action]");
    if (!button) return;
    const action = button.dataset.action;
    if (action === "play-audio") playAudio(button.dataset.audio, button);
    if (action === "toggle-chunk") toggleChunk(button.dataset.chunk);
    if (action === "toggle-answer") {
      answerHidden = !answerHidden;
      render();
    }
    if (action === "switch-role") {
      state.role = state.role === "A" ? "B" : "A";
      saveState();
      showToast(state.role === "A" ? "现在你先提问" : "现在你先回答");
      render();
    }
    if (action === "select-choice") {
      const scene = lesson.scenes[state.sceneIndex];
      state.selectedChoices[scene.id] = Number(button.dataset.choice);
      saveState();
      render();
    }
    if (action === "previous-scene") moveScene(-1);
    if (action === "next-scene") moveScene(1);
    if (action === "go-scene") {
      state.sceneIndex = Number(button.dataset.scene);
      answerHidden = false;
      saveState();
      render();
    }
    if (action === "toggle-recording") {
      if (mediaRecorder?.state === "recording") stopRecording();
      else startRecording();
    }
    if (action === "play-recording" && recordingUrl) playAudio(recordingUrl, button);
    if (action === "toggle-review") {
      const index = Number(button.dataset.index);
      state.review[index] = !state.review[index];
      saveState();
      render();
    }
    if (action === "install") installApp();
  });

  root.addEventListener("change", event => {
    const input = event.target.closest('[data-action="toggle-can-do"]');
    if (!input) return;
    state.canDo[Number(input.dataset.index)] = input.checked;
    saveState();
  });

  document.addEventListener("click", event => {
    const viewButton = event.target.closest("[data-view]");
    if (viewButton && !root.contains(viewButton)) setView(viewButton.dataset.view);
    if (event.target.closest("[data-close-dialog]")) installSheet.close();
  });

  languageButton.addEventListener("click", () => {
    state.showChinese = !state.showChinese;
    saveState();
    render();
  });

  installButton.addEventListener("click", installApp);

  window.addEventListener("hashchange", () => setView(location.hash.slice(1), false));
  window.addEventListener("beforeinstallprompt", event => {
    event.preventDefault();
    deferredInstallPrompt = event;
    installButton.hidden = false;
  });
  window.addEventListener("appinstalled", () => {
    deferredInstallPrompt = null;
    showToast("开口词卡已经安装完成");
  });
  window.addEventListener("online", updateConnectionState);
  window.addEventListener("offline", updateConnectionState);

  function updateConnectionState() {
    connectionStatus.hidden = navigator.onLine;
  }

  async function registerServiceWorker() {
    if (!("serviceWorker" in navigator)) return;
    try {
      const registration = await navigator.serviceWorker.register("./service-worker.js", { scope: "./" });
      registration.addEventListener("updatefound", () => {
        const worker = registration.installing;
        worker?.addEventListener("statechange", () => {
          if (worker.state === "installed" && navigator.serviceWorker.controller) {
            showToast("新版本已准备好，下次打开生效");
          }
        });
      });
    } catch {
      console.warn("Service worker registration failed.");
    }
  }

  const initialView = location.hash.slice(1);
  if (["learn", "speak", "challenge"].includes(initialView)) state.view = initialView;
  updateConnectionState();
  refreshLanguageButton();
  render();
  registerServiceWorker();
})();
