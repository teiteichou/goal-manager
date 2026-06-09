const storeKey = "goal-nest-ja-v1";

const categoryLabels = {
  long: "長期目標",
  middle: "中期目標",
  day: "D目標",
  hour: "H目標",
  minute: "Min目標",
};

const reasonLabels = {
  scope: "見積もりより範囲が広かった",
  priority: "優先順位が変わった",
  health: "体調・生活リズムの影響",
  resource: "資料や環境が不足した",
};

const initialGoals = [
  {
    id: crypto.randomUUID(),
    title: "JLPT N1 の語彙を 300 語復習する",
    category: "day",
    dueDate: toLocalInputValue(addMinutes(new Date(), 60 * 22)),
    notes: "間違えた単語は例文つきで復習する。",
    reward: "新しい参考書を一冊買う",
    reminderPreset: 60,
    status: "active",
    progress: 35,
    createdAt: new Date().toISOString(),
    reviews: [],
  },
  {
    id: crypto.randomUUID(),
    title: "毎朝 25 分の集中学習を 7 日続ける",
    category: "middle",
    dueDate: toLocalInputValue(addMinutes(new Date(), 60 * 24 * 7)),
    notes: "短時間タイマーと雨の日の背景音を使う。",
    reward: "週末にお気に入りのカフェへ行く",
    reminderPreset: 1440,
    status: "active",
    progress: 15,
    createdAt: new Date().toISOString(),
    reviews: [],
  },
];

const state = {
  goals: loadGoals(),
  filter: "all",
  view: "active",
  selectedId: null,
  timerSeconds: 25 * 60,
  timerTotal: 25 * 60,
  timerRunning: false,
  timerHandle: null,
  focusMinutes: Number(localStorage.getItem("goal-nest-focus-minutes") || 0),
  audio: null,
};

const els = {
  goalList: document.querySelector("#goalList"),
  activeCount: document.querySelector("#activeCount"),
  doneCount: document.querySelector("#doneCount"),
  soonCount: document.querySelector("#soonCount"),
  focusCount: document.querySelector("#focusCount"),
  reminderList: document.querySelector("#reminderList"),
  coachCard: document.querySelector("#coachCard"),
  goalDialog: document.querySelector("#goalDialog"),
  reviewDialog: document.querySelector("#reviewDialog"),
  goalForm: document.querySelector("#goalForm"),
  reviewForm: document.querySelector("#reviewForm"),
  timerDisplay: document.querySelector("#timerDisplay"),
  timerToggle: document.querySelector("#timerToggle"),
  soundSelect: document.querySelector("#soundSelect"),
};

document.querySelector("#newGoalBtn").addEventListener("click", () => openGoalDialog());
document.querySelector("#notifyBtn").addEventListener("click", requestNotifications);
document.querySelector("#coachBtn").addEventListener("click", renderCoach);
document.querySelector("#timerToggle").addEventListener("click", toggleTimer);
document.querySelector("#timerMinus").addEventListener("click", () => adjustTimer(-5));
document.querySelector("#timerPlus").addEventListener("click", () => adjustTimer(5));
els.soundSelect.addEventListener("change", () => {
  if (state.timerRunning) startSound(els.soundSelect.value);
});

document.querySelectorAll(".nav-item").forEach((button) => {
  button.addEventListener("click", () => {
    state.filter = button.dataset.filter;
    document.querySelectorAll(".nav-item").forEach((item) => item.classList.toggle("active", item === button));
    render();
  });
});

document.querySelectorAll(".segment").forEach((button) => {
  button.addEventListener("click", () => {
    state.view = button.dataset.view;
    document.querySelectorAll(".segment").forEach((item) => item.classList.toggle("active", item === button));
    render();
  });
});

els.goalForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const id = document.querySelector("#goalId").value || crypto.randomUUID();
  const existing = state.goals.find((goal) => goal.id === id);
  const goal = {
    id,
    title: document.querySelector("#title").value.trim(),
    category: document.querySelector("#category").value,
    dueDate: document.querySelector("#dueDate").value,
    notes: document.querySelector("#notes").value.trim(),
    reward: document.querySelector("#reward").value.trim(),
    reminderPreset: Number(document.querySelector("#reminderPreset").value),
    status: existing?.status || "active",
    progress: existing?.progress ?? 0,
    createdAt: existing?.createdAt || new Date().toISOString(),
    reviews: existing?.reviews || [],
  };

  if (existing) {
    state.goals = state.goals.map((item) => (item.id === id ? goal : item));
  } else {
    state.goals.unshift(goal);
    state.selectedId = id;
  }
  save();
  els.goalDialog.close();
  render();
});

