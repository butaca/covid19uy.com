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
    TwitterWidgetsLoader.load();
}
