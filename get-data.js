const axios = require('axios');
const moment = require("moment");
const cheerio = require("cheerio");
const fs = require('fs');
const prettyCompactStringify = require("json-stringify-pretty-compact");

const BASE_URL = "https://services5.arcgis.com/Th0Tmkhiy5BQYoxP/arcgis/rest/services/Casos_DepartamentosROU_vista_2/FeatureServer/";
const REPORT_BASE_URL = "https://www.gub.uy/sistema-nacional-emergencias/comunicacion/comunicados/informe-situacion-sobre-coronavirus-covid-19-uruguay-";

async function request(url, params) {
    if (params) {
        url += "?" + new URLSearchParams(params).toString();
    }

    try {
        let response;
        response = await axios.get(url)
        if (response.status !== 200) {
            throw new Error('Unexpected HTTP code when downloading data: ' + response.status);
        }
        return response.data;
    } catch (e) {
        throw e;
    }
}

async function queryIntValue(type, onStatisticField) {
    const url = BASE_URL + type + "/query"

    const where = (type == 1 ? "publicar_sino=1" : "1=1");

    const outStatistics = [
        {
            statisticType: "sum",
            onStatisticField: onStatisticField,
            outStatisticFieldName: "value"
        }
    ]

    const params = {
        f: "json",
        where: where,
        returnGeometry: false,
        outStatistics: JSON.stringify(outStatistics),
        resultType: "standard",
        cacheHint: "false"
    };

    const data = await request(url, params);
    let value = 0;
    try {
        value = data.features[0].attributes.value;
    }
    catch (e) {
        console.error("Error in queryIntValue when getting " + onStatisticField + ": " + e.message);
    }

    const parsedValue = parseInt(value)

    if (isNaN(parsedValue)) {
        console.error("NaN value when getting " + onStatisticField);
        value = 0;
    }

    return value;
}

async function getUpdatedDate() {
    const data = await request(BASE_URL + '0/', { f: "json" });
    let date = null;
    try {
        date = moment(data.editingInfo.lastEditDate);
    }
    catch (e) {
        date = moment();
        console.error("Error getting updated date: " + e.message);
    }
    return date.format("YYYY-MM-DD")
}

async function fetchMonitorData() {
    const [date, tests, activeCases, cases, recovered, deaths, icu, hc, hcRecovered, hcDeaths, newCases] = await Promise.all([
        getUpdatedDate(),
        queryIntValue(1, "test_procesados"),
        queryIntValue(0, "CasosActivos"),
        queryIntValue(0, "Casos_Positivos"),
        queryIntValue(0, "Casos_Recuperados"),
        queryIntValue(0, "Fallecidos"),
        queryIntValue(1, "casos_cuidados_intensivos"),
        queryIntValue(1, "positivos_personal_salud"),
        queryIntValue(1, "Pacientes_Recuperados"),
        queryIntValue(1, "Fallecidos"),
        queryIntValue(1, "Casos_Sospechosos")
    ]);

    let data = {
        date: date,
        tests: tests,
        cases: cases,
        recovered: recovered,
        deaths: deaths,
        icu: icu,
        hc: hc,
        hcRecovered: hcRecovered,
        hcDeaths: hcDeaths,
        newCases: newCases
    };

    if (activeCases != (cases - recovered - deaths)) {
        data.activeCases = activeCases;
    }

    return data;
}

function getTDValue(td) {
    try {
        let value = null;
        if (td) {
            let elem = td;
            while (elem.children && elem.children.length > 0) {
                elem = elem.children[0];
            }
            value = elem.data;
        }
        if (!value) {
            value = "";
        }
        return value.trim();
    }
    catch (e) {
        console.error("Error getting td value: " + e.message);
        return 0;
    }
}

async function fetchReportData() {
    const todayDate = moment();
    const todayDatStr = todayDate.format("YYYY-MM-DD");

    const reportURL = REPORT_BASE_URL + todayDate.format("DDMMYYYY");
    const reportData = await request(reportURL);

    const day = {
        date: todayDatStr,
        deps: {}
    };

    const html = cheerio.load(reportData.replace(/[\n]/g, ''));
    const rows = html('tbody tr');

    let lastDep = null
    let headersSkipped = false;

    for (let i = 0; i < rows.length; ++i) {
        const row = rows[i];
        const tdSex = row.children[0];
        const tdAge = row.children[1];
        const tdDep = row.children[2];

        const age = getTDValue(tdAge);
        const sex = getTDValue(tdSex);
        const depData = getTDValue(tdDep);

        if (!headersSkipped && row.children.length == 3 && sex.length == 1 && !isNaN(parseInt(age)) && depData.length > 4) {
            headersSkipped = true;
        }
        if (headersSkipped) {
            if (row.children.length > 1) {
                let dep = lastDep;
                if (tdDep != undefined) {
                    const words = depData.split(" ");
                    dep = words.map((word) => {
                        if (word.length > 1) {
                            return word[0].toUpperCase() + word.substring(1).toLowerCase();
                        }
                        else {
                            return word.toLowerCase();
                        }
                    }).join(" ");

                    dep = dep.replace("Paysandu", "Paysandú");
                    dep = dep.replace("Rio Negro", "Río Negro");
                    dep = dep.replace("San Jose", "San José");
                    dep = dep.replace("Tacuarembo", "Tacuarembó");

                    lastDep = dep;
                }

                if (age != null && age.length > 0) {
                    if (!day.deps[dep]) {
                        day.deps[dep] = [];
                    }

                    day.deps[dep].push({
                        age: parseInt(age),
                        s: sex
                    });
                }
            }
            else {
                console.error("Unexpected row length of " + row.length);
            }
        }
    }

    let deleted = 0;

    const text = html('.Page-document p').text();
    const deletedRegExp = /(?<deleted>\d+)(\scasos fueron eliminados)/;
    const res = text.match(deletedRegExp);

    if (res != null) {
        deleted = parseInt(res.groups.deleted);
    }

    return {
        deaths: day,
        deleted: deleted
    };
}

const URUGUAY_FILE = 'assets/js/data/uruguay.json';
const DEATHS_FILE = 'assets/js/data/uruguayDeaths.json';

(async function () {
    const data = await fetchMonitorData();
    const reportData = await fetchReportData();
    if (reportData.deleted > 0) {
        data.lateDeletedCases = reportData.deleted;
    }
    const deathsData = reportData.deaths;
    console.log(JSON.stringify(data));
    console.log("\n" + JSON.stringify(deathsData));

    const uruguayFileData = fs.readFileSync(URUGUAY_FILE);
    const uruguayData = JSON.parse(uruguayFileData);
    let lastIndex = uruguayData.data.length - 1;
    if (lastIndex >= 0 && uruguayData.data[lastIndex].date == data.date) {
        uruguayData.data.pop();
    }
    uruguayData.data.push(data);
    fs.writeFileSync(URUGUAY_FILE, JSON.stringify(uruguayData, null, 4));

    const deathsFileData = fs.readFileSync(DEATHS_FILE);
    const uruguayDeathsData = JSON.parse(deathsFileData);
    lastIndex = uruguayDeathsData.days.length - 1;
    if (lastIndex >= 0 && uruguayDeathsData.days[lastIndex].date == deathsData.date) {
        uruguayDeathsData.days.pop();
    }
    uruguayDeathsData.days.push(deathsData);
    fs.writeFileSync(DEATHS_FILE, prettyCompactStringify(uruguayDeathsData, { indent: 4, maxLength: 4096 }));

})();


