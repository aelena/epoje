"""
In-memory rate limiting for production mode.

Single-process only (state is lost on restart), which is fine for one small
server. The global daily cap is the spending guard: whatever happens, the
server stops calling the LLM after that many generations per UTC day.
"""
import time
from collections import defaultdict, deque
from datetime import datetime, timezone


class RateLimiter:
    def __init__(self, per_minute: int, per_day: int, global_per_day: int):
        self.per_minute = per_minute
        self.per_day = per_day
        self.global_per_day = global_per_day
        self._recent: dict[str, deque] = defaultdict(deque)  # ip -> timestamps (last 60s)
        self._daily: dict[str, int] = defaultdict(int)       # ip -> count today
        self._global = 0
        self._day = self._today()

    @staticmethod
    def _today() -> str:
        return datetime.now(timezone.utc).date().isoformat()

    @staticmethod
    def _seconds_to_midnight() -> int:
        now = datetime.now(timezone.utc)
        return 86400 - (now.hour * 3600 + now.minute * 60 + now.second)

    def check(self, ip: str) -> int:
        """Record a request. Returns 0 if allowed, else seconds until retry."""
        if self._today() != self._day:
            self._day = self._today()
            self._daily.clear()
            self._global = 0

        if self._global >= self.global_per_day or self._daily[ip] >= self.per_day:
            return self._seconds_to_midnight()

        now = time.monotonic()
        recent = self._recent[ip]
        while recent and now - recent[0] > 60:
            recent.popleft()
        if len(recent) >= self.per_minute:
            return int(60 - (now - recent[0])) + 1

        recent.append(now)
        self._daily[ip] += 1
        self._global += 1

        # Drop idle IPs so the dict doesn't grow forever
        if len(self._recent) > 10_000:
            for key in [k for k, q in self._recent.items() if not q or now - q[-1] > 60]:
                del self._recent[key]

        return 0
