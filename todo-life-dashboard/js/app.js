/**
 * To-Do List Life Dashboard - Single File MVP
 * Covers: Greeting, Focus Timer (25min), To-Do List, Quick Links
 * Storage keys: todoLifeDashboardTasks, todoLifeDashboardQuickLinks
 * Clean & readable - no build tools, vanilla JS
 */

// ============================================
// 1. STORAGE HELPER
// ============================================
const Storage = {
  get(key, defaultValue = null) {
    try {
      const item = localStorage.getItem(key);
      return item !== null ? JSON.parse(item) : defaultValue;
    } catch (e) {
      console.error(`Storage.get error: ${key}`, e);
      return defaultValue;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.error(`Storage.set error: ${key}`, e);
      return false;
    }
  },
  remove(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch {
      return false;
    }
  },
  isAvailable() {
    try {
      const k = "__storage_test__";
      localStorage.setItem(k, "test");
      localStorage.removeItem(k);
      return true;
    } catch {
      return false;
    }
  },
};

// ============================================
// 2. UTILS
// ============================================
function formatTime12Hour(date) {
  const h = date.getHours();
  const m = date.getMinutes();
  const s = date.getSeconds();
  const h12 = h % 12 || 12;
  const ampm = h < 12 ? "AM" : "PM";
  return `${String(h12).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")} ${ampm}`;
}

function formatDateFull(date) {
  const dayName = date.toLocaleDateString("en-US", { weekday: "long" });
  const monthName = date.toLocaleDateString("en-US", { month: "long" });
  return `${dayName}, ${monthName} ${date.getDate()}, ${date.getFullYear()}`;
}

function getTimeBasedGreeting(date) {
  const h = date.getHours();
  if (h >= 5 && h < 12) return "Good Morning";
  if (h >= 12 && h < 17) return "Good Afternoon";
  if (h >= 17 && h < 21) return "Good Evening";
  return "Good Night";
}

function isValidTaskDescription(text) {
  if (typeof text !== "string") return false;
  const t = text.trim();
  return t.length >= 1 && t.length <= 100;
}

function isValidUserName(text) {
  if (typeof text !== "string") return false;
  const t = text.trim();
  return t.length >= 1 && t.length <= 30;
}

function isDuplicateTaskDescription(text, tasks, excludeId = null) {
  if (!text || typeof text !== "string") return false;
  const norm = text.trim().toLowerCase();
  if (!Array.isArray(tasks) || tasks.length === 0) return false;
  return tasks.some((t) => t.id !== excludeId && t.description && t.description.trim().toLowerCase() === norm);
}

function isValidLinkName(text) {
  if (typeof text !== "string") return false;
  const t = text.trim();
  return t.length >= 1 && t.length <= 100;
}

