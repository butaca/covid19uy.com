const axios = require('axios');
const fs = require('fs');
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

async function queryValue(num, where, outStatistics) {
    const url = BASE_URL + num + "/query"

    const params = {
        f: "json",
        where: where,
        returnGeometry: false,
        outStatistics: outStatistics,
        resultType: "standard",
        cacheHint: "false"
    };

    const data = await request(url, params);
    let value = data.features[0].attributes.value;

    if (value == null) {
        value = 0;
    }

    return value;
}

async function getUpdatedDate() {
    const data = await request(BASE_URL + '0/', { f: "json" });
    return moment(data.editingInfo.lastEditDate).format("YYYY-MM-DD");
}

(async function () {
    const [date, tests, activeCases, cases, recovered, deaths, icu, imcu, hc, hcRecovered, hcDeaths, newCases] = await Promise.all([
        getUpdatedDate(),
        queryValue(1, "publicar_sino=1", '[{"statisticType":"sum","onStatisticField":"test_procesados","outStatisticFieldName":"value"}]'),
        queryValue(0, "1=1", '[{"statisticType":"sum","onStatisticField":"CasosActivos","outStatisticFieldName":"value"}]'),
        queryValue(0, "1=1", '[{"statisticType":"sum","onStatisticField":"Casos_Positivos","outStatisticFieldName":"value"}]'),
        queryValue(0, "1=1", '[{"statisticType":"sum","onStatisticField":"Casos_Recuperados","outStatisticFieldName":"value"}]'),
        queryValue(0, "1=1", '[{"statisticType":"sum","onStatisticField":"Fallecidos","outStatisticFieldName":"value"}]'),
        queryValue(1, "publicar_sino=1", '[{"statisticType":"sum","onStatisticField":"casos_cuidados_intensivos","outStatisticFieldName":"value"}]'),
        queryValue(1, "publicar_sino=1", '[{"statisticType":"sum","onStatisticField":"casos_cuidados_intermedios","outStatisticFieldName":"value"}]'),
        queryValue(1, "publicar_sino=1", '[{"statisticType":"sum","onStatisticField":"positivos_personal_salud","outStatisticFieldName":"value"}]'),
        queryValue(1, "publicar_sino=1", '[{"statisticType":"sum","onStatisticField":"Pacientes_Recuperados","outStatisticFieldName":"value"}]'),
        queryValue(1, "publicar_sino=1", '[{"statisticType":"sum","onStatisticField":"Fallecidos","outStatisticFieldName":"value"}]'),
        queryValue(1, "publicar_sino=1", '[{"statisticType":"sum","onStatisticField":"Casos_Sospechosos","outStatisticFieldName":"value"}]')
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

    console.log(JSON.stringify(data));

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
    for (let i = 2; i < rows.length; ++i) {
        const row = rows[i];
        const tdSex = row.children[0];
        const tdAge = row.children[1];
        const tdDep = row.children[2];
        const value = tdAge.children[0].children[0].children[0].data;
        const sex = tdSex.children[0].children[0].children[0].data;
        let dep;
        if (tdDep != undefined) {
            const depData = tdDep.children[0].children[0].children[0].data;
            const words = depData.split(" ");
            dep = words.map((word) => {
                if(word.length > 1) {
                    return word[0].toUpperCase() + word.substring(1).toLowerCase();
                }
                else {
                    return word.toLowerCase();
                }
            }).join(" ");
            lastDep = dep;
        }
        else {
            dep = lastDep;
        }

        if(value != null && value.trim().length > 0) {
            if(!day.deps[dep]) {
                day.deps[dep] = [];
            }

            day.deps[dep].push({
                age: parseInt(value.trim()),
                s: sex.trim()
            });
        }
    }
    console.log("\n" + JSON.stringify(day));
})();


