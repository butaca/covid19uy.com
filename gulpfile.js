'use strict';

const gulp = require('gulp');
const sass = require('gulp-sass');
const exec = require('child_process').exec;
const webpack = require('webpack-stream');
const purgecss = require('gulp-purgecss');
const replace = require('gulp-replace');
const fs = require('fs');
const TerserPlugin = require('terser-webpack-plugin');
const axios = require("axios");
const cheerio = require("cheerio");
const moment = require("moment");
const autoprefixer = require('gulp-autoprefixer');
const { promisify } = require('util');
const csv = require('csv-parser');

const writeFilePromise = promisify(fs.writeFile);

const nodeModules = './node_modules';

const paths = {
    webpackEntry: './assets/js/home.js',
    srcJS: ['./assets/js/**/*.js', './data/**/*.json', './i18n/**/*.yaml'],
    destJS: './static/js',
    destJSFilename: 'main.js',
    mainSCSS: './assets/sass/main.scss',
    srcSCSS: './assets/sass/**/*.scss',
    destCSS: './static/css',
    deploy: 'public'
};

const simulationPaths = {
    webpackEntry: './assets/js/simulation/simulation.js',
    srcJS: './assets/js/**/*.js',
    destJS: './static/simulation/js',
    destJSFilename: 'simulation.js',
}

const twitterPaths = {
    webpackEntry: './assets/js/twitter/twitter.js',
    srcJS: './assets/js/**/*.js',
    destJS: './static/twitter/js',
    destJSFilename: 'twitter.js',
}

function sassBuild() {
    return gulp.src(paths.mainSCSS)
        .pipe(sass({ outputStyle: 'compressed', includePaths: [nodeModules] }).on('error', sass.logError))
        .pipe(autoprefixer())
        .pipe(gulp.dest(paths.destCSS));
};

function sassWatch() {
    return gulp.watch(paths.srcSCSS, sassBuild);
};

function webpackBuild(options) {
    return gulp.src(options.webpackEntry)
        .pipe(webpack({
            output: {
                filename: options.destJSFilename,
            },
            plugins: [
                new TerserPlugin()
            ],
            mode: "production",
            module: {
                rules: [
                    {
                        test: /\.ya?ml$/,
                        type: 'json',
                        use: 'yaml-loader'
                    }
                ]
            }
        }))
        .pipe(gulp.dest(options.destJS));
}

function webpackBuildMain() {
    return webpackBuild(paths);
};

function webpackWatch() {
    return gulp.watch(paths.srcJS, gulp.series(webpackBuildMain, simulationBuild, twitterBuild));
};

function simulationBuild() {
    return webpackBuild(simulationPaths);
};

function twitterBuild() {
    return webpackBuild(twitterPaths);
}

const build = gulp.series(gulp.parallel(sassBuild, webpackBuildMain), simulationBuild, twitterBuild);

function hugoBuild(cb) {
    const params = ["--gc", "--verbose", "--cleanDestinationDir", "--ignoreCache"];
    const context = process.env.CONTEXT;
    let baseURL = process.env.URL;
    let environment = "production";

    if (context == "branch-deploy" || context == "deploy-preview") {
        baseURL = process.env.DEPLOY_PRIME_URL;
        environment = "development";
    }

    params.push("--environment");
    params.push(environment);

    if (baseURL != null) {
        params.push("--baseURL");
        params.push(baseURL);
        console.log("overriding baseURL with: " + baseURL);
    }

    exec('hugo ' + params.join(' '), function (err, stdout, stderr) {
        console.log(stdout);
        console.log(stderr);
        cb(err);
    });

};

function purgeCSS() {
    return gulp
        .src(paths.deploy + '/css/*.css')
        .pipe(
            purgecss({
                content: [paths.deploy + '/**/*.html', paths.deploy + '/**/*.js']
            })
        )
        .pipe(gulp.dest(paths.deploy + '/css'))
};

function embedCritialCSS() {
    return gulp.src(paths.deploy + '/**/*.html')
        .pipe(replace(/<link href='\/css\/main.css'[^>]*>/g, function (s) {
            const style = fs.readFileSync(paths.deploy + '/css/main.css', 'utf8');
            return '<style>\n' + style + '\n</style>';
        }))
        .pipe(gulp.dest(paths.deploy));
};

