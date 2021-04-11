import { createDefaultChartOptions, createMovingAverageDataset, MOVING_AVERAGE_DELTA, pointRadius, pointHoverRadius } from './util'

function chart(chartData, lang) {
    var ctx = document.getElementById('chart-daily-tests-new');
    if (ctx) {
        var options = createDefaultChartOptions();
        options.scales = {
            xAxes: [{
                stacked: true
            }]
        };
        options.tooltips = {
            onlyShowForDatasetIndex: [1]
        }

        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: chartData.dates.slice(chartData.firstDailyTestsValidIndex),
                datasets: [
                    createMovingAverageDataset(chartData.dailyTests, MOVING_AVERAGE_DELTA, "#0033bb88"),
                    {
                        backgroundColor: "#ecdb3c80",
                        label: lang.dailyTests.other,
                        data: chartData.dailyTests.slice(chartData.firstDailyTestsValidIndex),
                    }]
            },
            options: options
        });
    }
}

export default chart;