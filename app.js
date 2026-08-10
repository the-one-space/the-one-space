const SUPABASE_URL = "여기에_프로젝트_URL";
const SUPABASE_ANON_KEY = "여기에_게시_가능한_키";

const app = document.getElementById("app");
let client = null;

function authScreen(){
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

function signupForm(){
  app.innerHTML = `
    <div class="auth">
      <div class="brand">THE ONE <b>SPACE</b></div>
      <h2>직원 회원가입</h2>

      <div class="field">
        <label>이름</label>
        <input id="name">
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
          <option>지점장</option>
          <option>이사</option>
          <option>팀장</option>
          <option>MP</option>
          <option>비서</option>
        </select>
      </div>

      <button class="btn" onclick="signup()">가입 신청</button>
      <button class="btn secondary" onclick="authScreen()">로그인</button>
      <div id="msg"></div>
    </div>
  `;
}

function setMsg(text){
  const el = document.getElementById("msg");
  if(el) el.innerHTML = `<div class="msg">${text}</div>`;
}

async function login(){
  const emailValue = document.getElementById("email").value;
  const pwValue = document.getElementById("pw").value;

  const { data, error } = await client.auth.signInWithPassword({
    email: emailValue,
    password: pwValue
  });

  if(error){
    setMsg(error.message);
    return;
  }

  const { data: profile } = await client
    .from("profiles")
    .select("*")
    .eq("id", data.user.id)
    .single();

  if(!profile || profile.status !== "approved"){
    await client.auth.signOut();
    setMsg("관리자 승인 후 이용할 수 있습니다.");
    return;
  }

  home(profile);
}

async function signup(){
  const nameValue = document.getElementById("name").value;
  const emailValue = document.getElementById("email").value;
  const pwValue = document.getElementById("pw").value;
  const positionValue = document.getElementById("position").value;

  const { data, error } = await client.auth.signUp({
    email: emailValue,
    password: pwValue
  });

  if(error){
    setMsg(error.message);
    return;
  }

  const { error: profileError } = await client
    .from("profiles")
    .insert({
      id: data.user.id,
      name: nameValue,
      email: emailValue,
      position: positionValue,
      role: "staff",
      status: "pending"
    });

  if(profileError){
    setMsg(profileError.message);
    return;
  }

  setMsg("가입 신청 완료! 관리자 승인 후 로그인할 수 있습니다.");
}

function home(profile){
  app.innerHTML = `
    <div class="wrap">
      <div class="top">
        <div class="brand">THE ONE <b>SPACE</b></div>
        <button class="btn secondary" onclick="logout()">로그아웃</button>
      </div>

      <section class="hero">
        <div class="muted">AIA 프리미어파트너스 더원지점</div>
        <h1>Connect. Share. Grow.</h1>
        <p>${profile.name}님, 환영합니다.</p>
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

async function logout(){
  await client.auth.signOut();
  authScreen();
}

const configured =
  !SUPABASE_URL.includes("여기에_") &&
  !SUPABASE_ANON_KEY.includes("여기에_");

if(configured){
  client = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  authScreen();
} else {
  authScreen();
}
