const GOODS = [
  { id: "apple", icon: "🍎" },
  { id: "pear", icon: "🍐" },
  { id: "lemon", icon: "🍋" },
  { id: "carrot", icon: "🥕" },
  { id: "corn", icon: "🌽" },
  { id: "egg", icon: "🥚" },
  { id: "fish", icon: "🐟" },
  { id: "bread", icon: "🥐" },
  { id: "cheese", icon: "🧀" },
  { id: "mushroom", icon: "🍄" },
  { id: "chili", icon: "🌶️" },
  { id: "cookie", icon: "🍪" }
];

const CONFIG = {
  traySize: 7,
  baseTime: 120,
  itemSize: 56
};

const state = {
  level: 1,
  timeLeft: CONFIG.baseTime,
  timer: null,
  items: [],
  tray: [],
  running: false
};

const els = {
  startScreen: document.querySelector("#startScreen"),
  gameScreen: document.querySelector("#gameScreen"),
  resultScreen: document.querySelector("#resultScreen"),
  playArea: document.querySelector("#playArea"),
  tray: document.querySelector("#tray"),
  levelText: document.querySelector("#levelText"),
  timeText: document.querySelector("#timeText"),
  leftText: document.querySelector("#leftText"),
  resultIcon: document.querySelector("#resultIcon"),
  resultTitle: document.querySelector("#resultTitle"),
  resultDesc: document.querySelector("#resultDesc"),
  nextBtn: document.querySelector("#nextBtn")
};

function showScreen(name) {
  [els.startScreen, els.gameScreen, els.resultScreen].forEach(screen => screen.classList.remove("active"));
  els[name].classList.add("active");
}

