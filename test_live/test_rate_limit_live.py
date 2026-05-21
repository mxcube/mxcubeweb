from __future__ import annotations

import argparse
import json
import os
import sys
import warnings

import pytest
import requests
import urllib3


@pytest.fixture(scope="module")
def live_config(request):
    host = request.config.getoption("--live-host", default="localhost")
    port = request.config.getoption("--live-port", default="8081")
    count = int(request.config.getoption("--live-count", default="15"))
    scheme = request.config.getoption("--live-scheme", default="http")
    ca_cert = request.config.getoption("--live-ca-cert", default=None)
    no_verify = request.config.getoption("--live-no-verify", default=False)
    return {"host": host, "port": port, "count": count, "scheme": scheme,
            "ca_cert": ca_cert, "no_verify": no_verify}


@pytest.fixture(scope="module")
def base_url(live_config):
    return f"{live_config['scheme']}://{live_config['host']}:{live_config['port']}"


@pytest.fixture(scope="module")
def target_url(base_url):
    return f"{base_url}/mxcube/api/v0.1/login/auth"


@pytest.fixture(scope="module")
def probe_url(base_url):
    """Unauthenticated API endpoint used for connectivity checks."""
    return f"{base_url}/mxcube/api/v0.1/login/login_info"


@pytest.fixture(scope="module")
def ssl_verify(live_config):
    """SSL verification: False (--no-verify), CA bundle path, or True (system CAs)."""
    if live_config["no_verify"]:
        warnings.warn(
            "\033[33m[SECURITY WARNING]\033[0m TLS certificate verification is DISABLED "
            "(--live-no-verify). Do not use against production systems.",
            stacklevel=1,
        )
        urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
        return False
    ca_cert = live_config["ca_cert"]
    if ca_cert is not None:
        if not os.path.exists(ca_cert):
            pytest.fail(
                f"CA certificate file not found: {ca_cert!r}\n"
                "Pass the correct path with --live-ca-cert, or use --live-no-verify "
                "to skip certificate verification (INSECURE)."
            )
        return ca_cert
    return True


@pytest.fixture(scope="module")
def server_reachable(probe_url, ssl_verify):
    """Skip the whole module when the server is not up."""
    try:
        r = requests.get(probe_url, timeout=5, verify=ssl_verify)
        return r.status_code
    except requests.ConnectionError:
        pytest.skip(f"MXCubeWeb server not reachable at {probe_url}")


def _get(url: str, **kwargs) -> requests.Response:
    return requests.get(url, headers={"Accept": "application/json"}, timeout=10, **kwargs)



def test_connectivity(server_reachable):
    """Server must respond with a non-connection-error HTTP code."""
    assert server_reachable != 0, "Server returned HTTP 000 (connection failed)"


def test_rate_limit_headers_present(server_reachable, target_url, ssl_verify):
    """X-RateLimit-* headers must be present (RATELIMIT_HEADERS_ENABLED=True)."""
    response = _get(target_url, verify=ssl_verify)

    for header in ("X-RateLimit-Limit", "X-RateLimit-Remaining", "X-RateLimit-Reset"):
        assert header in response.headers, (
            f"Missing header: {header} — check that RATELIMIT_HEADERS_ENABLED is True"
        )


def test_rate_limit_header_values(server_reachable, target_url, ssl_verify):
    """X-RateLimit-Limit and X-RateLimit-Remaining must be non-negative integers."""
    response = _get(target_url, verify=ssl_verify)

    limit = int(response.headers.get("X-RateLimit-Limit", -1))
    remaining = int(response.headers.get("X-RateLimit-Remaining", -1))

    assert limit > 0, f"X-RateLimit-Limit is not positive: {limit}"
    assert remaining >= 0, f"X-RateLimit-Remaining is negative: {remaining}"
    assert remaining <= limit, (
        f"Remaining ({remaining}) > Limit ({limit}) — unexpected state"
    )


def test_hammer_triggers_429(server_reachable, target_url, live_config, ssl_verify):
    """
    Send COUNT rapid requests; at least one must return 429.

    This test only passes when RATELIMIT_DEFAULT is set low enough
    (e.g. '<COUNT> per minute').  With the production default
    ('150000 per day; 6000 per hour') it will produce a clear skip message.
    """
    count = live_config["count"]
    statuses = []

    for _ in range(count):
        r = _get(target_url, verify=ssl_verify)
        statuses.append(r.status_code)
        if r.status_code == 429:
            break

    if 429 not in statuses:
        pytest.skip(
            f"No 429 after {count} requests — lower RATELIMIT_DEFAULT to "
            f"'{count} per minute' in the server config to trigger the limit"
        )


