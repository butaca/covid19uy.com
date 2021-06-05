
const axios = require("axios");
axios.default.defaults.timeout = 60000;
const moment = require("moment");
const xml2json = require('xml2json');
const regression = require("regression");
const { BASE_DATA_DIR, request, writeFileAndCache, copyFromCache } = require('./util');
const DATA_DIR = BASE_DATA_DIR;

const VAC_BASE_URL = "https://monitor.uruguaysevacuna.gub.uy/plugin/cda/api/doQuery";

function createDefaultParams(minDate, maxDate) {
    const params = {
        outputIndexId: "1",
        pageSize: "0",
        pageStart: "0",
        sortBy: "",
        paramsearchBox: "",
        outputType: "XML"
    };

    if (minDate) {
        params.paramp_periodo_desde_sk = minDate;
    }
    if (maxDate) {
        params.paramp_periodo_hasta_sk = maxDate;
    }

    return params;
}

async function fetchValidDatesData() {
    const params = createDefaultParams();
    params.path = "/public/Epidemiologia/Vacunas Covid/Paneles/Vacunas Covid/VacunasCovid.cda";
    params.dataAccessId = "sql_fechas_validas";
    return await request(VAC_BASE_URL, params);
}

async function fetchVacHistoryData(minDate, maxDate) {
    const params = createDefaultParams(minDate, maxDate);
    params.path = "/public/Epidemiologia/Vacunas Covid/Paneles/Vacunas Covid/VacunasCovid.cda";
    params.dataAccessId = "sql_evolucion";
    return await request(VAC_BASE_URL, params);
}

async function fetchVacTotalData(minDate, maxDate) {
    const params = createDefaultParams(minDate, maxDate);
    params.path = "/public/Epidemiologia/Vacunas Covid/Paneles/Vacunas Covid/VacunasCovid.cda";
    params.dataAccessId = "sql_indicadores_generales";
    return await request(VAC_BASE_URL, params);
}

async function fetchVacDoseHistoryData(minDate, maxDate) {
    const params = createDefaultParams(minDate, maxDate);
    params.paramp_periodo_desde_sk = minDate;
    params.paramp_periodo_hasta_sk = maxDate;
    params.path = "/public/Epidemiologia/Vacunas Covid/Paneles/Vacunas Covid/VacunasCovid.cda";
    params.dataAccessId = "sql_evolucion_dosis";
    return await request(VAC_BASE_URL, params);
}

async function fetchVacTypeData(minDate, maxDate) {
    const params = createDefaultParams(minDate, maxDate);
    params.paramp_periodo_desde_sk = minDate;
    params.paramp_periodo_hasta_sk = maxDate;
    params.path = "/public/Epidemiologia/Vacunas Covid/Paneles/Vacunas Covid/VacunasCovid.cda";
    params.dataAccessId = "sql_vacunas_tipo_vacuna";
    return await request(VAC_BASE_URL, params);
}

