(() => {
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    });
  }

  let deferredPrompt = null;
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredPrompt = event;
    const btn = document.getElementById("installAppBtn");
    if (btn) btn.hidden = false;
  });

  window.installOTApp = async () => {
    if (!deferredPrompt) {
      alert("En Android: abre el menú del navegador y selecciona 'Instalar aplicación' o 'Agregar a pantalla de inicio'.");
      return;
    }
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPrompt = null;
    const btn = document.getElementById("installAppBtn");
    if (btn) btn.hidden = true;
  };

  window.addEventListener("appinstalled", () => {
    const btn = document.getElementById("installAppBtn");
    if (btn) btn.hidden = true;
  });
})();
