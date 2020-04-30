import data from "../../data/uruguay.json";
import langEs from "../../i18n/es.yaml";
import langEn from "../../i18n/en.yaml";
import "./chartjs-elements";
import nfCookies from './nf-cookies'
import burger from './burger'
import './icons'

if (document.readyState === 'loading') {
    document.addEventListener("DOMContentLoaded", main);
} else {
    main();
}

function getTotal(values) {
    return values.reduce(function (prev, cur) { return prev + cur });
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

    var positives = [];
    var dialyPositives = [];
    var dates = [];
    var deaths = [];
    var recovered = [];
    var activeCases = [];
    var dailyICU = [];
    var dailyIMCU = [];
    var dailyICUPercent = [];
    var dailyIMCUPercent = [];
    var firstHopitalizationsValidIndex = -1;
    var prevDayTotalPositives = 0;
    var firstValidHealthcareWorkerIndex = -1;
    var prevHealthcareWorkers = 0;
    var dailyHealthcareWorkers = [];
    var dailyHealthcareWorkersPercent = [];
    var dailyTests = [];
    var firstDailyTestsValidIndex = -1;
    var dailyPositivesPercent = [];
    var cases = [];
    var dailyCases = [];
    var prevDayTotalCases = 0;

    data.data.forEach(function (el, index) {
        var todayPositives = el.positives;
        dialyPositives.push(todayPositives);

        var date = new Date(el.date);
        var day = date.getUTCDate();
        var month = (date.getUTCMonth() + 1);
        dates.push(flipDate ? month + "/" + day : day + "/" + month);

        var todayTotalDeaths = el.deaths != undefined ? el.deaths : 0;
        deaths.push(todayTotalDeaths);

        var todayTotalRecovered = el.recovered != undefined ? el.recovered : 0;
        recovered.push(todayTotalRecovered);

        var todayTotalPositives = prevDayTotalPositives + todayPositives;
        positives.push(todayTotalPositives);
        prevDayTotalPositives += todayPositives;

        var totalTodayCases = el.cases != undefined ? el.cases : todayTotalPositives;
        cases.push(totalTodayCases);

        var todayHealthcareWorker = el.hc - prevHealthcareWorkers;
        dailyHealthcareWorkers.push(todayHealthcareWorker);
        prevHealthcareWorkers = el.hc;
        if (firstValidHealthcareWorkerIndex < 0 && el.hc != undefined) {
            firstValidHealthcareWorkerIndex = index + 1;
        }

        var todayCases = totalTodayCases - prevDayTotalCases;
        todayCases = Math.max(0, todayCases);

        prevDayTotalCases = totalTodayCases;
        dailyCases.push(todayCases);

        var todayActiveCases = totalTodayCases - todayTotalDeaths - todayTotalRecovered;
        activeCases.push(todayActiveCases);

        var todayICU = el.icu != undefined ? el.icu : 0;
        var todayIMCU = el.imcu != undefined ? el.imcu : 0;

        dailyICU.push(todayICU);
        dailyIMCU.push(todayIMCU);

        dailyICUPercent.push((todayICU / todayActiveCases * 100).toFixed(2));
        dailyIMCUPercent.push((todayIMCU / todayActiveCases * 100).toFixed(2));

        if (firstHopitalizationsValidIndex < 0 && (todayICU > 0 || todayIMCU > 0)) {
            firstHopitalizationsValidIndex = index;
        }

        dailyHealthcareWorkersPercent.push((Math.min(1, Math.max(0, todayHealthcareWorker / todayCases)) * 100).toFixed(2));

        var todayTests = el.tests;
        if (firstDailyTestsValidIndex < 0 && todayTests != undefined) {
            firstDailyTestsValidIndex = index;
        }
        dailyTests.push(todayTests != undefined ? todayTests : todayPositives);
        dailyPositivesPercent.push((todayPositives / todayTests * 100).toFixed(2));
    });

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
            scales: {
                yAxes: [{
                    ticks: {
                        min: 1
                    }
                }]
            },
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
                pointBackgroundColor: "#0000ffff",
                backgroundColor: "#0000ff80",
                label: lang.recovered.other,
                data: recovered,
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

    ctx = document.getElementById('chart-daily-tests');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: dates.slice(firstDailyTestsValidIndex),
            datasets: [{
                backgroundColor: "#7732a880",
                label: lang.dailyPositives.other,
                data: dialyPositives.slice(firstDailyTestsValidIndex),
            },
            {
                backgroundColor: "#ecdb3c80",
                label: lang.dailyTests.other,
                data: dailyTests.slice(firstDailyTestsValidIndex),
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

    ctx = document.getElementById('chart-daily-hospitalizations');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: dates.slice(firstHopitalizationsValidIndex),
            datasets: [{
                backgroundColor: "#ff000080",
                label: lang.icu.other,
                data: dailyICU.slice(firstHopitalizationsValidIndex),
            },
            {
                backgroundColor: "#ecdb3c80",
                label: lang.imcu.other,
                data: dailyIMCU.slice(firstHopitalizationsValidIndex),
            }
            ]
        },
        options: {
            animation: {
                duration: 0
            }
        }
    });

    ctx = document.getElementById('chart-daily-cases');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: dates,
            datasets: [{
                backgroundColor: "#97DBEAFF",
                label: lang.dailyCases.other,
                data: dailyCases,
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
            tooltips: pieToolTips
        }
    });

    var totalTests = getTotal(dailyTests) + data.unreportedDailyTests;
    var totalPositives = positives[positives.length - 1];
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
                backgroundColor: ["#7732a880", "#83d02a80"]
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
            tooltips: pieToolTips
        }
    });

    ctx = document.getElementById('chart-tests-dialy-positives');
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: dates.slice(firstDailyTestsValidIndex),
            datasets: [{
                pointBackgroundColor: "#7732a8ff",
                backgroundColor: "#7732a880",
                label: lang.graphTitleDailyPositives.other,
                data: dailyPositivesPercent.slice(firstDailyTestsValidIndex),
            }]
        },
        options: {
            scales: {
                yAxes: [{
                    ticks: {
                        callback: function (value) {
                            return value + "%"
                        }
                    }
                }]
            },
            tooltips: {
                callbacks: {
                    label: function (tooltipItem, data) {
                        return data['datasets'][0]['data'][tooltipItem['index']] + " %";
                    }
                }
            },
            animation: {
                duration: 0
            }
        }
    });

    ctx = document.getElementById('chart-healthcare-workers');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: dates.slice(firstValidHealthcareWorkerIndex),
            datasets: [
                {
                    backgroundColor: "#01C6B2FF",
                    label: lang.healthCareWorkerCases.other,
                    data: dailyHealthcareWorkers.slice(firstValidHealthcareWorkerIndex),
                },
                {
                    backgroundColor: "#97DBEAFF",
                    label: lang.dailyCases.other,
                    data: dailyCases.slice(firstValidHealthcareWorkerIndex),
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

    ctx = document.getElementById('chart-healthcare-workers-percent');
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: dates.slice(firstValidHealthcareWorkerIndex),
            datasets: [{
                backgroundColor: "#01C6B2FF",
                label: lang.graphTitleHealthcareWorkersPercent.other,
                data: dailyHealthcareWorkersPercent.slice(firstValidHealthcareWorkerIndex),
            }]
        },
        options: {
            scales: {
                yAxes: [{
                    ticks: {
                        callback: function (value) {
                            return value + "%"
                        }
                    }
                }]
            },
            tooltips: {
                callbacks: {
                    label: function (tooltipItem, data) {
                        return data['datasets'][0]['data'][tooltipItem['index']] + " %";
                    }
                }
            },
            animation: {
                duration: 0
            }
        }
    });

    ctx = document.getElementById('chart-daily-hospitalizations-percent');
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: dates.slice(firstHopitalizationsValidIndex),
            datasets: [{
                pointBackgroundColor: "#d9554cff",
                backgroundColor: "#d9554c80",
                label: lang.icu.other,
                data: dailyICUPercent.slice(firstHopitalizationsValidIndex),
            }/*,
            {
                pointBackgroundColor: "#d9554cff",
                backgroundColor: "#ecdb3c80",
                label: lang.imcu.other,
                data: dailyIMCUPercent.slice(firstHopitalizationsValidIndex),
            }*/
        ]
        },
        options: {
            scales: {
                yAxes: [{
                    ticks: {
                        callback: function (value) {
                            return value + "%"
                        }
                    }
                }]
            },
            tooltips: {
                callbacks: {
                    label: function (tooltipItem, data) {
                        return data['datasets'][tooltipItem.datasetIndex]['data'][tooltipItem['index']] + " %";
                    }
                }
            },
            animation: {
                duration: 0
            }
        }
    });
}
