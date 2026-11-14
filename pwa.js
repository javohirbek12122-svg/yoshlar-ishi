(() => {
  "use strict";
  const standalone = window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
  const ua = navigator.userAgent || "";
  const isIOS = /iPhone|iPad|iPod/i.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const isAndroid = /Android/i.test(ua);
  const isSmallScreen = window.matchMedia("(max-width: 760px)").matches;
  let installPrompt = null;
  let banner = null;
  let helpDialog = null;

  if ("serviceWorker" in navigator && window.isSecureContext) {
    const registerWorker = () => {
      navigator.serviceWorker.register("/service-worker.js", { scope: "/" })
        .catch((error) => console.warn("Yoshlar-Ishi offline support could not start:", error));
    };
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", registerWorker, { once: true });
    } else {
      registerWorker();
    }
  }

  function addStyles() {
    if (document.getElementById("yi-pwa-style")) return;
    const style = document.createElement("style");
    style.id = "yi-pwa-style";
    style.textContent = `
      #yi-install-banner{position:fixed;z-index:9998;left:12px;right:12px;bottom:calc(12px + env(safe-area-inset-bottom,0px));max-width:520px;margin:auto;display:flex;align-items:center;gap:12px;padding:13px 14px;border:1px solid #cbd8e3;border-radius:13px;background:#fff;box-shadow:0 16px 42px #0d2c4c25;color:#152336;font:13px/1.4 system-ui,sans-serif}
      #yi-install-banner[hidden],#yi-install-help[hidden],#yi-network-status[hidden]{display:none!important}
      #yi-install-banner .yi-pwa-mark{flex:0 0 38px;width:38px;height:38px;display:grid;place-items:center;border-radius:9px;background:#123255;color:#d7ff66;font-weight:900;font-size:12px}
      #yi-install-banner .yi-pwa-copy{min-width:0;flex:1}
      #yi-install-banner strong{display:block;font-size:12px;color:#123255}
      #yi-install-banner small{display:block;margin-top:3px;color:#53677b;font-size:10px}
      #yi-install-banner button{min-height:44px;border:1px solid #123255;border-radius:7px;background:#123255;color:#fff;padding:9px 12px;font:800 11px system-ui,sans-serif;cursor:pointer}
      #yi-install-banner .yi-pwa-close{flex:0 0 40px;min-width:40px;background:#fff;color:#53677b;border-color:#dce5ed;font-size:18px;padding:4px}
      #yi-install-help{position:fixed;z-index:9999;inset:0;display:grid;place-items:center;padding:16px;background:#0a1c2dcc}
      #yi-install-help .yi-help-card{width:min(100%,460px);max-height:calc(100dvh - 32px);overflow:auto;padding:22px;border-radius:14px;background:#fff;color:#152336;box-shadow:0 24px 70px #06162966;font:14px/1.6 system-ui,sans-serif}
      #yi-install-help h2{margin:0 40px 7px 0;color:#123255;font:800 20px/1.2 system-ui,sans-serif}
      #yi-install-help p{margin:0 0 12px;color:#53677b;font-size:12px}
      #yi-install-help ol{padding-left:22px;margin:12px 0}
      #yi-install-help li{padding:3px 0 5px;font-size:12px}
      #yi-install-help .yi-help-close{float:right;min-width:44px;min-height:44px;border:1px solid #dce5ed;border-radius:7px;background:#fff;color:#123255;font-size:20px;cursor:pointer}
      #yi-install-help .yi-help-note{padding:11px;border-left:3px solid #91b53a;background:#f3f7eb;color:#43532b;font-size:11px}
      #yi-network-status{position:fixed;z-index:9997;top:10px;left:12px;right:12px;margin:auto;width:fit-content;max-width:calc(100vw - 24px);padding:9px 13px;border-radius:9px;background:#8b3d2f;color:#fff;box-shadow:0 6px 20px #0002;font:700 11px/1.4 system-ui,sans-serif;text-align:center}
      #yi-network-status[data-online="true"]{background:#176b51}
      @media(min-width:761px){#yi-install-banner{left:auto;right:18px;bottom:18px}}
      @media(prefers-reduced-motion:no-preference){#yi-install-banner{animation:yi-banner-in .22s ease-out}@keyframes yi-banner-in{from{transform:translateY(16px);opacity:0}to{transform:translateY(0);opacity:1}}}
    `;
    document.head.appendChild(style);
  }

  function createElement(tag, text, className) {
    const element = document.createElement(tag);
    if (text !== undefined) element.textContent = text;
    if (className) element.className = className;
    return element;
  }

  function openHelp() {
    if (helpDialog) {
      helpDialog.hidden = false;
      helpDialog.querySelector(".yi-help-close").focus();
      return;
    }
    helpDialog = createElement("div", undefined, "");
    helpDialog.id = "yi-install-help";
    helpDialog.hidden = false;
    helpDialog.setAttribute("role", "dialog");
    helpDialog.setAttribute("aria-modal", "true");
    helpDialog.setAttribute("aria-labelledby", "yi-install-help-title");
    const card = createElement("div", undefined, "yi-help-card");
    const close = createElement("button", "×", "yi-help-close");
    close.type = "button";
    close.setAttribute("aria-label", "Yopish");
    close.addEventListener("click", () => { helpDialog.hidden = true; });
    card.appendChild(close);
    const heading = createElement("h2", "Yoshlar-Ishi ilovasini o‘rnating");
    heading.id = "yi-install-help-title";
    card.appendChild(heading);
    const intro = createElement("p", isIOS
      ? "iPhone yoki iPad’da saytni bosh ekranga mustaqil ilova ko‘rinishida qo‘shishingiz mumkin."
      : "Android qurilmada saytni bosh ekranga o‘rnatib, alohida oyna orqali ochishingiz mumkin.");
    card.appendChild(intro);
    const steps = createElement("ol");
    const items = isIOS
      ? ["Safari brauzerida yoshlar-ishi saytini oching.", "Share / Ulashish tugmasini bosing.", "Add to Home Screen / Bosh ekranga qo‘shish bandini tanlang.", "Open as Web App / Veb-ilova sifatida ochish yoqilganini tekshiring va Add / Qo‘shish tugmasini bosing."]
      : ["Chrome brauzerida yoshlar-ishi saytini oching.", "Brauzer menyusidagi ⋮ tugmasini bosing.", "Install app / Ilovani o‘rnatish yoki Add to Home screen / Bosh ekranga qo‘shish bandini tanlang.", "Tasdiqlang. Belgi telefon bosh ekranida paydo bo‘ladi."];
    items.forEach((item) => steps.appendChild(createElement("li", item)));
    card.appendChild(steps);
    card.appendChild(createElement("div", isIOS
      ? "Eslatma: iPhone’da o‘rnatish Safari orqali amalga oshiriladi; bu App Store’dan yuklanadigan alohida native dastur emas."
      : "Eslatma: menyudagi band nomi brauzer versiyasiga qarab farq qilishi mumkin. Bu Play Store’dan yuklanadigan alohida native dastur emas.", "yi-help-note"));
    helpDialog.appendChild(card);
    helpDialog.addEventListener("click", (event) => { if (event.target === helpDialog) helpDialog.hidden = true; });
    document.addEventListener("keydown", (event) => { if (event.key === "Escape" && helpDialog && !helpDialog.hidden) helpDialog.hidden = true; });
    document.body.appendChild(helpDialog);
    close.focus();
  }

  function hideBanner() {
    if (banner) banner.hidden = true;
  }

  function showBanner() {
    if (standalone || (!isIOS && !isAndroid && !isSmallScreen) || document.getElementById("yi-install-banner")) return;
    addStyles();
    banner = createElement("aside");
    banner.id = "yi-install-banner";
    banner.setAttribute("role", "region");
    banner.setAttribute("aria-label", "Yoshlar-Ishi ilovasini o‘rnatish");
    const mark = createElement("span", "YI", "yi-pwa-mark");
    const copy = createElement("div", undefined, "yi-pwa-copy");
    copy.appendChild(createElement("strong", "Yoshlar-Ishi — telefon ilovasi"));
    copy.appendChild(createElement("small", isIOS ? "iPhone’da bosh ekranga qo‘shing" : "Telefon bosh ekraniga o‘rnating"));
    const install = createElement("button", "O‘rnatish");
    install.type = "button";
    install.addEventListener("click", async () => {
      if (installPrompt) {
        const prompt = installPrompt;
        installPrompt = null;
        try {
          await prompt.prompt();
          const choice = await prompt.userChoice;
          if (choice && choice.outcome === "accepted") hideBanner();
          else openHelp();
        } catch { openHelp(); }
      } else {
        openHelp();
      }
    });
    const close = createElement("button", "×", "yi-pwa-close");
    close.type = "button";
    close.setAttribute("aria-label", "O‘rnatish taklifini yopish");
    close.addEventListener("click", hideBanner);
    banner.append(mark, copy, install, close);
    document.body.appendChild(banner);
  }


  function initMobileExperience() {
    const path = window.location.pathname;
    const navItems = [
      { href: "/index.html", label: "Bosh sahifa", icon: "⌂", match: ["/", "/index.html"] },
      { href: "/imkoniyatlar.html", label: "Imkoniyatlar", icon: "✳", match: ["/imkoniyatlar.html", "/startap-yoli.html"] },
      { href: "/davlat-xizmatlari.html", label: "Xizmatlar", icon: "▤", match: ["/davlat-xizmatlari.html"] },
      { href: "/kabinet.html", label: "Jarayonlar", icon: "◷", match: ["/kabinet.html"] }
    ];
    if (!document.querySelector(".yi-mobile-dock")) {
      const dock = createElement("nav");
      dock.className = "yi-mobile-dock";
      dock.setAttribute("aria-label", "Telefon navigatsiyasi");
      navItems.forEach((item) => {
        const link = createElement("a");
        link.href = item.href;
        link.className = item.match.includes(path) || (path === "/" && item.href === "/index.html") ? "is-active" : "";
        if (link.className) link.setAttribute("aria-current", "page");
        const glyph = createElement("span", item.icon, "yi-dock-icon");
        glyph.setAttribute("aria-hidden", "true");
        const label = createElement("span", item.label, "yi-dock-label");
        link.append(glyph, label);
        dock.appendChild(link);
      });
      document.body.appendChild(dock);
    }
    const ribbon = document.querySelector(".service-ribbon .wrap");
    if (ribbon && !document.getElementById("yi-services-more")) {
      const more = createElement("button", "Yana xizmatlar", "yi-services-more");
      more.id = "yi-services-more";
      more.type = "button";
      more.setAttribute("aria-expanded", "false");
      more.setAttribute("aria-controls", "xizmatlar");
      const icon = createElement("span", "+", "yi-more-icon");
      more.appendChild(icon);
      more.addEventListener("click", () => {
        const expanded = ribbon.classList.toggle("yi-services-expanded");
        more.setAttribute("aria-expanded", String(expanded));
        more.firstChild.textContent = expanded ? "Kamroq ko‘rsatish" : "Yana xizmatlar";
        icon.textContent = expanded ? "−" : "+";
      });
      ribbon.appendChild(more);
    }
    const mobileMenu = document.querySelector(".mobile-nav");
    if (mobileMenu) {
      mobileMenu.addEventListener("click", (event) => {
        const link = event.target.closest("a");
        if (link) mobileMenu.open = false;
      });
    }
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initMobileExperience, { once: true });
  else initMobileExperience();

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    installPrompt = event;
  });

  window.addEventListener("appinstalled", () => {
    installPrompt = null;
    hideBanner();
  });

  function networkStatus() {
    if (!("onLine" in navigator)) return;
    addStyles();
    let status = document.getElementById("yi-network-status");
    if (!status) {
      status = createElement("div");
      status.id = "yi-network-status";
      status.hidden = true;
      status.setAttribute("role", "status");
      status.setAttribute("aria-live", "polite");
      document.body.appendChild(status);
    }
    if (!navigator.onLine) {
      status.dataset.online = "false";
      status.textContent = "Internet aloqasi yo‘q. Saqlanmagan ariza va formalar yuborilmaydi.";
      status.hidden = false;
    } else if (status.dataset.online === "false") {
      status.dataset.online = "true";
      status.textContent = "Internet aloqasi tiklandi.";
      status.hidden = false;
      window.setTimeout(() => { status.hidden = true; }, 3500);
    }
  }

  window.addEventListener("online", networkStatus);
  window.addEventListener("offline", networkStatus);
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => { showBanner(); networkStatus(); }, { once: true });
  } else {
    showBanner();
    networkStatus();
  }
})();
