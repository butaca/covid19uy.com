import { createDefaultChartOptions, pointRadius, pointHoverRadius } from './util'

function chart(chartData, lang) {
    var ctx = document.getElementById('chart-tests-dialy-positives');
    if (ctx) {
        var options = createDefaultChartOptions();
        options.scales = {
            xAxes: [{
                stacked: true
            }]
        };
        options.tooltips = {
            onlyShowForDatasetIndex: [1, 2]
        }
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: chartData.dates.slice(chartData.firstDailyTestsValidIndex, chartData.positiveTestsChartsMaxIndex + 1),
                datasets: [{
                    pointBackgroundColor: "#7732a8ff",
                    backgroundColor: "#7732a880",
                    label: lang.graphTitleDailyPositives.other,
                    data: chartData.dailyPositivesPercent.slice(chartData.firstDailyTestsValidIndex, chartData.positiveTestsChartsMaxIndex + 1),
                    pointRadius: pointRadius,
                    pointHoverRadius: pointHoverRadius
                }]
            },
            options: options
        });
    }
}

export default chart;