def test_429_response_body(server_reachable, target_url, live_config, ssl_verify):
    """
    When rate-limited, the body must be JSON with 'error' and 'message' keys.
    """
    count = live_config["count"]
    last_response = None

    for _ in range(count):
        r = _get(target_url, verify=ssl_verify)
        if r.status_code == 429:
            last_response = r
            break

    if last_response is None:
        pytest.skip(
            f"No 429 triggered after {count} requests — "
            "lower RATELIMIT_DEFAULT to test the response body"
        )

    try:
        body = last_response.json()
    except ValueError:
        pytest.fail(f"429 response body is not valid JSON: {last_response.text!r}")

    assert "error" in body, f"'error' key missing from 429 body: {body}"
    assert "message" in body, f"'message' key missing from 429 body: {body}"
    assert body["error"] == "Too many requests", f"Unexpected error value: {body['error']}"



def _run_standalone(
    host: str, port: str, count: int, scheme: str = "http",
    ca_cert: str | None = None, no_verify: bool = False
) -> int:
    base = f"{scheme}://{host}:{port}"
    probe = f"{base}/mxcube/api/v0.1/login/login_info"
    target = f"{base}/mxcube/api/v0.1/login/auth"

    if no_verify:
        print("\033[33m[SECURITY WARNING]\033[0m TLS certificate verification is DISABLED "
              "(--no-verify). Do not use against production systems.")
        urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
        ssl_verify: str | bool = False
    elif ca_cert:
        if not os.path.exists(ca_cert):
            print(f"\033[31m[ERROR]\033[0m CA certificate file not found: {ca_cert!r}")
            print("       Pass the correct path with --ca-cert, or use -k/--no-verify "
                  "to skip certificate verification (INSECURE).")
            return 1
        ssl_verify = ca_cert
    else:
        ssl_verify = True
    failures = 0

    def ok(msg):
        print(f"\033[32m[PASS]\033[0m {msg}")

    def bad(msg):
        nonlocal failures
        failures += 1
        print(f"\033[31m[FAIL]\033[0m {msg}")

    def info(msg):
        print(f"\033[36m[INFO]\033[0m {msg}")

    def warn(msg):
        print(f"\033[33m[WARN]\033[0m {msg}")

    print()
    print("━" * 51)
    print("  MXCubeWeb Rate-Limiter Integration Test")
    print(f"  Target  : {target}")
    print(f"  Requests: {count}")
    print("━" * 51)
    print()

    info(f"TEST 1 — Connectivity to {probe} ...")
    try:
        r = requests.get(probe, timeout=5, verify=ssl_verify)
        ok(f"Server reachable (HTTP {r.status_code})")
    except requests.ConnectionError as exc:
        bad(f"Cannot reach {probe} — is the server running? ({exc})")
        return 1

    info("TEST 2 — Rate-limit response headers ...")
    r = _get(target, verify=ssl_verify)
    for header in ("X-RateLimit-Limit", "X-RateLimit-Remaining", "X-RateLimit-Reset"):
        if header in r.headers:
            ok(f"Header present — {header}: {r.headers[header]}")
        else:
            bad(f"Missing header: {header}")

    info(f"TEST 3 — Hammer: {count} rapid requests ...")
    warn(f"  (Lower RATELIMIT_DEFAULT to '{count} per minute' to trigger reliably)")
    got_429 = False
    for i in range(1, count + 1):
        r = _get(target, verify=ssl_verify)
        label = f"\033[31m← rate limited\033[0m" if r.status_code == 429 else "(ok)"
        print(f"  req {i:>3}: HTTP {r.status_code}  {label}")
        if r.status_code == 429:
            got_429 = True
            last_429 = r
            break

    print()
    if got_429:
        ok("Rate limiter triggered — 429 returned as expected")
    else:
        warn(f"No 429 after {count} requests — raise count or lower server limit")

    # 4 — 429 body
    info("TEST 4 — 429 response body ...")
    if got_429:
        try:
            body = last_429.json()
            assert "error" in body and "message" in body
            ok(f"Valid JSON body — error: {body['error']!r}")
        except (ValueError, AssertionError) as exc:
            bad(f"Unexpected 429 body: {exc}")
    else:
        warn("Skipped (no 429 triggered — see TEST 3)")

    print()
    print("━" * 51)
    if failures == 0:
        ok("All checks passed.")
    else:
        bad(f"{failures} check(s) failed.")
    print("━" * 51)
    print()
    return failures


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="MXCubeWeb rate-limiter integration test (standalone)"
    )
    parser.add_argument("-H", "--host", default="localhost", help="Target host (default: localhost)")
    parser.add_argument("-p", "--port", default="8081", help="Target port (default: 8081)")
    parser.add_argument("-s", "--scheme", default="http", choices=["http", "https"],
                        help="URL scheme (default: http)")
    parser.add_argument("--ca-cert", default=None, metavar="PATH",
                        help="Path to CA bundle for self-signed certificates (https only)")
    parser.add_argument("-k", "--no-verify", action="store_true", default=False,
                        help="Disable TLS certificate verification (INSECURE — lab/pentest use only)")
    parser.add_argument(
        "-n", "--count", type=int, default=15,
        help="Requests to send in the hammer test (default: 15)"
    )
    args = parser.parse_args()
    sys.exit(_run_standalone(args.host, args.port, args.count, args.scheme, args.ca_cert, args.no_verify))
