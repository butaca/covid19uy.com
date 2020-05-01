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

const followIds = SINAE_USER_ID + "," + MSP_USER_ID;

const stream = T.stream('statuses/filter', {
    track: 'informe,visualizador',
    follow: followIds
});

stream.on('data', tweet => {
    if (tweet.user != null && tweet.user != undefined && tweet.retweeted_status == undefined && tweet.quoted_status == undefined && tweet.in_reply_to_status_id == undefined) {
        if (tweet.user.id_str == SINAE_USER_ID || tweet.user.id_str == MSP_USER_ID) {
            var lowerCaseText = tweet.text.toLowerCase();
            if ((lowerCaseText.indexOf("informe") != -1 || lowerCaseText.indexOf("visualizador") != -1) && (lowerCaseText.indexOf("coronavirus") != -1 || lowerCaseText.indexOf("covid") != -1)) {
                console.log("https://twitter.com/" + tweet.user.screen_name + "/status/" + tweet.id_str);
                T.post('statuses/update', { status: "En mi sitio pueden ver los datos por día, en 12 gráficas: https://covid19uy.com \n\n#QuedateEnCasa #CoronavirusUy #CoronavirusEnUruguay #COVID19Uruguay", in_reply_to_status_id : tweet.id_str, auto_populate_reply_metadata: true });
            }
        }
    }
});

