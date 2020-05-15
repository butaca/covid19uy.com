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

let replyMessages = [];

const getReplyMessage = () => {
    if (replyMessages.length == 0) {
        replyMessages = Array.from(config.reply);
    }

    let randomIndex = Math.floor(Math.random() * replyMessages.length);
    let message = replyMessages[randomIndex];
    replyMessages.splice(randomIndex, 1);

    message += "\n\n" + config.replyHashtags;

    return message;
}

const replyToTweet = (tweet) => {
    const tweetURL = "https://twitter.com/" + tweet.user.screen_name + "/status/" + tweet.id_str;
    T.post("statuses/update", {
        status: getReplyMessage(),
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

let lastPing = Date.now();

const onData = data => {
    lastPing = Date.now();
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
const RECONNECTION_PING_MAX = 90 * 1000;
let reconnectionWait = RECONNECTION_WAIT_MIN;

let reconnectionTimeout = null;

const reconnect = (calm) => {
    if (calm) {
        console.log("received calm message, incrementing reconnection wait time.");
        reconnectionWait = Math.max(reconnectionWait, RECONNECTION_CALM_WAIT);
        // cancel current pending reconnection
        if (reconnectionTimeout != null) {
            clearTimeout(reconnectionTimeout);
            reconnectionTimeout = null;
        }
    }

    if (reconnectionTimeout == null) {
        if (stream) {
            stream.off('start', onStart);
            stream.off('data', onData);
            stream.off('error', onError);
            stream.off('end', onEnd);
            stream.off('ping', onPing);
        }
        process.nextTick(() => {
            if (stream) {
                stream.destroy();
                stream = null;
                console.log('stream destroyed');
            }
            console.log('reconnecting in ' + (reconnectionWait / 1000).toFixed(2) + ' seconds');
            reconnectionTimeout = setTimeout(() => {
                reconnectionTimeout = null;
                createStream();
            }, reconnectionWait);
            reconnectionWait = Math.min(reconnectionWait * 2, RECONNECTION_WAIT_MAX);
        });
    }
    else {
        console.log('skiping reconnection since another one is pending')
    }

};

const onStart = () => {
    lastPing = Date.now();
    console.log("stream started");
    reconnectionWait = RECONNECTION_WAIT_MIN;
};

const onEnd = () => {
    lastPing = Date.now();
    console.log("stream ended");
    reconnect(false);
};

const onError = (error) => {
    lastPing = Date.now();
    console.log("stream error: " + JSON.stringify(error));
    reconnect(error.status === 420 || error.status === 429);
};

const checkPingDelta = (ping) => {
    let delta = ping - lastPing;
    if (delta > RECONNECTION_PING_MAX) {
        console.log("Max ping exceeded: " + (delta / 1000).toFixed(2) + ", reconnecting...");
        reconnect(false);
    }
};

const onPing = () => {
    let ping = Date.now();
    checkPingDelta(ping);
    lastPing = ping;
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
    stream.on('ping', onPing);
    console.log('stream created');
};

const main = () => {
    createStream();
    setInterval(() => { checkPingDelta(Date.now()); }, RECONNECTION_PING_MAX);
};

T.get("account/verify_credentials").then(main).catch(console.error);