function shuffle(list) {
  const arr = [...list];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function buildItemTypes() {
  const typeCount = Math.min(6 + Math.floor(state.level / 2), GOODS.length);
  const groupCount = Math.min(8 + state.level * 2, 18);
  const pool = shuffle(GOODS).slice(0, typeCount);
  const list = [];

  for (let i = 0; i < groupCount; i++) {
    const good = pool[i % pool.length];
    list.push(good, good, good);
  }

  return shuffle(list);
}

function createLevelItems() {
  const rect = els.playArea.getBoundingClientRect();
  const cx = rect.width / 2;
  const cy = rect.height * 0.5;
  const maxRadiusX = Math.max(80, rect.width * 0.35);
  const maxRadiusY = Math.max(80, rect.height * 0.32);

  state.items = buildItemTypes().map((good, index) => {
    const layer = Math.floor(index / 8);
    const angle = Math.random() * Math.PI * 2;
    const radius = Math.sqrt(Math.random());
    const x = cx + Math.cos(angle) * maxRadiusX * radius + (Math.random() - 0.5) * 48;
    const y = cy + Math.sin(angle) * maxRadiusY * radius + (Math.random() - 0.5) * 42;

    return {
      uid: `item-${Date.now()}-${index}`,
      id: good.id,
      icon: good.icon,
      x: Math.max(12, Math.min(rect.width - CONFIG.itemSize - 12, x)),
      y: Math.max(12, Math.min(rect.height - CONFIG.itemSize - 12, y)),
      z: index,
      rotate: `${Math.floor(Math.random() * 70 - 35)}deg`,
      selected: false,
      blocked: false
    };
  });
}

function isOverlapping(a, b) {
  const margin = CONFIG.itemSize * 0.62;
  return Math.abs(a.x - b.x) < margin && Math.abs(a.y - b.y) < margin;
}

function updateBlockedStatus() {
  state.items.forEach(item => {
    if (item.selected) {
      item.blocked = false;
      return;
    }

    item.blocked = state.items.some(other => {
      return !other.selected && other.z > item.z && isOverlapping(item, other);
    });
  });
}

function renderItems() {
  updateBlockedStatus();
  els.playArea.innerHTML = "";

  state.items
    .filter(item => !item.selected)
    .sort((a, b) => a.z - b.z)
    .forEach(item => {
      const div = document.createElement("button");
      div.type = "button";
      div.className = `item${item.blocked ? " blocked" : ""}`;
      div.textContent = item.icon;
      div.style.left = `${item.x}px`;
      div.style.top = `${item.y}px`;
      div.style.zIndex = item.z;
      div.style.setProperty("--r", item.rotate);
      div.style.transform = `rotate(${item.rotate})`;
      div.setAttribute("aria-label", item.id);
      div.addEventListener("click", () => pickItem(item.uid));
      els.playArea.appendChild(div);
    });

  els.leftText.textContent = state.items.filter(item => !item.selected).length;
}

function renderTray(matchingIds = []) {
  els.tray.innerHTML = "";

  for (let i = 0; i < CONFIG.traySize; i++) {
    const slot = document.createElement("div");
    slot.className = "slot";
    const item = state.tray[i];

    if (item) {
      slot.classList.add("filled");
      slot.textContent = item.icon;
      if (matchingIds.includes(item.uid)) {
        slot.classList.add("matching");
      }
    }

    els.tray.appendChild(slot);
  }
}

function pickItem(uid) {
  if (!state.running) return;

  const item = state.items.find(target => target.uid === uid);
  if (!item || item.selected) return;

  if (item.blocked) {
    els.playArea.classList.remove("flash");
    void els.playArea.offsetWidth;
    els.playArea.classList.add("flash");
    return;
  }

  item.selected = true;
  state.tray.push({ uid: item.uid, id: item.id, icon: item.icon });
  sortTray();

  const matched = findMatch();
  renderItems();
  renderTray(matched.map(match => match.uid));

  if (matched.length === 3) {
    window.setTimeout(() => {
      state.tray = state.tray.filter(slotItem => !matched.some(match => match.uid === slotItem.uid));
      renderTray();
      checkProgress();
    }, 220);
  } else {
    checkProgress();
  }
}

function sortTray() {
  state.tray.sort((a, b) => a.id.localeCompare(b.id));
}

function findMatch() {
  const groups = new Map();
  state.tray.forEach(item => {
    if (!groups.has(item.id)) groups.set(item.id, []);
    groups.get(item.id).push(item);
  });

  for (const group of groups.values()) {
    if (group.length >= 3) return group.slice(0, 3);
  }

  return [];
}

function checkProgress() {
  const left = state.items.filter(item => !item.selected).length;

  if (left === 0 && state.tray.length === 0) {
    endGame(true, "你成功清空了全部物品，抓到大鹅！");
    return;
  }

  if (state.tray.length >= CONFIG.traySize) {
    endGame(false, "收集槽满了，大鹅趁乱跑走了。");
  }
}

function startTimer() {
  stopTimer();
  state.timer = window.setInterval(() => {
    state.timeLeft -= 1;
    els.timeText.textContent = state.timeLeft;

    if (state.timeLeft <= 0) {
      endGame(false, "时间到了，大鹅跑远了。");
    }
  }, 1000);
}

function stopTimer() {
  if (state.timer) {
    window.clearInterval(state.timer);
    state.timer = null;
  }
}

function startGame(keepLevel = false) {
  if (!keepLevel) state.level = 1;

  state.running = true;
  state.timeLeft = Math.max(60, CONFIG.baseTime - (state.level - 1) * 8);
  state.tray = [];

  showScreen("gameScreen");
  els.levelText.textContent = state.level;
  els.timeText.textContent = state.timeLeft;

  createLevelItems();
  renderItems();
  renderTray();
  startTimer();
}

function endGame(win, desc) {
  state.running = false;
  stopTimer();

  els.resultIcon.textContent = win ? "鹅" : "跑";
  els.resultIcon.style.color = win ? "var(--success)" : "var(--danger)";
  els.resultTitle.textContent = win ? "抓到大鹅！" : "大鹅跑了！";
  els.resultDesc.textContent = desc;
  els.nextBtn.style.display = win ? "inline-block" : "none";

  showScreen("resultScreen");
}

function nextLevel() {
  state.level += 1;
  startGame(true);
}

function bindEvents() {
  document.querySelector("#startBtn").addEventListener("click", () => startGame(false));
  document.querySelector("#restartBtn").addEventListener("click", () => startGame(true));
  document.querySelector("#againBtn").addEventListener("click", () => startGame(false));
  document.querySelector("#nextBtn").addEventListener("click", nextLevel);

  window.addEventListener("resize", () => {
    if (state.running) {
      createLevelItems();
      state.tray = [];
      renderItems();
      renderTray();
    }
  });
}

bindEvents();
renderTray();
