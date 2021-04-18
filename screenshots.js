const puppeteer = require('puppeteer');
const sharp = require('sharp');
const fs = require('fs');
const { promisify } = require('util');
const deleteFile = promisify(fs.unlink);

const URL = 'http://localhost:1313';
const tmpFile = 'screenshot.png'

async function takeScreenshot(page, w, h, path) {
    await page.setViewport({
        width: w,
        height: h,
        isLandscape: true,
        deviceScaleFactor: 1,
    });
    await page.goto(URL);
    await page.screenshot({ path: path, clip: { x: 0, y: 52, width: w, height: h } });
}

async function resize(path, w, h, output) {
    let s = sharp(path).resize(w, h)
    if (output.endsWith(".jpg") || output.endsWith(".jpeg")) {
        s = s.jpeg({ mozjpeg: true, quality: 90, chromaSubsampling: '4:4:4' });
    }
    await s.toFile(output);
}

(async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await takeScreenshot(page, 1216, 630, tmpFile);
    await resize(tmpFile, 1200, 630, './static/images/seo/opengraph.jpg');
    await takeScreenshot(page, 2048, 1024, tmpFile);
    await resize(tmpFile, 1024, 512, './static/images/seo/twitter_card.jpg'),
    await browser.close();
    await deleteFile(tmpFile);
})();