function shodan_it(type) 
{
    
    site = document.getElementById('target').value;                            
    url = 'https://www.shodan.io/search?query=';
    url = url + site + " " ;

switch(type)
{
    case 1:
        url += 'product:MySQL';
        break;
    case 2:
        url += '"MongoDB Server Information" -authentication';
        break;
    case 3:
        url += '"default password"';
        break;
    case 4:
        url += 'guest login ok';
        break;
    case 5:
        url += 'x-jenkins 200';
        break;
    case 6:
        url += 'http.html:"* The wp-config.php creation script uses this file"';
        break;
    case 7:
        url += '"root@" port:23 -login -password -name -Session ';
        break;
    case 8:
        url += 'html:"def_wirelesspassword"';
        break;
    case 9:
        url += '"authentication disabled"';
        break;
	case 10:
        url += 'http.title:"dashboard"';
        break;
	case 11:
        url += 'http.title:"control panel"';
        break;
	case 12:
        url += 'http.title:"phpmyadmin"';
        break;
	case 13:
        url += 'product:"CouchDB"';
        break;
	case 14:
        url += 'kibana content-length:217';
        break;
	case 15:
        url += 'http.title:outlook exchange' ;
        break;
	case 16:
        url += 'http.favicon.hash:1398055326';
        break;
	case 17:
        url += 'http.html:WSO2' ;
        break;
    case 17.1:
        url += '"webvpn="' ;
        break;
	case 18:
        url += 'port:"445" os:"Windows"' ;
        break;
	case 19:
        url += 'http.favicon.hash:-1250474341' ;
        break;
    case 20:
        url += 'http.html:"xoxb-"';
        break;
	case 21:
        url +=  'http.favicon.hash:81586312';
        break;
    case 22:
        url +=  'http.title:"Grafana"';
        break; 
    case 23:
        url +=  'http.html:zabbix' ;
        break; 
    case 24:
        url += 'http.html:Horde:' ;
        break;
    case 25:
        url += 'http.title:"Argo CD"' ;
        break;
    case 26:
        url +=  'product:tomcat' ;
        break;
    case 27:
        url +=  'port:23 console gateway' ;
        break;
    case 28:
        url +=  '"\x03\x00\x00\x0b\x06\xd0\x00\x00\x124\x00"' ;
    case 29:
        url +=  'proftpd port:21' ;
        break; 
    case 30:
        url +=  '"authentication disabled" "RFB 003.008"';
        break; 
    case 31:
        url +=  'http.html:/dana-na/' ;
        break;
    case 32:
        url +=  'http.title:"BIG-IP&reg;-Redirect"';
        break; 
    case 33:
        url +=  '"unauthorized"' ;
        break;
    case 34:
        url +=  '"Set-Cookie: mongo-express=" "200 OK"' ;
        break;
    case 35:
        url +=  '"X-Jenkins" "Set-Cookie: JSESSIONID" http.title:"Dashboard"' ;
        break; 
    case 36:
        url +=  '"Intel(R) Active Management Technology" port:623,664,16992,16993,16994,16995' ;
        break;
    case 37:
        url +=  'http.title:"Index of /" http.html:".pem"' ;
        break;
    case 38:
        url +=  '"Serial Number:" "Built:" "Server: HP HTTP"' ;
        break;
    case 39:
        url +=  'https://www.shodan.io/search?query='  ;
        break;
    case 40:
        url +=  'https://www.shodan.io/search?query=' ;
        break;
    case 41:
        url +=  'https://www.shodan.io/search?query=' ;
        break;
    case 42:
        url +=  'https://www.shodan.io/search?query=' ;
        break;
}
    window.open(url);

}