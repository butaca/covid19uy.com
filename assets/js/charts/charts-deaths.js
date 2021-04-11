
import { createDefaultChartOptions, createMovingAverageDataset, MOVING_AVERAGE_DELTA, pieToolTips } from './util'
import deathsData from "../data/uruguayDeaths.json"

function chart(chartData, lang) {
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

    var ctx = document.getElementById('chart-deaths');
    if (ctx) {
        var options = createDefaultChartOptions();
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

    ctx = document.getElementById('chart-deaths-sex');
    if (ctx) {
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
    }

    ctx = document.getElementById('chart-deaths-new');
    if (ctx) {
        options = createDefaultChartOptions();
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

    ctx = document.getElementById('chart-daily-deaths');
    options = createDefaultChartOptions();
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

}

export default chart;