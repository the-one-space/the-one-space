const SUPABASE_URL = "https://iluetyyhzqegupejlqhq.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_ykDuIZGznZnQvI6Uxhy7dg_F-y8RQH";

const app = document.getElementById("app");
const client = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);


// =========================
// 로그인 화면
// =========================

function authScreen() {
  app.innerHTML = `
    <div class="auth">
      <div class="brand">THE ONE <b>SPACE</b></div>

      <h2>지점 전용 공간</h2>
      <p class="muted">승인된 직원만 이용할 수 있습니다.</p>

      <div class="field">
        <label>이메일</label>
        <input id="email" type="email">
      </div>

      <div class="field">
        <label>비밀번호</label>
        <input id="pw" type="password">
      </div>

      <button class="btn" onclick="login()">로그인</button>
      <button class="btn secondary" onclick="signupForm()">회원가입</button>

      <div id="msg"></div>
    </div>
  `;
}


// =========================
// 회원가입 화면
// =========================

function signupForm() {
  app.innerHTML = `
    <div class="auth">
      <div class="brand">THE ONE <b>SPACE</b></div>

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

      <button class="btn" onclick="signup()">
        가입 신청
      </button>

      <button class="btn secondary" onclick="authScreen()">
        로그인으로 돌아가기
      </button>

      <div id="msg"></div>
    </div>
  `;
}


// =========================
// 메시지 표시
// =========================

function setMsg(text) {
  const el = document.getElementById("msg");

  if (el) {
    el.innerHTML = `
      <div class="msg">${text}</div>
    `;
  }
}


// =========================
// 로그인
// =========================

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
      "가입 신청이 완료되었습니다. 관리자 승인 후 이용할 수 있습니다."
    );

    return;
  }


  home(profile);
}


// =========================
// 회원가입
// =========================

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


  const { data, error } =
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


// =========================
// 메인 화면
// =========================

function home(profile) {

  const adminButton =
    profile.role === "admin"
      ? `<button class="btn" onclick="adminPage()">관리자</button>`
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

          <p>
            상담 녹취와 내용을 확인합니다.
          </p>

        </div>


        <div class="card">

          <div class="icon">📅</div>

          <h3>스케줄</h3>

          <p>
            지점 일정을 확인합니다.
          </p>

        </div>


        <div class="card">

          <div class="icon">📢</div>

          <h3>공지사항</h3>

          <p>
            지점 공지를 확인합니다.
          </p>

        </div>


        <div class="card">

          <div class="icon">📁</div>

          <h3>자료실</h3>

          <p>
            공유 자료를 확인합니다.
          </p>

        </div>

      </div>

    </div>
  `;
}


// =========================
// 관리자 화면
// =========================

async function adminPage() {

  const {
    data: { user }
  } = await client.auth.getUser();


  if (!user) {
    authScreen();
    return;
  }


  const { data: profile } =
    await client
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();


  if (!profile || profile.role !== "admin") {

    setMsg("관리자만 이용할 수 있습니다.");

    return;
  }


  app.innerHTML = `

    <div class="wrap">

      <div class="top">

        <div class="brand">
          THE ONE <b>SPACE</b>
        </div>

        <button
          class="btn secondary"
          onclick="home(${JSON.stringify(profile).replace(/"/g, '&quot;')})"
        >
          메인으로
        </button>

      </div>


      <section class="hero">

        <div class="muted">
          ADMIN
        </div>

        <h1>
          관리자 페이지
        </h1>

        <p>
          직원 승인 및 권한 관리 기능을 연결할 공간입니다.
        </p>

      </section>

    </div>
  `;
}


// =========================
// 로그아웃
// =========================

async function logout() {

  await client.auth.signOut();

  authScreen();
}


// =========================
// 처음 사이트를 열었을 때
// =========================

async function start() {

  const {
    data: { session }
  } = await client.auth.getSession();


  if (!session) {
    authScreen();
    return;
  }


  const { data: profile } =
    await client
      .from("profiles")
      .select("*")
      .eq("id", session.user.id)
      .single();


  if (
    profile &&
    profile.status === "approved"
  ) {

    home(profile);

  } else {

    await client.auth.signOut();

    authScreen();

  }
}


start();
