const SUPABASE_URL = "https://iluetyyhzqegupejlqhq.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_ykDuIZGznZnQvI6Uxhy7dg_F-y8RQHB";

const SITE_URL = "https://the-one-space.github.io/the-one-space/";

const app = document.getElementById("app");
const client = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);


let deferredInstallPrompt = null;

window.addEventListener("beforeinstallprompt", event => {
  event.preventDefault();
  deferredInstallPrompt = event;
});

window.addEventListener("appinstalled", () => {
  deferredInstallPrompt = null;
});

async function installApp() {
  const isStandalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone === true;

  if (isStandalone) {
    alert("THE ONE SPACE가 이미 앱으로 설치되어 있습니다.");
    return;
  }

  if (deferredInstallPrompt) {
    deferredInstallPrompt.prompt();
    await deferredInstallPrompt.userChoice;
    deferredInstallPrompt = null;
    return;
  }

  const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);

  if (isIos) {
    alert(
      "아이폰 설치 방법\n\n" +
      "1. Safari로 이 페이지를 열어 주세요.\n" +
      "2. 아래쪽 공유 버튼(□↑)을 눌러 주세요.\n" +
      "3. '홈 화면에 추가'를 선택해 주세요."
    );
    return;
  }

  alert(
    "브라우저 오른쪽 위 메뉴(⋮)에서\n" +
    "'앱 설치' 또는 '홈 화면에 추가'를 눌러 주세요."
  );
}

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("./service-worker.js")
      .catch(error => console.error("Service worker registration failed:", error));
  });
}


// =====================================================
// 화면 뒤로가기 기록
// =====================================================

const viewHistory = [];
let currentViewIndex = -1;
let restoringView = false;
let viewHistoryReady = false;

function saveCurrentView() {
  if (restoringView) {
    restoringView = false;
    return;
  }

  const html = app.innerHTML;

  if (!html || (currentViewIndex >= 0 && viewHistory[currentViewIndex] === html)) {
    return;
  }

  if (!viewHistoryReady) {
    viewHistory.push(html);
    currentViewIndex = 0;
    viewHistoryReady = true;
    history.replaceState(
      { theOneViewIndex: 0 },
      document.title,
      window.location.href
    );
    return;
  }

  viewHistory.splice(currentViewIndex + 1);
  viewHistory.push(html);
  currentViewIndex = viewHistory.length - 1;

  history.pushState(
    { theOneViewIndex: currentViewIndex },
    document.title,
    window.location.href
  );
}

const viewObserver = new MutationObserver(() => {
  queueMicrotask(saveCurrentView);
});

viewObserver.observe(app, {
  childList: true
});

window.addEventListener("popstate", event => {
  const targetIndex = event.state?.theOneViewIndex;

  if (
    typeof targetIndex !== "number" ||
    !viewHistory[targetIndex]
  ) {
    return;
  }

  restoringView = true;
  currentViewIndex = targetIndex;
  app.innerHTML = viewHistory[targetIndex];
});



// =====================================================
// 공통
// =====================================================

