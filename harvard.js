const uruguay = require("./assets/js/data/uruguay.json");
const HARVARD_INDEX_DAYS = 7;
const TOTAL_DAYS = 16;

function round(num) {
   return Math.round((num + Number.EPSILON) * 100.0) / 100;
}

let sumNewCases = 0;
let yesterday = null;
let newCases = [];
let dayIndex = 0;

const startIndex = Math.max(0, uruguay.data.length - TOTAL_DAYS - HARVARD_INDEX_DAYS);
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

    if (dayIndex >= HARVARD_INDEX_DAYS) {
        sumNewCases -= newCases[dayIndex - HARVARD_INDEX_DAYS];
        const harvardIndex = (sumNewCases / HARVARD_INDEX_DAYS) * (100000.0 / uruguay.population);
        console.log(today.date + "    " + round(harvardIndex));
    }

    yesterday = today;
    dayIndex++;
}

