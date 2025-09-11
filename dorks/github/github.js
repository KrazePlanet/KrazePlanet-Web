function shodan_it(type) 
{
    
    site = document.getElementById('target').value;                            
    url = 'https://github.com/search?q=';
    url = url + site + " " ;

switch(type)
{
    case 1:
        url += 'api_key';
        break;
    case 2:
        url += 'app_AWS_SECRET_ACCESS_KEY ';
        break
    case 3:
        url += 'app_secret';
        break
    case 4:
        url += 'authoriztion';
        break;
    case 5:
        url += 'Ldap ';
        break;
    case 6:
        url += 'aws_access_key_id';
        break;
    case 7:
        url += 'secret';
        break;
    case 8:
        url += '.bash_history';
        break;
    case 9:
        url += 'bashrc%20password';
        break;
	case 10:
        url += 'beanstalkd.yml';
        break;
	case 11:
        url += 'client secret';
        break;
	case 12:
        url += 'composer.json';
        break;
	case 13:
        url += 'config';
        break;
	case 14:
        url += 'credentials';
        break;
	case 15:
        url += 'DB_PASSWORD' ;
        break;
	case 16:
        url += 'deploy.rake';
        break;
	case 17:
        url += 'dotfiles' ;
        break;
    case 17.1:
        url += '.env';
	break;
	case 18:
        url += '.exs' ;
        break;
	case 19:
        url += 'extension:json mongolab.com' ;
        break;
    case 20:
        url += 'extension:pem%20private';
        break;
	case 21:
        url +=  'extension:ppk private';
        break;
    case 22:
        url +=  'extension:sql mysql dump';
        break; 
    case 23:
        url +=  'extension:yaml mongolab.com' ;
        break; 
    case 24:
        url += 'filename:.bash_history' ;
        break;
    case 25:
        url += 'filename:.bash_profile aws' ;
        break;
    case 26:
        url +=  'filename:.bashrc mailchimp' ;
        break;
    case 27:
        url +=  'filename:CCCam.cfg' ;
        break;
    case 28:
        url +=  'filename:config irc_pass' ;
	break;
    case 29:
        url +=  'filename:config.php dbpasswd' ;
        break; 
    case 30:
        url +=  'filename:config.json auths';
        break; 
    case 31:
        url +=  'filename:config.php pass' ;
        break;
    case 32:
        url +=  'filename:config.php dbpasswd';
        break; 
    case 33:
        url +=  'filename:connections.xml' ;
        break;
    case 34:
        url +=  'filename:.cshrc' ;
        break;
    case 35:
        url +=  'filename:.git-credentials' ;
        break; 
    case 36:
        url +=  'filename:.ftpconfig' ;
        break;
    case 37:
        url +=  'filename:.history' ;
        break;
    case 38:
        url +=  'filename:gitlab-recovery-codes.txt' ;
        break;
    case 39:
        url +=  'filename:.htpasswd'  ;
        break;
    case 40:
        url +=  'filename:id_rsa' ;
        break;
    case 41:
        url +=  'filename:.netrc password' ;
        break;
    case 42:
        url +=  'FTP' ;
        break;
    case 43:
        url +=  'filename:wp-config.php' ;
        break;
    case 44:
        url +=  'git-credentials' ;
        break;
    case 45:
        url +=  'github_token' ;
        break;
    case 46:
        url +=  'HEROKU_API_KEY language:json' ;
        break;
    case 47:
        url +=  'HEROKU_API_KEY language:shell' ;
        break;
    case 48:
        url +=  'HOMEBREW_GITHUB_API_TOKEN language:shell' ;
        break;
    case 49:
        url +=  '.mlab.com password' ;
        break;
    case 50:
        url +=  'mysql' ;
        break;
    case 51:
        url +=  'npmrc%20_auth' ;
        break;
    case 52:
        url +=  'oauth' ;
        break;
    case 53:
        url +=  'OTP' ;
        break;
    case 54:
        url +=  'pass' ;
        break;
    case 55:
        url +=  'passkey' ;
        break;
    case 56:
        url +=  'passwd' ;
        break;
    case 57:
        url +=  'password' ;
        break;
    case 58:
        url +=  'databases password' ;
        break;
    case 59:
        url +=  'rds.amazonaws.com password' ;
	break;
    case 60:
        url +=  's3cfg' ;
        break;       
    case 61:
        url +=  'send_key-keys' ;
        break;
    case 62:
        url +=  'token' ;
        break;
    case 63:
        url +=  '[WFClient] Password= extension:ica' ;
        break;
    case 64:
        url +=  'xoxp%20OR%20xoxb%20OR%20xoxaJenkins' ;
        break;
    case 65:
        url +=  'security_credentials' ;
        break;
}
    window.open(url);

}
