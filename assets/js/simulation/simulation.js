import * as PIXI from 'pixi.js'

document.addEventListener("DOMContentLoaded", onDOMLoaded);

function onDOMLoaded() {
    let app = new PIXI.Application({ width: 512, height: 512 });
    document.body.appendChild(app.view);

    let peopleContainer = new PIXI.Container();
    app.stage.addChild(peopleContainer);

    let person = createPerson();
    peopleContainer.addChild(person);

    app.ticker.add(dt => gameLoop(dt));

    function createPerson() {
        let person = new PIXI.Graphics();
        person.beginFill(0xFFFFFF);
        person.drawCircle(-8, 8, 16);
        return person;
    }

    function gameLoop(dt) {
        let speed = 1;
        person.x += dt * speed;
        person.y += dt * speed;
    }
}