function setMsg(text) {
  const el = document.getElementById("msg");
  if (el) {
    el.innerHTML = `<div class="msg">${text}</div>`;
  }
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function getCurrentUser() {
  const {
    data: { user }
  } = await client.auth.getUser();

  return user || null;
}

async function getCurrentProfile() {
  const user = await getCurrentUser();

  if (!user) return null;

  const { data: profile } = await client
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return profile || null;
}


// =====================================================
// 로그인 화면
// =====================================================

function authScreen() {
  app.innerHTML = `
    <div class="auth">

      <div class="brand" onclick="goHome()" role="button" tabindex="0" title="메인으로" style="cursor:pointer;" onkeydown="if(event.key === 'Enter' || event.key === ' '){ event.preventDefault(); goHome(); }">
        THE ONE <b>SPACE</b>
      </div>

      <h2>지점 전용 공간</h2>

      <p class="muted">
        승인된 직원만 이용할 수 있습니다.
      </p>

      <div class="field">
        <label>이메일</label>
        <input id="email" type="email">
      </div>

      <div class="field">
        <label>비밀번호</label>
        <input id="pw" type="password">
      </div>

      <button class="btn" onclick="login()">
        로그인
      </button>

      <button
        class="btn secondary"
        onclick="signupForm()"
      >
        회원가입
      </button>

      <button
        class="btn secondary"
        onclick="forgotPassword()"
      >
        비밀번호 찾기
      </button>

      <div id="msg"></div>

    </div>
  `;
}


// =====================================================
// 회원가입 화면
// =====================================================

function signupForm() {
  app.innerHTML = `
    <div class="auth">

      <div class="brand" onclick="goHome()" role="button" tabindex="0" title="메인으로" style="cursor:pointer;" onkeydown="if(event.key === 'Enter' || event.key === ' '){ event.preventDefault(); goHome(); }">
        THE ONE <b>SPACE</b>
      </div>

      <h2>직원 회원가입</h2>

      <p class="muted">
        가입 신청 후 관리자 승인이 필요합니다.
      </p>

      <div class="field">
        <label>이름</label>
        <input id="name" type="text">
      </div>

      <div class="field">
        <label>이메일</label>
        <input id="email" type="email">
      </div>

      <div class="field">
        <label>비밀번호</label>
        <input id="pw" type="password">
      </div>

      <div class="field">
        <label>전화번호</label>
        <input id="phone" type="tel" inputmode="tel" placeholder="010-0000-0000">
      </div>

      <div class="field">
        <label>생년월일</label>
        <input id="birthday" type="text" inputmode="numeric" maxlength="8"
          placeholder="예: 19920319" autocomplete="bday">
      </div>

      <div class="field">
        <label>직급</label>

        <select id="position">
          <option value="지점장">지점장</option>
          <option value="이사">이사</option>
          <option value="팀장">팀장</option>
          <option value="MP">MP</option>
          <option value="비서">비서</option>
        </select>
      </div>

      <button class="btn" onclick="signup()">
        가입 신청
      </button>

      <button
        class="btn secondary"
        onclick="authScreen()"
      >
        로그인으로 돌아가기
      </button>

      <div id="msg"></div>

    </div>
  `;
}



async function myProfilePage() {
  const profile = await getCurrentProfile();
  const user = await getCurrentUser();
  if (!profile || !user || profile.status !== "approved") {
    authScreen();
    return;
  }

  const birthdayDigits = String(profile.birthday || "").replace(/\D/g, "");
  const positions = ["지점장", "이사", "팀장", "MP", "비서"]
    .map(position => `<option value="${position}" ${profile.position === position ? "selected" : ""}>${position}</option>`)
    .join("");

  app.innerHTML = `
    <div class="wrap">
      <div class="top">
        <div class="brand" onclick="goHome()" role="button" tabindex="0" title="메인으로" style="cursor:pointer;">THE ONE <b>SPACE</b></div>
        <button class="btn secondary" onclick="goHome()">메인으로</button>
      </div>
      <section class="hero">
        <div class="muted">MY PROFILE</div>
        <h1>내 정보 수정</h1>
        <p>내 이름, 연락처, 생년월일과 직급을 수정할 수 있습니다.</p>
      </section>
      <div class="auth profile-edit-card">
        <div class="field">
          <label>이메일</label>
          <input type="email" value="${escapeHtml(user.email || "")}" disabled>
          <small class="muted">이메일은 로그인 계정이라 변경할 수 없습니다.</small>
        </div>
        <div class="field">
          <label>이름</label>
          <input id="profileName" type="text" value="${escapeHtml(profile.name || "")}">
        </div>
        <div class="field">
          <label>전화번호</label>
          <input id="profilePhone" type="tel" inputmode="tel" value="${escapeHtml(profile.phone || "")}" placeholder="010-0000-0000">
        </div>
        <div class="field">
          <label>생년월일</label>
          <input id="profileBirthday" type="text" inputmode="numeric" maxlength="8"
            value="${birthdayDigits}" placeholder="예: 19920319" autocomplete="bday">
        </div>
        <div class="field">
          <label>직급</label>
          <select id="profilePosition">${positions}</select>
        </div>
        <button class="btn" onclick="saveMyProfile()">수정 내용 저장</button>
        <button class="btn secondary profile-trash-btn" onclick="myTrashPage()">🗑️ 내 휴지통</button>
      </div>
    </div>`;
}


async function myTrashPage() {
  const profile = await getCurrentProfile();
  const user = await getCurrentUser();
  if (!profile || !user || profile.status !== "approved") { authScreen(); return; }

  const [a, b, n] = await Promise.all([
    client.from("recordings").select("id,short_title,owner_name,deleted_at").eq("uploaded_by", user.id).not("deleted_at","is",null).order("deleted_at",{ascending:false}),
    client.from("resources").select("id,title,uploader_name,deleted_at").eq("uploaded_by", user.id).not("deleted_at","is",null).order("deleted_at",{ascending:false}),
    client.from("notices").select("id,title,deleted_at").eq("created_by", user.id).not("deleted_at","is",null).order("deleted_at",{ascending:false})
  ]);

  const items = []
    .concat((a.data || []).map(x => ({type:"recording", id:x.id, title:x.short_title, deleted_at:x.deleted_at})))
    .concat((b.data || []).map(x => ({type:"resource", id:x.id, title:x.title, deleted_at:x.deleted_at})))
    .concat((n.data || []).map(x => ({type:"notice", id:x.id, title:x.title, deleted_at:x.deleted_at})))
    .sort((x,y) => new Date(y.deleted_at) - new Date(x.deleted_at));

  const cards = items.length ? items.map(x => {
    const deleted = new Date(x.deleted_at);
    const days = Math.max(1, 30 - Math.floor((Date.now() - deleted.getTime()) / 86400000));
    return `<article class="card trash-card">
      <div class="trash-card-head"><span>${trashTypeLabel(x.type)}</span><em>남은 기간 ${days}일</em></div>
      <h3>${escapeHtml(x.title || "제목 없음")}</h3>
      <p class="muted">삭제일: ${deleted.toLocaleString("ko-KR")}</p>
      <div class="trash-actions"><button class="btn" onclick="restoreMyTrashItem('${x.type}','${x.id}')">내 자료 복원</button></div>
    </article>`;
  }).join("") : `<div class="card trash-empty"><span>🗑️</span><h3>내 휴지통이 비어 있습니다.</h3><p class="muted">내가 삭제한 항목은 30일 동안 이곳에 보관됩니다.</p></div>`;

  app.innerHTML = `<div class="wrap">
    <div class="top"><div class="brand" onclick="goHome()" style="cursor:pointer;">THE ONE <b>SPACE</b></div>
      <button class="btn secondary" onclick="myProfilePage()">내 정보로</button></div>
    <section class="hero"><div class="muted">MY TRASH</div><h1>내 휴지통</h1><p>내가 등록했다가 삭제한 항목을 직접 복원할 수 있습니다.</p></section>
    <div class="trash-grid">${cards}</div>
  </div>`;
}

async function restoreMyTrashItem(type, id) {
  if (!confirm(trashTypeLabel(type) + "을(를) 원래 위치로 복원하시겠습니까?")) return;
  const { error } = await client.rpc("restore_trash_item", { item_type:type, item_id:String(id) });
  if (error) return alert("복원하지 못했습니다.\n" + error.message);
  alert("내 자료가 복원되었습니다.");
  await myTrashPage();
}

function normalizeBirthdayDigits(value) {
  const digits = String(value || "").replace(/\D/g, "");
  if (!/^\d{8}$/.test(digits)) return "";
  const year = Number(digits.slice(0, 4));
  const month = Number(digits.slice(4, 6));
  const day = Number(digits.slice(6, 8));
  const parsed = new Date(year, month - 1, day);
  if (parsed.getFullYear() !== year || parsed.getMonth() !== month - 1 || parsed.getDate() !== day) return "";
  return digits.slice(0, 4) + "-" + digits.slice(4, 6) + "-" + digits.slice(6, 8);
}

async function saveMyProfile() {
  const name = document.getElementById("profileName").value.trim();
  const phone = document.getElementById("profilePhone").value.trim();
  const birthday = normalizeBirthdayDigits(document.getElementById("profileBirthday").value);
  const position = document.getElementById("profilePosition").value;

  if (!name || !phone) {
    alert("이름과 전화번호를 입력해 주세요.");
    return;
  }
  if (!birthday) {
    alert("생년월일 8자리를 정확히 입력해 주세요. 예: 19920319");
    return;
  }

  const { error } = await client.rpc("update_my_profile", {
    new_name: name,
    new_phone: phone,
    new_birthday: birthday,
    new_position: position
  });

  if (error) {
    alert("내 정보를 저장하지 못했습니다.\n" + error.message);
    return;
  }

  alert("내 정보가 수정되었습니다.");
  await goHome();
}

// =====================================================
// 로그인
// =====================================================

async function login() {
  const emailValue =
    document.getElementById("email").value.trim();

  const pwValue =
    document.getElementById("pw").value;

  if (!emailValue || !pwValue) {
    setMsg("이메일과 비밀번호를 입력해 주세요.");
    return;
  }

  const { data, error } =
    await client.auth.signInWithPassword({
      email: emailValue,
      password: pwValue
    });

  if (error) {
    setMsg(error.message);
    return;
  }

  const { data: profile, error: profileError } =
    await client
      .from("profiles")
      .select("*")
      .eq("id", data.user.id)
      .single();

  if (profileError || !profile) {
    await client.auth.signOut();
    setMsg("사용자 정보를 확인할 수 없습니다.");
    return;
  }

  if (profile.status !== "approved") {
    await client.auth.signOut();
    setMsg("관리자 승인 후 이용할 수 있습니다.");
    return;
  }

  home(profile);
}


// =====================================================
// 회원가입
// =====================================================

async function signup() {
  const nameValue =
    document.getElementById("name").value.trim();

  const emailValue =
    document.getElementById("email").value.trim();

  const pwValue =
    document.getElementById("pw").value;

  const phoneValue =
    document.getElementById("phone").value.trim();

  const birthdayDigits =
    document.getElementById("birthday").value.replace(/\D/g, "");

  let birthdayValue = "";
  if (/^\d{8}$/.test(birthdayDigits)) {
    const year = Number(birthdayDigits.slice(0, 4));
    const month = Number(birthdayDigits.slice(4, 6));
    const day = Number(birthdayDigits.slice(6, 8));
    const parsed = new Date(year, month - 1, day);
    if (
      parsed.getFullYear() === year &&
      parsed.getMonth() === month - 1 &&
      parsed.getDate() === day
    ) {
      birthdayValue =
        birthdayDigits.slice(0, 4) + "-" +
        birthdayDigits.slice(4, 6) + "-" +
        birthdayDigits.slice(6, 8);
    }
  }

  const positionValue =
    document.getElementById("position").value;

  if (!nameValue || !emailValue || !pwValue || !phoneValue) {
    setMsg("이름, 이메일, 비밀번호, 전화번호를 모두 입력해 주세요.");
    return;
  }

  if (!birthdayValue) {
    setMsg("생년월일 8자리를 정확히 입력해 주세요. 예: 19920319");
    return;
  }

  const { error } =
    await client.auth.signUp({
      email: emailValue,
      password: pwValue,

      options: {
        data: {
          name: nameValue,
          position: positionValue,
          phone: phoneValue,
          birthday: birthdayValue
        }
      }
    });

  if (error) {
    setMsg(error.message);
    return;
  }

  setMsg(
    "가입 신청 완료! 관리자 승인 후 로그인할 수 있습니다."
  );
}


// =====================================================
// 비밀번호 찾기
// =====================================================

async function forgotPassword() {
  const emailValue =
    prompt("가입할 때 사용한 이메일을 입력해 주세요.");

  if (!emailValue) return;

  const { error } =
    await client.auth.resetPasswordForEmail(
      emailValue.trim(),
      {
        redirectTo: SITE_URL
      }
    );

  if (error) {
    alert(
      "재설정 메일 발송에 실패했습니다.\n" +
      error.message
    );
    return;
  }

  alert(
    "비밀번호 재설정 메일을 보냈습니다.\n메일함을 확인해 주세요."
  );
}

function showResetPasswordScreen() {
  app.innerHTML = `
    <div class="auth">

      <div class="brand" onclick="goHome()" role="button" tabindex="0" title="메인으로" style="cursor:pointer;" onkeydown="if(event.key === 'Enter' || event.key === ' '){ event.preventDefault(); goHome(); }">
        THE ONE <b>SPACE</b>
      </div>

      <h2>새 비밀번호 설정</h2>

      <div class="field">
        <label>새 비밀번호</label>
        <input id="newPw" type="password">
      </div>

      <div class="field">
        <label>새 비밀번호 확인</label>
        <input id="newPwConfirm" type="password">
      </div>

      <button
        class="btn"
        onclick="updatePassword()"
      >
        비밀번호 변경
      </button>

      <div id="msg"></div>

    </div>
  `;
}

async function updatePassword() {
  const newPw =
    document.getElementById("newPw").value;

  const newPwConfirm =
    document.getElementById("newPwConfirm").value;

  if (!newPw || !newPwConfirm) {
    setMsg("새 비밀번호를 모두 입력해 주세요.");
    return;
  }

  if (newPw !== newPwConfirm) {
    setMsg("비밀번호가 서로 일치하지 않습니다.");
    return;
  }

  if (newPw.length < 6) {
    setMsg("비밀번호는 6자 이상 입력해 주세요.");
    return;
  }

  const { error } =
    await client.auth.updateUser({
      password: newPw
    });

  if (error) {
    setMsg(error.message);
    return;
  }

  alert("비밀번호가 변경되었습니다.");

  await client.auth.signOut();

  history.replaceState(
    {},
    document.title,
    window.location.pathname
  );

  authScreen();
}


// =====================================================
// 메인
// =====================================================

async function home(profile) {
  const scheduleSheetId = "1h_mwY9v-YdpEknbme16u1-kvY618_QJN";
  const scheduleTabs = {
    8: "1296088469",
    9: "1653002200",
    10: "751739663",
    11: "504726274",
    12: "2130795180"
  };
  const currentMonth = new Date().getMonth() + 1;
  const scheduleGid = scheduleTabs[currentMonth] || scheduleTabs[9];
  const scheduleUrl =
    `https://docs.google.com/spreadsheets/d/${scheduleSheetId}/edit?pli=1&gid=${scheduleGid}#gid=${scheduleGid}`;

  const [
    { count: recordingCount },
    { count: resourceCount },
    { count: employeeCount },
    { count: noticeCount },
    { data: recentRecordings },
    { data: recentNotices }
  ] = await Promise.all([
    client.from("recordings").select("id", { count: "exact", head: true }).is("deleted_at", null),
    client.from("resources").select("id", { count: "exact", head: true }).is("deleted_at", null),
    client.from("profiles").select("id", { count: "exact", head: true }).eq("status", "approved"),
    client.from("notices").select("id", { count: "exact", head: true }).is("deleted_at", null),
    client.from("recordings").select("id, short_title, owner_name, consultation_date, created_at")
      .is("deleted_at", null)
      .order("consultation_date", { ascending: false }).order("created_at", { ascending: false }).limit(4),
    client.from("notices").select("id, title, content, is_pinned, created_at")
      .is("deleted_at", null)
      .order("is_pinned", { ascending: false }).order("created_at", { ascending: false }).limit(4)
  ]);

  const today = new Date();
  const dateText = today.toLocaleDateString("ko-KR", {
    year: "numeric", month: "2-digit", day: "2-digit", weekday: "short"
  });
  const timeText = today.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });


  const birthdayParts = String(profile.birthday || "").split("-");
  const isBirthdayToday =
    Number(birthdayParts[1]) === today.getMonth() + 1 &&
    Number(birthdayParts[2]) === today.getDate();
  const welcomeMessage = isBirthdayToday
    ? "🎉 생일을 진심으로 축하드려요! 오늘 더 행복한 하루 보내세요."
    : "오늘도 함께 성장하는 하루 되세요.";

  const noticeRows = (recentNotices || []).length
    ? recentNotices.map(item => `
        <button class="dashboard-list-row dashboard-search-item" data-search="${escapeHtml(item.title + " " + (item.content || ""))}"
          onclick="noticeDetail('${item.id}')">
          <span class="dashboard-badge ${item.is_pinned ? "important" : ""}">${item.is_pinned ? "필독" : "안내"}</span>
          <span class="dashboard-list-main">
            <b>${escapeHtml(item.title)}</b>
            <small>${escapeHtml(item.content || "공지 내용을 확인해 주세요.")}</small>
          </span>
          <time>${new Date(item.created_at).toLocaleDateString("ko-KR")}</time>
        </button>`).join("")
    : `<div class="dashboard-empty">등록된 공지사항이 없습니다.</div>`;

  const recordingRows = (recentRecordings || []).length
    ? recentRecordings.map(item => `
        <button class="dashboard-list-row recording-row dashboard-search-item"
          data-search="${escapeHtml(item.short_title + " " + (item.owner_name || ""))}"
          onclick="recordingDetail('${item.id}')">
          <span class="play-icon">▶</span>
          <span class="dashboard-list-main">
            <b>${escapeHtml(item.short_title)}</b>
            <small>${escapeHtml(item.owner_name || "등록자 미상")}</small>
          </span>
          <time>${escapeHtml(item.consultation_date || "")}</time>
        </button>`).join("")
    : `<div class="dashboard-empty">등록된 녹취록이 없습니다.</div>`;

  const adminMenu = profile.role === "admin"
    ? `<button class="sidebar-admin" onclick="adminPage()">🛡️ 관리자 메뉴 <span>›</span></button>`
    : "";

  app.innerHTML = `
    <div class="dashboard-shell">
      <aside class="dashboard-sidebar">
        <div class="sidebar-branch">
          <div class="aia-mark">AIA</div>
          <div><small>AIA PREMIER PARTNERS</small><strong>더원지점</strong></div>
        </div>
        <nav class="sidebar-nav" aria-label="주요 메뉴">
          <button class="active" onclick="goHome()"><span>⌂</span> 메인화면</button>
          <button onclick="recordingsPage()"><span>◉</span> 녹취록 관리</button>
          <button onclick="resourcesPage()"><span>▰</span> 자료실</button>
          <button onclick="noticesPage()"><span>◀</span> 공지사항</button>\n          <button onclick="contactsPage()"><span>♙</span> 지점원 연락처</button>\n          <button onclick="insuranceContactsPage()"><span>☎</span> 보험사 연락처</button>\n          <button onclick="insuranceManagersPage()"><span>♧</span> 보험사 담당자</button>
          <button onclick="window.open('${scheduleUrl}', '_blank')"><span>▣</span> 일정</button>\n          <button onclick="myProfilePage()"><span>♙</span> 내 정보 수정</button>\n          <button onclick="installApp()"><span>⇩</span> 앱 설치</button>
        </nav>
        ${adminMenu}
        <div class="sidebar-footer">
          <b>THE ONE SPACE</b>
          <small>AIA Premier Partners 더원지점</small>
          <button class="install-button" onclick="installApp()">📲 앱 설치하기</button>
          <button onclick="logout()">로그아웃</button>
        </div>
      </aside>

      <main class="dashboard-main">
        <header class="dashboard-header">
          <div class="dashboard-brand" onclick="goHome()" role="button" tabindex="0">
            THE <b>ONE</b> SPACE
            <small>Connect. Share. Grow. <em>연결하고 · 나누고 · 함께 성장해요</em></small>
          </div>
          <label class="dashboard-search">
            <span>⌕</span>
            <input id="dashboardSearch" type="search" placeholder="메인 화면에서 검색" oninput="filterDashboardItems()">
          </label>
        </header>

        <div class="dashboard-content">
          <section class="dashboard-top-grid">
            <article class="welcome-card">
              <div>
                <h1>${escapeHtml(profile.name)}님, 환영합니다! <span>👋</span></h1>
                <p class="${isBirthdayToday ? "birthday-welcome-message" : ""}">${welcomeMessage}</p>
                <div class="welcome-date"><span>▣ ${dateText}</span><span>◷ ${timeText}</span></div>
              </div>
              <div class="growth-art" aria-hidden="true"><span></span><span></span><span></span><i>★</i></div>
            </article>
            <article class="summary-card pink" onclick="recordingsPage()">
              <span class="summary-icon">🎙</span><p>전체 녹취록</p>
              <strong>${recordingCount || 0}<small>건</small></strong><em>상담 녹취를 확인해 보세요.</em>
            </article>
            <article class="summary-card blue" onclick="resourcesPage()">
              <span class="summary-icon">▰</span><p>자료실 자료</p>
              <strong>${resourceCount || 0}<small>건</small></strong><em>업무 자료를 확인해 보세요.</em>
            </article>
            <article class="summary-card green">
              <span class="summary-icon">♙</span><p>전체 직원 수</p>
              <strong>${employeeCount || 0}<small>명</small></strong><em>승인된 지점원 기준</em>
            </article>
            <article class="summary-card yellow" onclick="noticesPage()">
              <span class="summary-icon">☆</span><p>공지사항</p>
              <strong>${noticeCount || 0}<small>건</small></strong><em>새로운 소식을 확인하세요.</em>
            </article>
          </section>

          <section class="dashboard-middle-grid">
            <article class="dashboard-panel notices-panel">
              <div class="panel-title"><h2>공지사항</h2><button onclick="noticesPage()">전체 보기 ›</button></div>
              <div>${noticeRows}</div>
            </article>
            <article class="dashboard-panel recordings-panel">
              <div class="panel-title"><h2>최근 녹취록</h2><button onclick="recordingsPage()">전체 보기 ›</button></div>
              <div>${recordingRows}</div>
            </article>
            <article class="dashboard-panel quick-panel">
              <div class="panel-title"><h2>바로가기</h2></div>
              <div class="quick-grid">
                <button onclick="newRecordingForm()"><span>🎙</span>녹취록 등록</button>
                <button onclick="newResourceForm()"><span>▰</span>자료실 업로드</button>
                <button onclick="noticesPage()"><span>📢</span>공지사항</button>\n                <button onclick="contactsPage()"><span>☎</span>지점원 연락처</button>\n                <button onclick="insuranceContactsPage()"><span>☏</span>보험사 연락처</button>\n                <button onclick="insuranceManagersPage()"><span>♧</span>보험사 담당자</button>
                <button onclick="window.open('${scheduleUrl}', '_blank')"><span>▣</span>일정 확인</button>
                <button onclick="recordingsPage()"><span>⌕</span>녹취록 찾기</button>
                <button onclick="myProfilePage()"><span>👤</span>내 정보 수정</button>
                ${profile.role === "admin"
                  ? `<button onclick="adminPage()"><span>♙</span>직원 관리</button>`
                  : `<button onclick="resourcesPage()"><span>⌕</span>자료 찾기</button>`}
              </div>
            </article>
          </section>

          <p id="dashboardSearchEmpty" class="dashboard-search-empty" hidden>검색 결과가 없습니다.</p>
        </div>
        <button class="pwa-install-fab" onclick="installApp()" aria-label="THE ONE 앱 설치">
          <span>📲</span> 앱 설치
        </button>
      </main>
    </div>`;

  const popupNotice = (recentNotices || []).find(item => item.is_pinned);
  if (popupNotice) {
    setTimeout(() => showNoticePopup(popupNotice), 180);
  }
}


