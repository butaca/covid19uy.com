import { createDefaultChartOptions } from './util'

function chart(chartData, lang) {
    var ctx = document.getElementById('chart-tests');
    if (ctx) {
        var totalTests = getTotal(chartData.dailyTests.slice(0, chartData.positiveTestsChartsMaxIndex + 1)) + chartData.unreportedDailyTests;
        var totalPositives = chartData.positives.slice(0, chartData.positiveTestsChartsMaxIndex + 1)[chartData.positives.length - 1];
        var totalNegatives = totalTests - totalPositives;

        var chartTestsData = [totalPositives, totalNegatives];
        var chartTestsLabels = [lang.positives.other, lang.negatives.other];
        chartTestsLabels = chartTestsLabels.map(function (label, index) { return label + ': ' + (chartTestsData[index] / totalTests * 100).toFixed(2) + '%' });

        var options = createDefaultChartOptions();
        options.scales = {
            xAxes: [{
                display: false
            }],
            yAxes: [{
                display: false
            }]
        };
        options.elements = {
            center: {
                text: lang.totalTests.other + ': ' + totalTests,
                color: '#36A2EB',
                fontStyle: 'Helvetica',
                sidePadding: 15
            }
        };
        options.tooltips = pieToolTips

        new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: chartTestsLabels,
                datasets: [{
                    data: chartTestsData,
                    backgroundColor: ["#7732a880", "#83d02a80"]
                }]
            },
            options: options
        });

        options = createDefaultChartOptions();
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
    }
}

export default chart;