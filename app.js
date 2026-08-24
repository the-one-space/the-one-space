const SUPABASE_URL = "https://iluetyyhzqegupejlqhq.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_ykDuIZGznZnQvI6Uxhy7dg_F-y8RQHB";

const SITE_URL = "https://the-one-space.github.io/the-one-space/";

const app = document.getElementById("app");
const client = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);


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

      <div class="brand">
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

        <h1>Connect. Share. Grow.</h1>

        <p>
          ${escapeHtml(profile.name)}님, 환영합니다.
        </p>

      </section>

      <div class="grid">

        <div
          class="card"
          onclick="recordingsPage()"
          style="cursor:pointer;"
        >
          <div class="icon">🎙️</div>
          <h3>녹취록</h3>
          <p>상담 녹취와 내용을 확인합니다.</p>
        </div>

        <div
  class="card"
  onclick="window.open('https://docs.google.com/spreadsheets/d/1h_mwY9v-YdpEknbme16u1-kvY618_QJN/edit?gid=1579963286#gid=1579963286', '_blank')"
  style="cursor:pointer;"
>
  <div class="icon">📅</div>
  <h3>스케줄</h3>
  <p>지점 일정을 확인하고 입력합니다.</p>
</div>

        <div
  class="card"
  onclick="noticesPage()"
  style="cursor:pointer;"
>
  <div class="icon">📢</div>
  <h3>공지사항</h3>
  <p>지점 공지를 확인합니다.</p>
</div>

        <div
          class="card"
          onclick="resourcesPage()"
          style="cursor:pointer;"
        >
          <div class="icon">📁</div>
          <h3>자료실</h3>
          <p>공유 자료를 확인합니다.</p>
        </div>

      </div>

    </div>
  `;
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

        <div class="brand">
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

        <div class="brand">
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

        <div class="brand">
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
  const user = await getCurrentUser();
  const profile = await getCurrentProfile();

  if (!user || !profile) {
    authScreen();
    return;
  }

  const {
    data: recording,
    error: recordingLoadError
  } =
    await client
      .from("recordings")
      .select("*")
      .eq("id", recordingId)
      .single();

  if (recordingLoadError || !recording) {
    alert("녹취록을 찾을 수 없습니다.");
    return;
  }

  const canManage =
    profile.role === "admin" ||
    recording.uploaded_by === user.id;

  if (!canManage) {
    alert("본인이 등록한 녹취록만 삭제할 수 있습니다.");
    return;
  }

  const confirmed =
    confirm(
      "정말 삭제하시겠습니까?\n\n" +
      "녹취록과 음성파일이 모두 삭제되며 복구할 수 없습니다."
    );

  if (!confirmed) {
    return;
  }

  const {
    data: files,
    error: filesError
  } =
    await client
      .from("recording_files")
      .select("file_path")
      .eq("recording_id", recordingId);

  if (filesError) {
    alert(
      "파일 목록 확인에 실패했습니다.\n" +
      filesError.message
    );
    return;
  }

  const filePaths =
    (files || [])
      .map(item => item.file_path)
      .filter(Boolean);

  // 실제 Storage 파일 삭제
  if (filePaths.length > 0) {
    const { error: storageError } =
      await client.storage
        .from("recordings")
        .remove(filePaths);

    if (storageError) {
      alert(
        "음성파일 삭제에 실패했습니다.\n" +
        storageError.message
      );
      return;
    }
  }

  // 파일정보 삭제
  const { error: fileDbError } =
    await client
      .from("recording_files")
      .delete()
      .eq("recording_id", recordingId);

  if (fileDbError) {
    alert(
      "파일정보 삭제에 실패했습니다.\n" +
      fileDbError.message
    );
    return;
  }

  // 녹취록 삭제
  const { error: recordingError } =
    await client
      .from("recordings")
      .delete()
      .eq("id", recordingId);

  if (recordingError) {
    alert(
      "녹취록 삭제에 실패했습니다.\n" +
      recordingError.message
    );
    return;
  }

  alert("녹취록이 삭제되었습니다.");

  await recordingsPage();
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

        <div class="muted">ADMIN</div>

        <h1>직원 관리</h1>

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


// =====================================================
// 직원 승인 / 거절
// =====================================================

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

        <div class="brand">
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

        <div class="brand">
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

        <div class="brand">
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
  const profile = await getCurrentProfile();

  if (!canManageNotices(profile)) {
    alert("공지 삭제 권한이 없습니다.");
    return;
  }

  const confirmed =
    confirm(
      "이 공지사항을 삭제하시겠습니까?\n\n" +
      "삭제 후 복구할 수 없습니다."
    );

  if (!confirmed) {
    return;
  }

  const { error } =
    await client
      .from("notices")
      .delete()
      .eq("id", noticeId);

  if (error) {
    alert(
      "공지 삭제 실패:\n" +
      error.message
    );
    return;
  }

  alert("공지사항이 삭제되었습니다.");

  await noticesPage();
}


// =====================================================
// 자료실
// =====================================================

const RESOURCE_CATEGORIES = ["서식", "상품자료", "교육자료", "업무자료", "기타"];

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
        <div class="brand">THE ONE <b>SPACE</b></div>
        <button class="btn secondary" onclick="goHome()">메인으로</button>
      </div>
      <section class="hero">
        <div class="muted">RESOURCE LIBRARY</div>
        <h1>자료실</h1>
        <p>지점 업무에 필요한 파일을 찾고 공유합니다.</p>
        <button class="btn" onclick="newResourceForm()">+ 새 자료 등록</button>
      </section>
      <div class="toolbar">
        <input id="resourceSearch" type="search" placeholder="제목, 설명, 태그, 등록자 검색" oninput="filterResources()">
        <select id="resourceCategoryFilter" onchange="filterResources()">
          <option value="">전체 카테고리</option>
          ${RESOURCE_CATEGORIES.map(category => `<option value="${category}">${category}</option>`).join("")}
        </select>
      </div>
      <div id="resourceEmpty" class="card" style="display:${resources?.length ? "none" : "block"};">
        <p class="muted">등록된 자료가 없습니다.</p>
      </div>
      <div id="resourceGrid" class="grid">${cards}</div>
    </div>`;
}

function filterResources() {
  const query = document.getElementById("resourceSearch").value.trim().toLowerCase();
  const category = document.getElementById("resourceCategoryFilter").value;
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
        <div class="brand">THE ONE <b>SPACE</b></div>
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
    client.from("resources").select("*").eq("id", resourceId).single(),
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
        <div class="brand">THE ONE <b>SPACE</b></div>
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
      <div class="top"><div class="brand">THE ONE <b>SPACE</b></div><button class="btn secondary" onclick="resourceDetail('${resource.id}')">취소</button></div>
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
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "admin") return alert("관리자만 자료를 삭제할 수 있습니다.");
  if (!confirm("이 자료와 첨부 파일을 모두 삭제하시겠습니까?\n삭제 후 복구할 수 없습니다.")) return;
  const { data: files, error: loadError } = await client.from("resource_files").select("file_path").eq("resource_id", resourceId);
  if (loadError) return alert("파일 목록을 확인하지 못했습니다.\n" + loadError.message);
  const paths = (files || []).map(file => file.file_path).filter(Boolean);
  if (paths.length) {
    const { error } = await client.storage.from("resources").remove(paths);
    if (error) return alert("첨부 파일 삭제에 실패했습니다.\n" + error.message);
  }
  const { error } = await client.from("resources").delete().eq("id", resourceId);
  if (error) return alert("자료 삭제에 실패했습니다.\n" + error.message);
  alert("자료가 삭제되었습니다.");
  await resourcesPage();
}