function isValidUrl(text) {
  if (typeof text !== "string" || text.trim().length === 0) return false;
  if (text.length > 2048) return false;
  try {
    const u = new URL(text);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

function isUniqueUrl(url, existingLinks) {
  if (!url || typeof url !== "string") return false;
  const norm = url.trim().toLowerCase();
  if (!Array.isArray(existingLinks) || existingLinks.length === 0) return true;
  return !existingLinks.some((l) => l.url && l.url.trim().toLowerCase() === norm);
}

function sanitizeInput(text) {
  if (typeof text !== "string") return "";
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

function generateUUID() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function getFaviconUrl(url) {
  try {
    const host = new URL(url).hostname;
    return `https://www.google.com/s2/favicons?domain=${host}&sz=32`;
  } catch {
    return null;
  }
}

// ============================================
// 3. GREETING COMPONENT
// ============================================
function initGreeting(container) {
  if (!container) return;
  const STORAGE_KEY = "todoLifeDashboardUserName";
  let userName = Storage.get(STORAGE_KEY, "");

  container.innerHTML = `
    <div class="greeting-container">
      <div class="greeting-row">
        <div class="greeting-text" id="greeting-text"></div>
        <button class="greeting-edit-btn" id="greeting-edit" title="Edit name" aria-label="Edit name">✎</button>
      </div>
      <div class="greeting-edit-section" id="greeting-edit-section" style="display:none;">
        <input type="text" class="greeting-name-input" id="greeting-name-input" maxlength="30" placeholder="Your name" aria-label="Your name" />
        <button type="button" class="greeting-save-btn" id="greeting-save">Save</button>
        <button type="button" class="greeting-cancel-btn" id="greeting-cancel">Cancel</button>
      </div>
      <div class="greeting-error" id="greeting-error" aria-live="polite"></div>
      <div class="time-display" id="time-display"></div>
      <div class="date-display" id="date-display"></div>
    </div>
  `;

  const greetingEl = container.querySelector("#greeting-text");
  const timeEl = container.querySelector("#time-display");
  const dateEl = container.querySelector("#date-display");
  const editBtn = container.querySelector("#greeting-edit");
  const editSection = container.querySelector("#greeting-edit-section");
  const nameInput = container.querySelector("#greeting-name-input");
  const saveBtn = container.querySelector("#greeting-save");
  const cancelBtn = container.querySelector("#greeting-cancel");
  const errorEl = container.querySelector("#greeting-error");
  let currentDateStr = "";

  function getGreetingText(date) {
    const base = getTimeBasedGreeting(date);
    if (userName && typeof userName === "string" && userName.trim().length > 0) {
      return `${base}, ${userName.trim()}`;
    }
    return base;
  }

  function showEdit(show) {
    if (show) {
      editSection.style.display = "flex";
      nameInput.value = userName || "";
      errorEl.textContent = "";
      nameInput.classList.remove("input-error");
      nameInput.focus();
      nameInput.select();
    } else {
      editSection.style.display = "none";
      errorEl.textContent = "";
      nameInput.classList.remove("input-error");
    }
  }

  function saveName() {
    const raw = nameInput.value.trim();
    if (raw.length === 0) {
      // clear name
      userName = "";
      Storage.remove(STORAGE_KEY);
      showEdit(false);
      renderGreeting();
      return;
    }
    if (!isValidUserName(raw)) {
      errorEl.textContent = "Name must be 1-30 characters";
      nameInput.classList.add("input-error");
      return;
    }
    userName = raw;
    Storage.set(STORAGE_KEY, userName);
    showEdit(false);
    renderGreeting();
  }

  function renderGreeting() {
    greetingEl.textContent = getGreetingText(new Date());
  }

  function render() {
    const now = new Date();
    greetingEl.textContent = getGreetingText(now);
    timeEl.textContent = formatTime12Hour(now);
    const dateStr = formatDateFull(now);
    if (dateStr !== currentDateStr) {
      dateEl.textContent = dateStr;
      currentDateStr = dateStr;
    }
  }

  editBtn.addEventListener("click", () => showEdit(true));
  saveBtn.addEventListener("click", saveName);
  cancelBtn.addEventListener("click", () => showEdit(false));
  nameInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") saveName();
    if (e.key === "Escape") showEdit(false);
  });
  nameInput.addEventListener("input", () => {
    errorEl.textContent = "";
    nameInput.classList.remove("input-error");
  });

  render();
  const interval = setInterval(render, 1000);

  return { destroy: () => clearInterval(interval), getName: () => userName, setName: (n) => { userName = n; Storage.set(STORAGE_KEY, n); renderGreeting(); } };
}

// ============================================
// 4. FOCUS TIMER (25 MIN)
// ============================================
function initTimer(container) {
  if (!container) return;
  const STORAGE_KEY = "todoLifeDashboardTimerDuration";
  const ALLOWED = [300, 600, 900, 1500, 1800, 2700, 3600];
  let stored = Storage.get(STORAGE_KEY, 1500);
  let defaultDuration = ALLOWED.includes(stored) ? stored : 1500;
  let remaining = defaultDuration;
  let isRunning = false;
  let intervalId = null;

  container.innerHTML = `
    <div class="timer-container">
      <h2 class="component-title">Focus Timer</h2>
      <div class="timer-duration-row">
        <label for="timer-duration" class="timer-duration-label">Duration:</label>
        <select id="timer-duration" class="timer-duration-select" aria-label="Timer duration">
          <option value="300">5 min</option>
          <option value="600">10 min</option>
          <option value="900">15 min</option>
          <option value="1500">25 min</option>
          <option value="1800">30 min</option>
          <option value="2700">45 min</option>
          <option value="3600">60 min</option>
        </select>
      </div>
      <div class="timer-display" id="timer-display">25:00</div>
      <div class="timer-controls">
        <button class="timer-btn timer-btn--start" id="timer-start">Start</button>
        <button class="timer-btn timer-btn--pause" id="timer-pause" style="display:none;">Pause</button>
        <button class="timer-btn timer-btn--reset" id="timer-reset">Reset</button>
      </div>
      <div class="timer-notification" id="timer-notification" style="display:none;">
        <div class="timer-notification-content">
          <span class="timer-notification-text">Session Complete</span>
          <button class="timer-btn timer-btn--dismiss" id="timer-dismiss">Dismiss</button>
        </div>
      </div>
    </div>
  `;

  const display = container.querySelector("#timer-display");
  const btnStart = container.querySelector("#timer-start");
  const btnPause = container.querySelector("#timer-pause");
  const btnReset = container.querySelector("#timer-reset");
  const notification = container.querySelector("#timer-notification");
  const btnDismiss = container.querySelector("#timer-dismiss");
  const durationSelect = container.querySelector("#timer-duration");

  function formatMMSS(sec) {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }

  function updateDisplay() {
    display.textContent = formatMMSS(remaining);
  }

  function updateButtons() {
    if (isRunning) {
      btnStart.style.display = "none";
      btnPause.style.display = "inline-block";
      if (durationSelect) durationSelect.disabled = true;
    } else if (remaining < defaultDuration && remaining > 0) {
      btnStart.style.display = "none";
      btnPause.style.display = "none";
      btnStart.textContent = "Resume";
      btnStart.style.display = "inline-block";
      if (durationSelect) durationSelect.disabled = true;
    } else {
      btnStart.textContent = "Start";
      btnStart.style.display = "inline-block";
      btnPause.style.display = "none";
      if (durationSelect) durationSelect.disabled = false;
    }
  }

  function playAlert() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 2);
    } catch {
      // silent fallback
    }
  }

  function onComplete() {
    clearInterval(intervalId);
    intervalId = null;
    isRunning = false;
    updateButtons();
    notification.style.display = "flex";
    playAlert();
  }

  function start() {
    if (isRunning || remaining <= 0) return;
    isRunning = true;
    updateButtons();
    intervalId = setInterval(() => {
      if (remaining > 0) {
        remaining--;
        updateDisplay();
        if (remaining === 0) onComplete();
      }
    }, 1000);
  }

  function pause() {
    if (!isRunning) return;
    clearInterval(intervalId);
    intervalId = null;
    isRunning = false;
    updateButtons();
  }

  function reset() {
    clearInterval(intervalId);
    intervalId = null;
    remaining = defaultDuration;
    isRunning = false;
    notification.style.display = "none";
    updateDisplay();
    updateButtons();
  }

  function handleDurationChange() {
    if (isRunning) return;
    const val = parseInt(durationSelect.value, 10);
    if (!ALLOWED.includes(val)) return;
    defaultDuration = val;
    Storage.set(STORAGE_KEY, defaultDuration);
    remaining = defaultDuration;
    notification.style.display = "none";
    clearInterval(intervalId);
    intervalId = null;
    isRunning = false;
    updateDisplay();
    updateButtons();
  }

  // unified Start/Pause/Resume handler
  btnStart.addEventListener("click", () => {
    if (isRunning) return;
    if (remaining === defaultDuration) start();
    else if (remaining > 0 && remaining < defaultDuration) start(); // resume
  });
  btnPause.addEventListener("click", pause);
  btnReset.addEventListener("click", reset);
  btnDismiss.addEventListener("click", reset);
  durationSelect.addEventListener("change", handleDurationChange);

  // init select value and display
  durationSelect.value = String(defaultDuration);
  updateDisplay();
  updateButtons();

  return { start, pause, reset, getRemaining: () => remaining, getDuration: () => defaultDuration, setDuration: (sec) => { if (ALLOWED.includes(sec)) { defaultDuration = sec; remaining = sec; Storage.set(STORAGE_KEY, sec); durationSelect.value = String(sec); updateDisplay(); updateButtons(); } } };
}

