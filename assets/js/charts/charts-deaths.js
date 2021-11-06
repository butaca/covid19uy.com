
import { createDefaultChartOptions, createMovingAverageDataset, MOVING_AVERAGE_DELTA, pieToolTips, getTotal } from './util'

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
        const dataDeathsTotal = [chartData.menDeaths.reduce(function (acc, val) { return acc + val; }, 0), chartData.womenDeaths.reduce(function (acc, val) { return acc + val; }, 0)];
        const totalDeaths = getTotal(dataDeathsTotal);
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
                text: lang.totalDeaths.other + ': ' + totalDeaths,
                color: '#36A2EB',
                fontStyle: 'Helvetica',
                sidePadding: 15
            }
        };
        options.tooltips = pieToolTips;

        let deathBySexLabels = [lang.men.other, lang.women.other];
        deathBySexLabels = deathBySexLabels.map(function (label, index) { return label + ': ' + (dataDeathsTotal[index] / totalDeaths * 100).toFixed(2) + '%' });

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
        options.scales = {
            yAxes: [{
                ticks: {
                    beginAtZero: true,
                }
            }]
        }
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