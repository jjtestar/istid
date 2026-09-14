"use client";

import { createContext, useContext, useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";

type InstallPrompt = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const InstallContext = createContext({ available: false, open: () => {} });

function browserSnapshot() {
  const nav = navigator as Navigator & { standalone?: boolean };
  const ios = /iPad|iPhone|iPod/.test(nav.userAgent) || (nav.platform === "MacIntel" && nav.maxTouchPoints > 1);
  return [
    !nav.onLine ? "offline" : "online",
    window.matchMedia("(display-mode: standalone)").matches || nav.standalone === true ? "installed" : "browser",
    ios ? "ios" : "other",
    ios || /Android/.test(nav.userAgent) ? "mobile" : "desktop",
  ].join(" ");
}

function subscribeBrowser(callback: () => void) {
  const standalone = window.matchMedia("(display-mode: standalone)");
  standalone.addEventListener("change", callback);
  window.addEventListener("online", callback);
  window.addEventListener("offline", callback);
  window.addEventListener("pageshow", callback);
  return () => {
    standalone.removeEventListener("change", callback);
    window.removeEventListener("online", callback);
    window.removeEventListener("offline", callback);
    window.removeEventListener("pageshow", callback);
  };
}

const serverSnapshot = () => "server";

export function InstallAppButton() {
  const install = useContext(InstallContext);
  if (!install.available) return null;
  return (
    <button type="button" onClick={install.open} className="inline-flex min-h-11 items-center gap-1.5 rounded-lg px-2 text-sm font-semibold text-ink hover:bg-rink-crease focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink">
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 3v12m-4-4 4 4 4-4M5 16v4h14v-4" />
      </svg>
      Installera Femtekedjan
    </button>
  );
}

export function PwaProvider({ children }: { children: ReactNode }) {
  const browser = useSyncExternalStore(subscribeBrowser, browserSnapshot, serverSnapshot);
  const offline = browser.includes("offline");
  const ios = browser.includes("ios");
  const mobile = browser.includes("mobile");
  const [installationAccepted, setInstallationAccepted] = useState(false);
  const installed = installationAccepted || browser.includes("installed");
  const [prompt, setPrompt] = useState<InstallPrompt | null>(null);
  const [waiting, setWaiting] = useState<ServiceWorker | null>(null);
  const [installing, setInstalling] = useState(false);
  const [installError, setInstallError] = useState("");
  const dialog = useRef<HTMLDialogElement>(null);
  const reloadForUpdate = useRef(false);

  useEffect(() => {
    const onInstallPrompt = (event: Event) => {
      event.preventDefault();
      setPrompt(event as InstallPrompt);
    };
    const onInstalled = () => {
      setInstallationAccepted(true);
      setPrompt(null);
      dialog.current?.close();
    };
    window.addEventListener("beforeinstallprompt", onInstallPrompt);
    window.addEventListener("appinstalled", onInstalled);

    // Stop form submissions before React actions when the device knows it is offline.
    const blockOfflineSubmit = (event: Event) => {
      if (!navigator.onLine) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    };
    document.addEventListener("submit", blockOfflineSubmit, true);
    return () => {
      window.removeEventListener("beforeinstallprompt", onInstallPrompt);
      window.removeEventListener("appinstalled", onInstalled);
      document.removeEventListener("submit", blockOfflineSubmit, true);
    };
  }, []);

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !window.isSecureContext) return;
    let disposed = false;
    let registration: ServiceWorkerRegistration | undefined;
    let installingWorker: ServiceWorker | null = null;
    const checkWaiting = () => {
      if (!disposed && registration?.waiting && navigator.serviceWorker.controller) setWaiting(registration.waiting);
    };
    const onUpdateFound = () => {
      installingWorker?.removeEventListener("statechange", checkWaiting);
      installingWorker = registration?.installing ?? null;
      installingWorker?.addEventListener("statechange", checkWaiting);
    };
    const onControllerChange = () => {
      if (reloadForUpdate.current) window.location.reload();
    };
    const checkForUpdate = () => {
      if (document.visibilityState === "visible" && navigator.onLine) {
        void registration?.update().catch(() => {});
      }
    };
    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);
    document.addEventListener("visibilitychange", checkForUpdate);
    void navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" }).then((result) => {
      if (disposed) return;
      registration = result;
      checkWaiting();
      onUpdateFound();
      registration.addEventListener("updatefound", onUpdateFound);
    }).catch((error: unknown) => {
      console.warn("Femtekedjans offlinefunktion kunde inte startas.", error);
    });
    return () => {
      disposed = true;
      navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
      document.removeEventListener("visibilitychange", checkForUpdate);
      registration?.removeEventListener("updatefound", onUpdateFound);
      installingWorker?.removeEventListener("statechange", checkWaiting);
    };
  }, []);

  async function installApp() {
    if (!prompt) return;
    setInstalling(true);
    setInstallError("");
    try {
      await prompt.prompt();
      const choice = await prompt.userChoice;
      setPrompt(null);
      if (choice.outcome === "accepted") dialog.current?.close();
    } catch {
      setPrompt(null);
      setInstallError("Installationsrutan kunde inte öppnas. Följ stegen nedan i stället.");
    } finally {
      setInstalling(false);
    }
  }

  return (
    <InstallContext.Provider value={{ available: !installed && (mobile || Boolean(prompt)), open: () => dialog.current?.showModal() }}>
      {offline ? (
        <div className="pwa-notice" role="alert">
          <p className="font-bold">Du är offline</p>
          <p className="mt-1 text-sm text-ink-muted">Anslut till internet för att fortsätta. Anmälningar och ändringar kan inte skickas nu.</p>
          <button type="button" onClick={() => window.location.reload()} className="mt-2 min-h-11 rounded-lg px-3 text-sm font-bold underline underline-offset-4">Försök igen</button>
        </div>
      ) : waiting ? (
        <div className="pwa-notice" role="status">
          <p className="font-bold">En ny version av Femtekedjan är klar</p>
          <p className="mt-1 text-sm text-ink-muted">Spara eventuella ändringar innan du uppdaterar.</p>
          <button type="button" onClick={() => {
            reloadForUpdate.current = true;
            waiting.postMessage({ type: "SKIP_WAITING" });
          }} className="mt-2 min-h-11 rounded-lg bg-ink px-4 text-sm font-bold text-white">Uppdatera</button>
          <button type="button" onClick={() => setWaiting(null)} className="ml-2 min-h-11 rounded-lg px-3 text-sm font-semibold">Senare</button>
        </div>
      ) : null}
      <div inert={offline || undefined} className="app-shell flex flex-1 flex-col">
        {children}
      </div>

      <dialog ref={dialog} aria-labelledby="pwa-install-title" className="pwa-install-dialog">
        <div className="flex items-center justify-between gap-3">
          <h2 id="pwa-install-title" className="section-title">Femtekedjan på hemskärmen</h2>
          <button type="button" aria-label="Stäng installationshjälpen" onClick={() => dialog.current?.close()} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-2xl hover:bg-rink-crease">×</button>
        </div>
        <p className="mt-3 text-base leading-6 text-ink-muted">Öppna laget direkt från en egen appikon på telefonen.</p>
        {prompt ? <button type="button" disabled={installing || offline} onClick={() => void installApp()} className="mt-5 min-h-12 w-full rounded-xl bg-ink px-4 text-base font-bold text-white disabled:opacity-50">{installing ? "Öppnar installation…" : "Installera Femtekedjan"}</button> : null}
        {installError ? <p role="alert" className="mt-3 text-sm text-signal">{installError}</p> : null}
        {ios ? (
          <ol className="mt-5 list-decimal space-y-3 pl-5 text-base leading-6">
            <li>Öppna Femtekedjan i <strong>Safari</strong>.</li>
            <li>Tryck på <strong>Dela</strong> och välj <strong>Lägg till på hemskärmen</strong>.</li>
            <li>Om valet visas, aktivera <strong>Öppna som webbapp</strong>. Tryck på <strong>Lägg till</strong>.</li>
          </ol>
        ) : !prompt ? (
          <ol className="mt-5 list-decimal space-y-3 pl-5 text-base leading-6">
            <li>Öppna Femtekedjan i <strong>Chrome</strong>.</li>
            <li>Öppna webbläsarens meny och välj <strong>Installera app</strong> eller <strong>Lägg till på startskärmen</strong>.</li>
            <li>Bekräfta installationen.</li>
          </ol>
        ) : null}
        <p className="mt-5 text-sm leading-5 text-ink-subtle">Öppna sedan Femtekedjan från den nya ikonen. Du kan behöva logga in första gången.</p>
      </dialog>
    </InstallContext.Provider>
  );
}
