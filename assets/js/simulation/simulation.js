import burger from '../burger'
import nfCookies from '../nf-cookies'
import '../icons'

import * as PIXI from 'pixi.js'
import langEs from "../../../i18n/es.yaml";
import langEn from "../../../i18n/en.yaml";
import { Disease, Society, Bindings } from './params'
import { Person, State } from './person'
import { DiseaseChart } from './chart'

if (document.readyState === 'loading') {
    document.addEventListener("DOMContentLoaded", onDOMLoaded);
} else {
    onDOMLoaded();
}

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min;
}

function onDOMLoaded() {
    burger();
    nfCookies();

    const langs = {
        es: langEs,
        en: langEn
    }

    const htmlLang = document.documentElement.getAttribute("lang");

    let lang = langs.es;
    if (langs.hasOwnProperty(htmlLang)) {
        lang = langs[htmlLang];
    }

    const width = 512;
    const height = 512;
    const cols = 16;
    const rows = 16;

    const app = new PIXI.Application({ view: document.getElementById('sim'), width: width, height: height, backgroundColor: 0xFAFAFA });

    const resizeCanvas = function () {
        const parent = app.view.parentNode;
        const clientSize = Math.min(parent.clientWidth, parent.clientHeight);
        app.renderer.resize(clientSize, clientSize);
        app.stage.scale.set(clientSize / width, clientSize / height);
    }

    window.addEventListener('resize', resizeCanvas);

    const peopleContainer = new PIXI.Container();
    app.stage.addChild(peopleContainer);

    const people = [];

    const cellWidth = width / cols;
    const cellHeight = height / rows;

    const renderer = app.renderer;

    const radius = 4;
    const personGraphics = new PIXI.Graphics();
    personGraphics.beginFill(0xFFFFFF);
    personGraphics.drawCircle(0, 0, radius);
    const personTexture = renderer.generateTexture(personGraphics);

    for (let col = 0; col < cols; ++col) {
        for (let row = 0; row < rows; ++row) {
            let person = new Person(personTexture, radius, (col + 0.5) * cellWidth, (row + 0.5) * cellHeight, width, height);
            peopleContainer.addChild(person.do);
            people.push(person);
        }
    }

    app.ticker.add(function () { gameLoop(app.ticker.deltaMS * 0.001); });

    const chart = new DiseaseChart("chart", people, lang);

    const btnRestart = document.getElementById('restart');
    btnRestart.addEventListener('click', restart);

    let restartGame = true;

    resizeCanvas();

    function gameLoop(dt) {
        if (restartGame) {
            for (let i = 0; i < people.length; ++i) {
                people[i].restart();
            }
            chart.restart();
            restartGame = false;

            const randomPerson = people[getRandomInt(0, people.length)];
            randomPerson.setState(State.INFECTED);
            randomPerson.forceDisableAvoidance = true;
        }

        for (let i = 0; i < people.length; ++i) {
            people[i].update(dt);
        }

        for (let i = 0; i < people.length; ++i) {
            const person = people[i];

            if (Bindings.avoidanceProbDirty) {
                person.updateAvoidance();
            }

            for (let j = i + 1; j < people.length; ++j) {
                const otherPerson = people[j];
                const dx = person.do.x - otherPerson.do.x;
                const dy = person.do.y - otherPerson.do.y;
                const distSqrd = dx * dx + dy * dy;

                if ((person.state == State.INFECTED && otherPerson.state == State.NORMAL) || (otherPerson.state == State.INFECTED && person.state == State.NORMAL)) {
                    if (distSqrd <= Disease.contagionDistance * Disease.contagionDistance) {
                        if (person.state == State.NORMAL) {
                            person.addExposureTime(dt);
                        }
                        if (otherPerson.state == State.NORMAL) {
                            otherPerson.addExposureTime(dt);
                        }
                    }
                }

                if (distSqrd <= Society.avoidanceDistance * Society.avoidanceDistance) {

                    let toPersonX = (person.do.x - otherPerson.do.x);
                    let toPersonY = (person.do.y - otherPerson.do.y);
                    let toPersonMagSqrd = toPersonX * toPersonX + toPersonY * toPersonY;
                    if (toPersonMagSqrd > 0) {
                        let toPersonMag = Math.sqrt(toPersonMagSqrd);
                        if (toPersonMag) {
                            toPersonX /= toPersonMag;
                            toPersonY /= toPersonMag;
                        }
                    }

                    person.avoidanceX += toPersonX;
                    person.avoidanceY += toPersonY;

                    otherPerson.avoidanceX -= toPersonX;
                    otherPerson.avoidanceY -= toPersonY;
                }
            }
        }

        Bindings.avoidanceProbDirty = false;

        chart.update(dt);

        if (chart.done) {
            app.ticker.stop();
        }

    }

    function restart() {
        app.ticker.stop();
        app.ticker.start();
        restartGame = true;
    }
}