function noticePopupTodayKey() {
  const now = new Date();
  return now.getFullYear() + "-" +
    String(now.getMonth() + 1).padStart(2, "0") + "-" +
    String(now.getDate()).padStart(2, "0");
}

function showNoticePopup(notice) {
  if (!notice || document.getElementById("noticePopup")) return;
  const hideKey = "notice-popup-hide-" + notice.id;
  const closeKey = "notice-popup-session-" + notice.id;
  if (localStorage.getItem(hideKey) === noticePopupTodayKey()) return;
  if (sessionStorage.getItem(closeKey) === "closed") return;

  document.body.insertAdjacentHTML("beforeend", `
    <div id="noticePopup" class="notice-popup-backdrop">
      <section class="notice-popup" role="dialog" aria-modal="true" aria-labelledby="noticePopupTitle">
        <div class="notice-popup-top">
          <span>📌 IMPORTANT NOTICE</span>
          <button onclick="closeNoticePopup('${notice.id}')" aria-label="닫기">×</button>
        </div>
        <div class="notice-popup-body">
          <div class="notice-popup-icon">📢</div>
          <h2 id="noticePopupTitle">${escapeHtml(notice.title)}</h2>
          <p>${escapeHtml(notice.content || "").replace(/\n/g, "<br>")}</p>
        </div>
        <div class="notice-popup-actions">
          <button class="notice-popup-today" onclick="hideNoticePopupToday('${notice.id}')">오늘 하루 보지 않기</button>
          <button class="btn secondary" onclick="closeNoticePopup('${notice.id}')">닫기</button>
          <button class="btn" onclick="openNoticeFromPopup('${notice.id}')">자세히 보기</button>
        </div>
      </section>
    </div>`);
}

function closeNoticePopup(noticeId) {
  sessionStorage.setItem("notice-popup-session-" + noticeId, "closed");
  document.getElementById("noticePopup")?.remove();
}

function hideNoticePopupToday(noticeId) {
  localStorage.setItem("notice-popup-hide-" + noticeId, noticePopupTodayKey());
  document.getElementById("noticePopup")?.remove();
}

async function openNoticeFromPopup(noticeId) {
  sessionStorage.setItem("notice-popup-session-" + noticeId, "closed");
  document.getElementById("noticePopup")?.remove();
  await noticeDetail(noticeId);
}

function filterDashboardItems() {
  const input = document.getElementById("dashboardSearch");
  if (!input) return;
  const query = input.value.trim().toLowerCase();
  const items = Array.from(document.querySelectorAll(".dashboard-search-item"));
  let visible = 0;
  items.forEach(item => {
    const show = !query || (item.dataset.search || "").toLowerCase().includes(query);
    item.style.display = show ? "" : "none";
    if (show) visible += 1;
  });
  const empty = document.getElementById("dashboardSearchEmpty");
  if (empty) empty.hidden = !query || visible > 0;
}


// =====================================================
// 녹취록 목록
// =====================================================

async function recordingsPage() {
  const profile = await getCurrentProfile();

  if (!profile || profile.status !== "approved") {
    authScreen();
    return;
  }

  const { data: recordings, error } =
    await client
      .from("recordings")
      .select("*")
      .is("deleted_at", null)
      .order("consultation_date", {
        ascending: false
      })
      .order("created_at", {
        ascending: false
      });

  if (error) {
    alert(
      "녹취록을 불러오지 못했습니다.\n" +
      error.message
    );
    return;
  }

  const listHtml =
    recordings && recordings.length
      ? recordings.map(item => `
          <div
            class="card"
            onclick="recordingDetail('${item.id}')"
            style="cursor:pointer;"
          >

            <div class="muted">
              ${escapeHtml(item.consultation_date)}
            </div>

            <h3>
              ${escapeHtml(item.short_title)}
            </h3>

            <p>
              본인: ${escapeHtml(item.owner_name)}
            </p>

            ${
              item.companion_name
                ? `
                  <p>
                    동행자:
                    ${escapeHtml(item.companion_name)}
                  </p>
                `
                : ""
            }

          </div>
        `).join("")
      : `
        <div class="card">
          <p class="muted">
            아직 등록된 녹취록이 없습니다.
          </p>
        </div>
      `;

  app.innerHTML = `
    <div class="wrap">

      <div class="top">

        <div class="brand" onclick="goHome()" role="button" tabindex="0" title="메인으로" style="cursor:pointer;" onkeydown="if(event.key === 'Enter' || event.key === ' '){ event.preventDefault(); goHome(); }">
          THE ONE <b>SPACE</b>
        </div>

        <button
          class="btn secondary"
          onclick="goHome()"
        >
          메인으로
        </button>

      </div>

      <section class="hero">

        <div class="muted">
          RECORDINGS
        </div>

        <h1>녹취록</h1>

        <p>
          상담 녹취와 상담 내용을 확인할 수 있습니다.
        </p>

        <button
          class="btn"
          onclick="newRecordingForm()"
        >
          + 새 녹취록 등록
        </button>

      </section>

      <div class="grid">
        ${listHtml}
      </div>

    </div>
  `;
}


// =====================================================
// 새 녹취록 등록
// =====================================================

async function newRecordingForm() {
  const profile = await getCurrentProfile();

  if (!profile) {
    authScreen();
    return;
  }

  const today =
    new Date().toISOString().slice(0, 10);

  app.innerHTML = `
    <div class="wrap">

      <div class="top">

        <div class="brand" onclick="goHome()" role="button" tabindex="0" title="메인으로" style="cursor:pointer;" onkeydown="if(event.key === 'Enter' || event.key === ' '){ event.preventDefault(); goHome(); }">
          THE ONE <b>SPACE</b>
        </div>

        <button
          class="btn secondary"
          onclick="recordingsPage()"
        >
          목록으로
        </button>

      </div>

      <section class="hero">

        <div class="muted">
          NEW RECORDING
        </div>

        <h1>새 녹취록 등록</h1>

      </section>

      <div
        class="auth"
        style="max-width:700px;"
      >

        <div class="field">
          <label>상담 날짜</label>

          <input
            id="consultationDate"
            type="date"
            value="${today}"
          >
        </div>

        <div class="field">
          <label>간단 상담 내용</label>

          <input
            id="shortTitle"
            type="text"
            placeholder="예: 종신보험 상담"
          >
        </div>

        <div class="field">
          <label>상세 내용</label>

          <textarea
            id="details"
            rows="6"
            style="width:100%;box-sizing:border-box;"
            placeholder="상담 내용을 입력해 주세요."
          ></textarea>
        </div>

        <div class="field">
          <label>본인</label>

          <input
            id="ownerName"
            type="text"
            value="${escapeHtml(profile.name || "")}"
          >
        </div>

        <div class="field">
          <label>동행자 (선택)</label>

          <input
            id="companionName"
            type="text"
            placeholder="동행자가 있을 경우 입력"
          >
        </div>

        <div class="field">
          <label>녹취 파일</label>

          <input
            id="recordingFiles"
            type="file"
            multiple
            accept="audio/*,.m4a,.mp3,.wav,.aac,.ogg"
          >

          <p class="muted">
            여러 파일을 한 번에 선택할 수 있습니다.
          </p>
        </div>

        <button
          id="uploadBtn"
          class="btn"
          onclick="saveRecording()"
        >
          업로드
        </button>

        <div id="msg"></div>

      </div>

    </div>
  `;
}


// =====================================================
// 녹취록 저장
// =====================================================

async function saveRecording() {
  const consultationDate =
    document.getElementById("consultationDate").value;

  const shortTitle =
    document.getElementById("shortTitle").value.trim();

  const details =
    document.getElementById("details").value.trim();

  const ownerName =
    document.getElementById("ownerName").value.trim();

  const companionName =
    document.getElementById("companionName").value.trim();

  const files =
    Array.from(
      document.getElementById("recordingFiles").files
    );

  if (!consultationDate) {
    setMsg("상담 날짜를 선택해 주세요.");
    return;
  }

  if (!shortTitle) {
    setMsg("간단 상담 내용을 입력해 주세요.");
    return;
  }

  if (!ownerName) {
    setMsg("본인을 입력해 주세요.");
    return;
  }

  if (files.length === 0) {
    setMsg("녹취 파일을 한 개 이상 선택해 주세요.");
    return;
  }

  const user = await getCurrentUser();

  if (!user) {
    setMsg("로그인이 필요합니다.");
    return;
  }

  const uploadBtn =
    document.getElementById("uploadBtn");

  uploadBtn.disabled = true;
  uploadBtn.textContent = "업로드 중...";

  const recordingId =
    crypto.randomUUID();

  const uploadedFiles = [];


  // 실제 파일 먼저 업로드
  for (let i = 0; i < files.length; i++) {
    const file = files[i];

    setMsg(
      `파일 업로드 중... ${i + 1} / ${files.length}`
    );

    let extension = "";

    if (file.name.includes(".")) {
      const rawExtension =
        file.name
          .split(".")
          .pop()
          .toLowerCase()
          .replace(/[^a-z0-9]/g, "");

      if (rawExtension) {
        extension = "." + rawExtension;
      }
    }

    const storageFileName =
      `${crypto.randomUUID()}${extension}`;

    const filePath =
      `${user.id}/${recordingId}/${storageFileName}`;

    const {
      data: uploadData,
      error: uploadError
    } =
      await client.storage
        .from("recordings")
        .upload(
          filePath,
          file,
          {
            cacheControl: "3600",
            upsert: false,
            contentType:
              file.type ||
              "application/octet-stream"
          }
        );

    if (uploadError) {
      uploadBtn.disabled = false;
      uploadBtn.textContent = "업로드";

      setMsg(
        "파일 업로드 실패:<br>" +
        escapeHtml(file.name) +
        "<br><br>" +
        escapeHtml(uploadError.message)
      );

      return;
    }

    uploadedFiles.push({
      file_name: file.name,
      file_path: uploadData.path
    });
  }


  // 녹취록 정보 저장
  const { error: recordingError } =
    await client
      .from("recordings")
      .insert({
        id: recordingId,
        consultation_date: consultationDate,
        short_title: shortTitle,
        details: details || null,
        owner_name: ownerName,
        companion_name: companionName || null,
        uploaded_by: user.id
      });

  if (recordingError) {
    uploadBtn.disabled = false;
    uploadBtn.textContent = "업로드";

    setMsg(
      "녹취록 정보 저장 실패:<br>" +
      escapeHtml(recordingError.message)
    );

    return;
  }


  // 파일 정보 저장
  const rows =
    uploadedFiles.map(file => ({
      recording_id: recordingId,
      file_name: file.file_name,
      file_path: file.file_path,
      uploaded_by: user.id
    }));

  const { error: fileError } =
    await client
      .from("recording_files")
      .insert(rows);

  if (fileError) {
    uploadBtn.disabled = false;
    uploadBtn.textContent = "업로드";

    setMsg(
      "파일 정보 저장 실패:<br>" +
      escapeHtml(fileError.message)
    );

    return;
  }

  alert(
    `녹취록 등록 완료!\n${uploadedFiles.length}개 파일이 저장되었습니다.`
  );

  await recordingsPage();
}


// =====================================================
// 녹취록 상세
// =====================================================

async function recordingDetail(recordingId) {
  const user = await getCurrentUser();
  const profile = await getCurrentProfile();

  if (!user || !profile) {
    authScreen();
    return;
  }

  const {
    data: recording,
    error
  } =
    await client
      .from("recordings")
      .select("*")
      .eq("id", recordingId)
      .is("deleted_at", null)
      .single();

  if (error || !recording) {
    alert("녹취록을 불러오지 못했습니다.");
    return;
  }

  const {
    data: files,
    error: filesError
  } =
    await client
      .from("recording_files")
      .select("*")
      .eq("recording_id", recordingId)
      .order("created_at", {
        ascending: true
      });

  if (filesError) {
    alert(
      "파일 목록을 불러오지 못했습니다.\n" +
      filesError.message
    );
    return;
  }

  const canManage =
    profile.role === "admin" ||
    recording.uploaded_by === user.id;

  const manageButtons =
    canManage
      ? `
        <button
          class="btn"
          onclick="editRecordingForm('${recording.id}')"
        >
          수정
        </button>

        <button
          class="btn secondary"
          onclick="deleteRecording('${recording.id}')"
        >
          삭제
        </button>
      `
      : "";

  const filesHtml =
    files && files.length
      ? files.map((file, index) => `
          <div class="card">

            <p>
              <b>
                ${index + 1}.
                ${escapeHtml(file.file_name)}
              </b>
            </p>

            <button
              class="btn"
              onclick="openRecordingFile('${file.file_path}')"
            >
              녹취 듣기
            </button>

          </div>
        `).join("")
      : `
        <div class="card">
          <p class="muted">
            등록된 파일이 없습니다.
          </p>
        </div>
      `;

  app.innerHTML = `
    <div class="wrap">

      <div class="top">

        <div class="brand" onclick="goHome()" role="button" tabindex="0" title="메인으로" style="cursor:pointer;" onkeydown="if(event.key === 'Enter' || event.key === ' '){ event.preventDefault(); goHome(); }">
          THE ONE <b>SPACE</b>
        </div>

        <div>
          ${manageButtons}

          <button
            class="btn secondary"
            onclick="recordingsPage()"
          >
            목록으로
          </button>
        </div>

      </div>

      <section class="hero">

        <div class="muted">
          ${escapeHtml(recording.consultation_date)}
        </div>

        <h1>
          ${escapeHtml(recording.short_title)}
        </h1>

        <p>
          본인:
          ${escapeHtml(recording.owner_name)}
        </p>

        ${
          recording.companion_name
            ? `
              <p>
                동행자:
                ${escapeHtml(recording.companion_name)}
              </p>
            `
            : ""
        }

      </section>

      <div class="card">

        <h3>상세 내용</h3>

        <p style="white-space:pre-wrap;">
          ${
            recording.details
              ? escapeHtml(recording.details)
              : "등록된 상세 내용이 없습니다."
          }
        </p>

      </div>

      <h2 style="margin-top:40px;">
        녹취 파일 (${files ? files.length : 0})
      </h2>

      <div class="grid">
        ${filesHtml}
      </div>

    </div>
  `;
}


