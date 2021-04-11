import { createDefaultChartOptions, createMovingAverageDataset, MOVING_AVERAGE_DELTA, pointRadius, pointHoverRadius } from './util'

function chart(chartData, lang) {
    var ctx = document.getElementById('chart-active-cases');
    if (ctx) {
        var activeCasesData = chartData.lateDataEnabled ? chartData.activeCasesWithLateData : chartData.activeCases;

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

        new Chart(ctx, {
            type: 'line',
            data: {
                labels: chartData.dates,
                datasets: [
                    createMovingAverageDataset(activeCasesData, MOVING_AVERAGE_DELTA, "#0033bb88"),
                    {
                        pointBackgroundColor: "#28b8d6ff",
                        backgroundColor: "#28b8d680",
                        label: lang.activeCases.other,
                        data: activeCasesData,
                        pointRadius: pointRadius,
                        pointHoverRadius: pointHoverRadius
                    }
                ]
            },
            options: options
        });
    }
}

export default chart;