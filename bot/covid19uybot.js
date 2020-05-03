require('dotenv').config();
const Twitter = require('twitter-lite');

const T = new Twitter({
    consumer_key: process.env.TWITTER_CONSUMER_KEY,
    consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
    access_token_key: process.env.TWITTER_ACCESS_TOKEN_KEY,
    access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET
});

const SINAE_USER_ID = "840325920";
const MSP_USER_ID = "3305529657";
const COM_PRESIDENCIA = "380961080";
const OPS_OMS_URUGUAY = "1673800032";
const LUIS_LACALLE_POU = "189861728";
const ALVARO_DELGADO = "231870362";

const FOLLOW_IDS = [SINAE_USER_ID, MSP_USER_ID, COM_PRESIDENCIA, OPS_OMS_URUGUAY, LUIS_LACALLE_POU, ALVARO_DELGADO];

function reply(tweetIdStr) {
    T.post('statuses/update', {
        status: "En mi sitio pueden ver los datos por día, en 12 gráficas: https://covid19uy.com \n\n#QuedateEnCasa #CoronavirusUy #CoronavirusEnUruguay #COVID19Uruguay",
        in_reply_to_status_id: tweetIdStr,
        auto_populate_reply_metadata: true
    });
}

const onData = data => {
    // filter out non tweet data
    if (data.user) {
        const tweet = data;
        // filter out retweets and replies
        if (tweet.retweeted_status == undefined && tweet.in_reply_to_status_id == undefined) {
            console.log("https://twitter.com/" + tweet.user.screen_name + "/status/" + tweet.id_str);
            var lowerCaseText = tweet.text.toLowerCase();
            if ((lowerCaseText.indexOf("informe") != -1 || lowerCaseText.indexOf("visualizador") != -1) && (lowerCaseText.indexOf("coronavirus") != -1 || lowerCaseText.indexOf("covid") != -1)) {
                console.log("https://twitter.com/" + tweet.user.screen_name + "/status/" + tweet.id_str);
                reply(tweet.id_str);
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
    if(calm) {
        reconnectionWait = Math.max(reconnectionWait, RECONNECTION_CALM_WAIT);
    }
    process.nextTick(() => {
        if(stream) {
            stream.destroy();
            stream = null;
        }
        setTimeout(reconnectionWait, createStream);
        reconnectionWait = Math.min(reconnectionWait * 2, RECONNECTION_WAIT_MAX);
    });
}

const onStart = () => {
    reconnectionWait = RECONNECTION_WAIT_MIN;
}

const onEnd = () => {
    reconnect(false);
};

const onError = (error) => {
    reconnect(error.status === 420 || error.status === 429);
}

const createStream = () => {
    stream = T.stream('statuses/filter', {
        follow: FOLLOW_IDS.join(','),
        tweet_mode: 'extended'
    });
    stream.on('start', onStart);
    stream.on('data', onData);
    stream.on('error', onError);
    stream.on('end', onEnd);
}

createStream();