// =====================================================
// 녹취록 수정 화면
// =====================================================

async function editRecordingForm(recordingId) {
  const user = await getCurrentUser();
  const profile = await getCurrentProfile();

  if (!user || !profile) {
    authScreen();
    return;
  }

  const {
    data: recording,
    error
  } =
    await client
      .from("recordings")
      .select("*")
      .eq("id", recordingId)
      .single();

  if (error || !recording) {
    alert("녹취록을 불러오지 못했습니다.");
    return;
  }

  const canManage =
    profile.role === "admin" ||
    recording.uploaded_by === user.id;

  if (!canManage) {
    alert("본인이 등록한 녹취록만 수정할 수 있습니다.");
    return;
  }

  app.innerHTML = `
    <div class="wrap">

      <div class="top">

        <div class="brand" onclick="goHome()" role="button" tabindex="0" title="메인으로" style="cursor:pointer;" onkeydown="if(event.key === 'Enter' || event.key === ' '){ event.preventDefault(); goHome(); }">
          THE ONE <b>SPACE</b>
        </div>

        <button
          class="btn secondary"
          onclick="recordingDetail('${recording.id}')"
        >
          취소
        </button>

      </div>

      <section class="hero">
        <div class="muted">EDIT RECORDING</div>
        <h1>녹취록 수정</h1>
      </section>

      <div
        class="auth"
        style="max-width:700px;"
      >

        <div class="field">
          <label>상담 날짜</label>

          <input
            id="editConsultationDate"
            type="date"
            value="${escapeHtml(recording.consultation_date)}"
          >
        </div>

        <div class="field">
          <label>간단 상담 내용</label>

          <input
            id="editShortTitle"
            type="text"
            value="${escapeHtml(recording.short_title)}"
          >
        </div>

        <div class="field">
          <label>상세 내용</label>

          <textarea
            id="editDetails"
            rows="6"
            style="width:100%;box-sizing:border-box;"
          >${escapeHtml(recording.details || "")}</textarea>
        </div>

        <div class="field">
          <label>본인</label>

          <input
            id="editOwnerName"
            type="text"
            value="${escapeHtml(recording.owner_name)}"
          >
        </div>

        <div class="field">
          <label>동행자 (선택)</label>

          <input
            id="editCompanionName"
            type="text"
            value="${escapeHtml(recording.companion_name || "")}"
          >
        </div>

        <p class="muted">
          기존 녹취 파일은 그대로 유지됩니다.
        </p>

        <button
          class="btn"
          onclick="updateRecording('${recording.id}')"
        >
          수정 저장
        </button>

        <div id="msg"></div>

      </div>

    </div>
  `;
}


// =====================================================
// 녹취록 수정 저장
// =====================================================

async function updateRecording(recordingId) {
  const consultationDate =
    document
      .getElementById("editConsultationDate")
      .value;

  const shortTitle =
    document
      .getElementById("editShortTitle")
      .value
      .trim();

  const details =
    document
      .getElementById("editDetails")
      .value
      .trim();

  const ownerName =
    document
      .getElementById("editOwnerName")
      .value
      .trim();

  const companionName =
    document
      .getElementById("editCompanionName")
      .value
      .trim();

  if (!consultationDate) {
    setMsg("상담 날짜를 선택해 주세요.");
    return;
  }

  if (!shortTitle) {
    setMsg("간단 상담 내용을 입력해 주세요.");
    return;
  }

  if (!ownerName) {
    setMsg("본인을 입력해 주세요.");
    return;
  }

  const { error } =
    await client
      .from("recordings")
      .update({
        consultation_date: consultationDate,
        short_title: shortTitle,
        details: details || null,
        owner_name: ownerName,
        companion_name: companionName || null
      })
      .eq("id", recordingId);

  if (error) {
    setMsg(
      "수정 실패: " +
      error.message
    );
    return;
  }

  alert("녹취록이 수정되었습니다.");

  await recordingDetail(recordingId);
}


// =====================================================
// 녹취파일 열기
// =====================================================

async function openRecordingFile(filePath) {
  const { data, error } =
    await client.storage
      .from("recordings")
      .createSignedUrl(
        filePath,
        60 * 10
      );

  if (error || !data?.signedUrl) {
    alert(
      "파일을 열지 못했습니다.\n" +
      (error?.message || "")
    );
    return;
  }

  window.open(
    data.signedUrl,
    "_blank",
    "noopener,noreferrer"
  );
}


// =====================================================
// 녹취록 삭제
// 본인 또는 관리자
// =====================================================

async function deleteRecording(recordingId) {
  if (!confirm("이 녹취록을 휴지통으로 이동하시겠습니까?\n30일 동안 복원할 수 있습니다.")) return;
  const { error } = await client.rpc("move_item_to_trash", { item_type: "recording", item_id: String(recordingId) });
  if (error) return alert("휴지통 이동에 실패했습니다.\n" + error.message);
  alert("녹취록을 휴지통으로 이동했습니다.");
  await recordingsPage();
}


function trashTypeLabel(type) { return type === "recording" ? "녹취록" : type === "resource" ? "자료실" : "공지사항"; }

async function trashPage() {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "admin" || profile.status !== "approved") {
    alert("관리자만 휴지통을 이용할 수 있습니다."); return;
  }
  const [a,b,n] = await Promise.all([
    client.from("recordings").select("id,short_title,owner_name,deleted_at").not("deleted_at","is",null).order("deleted_at",{ascending:false}),
    client.from("resources").select("id,title,uploader_name,deleted_at").not("deleted_at","is",null).order("deleted_at",{ascending:false}),
    client.from("notices").select("id,title,deleted_at").not("deleted_at","is",null).order("deleted_at",{ascending:false})
  ]);
  let items=[]
    .concat((a.data||[]).map(x=>({type:"recording",id:x.id,title:x.short_title,owner:x.owner_name,deleted_at:x.deleted_at})))
    .concat((b.data||[]).map(x=>({type:"resource",id:x.id,title:x.title,owner:x.uploader_name,deleted_at:x.deleted_at})))
    .concat((n.data||[]).map(x=>({type:"notice",id:x.id,title:x.title,owner:"",deleted_at:x.deleted_at})))
    .sort((x,y)=>new Date(y.deleted_at)-new Date(x.deleted_at));

  const expired=items.filter(x=>Date.now()-new Date(x.deleted_at).getTime()>=30*86400000);
  for(const x of expired) await permanentlyDeleteTrashItem(x.type,x.id,true);
  if(expired.length) items=items.filter(x=>!expired.includes(x));

  const cards=items.length?items.map(x=>{
    const deleted=new Date(x.deleted_at);
    const days=Math.max(1,30-Math.floor((Date.now()-deleted.getTime())/86400000));
    return `<article class="card trash-card">
      <div class="trash-card-head"><span>${trashTypeLabel(x.type)}</span><em>남은 기간 ${days}일</em></div>
      <h3>${escapeHtml(x.title||"제목 없음")}</h3>
      ${x.owner?`<p class="muted">등록자: ${escapeHtml(x.owner)}</p>`:""}
      <p class="muted">삭제일: ${deleted.toLocaleString("ko-KR")}</p>
      <div class="trash-actions"><button class="btn" onclick="restoreTrashItem('${x.type}','${x.id}')">복원</button>
      <button class="btn secondary danger" onclick="permanentlyDeleteTrashItem('${x.type}','${x.id}')">영구 삭제</button></div>
    </article>`;
  }).join(""):`<div class="card trash-empty"><span>🗑️</span><h3>휴지통이 비어 있습니다.</h3><p class="muted">삭제한 항목은 30일 동안 보관됩니다.</p></div>`;

  app.innerHTML=`<div class="wrap"><div class="top"><div class="brand" onclick="goHome()" style="cursor:pointer;">THE ONE <b>SPACE</b></div>
    <button class="btn secondary" onclick="goHome()">메인으로</button></div>
    <section class="hero"><div class="muted">TRASH BIN</div><h1>휴지통</h1><p>삭제한 녹취록·자료·공지를 30일 동안 보관합니다.</p></section>
    <div class="trash-grid">${cards}</div></div>`;
}

async function restoreTrashItem(type,id){
  if(!confirm(trashTypeLabel(type)+"을(를) 복원하시겠습니까?"))return;
  const {error}=await client.rpc("restore_trash_item",{item_type:type,item_id:String(id)});
  if(error)return alert("복원하지 못했습니다.\n"+error.message);
  alert("복원되었습니다."); await trashPage();
}

async function permanentlyDeleteTrashItem(type,id,automatic=false){
  if(!automatic&&!confirm("영구 삭제하면 복구할 수 없습니다.\\n정말 삭제하시겠습니까?"))return false;
  if(type==="recording"||type==="resource"){
    const table=type==="recording"?"recording_files":"resource_files";
    const key=type==="recording"?"recording_id":"resource_id";
    const bucket=type==="recording"?"recordings":"resources";
    const {data,error}=await client.from(table).select("file_path").eq(key,id);
    if(error){if(!automatic)alert("첨부 파일 확인 실패\\n"+error.message);return false}
    const paths=(data||[]).map(x=>x.file_path).filter(Boolean);
    if(paths.length){const {error:e}=await client.storage.from(bucket).remove(paths);if(e){if(!automatic)alert("파일 삭제 실패\\n"+e.message);return false}}
  }
  const {error}=await client.rpc("permanently_delete_trash_item",{item_type:type,item_id:String(id)});
  if(error){if(!automatic)alert("영구 삭제 실패\\n"+error.message);return false}
  if(!automatic){alert("영구 삭제되었습니다.");await trashPage()} return true;
}

// =====================================================
// 관리자 페이지
// =====================================================

async function adminPage() {
  const profile = await getCurrentProfile();

  if (
    !profile ||
    profile.role !== "admin" ||
    profile.status !== "approved"
  ) {
    alert("관리자만 이용할 수 있습니다.");
    return;
  }

  const { data: profiles, error } =
    await client
      .from("profiles")
      .select("*")
      .order("name", {
        ascending: true
      });

  if (error) {
    alert(
      "직원 목록을 불러오지 못했습니다.\n" +
      error.message
    );
    return;
  }

  const pending =
    profiles.filter(
      p => p.status === "pending"
    );

  const approved =
    profiles.filter(
      p => p.status === "approved"
    );

  const pendingHtml =
    pending.length
      ? pending.map(p => `
          <div class="card">

            <h3>
              ${escapeHtml(p.name || "이름 없음")}
            </h3>

            <p>
              ${escapeHtml(p.position || "-")}
            </p>

            <p class="muted">
              ${escapeHtml(p.email || "")}
            </p>

            <button
              class="btn"
              onclick="changeUserStatus('${p.id}', 'approved')"
            >
              승인
            </button>

            <button
              class="btn secondary"
              onclick="changeUserStatus('${p.id}', 'rejected')"
            >
              거절
            </button>

          </div>
        `).join("")
      : `
        <p class="muted">
          현재 승인 대기 중인 직원이 없습니다.
        </p>
      `;

  const approvedHtml =
    approved.length
      ? approved.map(p => `
          <div class="card">

            <h3>
              ${escapeHtml(p.name || "이름 없음")}
            </h3>

            <p>
              ${escapeHtml(p.position || "-")}
            </p>

            <p class="muted">
              ${
                p.role === "admin"
                  ? "관리자 · 승인 완료"
                  : "승인 완료"
              }
            </p>

            <p class="muted">
              ${escapeHtml(p.email || "")}
            </p>

            <p class="muted">🎂 생일: ${p.birthday ? escapeHtml(p.birthday) : "미입력"}</p>
            <button class="btn secondary" onclick="editUserBirthday('${p.id}', '${p.birthday || ""}')">생일 입력·수정</button>

          </div>
        `).join("")
      : `
        <p class="muted">
          승인된 직원이 없습니다.
        </p>
      `;

  app.innerHTML = `
    <div class="wrap">

      <div class="top">

        <div class="brand" onclick="goHome()" role="button" tabindex="0" title="메인으로" style="cursor:pointer;" onkeydown="if(event.key === 'Enter' || event.key === ' '){ event.preventDefault(); goHome(); }">
          THE ONE <b>SPACE</b>
        </div>

        <button
          class="btn secondary"
          onclick="goHome()"
        >
          메인으로
        </button>

      </div>

      <section class="hero">

        <div class="muted">ADMIN</div>

        <h1>직원 관리</h1>

        <p>
          가입 신청을 확인하고 승인 또는 거절할 수 있습니다.
        </p>

        <button class="btn secondary" onclick="trashPage()">🗑️ 휴지통 관리</button>

      </section>

      <h2>
        승인 대기 (${pending.length})
      </h2>

      <div class="grid">
        ${pendingHtml}
      </div>

      <h2 style="margin-top:40px;">
        승인된 직원 (${approved.length})
      </h2>

      <div class="grid">
        ${approvedHtml}
      </div>

    </div>
  `;
}


