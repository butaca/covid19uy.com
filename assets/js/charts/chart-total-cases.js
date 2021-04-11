import { createDefaultChartOptions, pointRadius, pointHoverRadius } from './util'

function chart(chartData, lang) {
    var ctx = document.getElementById('chart-total-cases');
    if (ctx) {
        var options = createDefaultChartOptions();
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: chartData.dates,
                datasets: [{
                    pointBackgroundColor: "#28b8d6ff",
                    backgroundColor: "#28b8d680",
                    label: lang.totalCases.other,
                    data: chartData.lateDataEnabled ? chartData.totalCasesWithLateData : chartData.cases,
                    pointRadius: pointRadius,
                    pointHoverRadius: pointHoverRadius
                },
                {
                    pointBackgroundColor: "#0000ffff",
                    backgroundColor: "#0000ff80",
                    label: lang.recovered.other,
                    data: chartData.recovered,
                    pointRadius: pointRadius,
                    pointHoverRadius: pointHoverRadius
                },
                {
                    pointBackgroundColor: "#e54acfff",
                    backgroundColor: "#e54acfff",
                    label: lang.deaths.other,
                    data: chartData.deaths,
                    pointRadius: pointRadius,
                    pointHoverRadius: pointHoverRadius
                }]
            },
            options: options
        });
    }
}

export default chart;