function hugoServer(cb) {
    const hugoProc = exec('hugo server --disableFastRender --i18n-warnings --noHTTPCache --forceSyncStatic --gc');
    hugoProc.stdout.pipe(process.stdout);
    hugoProc.stderr.pipe(process.stderr);
    cb();
};

var updatedDate = null;

async function downloadData() {
    let response;
    try {
        response = await axios.get("https://www.worldometers.info/coronavirus/");
        if (response.status !== 200) {
            throw new Error('Unexpected HTTP code when downloading world data: ' + response.status);
        }
    }
    catch (err) {
        throw err;
    }
    const result = {};
    const html = cheerio.load(response.data);
    html(".maincounter-number").filter((i, el) => {
        let count = el.children[0].next.children[0].data || "0";
        count = parseInt(count.replace(/,/g, "") || "0", 10);
        if (i === 0) {
            result.cases = count;
        } else if (i === 1) {
            result.deaths = count;
        } else {
            result.recovered = count;
        }
    });
    updatedDate = result.updated = Math.floor(Date.now() / 1000);
    await writeFilePromise("./data/world.json", JSON.stringify(result));
}

const watch = gulp.parallel(sassWatch, webpackWatch);

function updateLastMod() {
    return gulp.src('content/_index*.md')
        .pipe(replace(/^lastmod.*/m, function () {
            if (updatedDate == null) {
                updatedDate = Date.now() / 1000;
            }
            return 'lastmod: ' + moment(updatedDate * 1000).format("YYYY-MM-DDTHH:mm:ssZZ");
        }))
        .pipe(gulp.dest('content'));
}

let Countries = {
    Argentina: { dates: [], cases: [], recovered: [], deaths: [] },
    Brazil: { dates: [], cases: [], recovered: [], deaths: [] },
    Chile: { dates: [], cases: [], recovered: [], deaths: [] },
    Paraguay: { dates: [], cases: [], recovered: [], deaths: [] }
};

const COUNTRIES_DATA_BASE_URL = 'https://github.com/CSSEGISandData/COVID-19/raw/master/csse_covid_19_data/csse_covid_19_time_series/';

async function downloadCountryData(file, property, addDates) {
    var req = {
        method: 'get',
        url: COUNTRIES_DATA_BASE_URL + file,
        responseType: 'stream'
    }

    const res = await axios(req);
    const stream = res.data.pipe(csv());
    stream.on('data', data => {
        const countryName = data['Country/Region'];
        const country = Countries[countryName];
        if (country) {
            const keys = Object.keys(data);
            for (let i = 0; i < keys.length; ++i) {
                const key = keys[i];
                const dataDate = moment(key, "MM/DD/YY");
                if (dataDate.isValid()) {
                    const value = parseInt(data[key]);
                    const date = dataDate.format("YYYY-MM-DD");
                    if(addDates) {
                        country.dates.push(date);
                    }
                    country[property].push(value);
                }
            }
        }
    });

    return new Promise((resolve, reject) => {
        stream.on("error", reject);
        stream.on("end", resolve);
    });
}

async function downloadCountriesData() {
    await Promise.all([
        downloadCountryData('time_series_covid19_confirmed_global.csv', 'cases', true),
        downloadCountryData('time_series_covid19_recovered_global.csv', 'recovered', false),
        downloadCountryData('time_series_covid19_deaths_global.csv', 'deaths', false)
    ]);

    var writeFilePromises = [];
    const countriesKeys = Object.keys(Countries);
    for (let i = 0; i < countriesKeys.length; ++i) {
        writeFilePromises.push(writeFilePromise("./data/" + countriesKeys[i].toLowerCase() + ".json", JSON.stringify(Countries[countriesKeys[i]])));
    }
    return Promise.all(writeFilePromises);
}

exports.webpackBuild = webpackBuildMain;
exports.develop = gulp.series(gulp.parallel(downloadData, downloadCountriesData), build, gulp.parallel(watch, hugoServer));
exports.deploy = gulp.series(gulp.parallel(downloadData, downloadCountriesData), updateLastMod, build, hugoBuild, purgeCSS, embedCritialCSS);
exports.default = exports.develop;
