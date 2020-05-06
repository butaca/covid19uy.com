require('dotenv').config();

const Twitter = require('twitter-lite');

const T = new Twitter({
    consumer_key: process.env.TWITTER_CONSUMER_KEY,
    consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
    access_token_key: process.env.TWITTER_ACCESS_TOKEN_KEY,
    access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET
});

T.get("account/verify_credentials").then(main).catch(console.error);

function replay(id) {
    T.post("statuses/update", {
        status: process.env.REPLY_MESSAGE,
        in_reply_to_status_id: id,
        auto_populate_reply_metadata: true
    }).then(() => {
        console.log("Success: " + id);
    }).error(console.error);
}

function main() {
    var ids = process.argv.slice(2);
    if (ids.length > 0) {
        for (let i = 0; i < ids.length; ++i) {
            replay(ids[i]);
        }
    }
    else {
        console.log("usage: node reply.js tweetId_1, itweetId_2 ... tweetId_N")
    }
}