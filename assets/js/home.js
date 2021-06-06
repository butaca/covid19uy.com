import langEs from "es.json";
import langEn from "en.json";
import "./chartjs-elements";
import "./chartjs-tooltipsutil";
import nfCookies from './nf-cookies'
import burger from './burger'
import './icons'
import chartData from "./data/chartData.json"
import charts from "./charts";
import uruguayMap from "./uruguay-map";

if (document.readyState === 'loading') {
    document.addEventListener("DOMContentLoaded", main);
} else {
    main();
}

function main() {
    burger();
    nfCookies();

    var langs = {
        es: langEs,
        en: langEn
    }

    var htmlLang = document.documentElement.getAttribute("lang");

    var lang = langs.es;
    if (langs.hasOwnProperty(htmlLang)) {
        lang = langs[htmlLang];
    }

    var flipDate = htmlLang == "en";

    if (flipDate) {
        for (let i = 0; i < chartData.dates.length; ++i) {
            const date = chartData.dates[i];
            const tokens = date.split("/")
            chartData.date = tokens[1] + "/" + tokens[0];
        }
    }

    charts(chartData, lang);
    uruguayMap();
}
