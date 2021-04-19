const { BASE_DATA_DIR } = require('./util');
const DATA_DIR = BASE_DATA_DIR;
const fs = require('fs');
const { promisify } = require('util');
const readFilePromise = promisify(fs.readFile);
const writeFilePromise = promisify(fs.writeFile);
const gulp = require('gulp');
const HARVARD_INDEX_DAYS = 7;
const HarvardIndexMode = {
    NEW_CASES: "newcases",
    LATE_DATA: "latedata",
    CORONAVIRUS_UY: "coronavirusuy"
}

const hiMode = HarvardIndexMode.CORONAVIRUS_UY;

async function buildChartData() {
    const uruguayData = await readFilePromise("./" + DATA_DIR + "uruguay.json");
    const uruguay = JSON.parse(uruguayData);

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
    var yesterdayTotalCasesWithLateData = 0;
    var totalCasesWithLateData = [];
    var activeCasesWithLateData = [];
    var dailyActiveCasesWithLateData = []
    var yesterdayActiveCasesWithLateData = 0;
    var harvardIndexDaily = [];
    var harvardIndexNewCases = [];
    var harvardIndexSum = 0;

    uruguay.data.forEach(function (el, index) {
        var todayPositives = el.positives;
        if (todayPositives != undefined) {
            positiveTestsChartsMaxIndex = index;
            dialyPositives.push(todayPositives);
        }

        var date = new Date(el.date);
        var day = date.getUTCDate();
        var month = (date.getUTCMonth() + 1);
        dates.push(day + "/" + month);

        yesterdayTotalDeaths = deaths.length > 0 ? deaths[deaths.length - 1] : 0;

        var todayTotalDeaths = el.deaths != undefined ? el.deaths : 0;
        if (el.deaths != undefined && deathsFirstIndex == -1) {
            deathsFirstIndex = index;
        }
        deaths.push(todayTotalDeaths);

        let todayDeaths = todayTotalDeaths - yesterdayTotalDeaths;
        if (el.todayDeaths != undefined) {
            todayDeaths = el.todayDeaths;
        }

        dailyDeaths.push(todayDeaths);

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

        var todayNewCasesWithLateData = todayCases;
        if (el.lateNewCases != undefined) {
            todayNewCasesWithLateData += el.lateNewCases.reduce((prev, cur) => prev + cur);
        }
        dailyCasesWithLateData.push(todayNewCasesWithLateData);

        const todayTotalCasesWithLateData = yesterdayTotalCasesWithLateData + todayNewCasesWithLateData - (el.lateDeletedCases != undefined ? el.lateDeletedCases.reduce((prev, cur) => prev + cur) : 0);
        totalCasesWithLateData.push(todayTotalCasesWithLateData);
        yesterdayTotalCasesWithLateData = todayTotalCasesWithLateData;

        var todayActiveCases = el.activeCases != undefined ? el.activeCases : (totalTodayCases - todayTotalDeaths - todayTotalRecovered);
        activeCases.push(todayActiveCases);

        dailyActiveCases.push(todayActiveCases - prevTodayActiveCases);
        prevTodayActiveCases = todayActiveCases;

        var todayActiveCasesWithLateData = (todayTotalCasesWithLateData - todayTotalDeaths - todayTotalRecovered);
        activeCasesWithLateData.push(todayActiveCasesWithLateData);

        dailyActiveCasesWithLateData.push(todayActiveCasesWithLateData - yesterdayActiveCasesWithLateData)
        yesterdayActiveCasesWithLateData = todayActiveCasesWithLateData;

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

        let todayNewCasesHI = 0;

        if (hiMode === HarvardIndexMode.CORONAVIRUS_UY) {
            todayNewCasesHI = cases[cases.length - 1];
            if (cases.length > 1) {
                todayNewCasesHI -= cases[cases.length - 2];
            }
            if (el.newCases != undefined && new Date(el.date).getTime() >= new Date("2021-04-09").getTime() && new Date(el.date).getTime() != new Date("2021-04-15").getTime()) {
                todayNewCasesHI = el.newCases;
            }
        }
        else if (hiMode === HarvardIndexMode.LATE_DATA) {
            todayNewCasesHI = todayNewCasesWithLateData;
        }
        else { // HarvardIndexMode.NEW_CASES
            todayNewCasesHI = todayCases;
        }

        harvardIndexNewCases.push(todayNewCasesHI);
        harvardIndexSum += todayNewCasesHI;

        if (index >= HARVARD_INDEX_DAYS) {
            if (index - HARVARD_INDEX_DAYS >= 0) {
                harvardIndexSum -= harvardIndexNewCases[index - HARVARD_INDEX_DAYS];
            }
            const harvardIndex = (harvardIndexSum / HARVARD_INDEX_DAYS) * (100000.0 / uruguay.population);
            harvardIndexDaily.push(harvardIndex);
        }
    });

    const uruguayDeathsData = await readFilePromise("./" + DATA_DIR + "uruguayDeaths.json");
    const uruguayDeaths = JSON.parse(uruguayDeathsData);

    var menDeaths = [0, 0, 0, 0, 0];
    var womenDeaths = [0, 0, 0, 0, 0];
    var unknownSexDeaths = [0, 0, 0, 0, 0];
    var totalDeathsByAge = [0, 0, 0, 0, 0];
    var deathAgeRangesLabels = ["0 - 17", "18 - 44", "45 - 64", "65 - 74", "75+"];

    for (let i = 0; i < uruguayDeaths.days.length; ++i) {
        const day = uruguayDeaths.days[i];

        const deps = Object.values(day.deps);
        for (let d = 0; d < deps.length; ++d) {
            const dep = deps[d];
            for (let j = 0; j < dep.length; ++j) {
                const death = dep[j];
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
        }
    }

    const data = {
        positives: positives,
        dialyPositives: dialyPositives,
        dates: dates,
        deaths: deaths,
        recovered: recovered,
        activeCases: activeCases,
        dailyActiveCases: dailyActiveCases,
        prevTodayActiveCases: prevTodayActiveCases,
        dailyICU: dailyICU,
        dailyIMCU: dailyIMCU,
        dailyICUPercent: dailyICUPercent,
        dailyIMCUPercent: dailyIMCUPercent,
        firstHopitalizationsValidIndex: firstHopitalizationsValidIndex,
        firstValidHealthcareWorkerIndex: firstValidHealthcareWorkerIndex,
        dailyHealthcareWorkers: dailyHealthcareWorkers,
        dailyHealthcareWorkersPercent: dailyHealthcareWorkersPercent,
        dailyTests: dailyTests,
        firstDailyTestsValidIndex: firstDailyTestsValidIndex,
        dailyPositivesPercent: dailyPositivesPercent,
        cases: cases,
        dailyCases: dailyCases,
        positiveTestsChartsMaxIndex: positiveTestsChartsMaxIndex,
        dailyPositivityRate: dailyPositivityRate,
        dailyDeaths: dailyDeaths,
        deathsFirstIndex: deathsFirstIndex,
        dailyCasesWithLateData: dailyCasesWithLateData,
        totalCasesWithLateData: totalCasesWithLateData,
        activeCasesWithLateData: activeCasesWithLateData,
        dailyActiveCasesWithLateData: dailyActiveCasesWithLateData,
        harvardIndexDaily: harvardIndexDaily,

        lateDataEnabled: uruguay.lateDataEnabled,
        unreportedDailyTests: uruguay.unreportedDailyTests,

        menDeaths: menDeaths,
        womenDeaths: womenDeaths,
        unknownSexDeaths: unknownSexDeaths,
        totalDeathsByAge: totalDeathsByAge,
        deathAgeRangesLabels: deathAgeRangesLabels
    }
    await writeFilePromise("./" + DATA_DIR + "chartData.json", JSON.stringify(data));
}

function watchChartData() {
    return gulp.watch("./" + DATA_DIR + "uruguay.json", buildChartData);
};

module.exports = {
    buildChartData: buildChartData,
    watchChartData: watchChartData
};