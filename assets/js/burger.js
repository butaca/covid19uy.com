export default function burger() {
    var navbar = document.getElementById('navbar');
    var navbarMenu = document.getElementById('navbarMenu');
    var navbarBurger = document.getElementById('navbarBurger');

    var toggleBurger = function () {
        navbarBurger.classList.toggle('is-active');
        navbarMenu.classList.toggle('is-active');
    };

    var navBarLinks = navbar.querySelectorAll('a[href^="#"]');
    navBarLinks.forEach(function () {
        el.addEventListener('click', toggleBurger);
    });

    navbarBurger.addEventListener('click', toggleBurger);

    var isVisible = function (elem) { return !!elem && !!(elem.offsetWidth || elem.offsetHeight || elem.getClientRects().length); };

    document.addEventListener('click', function () {
        if (!navbarBurger.contains(event.target) && isVisible(navbarBurger) && !navbarMenu.contains(event.target) && isVisible(navbarMenu)) {
            if (navbarMenu.classList.contains('is-active')) {
                toggleBurger();
            }
        }
    });
}