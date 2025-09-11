### 1. PHP EXTENSION WITH PARAMETERS
```
> site:example.com ext:php inurl:?
```

### 2. ASPX EXTENSION WITH PARAMETERS
```
> site:example.com ext:aspx inurl:?
```

### 3. ASP EXTENSION WITH PARAMETERS
```
> site:example.com ext:asp inurl:?
```

### 4. JSP EXTENSION WITH PARAMETERS
```
> site:example.com ext:jsp inurl:?
```

### 4. JSPX EXTENSION WITH PARAMETERS
```
> site:example.com ext:jspx inurl:?
```

### 5. ENDPOINTS
```
> site:example.com inurl:=

> site:example.com inurl:&
```

### 6. FORM
```
> site:example.com intitle:"Submit Feedback" | intitle:"Contact us" | intitle:"Join Our Waitlist" | intitle:"Subscribe" | intitle:"Newsletter" | intitle:"Unsubscribe" | intitle:"Email Support" | intitle:"Customer Support"
```

### 7. LOGIN
```
> site:example.com inurl:login | inurl:signin | intitle:Login | intitle:"sign in" | inurl:auth | inurl:/register

> site:example.com inurl:login | inurl:logon | inurl:sign-in | inurl:signin | inurl:portal
```

### 8. PORTS
```
> site:example.com inurl:"8443/login.jsp"

> site:example.com:8888
```

### 9. UPLOAD
```
> site:example.com "choose file"
```

### 10. INDEX
```
> site:example.com intext:"index of" "parent directory"

> site:example.com intitle:index.of

> site:example.com intitle:"Index of" wp-admin

> site:example.com intext:"Index of /" +.htaccess
```

### 11. SWAGGER-UI
```
> site:example.com intitle:"Swagger UI" | inurl:"index.html" | inurl:"swagger" | inurl:"restapi" | inurl:"classicapi" | inurl:"api" | inurl:"apidocs" | inurl:"clicktrack" | inurl:"doc" | inurl:"static" | inurl:"documentation" | inurl:"openapi" | inurl:"explore" | inurl:"v1" | inurl:"v2" | inurl:"v3" | inurl:"v4" | inurl:"developer" | inurl:"apidoc" | inurl:"document" | inurl:"govpay" | inurl:"routes" | inurl:"application" | inurl:"graphql" | inurl:"playground" | inurl:"apis" | inurl:"public" | inurl:"schema" | inurl:"spec" | inurl:"gateway"
```

### 12. PEOPLESOFT
```
> site:example.com intitle:"Oracle+PeopleSoft+Sign-in"
```

### 13. IIS
```
> site:example.com intitle:"IIS Windows Server"
```

### 14. PHPMYADMIN
```
> site:example.com inurl:"setup/index.php" | inurl:"phpmyadmin" | inurl:"phpMyAdmin" | inurl:"admin/phpMyAdmin" | inurl:"pma/setup/index.php" | intitle:"index of /phpMyAdmin" | "Index of" inurl:phpmyadmin | inurl:"phpMyAdmin/setup/index.php" | intitle:"phpMyAdmin setup"
```

### 15. GIT
```
> site:example.com "index of /.git" | intext:"index of /.git" "parent directory"

> site:example.com inurl:.git-credentials

> site:example.com inurl:.gitconfig

> site:example.com intext:"index of /.git" "parent directory"

> site:example.com filetype:git -github.com inurl:"/.git"

> site:example.com (intext:"index of /.git") ("parent directory")

> site:example.com inurl:ORIG_HEAD

> site:example.com intitle:"index of" ".gitignore"

> site:example.com ".git" intitle:"Index of"

> site:example.com (intext:"index of /.git") ("parent directory")

> site:example.com "Parent Directory" "Last modified" git

> site:example.com inurl:git
```

### 16. GEOSERVER
```
> site:example.com inurl:/geoserver/web/
```

### 17. GRAFANA
```
> site:example.com intitle:"Grafana"

> site:example.com intitle:"grafana" inurl:"/grafana/login" "Forgot your password"

> site:example.com intitle:"Grafana - Home" inurl:/orgid

> site:example.com intitle:Grafana inurl:orgid

> site:example.com inurl:login "Welcome to Grafana"

> site:example.com "Welcome to Grafana" inurl:/orgid

> site:example.com intitle:"Welcome to Grafana"
```

### 18. PHPLDAPADMIN
```
> site:example.com intitle:"phpLDAPadmin"

> site:example.com intitle:"phpLDAPadmin" inurl:cmd.php
```

