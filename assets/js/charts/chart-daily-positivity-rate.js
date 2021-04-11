import { createDefaultChartOptions, createMovingAverageDataset, MOVING_AVERAGE_DELTA, pointRadius, pointHoverRadius } from './util'

function chart(chartData, lang) {
    var ctx = document.getElementById('chart-daily-positivity-rate');
    if (ctx) {
        var positivityRate = chartData.dailyPositivityRate.slice(chartData.firstDailyTestsValidIndex);
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
                    return data['datasets'][0]['data'][tooltipItem['index']].toFixed(2) + " %";
                }
            }
        };

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
}

export default chart;