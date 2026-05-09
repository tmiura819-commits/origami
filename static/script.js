// -----------------------------
// 画面切り替え
// -----------------------------
function show(screenId) {
    document.querySelectorAll(".card").forEach(s => s.classList.add("hidden"));
    document.getElementById(screenId).classList.remove("hidden");
}

// -----------------------------
// ログイン処理
// -----------------------------
document.getElementById("login-btn").addEventListener("click", async () => {
    const id = document.getElementById("login-id").value.trim();
    const password = document.getElementById("login-password").value.trim();

    if (!id || !password) {
        document.getElementById("login-error").textContent = "ID とパスワードを入力してね";
        return;
    }

    try {
        const res = await fetch("/api/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id, password })
        });

        if (!res.ok) {
            document.getElementById("login-error").textContent = "ログインに失敗しました";
            return;
        }

        const data = await res.json();

        // ★ ログアウトボタンを表示
        document.getElementById("logout-btn").classList.remove("hidden");

        if (data.role === "student") {
            currentStudent = data.student;
            document.getElementById("student-name-label").textContent =
                `${currentStudent.name} さん、こんにちは！`;
            show("student-start-screen");

        } else if (data.role === "teacher") {
            currentTeacher = data.teacher;
            document.getElementById("teacher-name-label").textContent =
                `${currentTeacher.name} せんせい`;
            show("teacher-menu-screen");
        }

    } catch (err) {
        console.error(err);
        document.getElementById("login-error").textContent = "通信エラーが発生しました";
    }
});

// -----------------------------
// 生徒：スタート画面
// -----------------------------
document.getElementById("btn-do-origami").addEventListener("click", () => {
    show("student-select-origami");
});

document.getElementById("btn-later").addEventListener("click", () => {
    show("student-come-again");
});

document.getElementById("btn-do-after-all").addEventListener("click", () => {
    show("student-select-origami");
});

document.getElementById("btn-bye").addEventListener("click", () => {
    show("login-screen");
});

// -----------------------------
// 生徒：折り紙選択
// -----------------------------
document.querySelectorAll("#student-select-origami button[data-origami]")
    .forEach(btn => {
        btn.addEventListener("click", () => {
            currentOrigami = btn.dataset.origami;
            document.getElementById("steps-title").textContent =
                `${currentOrigami} の折り方`;
            loadSteps();
            show("student-steps-screen");
        });
    });

document.getElementById("btn-maybe-no").addEventListener("click", () => {
    show("student-come-again");
});

// -----------------------------
// 生徒：ステップ動画
// -----------------------------
let currentStep = 0;
let stepTimes = Array(5).fill(null);
let timer = null;
let stepStartTime = null;

function loadSteps() {
    const steps = ["ステップ1", "ステップ2", "ステップ3", "ステップ4", "ステップ5"];
    const links = document.getElementById("steps-links");
    links.innerHTML = "";

    steps.forEach((s, i) => {
        const btn = document.createElement("button");
        btn.textContent = s;
        btn.classList.add("step-button"); // ★ 追加
        btn.addEventListener("click", () => moveToStep(i));
        links.appendChild(btn);
    });
}

function moveToStep(stepIndex) {
    // ★ タイマーが動いていたら時間を記録
    if (timer !== null) {
        recordCurrentStepTime();
    }

    startStep(stepIndex);
}

function startStep(stepIndex) {
    currentStep = stepIndex;

    // ★ ステップボタンの見た目更新
    const buttons = document.querySelectorAll("#steps-links .step-button");
    buttons.forEach(btn => btn.classList.remove("active"));
    buttons[stepIndex].classList.add("active");

    const video = document.getElementById("origami-video");
    const src = document.getElementById("origami-video-source");

    src.src = `/static/videos/${currentOrigami}_${stepIndex + 1}.mp4`;
    video.load();
    video.classList.remove("hidden");

    document.getElementById("step-control-row").classList.remove("hidden");

    startTimer();
}

function startTimer() {
    stepStartTime = Date.now();

    timer = setInterval(() => {
        const sec = Math.floor((Date.now() - stepStartTime) / 1000);
        document.getElementById("current-step-label").textContent =
            `${currentOrigami}：ステップ ${currentStep + 1}（${sec} 秒）`;
    }, 1000);
}

