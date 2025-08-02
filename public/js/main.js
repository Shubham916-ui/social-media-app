const API_BASE = "http://localhost:5000/api";

// Authentication utilities
const auth = {
  setToken(token) {
    localStorage.setItem("token", token);
  },

  getToken() {
    return localStorage.getItem("token");
  },

  setUser(user) {
    localStorage.setItem("user", JSON.stringify(user));
  },

  getUser() {
    const user = localStorage.getItem("user");
    return user ? JSON.parse(user) : null;
  },

  isLoggedIn() {
    return !!this.getToken();
  },

  logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "index.html";
  },
};

// API calls
const api = {
  async post(endpoint, data) {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(auth.getToken() && { Authorization: `Bearer ${auth.getToken()}` }),
      },
      body: JSON.stringify(data),
    });
    return await response.json();
  },

  async get(endpoint) {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      headers: {
        ...(auth.getToken() && { Authorization: `Bearer ${auth.getToken()}` }),
      },
    });
    return await response.json();
  },
};

// Login form handler
document.getElementById("loginForm")?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  try {
    const result = await api.post("/users/login", { email, password });

    if (result.token) {
      auth.setToken(result.token);
      auth.setUser(result.user);
      window.location.href = "home.html";
    } else {
      alert("Login failed: " + result.error);
    }
  } catch (error) {
    alert("Error: " + error.message);
  }
});

// Check if already logged in
if (auth.isLoggedIn() && window.location.pathname.includes("index.html")) {
  window.location.href = "home.html";
}