// ============================================
// 5. TO-DO LIST
// ============================================
function initTasks(container) {
  if (!container) return;
  const STORAGE_KEY = "todoLifeDashboardTasks";
  let tasks = [];

  container.innerHTML = `
    <div class="tasks-component">
      <div class="tasks-header"><h2>To-Do List</h2></div>
      <div class="tasks-input-section">
        <input type="text" class="tasks-input" id="tasks-input" placeholder="Add a new task..." maxlength="100" aria-label="New task" />
        <button type="button" class="tasks-add-button" id="tasks-add">Add</button>
      </div>
      <div class="tasks-list" id="tasks-list" role="list"></div>
      <div class="tasks-error" id="tasks-error" aria-live="polite"></div>
    </div>
  `;

  const input = container.querySelector("#tasks-input");
  const addBtn = container.querySelector("#tasks-add");
  const listEl = container.querySelector("#tasks-list");
  const errorEl = container.querySelector("#tasks-error");

  function showError(msg) {
    errorEl.textContent = msg;
    errorEl.classList.add("error-visible");
  }
  function clearError() {
    errorEl.textContent = "";
    errorEl.classList.remove("error-visible");
    input.classList.remove("input-error");
  }

  function load() {
    const data = Storage.get(STORAGE_KEY, null);
    if (data && Array.isArray(data.tasks)) tasks = data.tasks;
    else if (Array.isArray(data)) tasks = data; // legacy
    else tasks = [];
  }

  function save() {
    const payload = { version: 1, tasks, lastModified: Date.now() };
    const ok = Storage.set(STORAGE_KEY, payload);
    if (!ok) showError("Could not save tasks. Storage may be full.");
    return ok;
  }

  function render() {
    if (tasks.length === 0) {
      listEl.innerHTML = `<div class="tasks-empty"><p>No tasks yet. Add one above!</p></div>`;
      return;
    }
    listEl.innerHTML = tasks
      .map(
        (t) => `
      <div class="task-item ${t.completed ? "task-completed" : ""}" data-task-id="${t.id}" role="listitem">
        <div class="task-checkbox-wrapper">
          <input type="checkbox" class="task-checkbox" id="task-check-${t.id}" ${t.completed ? "checked" : ""} aria-label="Mark task" />
          <label class="task-checkbox-label" for="task-check-${t.id}"></label>
        </div>
        <div class="task-content"><span class="task-description" title="${t.completed ? "" : "Click to edit"}">${sanitizeInput(t.description)}</span></div>
        <div class="task-actions">
          <button type="button" class="task-edit-button" aria-label="Edit">✎</button>
          <button type="button" class="task-delete-button" aria-label="Delete">🗑</button>
        </div>
      </div>
    `
      )
      .join("");
  }

  function addTask(desc) {
    const trimmed = desc.trim();
    if (!isValidTaskDescription(trimmed)) {
      showError("Task must be 1-100 characters");
      input.classList.add("input-error");
      return null;
    }
    if (isDuplicateTaskDescription(trimmed, tasks)) {
      showError("Task already exists");
      input.classList.add("input-error");
      return null;
    }
    const task = {
      id: generateUUID(),
      description: trimmed,
      completed: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    tasks.unshift(task);
    save();
    render();
    return task;
  }

  function updateTask(id, newDesc) {
    const trimmed = newDesc.trim();
    if (!isValidTaskDescription(trimmed)) return null;
    if (isDuplicateTaskDescription(trimmed, tasks, id)) {
      showError("Task already exists");
      const editInput = container.querySelector(".task-edit-input");
      if (editInput) editInput.classList.add("input-error");
      return null;
    }
    const t = tasks.find((x) => x.id === id);
    if (!t) return null;
    t.description = trimmed;
    t.updatedAt = Date.now();
    clearError();
    save();
    render();
    return t;
  }

  function toggleTask(id) {
    const t = tasks.find((x) => x.id === id);
    if (!t) return null;
    t.completed = !t.completed;
    t.updatedAt = Date.now();
    save();
    render();
    return t;
  }

  function deleteTask(id) {
    const idx = tasks.findIndex((x) => x.id === id);
    if (idx === -1) return false;
    tasks.splice(idx, 1);
    save();
    render();
    return true;
  }

  function startInlineEdit(id) {
    const t = tasks.find((x) => x.id === id);
    if (!t || t.completed) return;
    const item = listEl.querySelector(`[data-task-id="${id}"]`);
    if (!item) return;
    const content = item.querySelector(".task-content");
    content.innerHTML = `
      <input type="text" class="task-edit-input" value="${sanitizeInput(t.description)}" maxlength="100" aria-label="Edit task" />
      <button type="button" class="task-edit-save" aria-label="Save">✓</button>
      <button type="button" class="task-edit-cancel" aria-label="Cancel">✕</button>
    `;
    const editInput = content.querySelector(".task-edit-input");
    const saveBtn = content.querySelector(".task-edit-save");
    const cancelBtn = content.querySelector(".task-edit-cancel");
    editInput.focus();
    editInput.select();

    const finish = () => {
      const v = editInput.value.trim();
      if (!v || !isValidTaskDescription(v)) {
        render();
        return;
      }
      if (isDuplicateTaskDescription(v, tasks, id)) {
        showError("Task already exists");
        editInput.classList.add("input-error");
        editInput.focus();
        return;
      }
      const updated = updateTask(id, v);
      if (!updated) {
        // if update failed (e.g. duplicate detected inside), keep edit open
        if (errorEl.textContent.includes("already exists")) return;
        render();
      }
    };
    const cancel = () => {
      clearError();
      render();
    };

    editInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") finish();
      if (e.key === "Escape") cancel();
    });
    editInput.addEventListener("blur", finish);
    saveBtn.addEventListener("click", finish);
    cancelBtn.addEventListener("click", cancel);
  }

  // Events
  addBtn.addEventListener("click", () => {
    const v = input.value;
    const created = addTask(v);
    if (created) {
      input.value = "";
      clearError();
    }
  });
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") addBtn.click();
  });
  input.addEventListener("input", clearError);

  listEl.addEventListener("click", (e) => {
    const item = e.target.closest(".task-item");
    if (!item) return;
    const id = item.dataset.taskId;
    if (e.target.classList.contains("task-delete-button")) deleteTask(id);
    else if (e.target.classList.contains("task-edit-button")) startInlineEdit(id);
    else if (e.target.classList.contains("task-description")) {
      const t = tasks.find((x) => x.id === id);
      if (t && !t.completed) startInlineEdit(id);
    }
  });

  listEl.addEventListener("change", (e) => {
    if (!e.target.classList.contains("task-checkbox")) return;
    const item = e.target.closest(".task-item");
    if (!item) return;
    toggleTask(item.dataset.taskId);
  });

  load();
  render();

  return { addTask, updateTask, toggleTask, deleteTask, getAll: () => [...tasks] };
}

