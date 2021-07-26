
const axios = require("axios");
axios.default.defaults.timeout = 60000;
const moment = require("moment");
const regression = require("regression");
const csv = require('csv-parser');
const { BASE_DATA_DIR, writeFileAndCache, copyFromCache } = require('./util');
const DATA_DIR = BASE_DATA_DIR;
const VAC_GOAL = 0.75;

const DOSE_URL = "https://catalogodatos.gub.uy/dataset/e766fbf7-0cc5-4b9a-a093-b56e91e88133/resource/5c549ba0-126b-45e0-b43f-b0eea72cf2cf/download/actos_vacunales.csv";

async function downloadUruguayVaccinationData() {
    let vacDataFailed = false;

    const vacData = {
        history: {
            date: [],
            total: [],
            coronavac: [],
            pfizer: [],
            astrazeneca: [],
            firstDose: [],
            secondDose: []
        },
        date: 0,
        todayTotal: 0,
        total: 0,
        firstDoseTotal: 0,
        secondDoseTotal: 0,
        coronavacTotal: 0,
        astrazenecaTotal: 0,
        pfizerTotal: 0,
        population: 3543025,
        eta: null
    }

    try {
        var req = {
            method: 'get',
            url: DOSE_URL,
            responseType: 'stream'
        }
    
        const res = await axios(req);
        const stream = res.data.pipe(csv({separator:';'}));
        const history = vacData.history;
        stream.on('data', data => {
            const date = moment(data['Fecha'], 'DD/MM/YYYY').format('YYYY-MM-DD');
            const firstDose = parseInt(data['Total Dosis 1']);
            const secondDose = parseInt(data['Total Dosis 2']);
            const sinovacFirstDose = parseInt(data['1era Dosis Sinovac']);
            const sinovacSecondDose = parseInt(data['2da Dosis Sinovac']);
            const pfizerFirstDose = parseInt(data['1era Dosis Pfizer']);
            const pfizerSecondDose = parseInt(data['2da Dosis Pfizer']);
            const astrazenecaFirstDose = parseInt(data['1era Dosis Astrazeneca']);
            const astrazenecaSecondDose = parseInt(data['2da Dosis Astrazeneca']);

            const total = firstDose + secondDose;
            const sinovacTotal = sinovacFirstDose + sinovacSecondDose;
            const pfizerTotal = pfizerFirstDose + pfizerSecondDose;
            const astrazenecaTotal = astrazenecaFirstDose + astrazenecaSecondDose;

            history.date.push(date);
            history.firstDose.push(firstDose);
            history.secondDose.push(secondDose);
            history.total.push(firstDose + secondDose);
            history.coronavac.push(sinovacTotal);
            history.pfizer.push(pfizerTotal);
            history.astrazeneca.push(astrazenecaTotal);

            vacData.firstDoseTotal += firstDose;
            vacData.secondDoseTotal += secondDose;
            vacData.total += total;
            vacData.coronavacTotal += sinovacTotal;
            vacData.pfizerTotal += pfizerTotal;
            vacData.astrazenecaTotal += astrazenecaTotal;
        });

        await new Promise((resolve, reject) => {
            stream.on("error", reject);
            stream.on("end", resolve);
        });

        history.date.reverse();
        history.firstDose.reverse();
        history.secondDose.reverse();
        history.total.reverse();
        history.coronavac.reverse();
        history.pfizer.reverse();
        history.astrazeneca.reverse();

        vacData.todayTotal = vacData.history.total[vacData.history.total.length - 1];
        vacData.date = moment().toISOString(true);

        const minDate = moment(vacData.history.date[0]);

        const lastVacDays = 28;
        const totalPoints = [];
        let curTotal = 0;
        for (let i = vacData.history.total.length - lastVacDays; i < vacData.history.total.length; ++i) {
            curTotal += vacData.history.total[i];
            totalPoints.push([i, curTotal]);
        }

        const goal = vacData.population * VAC_GOAL;

        const result = regression.linear(totalPoints);
        const m = result.equation[0];
        const c = result.equation[1];
        const x = (2 * goal - c) / m;
        const eta = minDate.add(x, 'days');
        vacData.eta = eta.format("YYYY-MM-DD");

    } catch (e) {
        console.log("Error getting vaccination data. " + e.name + ": " + e.message);
        vacDataFailed = true;
    }

    const vacFileName = "uruguayVaccination.json";

    if (!vacDataFailed) {
        await writeFileAndCache(DATA_DIR, vacFileName, JSON.stringify(vacData));
    }
    else {
        await copyFromCache(DATA_DIR, vacFileName, JSON.stringify(vacData));
    }
}

module.exports = {
    downloadUruguayVaccinationData: downloadUruguayVaccinationData
};