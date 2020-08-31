var assert = require('chai').assert;
const fs = require('fs');
const { promisify } = require('util');
const DATA_DIR = "assets/js/data/"

const Twitter = require('twitter-lite');
require('dotenv').config();

const T = new Twitter({
    consumer_key: process.env.TWITTER_CONSUMER_KEY,
    consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
    access_token_key: process.env.TWITTER_ACCESS_TOKEN_KEY,
    access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET
});

describe('Test Twitter data', function () {
    let tweets = null;

    before(async function () {
        const readFile = promisify(fs.readFile);
        await readFile(DATA_DIR + "twitter.json").then(data => {
            tweets = JSON.parse(data.toString());
        }).catch(assert.Throw);
    });

    it('Twitter login', function () {
        this.timeout(10000);
        return T.get("account/verify_credentials").catch(assert.Throw);
    });

    it('All tweets should exists', async function () {
        this.timeout(10000);
        const maxTweets = 100;

        var promises = [];

        for (let i = 0; i < tweets.tweets.length; i += maxTweets) {
            var tweetsChunk = tweets.tweets.slice(i, i + maxTweets);
            promises.push(T.get("statuses/lookup", {
                id: tweetsChunk.join(","),
                include_entities: false,
                map: true,
                include_ext_alt_text: false,
                include_card_uri: false,
            }).catch(assert.Throw));
        }

        let allData = {};
        const datas = await Promise.all(promises);
        for (let i = 0; i < datas.length; ++i) {
            const data = datas[i];
            allData = Object.assign({}, allData, data.id);
        }

        for (let i = 0; i < tweets.tweets.length; ++i) {
            var tweetId = tweets.tweets[i];
            var tweet = allData[tweetId];
            assert.isObject(tweet, "Tweet " + tweetId + " doesn't exist");
        }
    });
});