### 19. JENKINS
```
> site:example.com intitle:"Dashboard [Jenkins]"

> site:example.com intitle:"Sign in [Jenkins]" inurl:"login?from"
```

### 20. WERKZEUG
```
> site:example.com intitle:"Werkzeug"
```

### 21. SYMFONY
```
> site:example.com intitle:"Symfony"
```

### 22. WEBFLOW
```
> site:example.com intext:"The page you are looking for doesn't exist or has been moved."
```

### 23. JOOMLA
```
> site:example.com intext:"Joomla! - Open Source Content Management"

> site:example.com site:*/joomla/administrator
```

### 24. EMAIL
```
> site:example.com (filetype:doc OR filetype:xlsx) intext:@gmail.com
```

### 25. LOG
```
> site:example.com intitle:index.of intext:log

> site:example.com filetype:log "See `ipsec --copyright"

> site:example.com filetype:log access.log -CVS

> site:example.com filetype:log cron.log

> site:example.com filetype:log intext:"ConnectionManager2"

> site:example.com filetype:log inurl:"password.log"

> site:example.com filetype:log inurl:password.log

> site:example.com intitle:index.of cleanup.log

> site:example.com intitle:index.of filetype:log

> site:example.com intitle:index.of log

> site:example.com filetype:log inurl:nginx

> site:example.com filetype:log inurl:database

> site:example.com filetype:log inurl:bin

> site:example.com filetype:syslog

> site:example.com allintext:username filetype:log

> site:example.com inurl:error filetype:log

> site:example.com inurl:nginx filetype:log

```

### 26. WORDPRESS
```
> site:example.com intext:"index of" "wp-content.zip"

> site:example.com inurl:wp-content | inurl:wp-includes

> site:example.com intitle:"Index of" wp-admin
```

### 27. ADMIN.ZIP
```
> site:example.com intitle:"index of /" "admin.zip" "admin/"
```

### 28. ADMIN.ZIP
```
> site:example.com intext:"Index of" intext:"/etc"
```

### 29. BACKUP
```
> site:example.com intext:"Index of" intext:"backup.tar"

> site:example.com inurl:backup | inurl:backup.zip | inurl:backup.rar | inurl:backup.sql | inurl:backup filetype:sql | inurl:save filetype:sql | inurl:web.zip | inurl:website.zip | filetype:bak | filetype:abk | inurl:backup "Parent Directory"
```

### 30. BACKEND
```
> site:example.com intext:"Index of" intext:"backend/"
```

### 31. SOURCE-CODE
```
> site:example.com Index of" intext:"source_code.zip | Index of" intext:"zip
```

### 32. DOCKER-COMPOSE
```
> site:example.com intitle:"index of" "docker-compose.yml"
```

### 33. ATLASSIAN
```
> site:example.com inurl:Dashboard.jspa intext:"Atlassian Jira Project Management Software"
```

### 34. PDF
```
> site:example.com ext:pdf
```

### 35. DOC
```
> site:example.com ext:doc | ext:docx

> site:example.com allintitle:restricted filetype:doc
```

### 36. XLS
```
> site:example.com ext:xls | ext:xlsx
```

### 37. CSV
```
> site:example.com ext:csv
```

### 38. PPT
```
> site:example.com ext:ppt | ext:pptx
```

### 39. TXT
```
> site:example.com ext:txt
```

### 40. OPENBUGBOUNTY REPORTS
```
> site:openbugbounty.org inurl:reports intext:"example.com"
```

### 41. JUICY EXTENSIONS
```
> site:example.com ext:log | ext:txt | ext:conf | ext:cnf | ext:ini | ext:env | ext:sh | ext:bak | ext:backup | ext:swp | ext:old | ext:~ | ext:git | ext:svn | ext:htpasswd | ext:htaccess
```

### 42. SENSITIVE INFORMATION
```
> site:example.com ext:doc | ext:docx intext:"internal use only | confidential"

> site:example.com ext:pdf intext:"internal use only | confidential"

> site:s3.amazonaws.com confidential OR "top secret" "example.com"

> site:blob.core.windows.net | site:googleapis.com | site:drive.google.com | site:docs.google.com/spreadsheets | site:groups.google.com "example.com"

> site:example.com allintext:username filetype:log

> site:example.com inurl:/proc/self/cwd

> site:example.com intitle:"index of" inurl:ftp

> site:example.com intitle:"Apache2 Ubuntu Default Page: It works"

> site:example.com inurl:"server-status" intitle:"Apache Status" intext:"Apache Server Status for"

> site:example.com inurl:"/sym404/" | inurl:"/wp-includes/sym404/"

