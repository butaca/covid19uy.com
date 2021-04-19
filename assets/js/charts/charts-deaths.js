
import { createDefaultChartOptions, createMovingAverageDataset, MOVING_AVERAGE_DELTA, pieToolTips } from './util'

function chart(chartData, lang) {
    var ctx = document.getElementById('chart-deaths');
    if (ctx) {
        var options = createDefaultChartOptions();
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: chartData.deathAgeRangesLabels,
                datasets: [
                    {
                        backgroundColor: "#B871FAff",
                        label: lang.men.other,
                        data: chartData.menDeaths,
                    },
                    {
                        backgroundColor: "#FA7571ff",
                        label: lang.women.other,
                        data: chartData.womenDeaths,
                    }
                ]
            },
            options: options
        });
    }

    ctx = document.getElementById('chart-deaths-sex');
    if (ctx) {
        var dataDeathsTotal = [chartData.menDeaths.reduce(function (acc, val) { return acc + val; }, 0), chartData.womenDeaths.reduce(function (acc, val) { return acc + val; }, 0)];
        var totalDeahts = getTotal(chartData.dataDeathsTotal);
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
        deathBySexLabels = chartData.deathBySexLabels.map(function (label, index) { return label + ': ' + (chartData.dataDeathsTotal[index] / totalDeahts * 100).toFixed(2) + '%' });

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
                labels: chartData.deathAgeRangesLabels,
                datasets: [
                    {
                        backgroundColor: "#e54acfff",
                        label: lang.graphDeathsNew.other,
                        data: chartData.totalDeathsByAge,
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