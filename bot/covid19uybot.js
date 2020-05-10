require('dotenv').config();

const fs = require('fs');
const yaml = require('js-yaml');
const file = fs.readFileSync('./covid19uybot.yml', 'utf-8');
const config = yaml.safeLoad(file);

const Push = require('pushover-notifications');

const push = new Push({
    user: process.env.PUSHOVER_USER,
    token: process.env.PUSHOVER_TOKEN,
});

const Twitter = require('twitter-lite');

const T = new Twitter({
    consumer_key: process.env.TWITTER_CONSUMER_KEY,
    consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
    access_token_key: process.env.TWITTER_ACCESS_TOKEN_KEY,
    access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET
});

const replyToTweet = (tweet) => {
    const tweetURL = "https://twitter.com/" + tweet.user.screen_name + "/status/" + tweet.id_str;
    T.post("statuses/update", {
        status: config.reply,
        in_reply_to_status_id: tweet.id_str,
        auto_populate_reply_metadata: true
    }).then(() => {
        let m = "Auto reply to: " + tweetURL;
        push.send({ message: m });
        console.log(m);
    }).catch((e) => {
        let m = "Error replying to tweet: " + tweetURL + "\n" + JSON.stringify(e);
        push.send({ message: m });
        console.error(m);
    });
};

const notify = (tweet) => {
    const tweetURL = "https://twitter.com/" + tweet.user.screen_name + "/status/" + tweet.id_str;
    push.send({ message: tweetURL });
    console.log(m);
}

const hasWord = (text, words) => {
    for (let i = 0; i < words.length; ++i) {
        let word = words[i];
        if (text.indexOf(word) != -1) {
            return true;
        }
    }
    return false;
};

const onData = data => {
    // filter out non tweet data
    if (data.user) {
        const tweet = data;
        // filter out mentions by other users and retweets
        if (config.follow.indexOf(tweet.user.id_str) != -1 && tweet.retweeted_status == undefined) {
            const lowerCaseText = tweet.text.toLowerCase();
            if (hasWord(lowerCaseText, config.words) && hasWord(lowerCaseText, config.covidWords)) {
                if (config.replayEnabled) {
                    replyToTweet(tweet);
                }
                else {
                    notify(tweet);
                }
            }
        }
    }
};

let stream = null;

const RECONNECTION_WAIT_MIN = 2 * 1000;
const RECONNECTION_WAIT_MAX = 120 * 1000;
const RECONNECTION_CALM_WAIT = 20 * 1000;
let reconnectionWait = RECONNECTION_WAIT_MIN;

const reconnect = (calm) => {
    if (calm) {
        reconnectionWait = Math.max(reconnectionWait, RECONNECTION_CALM_WAIT);
    }
    process.nextTick(() => {
        if (stream) {
            stream.destroy();
            stream = null;
            console.log('stream destroyed');
        }
        console.log('reconnecting in ' + (reconnectionWait / 1000).toFixed(2) + ' seconds');
        setTimeout(createStream, reconnectionWait);
        reconnectionWait = Math.min(reconnectionWait * 2, RECONNECTION_WAIT_MAX);
    });
};

const onStart = () => {
    console.log("stream started");
    reconnectionWait = RECONNECTION_WAIT_MIN;
};

const onEnd = () => {
    console.log("stream ended");
    reconnect(false);
};

const onError = (error) => {
    console.log("stream error: " + JSON.stringify(error));
    reconnect(error.status === 420 || error.status === 429);
};

const createStream = () => {
    stream = T.stream('statuses/filter', {
        follow: config.follow.join(','),
        tweet_mode: 'extended'
    });
    stream.on('start', onStart);
    stream.on('data', onData);
    stream.on('error', onError);
    stream.on('end', onEnd);
    console.log('stream created');
};

T.get("account/verify_credentials").then(createStream).catch(console.error);