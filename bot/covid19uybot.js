require('dotenv').config();
const fs = require('fs');
const yaml = require('js-yaml');
const Twitter = require('twitter-lite');
const twitterText = require('twitter-text')
const Push = require('pushover-notifications');

const CONFIG_FILENAME = './covid19uybot.yml';
const CONFIG_ENCODING = 'utf-8';

let config = null;

const loadConfig = () => {
    let file = fs.readFileSync(CONFIG_FILENAME, CONFIG_ENCODING);
    if (file.length == 0) {
        return;
    }
    config = yaml.safeLoad(file);
};

loadConfig();

const reloadConfig = () => {
    const prevFollow = config.follow;
    loadConfig();
    console.log("config reloaded");

    const sameFollow = (arr1, arr2) => {
        if (arr1.length == arr2.length) {
            for (let i = 0; i < arr1.length; ++i) {
                if (arr1[i] != arr2[i]) {
                    return false;
                }
            }
            return true;
        }
        return false;
    };

    if (!sameFollow(prevFollow, config.follow)) {
        console.log("follow changed on config, recreating stream...");
        reconnect(false);
    }
};

fs.watch(CONFIG_FILENAME, CONFIG_ENCODING, reloadConfig);

const push = new Push({
    user: process.env.PUSHOVER_USER,
    token: process.env.PUSHOVER_TOKEN,
});

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

    if (config.hashtagsEnabled) {
        const hashtags = config.replyHashtags;

        if(hashtags.length > 0) {
            var newMessage = message + "\n\n" + hashtags[0];
            var parseResult = twitterText.parseTweet(newMessage);
            if(parseResult.valid) {
                message = newMessage;
                for(let i = 1; i < hashtags.length; ++i) {
                    newMessage = message + " " + hashtags[i];
                    parseResult = twitterText.parseTweet(newMessage)
                    if(parseResult.valid) {
                        message = newMessage;
                    }
                    else {
                        break;
                    }
                }
            }
        }
    }

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
    let m = "Notification only: " + tweetURL + "\n\n" + tweet.full_text;
    push.send({ message: m });
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
            const lowerCaseText = tweet.full_text.toLowerCase();
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

let reconnectionWait = config.reconnection.minWait;

let reconnectionTimeout = null;

const reconnect = (calm) => {
    if (calm) {
        console.log("received calm message, incrementing reconnection wait time.");
        reconnectionWait = Math.max(reconnectionWait, config.reconnection.calmWait);
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
                try {
                    stream.destroy();
                    console.log('stream destroyed');
                }
                catch (error) {
                    console.log("Error destoying the stream: " + JSON.stringify(error));
                }
                stream = null;
            }
            console.log('reconnecting in ' + (reconnectionWait / 1000).toFixed(2) + ' seconds');
            reconnectionTimeout = setTimeout(() => {
                reconnectionTimeout = null;
                createStream();
            }, reconnectionWait);
            reconnectionWait = Math.min(reconnectionWait * 2, config.reconnection.maxWait);
        });
    }
    else {
        console.log('skiping reconnection since another one is pending')
    }

};

const onStart = () => {
    lastPing = Date.now();
    console.log("stream started");
    reconnectionWait = config.reconnection.minWait;
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
    if (reconnectionTimeout == null) {
        let delta = ping - lastPing;
        if (delta > config.reconnection.maxPing) {
            console.log("Max ping exceeded: " + (delta / 1000).toFixed(2) + ", reconnecting...");
            reconnect(false);
        }
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
    lastPing = Date.now();
};

const main = () => {
    createStream();
    setInterval(() => { checkPingDelta(Date.now()); }, config.reconnection.minWait);
};

const login = () => {
    T.get("account/verify_credentials").then(main).catch((error) => {
        console.log('error logging in: ' + JSON.stringify(error));
        console.log('retrying in ' + reconnectionWait / 1000 + " seconds");
        setTimeout(login, reconnectionWait);
        reconnectionWait = Math.min(reconnectionWait * 2, config.reconnection.maxWait);
    });
}

login();