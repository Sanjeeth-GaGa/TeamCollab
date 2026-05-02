from flask import Flask, render_template, request, jsonify, redirect, url_for, flash
from flask_socketio import SocketIO
from flask_login import LoginManager, login_user, logout_user, login_required, current_user
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime, timedelta
from collections import defaultdict
from models import db, User, Task, Message
from events import register_events
import os

# ─── App Factory ──────────────────────────────────────────────────────────────
app = Flask(__name__)
app.config["SECRET_KEY"] = os.environ.get("SECRET_KEY", "synctask-secret-key-2025")
app.config["SQLALCHEMY_DATABASE_URI"] = os.environ.get("DATABASE_URL", "sqlite:///team_platform.db")
# Fix for Heroku/CloudRun style Postgres URLs
if app.config["SQLALCHEMY_DATABASE_URI"].startswith("postgres://"):
    app.config["SQLALCHEMY_DATABASE_URI"] = app.config["SQLALCHEMY_DATABASE_URI"].replace("postgres://", "postgresql://", 1)
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

db.init_app(app)

socketio = SocketIO(app, cors_allowed_origins="*", async_mode="eventlet")
register_events(socketio)

login_manager = LoginManager(app)
login_manager.login_view = "login"
login_manager.login_message = "Please log in to access SyncTask."

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))


# ─── System Routes ────────────────────────────────────────────────────────────
@app.route("/health")
def health():
    return jsonify({"status": "healthy", "timestamp": datetime.utcnow().isoformat()})

@app.route("/test-suite")
def test_suite():
    # Simple test suite for Cloud Run verification
    results = {
        "database": "ok",
        "socketio": "initialized",
        "users_count": User.query.count(),
        "tasks_count": Task.query.count()
    }
    return jsonify(results)


# ─── Auth Routes ──────────────────────────────────────────────────────────────
@app.route("/")
def index():
    if current_user.is_authenticated:
        return redirect(url_for("dashboard"))
    return redirect(url_for("login"))


@app.route("/login", methods=["GET", "POST"])
def login():
    if current_user.is_authenticated:
        return redirect(url_for("dashboard"))
    if request.method == "POST":
        email = request.form.get("email", "").strip()
        password = request.form.get("password", "")
        user = User.query.filter_by(email=email).first()
        if user and check_password_hash(user.password_hash, password):
            login_user(user)
            return redirect(url_for("dashboard"))
        flash("Invalid email or password.", "error")
    return render_template("login.html")


@app.route("/register", methods=["GET", "POST"])
def register():
    if current_user.is_authenticated:
        return redirect(url_for("dashboard"))
    if request.method == "POST":
        username = request.form.get("username", "").strip()
        nickname = request.form.get("nickname", "").strip()
        email = request.form.get("email", "").strip()
        password = request.form.get("password", "")
        if User.query.filter_by(email=email).first():
            flash("Email already registered.", "error")
        elif User.query.filter_by(username=username).first():
            flash("Username already taken.", "error")
        else:
            colors = ["#7c3aed", "#0ea5e9", "#f59e0b", "#10b981", "#ef4444", "#ec4899"]
            color = colors[User.query.count() % len(colors)]
            role = "admin" if User.query.count() == 0 else "member"
            user = User(
                username=username,
                nickname=nickname or username,
                email=email,
                password_hash=generate_password_hash(password),
                role=role,
                avatar_color=color,
            )
            db.session.add(user)
            db.session.commit()
            login_user(user)
            return redirect(url_for("dashboard"))
    return render_template("register.html")


@app.route("/logout")
@login_required
def logout():
    logout_user()
    return redirect(url_for("login"))


