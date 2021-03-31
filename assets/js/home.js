import data from "./data/uruguay.json";
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

    var positives = [];
    var dialyPositives = [];
    var dates = [];
    var deaths = [];
    var recovered = [];
    var activeCases = [];
    var dailyActiveCases = [];
    var prevTodayActiveCases = 0;
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
    var positiveTestsChartsMaxIndex = -1;
    var dailyPositivityRate = [];
    var dailyDeaths = [];
    var deathsFirstIndex = -1;
    var dailyCasesWithLateData = [];

    data.data.forEach(function (el, index) {
        var todayPositives = el.positives;
        if (todayPositives != undefined) {
            positiveTestsChartsMaxIndex = index;
            dialyPositives.push(todayPositives);
        }

        var date = new Date(el.date);
        var day = date.getUTCDate();
        var month = (date.getUTCMonth() + 1);
        dates.push(flipDate ? month + "/" + day : day + "/" + month);

        yesterdayTotalDeaths = deaths.length > 0 ? deaths[deaths.length - 1] : 0;

        var todayTotalDeaths = el.deaths != undefined ? el.deaths : 0;
        if (el.deaths != undefined && deathsFirstIndex == -1) {
            deathsFirstIndex = index;
        }
        deaths.push(todayTotalDeaths);

        dailyDeaths.push(todayTotalDeaths - yesterdayTotalDeaths);

        var todayTotalRecovered = el.recovered != undefined ? el.recovered : 0;
        recovered.push(todayTotalRecovered);

        if (todayPositives != undefined) {
            var todayTotalPositives = prevDayTotalPositives + todayPositives;
            positives.push(todayTotalPositives);
            prevDayTotalPositives += todayPositives;
        }

        var totalTodayCases = el.cases != undefined ? el.cases : todayTotalPositives;
        cases.push(totalTodayCases);

        var todayHealthcareWorker = Math.max(0, el.hc - prevHealthcareWorkers);
        dailyHealthcareWorkers.push(todayHealthcareWorker);
        prevHealthcareWorkers = el.hc;
        if (firstValidHealthcareWorkerIndex < 0 && el.hc != undefined) {
            firstValidHealthcareWorkerIndex = index + 1;
        }

        var todayCases = totalTodayCases - prevDayTotalCases;
        if (el.newCases != undefined) {
            todayCases = el.newCases;
        }

        todayCases = Math.max(0, todayCases);

        prevDayTotalCases = totalTodayCases;
        dailyCases.push(todayCases);

        var todayCasesWithLateData = todayCases;
        if (el.lateNewCases != undefined) {
            todayCasesWithLateData += getTotal(el.lateNewCases);
        }
        dailyCasesWithLateData.push(todayCasesWithLateData);

        var todayActiveCases = el.activeCases != undefined ? el.activeCases : (totalTodayCases - todayTotalDeaths - todayTotalRecovered);
        activeCases.push(todayActiveCases);

        dailyActiveCases.push(todayActiveCases - prevTodayActiveCases);
        prevTodayActiveCases = todayActiveCases;

        var todayICU = el.icu != undefined ? el.icu : 0;
        var todayIMCU = el.imcu != undefined ? el.imcu : 0;

        dailyICU.push(todayICU);
        dailyIMCU.push(todayIMCU);

        dailyICUPercent.push((todayActiveCases > 0 ? (todayICU / todayActiveCases * 100) : 0));
        dailyIMCUPercent.push((todayActiveCases > 0 ? (todayIMCU / todayActiveCases * 100) : 0));

        if (firstHopitalizationsValidIndex < 0 && (todayICU > 0 || todayIMCU > 0)) {
            firstHopitalizationsValidIndex = index;
        }

        var todayCasesHC = Math.max(todayHealthcareWorker, todayCases);
        dailyHealthcareWorkersPercent.push((todayCasesHC > 0 ? (Math.min(1, Math.max(0, todayHealthcareWorker / todayCasesHC)) * 100) : 0));

        var todayTests = el.tests;
        if (firstDailyTestsValidIndex < 0 && todayTests != undefined) {
            firstDailyTestsValidIndex = index;
        }

        dailyTests.push(todayTests != undefined ? todayTests : todayPositives);
        if (todayPositives != undefined) {
            dailyPositivesPercent.push(((todayTests > 0 ? (todayPositives / todayTests) : 0) * 100));
        }

        dailyPositivityRate.push(todayCases / todayTests * 100);
    });

    var pointRadius = 2;
    var pointHoverRadius = 3;

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
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: dates,
            datasets: [
                createMovingAverageDataset(activeCases, MOVING_AVERAGE_DELTA, "#0033bb88"),
                {
                    pointBackgroundColor: "#28b8d6ff",
                    backgroundColor: "#28b8d680",
                    label: lang.activeCases.other,
                    data: activeCases,
                    pointRadius: pointRadius,
                    pointHoverRadius: pointHoverRadius
                }
            ]
        },
        options: options
    });

    options = createDefaultChartOptions();
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
                pointRadius: pointRadius,
                pointHoverRadius: pointHoverRadius
            },
            {
                pointBackgroundColor: "#0000ffff",
                backgroundColor: "#0000ff80",
                label: lang.recovered.other,
                data: recovered,
                pointRadius: pointRadius,
                pointHoverRadius: pointHoverRadius
            },
            {
                pointBackgroundColor: "#e54acfff",
                backgroundColor: "#e54acfff",
                label: lang.deaths.other,
                data: deaths,
                pointRadius: pointRadius,
                pointHoverRadius: pointHoverRadius
            }]
        },
        options: options
    });

    options = createDefaultChartOptions();
    options.scales = {
        xAxes: [{
            stacked: true
        }]
    };
    ctx = document.getElementById('chart-daily-tests');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: dates.slice(firstDailyTestsValidIndex, positiveTestsChartsMaxIndex + 1),
            datasets: [{
                backgroundColor: "#7732a880",
                label: lang.dailyPositives.other,
                data: dialyPositives.slice(firstDailyTestsValidIndex, positiveTestsChartsMaxIndex + 1),
            },
            {
                backgroundColor: "#ecdb3c80",
                label: lang.dailyTests.other,
                data: dailyTests.slice(firstDailyTestsValidIndex, positiveTestsChartsMaxIndex + 1),
            }]
        },
        options: options
    });

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
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: dates.slice(firstDailyTestsValidIndex),
            datasets: [
                createMovingAverageDataset(dailyTests, MOVING_AVERAGE_DELTA, "#0033bb88"),
                {
                    backgroundColor: "#ecdb3c80",
                    label: lang.dailyTests.other,
                    data: dailyTests.slice(firstDailyTestsValidIndex),
                }]
        },
        options: options
    });

    options = createDefaultChartOptions();
    ctx = document.getElementById('chart-daily-hospitalizations');
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: dates.slice(firstHopitalizationsValidIndex),
            datasets: [{
                backgroundColor: "#ff000080",
                label: lang.icu.other,
                data: dailyICU.slice(firstHopitalizationsValidIndex),
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

    var dailyCasesData = data.lateNewCasesEnabled ? dailyCasesWithLateData : dailyCases;

    options = createDefaultChartOptions();
    options.tooltips = {
        onlyShowForDatasetIndex: [1]
    }
    ctx = document.getElementById('chart-daily-cases');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: dates,
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
            text: lang.totalCases.other + ': ' + cases[cases.length - 1].toLocaleString(htmlLang),
            color: '#36A2EB',
            fontStyle: 'Helvetica',
            sidePadding: 15
        }
    };
    options.tooltips = pieToolTips;
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
        options: options
    });

    var totalTests = getTotal(dailyTests.slice(0, positiveTestsChartsMaxIndex + 1)) + data.unreportedDailyTests;
    var totalPositives = positives.slice(0, positiveTestsChartsMaxIndex + 1)[positives.length - 1];
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
    ctx = document.getElementById('chart-tests-dialy-positives');
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: dates.slice(firstDailyTestsValidIndex, positiveTestsChartsMaxIndex + 1),
            datasets: [{
                pointBackgroundColor: "#7732a8ff",
                backgroundColor: "#7732a880",
                label: lang.graphTitleDailyPositives.other,
                data: dailyPositivesPercent.slice(firstDailyTestsValidIndex, positiveTestsChartsMaxIndex + 1),
                pointRadius: pointRadius,
                pointHoverRadius: pointHoverRadius
            }]
        },
        options: options
    });

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
    var hcData = dailyHealthcareWorkers.slice(firstValidHealthcareWorkerIndex);
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: dates.slice(firstValidHealthcareWorkerIndex),
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
                    data: dailyCases.slice(firstValidHealthcareWorkerIndex),
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
    }
    options.tooltips = {
        callbacks: {
            label: function (tooltipItem, data) {
                return data['datasets'][0]['data'][tooltipItem['index']].toFixed(2) + " %";
            }
        }
    };

    ctx = document.getElementById('chart-healthcare-workers-percent');
    var hcPercentData = dailyHealthcareWorkersPercent.slice(firstValidHealthcareWorkerIndex);
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: dates.slice(firstValidHealthcareWorkerIndex),
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
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: dates.slice(firstHopitalizationsValidIndex),
            datasets: [{
                pointBackgroundColor: "#d9554cff",
                backgroundColor: "#d9554c80",
                label: lang.icu.other,
                data: dailyICUPercent.slice(firstHopitalizationsValidIndex),
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

    options = createDefaultChartOptions();
    options.tooltips = {
        onlyShowForDatasetIndex: [1]
    }
    ctx = document.getElementById('chart-daily-active-cases');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: dates,
            datasets: [
                createMovingAverageDataset(dailyActiveCases, MOVING_AVERAGE_DELTA, "#0033bb88"),
                {
                    pointBackgroundColor: "#28b8d6ff",
                    backgroundColor: "#28b8d680",
                    label: lang.newActiveCases.other,
                    data: dailyActiveCases,
                }]
        },
        options: options
    });

    var regionDays = Math.min(dates.length, region.data.argentina.cases.length);

    region.data.uruguay = {
        dates: dates,
        cases: cases,
        recovered: recovered,
        deaths: deaths
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
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: dates,
            datasets: activeCasesDatasets
        },
        options: regionChartsOptions
    });

    ctx = document.getElementById('chart-region-cases');
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: dates,
            datasets: casesDatasets
        },
        options: regionChartsOptions
    });

    ctx = document.getElementById('chart-region-deaths');
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: dates,
            datasets: deathsDatasets
        },
        options: regionChartsOptions
    });

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

    options = createDefaultChartOptions();
    ctx = document.getElementById('chart-deaths-new');

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

    var positivityRate = dailyPositivityRate.slice(firstDailyTestsValidIndex);
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
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: dates.slice(firstDailyTestsValidIndex),
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

    options = createDefaultChartOptions();
    ctx = document.getElementById('chart-daily-deaths');
    var dailyDeathsFiltered = dailyDeaths.slice(deathsFirstIndex);
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: dates.slice(deathsFirstIndex),
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

    const vacElem = document.getElementById("vaccination");
    if (vaccinationData.total > 0) {
        const vacProgressElem = vacElem.querySelector(".vaccinationProgress");
        const progress = vacProgressElem.querySelector("progress");
        const vacProgress = vaccinationData.total / vaccinationData.goal;
        progress.value = vacProgress;
        const vacProgressPercent = vacProgressElem.querySelector(".progressPercent");
        vacProgressPercent.textContent = round(vacProgress * 100, 2) + "%";
    }
    else {
        vacElem.parentElement.style.display = "none";
    }

}
