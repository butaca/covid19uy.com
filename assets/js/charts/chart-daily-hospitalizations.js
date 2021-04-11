import { createDefaultChartOptions, pointRadius, pointHoverRadius } from './util'

function chart(chartData, lang) {
    var ctx = document.getElementById('chart-daily-hospitalizations');
    if (ctx) {
        var options = createDefaultChartOptions();
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: chartData.dates.slice(chartData.firstHopitalizationsValidIndex),
                datasets: [{
                    backgroundColor: "#ff000080",
                    label: lang.icu.other,
                    data: chartData.dailyICU.slice(chartData.firstHopitalizationsValidIndex),
                    pointRadius: pointRadius,
                    pointHoverRadius: pointHoverRadius
                }/*,
            {
                backgroundColor: "#ecdb3c80",
                label: lang.imcu.other,
                data: dailyIMCU.slice(firstHopitalizationsValidIndex),
            }*/
                ]
            },
            options: options
        });
    }
}

export default chart;