# ─── Main Pages ───────────────────────────────────────────────────────────────
@app.route("/dashboard")
@login_required
def dashboard():
    users = User.query.all()
    tasks = Task.query.all()

    # Status counts
    status_counts = defaultdict(int)
    for t in tasks:
        status_counts[t.status] += 1

    # Priority counts
    priority_counts = defaultdict(int)
    for t in tasks:
        priority_counts[t.priority] += 1

    # Per-user workload
    user_task_counts = {}
    for u in users:
        user_task_counts[u.nickname or u.username] = len(u.tasks_assigned)

    # Tasks created last 7 days
    today = datetime.utcnow().date()
    daily_counts = {}
    for i in range(6, -1, -1):
        d = today - timedelta(days=i)
        daily_counts[d.strftime("%b %d")] = 0
    for t in tasks:
        if t.created_at:
            d = t.created_at.date()
            key = d.strftime("%b %d")
            if key in daily_counts:
                daily_counts[key] += 1

    # User x Priority matrix
    user_priority_matrix = {}
    for u in users:
        user_priority_matrix[u.nickname or u.username] = {"low": 0, "medium": 0, "high": 0, "critical": 0}
    for t in tasks:
        if t.assignee:
            uname = t.assignee.nickname or t.assignee.username
            if uname in user_priority_matrix:
                user_priority_matrix[uname][t.priority] = user_priority_matrix[uname].get(t.priority, 0) + 1

    # Overdue tasks
    overdue = 0
    today_str = today.strftime("%Y-%m-%d")
    for t in tasks:
        if t.due_date and t.due_date < today_str and t.status != "done":
            overdue += 1

    return render_template(
        "dashboard.html",
        users=users,
        total_tasks=len(tasks),
        in_progress=status_counts.get("in_progress", 0),
        completed=status_counts.get("done", 0),
        overdue=overdue,
        status_counts=dict(status_counts),
        priority_counts=dict(priority_counts),
        user_task_counts=user_task_counts,
        daily_counts=daily_counts,
        user_priority_matrix=user_priority_matrix,
    )


@app.route("/tasks")
@login_required
def tasks_page():
    users = User.query.all()
    return render_template("tasks.html", users=users)


@app.route("/my-tasks")
@login_required
def my_tasks_page():
    tasks = Task.query.filter_by(assigned_to_id=current_user.id).all()
    done_cnt = sum(1 for t in tasks if t.status == "done")
    total = len(tasks)
    rate = round((done_cnt / total * 100) if total > 0 else 0)
    return render_template("my_tasks.html", tasks=tasks, done_cnt=done_cnt, total=total, rate=rate, today=datetime.utcnow().date().strftime("%Y-%m-%d"))


@app.route("/chat")
@login_required
def chat():
    return render_template("chat.html")


@app.route("/users")
@login_required
def users_page():
    if current_user.role != "admin":
        flash("Admin access required.", "error")
        return redirect(url_for("dashboard"))
    users = User.query.all()
    return render_template("users.html", users=users)


# ─── Task API ─────────────────────────────────────────────────────────────────
@app.route("/api/tasks", methods=["GET"])
@login_required
def get_tasks():
    q = Task.query
    if request.args.get("user_id"):
        q = q.filter_by(assigned_to_id=int(request.args["user_id"]))
    if request.args.get("priority"):
        q = q.filter_by(priority=request.args["priority"])
    if request.args.get("team_tag"):
        q = q.filter_by(team_tag=request.args["team_tag"])
    tasks = q.order_by(Task.created_at.desc()).all()
    return jsonify([t.to_dict() for t in tasks])


@app.route("/api/tasks", methods=["POST"])
@login_required
def create_task():
    data = request.json
    task = Task(
        title=data["title"],
        description=data.get("description", ""),
        status=data.get("status", "todo"),
        priority=data.get("priority", "medium"),
        team_tag=data.get("team_tag", "General"),
        due_date=data.get("due_date"),
        assigned_to_id=data.get("assigned_to_id") or None,
        created_by_id=current_user.id,
    )
    db.session.add(task)
    db.session.commit()
    socketio.emit("task_update", task.to_dict(), broadcast=True)
    return jsonify(task.to_dict()), 201


@app.route("/api/tasks/<int:task_id>", methods=["PATCH"])
@login_required
def update_task(task_id):
    task = Task.query.get_or_404(task_id)
    data = request.json
    for field in ["title", "description", "status", "priority", "team_tag", "due_date", "assigned_to_id"]:
        if field in data:
            setattr(task, field, data[field] if data[field] != "" else None if field == "assigned_to_id" else data[field])
    task.updated_at = datetime.utcnow()
    db.session.commit()
    socketio.emit("task_update", task.to_dict(), broadcast=True)
    return jsonify(task.to_dict())


@app.route("/api/tasks/<int:task_id>", methods=["DELETE"])
@login_required
def delete_task(task_id):
    task = Task.query.get_or_404(task_id)
    db.session.delete(task)
    db.session.commit()
    socketio.emit("task_deleted", {"id": task_id}, broadcast=True)
    return jsonify({"ok": True})