els.reviewForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const submitter = event.submitter?.value;
  const goal = getGoal(document.querySelector("#reviewGoalId").value);
  if (!goal) return;

  const review = {
    comment: document.querySelector("#reviewComment").value.trim(),
    reason: document.querySelector("#extendReason").value,
    date: new Date().toISOString(),
  };

  if (submitter === "copy") {
    state.goals.unshift({
      ...goal,
      id: crypto.randomUUID(),
      title: `${goal.title}（再挑戦）`,
      dueDate: document.querySelector("#extendedDate").value,
      status: "active",
      progress: 0,
      createdAt: new Date().toISOString(),
      reviews: [review],
    });
  } else {
    goal.dueDate = document.querySelector("#extendedDate").value;
    goal.status = "active";
    goal.reviews.push(review);
  }

  save();
  els.reviewDialog.close();
  render();
});

function loadGoals() {
  const stored = localStorage.getItem(storeKey);
  if (!stored) return initialGoals;
  try {
    return JSON.parse(stored);
  } catch {
    return initialGoals;
  }
}

function save() {
  localStorage.setItem(storeKey, JSON.stringify(state.goals));
}

function render() {
  updateOverdueGoals();
  renderStats();
  renderGoals();
  renderReminders();
  renderCoach(false);
  updateTimerDisplay();
}

function renderStats() {
  const active = state.goals.filter((goal) => goal.status === "active");
  const done = state.goals.filter((goal) => goal.status === "done");
  const soon = active.filter((goal) => hoursUntil(goal.dueDate) <= 24 && hoursUntil(goal.dueDate) >= 0);
  els.activeCount.textContent = active.length;
  els.doneCount.textContent = done.length;
  els.soonCount.textContent = soon.length;
  els.focusCount.textContent = `${state.focusMinutes}m`;
}

function renderGoals() {
  const goals = state.goals
    .filter((goal) => state.filter === "all" || goal.category === state.filter)
    .filter((goal) => goal.status === state.view);

  if (!goals.length) {
    els.goalList.innerHTML = `<div class="empty">この条件の目標はまだありません。</div>`;
    return;
  }

  els.goalList.innerHTML = goals.map(goalTemplate).join("");
  els.goalList.querySelectorAll("[data-action]").forEach((button) => {
    button.addEventListener("click", handleGoalAction);
  });
  els.goalList.querySelectorAll(".goal-card").forEach((card) => {
    card.addEventListener("click", (event) => {
      if (event.target.closest("button")) return;
      state.selectedId = card.dataset.id;
      render();
    });
  });
}

function goalTemplate(goal) {
  const due = new Date(goal.dueDate);
  const hours = hoursUntil(goal.dueDate);
  const isSoon = goal.status === "active" && hours <= 24 && hours >= 0;
  const isMissed = goal.status === "missed";
  const selected = goal.id === state.selectedId ? " selected" : "";
  const note = goal.notes ? `<p>${escapeHtml(goal.notes)}</p>` : "";
  const review = goal.reviews?.length
    ? `<span>前回理由: ${escapeHtml(reasonLabels[goal.reviews.at(-1).reason] || "")}</span>`
    : "";

  return `
    <article class="goal-card${selected}" data-id="${goal.id}">
      <div class="goal-top">
        <div>
          <div class="goal-title">${escapeHtml(goal.title)}</div>
          <div class="goal-meta">
            <span class="pill">${categoryLabels[goal.category]}</span>
            ${isSoon ? `<span class="pill warn">期限間近</span>` : ""}
            ${isMissed ? `<span class="pill danger">未達成</span>` : ""}
            <span>${formatDate(due)}</span>
            ${review}
          </div>
        </div>
        <div class="goal-actions">
          ${goal.status === "active" ? `<button class="ghost small" data-action="progress" data-id="${goal.id}">+25%</button>` : ""}
          ${goal.status === "active" ? `<button class="primary small" data-action="done" data-id="${goal.id}">達成</button>` : ""}
          ${goal.status === "missed" ? `<button class="ghost small" data-action="review" data-id="${goal.id}">レビュー</button>` : ""}
          <button class="ghost small" data-action="copy" data-id="${goal.id}">コピー</button>
          <button class="ghost small" data-action="edit" data-id="${goal.id}">編集</button>
        </div>
      </div>
      ${note}
      <div class="progress-wrap">
        <div class="progress-row"><span>進捗</span><span>${goal.progress}%</span></div>
        <div class="progress"><span style="width:${goal.progress}%"></span></div>
      </div>
      ${goal.reward ? `<div class="goal-meta"><span>ご褒美: ${escapeHtml(goal.reward)}</span></div>` : ""}
    </article>
  `;
}