> site:example.com inurl:"/app_dev.php"

> site:example.com inurl:/webmail/ intext:Powered by IceWarp Server

> site:example.com ext:env "db_password"

> site:example.com inurl:"/printenv" "REMOTE_ADDR"

> site:example.com intitle:"index of" "users.yml" | "admin.yml" | "config.yml"

> site:example.com intitle:"index of" "docker-compose.yml"

> site:example.com Index of" intext:"source_code.zip | Index of" intext:"zip

> site:example.com intext:"Index of" intext:"backend/" | intext:"backup.tar" | intitle:"index of db.sqlite3" | intext:"/etc" | intext:"bitbucket-pipelines.yml" | intext:"database.sql" | "config/db" | "styleci.yml" ".env" | inurl:"/sap/bc/gui/sap/its/webgui?sap-client=SAP*" | intitle:"index of /" "admin.zip" "admin/" | intitle:"index of " "shell.txt" | intitle:"index of " "application.yml" | intext:"index of" "wp-content.zip" | intext:"index of" smb.conf | intitle:"index of" /etc/shadow
```

### 43. MY CUSTOM DORK
```
> site:example.com intext:"Index of" intext:"database.sql"

> site:example.com intext:"Index of" intext:"admin.tar.gz"
```

### 44. AEM
```
> site:example.com inurl:"/content/dam"
````

### 45. PHPINFO
```
> site:example.com inurl:"phpinfo.php"

> site:example.com intitle:phpinfo "published by the PHP Group"

> site:example.com inurl:info.php intext:"PHP Version" intitle:"phpinfo()"
```

### 46. SQL ERROR
```
> site:example.com intext:"sql syntax near" | intext:"syntax error has occurred" | intext:"incorrect syntax near" | intext:"unexpected end of SQL command" | intext:"Warning: mysql_connect()" | intext:"Warning: mysql_query()" | intext:"Warning: pg_connect()"
```

### 47. PHP ERROR
```
> site:example.com "PHP Parse error" | "PHP Warning" | "PHP Error"
```

### 48. DATABASE
```
> site:example.com inurl:db.sql | inurl:db.sqlite | inurl:setup.sql | inurl:mysql.sql | inurl:users.sql | inurl:backup.sql | inurl:db filetype:sql | inurl:backup filetype:sql | inurl:backup filetype:sql | inurl:/db/websql/

> site:example.com create table  filetype:sql

> site:example.com "-- MySQL dump" "Server version" "Table structure for table"

> site:example.com filetype:sql
```

### 49. AWS S3
```
> site:http://s3.amazonaws.com intitle:index.of.bucket "example.com"

> site:http://amazonaws.com inurl:".s3.amazonaws.com/" "example.com"

> site:.s3.amazonaws.com "Company" "example.com"

> intitle:index.of.bucket "example.com"

> site:http://s3.amazonaws.com intitle:Bucket loading "example.com"

> site:*.amazonaws.com inurl:index.html "example.com"

> Bucket Date Modified "example.com"
```

### 50. KIBANA
```
> site:example.com inurl:"/app/kibana#"
```

### 51. XSS PARAMETERS
```
> site:example.com inurl:q= | inurl:s= | inurl:search= | inurl:query= | inurl:keyword= | inurl:lang= inurl:&
```

### 52. OPEN REDIRECT PARAMETERS
```
> site:example.com inurl:url= | inurl:return= | inurl:next= | inurl:redirect= | inurl:redir= | inurl:ret= | inurl:r2= | inurl:page= inurl:& inurl:http

> site:example.com inurl:(url= | return= | next= | redirect= | redir= | ret= | r2= | page=) inurl:& inurl:http
```

### 53. SERVER ERRORS
```
> site:example.com inurl:"error" | intitle:"exception" | intitle:"failure" | intitle:"server at" | inurl:exception | "database error" | "SQL syntax" | "undefined index" | "unhandled exception" | "stack trace"
```

### 54. SQLI PARAMETERS
```
> site:example.com inurl:id= | inurl:pid= | inurl:category= | inurl:cat= | inurl:action= | inurl:sid= | inurl:dir= inurl:&
```

### 55. SSRF PARAMETERS
```
> site:example.com inurl:include | inurl:dir | inurl:detail= | inurl:file= | inurl:folder= | inurl:inc= | inurl:locate= | inurl:doc= | inurl:conf= inurl:&
```

### 56. RCE PARAMETERS
```
> site:example.com inurl:cmd | inurl:exec= | inurl:query= | inurl:code= | inurl:do= | inurl:run= | inurl:read= | inurl:ping= inurl:&
```