const querystring = require('querystring');
const BASE_DATA_DIR = "assets/js/data/";
const axios = require("axios");

async function request(url, params) {
    url += "?" + querystring.encode(params);

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

module.exports = {
    request: request,
    BASE_DATA_DIR: BASE_DATA_DIR
};