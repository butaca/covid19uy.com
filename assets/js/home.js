import langEs from "es.json";
import langEn from "en.json";
import "./chartjs-elements";
import "./chartjs-tooltipsutil";
import nfCookies from './nf-cookies'
import burger from './burger'
import './icons'
import population from "./data/worldPopulation.json";
import region from "./data/region.json";
import departmentsData from "./data/uruguayDepartments.json"
import deathsData from "./data/uruguayDeaths.json"
import vaccinationData from "./data/uruguayVaccination.json"
import chartData from "./data/chartData.json"

var MOVING_AVERAGE_DELTA = 3;

function round(number, decimalPlaces) {
    const factorOfTen = Math.pow(10, decimalPlaces)
    return Math.round(number * factorOfTen) / factorOfTen
}

if (document.readyState === 'loading') {
    document.addEventListener("DOMContentLoaded", main);
} else {
    main();
}

function getTotal(values) {
    return values.reduce(function (prev, cur) { return prev + cur });
}

function average(array, startIndex, length, prevAverage) {
    if (prevAverage == null || prevAverage == undefined) {
        var sum = 0;
        for (var i = 0; i < length && (i + startIndex) < array.length; ++i) {
            sum += array[i + startIndex];
        }
        return sum / length;
    }
    else {
        return prevAverage + (-array[startIndex - 1] + array[startIndex + length - 1]) / length;
    }
}

function movingAverage(array, prev, next) {
    var results = [];
    for (var i = 0; i < prev; ++i) {
        results.push(null);
    }
    var prevAverage = null;
    for (var i = prev; i < (array.length - next); ++i) {
        var avg = average(array, i - prev, prev + next + 1, prevAverage);
        results.push(round(avg, 2));
        prevAverage = avg;
    }
    for (var i = 0; i < next; ++i) {
        results.push(null);
    }
    return results;
}

function createMovingAverageDataset(data, length, color) {
    return {
        type: "line",
        fill: false,
        borderWidth: 1,
        pointRadius: 0,
        pointHoverRadius: 0,
        borderColor: color,
        data: movingAverage(data, length, length),
        label: "AVG",
    };
}

function createDefaultChartOptions() {
    return {
        animation: {
            duration: 0
        },
        legend: {
            labels: {
                filter: function (item) {
                    return !item.text.includes("AVG");
                }
            }
        }
    };
}

