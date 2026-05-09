from flask import Flask, render_template, jsonify, request
import json
import os
from datetime import datetime

app = Flask(__name__)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ACCOUNTS_FILE = os.path.join(BASE_DIR, "accounts.json")
STUDENTS_FILE = os.path.join(BASE_DIR, "students.json")
ACHIEVEMENTS_FILE = os.path.join(BASE_DIR, "achievements.json")

def load_json(path):
    if not os.path.exists(path):
        return []
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)

def save_json(path, data):
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

@app.route("/")
def index():
    return render_template("index.html")

# -----------------------------
# ログイン
# -----------------------------
@app.route("/api/login", methods=["POST"])
def api_login():
    data = request.json
    user_id = data.get("id")
    password = data.get("password")

    accounts = load_json(ACCOUNTS_FILE)
    students = load_json(STUDENTS_FILE)

    for acc in accounts:
        if acc["id"] == user_id and acc["password"] == password:

            # 生徒ログイン
            if acc["role"] == "student":
                stu = next(s for s in students if s["studentId"] == acc["studentId"])
                return jsonify({
                    "role": "student",
                    "student": {
                        "studentId": stu["studentId"],
                        "name": stu["name"]
                    }
                })

            # 先生ログイン
            if acc["role"] == "teacher":
                return jsonify({
                    "role": "teacher",
                    "teacher": {
                        "teacherId": acc["teacherId"],
                        "name": acc["id"]
                    }
                })

    return jsonify({"error": "invalid"}), 401

# -----------------------------
# 生徒一覧
# -----------------------------
@app.route("/api/students")
def api_students():
    students = load_json(STUDENTS_FILE)
    return jsonify(students)

# -----------------------------
# 達成記録取得
# -----------------------------
@app.route("/api/achievements", methods=["GET"])
def api_get_achievements():
    achievements = load_json(ACHIEVEMENTS_FILE)
    return jsonify(achievements)

# -----------------------------
# 達成記録保存
# -----------------------------
@app.route("/api/achievements", methods=["POST"])
def api_add_achievement():
    data = request.json
    achievements = load_json(ACHIEVEMENTS_FILE)

    if not data.get("date"):
        data["date"] = datetime.now().strftime("%Y-%m-%d")

    achievements.append(data)
    save_json(ACHIEVEMENTS_FILE, achievements)

    return jsonify({"success": True})

if __name__ == "__main__":
    app.run(debug=True)
