import { getTotal, createDefaultChartOptions, pieToolTips } from './util'

function chart(chartData, lang) {
    var ctx = document.getElementById('chart-total');
    if (ctx) {
        var htmlLang = document.documentElement.getAttribute("lang");

        var dataChartTotal = [chartData.activeCases[chartData.activeCases.length - 1], chartData.recovered[chartData.recovered.length - 1], chartData.deaths[chartData.deaths.length - 1]];
        var totalChartTotal = getTotal(dataChartTotal);
        var labelsChartTotal = [lang.activeCases.other, lang.recovered.other, lang.deaths.other];
        labelsChartTotal = labelsChartTotal.map(function (label, index) { return label + ': ' + (dataChartTotal[index] / totalChartTotal * 100).toFixed(2) + '%' });

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
                text: lang.totalCases.other + ': ' + chartData.cases[chartData.cases.length - 1].toLocaleString(htmlLang),
                color: '#36A2EB',
                fontStyle: 'Helvetica',
                sidePadding: 15
            }
        };
        options.tooltips = pieToolTips;
        new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labelsChartTotal,
                datasets: [{
                    data: dataChartTotal,
                    backgroundColor: ["#28b8d680", "#0000ff80", "#e54acfff"]
                }]
            },
            options: options
        });
    }

}

export default chart;