function renderReminders() {
  const reminders = state.goals
    .filter((goal) => goal.status === "active")
    .map((goal) => ({ goal, reminderAt: addMinutes(new Date(goal.dueDate), -goal.reminderPreset) }))
    .filter((item) => item.reminderAt >= new Date())
    .sort((a, b) => a.reminderAt - b.reminderAt)
    .slice(0, 5);

  els.reminderList.innerHTML = reminders.length
    ? reminders
        .map(
          ({ goal, reminderAt }) => `
            <div class="reminder-item">
              <strong>${escapeHtml(goal.title)}</strong><br />
              ${formatDate(reminderAt)}
            </div>
          `,
        )
        .join("")
    : `<div class="empty">予定されている通知はありません。</div>`;
}

function renderCoach(force = true) {
  const goal = getGoal(state.selectedId) || state.goals.find((item) => item.status === "active");
  if (!goal) {
    els.coachCard.textContent = "目標を作成すると、次の一手を整理します。";
    return;
  }
  if (!force && state.selectedId !== goal.id) return;

  const remainingHours = Math.max(0, Math.round(hoursUntil(goal.dueDate)));
  const nextStep =
    goal.category === "minute" || goal.category === "hour"
      ? "今すぐタイマーを開始し、完了条件を一つに絞りましょう。"
      : "期限から逆算して、今日終わらせる最小タスクを一つだけ決めましょう。";
  els.coachCard.innerHTML = `
    <strong>${escapeHtml(goal.title)}</strong><br />
    残り約 ${remainingHours} 時間。進捗は ${goal.progress}% です。${nextStep}
    ${goal.reward ? `<br />達成後のご褒美は「${escapeHtml(goal.reward)}」。` : ""}
  `;
}

function handleGoalAction(event) {
  const action = event.currentTarget.dataset.action;
  const goal = getGoal(event.currentTarget.dataset.id);
  if (!goal) return;

  if (action === "done") {
    goal.status = "done";
    goal.progress = 100;
    playPing();
    notify("目標達成", `${goal.title} を達成しました。ご褒美を受け取りましょう。`);
  }

  if (action === "progress") goal.progress = Math.min(100, goal.progress + 25);
  if (action === "edit") openGoalDialog(goal);
  if (action === "copy") copyGoal(goal);
  if (action === "review") openReviewDialog(goal);

  save();
  render();
}

function copyGoal(goal) {
  const next = {
    ...goal,
    id: crypto.randomUUID(),
    title: `${goal.title}（コピー）`,
    status: "active",
    progress: 0,
    createdAt: new Date().toISOString(),
    reviews: [],
  };
  state.goals.unshift(next);
  state.selectedId = next.id;
}

function openGoalDialog(goal = null) {
  document.querySelector("#dialogTitle").textContent = goal ? "目標を編集" : "目標を作成";
  document.querySelector("#goalId").value = goal?.id || "";
  document.querySelector("#title").value = goal?.title || "";
  document.querySelector("#category").value = goal?.category || "day";
  document.querySelector("#dueDate").value = goal?.dueDate || toLocalInputValue(addMinutes(new Date(), 60));
  document.querySelector("#notes").value = goal?.notes || "";
  document.querySelector("#reward").value = goal?.reward || "";
  document.querySelector("#reminderPreset").value = String(goal?.reminderPreset ?? 10);
  els.goalDialog.showModal();
}

