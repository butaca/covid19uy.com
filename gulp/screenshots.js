const puppeteer = require('puppeteer');
const sharp = require('sharp');
const fs = require('fs');
const { promisify } = require('util');
const deleteFile = promisify(fs.unlink);

const URL = 'https://covid19uy.com';
const tmpFile = 'screenshot.png'

async function takeScreenshot(page, w, h, path) {
    await page.setViewport({
        width: w,
        height: h,
        isLandscape: true,
        deviceScaleFactor: 1,
    });
    await page.goto(URL);
    await page.evaluateHandle('document.fonts.ready');
    await page.screenshot({ path: path, clip: { x: 0, y: 52, width: w, height: h } });
}

async function resize(path, w, h, output) {
    let s = sharp(path).resize(w, h)
    if (output.endsWith(".jpg") || output.endsWith(".jpeg")) {
        s = s.jpeg({ mozjpeg: true, quality: 90, chromaSubsampling: '4:4:4' });
    }
    await s.toFile(output);
}

async function takeScreenshots(outputDir) {
    const browser = await puppeteer.launch({args: ['--lang=es-UY']});
    const page = await browser.newPage();
    await takeScreenshot(page, 1216, 630, tmpFile);
    await resize(tmpFile, 1200, 630, outputDir + '/images/seo/opengraph.jpg');
    await takeScreenshot(page, 2048, 1024, tmpFile);
    await resize(tmpFile, 1024, 512, outputDir + '/images/seo/twitter_card.jpg'),
        await browser.close();
    await deleteFile(tmpFile);
}

module.exports = {
    takeScreenshots: takeScreenshots
}