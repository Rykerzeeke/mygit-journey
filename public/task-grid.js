const TASKS_KEY = "task-checker-tasks";
const CHECKS_PREFIX = "task-checker-checks";

const els = {
  monthLabel: document.getElementById("monthLabel"),
  prevMonth: document.getElementById("prevMonth"),
  nextMonth: document.getElementById("nextMonth"),
  todayBtn: document.getElementById("todayBtn"),
  taskInput: document.getElementById("taskInput"),
  addTaskBtn: document.getElementById("addTaskBtn"),
  sheetCols: document.getElementById("sheetCols"),
  sheetHead: document.getElementById("sheetHead"),
  sheetBody: document.getElementById("sheetBody"),
  progressPie: document.getElementById("progressPie"),
  progressPercent: document.getElementById("progressPercent"),
  progressCount: document.getElementById("progressCount")
};

let currentMonth = new Date();
currentMonth.setDate(1);

function daysInMonth(date){
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

function monthKey(date){
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function monthLabel(date){
  return new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(date);
}

function todayInfo(){
  const now = new Date();
  return { y: now.getFullYear(), m: now.getMonth(), d: now.getDate() };
}

function loadTasks(){
  const raw = localStorage.getItem(TASKS_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (_err) {
    return [];
  }
}

function saveTasks(tasks){
  localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
}

function checksKey(month){
  return `${CHECKS_PREFIX}-${month}`;
}

function loadChecks(month){
  const raw = localStorage.getItem(checksKey(month));
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch (_err) {
    return {};
  }
}

function saveChecks(month, checks){
  localStorage.setItem(checksKey(month), JSON.stringify(checks));
}

function newId(){
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function removeTaskChecks(taskId){
  Object.keys(localStorage).forEach((key) => {
    if (!key.startsWith(`${CHECKS_PREFIX}-`)) return;
    try {
      const parsed = JSON.parse(localStorage.getItem(key) || "{}");
      if (!parsed || typeof parsed !== "object") return;
      if (!(taskId in parsed)) return;
      delete parsed[taskId];
      localStorage.setItem(key, JSON.stringify(parsed));
    } catch (_err) {
      // Ignore malformed localStorage values.
    }
  });
}

function calcProgress(data, days){
  const total = data.tasks.length * days;
  if (total === 0) return { checked: 0, total: 0, percent: 0 };

  let checked = 0;
  data.tasks.forEach((task) => {
    for (let day = 1; day <= days; day += 1){
      if (data.checks?.[task.id]?.[day]) checked += 1;
    }
  });

  const percent = Math.round((checked / total) * 100);
  return { checked, total, percent };
}

function updateProgress(data, days){
  const { checked, total, percent } = calcProgress(data, days);
  els.progressPie.style.setProperty("--p", `${percent}%`);
  els.progressPercent.textContent = `${percent}%`;
  els.progressCount.textContent = `${checked} / ${total} checks`;
}

function buildCols(days){
  const frag = document.createDocumentFragment();

  const taskCol = document.createElement("col");
  taskCol.className = "task-col-width";
  frag.appendChild(taskCol);

  for (let day = 1; day <= days; day += 1){
    const dayCol = document.createElement("col");
    dayCol.className = "day-col-width";
    frag.appendChild(dayCol);
  }

  return frag;
}

function buildHeader(days, today){
  const tr = document.createElement("tr");
  const thTask = document.createElement("th");
  thTask.textContent = "Task";
  thTask.className = "task-col";
  tr.appendChild(thTask);

  for (let day = 1; day <= days; day += 1){
    const th = document.createElement("th");
    th.className = "day-head";
    th.textContent = day;
    if (today && today.d === day && today.m === currentMonth.getMonth() && today.y === currentMonth.getFullYear()){
      th.classList.add("today-col");
    }
    tr.appendChild(th);
  }

  return tr;
}

function buildRow(task, days, data, today){
  const tr = document.createElement("tr");

  const tdTask = document.createElement("td");
  tdTask.className = "task-col";
  const taskWrap = document.createElement("div");
  taskWrap.className = "task-cell";

  const name = document.createElement("span");
  name.className = "task-name";
  name.textContent = task.name;

  const actions = document.createElement("div");
  actions.className = "task-actions";

  const renameBtn = document.createElement("button");
  renameBtn.className = "icon-btn";
  renameBtn.type = "button";
  renameBtn.textContent = "Rename";
  renameBtn.addEventListener("click", () => {
    const next = prompt("Rename task", task.name);
    if (!next) return;
    const trimmed = next.trim();
    if (!trimmed) return;

    const tasks = loadTasks();
    const index = tasks.findIndex((t) => t.id === task.id);
    if (index === -1) return;
    tasks[index].name = trimmed;
    saveTasks(tasks);
    render();
  });

  const delBtn = document.createElement("button");
  delBtn.className = "icon-btn";
  delBtn.type = "button";
  delBtn.textContent = "Delete";
  delBtn.addEventListener("click", () => {
    const ok = confirm(`Delete task "${task.name}"?`);
    if (!ok) return;
    const tasks = loadTasks().filter((t) => t.id !== task.id);
    saveTasks(tasks);
    removeTaskChecks(task.id);
    render();
  });

  actions.appendChild(renameBtn);
  actions.appendChild(delBtn);

  taskWrap.appendChild(name);
  taskWrap.appendChild(actions);
  tdTask.appendChild(taskWrap);
  tr.appendChild(tdTask);

  for (let day = 1; day <= days; day += 1){
    const td = document.createElement("td");
    td.className = "day-cell";
    if (today && today.d === day && today.m === currentMonth.getMonth() && today.y === currentMonth.getFullYear()){
      td.classList.add("today-col");
    }

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    const checked = data.checks?.[task.id]?.[day];
    checkbox.checked = Boolean(checked);

    checkbox.addEventListener("change", () => {
      if (!data.checks[task.id]) data.checks[task.id] = {};
      data.checks[task.id][day] = checkbox.checked;
      saveChecks(monthKey(currentMonth), data.checks);
      updateProgress(data, days);
    });

    td.appendChild(checkbox);
    tr.appendChild(td);
  }

  return tr;
}

function render(){
  const days = daysInMonth(currentMonth);
  const key = monthKey(currentMonth);
  const today = todayInfo();
  const data = {
    tasks: loadTasks(),
    checks: loadChecks(key)
  };

  els.monthLabel.textContent = monthLabel(currentMonth);
  updateProgress(data, days);
  els.sheetCols.innerHTML = "";
  els.sheetCols.appendChild(buildCols(days));
  els.sheetHead.innerHTML = "";
  els.sheetBody.innerHTML = "";
  els.sheetHead.appendChild(buildHeader(days, today));

  if (data.tasks.length === 0){
    const empty = document.createElement("tr");
    empty.className = "empty-row";
    const td = document.createElement("td");
    td.colSpan = days + 1;
    td.textContent = "Add your first task to start checking off days.";
    empty.appendChild(td);
    els.sheetBody.appendChild(empty);
    return;
  }

  data.tasks.forEach((task) => {
    els.sheetBody.appendChild(buildRow(task, days, data, today));
  });
}

els.addTaskBtn.addEventListener("click", () => {
  const name = els.taskInput.value.trim();
  if (!name) return;
  const tasks = loadTasks();
  tasks.push({ id: newId(), name });
  saveTasks(tasks);
  els.taskInput.value = "";
  render();
});

els.taskInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") els.addTaskBtn.click();
});

els.prevMonth.addEventListener("click", () => {
  currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
  render();
});

els.nextMonth.addEventListener("click", () => {
  currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
  render();
});

els.todayBtn.addEventListener("click", () => {
  currentMonth = new Date();
  currentMonth.setDate(1);
  render();
});

render();
