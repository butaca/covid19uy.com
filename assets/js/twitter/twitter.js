import burger from '../burger'
import nfCookies from '../nf-cookies'
import '../icons'
import TwitterWidgetsLoader from 'twitter-widgets'

if (document.readyState === 'loading') {
    document.addEventListener("DOMContentLoaded", onDOMLoaded);
} else {
    onDOMLoaded();
}

function onDOMLoaded() {
    burger();
    nfCookies();

    TwitterWidgetsLoader.load(function () {
        var tweetElements = document.getElementsByClassName("tweet");
        var pendingTweets = [];
        var loadingTweets = 0;
        var maxLoadingTweets = 6;

        for (var i = 0; i < tweetElements.length; ++i) {
            var tweetElement = tweetElements[i];
            var tweetId = tweetElement.getAttribute("data-tweet");
            pendingTweets.push({
                tweetId: tweetId,
                element: tweetElement
            });
        }

        function onTweetLoaded() {
            loadingTweets--;
            loadPendingTweets();
        }

        function loadPendingTweets() {
            while (pendingTweets.length > 0 && loadingTweets <= maxLoadingTweets) {
                var pendingTweet = pendingTweets[0];
                pendingTweets.splice(0, 1);
                loadingTweets++;
                var prom = twttr.widgets.createTweet(pendingTweet.tweetId, pendingTweet.element, {
                    conversation: "none",
                    cards: "hidden"
                });
                prom.then(onTweetLoaded).catch(onTweetLoaded);
            }
        }

        loadPendingTweets();
    });
}
