# Deployment

- Port 80 config : 
```bash
server {
        server_name scrib.kongroo.xyz;

        location / {
                proxy_pass http://127.0.0.1:8001/; #whatever port your app runs on
                proxy_set_header Upgrade $http_upgrade;
                proxy_set_header Connection 'upgrade';
                proxy_set_header Host $host;
                proxy_cache_bypass $http_upgrade;
                # This line is very important for rust websockets
                proxy_http_version 1.1;
        }

    listen 80; 
        
}


```

- Port 443 ssl config : 
```bash
server {
        server_name scrib.kongroo.xyz;

        location / {
                proxy_pass http://127.0.0.1:8001/; #whatever port your app runs on
                proxy_set_header Upgrade $http_upgrade;
                proxy_set_header Connection 'upgrade';
                proxy_set_header Host $host;
                proxy_cache_bypass $http_upgrade;
                # This line is very important for rust websockets
                proxy_http_version 1.1;
        }

        # This is the only stuff added by certbot, it only kills the listen 80; line
    listen 443 ssl; # managed by Certbot
    ssl_certificate /etc/letsencrypt/live/scrib.kongroo.xyz/fullchain.pem; # managed by Certbot
    ssl_certificate_key /etc/letsencrypt/live/scrib.kongroo.xyz/privkey.pem; # managed by Certbot
    include /etc/letsencrypt/options-ssl-nginx.conf; # managed by Certbot
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem; # managed by Certbot

}

```