# ─── User API ─────────────────────────────────────────────────────────────────
@app.route("/api/users", methods=["GET"])
@login_required
def get_users():
    return jsonify([u.to_dict() for u in User.query.all()])


@app.route("/api/users/<int:user_id>/role", methods=["PATCH"])
@login_required
def update_user_role(user_id):
    if current_user.role != "admin":
        return jsonify({"error": "Forbidden"}), 403
    user = User.query.get_or_404(user_id)
    data = request.json
    user.role = data.get("role", user.role)
    db.session.commit()
    return jsonify(user.to_dict())


@app.route("/api/users/<int:user_id>", methods=["DELETE"])
@login_required
def delete_user(user_id):
    if current_user.role != "admin":
        return jsonify({"error": "Forbidden"}), 403
    if user_id == current_user.id:
        return jsonify({"error": "Cannot delete yourself"}), 400
    user = User.query.get_or_404(user_id)
    db.session.delete(user)
    db.session.commit()
    return jsonify({"ok": True})


# ─── Seed Demo Data ───────────────────────────────────────────────────────────
@app.route("/seed")
def seed():
    if User.query.count() > 0:
        return "Already seeded."

    colors = ["#7c3aed", "#0ea5e9", "#f59e0b", "#10b981", "#ef4444"]
    demo_users = [
        ("alice", "Alice", "alice@demo.com", "password", "admin", colors[0]),
        ("bob", "Bob the Builder", "bob@demo.com", "password", "member", colors[1]),
        ("carol", "Carol", "carol@demo.com", "password", "member", colors[2]),
        ("dave", "Dave", "dave@demo.com", "password", "member", colors[3]),
    ]
    users = []
    for username, nickname, email, pw, role, color in demo_users:
        u = User(username=username, nickname=nickname, email=email, password_hash=generate_password_hash(pw), role=role, avatar_color=color)
        db.session.add(u)
        users.append(u)
    db.session.flush()

    demo_tasks = [
        ("Set up CI/CD pipeline", "Configure GitHub Actions for automated testing.", "in_progress", "high", "DevOps", users[0].id, users[1].id, "2025-05-20"),
        ("Design onboarding flow", "Create wireframes for new user onboarding.", "todo", "medium", "Design", users[0].id, users[2].id, "2025-05-15"),
        ("Fix login bug", "Users unable to login on mobile Safari.", "in_progress", "critical", "Dev", users[1].id, users[1].id, "2025-05-10"),
        ("Write API docs", "Document all REST endpoints in Swagger.", "todo", "low", "Dev", users[0].id, users[3].id, "2025-05-25"),
        ("User testing session", "Organize and run Q2 user testing.", "done", "medium", "General", users[2].id, users[2].id, "2025-05-05"),
        ("Performance audit", "Run Lighthouse audit and address issues.", "blocked", "high", "Dev", users[1].id, users[0].id, "2025-05-12"),
        ("Update color palette", "Refresh the design system with new brand colors.", "done", "low", "Design", users[2].id, users[2].id, "2025-04-30"),
        ("Deploy to staging", "Push latest build to staging environment.", "todo", "high", "DevOps", users[3].id, users[3].id, "2025-05-18"),
        ("Sprint planning", "Prepare backlog for Q3 sprint planning.", "todo", "medium", "General", users[0].id, users[0].id, "2025-05-22"),
        ("Database migration", "Migrate schema to v2 with zero downtime.", "in_progress", "critical", "Dev", users[1].id, users[1].id, "2025-05-14"),
    ]
    for title, desc, status, priority, tag, created_by_id, assigned_to_id, due in demo_tasks:
        t = Task(title=title, description=desc, status=status, priority=priority,
                 team_tag=tag, created_by_id=created_by_id, assigned_to_id=assigned_to_id, due_date=due)
        db.session.add(t)

    db.session.commit()
    return redirect(url_for("login"))


# ─── Entry Point ──────────────────────────────────────────────────────────────
if __name__ == "__main__":
    with app.app_context():
        db.create_all()
    port = int(os.environ.get("PORT", 5000))
    socketio.run(app, debug=True, host="0.0.0.0", port=port)
