const API_URL = (import.meta.env.VITE_API_URL || "/api").replace(/\/$/, "");

// ---------- Login session ) ----------
export const getToken = () => localStorage.getItem("token");

export function getUser() {
  try {
    return JSON.parse(localStorage.getItem("user"));
  } catch {
    return null;
  }
}

export function saveUser(user) {
  localStorage.setItem("user", JSON.stringify(user));
  window.dispatchEvent(new Event("userchange")); // tells the Navbar to refresh
}

export function setSession(token, user) {
  localStorage.setItem("token", token);
  saveUser(user);
}

export function clearSession() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  window.dispatchEvent(new Event("userchange"));
}

// ---------- Talking to the backend ----------
export async function api(path, { method = "GET", body } = {}) {
  const headers = { "Content-Type": "application/json" };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error("Cannot reach the server. Check that the backend is running on port 5000.");
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    // Expired or invalid session: send the user back to the login page
    if (response.status === 401 && token && !path.startsWith("/auth/login")) {
      clearSession();
      window.location.href = "/login";
    }
    throw new Error(data.error || "Something went wrong. Please try again.");
  }
  return data;
}

// ---------- Number formatting ----------
const currency = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 });
const number = new Intl.NumberFormat("en-IN");

export const money = (value) => currency.format(Number(value) || 0);
export const count = (value) => number.format(Number(value) || 0);