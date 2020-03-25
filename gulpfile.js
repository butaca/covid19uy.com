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

const nodeModules = './node_modules';

const paths = {
    webpackEntry: './assets/js/index.js',
    srcJS: './assets/js/**/*.js',
    destJS: './static/js',
    mainSCSS: './assets/sass/main.scss',
    srcSCSS: './assets/sass/**/*.scss',
    destCSS: './static/css',
    deploy: 'public'
};

function sassBuild() {
    return gulp.src(paths.mainSCSS)
        .pipe(sass({ outputStyle: 'compressed', includePaths: [nodeModules] }).on('error', sass.logError))
        .pipe(gulp.dest(paths.destCSS));
};

function sassWatch() {
    return gulp.watch(paths.srcSCSS, sassBuild);
};

function webpackBuild() {
    return gulp.src(paths.webpackEntry)
        .pipe(webpack({
            output: {
                filename: 'main.js',
            },
            plugins: [
                new TerserPlugin()
            ],
            mode: "production"
        }))
        .pipe(gulp.dest(paths.destJS));
};

function webpackWatch() {
    return gulp.watch(paths.srcJS, webpackBuild);
};

const build = gulp.parallel([sassBuild, webpackBuild]);

function hugoBuild(cb) {
    const params = ["--gc", "--verbose", "--cleanDestinationDir", "--ignoreCache"];
    const context = process.env.CONTEXT;
    let baseURL = process.env.URL;
    if (context == "branch-deploy" || context == "deploy-preview") {
        baseURL = process.env.DEPLOY_PRIME_URL;
    }
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
    const hugoProc = exec('hugo server --disableFastRender --i18n-warnings --ignoreCache --noHTTPCache --forceSyncStatic');
    hugoProc.stdout.pipe(process.stdout);
    hugoProc.stderr.pipe(process.stderr);
    cb();
};

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
    result.updated = Date.now()
    fs.writeFileSync("./data/world.json", JSON.stringify(result));
}

const watch = gulp.parallel([sassWatch, webpackWatch]);

exports.develop = gulp.series([downloadData, build, gulp.parallel(watch, hugoServer)]);
exports.deploy = gulp.series([downloadData, build, hugoBuild, purgeCSS, embedCritialCSS]);
exports.default = exports.develop;
