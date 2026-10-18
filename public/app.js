const $ = (id) => document.getElementById(id);

$("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const msg = $("loginMsg");
  msg.textContent = "Validando...";
  try {
    const res = await fetch("/.netlify/functions/login", {
      method: "POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify({
        username: $("username").value.trim(),
        password: $("password").value
      })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "No fue posible iniciar sesión.");
    localStorage.setItem("ot_session", JSON.stringify(data.session));
    location.href = data.session.role === "admin" ? "/admin.html" : "/tecnico.html";
  } catch (err) {
    msg.textContent = err.message;
  }
});