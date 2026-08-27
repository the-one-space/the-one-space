(() => {
  const originalInstallApp = window.installApp;
  const userAgent = navigator.userAgent || "";
  const isAndroid = /Android/i.test(userAgent);
  const isChrome = /Chrome\//i.test(userAgent) &&
    !/SamsungBrowser|KAKAOTALK|NAVER|Instagram|FBAN|FBAV/i.test(userAgent);
  const isStandalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone === true;

  function openInChrome() {
    const path = location.host + location.pathname + location.search + location.hash;
    const fallback = encodeURIComponent(location.href);
    location.href =
      "intent://" + path +
      "#Intent;scheme=https;package=com.android.chrome;" +
      "S.browser_fallback_url=" + fallback + ";end";
  }

  window.installApp = async function installAppFromCurrentBrowser() {
    if (isStandalone) {
      alert("THE ONE SPACE가 이미 앱으로 설치되어 있습니다.");
      return;
    }

    if (isAndroid && !isChrome) {
      openInChrome();
      return;
    }

    return originalInstallApp.apply(this, arguments);
  };

  function updateInstallButton() {
    document.querySelectorAll('[onclick*="installApp"]').forEach(button => {
      if (isStandalone) {
        button.hidden = true;
        return;
      }

      if (isAndroid && !isChrome) {
        button.textContent = "Chrome으로 열어 앱 설치";
        button.setAttribute("aria-label", "Chrome으로 열어 THE ONE SPACE 앱 설치");
      } else if (isAndroid && isChrome) {
        button.textContent = "앱 설치";
        button.setAttribute("aria-label", "THE ONE SPACE 앱 설치");
      }
    });
  }

  updateInstallButton();
  new MutationObserver(updateInstallButton).observe(document.body, {
    childList: true,
    subtree: true
  });
})();