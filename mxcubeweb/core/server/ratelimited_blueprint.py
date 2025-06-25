import time
from threading import Lock

from flask import Blueprint, jsonify, request

_request_times = {}
_request_times_lock = Lock()


def _get_user_identifier():
    """
    Returns a unique identifier for the current user.
    Uses 'X-User-Id' header if present, else client IP.
    """
    user_id = request.headers.get("X-User-Id")
    if user_id:
        return user_id
    return request.remote_addr or "unknown"


class RateLimitedBlueprint(Blueprint):
    """
    Flask Blueprint that applies rate limiting to all its routes.

    Usage:
    - Use this instead of 'Blueprint' to enable per-blueprint rate limiting.
    - All endpoints share the same rate limit policy.

    Args:
    - rate_limit: max requests per user per endpoint per period.
    - rate_period: period duration in seconds.
    """

    _test_mode = False

    def __init__(self, *args, rate_limit=60, rate_period=60, test=False, **kwargs):
        super().__init__(*args, **kwargs)
        self._rate_limit = rate_limit
        self._rate_period = rate_period
        self._testing = test

        if not self._testing:
            self.before_request(self._apply_rate_limit)

    def _apply_rate_limit(self):
        """
        Runs before each request; returns 429 if rate limit exceeded.
        """
        if self._testing:
            return None

        identifier = _get_user_identifier()
        now = time.time()
        window_start = now - self._rate_period
        endpoint = request.endpoint or "unknown"
        key = (identifier, endpoint)

        with _request_times_lock:
            times = _request_times.get(key, [])
            times = [t for t in times if t > window_start]
            if len(times) >= self._rate_limit:
                retry_after = int(times[0] + self._rate_period - now)
                return jsonify(
                    {"error": "Rate limit exceeded", "retry_after": retry_after}
                ), 429
            times.append(now)
            _request_times[key] = times

            if not times:
                del _request_times[key]
            else:
                _request_times[key] = times

        return None

    @classmethod
    def enable_test_mode(cls):
        """Disable rate limiting for testing"""
        cls._test_mode = True

    @classmethod
    def clear_state(cls):
        """Clear rate limiter state"""
        with _request_times_lock:
            _request_times.clear()
