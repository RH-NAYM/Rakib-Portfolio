"""
Session Store — In-memory conversation history per session.
Production note: swap `_store` with Redis for multi-instance deployments.
"""
import time
import uuid
from typing import Optional
from collections import OrderedDict

# Max messages to keep per session (controls context window size)
MAX_HISTORY_MESSAGES = 20
# Session TTL in seconds (1 hour)
SESSION_TTL = 3600
# Max concurrent sessions (prevents memory bloat)
MAX_SESSIONS = 500


class SessionStore:
    """
    Thread-safe in-memory session store with LRU eviction and TTL.
    For production: replace with Redis + asyncio-redis.
    """

    def __init__(
        self,
        max_sessions: int = MAX_SESSIONS,
        ttl_seconds: int = SESSION_TTL,
        max_messages: int = MAX_HISTORY_MESSAGES,
    ):
        self._store: OrderedDict[str, dict] = OrderedDict()
        self.max_sessions = max_sessions
        self.ttl = ttl_seconds
        self.max_messages = max_messages

    def create_session(self) -> str:
        """Create a new session, return session_id."""
        session_id = str(uuid.uuid4())
        self._evict_expired()

        # LRU eviction if at capacity
        if len(self._store) >= self.max_sessions:
            self._store.popitem(last=False)

        self._store[session_id] = {
            "messages": [],
            "created_at": time.time(),
            "last_active": time.time(),
            "message_count": 0,
        }
        return session_id

    def get_session(self, session_id: str) -> Optional[dict]:
        """Retrieve session data, None if expired/missing."""
        if session_id not in self._store:
            return None

        session = self._store[session_id]

        # TTL check
        if time.time() - session["last_active"] > self.ttl:
            del self._store[session_id]
            return None

        # Move to end (LRU update)
        self._store.move_to_end(session_id)
        return session

    def get_history(self, session_id: str) -> list[dict]:
        """Get conversation history for a session."""
        session = self.get_session(session_id)
        if not session:
            return []
        return session["messages"]

    def add_message(self, session_id: str, role: str, content: str) -> bool:
        """
        Add a message to session history.
        role: 'user' | 'assistant'
        Returns False if session doesn't exist.
        """
        session = self.get_session(session_id)
        if not session:
            return False

        session["messages"].append({"role": role, "content": content})
        session["last_active"] = time.time()
        session["message_count"] += 1

        # Trim history: keep system context + recent messages
        # Always keep pairs (user+assistant) so we don't break context
        if len(session["messages"]) > self.max_messages:
            # Drop oldest pair
            session["messages"] = session["messages"][-self.max_messages :]

        return True

    def session_exists(self, session_id: str) -> bool:
        session = self.get_session(session_id)
        return session is not None

    def _evict_expired(self):
        """Remove sessions past TTL."""
        now = time.time()
        expired = [
            sid
            for sid, data in self._store.items()
            if now - data["last_active"] > self.ttl
        ]
        for sid in expired:
            del self._store[sid]

    def stats(self) -> dict:
        """Return store statistics for monitoring."""
        return {
            "active_sessions": len(self._store),
            "max_sessions": self.max_sessions,
        }


# Singleton instance — imported by app.py
session_store = SessionStore()