function recordCurrentStepTime() {
    clearInterval(timer);
    timer = null;

    const label = document.getElementById("current-step-label").textContent;
    const sec = parseInt(label.match(/\d+ 秒/)[0]);

    // ★ ステップ番号に対応して上書き保存
    stepTimes[currentStep] = sec;

    // ★ ✔ マーク付与
    const buttons = document.querySelectorAll("#steps-links .step-button");
    buttons[currentStep].textContent = `ステップ${currentStep + 1} ✔`;
    buttons[currentStep].classList.add("done");
}

document.getElementById("btn-step-finished").addEventListener("click", () => {
    recordCurrentStepTime();

    if (currentStep < 4) {
        // ★ 次のステップへ自動移動
        startStep(currentStep + 1);
    } else {
        alert("さいごのステップだよ！「できた！」をおしてね");
    }
});

// -----------------------------
// 生徒：できた！
// -----------------------------
document.getElementById("btn-finished").addEventListener("click", () => {
    // ★ 5ステップすべて記録されているか確認
    if (stepTimes.every(t => t !== null)) {
        saveAchievement();
    } else {
        alert("まだ見ていないステップがあるよ！");
    }
});

document.getElementById("btn-back-to-start").addEventListener("click", () => {
    show("student-start-screen");
});

// -----------------------------
// 生徒：達成記録保存
// -----------------------------
async function saveAchievement() {
    const body = {
        studentId: currentStudent.studentId,
        studentName: currentStudent.name,
        origami: currentOrigami,
        stepTimes
    };

    await fetch("/api/achievements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
    });

    alert("記録したよ！");
    stepTimes = Array(5).fill(null);
    show("student-done-screen");
}

// -----------------------------
// 先生：メニュー
// -----------------------------
document.getElementById("btn-student-list").addEventListener("click", async () => {
    const res = await fetch("/api/students");
    const students = await res.json();

    const tbody = document.getElementById("student-list-body");
    tbody.innerHTML = "";

    students.forEach(s => {
        const tr = document.createElement("tr");
        tr.innerHTML = `<td>${s.name}</td><td>${s.studentId}</td>`;
        tbody.appendChild(tr);
    });

    show("teacher-student-list-screen");
});

document.getElementById("btn-achievements").addEventListener("click", async () => {
    const res = await fetch("/api/achievements");
    const list = await res.json();

    const ul = document.getElementById("achievement-list");
    ul.innerHTML = "";

    list.reverse().forEach((a, i) => {
        const li = document.createElement("li");
        li.textContent = `${a.studentName} - ${a.origami}`;
        li.addEventListener("click", () => showAchievementDetail(a));
        ul.appendChild(li);
    });

    show("teacher-achievements-screen");
});

// -----------------------------
// 先生：達成詳細
// -----------------------------
function showAchievementDetail(a) {
    document.getElementById("detail-student-name").textContent = a.studentName;
    document.getElementById("detail-date").textContent = a.date;
    document.getElementById("detail-origami").textContent = a.origami;

    const tbody = document.getElementById("detail-steps-body");
    tbody.innerHTML = "";

    a.stepTimes.forEach((t, i) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `<td>${i + 1}</td><td>${t}</td>`;
        tbody.appendChild(tr);
    });

    show("teacher-achievement-detail-screen");
}

document.getElementById("btn-back-achievements").addEventListener("click", () => {
    show("teacher-achievements-screen");
});

// 共通：先生メニューに戻る
document.querySelectorAll(".btn-back-teacher-menu").forEach(btn => {
    btn.addEventListener("click", () => show("teacher-menu-screen"));
});

// -----------------------------
// ★ ログアウト処理（修正版）
// -----------------------------
document.getElementById("logout-btn").addEventListener("click", () => {
    if (confirm("ログアウトしますか？")) {
        window.location.href = "/";
    }
});

// -----------------------------
// ★ 「ちがうものをつくる！」処理
// -----------------------------
document.getElementById("btn-other-origami").addEventListener("click", () => {
    const result = confirm("いまつくっているものをやめて、えらびなおしますか？");

    if (result) {
        // タイマーが動いていたら止める
        if (timer !== null) {
            clearInterval(timer);
            timer = null;
        }

        // stepTimes をリセット
        stepTimes = Array(5).fill(null);

        // 折り紙選択画面へ戻る
        show("student-select-origami");
    }
    // 「いいえ」の場合は何もしない
});
