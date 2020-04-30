import Cookies from 'js-cookie';

export default function nfCookies() {
    var langLinks = document.querySelectorAll('.lang-link');
    for (var i = 0; i < langLinks.length; ++i) {
        var langLink = langLinks[i];
        langLink.addEventListener('click', function () {
            Cookies.set("nf_lang", langLink.getAttribute('data-lang'), { expires: 365 * 10 });
        });
    }
}