import data from "../../data/uruguay.json";
import constants from "../../data/uruguay-constants.json";
import langEs from "../../i18n/es.yaml";
import langEn from "../../i18n/en.yaml";
import "./chartjs-elements";
import Cookies from 'js-cookie';

document.addEventListener("DOMContentLoaded", main);

function burger() {
    var navbar = document.getElementById('navbar');
    var navbarMenu = document.getElementById('navbarMenu');
    var navbarBurger = document.getElementById('navbarBurger');

    var toggleBurger = function () {
        navbarBurger.classList.toggle('is-active');
        navbarMenu.classList.toggle('is-active');
    };

    var navBarLinks = navbar.querySelectorAll('a[href^="#"]');
    navBarLinks.forEach(function() {
        el.addEventListener('click', toggleBurger);
    });

    navbarBurger.addEventListener('click', toggleBurger);
    
    var isVisible = function(elem) { return !!elem && !!(elem.offsetWidth || elem.offsetHeight || elem.getClientRects().length); };

    document.addEventListener('click', function() {
        if (!navbarBurger.contains(event.target) && isVisible(navbarBurger) && !navbarMenu.contains(event.target) && isVisible(navbarMenu)) {
            if (navbarMenu.classList.contains('is-active')) {
                toggleBurger();
            }
        }
    });
}

function getIncrementalValues(values) {
    var incrementalValues = [];
    var prevTotal = 0;
    for (var i = 0; i < values.length; ++i) {
        var value = values[i];
        var totalValue = value + prevTotal;
        incrementalValues.push(totalValue);
        prevTotal = totalValue;
    }
    return incrementalValues;
}

function getTotal(values) {
    return values.reduce(function (prev, cur) { return prev + cur });
}

