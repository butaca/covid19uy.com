const querystring = require('querystring');
const BASE_DATA_DIR = "assets/js/data/";
const CACHE_DIR = "cache/";
const axios = require("axios");
const fs = require('fs');
const { promisify } = require('util');
const writeFilePromise = promisify(fs.writeFile);
const copyFilePromise = promisify(fs.copyFile);
const Pushover = require('pushover-notifications');

let push = null;
if (process.env.PUSHOVER_USER && process.env.PUSHOVER_TOKEN) {
    push = new Pushover({
        user: process.env.PUSHOVER_USER,
        token: process.env.PUSHOVER_TOKEN,
        onerror: function (message) {
            console.log("Error sending Pushover notification: " + message);
        }
    });
}

async function request(url, params) {
    if(params) { 
        url += "?" + querystring.encode(params);
    }

    try {
        let response;
        response = await axios.get(url)
        if (response.status !== 200) {
            return Promise.reject(new Error('Unexpected HTTP code when downloading data: ' + response.status));
        }
        return response.data;
    } catch (e) {
        return Promise.reject(e);
    }
}

async function writeFileAndCache(dir, filename, data) {
    const path = dir + filename;
    const pathCache = CACHE_DIR + filename;
    await writeFilePromise(path, data);
    if (!fs.existsSync(CACHE_DIR)) {
        fs.mkdirSync(CACHE_DIR);
    }
    await copyFilePromise(path, pathCache);
}

async function copyFromCache(dir, filename, defaultData) {
    const path = dir + filename;
    const pathCache = CACHE_DIR + filename;
    if (fs.existsSync(pathCache)) {
        await copyFilePromise(pathCache, path);
    }
    else if (defaultData) {
        await writeFilePromise(path, defaultData);
    }
}

function notify(message) { 
    if (push) {
        push.send({ message: message });
    }
    console.log(message);
}

module.exports = {
    request: request,
    BASE_DATA_DIR: BASE_DATA_DIR,
    writeFileAndCache: writeFileAndCache,
    copyFromCache: copyFromCache,
    notify: notify
};