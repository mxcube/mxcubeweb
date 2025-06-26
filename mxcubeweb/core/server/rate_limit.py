def conditional_rate_limit(server, limit_str):
    def decorator(f):
        limiter = getattr(server, "limiter", None)
        if limiter and getattr(limiter, "limit", None):
            return limiter.limit(limit_str)(f)
        return f
    return decorator