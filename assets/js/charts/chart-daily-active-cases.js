import { createDefaultChartOptions, createMovingAverageDataset, MOVING_AVERAGE_DELTA, pointRadius, pointHoverRadius } from './util'

function chart(chartData, lang) {
    var ctx = document.getElementById('chart-daily-active-cases');
    if (ctx) {
        var activeCasesData = chartData.lateDataEnabled ? chartData.dailyActiveCasesWithLateData : chartData.dailyActiveCases;
        options = createDefaultChartOptions();
        options.tooltips = {
            onlyShowForDatasetIndex: [1]
        }
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: chartData.dates,
                datasets: [
                    createMovingAverageDataset(activeCasesData, MOVING_AVERAGE_DELTA, "#0033bb88"),
                    {
                        pointBackgroundColor: "#28b8d6ff",
                        backgroundColor: "#28b8d680",
                        label: lang.newActiveCases.other,
                        data: activeCasesData,
                    }]
            },
            options: options
        });
    }
}

export default chart;