function openReviewDialog(goal) {
  document.querySelector("#reviewGoalId").value = goal.id;
  document.querySelector("#reviewComment").value = "";
  document.querySelector("#extendReason").value = "scope";
  document.querySelector("#extendedDate").value = toLocalInputValue(addMinutes(new Date(goal.dueDate), 60 * 24));
  els.reviewDialog.showModal();
}

function updateOverdueGoals() {
  const now = new Date();
  let changed = false;
  state.goals.forEach((goal) => {
    if (goal.status === "active" && new Date(goal.dueDate) < now) {
      goal.status = "missed";
      changed = true;
      notify("期限を過ぎました", `${goal.title} のレビューを書きましょう。`);
    }
  });
  if (changed) save();
}

function toggleTimer() {
  state.timerRunning = !state.timerRunning;
  els.timerToggle.textContent = state.timerRunning ? "停止" : "開始";
  if (state.timerRunning) {
    startSound(els.soundSelect.value);
    state.timerHandle = setInterval(tickTimer, 1000);
  } else {
    clearInterval(state.timerHandle);
    stopSound();
  }
}

function tickTimer() {
  state.timerSeconds -= 1;
  if (state.timerSeconds <= 0) {
    clearInterval(state.timerHandle);
    state.timerRunning = false;
    state.timerSeconds = state.timerTotal;
    els.timerToggle.textContent = "開始";
    state.focusMinutes += Math.round(state.timerTotal / 60);
    localStorage.setItem("goal-nest-focus-minutes", String(state.focusMinutes));
    stopSound();
    playPing();
    notify("集中完了", "短時間目標のセッションが完了しました。");
    render();
    return;
  }
  updateTimerDisplay();
}

function adjustTimer(minutes) {
  if (state.timerRunning) return;
  state.timerTotal = Math.max(5 * 60, Math.min(120 * 60, state.timerTotal + minutes * 60));
  state.timerSeconds = state.timerTotal;
  updateTimerDisplay();
}

function updateTimerDisplay() {
  const minutes = Math.floor(state.timerSeconds / 60).toString().padStart(2, "0");
  const seconds = Math.floor(state.timerSeconds % 60).toString().padStart(2, "0");
  els.timerDisplay.textContent = `${minutes}:${seconds}`;
}

function requestNotifications() {
  if (!("Notification" in window)) return;
  Notification.requestPermission();
}

function notify(title, body) {
  if ("Notification" in window && Notification.permission === "granted") {
    new Notification(title, { body });
  }
}

function playPing() {
  const context = new AudioContext();
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.frequency.value = 880;
  gain.gain.setValueAtTime(0.001, context.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.2, context.currentTime + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.45);
  oscillator.connect(gain).connect(context.destination);
  oscillator.start();
  oscillator.stop(context.currentTime + 0.5);
}

function startSound(type) {
  stopSound();
  if (type === "off") return;
  const context = new AudioContext();
  const gain = context.createGain();
  gain.gain.value = 0.035;
  gain.connect(context.destination);

  const oscillators = soundFrequencies(type).map((frequency) => {
    const oscillator = context.createOscillator();
    oscillator.type = type === "rain" ? "sawtooth" : "sine";
    oscillator.frequency.value = frequency;
    oscillator.connect(gain);
    oscillator.start();
    return oscillator;
  });

  state.audio = { context, oscillators };
}

function stopSound() {
  if (!state.audio) return;
  state.audio.oscillators.forEach((oscillator) => oscillator.stop());
  state.audio.context.close();
  state.audio = null;
}

function soundFrequencies(type) {
  return {
    library: [174, 261],
    forest: [196, 329],
    exam: [220, 440],
    field: [164, 246],
    classroom: [185, 370],
    rain: [90, 130],
  }[type];
}

function getGoal(id) {
  return state.goals.find((goal) => goal.id === id);
}

function hoursUntil(dateValue) {
  return (new Date(dateValue) - new Date()) / 36e5;
}

function addMinutes(date, minutes) {
  return new Date(date.getTime() + minutes * 60000);
}

function toLocalInputValue(date) {
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function formatDate(date) {
  return new Intl.DateTimeFormat("ja-JP", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[char];
  });
}

setInterval(renderReminders, 60 * 1000);
render();