function main() {
    burger();

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

    var dialyCases = data.map(function (el) { return el.cases });
    var dates = data.map(function (el) {
        var date = new Date(el.date);
        var day = date.getUTCDate();
        var month = (date.getUTCMonth() + 1);
        return flipDate ? month + "/" + day : day + "/" + month;
    });

    var cases = getIncrementalValues(dialyCases);
    var deaths = data.map(function (el) { return el.deaths != undefined ? el.deaths : 0 });
    var recovered = data.map(function (el) { return el.recovered != undefined ? el.recovered : 0 });

    var activeCases = [];
    for (var i = 0; i < cases.length; ++i) {
        var todayActiveCases = cases[i] - deaths[i] - recovered[i];
        activeCases.push(todayActiveCases);
    }

    var ctx = document.getElementById('chart-active-cases');
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: dates,
            datasets: [{
                pointBackgroundColor: "#28b8d6ff",
                backgroundColor: "#28b8d680",
                label: lang.activeCases.other,
                data: activeCases,
            }]
        },
        options: {
            animation: {
                duration: 0
            }
        }
    });

    ctx = document.getElementById('chart-total-cases');
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: dates,
            datasets: [{
                pointBackgroundColor: "#28b8d6ff",
                backgroundColor: "#28b8d680",
                label: lang.totalCases.other,
                data: cases,
            },
            {
                pointBackgroundColor: "#e54acfff",
                backgroundColor: "#e54acfff",
                label: lang.deaths.other,
                data: deaths,
            }]
        },
        options: {
            animation: {
                duration: 0
            }
        }
    });

    var dailyTests = data.map(function (el) { return el.tests != undefined ? el.tests : el.cases });

    ctx = document.getElementById('chart-daily-cases');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: dates,
            datasets: [{
                backgroundColor: "#97DBEAFF",
                label: lang.dailyCases.other,
                data: dialyCases,
            },
            {
                backgroundColor: "#83d02a80",
                label: lang.dailyTests.other,
                data: dailyTests,
            }]
        },
        options: {
            animation: {
                duration: 0
            },
            scales: {
                xAxes: [{
                    stacked: true
                }]
            }
        }
    });

    var dailyICU = data.map(function (el) { return el.icu != undefined ? el.icu : 0 });
    var dailyIMCU = data.map(function (el) { return el.imcu != undefined ? el.imcu : 0 });
    // var dailyWard = data.map(function (el) { return el.ward != undefined ? el.ward : 0 });

    ctx = document.getElementById('chart-daily-hospitalizations');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: dates,
            datasets: [{
                backgroundColor: "#ff000080",
                label: lang.icu.other,
                data: dailyICU,
            },
            {
                backgroundColor: "#ecdb3c80",
                label: lang.imcu.other,
                data: dailyIMCU,
            }/*,
            {   backgroundColor: "#83d02a80",
                label: 'Sala',
                data: dailyWard,
            }*/
            ]
        },
        options: {
            animation: {
                duration: 0
            }
        }
    });


    function isMobile() {
        var width = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
        return width <= 768;
    }

    function getPiePadding() {
        return isMobile() ? 0 : 50;
    }

    function onResizePie(chart) {
        chart.options.layout.padding = getPiePadding();
        chart.update();
    }

    var pieToolTips = {
        callbacks: {
            title: function (tooltipItem, data) {
                return data['labels'][tooltipItem[0]['index']];
            },
            label: function (tooltipItem, data) {
                return data['datasets'][0]['data'][tooltipItem['index']];
            }
        }
    };

    var dataChartTotal = [activeCases[activeCases.length - 1], recovered[recovered.length - 1], deaths[deaths.length - 1]];
    var totalChartTotal = getTotal(dataChartTotal);
    var labelsChartTotal = [lang.activeCases.other, lang.recovered.other, lang.deaths.other];
    labelsChartTotal = labelsChartTotal.map(function (label, index) { return label + ': ' + (dataChartTotal[index] / totalChartTotal * 100).toFixed(2) + '%' });

    ctx = document.getElementById('chart-total');
    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labelsChartTotal,
            datasets: [{
                data: dataChartTotal,
                backgroundColor: ["#28b8d680", "#0000ff80", "#e54acfff"]
            }]
        },
        options: {
            animation: {
                duration: 0
            },
            scales: {
                xAxes: [{
                    display: false
                }],
                yAxes: [{
                    display: false
                }]
            },
            elements: {
                center: {
                    text: lang.totalCases.other + ': ' + cases[cases.length - 1],
                    color: '#36A2EB',
                    fontStyle: 'Helvetica',
                    sidePadding: 15
                }
            },
            layout: {
                padding: getPiePadding()
            },
            onResize: onResizePie,
            tooltips: pieToolTips
        }
    });

    var totalTests = getTotal(dailyTests) + constants.unreportedDailyTests;
    var totalPositives = cases[cases.length - 1];
    var totalNegatives = totalTests - totalPositives;

    var chartTestsData = [totalPositives, totalNegatives];
    var chartTestsLabels = [lang.positives.other, lang.negatives.other];
    chartTestsLabels = chartTestsLabels.map(function (label, index) { return label + ': ' + (chartTestsData[index] / totalTests * 100).toFixed(2) + '%' });

    ctx = document.getElementById('chart-tests');
    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: chartTestsLabels,
            datasets: [{
                data: chartTestsData,
                backgroundColor: ["#28b8d680", "#0000ff80"]
            }]
        },
        options: {
            animation: {
                duration: 0
            },
            scales: {
                xAxes: [{
                    display: false
                }],
                yAxes: [{
                    display: false
                }]
            },
            elements: {
                center: {
                    text: lang.totalTests.other + ': ' + totalTests,
                    color: '#36A2EB',
                    fontStyle: 'Helvetica',
                    sidePadding: 15
                }
            },
            layout: {
                padding: getPiePadding()
            },
            onResize: onResizePie,
            tooltips: pieToolTips
        }
    });

    var langLinks = document.querySelectorAll('.lang-link');
    for (var i = 0; i < langLinks.length; ++i) {
        var langLink = langLinks[i];
        langLink.addEventListener('click', function() {
            Cookies.set("nf_lang", langLink.getAttribute('data-lang'));
        });
    }
}
