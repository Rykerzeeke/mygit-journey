async function fetchJSON(url, options = {}) {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options
  });
  const payload = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(payload.message || "Request failed");
  }
  return payload;
}

let pollTimer = null;
let redirectTimer = null;

function setLinkStatus(message) {
  const status = document.getElementById("linkStatus");
  if (status) {
    status.textContent = message || "";
  }
}

function scheduleRedirect() {
  if (redirectTimer) return;
  redirectTimer = setTimeout(() => {
    window.location.href = "/tasks.html";
  }, 1200);
}

async function loadProfile() {
  try {
    const { user } = await fetchJSON("/api/auth/me");
    document.getElementById("welcomeTitle").textContent = `Welcome, ${user.username}`;
    document.getElementById("lastLogin").textContent = user.lastLoginAt
      ? `Last check-in: ${new Date(user.lastLoginAt).toLocaleString()}`
      : "No check-ins yet.";

    const profileForm = document.getElementById("profileForm");
    profileForm.phoneNumber.value = user.phoneNumber || "";
    profileForm.telegramChatId.value = user.telegramChatId || "";

    if (user.telegramChatId) {
      setLinkStatus("Telegram linked. Redirecting to tasks...");
      scheduleRedirect();
    } else {
      setLinkStatus("");
    }

    return user;
  } catch (err) {
    window.location.href = "/login.html";
    return null;
  }
}

async function loadTasks() {
  const list = document.getElementById("taskList");
  if (!list) return;
  list.innerHTML = "";
  const tasks = await fetchJSON("/api/tasks");

  tasks.forEach((task) => {
    const item = document.createElement("li");
    item.className = `task-item ${task.completed ? "completed" : ""}`;
    const title = document.createElement("span");
    title.textContent = task.title;

    const actions = document.createElement("div");
    actions.className = "task-actions";

    const toggleBtn = document.createElement("button");
    toggleBtn.textContent = task.completed ? "Undo" : "Done";
    toggleBtn.className = "ghost";
    toggleBtn.addEventListener("click", async () => {
      await fetchJSON(`/api/tasks/${task.id}`, {
        method: "PUT",
        body: JSON.stringify({ completed: !task.completed })
      });
      await loadTasks();
    });

    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "Delete";
    deleteBtn.className = "ghost";
    deleteBtn.addEventListener("click", async () => {
      await fetchJSON(`/api/tasks/${task.id}`, { method: "DELETE" });
      await loadTasks();
    });

    actions.append(toggleBtn, deleteBtn);
    item.append(title, actions);
    list.append(item);
  });
}

document.getElementById("taskForm")?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const input = event.target.title;
  await fetchJSON("/api/tasks", {
    method: "POST",
    body: JSON.stringify({ title: input.value })
  });
  input.value = "";
  await loadTasks();
});

const profileForm = document.getElementById("profileForm");
profileForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const message = document.getElementById("profileMessage");
  message.textContent = "";

  try {
    await fetchJSON("/api/auth/profile", {
      method: "PUT",
      body: JSON.stringify({
        phoneNumber: profileForm.phoneNumber.value,
        telegramChatId: profileForm.telegramChatId.value
      })
    });
    message.textContent = "Profile saved.";
    if (profileForm.telegramChatId.value.trim()) {
      setLinkStatus("Telegram linked. Redirecting to tasks...");
      scheduleRedirect();
    } else {
      await loadProfile();
    }
  } catch (err) {
    message.textContent = err.message;
  }
});

async function pollTelegramStatus(startedAt) {
  try {
    const { linked } = await fetchJSON("/api/telegram/status");
    if (linked) {
      setLinkStatus("Telegram linked. Redirecting to tasks...");
      clearInterval(pollTimer);
      pollTimer = null;
      scheduleRedirect();
      return;
    }
  } catch (err) {
    setLinkStatus("Unable to check status.");
    clearInterval(pollTimer);
    pollTimer = null;
    return;
  }

  if (Date.now() - startedAt > 2 * 60 * 1000) {
    setLinkStatus("Link timed out. Generate a new code if needed.");
    clearInterval(pollTimer);
    pollTimer = null;
  }
}

function startLinkPolling() {
  if (pollTimer) {
    clearInterval(pollTimer);
  }
  const started = Date.now();
  pollTimer = setInterval(() => pollTelegramStatus(started), 4000);
}

const linkBtn = document.getElementById("linkTelegramBtn");
const linkCodeEl = document.getElementById("linkCode");
const linkHintEl = document.getElementById("linkHint");

linkBtn.addEventListener("click", async () => {
  linkCodeEl.textContent = "";
  linkHintEl.textContent = "";
  setLinkStatus("Waiting for bot confirmation...");
  try {
    const { linkCode, expiresAt } = await fetchJSON("/api/telegram/link", { method: "POST" });
    linkCodeEl.textContent = linkCode.toUpperCase();
    const expires = new Date(expiresAt).toLocaleTimeString();
    linkHintEl.textContent = `Send: /start ${linkCode} to your bot before ${expires}.`;
    startLinkPolling();
  } catch (err) {
    setLinkStatus("");
    linkHintEl.textContent = err.message;
  }
});

const logoutBtn = document.getElementById("logoutBtn");
logoutBtn.addEventListener("click", async () => {
  await fetchJSON("/api/auth/logout", { method: "POST" });
  window.location.href = "/login.html";
});

loadProfile();
loadTasks();
