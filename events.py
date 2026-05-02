from flask_socketio import emit, join_room, leave_room
from flask_login import current_user
from models import db, Message
from datetime import datetime


def register_events(socketio):

    @socketio.on("join")
    def on_join(data):
        room = data.get("room", "general")
        join_room(room)
        display_name = current_user.nickname or current_user.username
        emit(
            "status",
            {
                "msg": f"{display_name} has joined the room.",
                "type": "system",
                "timestamp": datetime.utcnow().strftime("%H:%M"),
            },
            to=room,
        )

    @socketio.on("leave")
    def on_leave(data):
        room = data.get("room", "general")
        leave_room(room)
        display_name = current_user.nickname or current_user.username
        emit(
            "status",
            {
                "msg": f"{display_name} has left the room.",
                "type": "system",
                "timestamp": datetime.utcnow().strftime("%H:%M"),
            },
            to=room,
        )

    @socketio.on("send_message")
    def handle_message(data):
        room = data.get("room", "general")
        content = data.get("content", "").strip()
        if not content:
            return

        msg = Message(user_id=current_user.id, content=content, room=room)
        db.session.add(msg)
        db.session.commit()

        display_name = current_user.nickname or current_user.username
        emit(
            "receive_message",
            {
                "id": msg.id,
                "username": display_name,
                "avatar_color": current_user.avatar_color,
                "content": content,
                "room": room,
                "timestamp": msg.timestamp.strftime("%H:%M"),
                "mine": False,
            },
            to=room,
        )
