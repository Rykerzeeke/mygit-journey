async function postJSON(url, data) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  const payload = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(payload.message || "Request failed");
  }
  return payload;
}

async function redirectAfterAuth() {
  window.location.href = "/tasks.html";
}

const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");

if (loginForm) {
  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = new FormData(loginForm);
    const message = document.getElementById("loginMessage");
    message.textContent = "";

    try {
      await postJSON("/api/auth/login", {
        username: formData.get("username"),
        password: formData.get("password")
      });
      await redirectAfterAuth();
    } catch (err) {
      message.textContent = err.message;
    }
  });
}

if (registerForm) {
  registerForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = new FormData(registerForm);
    const message = document.getElementById("registerMessage");
    message.textContent = "";

    try {
      await postJSON("/api/auth/register", {
        username: formData.get("username"),
        password: formData.get("password")
      });
      await redirectAfterAuth();
    } catch (err) {
      message.textContent = err.message;
    }
  });
}