// =====================================================
// 직원 승인 / 거절
// =====================================================


async function editUserBirthday(userId, currentBirthday) {
  const value = prompt("생일을 YYYY-MM-DD 형식으로 입력해 주세요.", currentBirthday || "");
  if (value === null) return;
  const birthday = value.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(birthday) || Number.isNaN(new Date(birthday + "T00:00:00").getTime())) {
    alert("생일을 YYYY-MM-DD 형식으로 정확히 입력해 주세요.");
    return;
  }
  const { error } = await client.from("profiles").update({ birthday }).eq("id", userId);
  if (error) {
    alert("생일을 저장하지 못했습니다.\n" + error.message);
    return;
  }
  alert("생일이 저장되었습니다.");
  await adminPage();
}

async function changeUserStatus(
  userId,
  newStatus
) {
  const text =
    newStatus === "approved"
      ? "승인"
      : "거절";

  if (
    !confirm(
      `이 직원을 ${text}하시겠습니까?`
    )
  ) {
    return;
  }

  const { error } =
    await client
      .from("profiles")
      .update({
        status: newStatus
      })
      .eq("id", userId);

  if (error) {
    alert(
      "처리하지 못했습니다.\n" +
      error.message
    );
    return;
  }

  alert(`${text} 처리되었습니다.`);

  await adminPage();
}


// =====================================================
// 메인으로
// =====================================================

async function goHome() {
  const profile =
    await getCurrentProfile();

  if (!profile) {
    authScreen();
    return;
  }

  home(profile);
}


// =====================================================
// 로그아웃
// =====================================================

async function logout() {
  await client.auth.signOut();
  authScreen();
}


// =====================================================
// 비밀번호 복구 감지
// =====================================================

client.auth.onAuthStateChange(
  (event) => {
    if (event === "PASSWORD_RECOVERY") {
      showResetPasswordScreen();
    }
  }
);


// =====================================================
// 시작
// =====================================================

async function start() {
  const {
    data: { session }
  } =
    await client.auth.getSession();

  if (!session) {
    authScreen();
    return;
  }

  const { data: profile, error } =
    await client
      .from("profiles")
      .select("*")
      .eq("id", session.user.id)
      .single();

  if (
    !error &&
    profile &&
    profile.status === "approved"
  ) {
    home(profile);
    return;
  }

  await client.auth.signOut();
  authScreen();
}


start();
// =====================================================
// 공지사항 권한 확인
// 관리자 또는 비서
// =====================================================

function canManageNotices(profile) {
  return (
    profile &&
    profile.status === "approved" &&
    (
      profile.role === "admin" ||
      profile.position === "비서"
    )
  );
}


// =====================================================
// 공지사항 목록
// =====================================================

async function noticesPage() {
  const profile = await getCurrentProfile();

  if (!profile || profile.status !== "approved") {
    authScreen();
    return;
  }

  const { data: notices, error } =
    await client
      .from("notices")
      .select("*")
      .is("deleted_at", null)
      .order("is_pinned", { ascending: false })
      .order("created_at", { ascending: false });

  if (error) {
    alert(
      "공지사항을 불러오지 못했습니다.\n" +
      error.message
    );
    return;
  }

  const writeButton =
    canManageNotices(profile)
      ? `
        <button
          class="btn"
          onclick="newNoticeForm()"
        >
          + 새 공지 작성
        </button>
      `
      : "";

  const noticeHtml =
    notices && notices.length
      ? notices.map(notice => {

          const date =
            new Date(notice.created_at)
              .toLocaleDateString("ko-KR");

          return `
            <div
              class="card"
              onclick="noticeDetail('${notice.id}')"
              style="cursor:pointer;"
            >

              <div class="muted">
                ${notice.is_pinned ? "📌 중요공지 · " : ""}
                ${escapeHtml(date)}
              </div>

              <h3>
                ${escapeHtml(notice.title)}
              </h3>

              <p>
                ${
                  escapeHtml(notice.content)
                    .replace(/\n/g, " ")
                    .slice(0, 80)
                }${
                  notice.content.length > 80
                    ? "..."
                    : ""
                }
              </p>

            </div>
          `;
        }).join("")
      : `
        <div class="card">
          <p class="muted">
            등록된 공지사항이 없습니다.
          </p>
        </div>
      `;

  app.innerHTML = `
    <div class="wrap">

      <div class="top">

        <div class="brand" onclick="goHome()" role="button" tabindex="0" title="메인으로" style="cursor:pointer;" onkeydown="if(event.key === 'Enter' || event.key === ' '){ event.preventDefault(); goHome(); }">
          THE ONE <b>SPACE</b>
        </div>

        <button
          class="btn secondary"
          onclick="goHome()"
        >
          메인으로
        </button>

      </div>


      <section class="hero">

        <div class="muted">
          NOTICE
        </div>

        <h1>공지사항</h1>

        <p>
          더원지점 공지사항을 확인합니다.
        </p>

        ${writeButton}

      </section>


      <div class="grid">
        ${noticeHtml}
      </div>

    </div>
  `;
}


// =====================================================
// 새 공지 작성
// =====================================================

async function newNoticeForm() {
  const profile = await getCurrentProfile();

  if (!canManageNotices(profile)) {
    alert("공지 작성 권한이 없습니다.");
    return;
  }

  app.innerHTML = `
    <div class="wrap">

      <div class="top">

        <div class="brand" onclick="goHome()" role="button" tabindex="0" title="메인으로" style="cursor:pointer;" onkeydown="if(event.key === 'Enter' || event.key === ' '){ event.preventDefault(); goHome(); }">
          THE ONE <b>SPACE</b>
        </div>

        <button
          class="btn secondary"
          onclick="noticesPage()"
        >
          목록으로
        </button>

      </div>


      <section class="hero">

        <div class="muted">
          NEW NOTICE
        </div>

        <h1>새 공지 작성</h1>

      </section>


      <div
        class="auth"
        style="max-width:700px;"
      >

        <div class="field">

          <label>제목</label>

          <input
            id="noticeTitle"
            type="text"
            placeholder="공지 제목을 입력해 주세요."
          >

        </div>


        <div class="field">

          <label>내용</label>

          <textarea
            id="noticeContent"
            rows="10"
            style="width:100%;box-sizing:border-box;"
            placeholder="공지 내용을 입력해 주세요."
          ></textarea>

        </div>


        <div
          class="field"
          style="display:flex;align-items:center;gap:10px;"
        >

          <input
            id="noticePinned"
            type="checkbox"
            style="width:auto;"
          >

          <label
            for="noticePinned"
            style="margin:0;"
          >
            📌 중요공지로 상단 고정
          </label>

        </div>


        <button
          id="noticeSaveBtn"
          class="btn"
          onclick="saveNotice()"
        >
          공지 등록
        </button>

        <div id="msg"></div>

      </div>

    </div>
  `;
}


// =====================================================
// 공지 저장
// =====================================================

async function saveNotice() {
  const title =
    document
      .getElementById("noticeTitle")
      .value
      .trim();

  const content =
    document
      .getElementById("noticeContent")
      .value
      .trim();

  const isPinned =
    document
      .getElementById("noticePinned")
      .checked;

  if (!title) {
    setMsg("공지 제목을 입력해 주세요.");
    return;
  }

  if (!content) {
    setMsg("공지 내용을 입력해 주세요.");
    return;
  }

  const user = await getCurrentUser();
  const profile = await getCurrentProfile();

  if (!user || !canManageNotices(profile)) {
    setMsg("공지 작성 권한이 없습니다.");
    return;
  }

  const button =
    document.getElementById("noticeSaveBtn");

  button.disabled = true;
  button.textContent = "등록 중...";

  const { error } =
    await client
      .from("notices")
      .insert({
        title: title,
        content: content,
        is_pinned: isPinned,
        created_by: user.id
      });

  if (error) {
    button.disabled = false;
    button.textContent = "공지 등록";

    setMsg(
      "공지 등록 실패: " +
      error.message
    );
    return;
  }

  alert("공지사항이 등록되었습니다.");

  await noticesPage();
}


// =====================================================
// 공지 상세
// =====================================================

async function noticeDetail(noticeId) {
  const profile = await getCurrentProfile();

  if (!profile) {
    authScreen();
    return;
  }

  const { data: notice, error } =
    await client
      .from("notices")
      .select("*")
      .eq("id", noticeId)
      .is("deleted_at", null)
      .single();

  if (error || !notice) {
    alert("공지사항을 불러오지 못했습니다.");
    await noticesPage();
    return;
  }

  const manageButtons =
    canManageNotices(profile)
      ? `
        <button
          class="btn"
          onclick="editNoticeForm('${notice.id}')"
        >
          수정
        </button>

        <button
          class="btn secondary"
          onclick="deleteNotice('${notice.id}')"
        >
          삭제
        </button>
      `
      : "";

  const date =
    new Date(notice.created_at)
      .toLocaleString("ko-KR");

  app.innerHTML = `
    <div class="wrap">

      <div class="top">

        <div class="brand" onclick="goHome()" role="button" tabindex="0" title="메인으로" style="cursor:pointer;" onkeydown="if(event.key === 'Enter' || event.key === ' '){ event.preventDefault(); goHome(); }">
          THE ONE <b>SPACE</b>
        </div>

        <div>

          ${manageButtons}

          <button
            class="btn secondary"
            onclick="noticesPage()"
          >
            목록으로
          </button>

        </div>

      </div>


      <section class="hero">

        <div class="muted">
          ${
            notice.is_pinned
              ? "📌 중요공지 · "
              : ""
          }
          ${escapeHtml(date)}
        </div>

        <h1>
          ${escapeHtml(notice.title)}
        </h1>

      </section>


      <div class="card">

        <p style="white-space:pre-wrap;line-height:1.8;">
${escapeHtml(notice.content)}
        </p>

      </div>

    </div>
  `;
}


// =====================================================
// 공지 수정 화면
// =====================================================

async function editNoticeForm(noticeId) {
  const profile = await getCurrentProfile();

  if (!canManageNotices(profile)) {
    alert("공지 수정 권한이 없습니다.");
    return;
  }

  const { data: notice, error } =
    await client
      .from("notices")
      .select("*")
      .eq("id", noticeId)
      .single();

  if (error || !notice) {
    alert("공지사항을 불러오지 못했습니다.");
    return;
  }

  app.innerHTML = `
    <div class="wrap">

      <div class="top">

        <div class="brand" onclick="goHome()" role="button" tabindex="0" title="메인으로" style="cursor:pointer;" onkeydown="if(event.key === 'Enter' || event.key === ' '){ event.preventDefault(); goHome(); }">
          THE ONE <b>SPACE</b>
        </div>

        <button
          class="btn secondary"
          onclick="noticeDetail('${notice.id}')"
        >
          취소
        </button>

      </div>


      <section class="hero">

        <div class="muted">
          EDIT NOTICE
        </div>

        <h1>공지 수정</h1>

      </section>


      <div
        class="auth"
        style="max-width:700px;"
      >

        <div class="field">

          <label>제목</label>

          <input
            id="editNoticeTitle"
            type="text"
            value="${escapeHtml(notice.title)}"
          >

        </div>


        <div class="field">

          <label>내용</label>

          <textarea
            id="editNoticeContent"
            rows="10"
            style="width:100%;box-sizing:border-box;"
          >${escapeHtml(notice.content)}</textarea>

        </div>


        <div
          class="field"
          style="display:flex;align-items:center;gap:10px;"
        >

          <input
            id="editNoticePinned"
            type="checkbox"
            style="width:auto;"
            ${notice.is_pinned ? "checked" : ""}
          >

          <label
            for="editNoticePinned"
            style="margin:0;"
          >
            📌 중요공지로 상단 고정
          </label>

        </div>


        <button
          class="btn"
          onclick="updateNotice('${notice.id}')"
        >
          수정 저장
        </button>

        <div id="msg"></div>

      </div>

    </div>
  `;
}


// =====================================================
// 공지 수정 저장
// =====================================================

async function updateNotice(noticeId) {
  const title =
    document
      .getElementById("editNoticeTitle")
      .value
      .trim();

  const content =
    document
      .getElementById("editNoticeContent")
      .value
      .trim();

  const isPinned =
    document
      .getElementById("editNoticePinned")
      .checked;

  if (!title) {
    setMsg("공지 제목을 입력해 주세요.");
    return;
  }

  if (!content) {
    setMsg("공지 내용을 입력해 주세요.");
    return;
  }

  const profile = await getCurrentProfile();

  if (!canManageNotices(profile)) {
    setMsg("공지 수정 권한이 없습니다.");
    return;
  }

  const { error } =
    await client
      .from("notices")
      .update({
        title: title,
        content: content,
        is_pinned: isPinned,
        updated_at: new Date().toISOString()
      })
      .eq("id", noticeId);

  if (error) {
    setMsg(
      "공지 수정 실패: " +
      error.message
    );
    return;
  }

  alert("공지사항이 수정되었습니다.");

  await noticeDetail(noticeId);
}


