const axios = require('axios');
const moment = require("moment");
const querystring = require('querystring');
const cheerio = require("cheerio");

const BASE_URL = "https://services5.arcgis.com/Th0Tmkhiy5BQYoxP/arcgis/rest/services/Casos_DepartamentosROU_vista_2/FeatureServer/";
const REPORT_BASE_URL = "https://www.gub.uy/sistema-nacional-emergencias/comunicacion/comunicados/informe-situacion-sobre-coronavirus-covid-19-uruguay-";

async function request(url, params) {
    if (params) {
        url += "?" + querystring.encode(params);
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
    const [date, tests, activeCases, cases, recovered, deaths, icu, imcu, hc, hcRecovered, hcDeaths, newCases] = await Promise.all([
        getUpdatedDate(),
        queryIntValue(1, "test_procesados"),
        queryIntValue(0, "CasosActivos"),
        queryIntValue(0, "Casos_Positivos"),
        queryIntValue(0, "Casos_Recuperados"),
        queryIntValue(0, "Fallecidos"),
        queryIntValue(1, "casos_cuidados_intensivos"),
        queryIntValue(1, "casos_cuidados_intermedios"),
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
        imcu: imcu,
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
        let elem = td;
        while(elem.children && elem.children.length > 0) {
            elem = elem.children[0];
        }
        let value = elem.data;
        if(!value) {
            value = "";
        }
        return value;
    }
    catch (e) {
        console.error("Error getting td value: " + e.message);
        return 0;
    }
}

async function fetchDeathsData() {
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
    // skip the first row since it is a header and not data
    for (let i = 1; i < rows.length; ++i) {
        const row = rows[i];
        if (row.children.length > 1) {
            const tdSex = row.children[0];
            const tdAge = row.children[1];
            const tdDep = row.children[2];

            const age = getTDValue(tdAge);
            const sex = getTDValue(tdSex);

            let dep = lastDep;
            if (tdDep != undefined) {
                const depData = getTDValue(tdDep).trim();
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

            if (age != null && age.trim().length > 0) {
                if (!day.deps[dep]) {
                    day.deps[dep] = [];
                }

                day.deps[dep].push({
                    age: parseInt(age.trim()),
                    s: sex.trim()
                });
            }
        }
        else {
            console.error("Unexpected row length of " + row.length);
        }
    }
    return day;
}

(async function () {
    const data = await fetchMonitorData();
    console.log(JSON.stringify(data));
    const deathsData = await fetchDeathsData();
    console.log("\n" + JSON.stringify(deathsData));
})();


