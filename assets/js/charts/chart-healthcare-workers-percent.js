import { createDefaultChartOptions, createMovingAverageDataset, MOVING_AVERAGE_DELTA, pointRadius, pointHoverRadius } from './util'

function chart(chartData, lang) {
    var ctx = document.getElementById('chart-healthcare-workers-percent');
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
        }
        options.tooltips = {
            callbacks: {
                label: function (tooltipItem, data) {
                    return data['datasets'][0]['data'][tooltipItem['index']].toFixed(2) + " %";
                }
            }
        };
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
}

export default chart;