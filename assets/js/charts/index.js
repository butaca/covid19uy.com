import chartActiveCases from './chart-active-cases';
import chartTotalCases from './chart-total-cases';
import chartDailyTests from './chart-daily-tests';
import chartDailyTestsNew from './chart-daily-tests-new';
import chartDailyCases from './chart-daily-cases';
import chartTotal from './chart-total';
import chartTestsDialyPositives from './chart-tests-dialy-positives';
import chartHealthcareWorkers from './chart-healthcare-workers';
import chartHealthcareWorkersPercent from './chart-healthcare-workers-percent';
import chartDailyHospitalizationsPercent from './chart-daily-hospitalizations-percent'
import chartDailyHospitalizations from './chart-daily-hospitalizations'
import chartDailyActiveCases from './chart-daily-active-cases'
import chartDailyPositivityRate from './chart-daily-positivity-rate'
import chartHarvardIndex from './chart-harvard-index'

import chartsRegion from './charts-region'
import chartsDeaths from './charts-deaths'
import chartsVac from './charts-vac'

function init(chartData, lang, uruguayWeeklyData) {
    const charts = [];
    charts.push(chartActiveCases);
    charts.push(chartTotalCases);
    charts.push(chartDailyTests);
    charts.push(chartDailyTestsNew);
    charts.push(chartDailyCases);
    charts.push(chartTotal);
    charts.push(chartTestsDialyPositives);
    charts.push(chartHealthcareWorkers);
    charts.push(chartHealthcareWorkersPercent);
    charts.push(chartDailyHospitalizationsPercent);
    charts.push(chartDailyHospitalizations);
    charts.push(chartDailyActiveCases);
    charts.push(chartDailyPositivityRate);
    charts.push(chartHarvardIndex);

    charts.push(chartsRegion);
    charts.push(chartsDeaths);
    charts.push(chartsVac);

    for (let i = 0; i < charts.length; ++i) {
        charts[i](chartData, lang, uruguayWeeklyData);
    }
}

export default init;