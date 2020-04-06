#/bin/sh
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless --screenshot --window-size=1200,630 --default-background-color=0 --hide-scrollbars http://localhost:1313
sips -s format jpeg screenshot.png --out opengraph.jpg
mv opengraph.jpg ./static/images/seo/
sips -s format jpeg --cropToHeightWidth 600 1200 --cropOffset 52 0 -Z 1024 screenshot.png --out twitter_card.jpg
mv twitter_card.jpg ./static/images/seo/
/Applications/ImageOptim.app/Contents/MacOS/ImageOptim ./static/images/seo/*.jpg
rm screenshot.png
