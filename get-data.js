const axios = require('axios');
const fs = require('fs');
const moment = require("moment");
const querystring = require('querystring');

const BASE_URL = "https://services5.arcgis.com/Th0Tmkhiy5BQYoxP/arcgis/rest/services/Casos_DepartamentosROU_vista_2/FeatureServer/"
const URUGUAY_DATE_FILE = "./assets/js/data/uruguay.json"

async function request(url, params) {
    url += "?" + querystring.encode(params);

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
    return data.features[0].attributes.value;
}

async function getUpdatedDate() {
    const data = await request(BASE_URL + '0/', {f: "json"});
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
        activeCases: activeCases,
        tests: tests,
        cases: cases,
        recovered: recovered,
        deaths: deaths,
        icu: icu,
        imcu: imcu,
        hc: hc,
        hcRecovered: hcRecovered,
        hcDeaths : hcDeaths,
        newCases: newCases
    };

    const uruguayData = fs.readFileSync(URUGUAY_DATE_FILE);
    const uruguay = JSON.parse(uruguayData);
    const history = uruguay.data;
    const todayHistoryIndex = history.findIndex(el => el.date == data.date);
    const today = data;
    if(todayHistoryIndex == -1) {
        history.push(today);
    }
    else {
        history[todayHistoryIndex] = today;
    }
    fs.writeFileSync(URUGUAY_DATE_FILE, JSON.stringify(uruguay));

})();

    
