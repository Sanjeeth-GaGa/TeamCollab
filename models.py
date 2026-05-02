from flask_sqlalchemy import SQLAlchemy
from flask_login import UserMixin
from datetime import datetime

db = SQLAlchemy()


class User(UserMixin, db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    nickname = db.Column(db.String(80), nullable=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    role = db.Column(db.String(40), default="member")  # admin / member
    avatar_color = db.Column(db.String(20), default="#7c3aed")
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    tasks_assigned = db.relationship(
        "Task", foreign_keys="Task.assigned_to_id", backref="assignee", lazy=True
    )
    tasks_created = db.relationship(
        "Task", foreign_keys="Task.created_by_id", backref="creator", lazy=True
    )
    messages = db.relationship("Message", backref="author", lazy=True)

    def to_dict(self):
        return {
            "id": self.id,
            "username": self.username,
            "nickname": self.nickname or self.username,
            "email": self.email,
            "role": self.role,
            "avatar_color": self.avatar_color,
        }


class Task(db.Model):
    __tablename__ = "tasks"

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, default="")
    status = db.Column(
        db.String(30), default="todo"
    )  # todo / in_progress / done / blocked
    priority = db.Column(
        db.String(20), default="medium"
    )  # low / medium / high / critical
    team_tag = db.Column(db.String(60), default="General")
    due_date = db.Column(db.String(20), nullable=True)

    assigned_to_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True)
    created_by_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(
        db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "description": self.description,
            "status": self.status,
            "priority": self.priority,
            "team_tag": self.team_tag,
            "due_date": self.due_date,
            "assigned_to_id": self.assigned_to_id,
            "assignee_name": self.assignee.nickname if self.assignee else "Unassigned",
            "assignee_color": self.assignee.avatar_color if self.assignee else "#64748b",
            "created_by_id": self.created_by_id,
            "creator_name": self.creator.username if self.creator else "Unknown",
            "created_at": self.created_at.strftime("%Y-%m-%d %H:%M") if self.created_at else "",
            "updated_at": self.updated_at.strftime("%Y-%m-%d %H:%M") if self.updated_at else "",
        }


class Message(db.Model):
    __tablename__ = "messages"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    content = db.Column(db.Text, nullable=False)
    room = db.Column(db.String(60), default="general")
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "username": self.author.nickname or self.author.username,
            "avatar_color": self.author.avatar_color,
            "content": self.content,
            "room": self.room,
            "timestamp": self.timestamp.strftime("%H:%M"),
        }
