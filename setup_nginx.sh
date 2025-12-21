#!/bin/bash
# Install Nginx and Certbot
apt-get update
apt-get install -y nginx certbot python3-certbot-nginx

# Stop OpenLiteSpeed if still running (just in case)
systemctl stop openlitespeed
systemctl disable openlitespeed

# Copy config
cp /var/www/autoxstats/nginx_autoxstats.conf /etc/nginx/sites-available/autoxstats

# Enable config
ln -sf /etc/nginx/sites-available/autoxstats /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test and start Nginx
nginx -t
systemctl restart nginx

echo "Nginx installed and configured using Port 80."
