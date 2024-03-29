import { createDefaultChartOptions, createMovingAverageDataset, MOVING_AVERAGE_DELTA } from './util'

function chart(chartData, lang) {
    const datesWithWeeklyData = [];
    datesWithWeeklyData.push(...chartData.dates);
    datesWithWeeklyData.push(...chartData.datesWeeklyData);

    var ctx = document.getElementById('chart-daily-cases');
    if (ctx) {
        var dailyCasesData = chartData.lateDataEnabled ? chartData.dailyCasesWithLateData : chartData.dailyCases;

        var options = createDefaultChartOptions();
        options.tooltips = {
            onlyShowForDatasetIndex: [1]
        }
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: datesWithWeeklyData,
                datasets: [
                    createMovingAverageDataset(dailyCasesData, MOVING_AVERAGE_DELTA, "#0033bb88"),
                    {
                        backgroundColor: "#97DBEAFF",
                        label: lang.dailyCases.other,
                        data: dailyCasesData,
                    }]
            },
            options: options
        });
    }
}

export default chart;