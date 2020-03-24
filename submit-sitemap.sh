#!/bin/sh

SITEMAP=https://covid19uy.com/sitemap.xml

echo "Submitting to Google..."
curl -s -o /dev/null -w "%{http_code}\n" http://www.google.com/ping?sitemap=$SITEMAP
echo "Submitting to Bing..."
curl -s -o /dev/null -w "%{http_code}\n" http://www.bing.com/webmaster/ping.aspx?siteMap=$SITEMAP
