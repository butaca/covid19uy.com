import { createDefaultChartOptions, pieToolTips } from './util'
import vaccinationData from "../data/uruguayVaccination.json"

const COLOR_SINOVAC = "#0000ff80";
const COLOR_PFIZER = "#ffa500";
const COLOR_ASTRAZENECA = "#48c774";
const COLOR_TOTAL = "#28b8d680";

function chart(_chartData, lang) {

    const utcDate = new Date(vaccinationData.date)
    const vacDate = new Date(utcDate.getTime() + utcDate.getTimezoneOffset() * 60000);
    const vacDateTokens = vaccinationData.todayDate.split(':');
    if (vacDateTokens.length >= 2) {
        vacDate.setHours(vacDateTokens[0]);
        vacDate.setMinutes(vacDateTokens[1]);
    }

    const htmlLang = document.documentElement.getAttribute("lang");
    const vacDateStr = vacDate.toLocaleString(htmlLang).replace(/\:00(?=[^:00]*$)/, '');

    const flipDate = htmlLang == "en";

    const vacDates = vaccinationData.history.date.map(function (el) {
        if (flipDate) {
            var s = el.split("/");
            return s[1] + "/" + s[0];
        } else {
            return el;
        }
    });

    const totalVacs = vaccinationData.coronavacTotal + vaccinationData.pfizerTotal + vaccinationData.astrazenecaTotal;

    let ctx = document.getElementById('chart-daily-vacs');

    if (ctx) {
        const options = createDefaultChartOptions();
        let dateElem = ctx.parentElement.querySelector(".date");
        if (dateElem != null) {
            dateElem.innerHTML = lang.updated.other + ": " + vacDateStr;
        }
        const historyDatasets = [
            {
                pointBackgroundColor: COLOR_TOTAL,
                backgroundColor: COLOR_TOTAL,
                label: lang.vacTotal.other,
                data: vaccinationData.history.total,
            },
            {
                pointBackgroundColor: COLOR_SINOVAC,
                backgroundColor: COLOR_SINOVAC,
                label: lang.vacCoronavac.other,
                data: vaccinationData.history.coronavac,
                hidden: true,
            },
            {
                pointBackgroundColor: COLOR_PFIZER,
                backgroundColor: COLOR_PFIZER,
                label: lang.vacPfizer.other,
                data: vaccinationData.history.pfizer,
                hidden: true,
            },
            {
                pointBackgroundColor: COLOR_ASTRAZENECA,
                backgroundColor: COLOR_ASTRAZENECA,
                label: lang.vacAstrazeneca.other,
                data: vaccinationData.history.astrazeneca,
                hidden: true,
            }
        ];

        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: vacDates,
                datasets: historyDatasets
            },
            options: options
        });
    }

    ctx = document.getElementById('chart-total-vacs');
    if (ctx) {
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
            /*
            center: {
                text: (totalVacs > 0) ? (lang.vacTotal.other + ': ' + totalVacs.toLocaleString(htmlLang)) : lang.notAvailable.other,
                color: '#36A2EB',
                fontStyle: 'Helvetica',
                sidePadding: 15
            }
            */
        };
        options.tooltips = pieToolTips;

        dateElem = ctx.parentElement.querySelector(".date");
        if (dateElem != null) {
            dateElem.innerHTML = lang.updated.other + ": " + vacDateStr;
        }

        const vacTotalData = [vaccinationData.coronavacTotal, vaccinationData.pfizerTotal, vaccinationData.astrazenecaTotal];
        let vacTotalLabels = [lang.vacCoronavac.other, lang.vacPfizer.other, lang.vacAstrazeneca.other];
        vacTotalLabels = vacTotalLabels.map(function (label, index) { return label + ': ' + (vacTotalData[index] / totalVacs * 100).toFixed(2) + '%' });

        new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: vacTotalLabels,
                datasets: [{
                    data: vacTotalData,
                    backgroundColor: [COLOR_SINOVAC, COLOR_PFIZER, COLOR_ASTRAZENECA]
                }]
            },
            options: options
        });
    }
}

export default chart;