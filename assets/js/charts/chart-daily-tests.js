import { createDefaultChartOptions } from './util'

function chart(chartData, lang) {
    var ctx = document.getElementById('chart-daily-tests');
    if (ctx) {
        var options = createDefaultChartOptions();
        options.scales = {
            xAxes: [{
                stacked: true
            }]
        };

        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: chartData.dates.slice(chartData.firstDailyTestsValidIndex, chartData.positiveTestsChartsMaxIndex + 1),
                datasets: [{
                    backgroundColor: "#7732a880",
                    label: lang.dailyPositives.other,
                    data: chartData.dialyPositives.slice(chartData.firstDailyTestsValidIndex, chartData.positiveTestsChartsMaxIndex + 1),
                },
                {
                    backgroundColor: "#ecdb3c80",
                    label: lang.dailyTests.other,
                    data: chartData.dailyTests.slice(chartData.firstDailyTestsValidIndex, chartData.positiveTestsChartsMaxIndex + 1),
                }]
            },
            options: options
        });
    }
}

export default chart;