// =====================================================
// 공지 삭제
// =====================================================

async function deleteNotice(noticeId) {
  if (!confirm("이 공지사항을 휴지통으로 이동하시겠습니까?\n30일 동안 복원할 수 있습니다.")) return;
  const { error } = await client.rpc("move_item_to_trash", { item_type: "notice", item_id: String(noticeId) });
  if (error) return alert("휴지통 이동에 실패했습니다.\n" + error.message);
  document.getElementById("noticePopup")?.remove();
  alert("공지사항을 휴지통으로 이동했습니다.");
  await noticesPage();
}

const INSURANCE_CONTACTS = [
  {
    "type": "생명보험",
    "name": "삼성생명",
    "claimFax": "고객센터 요청",
    "consentFax": "1599-9555",
    "monitoring": "1588-3115",
    "callCenter": "1588-3114"
  },
  {
    "type": "생명보험",
    "name": "한화생명",
    "claimFax": "고객센터 요청",
    "consentFax": "0503-7315-6363",
    "monitoring": "1800-6633",
    "callCenter": "1588-6363"
  },
  {
    "type": "생명보험",
    "name": "교보생명",
    "claimFax": "고객센터 요청",
    "consentFax": "0502-303-5455",
    "monitoring": "1588-1636",
    "callCenter": "1588-1001"
  },
  {
    "type": "생명보험",
    "name": "신한라이프",
    "claimFax": "고객센터 요청",
    "consentFax": "02-2200-2999",
    "monitoring": "1522-2285",
    "callCenter": "1588-5580"
  },
  {
    "type": "생명보험",
    "name": "NH농협생명",
    "claimFax": "02-6971-6040",
    "consentFax": "전산등록만 가능",
    "monitoring": "1544-4422",
    "callCenter": "1544-4000"
  },
  {
    "type": "생명보험",
    "name": "메트라이프",
    "claimFax": "고객센터 요청",
    "consentFax": "0502-370-0201",
    "monitoring": "1588-9609",
    "callCenter": "1588-9600"
  },
  {
    "type": "생명보험",
    "name": "DB생명",
    "claimFax": "0505-129-3134",
    "consentFax": "0505-129-4643",
    "monitoring": "02-6470-7663",
    "callCenter": "1588-3131"
  },
  {
    "type": "생명보험",
    "name": "동양생명",
    "claimFax": "02-3289-4517",
    "consentFax": "02-3289-4500",
    "monitoring": "080-899-1004",
    "callCenter": "1577-1004"
  },
  {
    "type": "생명보험",
    "name": "흥국생명",
    "claimFax": "고객센터 요청",
    "consentFax": "0508-101-9000",
    "monitoring": "1877-7006",
    "callCenter": "1588-2288"
  },
  {
    "type": "생명보험",
    "name": "처브라이프",
    "claimFax": "02-3480-7801",
    "consentFax": "02-3480-7813",
    "monitoring": "1599-4600",
    "callCenter": "1599-4600"
  },
  {
    "type": "생명보험",
    "name": "미래에셋생명",
    "claimFax": "고객센터 요청",
    "consentFax": "02-6210-7914",
    "monitoring": "1588-0220",
    "callCenter": "1588-0220"
  },
  {
    "type": "생명보험",
    "name": "하나생명",
    "claimFax": "고객센터 요청",
    "consentFax": "02-3709-8601",
    "monitoring": "1577-1112",
    "callCenter": "1577-1112"
  },
  {
    "type": "생명보험",
    "name": "ABL생명",
    "claimFax": "02-3299-5544",
    "consentFax": "전산등록만 가능",
    "monitoring": "1566-1002",
    "callCenter": "1588-6500"
  },
  {
    "type": "생명보험",
    "name": "KB라이프",
    "claimFax": "고객센터 요청",
    "consentFax": "전산등록만 가능",
    "monitoring": "1566-2730",
    "callCenter": "1588-3374"
  },
  {
    "type": "생명보험",
    "name": "AIA생명",
    "claimFax": "02-2021-4540",
    "consentFax": "02-2021-4527",
    "monitoring": "1588-2513",
    "callCenter": "1588-9898"
  },
  {
    "type": "생명보험",
    "name": "KDB생명",
    "claimFax": "고객센터 요청",
    "consentFax": "02-2669-7999",
    "monitoring": "1588-4040",
    "callCenter": "1588-4040"
  },
  {
    "type": "생명보험",
    "name": "iM라이프",
    "claimFax": "0505-083-5420",
    "consentFax": "0503-047-7000",
    "monitoring": "1588-4770",
    "callCenter": "1588-4770"
  },
  {
    "type": "생명보험",
    "name": "라이나생명",
    "claimFax": "02-6944-1200",
    "consentFax": "02-6944-1224",
    "monitoring": "1588-2442",
    "callCenter": "1588-0058"
  },
  {
    "type": "손해보험",
    "name": "삼성화재",
    "claimFax": "0505-162-0872",
    "consentFax": "0505-166-1003",
    "monitoring": "1566-0553",
    "callCenter": "1588-5114"
  },
  {
    "type": "손해보험",
    "name": "현대해상",
    "claimFax": "0507-774-6060",
    "consentFax": "0507-774-6411",
    "monitoring": "1577-3223",
    "callCenter": "1588-5656"
  },
  {
    "type": "손해보험",
    "name": "KB손해보험",
    "claimFax": "0505-136-6500",
    "consentFax": "0505-136-4948",
    "monitoring": "1544-0019",
    "callCenter": "1544-0114"
  },
  {
    "type": "손해보험",
    "name": "DB손해보험",
    "claimFax": "0505-181-4862",
    "consentFax": "0505-180-7028",
    "monitoring": "1566-0757",
    "callCenter": "1588-0100"
  },
  {
    "type": "손해보험",
    "name": "메리츠화재",
    "claimFax": "0505-021-3400",
    "consentFax": "0505-048-1000",
    "monitoring": "1577-7711",
    "callCenter": "1566-7711"
  },
  {
    "type": "손해보험",
    "name": "한화손해보험",
    "claimFax": "0502-779-1004",
    "consentFax": "0502-605-1502",
    "monitoring": "1670-1882",
    "callCenter": "1566-8000"
  },
  {
    "type": "손해보험",
    "name": "롯데손해보험",
    "claimFax": "0507-333-9999",
    "consentFax": "0507-333-0507",
    "monitoring": "1600-5182",
    "callCenter": "1588-3344"
  },
  {
    "type": "손해보험",
    "name": "흥국화재",
    "claimFax": "0504-800-0700",
    "consentFax": "0504-800-0043",
    "monitoring": "1688-6997",
    "callCenter": "1688-1688"
  },
  {
    "type": "손해보험",
    "name": "NH농협손해보험",
    "claimFax": "0505-060-7000",
    "consentFax": "0505-060-5008",
    "monitoring": "1644-9600",
    "callCenter": "1644-9000"
  },
  {
    "type": "손해보험",
    "name": "하나손해보험",
    "claimFax": "0505-170-0765",
    "consentFax": "02-6355-2500",
    "monitoring": "02-6299-6821",
    "callCenter": "1566-3000"
  },
  {
    "type": "손해보험",
    "name": "AIG손해보험",
    "claimFax": "02-2011-4607",
    "consentFax": "1566-1881",
    "monitoring": "1600-4600",
    "callCenter": "1544-2792"
  }
];


async function insuranceManagersPage() {
  const profile = await getCurrentProfile();
  if (!profile || profile.status !== "approved") { authScreen(); return; }

  const { data, error } = await client
    .from("insurance_manager_contacts")
    .select("insurance_type, insurer_name, contact_role, person_name, phone, note, sort_order")
    .order("sort_order", { ascending: true });

  if (error) {
    alert("보험사 담당자 연락처를 불러오지 못했습니다.\n" + error.message);
    return;
  }

  const grouped = [];
  (data || []).forEach(row => {
    let group = grouped.find(item =>
      item.type === row.insurance_type && item.name === row.insurer_name
    );
    if (!group) {
      group = { type: row.insurance_type, name: row.insurer_name, contacts: [] };
      grouped.push(group);
    }
    group.contacts.push(row);
  });

  const cards = grouped.map(item => {
    const searchText = [item.type, item.name]
      .concat(item.contacts.flatMap(row => [row.contact_role, row.person_name, row.phone || "", row.note || ""]))
      .join(" ").toLowerCase();
    const rows = item.contacts.map(row => `
      <div class="insurer-contact-row manager-contact-row">
        <span>${escapeHtml(row.contact_role)}</span>
        <b>${escapeHtml(row.person_name)}</b>
        ${row.phone ? `<a class="insurer-call-btn manager-call-link" href="tel:${row.phone.replace(/[^\d+]/g, "")}">${escapeHtml(row.phone)} · 전화</a>` : ""}
        ${row.note ? `<small>${escapeHtml(row.note)}</small>` : ""}
      </div>`
    ).join("");
    return `
      <article class="card insurer-card insurer-manager-card insurer-manager-search-item"
        data-type="${item.type}" data-search="${escapeHtml(searchText)}">
        <div class="insurer-card-head">
          <span class="insurer-type">${item.type}</span>
          <h3>${escapeHtml(item.name)}</h3>
        </div>
        <div class="insurer-contact-list">${rows}</div>
      </article>`;
  }).join("");

  app.innerHTML = `
    <div class="wrap">
      <div class="top">
        <div class="brand" onclick="goHome()" role="button" tabindex="0" title="메인으로" style="cursor:pointer;">THE ONE <b>SPACE</b></div>
        <button class="btn secondary" onclick="goHome()">메인으로</button>
      </div>
      <section class="hero">
        <div class="muted">INSURANCE MANAGERS</div>
        <h1>보험사 담당자 연락처</h1>
        <p>보험사별 지점장·교육매니저·설계매니저에게 바로 전화할 수 있습니다.</p>
      </section>
      <div class="toolbar insurer-toolbar manager-toolbar">
        <input id="managerSearch" type="search" placeholder="보험사, 담당자, 전화번호 검색" oninput="filterInsuranceManagers()">
        <div class="resource-category-tabs">
          <button class="resource-category-btn active" data-type="" onclick="selectInsuranceManagerType('',this)">전체</button>
          <button class="resource-category-btn" data-type="생명보험" onclick="selectInsuranceManagerType('생명보험',this)">생명보험</button>
          <button class="resource-category-btn" data-type="손해보험" onclick="selectInsuranceManagerType('손해보험',this)">손해보험</button>
        </div>
      </div>
      <div class="insurer-grid">${cards || '<p class="card contact-empty">등록된 담당자 연락처가 없습니다.</p>'}</div>
      <p id="managerEmpty" class="card contact-empty" hidden>검색 결과가 없습니다.</p>
      <p class="directory-source">※ 로그인 승인된 지점 직원만 열람 가능 · 2026.08.21 기준</p>
    </div>`;
}

function selectInsuranceManagerType(type, button) {
  document.querySelectorAll(".manager-toolbar .resource-category-btn").forEach(item => {
    item.classList.toggle("active", item === button);
  });
  filterInsuranceManagers();
}

function filterInsuranceManagers() {
  const search = document.getElementById("managerSearch");
  const query = search ? search.value.trim().toLowerCase() : "";
  const active = document.querySelector(".manager-toolbar .resource-category-btn.active");
  const type = active ? active.dataset.type : "";
  const items = Array.from(document.querySelectorAll(".insurer-manager-search-item"));
  let visible = 0;
  items.forEach(item => {
    const show = (!query || item.dataset.search.includes(query)) && (!type || item.dataset.type === type);
    item.style.display = show ? "" : "none";
    if (show) visible += 1;
  });
  const empty = document.getElementById("managerEmpty");
  if (empty) empty.hidden = visible > 0;
}

async function insuranceContactsPage() {
  const profile = await getCurrentProfile();
  if (!profile || profile.status !== "approved") {
    authScreen();
    return;
  }

  const cards = INSURANCE_CONTACTS.map((item, index) => `
    <article class="card insurer-card insurer-search-item"
      data-type="${item.type}"
      data-search="${escapeHtml([item.name,item.claimFax,item.consentFax,item.monitoring,item.callCenter].join(" ").toLowerCase())}">
      <div class="insurer-card-head">
        <span class="insurer-type">${item.type}</span>
        <h3>${escapeHtml(item.name)}</h3>
      </div>
      <div class="insurer-contact-list">
        ${insuranceContactRow("대표 콜센터", item.callCenter, true)}
        ${insuranceContactRow("인콜 모니터링", item.monitoring, true)}
        ${insuranceContactRow("보험금청구 Fax", item.claimFax, false)}
        ${insuranceContactRow("설계동의 Fax", item.consentFax, false)}
      </div>
    </article>`).join("");

  app.innerHTML = `
    <div class="wrap">
      <div class="top">
        <div class="brand" onclick="goHome()" role="button" tabindex="0" title="메인으로" style="cursor:pointer;">
          THE ONE <b>SPACE</b>
        </div>
        <button class="btn secondary" onclick="goHome()">메인으로</button>
      </div>
      <section class="hero">
        <div class="muted">INSURANCE DIRECTORY</div>
        <h1>보험사별 연락처</h1>
        <p>생명보험·손해보험 콜센터와 업무별 번호를 확인합니다.</p>
      </section>
      <div class="toolbar insurer-toolbar">
        <input id="insurerSearch" type="search" placeholder="보험사 또는 번호 검색" oninput="filterInsuranceContacts()">
        <div class="resource-category-tabs">
          <button class="resource-category-btn active" data-type="" onclick="selectInsuranceType('',this)">전체</button>
          <button class="resource-category-btn" data-type="생명보험" onclick="selectInsuranceType('생명보험',this)">생명보험</button>
          <button class="resource-category-btn" data-type="손해보험" onclick="selectInsuranceType('손해보험',this)">손해보험</button>
        </div>
      </div>
      <div class="insurer-grid">${cards}</div>
      <p id="insurerEmpty" class="card contact-empty" hidden>검색 결과가 없습니다.</p>
      <p class="directory-source">※ 제공된 「생보,손보 콜센터」 자료 기준 · 2026.04</p>
    </div>`;
}

