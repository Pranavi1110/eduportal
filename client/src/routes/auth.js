// Registration route using fetch
const API_BASE = import.meta.env.VITE_API_BASE || "https://hubinity.onrender.com/api";

export async function registerUser(userData) {
  console.log("Sending user data:", userData); 
  const response = await fetch(`${API_BASE}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(userData),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Registration failed");
  }
  return response.json();
}

// Login route using fetch (with admin bootstrap fallback)
export async function loginUser(credentials) {
  const attemptLogin = async () => {
    const response = await fetch(`${API_BASE}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || "Login failed");
    }
    return response.json();
  };

  try {
    return await attemptLogin();
  } catch (err) {
    // If admin credentials provided and login failed, try to bootstrap a default admin
    const isAdminCreds =
      credentials?.email === "hubinity@gmail.com" &&
      credentials?.password === "Hubinity@1234";
    if (!isAdminCreds) throw err;
    try {
      await fetch(`${API_BASE}/admin/create-default-admin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: credentials.email, password: credentials.password }),
      });
    } catch (_) {
      // ignore bootstrap errors; we'll still try login
    }
    return await attemptLogin();
  }
}