function getSiblingWithClass(elem, clazz) {
    const siblings = Array.prototype.filter.call(elem.parentNode.children, function (child) {
        return child !== elem && child.classList.contains(clazz);
    });
    if (siblings.length > 0) {
        return siblings[0];
    }
    return null;
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

    var pointRadius = 2;
    var pointHoverRadius = 3;

    var activeCasesData = chartData.lateDataEnabled ? chartData.activeCasesWithLateData : chartData.activeCases;

    var options = createDefaultChartOptions();
    options.scales = {
        yAxes: [{
            ticks: {
                min: 1
            }
        }]
    };
    options.tooltips = {
        onlyShowForDatasetIndex: [1]
    }
    var ctx = document.getElementById('chart-active-cases');
    if (ctx) {
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: chartData.dates,
                datasets: [
                    createMovingAverageDataset(activeCasesData, MOVING_AVERAGE_DELTA, "#0033bb88"),
                    {
                        pointBackgroundColor: "#28b8d6ff",
                        backgroundColor: "#28b8d680",
                        label: lang.activeCases.other,
                        data: activeCasesData,
                        pointRadius: pointRadius,
                        pointHoverRadius: pointHoverRadius
                    }
                ]
            },
            options: options
        });
    }

    options = createDefaultChartOptions();
    ctx = document.getElementById('chart-total-cases');
    if (ctx) {
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: chartData.dates,
                datasets: [{
                    pointBackgroundColor: "#28b8d6ff",
                    backgroundColor: "#28b8d680",
                    label: lang.totalCases.other,
                    data: chartData.lateDataEnabled ? chartData.totalCasesWithLateData : chartData.cases,
                    pointRadius: pointRadius,
                    pointHoverRadius: pointHoverRadius
                },
                {
                    pointBackgroundColor: "#0000ffff",
                    backgroundColor: "#0000ff80",
                    label: lang.recovered.other,
                    data: chartData.recovered,
                    pointRadius: pointRadius,
                    pointHoverRadius: pointHoverRadius
                },
                {
                    pointBackgroundColor: "#e54acfff",
                    backgroundColor: "#e54acfff",
                    label: lang.deaths.other,
                    data: chartData.deaths,
                    pointRadius: pointRadius,
                    pointHoverRadius: pointHoverRadius
                }]
            },
            options: options
        });
    }

    options = createDefaultChartOptions();
    options.scales = {
        xAxes: [{
            stacked: true
        }]
    };
    ctx = document.getElementById('chart-daily-tests');
    if (ctx) {
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: chartData.dates.slice(chartData.firstDailyTestsValidIndex, chartData.positiveTestsChartsMaxIndex + 1),
                datasets: [{
                    backgroundColor: "#7732a880",
                    label: lang.dailyPositives.other,
                    data: chartData.dialyPositives.slice(chartData.firstDailyTestsValidIndex, chartData.positiveTestsChartsMaxIndex + 1),
                },
                {
                    backgroundColor: "#ecdb3c80",
                    label: lang.dailyTests.other,
                    data: chartData.dailyTests.slice(chartData.firstDailyTestsValidIndex, chartData.positiveTestsChartsMaxIndex + 1),
                }]
            },
            options: options
        });
    }

    options = createDefaultChartOptions();
    options.scales = {
        xAxes: [{
            stacked: true
        }]
    };
    options.tooltips = {
        onlyShowForDatasetIndex: [1]
    }
    ctx = document.getElementById('chart-daily-tests-new');
    if (ctx) {
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: chartData.dates.slice(chartData.firstDailyTestsValidIndex),
                datasets: [
                    createMovingAverageDataset(chartData.dailyTests, MOVING_AVERAGE_DELTA, "#0033bb88"),
                    {
                        backgroundColor: "#ecdb3c80",
                        label: lang.dailyTests.other,
                        data: chartData.dailyTests.slice(chartData.firstDailyTestsValidIndex),
                    }]
            },
            options: options
        });
    }

    options = createDefaultChartOptions();
    ctx = document.getElementById('chart-daily-hospitalizations');
    if (ctx) {
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: chartData.dates.slice(chartData.firstHopitalizationsValidIndex),
                datasets: [{
                    backgroundColor: "#ff000080",
                    label: lang.icu.other,
                    data: chartData.dailyICU.slice(chartData.firstHopitalizationsValidIndex),
                    pointRadius: pointRadius,
                    pointHoverRadius: pointHoverRadius
                }/*,
            {
                backgroundColor: "#ecdb3c80",
                label: lang.imcu.other,
                data: dailyIMCU.slice(firstHopitalizationsValidIndex),
            }*/
                ]
            },
            options: options
        });
    }

    var dailyCasesData = chartData.lateDataEnabled ? chartData.dailyCasesWithLateData : chartData.dailyCases;

    options = createDefaultChartOptions();
    options.tooltips = {
        onlyShowForDatasetIndex: [1]
    }
    ctx = document.getElementById('chart-daily-cases');
    if (ctx) {
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: chartData.dates,
                datasets: [
                    createMovingAverageDataset(dailyCasesData, MOVING_AVERAGE_DELTA, "#0033bb88"),
                    {
                        backgroundColor: "#97DBEAFF",
                        label: lang.dailyCases.other,
                        data: dailyCasesData,
                    }]
            },
            options: options
        });
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

    var dataChartTotal = [chartData.activeCases[chartData.activeCases.length - 1], chartData.recovered[chartData.recovered.length - 1], chartData.deaths[chartData.deaths.length - 1]];
    var totalChartTotal = getTotal(dataChartTotal);
    var labelsChartTotal = [lang.activeCases.other, lang.recovered.other, lang.deaths.other];
    labelsChartTotal = labelsChartTotal.map(function (label, index) { return label + ': ' + (dataChartTotal[index] / totalChartTotal * 100).toFixed(2) + '%' });

    options = createDefaultChartOptions();
    options.scales = {
        xAxes: [{
            display: false
        }],
        yAxes: [{
            display: false
        }]
    };
    options.elements = {
        center: {
            text: lang.totalCases.other + ': ' + chartData.cases[chartData.cases.length - 1].toLocaleString(htmlLang),
            color: '#36A2EB',
            fontStyle: 'Helvetica',
            sidePadding: 15
        }
    };
    options.tooltips = pieToolTips;
    ctx = document.getElementById('chart-total');
    if (ctx) {
        new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labelsChartTotal,
                datasets: [{
                    data: dataChartTotal,
                    backgroundColor: ["#28b8d680", "#0000ff80", "#e54acfff"]
                }]
            },
            options: options
        });
    }

    var totalTests = getTotal(chartData.dailyTests.slice(0, chartData.positiveTestsChartsMaxIndex + 1)) + chartData.unreportedDailyTests;
    var totalPositives = chartData.positives.slice(0, chartData.positiveTestsChartsMaxIndex + 1)[chartData.positives.length - 1];
    var totalNegatives = totalTests - totalPositives;

    var chartTestsData = [totalPositives, totalNegatives];
    var chartTestsLabels = [lang.positives.other, lang.negatives.other];
    chartTestsLabels = chartTestsLabels.map(function (label, index) { return label + ': ' + (chartTestsData[index] / totalTests * 100).toFixed(2) + '%' });

    options = createDefaultChartOptions();
    options.scales = {
        xAxes: [{
            display: false
        }],
        yAxes: [{
            display: false
        }]
    };
    options.elements = {
        center: {
            text: lang.totalTests.other + ': ' + totalTests,
            color: '#36A2EB',
            fontStyle: 'Helvetica',
            sidePadding: 15
        }
    };
    options.tooltips = pieToolTips
    ctx = document.getElementById('chart-tests');
    if (ctx) {
        new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: chartTestsLabels,
                datasets: [{
                    data: chartTestsData,
                    backgroundColor: ["#7732a880", "#83d02a80"]
                }]
            },
            options: options
        });

        options = createDefaultChartOptions();
        options.scales = {
            yAxes: [{
                ticks: {
                    callback: function (value) {
                        return value + "%"
                    }
                }
            }]
        };
        options.tooltips = {
            callbacks: {
                label: function (tooltipItem, data) {
                    return data['datasets'][0]['data'][tooltipItem['index']].toFixed(2) + " %";
                }
            }
        };
    }

    ctx = document.getElementById('chart-tests-dialy-positives');
    if (ctx) {
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: chartData.dates.slice(chartData.firstDailyTestsValidIndex, chartData.positiveTestsChartsMaxIndex + 1),
                datasets: [{
                    pointBackgroundColor: "#7732a8ff",
                    backgroundColor: "#7732a880",
                    label: lang.graphTitleDailyPositives.other,
                    data: chartData.dailyPositivesPercent.slice(chartData.firstDailyTestsValidIndex, chartData.positiveTestsChartsMaxIndex + 1),
                    pointRadius: pointRadius,
                    pointHoverRadius: pointHoverRadius
                }]
            },
            options: options
        });
    }

    options = createDefaultChartOptions();
    options.scales = {
        xAxes: [{
            stacked: true
        }]
    };
    options.tooltips = {
        onlyShowForDatasetIndex: [1, 2]
    }

    ctx = document.getElementById('chart-healthcare-workers');
    if (ctx) {
        var hcData = chartData.dailyHealthcareWorkers.slice(chartData.firstValidHealthcareWorkerIndex);
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: chartData.dates.slice(chartData.firstValidHealthcareWorkerIndex),
                datasets: [
                    createMovingAverageDataset(hcData, MOVING_AVERAGE_DELTA, "#0033bb88"),
                    {
                        backgroundColor: "#01C6B2FF",
                        label: lang.healthCareWorkerCases.other,
                        data: hcData,
                    },
                    {
                        backgroundColor: "#97DBEAFF",
                        label: lang.dailyCases.other,
                        data: chartData.dailyCases.slice(chartData.firstValidHealthcareWorkerIndex),
                    }]
            },
            options: options
        });
    }

    options = createDefaultChartOptions();
    options.scales = {
        yAxes: [{
            ticks: {
                callback: function (value) {
                    return value + "%"
                }
            }
        }]
    }
    options.tooltips = {
        callbacks: {
            label: function (tooltipItem, data) {
                return data['datasets'][0]['data'][tooltipItem['index']].toFixed(2) + " %";
            }
        }
    };

    ctx = document.getElementById('chart-healthcare-workers-percent');
    if (ctx) {
        var hcPercentData = chartData.dailyHealthcareWorkersPercent.slice(chartData.firstValidHealthcareWorkerIndex);
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: chartData.dates.slice(chartData.firstValidHealthcareWorkerIndex),
                datasets: [
                    createMovingAverageDataset(hcPercentData, MOVING_AVERAGE_DELTA, "#0033bb88"),
                    {
                        backgroundColor: "#01C6B2FF",
                        label: lang.graphTitleHealthcareWorkersPercent.other,
                        data: hcPercentData,
                        pointRadius: pointRadius,
                        pointHoverRadius: pointHoverRadius
                    }]
            },
            options: options
        });
    }

    options = createDefaultChartOptions();
    options.scales = {
        yAxes: [{
            ticks: {
                callback: function (value) {
                    return value + "%"
                }
            }
        }]
    };
    options.tooltips = {
        callbacks: {
            label: function (tooltipItem, data) {
                return data['datasets'][tooltipItem.datasetIndex]['data'][tooltipItem['index']] + " %";
            }
        }
    };
    options.scales = {
        yAxes: [{
            ticks: {
                callback: function (value) {
                    return value + "%"
                }
            }
        }]
    };
    options.tooltips = {
        callbacks: {
            label: function (tooltipItem, data) {
                return data['datasets'][tooltipItem.datasetIndex]['data'][tooltipItem['index']].toFixed(2) + " %";
            }
        }
    };

    ctx = document.getElementById('chart-daily-hospitalizations-percent');
    if (ctx) {
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: chartData.dates.slice(chartData.firstHopitalizationsValidIndex),
                datasets: [{
                    pointBackgroundColor: "#d9554cff",
                    backgroundColor: "#d9554c80",
                    label: lang.icu.other,
                    data: chartData.dailyICUPercent.slice(chartData.firstHopitalizationsValidIndex),
                    pointRadius: pointRadius,
                    pointHoverRadius: pointHoverRadius
                }/*,
            {
                pointBackgroundColor: "#d9554cff",
                backgroundColor: "#ecdb3c80",
                label: lang.imcu.other,
                data: dailyIMCUPercent.slice(firstHopitalizationsValidIndex),
            }*/
                ]
            },
            options: options
        });
    }

    var activeCasesData = chartData.lateDataEnabled ? chartData.dailyActiveCasesWithLateData : chartData.dailyActiveCases;
    options = createDefaultChartOptions();
    options.tooltips = {
        onlyShowForDatasetIndex: [1]
    }
    ctx = document.getElementById('chart-daily-active-cases');
    if (ctx) {
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: chartData.dates,
                datasets: [
                    createMovingAverageDataset(activeCasesData, MOVING_AVERAGE_DELTA, "#0033bb88"),
                    {
                        pointBackgroundColor: "#28b8d6ff",
                        backgroundColor: "#28b8d680",
                        label: lang.newActiveCases.other,
                        data: activeCasesData,
                    }]
            },
            options: options
        });
    }

    var regionDays = Math.min(chartData.dates.length, region.data.argentina.cases.length);

    region.data.uruguay = {
        dates: chartData.dates,
        cases: chartData.cases,
        recovered: chartData.recovered,
        deaths: chartData.deaths
    };

    region.data.uruguay.color = "#72a5d5";
    region.data.argentina.color = "#0338a8";
    region.data.brazil.color = "#fee103";
    region.data.chile.color = "#cf291d";
    region.data.paraguay.color = "#029a3a";

    var countries = Object.keys(region.data);
    var activeCasesDatasets = [];
    var casesDatasets = [];
    var deathsDatasets = [];
    for (var i = 0; i < countries.length; ++i) {
        var countryName = countries[i];
        var country = region.data[countryName];
        var populationFactor = 1000000 / population[countryName];

        activeCasesDatasets.push({
            pointRadius: 0,
            pointHoverRadius: 2,
            borderWidth: 2,
            pointBackgroundColor: country.color,
            borderColor: country.color,
            label: lang[countryName].other,
            fill: false,
            data: country.cases.slice(0, regionDays).map((el, index) => Math.round((el - country.recovered[index] - country.deaths[index]) * populationFactor)),
        });

        casesDatasets.push({
            pointRadius: 0,
            pointHoverRadius: 2,
            borderWidth: 2,
            pointBackgroundColor: country.color,
            borderColor: country.color,
            label: lang[countryName].other,
            fill: false,
            data: country.cases.slice(0, regionDays).map(el => Math.round(el * populationFactor)),
        });

        deathsDatasets.push({
            pointRadius: 0,
            pointHoverRadius: 2,
            borderWidth: 2,
            pointBackgroundColor: country.color,
            borderColor: country.color,
            label: lang[countryName].other,
            fill: false,
            data: country.deaths.slice(0, regionDays).map(el => Math.round(el * populationFactor)),
        });
    }

    var regionChartsOptions = createDefaultChartOptions();
    regionChartsOptions.legend = {
        labels: {
            usePointStyle: true
        }
    };

    ctx = document.getElementById('chart-region-active-cases');
    if (ctx) {
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: chartData.dates,
                datasets: activeCasesDatasets
            },
            options: regionChartsOptions
        });
    }

    ctx = document.getElementById('chart-region-cases');
    if (ctx) {
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: chartData.dates,
                datasets: casesDatasets
            },
            options: regionChartsOptions
        });
    }

    ctx = document.getElementById('chart-region-deaths');
    if (ctx) {
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: chartData.dates,
                datasets: deathsDatasets
            },
            options: regionChartsOptions
        });
    }

    var menDeaths = [0, 0, 0, 0, 0];
    var womenDeaths = [0, 0, 0, 0, 0];
    var unknownSexDeaths = [0, 0, 0, 0, 0];
    var totalDeathsByAge = [0, 0, 0, 0, 0];
    var deathAgeRangesLabels = ["0 - 17", "18 - 44", "45 - 64", "65 - 74", "75+"];

    for (var i = 0; i < deathsData.deaths.length; ++i) {
        var death = deathsData.deaths[i];

        var age = death.age;
        var sex = death.s;

        var sexDeaths = null;

        if (sex === "F") {
            sexDeaths = womenDeaths;
        } else if (sex === "M") {
            sexDeaths = menDeaths;
        }
        else {
            sexDeaths = unknownSexDeaths;
        }
        var index = -1;

        if (age <= 17) {
            index = 0;
        }
        else if (age <= 44) {
            index = 1;
        }
        else if (age <= 64) {
            index = 2;
        }
        else if (age <= 74) {
            index = 3;
        }
        else {
            index = 4;
        }

        totalDeathsByAge[index]++;

        if (sexDeaths != null) {
            sexDeaths[index]++;
        }
    }

    options = createDefaultChartOptions();
    ctx = document.getElementById('chart-deaths');
    if (ctx) {
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: deathAgeRangesLabels,
                datasets: [
                    {
                        backgroundColor: "#B871FAff",
                        label: lang.men.other,
                        data: menDeaths,
                    },
                    {
                        backgroundColor: "#FA7571ff",
                        label: lang.women.other,
                        data: womenDeaths,
                    }
                ]
            },
            options: options
        });
    }

    var dataDeathsTotal = [menDeaths.reduce(function (acc, val) { return acc + val; }, 0), womenDeaths.reduce(function (acc, val) { return acc + val; }, 0)];
    var totalDeahts = getTotal(dataDeathsTotal);

    options = createDefaultChartOptions();
    options.scales = {
        xAxes: [{
            display: false
        }],
        yAxes: [{
            display: false
        }]
    };
    options.elements = {
        center: {
            text: lang.totalDeaths.other + ': ' + totalDeahts,
            color: '#36A2EB',
            fontStyle: 'Helvetica',
            sidePadding: 15
        }
    };
    options.tooltips = pieToolTips;
    ctx = document.getElementById('chart-deaths-sex');

    var deathBySexLabels = [lang.men.other, lang.women.other];
    deathBySexLabels = deathBySexLabels.map(function (label, index) { return label + ': ' + (dataDeathsTotal[index] / totalDeahts * 100).toFixed(2) + '%' });

    if (ctx) {
        new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: deathBySexLabels,
                datasets: [{
                    data: dataDeathsTotal,
                    backgroundColor: ["#B871FAff", "#FA7571ff"]
                }]
            },
            options: options
        });
    }

    options = createDefaultChartOptions();
    ctx = document.getElementById('chart-deaths-new');
    if (ctx) {
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: deathAgeRangesLabels,
                datasets: [
                    {
                        backgroundColor: "#e54acfff",
                        label: lang.graphDeathsNew.other,
                        data: totalDeathsByAge,
                    }
                ]
            },
            options: options
        });
    }

    var positivityRate = chartData.dailyPositivityRate.slice(chartData.firstDailyTestsValidIndex);
    options = createDefaultChartOptions();
    options.scales = {
        yAxes: [{
            ticks: {
                callback: function (value) {
                    return value + "%"
                }
            }
        }]
    };
    options.tooltips = {
        callbacks: {
            label: function (tooltipItem, data) {
                return data['datasets'][0]['data'][tooltipItem['index']].toFixed(2) + " %";
            }
        }
    };
    ctx = document.getElementById('chart-daily-positivity-rate');
    if (ctx) {
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: chartData.dates.slice(chartData.firstDailyTestsValidIndex),
                datasets: [
                    createMovingAverageDataset(positivityRate, MOVING_AVERAGE_DELTA, "#0033bb88"),
                    {
                        backgroundColor: "#7732a880",
                        label: lang.graphPositivityRate.other,
                        data: positivityRate,
                    }
                ]
            },
            options: options
        });
    }

    options = createDefaultChartOptions();
    ctx = document.getElementById('chart-daily-deaths');
    if (ctx) {
        var dailyDeathsFiltered = chartData.dailyDeaths.slice(chartData.deathsFirstIndex);
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: chartData.dates.slice(chartData.deathsFirstIndex),
                datasets: [
                    createMovingAverageDataset(dailyDeathsFiltered, MOVING_AVERAGE_DELTA, "#0033bb88"),
                    {
                        backgroundColor: "#e54acfff",
                        label: lang.graphDailyDeaths.other,
                        data: dailyDeathsFiltered,
                    }
                ]
            },
            options: options
        });
    }

    var departments = departmentsData.departments;
    var uruguayMap = document.getElementById("uruguay-map");

    var minActives = Number.MAX_SAFE_INTEGER;
    var maxActives = 0;
    for (var key in departments) {
        if (departments.hasOwnProperty(key)) {
            var actives = departments[key];
            minActives = Math.min(minActives, actives);
            maxActives = Math.max(maxActives, actives);
        }
    }

    var paths = uruguayMap.getElementsByTagName("path");
    for (var i = 0; i < paths.length; ++i) {
        (function (path) {
            var department = departments[path.getAttribute("name")];
            var activeCases = department;
            if (activeCases > 0) {
                var center = path.getAttribute("center").split(",");
                var x = center[0];
                var y = center[1];

                var svgNS = "http://www.w3.org/2000/svg";
                var newText = document.createElementNS(svgNS, "text");
                newText.setAttribute("x", x);
                newText.setAttribute("y", y);
                newText.setAttribute("font-size", "42");
                newText.setAttribute("dominant-baseline", "middle");
                newText.setAttribute("text-anchor", "middle");
                newText.setAttribute("pointer-events", "none");
                newText.setAttribute("fill", "black");
                newText.setAttribute("stroke-width", "0");
                newText.setAttribute("font-weight", "bold");

                var textNode = document.createTextNode(activeCases.toString());
                newText.appendChild(textNode);
                uruguayMap.appendChild(newText);

                path.setAttribute('style', 'fill: #40bfdb');

                var n = (activeCases - minActives) / (maxActives - minActives);
                path.setAttribute("fill-opacity", Math.pow(n, 1.0 / 3.0));
            }
        })(paths[i])
    }

    ////////////////////
    const utcDate = new Date(vaccinationData.date)
    const vacDate = new Date(utcDate.getTime() + utcDate.getTimezoneOffset() * 60000);
    const vacDateTokens = vaccinationData.todayDate.split(':');
    if (vacDateTokens.length >= 2) {
        vacDate.setHours(vacDateTokens[0]);
        vacDate.setMinutes(vacDateTokens[1]);
    }

    var vacDates = vaccinationData.history.date.map(function (el) {
        if (flipDate) {
            var s = el.split("/");
            return s[1] + "/" + s[0];
        } else {
            return el;
        }
    });

    let totalVacs = vaccinationData.coronavacTotal + vaccinationData.pfizerTotal;

    options = createDefaultChartOptions();
    ctx = document.getElementById('chart-daily-vacs');

    let dateElem = getSiblingWithClass(ctx, "date");
    if (dateElem != null) {
        dateElem.innerHTML = lang.updated.other + ": " + vacDate.toLocaleString(htmlLang);
    }

    if (ctx) {
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: vacDates,
                datasets: [
                    {
                        pointBackgroundColor: "#0000FFFF",
                        backgroundColor: "#0000FF80",
                        label: lang.vacTotal.other,
                        data: vaccinationData.history.total,
                    },
                    {
                        pointBackgroundColor: "#FF8C00ff",
                        backgroundColor: "#FF8C0080",
                        label: lang.vacCoronavac.other,
                        data: vaccinationData.history.coronavac,
                    },
                    {
                        pointBackgroundColor: "#00CC00FF",
                        backgroundColor: "#00CC0080",
                        label: lang.vacPfizer.other,
                        data: vaccinationData.history.pfizer,
                    }
                ]
            },
            options: options
        });
    }

    options = createDefaultChartOptions();
    options.scales = {
        xAxes: [{
            display: false
        }],
        yAxes: [{
            display: false
        }]
    };
    options.elements = {
        center: {
            text: (totalVacs > 0) ? (lang.vacTotal.other + ': ' + totalVacs.toLocaleString(htmlLang)) : lang.notAvailable.other,
            color: '#36A2EB',
            fontStyle: 'Helvetica',
            sidePadding: 15
        }
    };
    options.tooltips = pieToolTips;
    ctx = document.getElementById('chart-total-vacs');

    dateElem = getSiblingWithClass(ctx, "date");
    if (dateElem != null) {
        dateElem.innerHTML = lang.updated.other + ": " + vacDate.toLocaleString(htmlLang);
    }
    if (ctx) {
        new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: [lang.vacCoronavac.other, lang.vacPfizer.other],
                datasets: [{
                    data: [vaccinationData.coronavacTotal, vaccinationData.pfizerTotal],
                    backgroundColor: ["#FF8C0080", "#00CC0080"]
                }]
            },
            options: options
        });
    }
}