// ============================================
// 6. QUICK LINKS
// ============================================
function initLinks(container) {
  if (!container) return;
  const STORAGE_KEY = "todoLifeDashboardQuickLinks";
  let links = [];

  container.innerHTML = `
    <div class="quick-links-container">
      <div class="quick-links-header"><h2>Quick Links</h2></div>
      <form class="link-form" id="link-form">
        <div class="link-form-row">
          <div class="input-group">
            <input type="text" class="link-name-input" id="link-name" placeholder="Name" maxlength="100" />
            <span class="link-error-message" id="link-name-error"></span>
          </div>
          <div class="input-group">
            <input type="url" class="link-url-input" id="link-url" placeholder="https://example.com" maxlength="2048" />
            <span class="link-error-message" id="link-url-error"></span>
          </div>
          <button type="submit" class="link-add-button" id="link-add">Add</button>
        </div>
      </form>
      <div class="links-list" id="links-list"></div>
    </div>
  `;

  const form = container.querySelector("#link-form");
  const nameInput = container.querySelector("#link-name");
  const urlInput = container.querySelector("#link-url");
  const nameError = container.querySelector("#link-name-error");
  const urlError = container.querySelector("#link-url-error");
  const listEl = container.querySelector("#links-list");

  function load() {
    const data = Storage.get(STORAGE_KEY, null);
    if (data && Array.isArray(data.links)) links = data.links;
    else if (Array.isArray(data)) links = data;
    else links = [];
  }
  function save() {
    return Storage.set(STORAGE_KEY, { version: 1, links, lastModified: Date.now() });
  }

  function showErr(input, errEl, msg) {
    input.classList.add("input-error");
    errEl.textContent = msg;
  }
  function clearErr() {
    nameInput.classList.remove("input-error");
    urlInput.classList.remove("input-error");
    nameError.textContent = "";
    urlError.textContent = "";
  }

  function render() {
    if (links.length === 0) {
      listEl.innerHTML = `<div class="links-empty-state"><p class="links-empty-message">No quick links yet. Add one above!</p></div>`;
      return;
    }
    listEl.innerHTML = links
      .map((link) => {
        const favicon = getFaviconUrl(link.url);
        const letter = (link.name.charAt(0) || "?").toUpperCase();
        const faviconHtml = favicon
          ? `<img class="link-favicon" src="${favicon}" alt="" onerror="this.outerHTML='<span class=\\'letter-avatar\\'>${letter}</span>'" />`
          : `<span class="letter-avatar">${letter}</span>`;
        const safeName = sanitizeInput(link.name);
        // clickable name opens new tab
        return `
        <div class="link-item" data-link-id="${link.id}">
          <div class="link-row">
            ${faviconHtml}
            <a class="link-name" href="${sanitizeInput(link.url)}" target="_blank" rel="noopener noreferrer" title="${safeName}">${safeName}</a>
            <div class="link-actions">
              <button class="link-edit-button" data-link-id="${link.id}" title="Edit">✎</button>
              <button class="link-delete-button" data-link-id="${link.id}" title="Delete">🗑</button>
            </div>
          </div>
        </div>`;
      })
      .join("");
  }

  function addLink(name, url) {
    if (!isValidLinkName(name) || !isValidUrl(url)) return null;
    if (!isUniqueUrl(url, links)) return null;
    const now = Date.now();
    const link = {
      id: generateUUID(),
      name: name.trim(),
      url: url.trim(),
      faviconUrl: getFaviconUrl(url.trim()),
      createdAt: now,
      updatedAt: now,
    };
    links.push(link);
    save();
    render();
    return link;
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    clearErr();
    const name = nameInput.value;
    const url = urlInput.value;
    let ok = true;
    if (!isValidLinkName(name)) {
      showErr(nameInput, nameError, "Name must be 1-100 characters");
      ok = false;
    }
    if (!isValidUrl(url)) {
      showErr(urlInput, urlError, "Please enter a valid URL (https://...)");
      ok = false;
    } else if (!isUniqueUrl(url, links)) {
      showErr(urlInput, urlError, "A link with this URL already exists");
      ok = false;
    }
    if (ok) {
      const created = addLink(name, url);
      if (created) {
        nameInput.value = "";
        urlInput.value = "";
        clearErr();
        nameInput.focus();
      }
    }
  });

  // delete / edit delegation
  listEl.addEventListener("click", (e) => {
    const del = e.target.closest(".link-delete-button");
    const edit = e.target.closest(".link-edit-button");
    if (del) {
      const id = del.dataset.linkId;
      links = links.filter((l) => l.id !== id);
      save();
      render();
    } else if (edit) {
      const id = edit.dataset.linkId;
      const link = links.find((l) => l.id === id);
      if (!link) return;
      openInlineEdit(link);
    }
  });

  function openInlineEdit(link) {
    const item = listEl.querySelector(`[data-link-id="${link.id}"]`);
    if (!item) return;
    item.innerHTML = `
      <form class="inline-edit-form" data-link-id="${link.id}">
        <input type="text" class="edit-name-input" value="${sanitizeInput(link.name)}" maxlength="100" />
        <input type="url" class="edit-url-input" value="${sanitizeInput(link.url)}" maxlength="2048" />
        <button type="submit" class="edit-save-button" title="Save">✓</button>
        <button type="button" class="edit-cancel-button" title="Cancel">✕</button>
      </form>
      <div class="inline-edit-errors">
        <span class="link-error-message" id="edit-name-error-${link.id}"></span>
        <span class="link-error-message" id="edit-url-error-${link.id}"></span>
      </div>
    `;
    const formEdit = item.querySelector(".inline-edit-form");
    const nameIn = item.querySelector(".edit-name-input");
    const urlIn = item.querySelector(".edit-url-input");
    const cancelBtn = item.querySelector(".edit-cancel-button");
    const nameErr = item.querySelector(`#edit-name-error-${link.id}`);
    const urlErr = item.querySelector(`#edit-url-error-${link.id}`);

    nameIn.focus();
    nameIn.select();

    formEdit.addEventListener("submit", (ev) => {
      ev.preventDefault();
      nameIn.classList.remove("input-error");
      urlIn.classList.remove("input-error");
      nameErr.textContent = "";
      urlErr.textContent = "";
      const newName = nameIn.value;
      const newUrl = urlIn.value;
      let valid = true;
      if (!isValidLinkName(newName)) {
        nameIn.classList.add("input-error");
        nameErr.textContent = "Name must be 1-100 characters";
        valid = false;
      }
      if (!isValidUrl(newUrl)) {
        urlIn.classList.add("input-error");
        urlErr.textContent = "Please enter a valid URL";
        valid = false;
      } else {
        const others = links.filter((l) => l.id !== link.id);
        if (!isUniqueUrl(newUrl, others)) {
          urlIn.classList.add("input-error");
          urlErr.textContent = "A link with this URL already exists";
          valid = false;
        }
      }
      if (!valid) return;
      const idx = links.findIndex((l) => l.id === link.id);
      links[idx] = { ...links[idx], name: newName.trim(), url: newUrl.trim(), faviconUrl: getFaviconUrl(newUrl.trim()), updatedAt: Date.now() };
      save();
      render();
    });
    cancelBtn.addEventListener("click", render);
  }

  load();
  render();

  return { addLink, getAll: () => [...links] };
}

// ============================================
// 7. APP INIT (single entry)
// ============================================
document.addEventListener("DOMContentLoaded", () => {
  const greetingEl = document.getElementById("greeting");
  const timerEl = document.getElementById("timer");
  const tasksEl = document.getElementById("tasks");
  const linksEl = document.getElementById("links");

  try {
    initGreeting(greetingEl);
  } catch (e) {
    console.error("Greeting init failed", e);
  }
  try {
    initTimer(timerEl);
  } catch (e) {
    console.error("Timer init failed", e);
  }
  try {
    initTasks(tasksEl);
  } catch (e) {
    console.error("Tasks init failed", e);
  }
  try {
    initLinks(linksEl);
  } catch (e) {
    console.error("Links init failed", e);
  }

  console.log("Dashboard initialized (single-file MVP)!");
});

// Export for tests if needed (non-breaking)
if (typeof module !== "undefined" && module.exports) {
  module.exports = { Storage, formatTime12Hour, formatDateFull, getTimeBasedGreeting, isValidTaskDescription, isValidUserName, isDuplicateTaskDescription, isValidLinkName, isValidUrl, isUniqueUrl, sanitizeInput, generateUUID, getFaviconUrl };
}