function insuranceContactRow(label, value, callable) {
  const isNumber = /^[0-9-]+$/.test(String(value));
  const action = callable && isNumber
    ? `<button class="insurer-call-btn" onclick="callInsuranceNumber('${value}')">전화</button>`
    : isNumber
      ? `<button class="insurer-copy-btn" onclick="copyInsuranceNumber('${value}',this)">복사</button>`
      : "";
  return `
    <div class="insurer-contact-row">
      <span>${label}</span>
      <b>${escapeHtml(value)}</b>
      ${action}
    </div>`;
}

function selectInsuranceType(type, button) {
  document.querySelectorAll(".insurer-toolbar .resource-category-btn").forEach(item => {
    item.classList.toggle("active", item === button);
  });
  filterInsuranceContacts();
}

function filterInsuranceContacts() {
  const query = document.getElementById("insurerSearch").value.trim().toLowerCase();
  const active = document.querySelector(".insurer-toolbar .resource-category-btn.active");
  const type = active ? active.dataset.type : "";
  const items = Array.from(document.querySelectorAll(".insurer-search-item"));
  let visible = 0;
  items.forEach(item => {
    const show = (!query || item.dataset.search.includes(query)) && (!type || item.dataset.type === type);
    item.style.display = show ? "" : "none";
    if (show) visible += 1;
  });
  document.getElementById("insurerEmpty").hidden = visible > 0;
}

function callInsuranceNumber(number) {
  window.location.href = "tel:" + String(number).replace(/[^\d+]/g, "");
}

async function copyInsuranceNumber(number, button) {
  try {
    await navigator.clipboard.writeText(number);
    const original = button.textContent;
    button.textContent = "복사됨";
    setTimeout(() => button.textContent = original, 1200);
  } catch {
    prompt("번호를 복사해 주세요.", number);
  }
}

let contactDirectoryCache = [];

function canManageContacts(profile) {
  return (
    profile &&
    profile.status === "approved" &&
    (profile.role === "admin" || profile.position === "비서")
  );
}

function contactPositionRank(position) {
  const ranks = { "지점장": 1, "이사": 2, "팀장": 3, "MP": 4, "비서": 5 };
  return ranks[position] || 99;
}

async function contactsPage() {
  const profile = await getCurrentProfile();
  if (!profile || profile.status !== "approved") {
    authScreen();
    return;
  }

  const { data: contacts, error } = await client.from("contacts").select("*");
  if (error) {
    alert("연락처를 불러오지 못했습니다.\n" + error.message);
    return;
  }

  contactDirectoryCache = (contacts || []).sort((a, b) =>
    contactPositionRank(a.position) - contactPositionRank(b.position) ||
    String(a.name).localeCompare(String(b.name), "ko")
  );

  const canManage = canManageContacts(profile);
  const cards = contactDirectoryCache.length
    ? contactDirectoryCache.map(item => `
        <article class="card contact-card contact-search-item"
          data-search="${escapeHtml(item.name + " " + item.position + " " + item.phone + " " + (item.memo || ""))}"
          onclick="showContactActions('${item.id}')">
          <div class="contact-avatar">${escapeHtml(item.name.slice(0, 1))}</div>
          <div class="contact-info">
            <span class="contact-position">${escapeHtml(item.position)}</span>
            <h3>${escapeHtml(item.name)}</h3>
            <p class="contact-phone">📞 ${escapeHtml(item.phone)}</p>
            ${item.memo ? `<p class="contact-memo">${escapeHtml(item.memo)}</p>` : ""}
          </div>
          ${canManage ? `
            <div class="contact-manage">
              <button class="btn secondary" onclick="event.stopPropagation();editContactForm('${item.id}')">수정</button>
              <button class="btn secondary" onclick="event.stopPropagation();deleteContact('${item.id}')">삭제</button>
            </div>` : ""}
        </article>`).join("")
    : `<div class="card contact-empty"><p class="muted">등록된 지점원 연락처가 없습니다.</p></div>`;

  app.innerHTML = `
    <div class="wrap">
      <div class="top">
        <div class="brand" onclick="goHome()" role="button" tabindex="0" title="메인으로"
          style="cursor:pointer;" onkeydown="if(event.key === 'Enter' || event.key === ' '){event.preventDefault();goHome();}">
          THE ONE <b>SPACE</b>
        </div>
        <button class="btn secondary" onclick="goHome()">메인으로</button>
      </div>

      <section class="hero">
        <div class="muted">CONTACT DIRECTORY</div>
        <h1>지점원 연락처</h1>
        <p>지점원 연락처를 검색하고 바로 전화할 수 있습니다.</p>
        ${canManage ? `<button class="btn" onclick="newContactForm()">+ 연락처 등록</button>` : ""}
      </section>

      <div class="toolbar">
        <input id="contactSearch" type="search" placeholder="이름, 직급, 전화번호 검색"
          oninput="filterContacts()">
      </div>

      <div id="contactGrid" class="contact-grid">${cards}</div>
      <p id="contactSearchEmpty" class="card contact-empty" hidden>검색 결과가 없습니다.</p>
    </div>`;
}

function filterContacts() {
  const query = document.getElementById("contactSearch").value.trim().toLowerCase();
  const items = Array.from(document.querySelectorAll(".contact-search-item"));
  let visible = 0;
  items.forEach(item => {
    const show = !query || (item.dataset.search || "").toLowerCase().includes(query);
    item.style.display = show ? "" : "none";
    if (show) visible += 1;
  });
  const empty = document.getElementById("contactSearchEmpty");
  if (empty) empty.hidden = visible > 0;
}

function showContactActions(contactId) {
  const contact = contactDirectoryCache.find(item => item.id === contactId);
  if (!contact) return;

  closeContactActions();
  document.body.insertAdjacentHTML("beforeend", `
    <div id="contactActionModal" class="contact-modal-backdrop" onclick="closeContactActions()">
      <div class="contact-modal" onclick="event.stopPropagation()">
        <div class="contact-avatar large">${escapeHtml(contact.name.slice(0, 1))}</div>
        <span class="contact-position">${escapeHtml(contact.position)}</span>
        <h2>${escapeHtml(contact.name)}</h2>
        <p>${escapeHtml(contact.phone)}</p>
        <div class="contact-action-buttons">
          <button class="btn" onclick="callContact('${contact.id}')">📞 전화하기</button>
          <button class="contact-cancel" onclick="closeContactActions()">취소</button>
        </div>
      </div>
    </div>`);
}

function closeContactActions() {
  document.getElementById("contactActionModal")?.remove();
}

function callContact(contactId) {
  const contact = contactDirectoryCache.find(item => item.id === contactId);
  if (!contact) return;
  const phone = String(contact.phone).replace(/[^\d+]/g, "");
  window.location.href = "tel:" + phone;
}

async function newContactForm() {
  const profile = await getCurrentProfile();
  if (!canManageContacts(profile)) return alert("관리자 또는 비서만 연락처를 등록할 수 있습니다.");

  app.innerHTML = `
    <div class="wrap">
      <div class="top">
        <div class="brand" onclick="goHome()" role="button" tabindex="0" style="cursor:pointer;">THE ONE <b>SPACE</b></div>
        <button class="btn secondary" onclick="contactsPage()">목록으로</button>
      </div>
      <section class="hero"><div class="muted">NEW CONTACT</div><h1>지점원 연락처 등록</h1></section>
      <div class="auth" style="max-width:700px;">
        <div class="field"><label>이름</label><input id="contactName" type="text" placeholder="이름을 입력해 주세요."></div>
        <div class="field"><label>직급</label><select id="contactPosition">
          <option value="지점장">지점장</option><option value="이사">이사</option>
          <option value="팀장">팀장</option><option value="MP">MP</option><option value="비서">비서</option>
        </select></div>
        <div class="field"><label>전화번호</label><input id="contactPhone" type="tel" placeholder="010-0000-0000"></div>
        <div class="field"><label>메모 (선택)</label><input id="contactMemo" type="text" placeholder="팀명이나 담당업무 등을 입력해 주세요."></div>
        <button class="btn" onclick="createContact()">등록</button>
        <div id="msg"></div>
      </div>
    </div>`;
}

async function createContact() {
  const name = document.getElementById("contactName").value.trim();
  const position = document.getElementById("contactPosition").value;
  const phone = document.getElementById("contactPhone").value.trim();
  const memo = document.getElementById("contactMemo").value.trim();
  if (!name) return setMsg("이름을 입력해 주세요.");
  if (!phone) return setMsg("전화번호를 입력해 주세요.");
  const user = await getCurrentUser();
  if (!user) return setMsg("로그인이 필요합니다.");

  const { error } = await client.from("contacts").insert({
    name, position, phone, memo: memo || null, created_by: user.id
  });
  if (error) return setMsg("연락처 등록 실패: " + escapeHtml(error.message));
  alert("연락처가 등록되었습니다.");
  await contactsPage();
}

async function editContactForm(contactId) {
  const profile = await getCurrentProfile();
  if (!canManageContacts(profile)) return alert("연락처 수정 권한이 없습니다.");
  const { data: contact, error } = await client.from("contacts").select("*").eq("id", contactId).single();
  if (error || !contact) return alert("연락처를 불러오지 못했습니다.");

  app.innerHTML = `
    <div class="wrap">
      <div class="top">
        <div class="brand" onclick="goHome()" role="button" tabindex="0" style="cursor:pointer;">THE ONE <b>SPACE</b></div>
        <button class="btn secondary" onclick="contactsPage()">취소</button>
      </div>
      <section class="hero"><div class="muted">EDIT CONTACT</div><h1>지점원 연락처 수정</h1></section>
      <div class="auth" style="max-width:700px;">
        <div class="field"><label>이름</label><input id="editContactName" type="text" value="${escapeHtml(contact.name)}"></div>
        <div class="field"><label>직급</label><select id="editContactPosition">
          ${["지점장","이사","팀장","MP","비서"].map(position =>
            `<option value="${position}" ${contact.position === position ? "selected" : ""}>${position}</option>`
          ).join("")}
        </select></div>
        <div class="field"><label>전화번호</label><input id="editContactPhone" type="tel" value="${escapeHtml(contact.phone)}"></div>
        <div class="field"><label>메모 (선택)</label><input id="editContactMemo" type="text" value="${escapeHtml(contact.memo || "")}"></div>
        <button class="btn" onclick="updateContact('${contact.id}')">수정 저장</button>
        <div id="msg"></div>
      </div>
    </div>`;
}

async function updateContact(contactId) {
  const name = document.getElementById("editContactName").value.trim();
  const phone = document.getElementById("editContactPhone").value.trim();
  if (!name) return setMsg("이름을 입력해 주세요.");
  if (!phone) return setMsg("전화번호를 입력해 주세요.");

  const { error } = await client.from("contacts").update({
    name,
    position: document.getElementById("editContactPosition").value,
    phone,
    memo: document.getElementById("editContactMemo").value.trim() || null,
    updated_at: new Date().toISOString()
  }).eq("id", contactId);
  if (error) return setMsg("연락처 수정 실패: " + escapeHtml(error.message));
  alert("연락처가 수정되었습니다.");
  await contactsPage();
}

async function deleteContact(contactId) {
  const profile = await getCurrentProfile();
  if (!canManageContacts(profile)) return alert("연락처 삭제 권한이 없습니다.");
  const contact = contactDirectoryCache.find(item => item.id === contactId);
  if (!confirm(`${contact?.name || "이"} 연락처를 삭제하시겠습니까?`)) return;

  const { error } = await client.from("contacts").delete().eq("id", contactId);
  if (error) return alert("연락처 삭제 실패:\n" + error.message);
  alert("연락처가 삭제되었습니다.");
  await contactsPage();
}


// =====================================================
// 자료실
// =====================================================

const RESOURCE_CATEGORIES = ["서식", "설계안 공유", "상품자료", "교육자료", "업무자료", "기타"];

