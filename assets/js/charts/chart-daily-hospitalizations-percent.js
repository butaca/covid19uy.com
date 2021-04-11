import { createDefaultChartOptions, pointRadius, pointHoverRadius } from './util'

function chart(chartData, lang) {
    var ctx = document.getElementById('chart-daily-hospitalizations-percent');
    if (ctx) {
        var options = createDefaultChartOptions();
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

}

export default chart;