function parseRows(data, indexesNames) {
    const rows = [];
    try {
        const pendingIndexes = indexesNames.slice();
        const indexes = {};
        const dataObj = xml2json.toJson(data, { object: true });
        const metadata = dataObj.CdaExport.MetaData.ColumnMetaData

        for (let i = 0; i < metadata.length; ++i) {
            const metadataCol = metadata[i];
            const name = metadataCol.name.toLowerCase();

            for (let j = 0; j < pendingIndexes.length; ++j) {
                let indexName = pendingIndexes[j];
                if (name.includes(indexName)) {
                    const index = parseInt(metadataCol.index);
                    if (isNaN(index)) {
                        throw new Error("Error parsing index: " + indexName);
                    }
                    indexes[indexName] = index;
                    pendingIndexes.splice(j, 1)
                    break;
                }
            }
        }

        if (pendingIndexes.length > 0) {
            throw new Error("Can't find indexes in metadata: " + pendingIndexes.join(", "));
        }

        const dataRows = dataObj.CdaExport.ResultSet.Row;
        const dataCol = dataRows.Col;

        function getRow(dataCol) {
            const values = {};
            for (let i = 0; i < indexesNames.length; ++i) {
                const indexName = indexesNames[i];
                let value = dataCol[indexes[indexName]];
                if (typeof value === "object" && value.isNull === "true") {
                    value = null;
                }
                values[indexName] = value;
            }
            return values;
        }

        if (dataCol != undefined) {
            rows.push(getRow(dataCol));
        }
        else {
            for (let r = 0; r < dataRows.length; ++r) {
                const col = dataRows[r].Col;
                rows.push(getRow(col));
            }
        }
    } catch (e) {
        console.log("Error parsing rows: " + e.message);
    }
    return rows;
}

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
        date: "",
        todayDate: "",
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
        let minDateStr = null;
        let maxDateStr = null;
        let minDate = null;
        let maxDate = null;

        const validDatesData = await fetchValidDatesData();
        let rows = parseRows(validDatesData, ["fecha_minima", "fecha_maxima"]);
        if (rows.length > 0) {
            let firstRow = rows[0];
            minDate = moment(firstRow["fecha_minima"], "DD-MM-YYYY");
            maxDate = moment(firstRow["fecha_maxima"], "DD-MM-YYYY");
            minDateStr = minDate.format("YYYYMMDD");
            maxDateStr = maxDate.format("YYYYMMDD");
            vacData.date = maxDate.format("YYYY-MM-DD");
        } else {
            throw new Error("Unexpected row count = 0");
        }

        const [vacHistoryData, vacTotalData, vacTypeData, vacDoseHistoryData] = await Promise.allSettled([fetchVacHistoryData(minDateStr, maxDateStr), fetchVacTotalData(minDateStr, maxDateStr), fetchVacTypeData(minDateStr, maxDateStr), fetchVacDoseHistoryData(minDate, maxDateStr)]);

        if (vacHistoryData.status === "fulfilled") {
            rows = parseRows(vacHistoryData.value, ["fecha", "sinovac", "pfizer", "astrazeneca"])

            let lastDate = null;

            for (let i = 0; i < rows.length; ++i) {
                const row = rows[i];
                const date = row["fecha"].replace("-", "/");
                let coronavac = row["sinovac"] || 0;
                let pfizer = row["pfizer"] || 0;
                let astrazeneca = row["astrazeneca"] || 0;

                coronavac = parseInt(coronavac);
                pfizer = parseInt(pfizer);
                astrazeneca = parseInt(astrazeneca);
                const total = coronavac + pfizer + astrazeneca;

                vacData.history.date.push(date);
                vacData.history.total.push(total);
                vacData.history.coronavac.push(coronavac);
                vacData.history.pfizer.push(pfizer);
                vacData.history.astrazeneca.push(astrazeneca);

                lastDate = date;
            }

            if (lastDate == null) {
                vacDataFailed = true;
                console.log("Vac history inconsistent: empty");
            }
            else {
                let minRegisters = 32;

                if (vacData.history.date.length < minRegisters) {
                    vacDataFailed = true;
                    console.log("Vac history inconsistent: got " + vacData.history.date.length + " registers, at least " + minRegisters + " required");
                }
            }

        }
        else {
            console.log("Error getting vac history: " + vacHistoryData.reason);
            //TODO: This is a temp workaround. Allow each request to fail independently 
            //vacDataFailed = true;
        }

        ///////////

        if (vacTotalData.status === "fulfilled") {
            rows = parseRows(vacTotalData.value, ["hora", "dosis pais", "actoshoy", "per1", "per2"])
            if (rows.length > 0) {
                firstRow = rows[0];

                const todayDate = firstRow["hora"];
                const todayTotal = firstRow["actoshoy"];
                const totalVac = firstRow["dosis pais"];
                const firstDoseTotal = firstRow["per1"];
                const secondDoseTotal = firstRow["per2"];

                vacData.todayDate = todayDate;
                vacData.todayTotal = parseInt(todayTotal);
                vacData.firstDoseTotal = parseInt(firstDoseTotal);
                vacData.secondDoseTotal = parseInt(secondDoseTotal);
                const dataTotalVac = parseInt(totalVac);
                vacData.total = Math.max(dataTotalVac, vacData.firstDoseTotal + vacData.secondDoseTotal);

                if (dataTotalVac <= 0) {
                    console.log("Vac total inconsistent: <= 0");
                    vacDataFailed = true;
                }
            }
            else {
                vacDataFailed = true;
                console.log("Unexpected row count = 0");
            }
        }
        else {
            console.log("Error getting vac total: " + vacTotalData.reason);
            vacDataFailed = true;
        }

        ///////

        if (vacTypeData.status === "fulfilled") {
            rows = parseRows(vacTypeData.value, ["tipo de vacuna", "cantidad"]);

            let coronavacTotal = 0;
            let pfizerTotal = 0;
            let astrazenecaTotal = 0;

            for (let i = 0; i < rows.length; ++i) {
                const row = rows[i];
                const name = row["tipo de vacuna"];
                const total = row["cantidad"];

                if (name.toLowerCase().includes("coronavac")) {
                    coronavacTotal = parseInt(total);
                }
                else if (name.toLowerCase().includes("pfizer")) {
                    pfizerTotal = parseInt(total);
                }
                else if (name.toLowerCase().includes("astrazeneca")) {
                    astrazenecaTotal = parseInt(total);
                }
            }

            vacData.coronavacTotal = coronavacTotal;
            vacData.pfizerTotal = pfizerTotal;
            vacData.astrazenecaTotal = astrazenecaTotal;
            if (vacData.total == 0) {
                vacData.total = coronavacTotal + pfizerTotal + astrazenecaTotal;
            }

            if (coronavacTotal == 0 || pfizerTotal == 0 || astrazenecaTotal == 0) {
                console.log("Vac type inconsistent: Sinovac, Pfizer or AstraZeneca == 0");
                vacDataFailed = true;
            }
        }
        else {
            console.log("Error getting vac type: " + vacTypeData.reason);
            //TODO: This is a temp workaround. Allow each request to fail independently 
            //vacDataFailed = true;
        }

        if (vacDoseHistoryData.status === "fulfilled") {
            rows = parseRows(vacDoseHistoryData.value, ["fecha", "dosis 1", "dosis 2"]);

            const pushDates = vacData.history.date.length == 0;
            const pushTotal = vacData.history.total.length == 0;

            let prevDailyTotal = 0;

            for (let i = 0; i < rows.length; ++i) {
                const row = rows[i];
                let date = moment(row["fecha"], "YYYY-MM-DDTHH:mm:ss[Z]");
                date = date.date() + "/" + (date.month() + 1);

                let firstDose = row["dosis 1"] || 0;
                let secondDose = row["dosis 2"] || 0;

                firstDose = parseInt(firstDose);
                secondDose = parseInt(secondDose);

                if(pushDates) {
                    vacData.history.date.push(date);
                }
                if(pushTotal) {
                    const dailyTotal = (firstDose + secondDose) - prevDailyTotal;
                    prevDailyTotal = (firstDose + secondDose);
                    vacData.history.total.push(dailyTotal);
                    
                }
                vacData.history.firstDose.push(firstDose);
                vacData.history.secondDose.push(secondDose);
            }
            //TODO: check consistenty if !pushDates
        }
        else {
            console.log("Error getting dose vac history: " + vacDoseHistoryData.reason);
            vacDataFailed = true;
        }

        ///////////

        const lastVacDays = 28;
        const totalPoints = [];
        let curTotal = 0;
        for (let i = vacData.history.total.length - lastVacDays; i < vacData.history.total.length; ++i) {
            curTotal += vacData.history.total[i];
            totalPoints.push([i, curTotal]);
        }

        const goal = vacData.population * 0.8;

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