function formatFileSize(bytes) {
  const size = Number(bytes || 0);
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / 1024 / 1024).toFixed(1)} MB`;
}

function parseResourceTags(value) {
  return [...new Set(
    String(value || "")
      .split(",")
      .map(tag => tag.trim().replace(/^#/, ""))
      .filter(Boolean)
  )].slice(0, 10);
}

async function resourcesPage() {
  const profile = await getCurrentProfile();
  if (!profile || profile.status !== "approved") {
    authScreen();
    return;
  }

  const { data: resources, error } = await client
    .from("resources")
    .select("*, resource_files(id)")
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) {
    alert("자료실을 불러오지 못했습니다.\n" + error.message);
    return;
  }

  const cards = (resources || []).map(item => {
    const tags = (item.tags || []).map(tag =>
      `<span class="tag">#${escapeHtml(tag)}</span>`
    ).join("");
    const searchText = [item.title, item.description, item.category, ...(item.tags || []), item.uploader_name]
      .join(" ").toLowerCase();

    return `
      <div class="card resource-card" data-category="${escapeHtml(item.category)}" data-search="${escapeHtml(searchText)}"
        onclick="resourceDetail('${item.id}')" style="cursor:pointer;">
        <div class="muted">${escapeHtml(item.category)} · ${new Date(item.created_at).toLocaleDateString("ko-KR")}</div>
        <h3>${escapeHtml(item.title)}</h3>
        <p>${escapeHtml(item.description || "설명이 없습니다.")}</p>
        <p style="margin-top:12px;">📎 ${(item.resource_files || []).length}개 · ${escapeHtml(item.uploader_name)}</p>
        <div>${tags}</div>
      </div>`;
  }).join("");

  app.innerHTML = `
    <div class="wrap">
      <div class="top">
        <div class="brand" onclick="goHome()" role="button" tabindex="0" title="메인으로" style="cursor:pointer;" onkeydown="if(event.key === 'Enter' || event.key === ' '){ event.preventDefault(); goHome(); }">THE ONE <b>SPACE</b></div>
        <button class="btn secondary" onclick="goHome()">메인으로</button>
      </div>
      <section class="hero">
        <div class="muted">RESOURCE LIBRARY</div>
        <h1>자료실</h1>
        <p>지점 업무에 필요한 파일을 찾고 공유합니다.</p>
        <button class="btn" onclick="newResourceForm()">+ 새 자료 등록</button>
      </section>
      <div class="toolbar resource-toolbar">
        <input id="resourceSearch" type="search" placeholder="제목, 설명, 태그, 등록자 검색" oninput="filterResources()">
        <div class="resource-category-tabs" aria-label="자료 카테고리">
          <button class="resource-category-btn active" data-category="" onclick="selectResourceCategory('', this)">전체</button>
          ${RESOURCE_CATEGORIES.map(category =>
            `<button class="resource-category-btn" data-category="${category}" onclick="selectResourceCategory('${category}', this)">${category}</button>`
          ).join("")}
        </div>
      </div>
      <div id="resourceEmpty" class="card" style="display:${resources?.length ? "none" : "block"};">
        <p class="muted">등록된 자료가 없습니다.</p>
      </div>
      <div id="resourceGrid" class="grid">${cards}</div>
    </div>`;
}

function selectResourceCategory(category, button) {
  document.querySelectorAll(".resource-category-btn").forEach(item => {
    item.classList.toggle("active", item === button);
  });
  filterResources();
}

function filterResources() {
  const query = document.getElementById("resourceSearch").value.trim().toLowerCase();
  const activeCategory = document.querySelector(".resource-category-btn.active");
  const category = activeCategory ? activeCategory.dataset.category : "";
  const cards = Array.from(document.querySelectorAll(".resource-card"));
  let visible = 0;
  cards.forEach(card => {
    const show = (!query || card.dataset.search.includes(query)) && (!category || card.dataset.category === category);
    card.style.display = show ? "block" : "none";
    if (show) visible += 1;
  });
  document.getElementById("resourceEmpty").style.display = visible ? "none" : "block";
}

async function newResourceForm() {
  const profile = await getCurrentProfile();
  if (!profile || profile.status !== "approved") return authScreen();

  app.innerHTML = `
    <div class="wrap">
      <div class="top">
        <div class="brand" onclick="goHome()" role="button" tabindex="0" title="메인으로" style="cursor:pointer;" onkeydown="if(event.key === 'Enter' || event.key === ' '){ event.preventDefault(); goHome(); }">THE ONE <b>SPACE</b></div>
        <button class="btn secondary" onclick="resourcesPage()">목록으로</button>
      </div>
      <section class="hero"><div class="muted">NEW RESOURCE</div><h1>새 자료 등록</h1></section>
      <div class="auth" style="max-width:700px;">
        <div class="field"><label>제목</label><input id="resourceTitle" type="text" placeholder="자료 제목을 입력해 주세요."></div>
        <div class="field"><label>설명</label><textarea id="resourceDescription" rows="5" placeholder="자료의 용도나 내용을 입력해 주세요."></textarea></div>
        <div class="field"><label>카테고리</label><select id="resourceCategory">${RESOURCE_CATEGORIES.map(category => `<option value="${category}">${category}</option>`).join("")}</select></div>
        <div class="field"><label>태그</label><input id="resourceTags" type="text" placeholder="쉼표로 구분 (예: 청약서, 고객관리)"></div>
        <div class="field"><label>파일</label><input id="resourceFiles" type="file" multiple><p class="muted">여러 파일을 한 번에 선택할 수 있습니다.</p></div>
        <button id="resourceUploadBtn" class="btn" onclick="saveResource()">자료 등록</button>
        <div id="msg"></div>
      </div>
    </div>`;
}

async function saveResource() {
  const title = document.getElementById("resourceTitle").value.trim();
  const description = document.getElementById("resourceDescription").value.trim();
  const category = document.getElementById("resourceCategory").value;
  const tags = parseResourceTags(document.getElementById("resourceTags").value);
  const files = Array.from(document.getElementById("resourceFiles").files);
  if (!title) return setMsg("자료 제목을 입력해 주세요.");
  if (!files.length) return setMsg("파일을 한 개 이상 선택해 주세요.");

  const user = await getCurrentUser();
  const profile = await getCurrentProfile();
  if (!user || !profile || profile.status !== "approved") return setMsg("로그인이 필요합니다.");

  const button = document.getElementById("resourceUploadBtn");
  button.disabled = true;
  button.textContent = "업로드 중...";
  const resourceId = crypto.randomUUID();
  const uploaded = [];

  for (let index = 0; index < files.length; index += 1) {
    const file = files[index];
    setMsg(`파일 업로드 중... ${index + 1} / ${files.length}`);
    const extension = file.name.includes(".") ? "." + file.name.split(".").pop().toLowerCase().replace(/[^a-z0-9]/g, "") : "";
    const filePath = `${user.id}/${resourceId}/${crypto.randomUUID()}${extension}`;
    const { data, error } = await client.storage.from("resources").upload(filePath, file, {
      cacheControl: "3600", upsert: false, contentType: file.type || "application/octet-stream"
    });
    if (error) {
      if (uploaded.length) await client.storage.from("resources").remove(uploaded.map(item => item.file_path));
      button.disabled = false;
      button.textContent = "자료 등록";
      return setMsg(`파일 업로드 실패:<br>${escapeHtml(file.name)}<br><br>${escapeHtml(error.message)}`);
    }
    uploaded.push({ file_name: file.name, file_path: data.path, file_type: file.type || null, file_size: file.size });
  }

  const { error: resourceError } = await client.from("resources").insert({
    id: resourceId, title, description: description || null, category, tags,
    uploaded_by: user.id, uploader_name: profile.name
  });
  if (resourceError) {
    await client.storage.from("resources").remove(uploaded.map(item => item.file_path));
    button.disabled = false;
    button.textContent = "자료 등록";
    return setMsg("자료 정보 저장 실패:<br>" + escapeHtml(resourceError.message));
  }

  const { error: fileError } = await client.from("resource_files").insert(uploaded.map(file => ({
    resource_id: resourceId, uploaded_by: user.id, ...file
  })));
  if (fileError) {
    await client.from("resources").delete().eq("id", resourceId);
    await client.storage.from("resources").remove(uploaded.map(item => item.file_path));
    button.disabled = false;
    button.textContent = "자료 등록";
    return setMsg("파일 정보 저장 실패:<br>" + escapeHtml(fileError.message));
  }

  alert(`자료 등록 완료!\n${uploaded.length}개 파일이 저장되었습니다.`);
  await resourcesPage();
}

async function resourceDetail(resourceId) {
  const user = await getCurrentUser();
  const profile = await getCurrentProfile();
  if (!user || !profile || profile.status !== "approved") return authScreen();

  const [{ data: resource, error }, { data: files, error: filesError }] = await Promise.all([
    client.from("resources").select("*").eq("id", resourceId).is("deleted_at", null).single(),
    client.from("resource_files").select("*").eq("resource_id", resourceId).order("created_at", { ascending: true })
  ]);
  if (error || !resource) return alert("자료를 불러오지 못했습니다.");
  if (filesError) return alert("파일 목록을 불러오지 못했습니다.\n" + filesError.message);

  const canEdit = profile.role === "admin" || resource.uploaded_by === user.id;
  const canDelete = profile.role === "admin";
  const fileRows = (files || []).map(file => `
    <div class="file-row">
      <div class="file-name"><b>${escapeHtml(file.file_name)}</b><div class="muted">${formatFileSize(file.file_size)}</div></div>
      <button class="btn" onclick="openResourceFile('${file.file_path}')">열기 / 다운로드</button>
    </div>`).join("") || `<p class="muted">등록된 파일이 없습니다.</p>`;

  app.innerHTML = `
    <div class="wrap">
      <div class="top">
        <div class="brand" onclick="goHome()" role="button" tabindex="0" title="메인으로" style="cursor:pointer;" onkeydown="if(event.key === 'Enter' || event.key === ' '){ event.preventDefault(); goHome(); }">THE ONE <b>SPACE</b></div>
        <div class="button-row">
          ${canEdit ? `<button class="btn" onclick="editResourceForm('${resource.id}')">수정</button>` : ""}
          ${canDelete ? `<button class="btn secondary" onclick="deleteResource('${resource.id}')">삭제</button>` : ""}
          <button class="btn secondary" onclick="resourcesPage()">목록으로</button>
        </div>
      </div>
      <section class="hero">
        <div class="muted">${escapeHtml(resource.category)} · ${new Date(resource.created_at).toLocaleString("ko-KR")}</div>
        <h1>${escapeHtml(resource.title)}</h1>
        <p>등록자: ${escapeHtml(resource.uploader_name)}</p>
        <div>${(resource.tags || []).map(tag => `<span class="tag">#${escapeHtml(tag)}</span>`).join("")}</div>
      </section>
      <div class="card"><h3>자료 설명</h3><p style="white-space:pre-wrap;line-height:1.7;">${escapeHtml(resource.description || "등록된 설명이 없습니다.")}</p></div>
      <h2 style="margin-top:40px;">첨부 파일 (${files?.length || 0})</h2>
      <div class="card">${fileRows}</div>
    </div>`;
}

async function openResourceFile(filePath) {
  const { data, error } = await client.storage.from("resources").createSignedUrl(filePath, 60 * 10, { download: true });
  if (error || !data?.signedUrl) return alert("파일을 열지 못했습니다.\n" + (error?.message || ""));
  window.open(data.signedUrl, "_blank", "noopener,noreferrer");
}

async function editResourceForm(resourceId) {
  const user = await getCurrentUser();
  const profile = await getCurrentProfile();
  const { data: resource, error } = await client.from("resources").select("*").eq("id", resourceId).single();
  if (error || !resource) return alert("자료를 불러오지 못했습니다.");
  if (!user || !profile || (profile.role !== "admin" && resource.uploaded_by !== user.id)) return alert("본인이 등록한 자료만 수정할 수 있습니다.");

  app.innerHTML = `
    <div class="wrap">
      <div class="top"><div class="brand" onclick="goHome()" role="button" tabindex="0" title="메인으로" style="cursor:pointer;" onkeydown="if(event.key === 'Enter' || event.key === ' '){ event.preventDefault(); goHome(); }">THE ONE <b>SPACE</b></div><button class="btn secondary" onclick="resourceDetail('${resource.id}')">취소</button></div>
      <section class="hero"><div class="muted">EDIT RESOURCE</div><h1>자료 수정</h1></section>
      <div class="auth" style="max-width:700px;">
        <div class="field"><label>제목</label><input id="editResourceTitle" type="text" value="${escapeHtml(resource.title)}"></div>
        <div class="field"><label>설명</label><textarea id="editResourceDescription" rows="5">${escapeHtml(resource.description || "")}</textarea></div>
        <div class="field"><label>카테고리</label><select id="editResourceCategory">${RESOURCE_CATEGORIES.map(category => `<option value="${category}" ${resource.category === category ? "selected" : ""}>${category}</option>`).join("")}</select></div>
        <div class="field"><label>태그</label><input id="editResourceTags" type="text" value="${escapeHtml((resource.tags || []).join(", "))}"></div>
        <p class="muted">첨부 파일은 그대로 유지됩니다.</p>
        <button class="btn" onclick="updateResource('${resource.id}')">수정 저장</button><div id="msg"></div>
      </div>
    </div>`;
}

async function updateResource(resourceId) {
  const title = document.getElementById("editResourceTitle").value.trim();
  if (!title) return setMsg("자료 제목을 입력해 주세요.");
  const { error } = await client.from("resources").update({
    title,
    description: document.getElementById("editResourceDescription").value.trim() || null,
    category: document.getElementById("editResourceCategory").value,
    tags: parseResourceTags(document.getElementById("editResourceTags").value),
    updated_at: new Date().toISOString()
  }).eq("id", resourceId);
  if (error) return setMsg("자료 수정 실패: " + escapeHtml(error.message));
  alert("자료가 수정되었습니다.");
  await resourceDetail(resourceId);
}

async function deleteResource(resourceId) {
  if (!confirm("이 자료를 휴지통으로 이동하시겠습니까?\n첨부 파일은 보존되며 30일 동안 복원할 수 있습니다.")) return;
  const { error } = await client.rpc("move_item_to_trash", { item_type: "resource", item_id: String(resourceId) });
  if (error) return alert("휴지통 이동에 실패했습니다.\n" + error.message);
  alert("자료를 휴지통으로 이동했습니다.");
  await resourcesPage();
}
