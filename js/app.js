"use strict";

async function prepareOffline() {
  const status = document.querySelector("#offline-status");

  if (!("serviceWorker" in navigator) || !window.isSecureContext) {
    status.textContent = "Para habilitar o modo offline, abra em HTTPS ou localhost em um navegador compatível.";
    return;
  }

  try {
    await navigator.serviceWorker.register("./service-worker.js");
    await navigator.serviceWorker.ready;
    status.textContent = "Estrutura inicial disponível offline.";
  } catch (error) {
    status.textContent = "Não foi possível preparar o modo offline. Tente novamente com conexão.";
    console.error("Falha ao registrar o service worker:", error);
  }
}

prepareOffline();
