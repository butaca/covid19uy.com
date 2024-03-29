const uruguay = require("./assets/js/data/uruguay.json");
const HARVARD_INDEX_DAYS = 7;
const TOTAL_DAYS = 16;

function round(num) {
   return Math.round((num + Number.EPSILON) * 100.0) / 100;
}

let sumNewCases = 0;
let newCases = [];
let dayIndex = 0;
let sumNewCasesWithoutLateData = 0;
let newCasesWithoutLateData = [];

const startIndex = Math.max(0, uruguay.data.length - TOTAL_DAYS - HARVARD_INDEX_DAYS);
let yesterday = uruguay.data[startIndex - 1];
for (let i = startIndex; i < uruguay.data.length; ++i) {
    const today = uruguay.data[i];

    let todayNewCases = today.cases - (yesterday != null ? yesterday.cases : 0);
    if (today.newCases != undefined) {
        todayNewCases = today.newCases;
    }
    if (today.lateNewCases != undefined) {
        todayNewCases += today.lateNewCases.reduce((sum, val) => sum + val);
    }

    newCases.push(todayNewCases);
    sumNewCases += todayNewCases;

    let todayNewCasesWithoutLateData = today.cases - yesterday.cases;

    // Following CoronavirusUY criterion
    if(new Date(today.date).getTime() >= new Date("2021-04-09").getTime() && new Date(today.date).getTime() != new Date("2021-04-15").getTime()) {
        todayNewCasesWithoutLateData = today.newCases;
    }
    
    newCasesWithoutLateData.push(todayNewCasesWithoutLateData);
    sumNewCasesWithoutLateData += todayNewCasesWithoutLateData;

    if (dayIndex >= HARVARD_INDEX_DAYS) {
        const population = new Date(today.date).getTime() >= new Date("2021-08-07").getTime() ? uruguay.population2021 : uruguay.population;

        sumNewCases -= newCases[dayIndex - HARVARD_INDEX_DAYS];
        const harvardIndex = (sumNewCases / HARVARD_INDEX_DAYS) * (100000.0 / population);

        sumNewCasesWithoutLateData -= newCasesWithoutLateData[dayIndex - HARVARD_INDEX_DAYS];
        const harvardIndexWithoutLateData = (sumNewCasesWithoutLateData / HARVARD_INDEX_DAYS) * (100000.0 / population);

        console.log(today.date + "    " + todayNewCases +  "    " + round(harvardIndex) + "    " + todayNewCasesWithoutLateData + "    " + round(harvardIndexWithoutLateData));
    }

    yesterday = today;
    dayIndex++;
}

