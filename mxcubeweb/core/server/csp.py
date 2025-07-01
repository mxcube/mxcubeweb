class CSPMiddleware:
    """
    Middleware to add Content Security Policy headers to responses.
    """

    def __init__(self, app, config):
        self.app = app
        self.config = config
        self.enabled = config.get("CSP_ENABLED", True)
        self.policy = config.get("CSP_POLICY", {})
        self.report_only = config.get("CSP_REPORT_ONLY", False)
        self.report_uri = config.get("CSP_REPORT_URI", "")

    def __call__(self, environ, start_response):
        if not self.enabled:
            return self.app(environ, start_response)

        def _start_response(status, headers, exc_info=None):
            if self.enabled:
                policy_str = self._build_policy_string()
                header_name = (
                    "Content-Security-Policy-Report-Only"
                    if self.report_only
                    else "Content-Security-Policy"
                )
                headers.append((header_name, policy_str))

            return start_response(status, headers, exc_info)

        return self.app(environ, _start_response)

    def _build_policy_string(self) -> str:
        parts = []

        for directive, sources in self.policy.items():
            if sources:
                parts.append(f"{directive} {' '.join(sources)}")

        if self.report_uri:
            parts.append(f"report-uri {self.report_uri}")

        return "; ".join(parts)
