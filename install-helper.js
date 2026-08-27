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
    const chromeUrl =
      "intent://the-one-space.github.io/the-one-space/?source=install" +
      "#Intent;scheme=https;package=com.android.chrome;end";
    const link = document.createElement("a");
    link.href = chromeUrl;
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  window.installApp = function installAppFromCurrentBrowser() {
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

  function setButtonLabel(button, label, ariaLabel) {
    if (button.textContent.trim() !== label) button.textContent = label;
    if (button.getAttribute("aria-label") !== ariaLabel) {
      button.setAttribute("aria-label", ariaLabel);
    }
  }

  function updateInstallButton() {
    document.querySelectorAll('[onclick*="installApp"]').forEach(button => {
      if (isStandalone) {
        button.hidden = true;
        return;
      }

      if (isAndroid && !isChrome) {
        setButtonLabel(
          button,
          "Chrome으로 열어 앱 설치",
          "Chrome으로 열어 THE ONE SPACE 앱 설치"
        );
      } else if (isAndroid && isChrome) {
        setButtonLabel(button, "앱 설치", "THE ONE SPACE 앱 설치");
      }
    });
  }

  updateInstallButton();
  new MutationObserver(updateInstallButton).observe(document.body, {
    childList: true,
    subtree: true
  });
})();