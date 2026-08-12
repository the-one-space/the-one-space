const SUPABASE_URL = "https://iluetyyhzqegupejlqhq.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_ykDuIZGznZnQvI6Uxhy7dg_F-y8RQHB";

const SITE_URL = "https://the-one-space.github.io/the-one-space/";

const app = document.getElementById("app");
const client = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);


// ========================================
// 메시지
// ========================================

function setMsg(text) {
  const el = document.getElementById("msg");

  if (el) {
    el.innerHTML = `<div class="msg">${text}</div>`;
  }
}


// ========================================
// 로그인 화면
// ========================================

function authScreen() {
  app.innerHTML = `
    <div class="auth">

      <div class="brand">
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

      <button
        class="btn"
        onclick="login()"
      >
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


// ========================================
// 회원가입 화면
// ========================================

function signupForm() {
  app.innerHTML = `
    <div class="auth">

      <div class="brand">
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
        <label>직급</label>

        <select id="position">
          <option value="지점장">지점장</option>
          <option value="이사">이사</option>
          <option value="팀장">팀장</option>
          <option value="MP">MP</option>
          <option value="비서">비서</option>
        </select>
      </div>

      <button
        class="btn"
        onclick="signup()"
      >
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


// ========================================
// 로그인
// ========================================

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

    setMsg(
      "사용자 정보를 확인할 수 없습니다. 관리자에게 문의해 주세요."
    );

    return;
  }

  if (profile.status !== "approved") {
    await client.auth.signOut();

    setMsg(
      "관리자 승인 후 이용할 수 있습니다."
    );

    return;
  }

  home(profile);
}


// ========================================
// 회원가입
// ========================================

async function signup() {
  const nameValue =
    document.getElementById("name").value.trim();

  const emailValue =
    document.getElementById("email").value.trim();

  const pwValue =
    document.getElementById("pw").value;

  const positionValue =
    document.getElementById("position").value;

  if (!nameValue || !emailValue || !pwValue) {
    setMsg(
      "이름, 이메일, 비밀번호를 모두 입력해 주세요."
    );

    return;
  }

  const { error } =
    await client.auth.signUp({
      email: emailValue,
      password: pwValue,

      options: {
        data: {
          name: nameValue,
          position: positionValue
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


// ========================================
// 비밀번호 찾기
// ========================================

async function forgotPassword() {
  const emailValue =
    prompt("가입할 때 사용한 이메일을 입력해 주세요.");

  if (!emailValue) {
    return;
  }

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


// ========================================
// 새 비밀번호 화면
// ========================================

function showResetPasswordScreen() {
  app.innerHTML = `
    <div class="auth">

      <div class="brand">
        THE ONE <b>SPACE</b>
      </div>

      <h2>새 비밀번호 설정</h2>

      <p class="muted">
        사용할 새 비밀번호를 입력해 주세요.
      </p>

      <div class="field">
        <label>새 비밀번호</label>

        <input
          id="newPw"
          type="password"
          autocomplete="new-password"
        >
      </div>

      <div class="field">
        <label>새 비밀번호 확인</label>

        <input
          id="newPwConfirm"
          type="password"
          autocomplete="new-password"
        >
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


// ========================================
// 새 비밀번호 저장
// ========================================

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

  alert(
    "비밀번호가 변경되었습니다. 다시 로그인해 주세요."
  );

  await client.auth.signOut();

  history.replaceState(
    {},
    document.title,
    window.location.pathname
  );

  authScreen();
}


// ========================================
// 메인 화면
// ========================================

function home(profile) {
  const adminButton =
    profile.role === "admin"
      ? `
          <button
            class="btn"
            onclick="adminPage()"
          >
            관리자
          </button>
        `
      : "";

  app.innerHTML = `
    <div class="wrap">

      <div class="top">

        <div class="brand">
          THE ONE <b>SPACE</b>
        </div>

        <div>

          ${adminButton}

          <button
            class="btn secondary"
            onclick="logout()"
          >
            로그아웃
          </button>

        </div>

      </div>


      <section class="hero">

        <div class="muted">
          AIA 프리미어파트너스 더원지점
        </div>

        <h1>
          Connect. Share. Grow.
        </h1>

        <p>
          ${profile.name}님, 환영합니다.
        </p>

      </section>


      <div class="grid">

        <div class="card">
          <div class="icon">🎙️</div>
          <h3>녹취록</h3>
          <p>상담 녹취와 내용을 확인합니다.</p>
        </div>

        <div class="card">
          <div class="icon">📅</div>
          <h3>스케줄</h3>
          <p>지점 일정을 확인합니다.</p>
        </div>

        <div class="card">
          <div class="icon">📢</div>
          <h3>공지사항</h3>
          <p>지점 공지를 확인합니다.</p>
        </div>

        <div class="card">
          <div class="icon">📁</div>
          <h3>자료실</h3>
          <p>공유 자료를 확인합니다.</p>
        </div>

      </div>

    </div>
  `;
}


// ========================================
// 관리자 페이지
// ========================================

async function adminPage() {
  const {
    data: { user }
  } = await client.auth.getUser();

  if (!user) {
    authScreen();
    return;
  }

  const { data: myProfile, error: myError } =
    await client
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

  if (
    myError ||
    !myProfile ||
    myProfile.role !== "admin" ||
    myProfile.status !== "approved"
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
              ${p.name || "이름 없음"}
            </h3>

            <p>
              ${p.position || "-"}
            </p>

            <p class="muted">
              ${p.email || ""}
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
              ${p.name || "이름 없음"}
            </h3>

            <p>
              ${p.position || "-"}
            </p>

            <p class="muted">
              ${
                p.role === "admin"
                  ? "관리자 · 승인 완료"
                  : "승인 완료"
              }
            </p>

            <p class="muted">
              ${p.email || ""}
            </p>

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

        <div class="brand">
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
          ADMIN
        </div>

        <h1>
          직원 관리
        </h1>

        <p>
          가입 신청을 확인하고 승인 또는 거절할 수 있습니다.
        </p>

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


// ========================================
// 직원 승인 / 거절
// ========================================

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

  alert(
    `${text} 처리되었습니다.`
  );

  await adminPage();
}


// ========================================
// 메인으로
// ========================================

async function goHome() {
  const {
    data: { user }
  } = await client.auth.getUser();

  if (!user) {
    authScreen();
    return;
  }

  const { data: profile, error } =
    await client
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

  if (error || !profile) {
    alert(
      "사용자 정보를 불러오지 못했습니다."
    );

    return;
  }

  home(profile);
}


// ========================================
// 로그아웃
// ========================================

async function logout() {
  await client.auth.signOut();

  authScreen();
}


// ========================================
// 비밀번호 복구 링크 감지
// ========================================

client.auth.onAuthStateChange(
  (event) => {
    if (event === "PASSWORD_RECOVERY") {
      showResetPasswordScreen();
    }
  }
);


// ========================================
// 사이트 시작
// ========================================

async function start() {
  const {
    data: { session }
  } = await client.auth.getSession();

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
