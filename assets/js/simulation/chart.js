import { State } from './person'

class DiseaseChart {
    constructor(id, people, lang) {
        this.sampleTime = 0.25;
        this.people = people;
        var ctx = document.getElementById(id);
        this.chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    pointBackgroundColor: "#28b8d6ff",
                    backgroundColor: "#28b8d680",
                    label: lang.activeCases.other,
                    data: [],
                },
                {
                    pointBackgroundColor: "#e54acfff",
                    backgroundColor: "#e54acfff",
                    label: lang.deaths.other,
                    data: [],
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                scales: {
                    yAxes: [{
                        ticks: {
                            max: people.length,
                        }
                    }]
                }
            }
        });
        this.restart();
    }

    update(dt) {
        if (!this.done) {
            this.time -= dt;
            this.totalTime += dt;
            if (this.time <= 0) {
                let totalInfected = 0;
                let totalDeaths = 0;
                for (let i = 0; i < this.people.length; ++i) {
                    const person = this.people[i];
                    if (person.state == State.INFECTED) {
                        totalInfected++;
                    }
                    else if (person.state == State.DEAD) {
                        totalDeaths++;
                    }
                }
                this.time += this.sampleTime;
                this.chart.data.datasets[0].data.push(totalInfected);
                this.chart.data.datasets[1].data.push(totalDeaths);
                //TODO: assuming 1 day = 1 second
                this.chart.data.labels.push(Math.floor(this.totalTime));
                this.chart.update();
                if (totalInfected == 0) {
                    this.done = true;
                }
            }
        }
    }

    restart() {
        for (let i = 0; i < this.chart.data.datasets.length; ++i) {
            this.chart.data.datasets[i].data = [];
        }
        this.chart.data.labels = [];
        this.chart.update();
        this.time = 0;
        this.totalTime = 0;
        this.done = false;
    }
}

export { DiseaseChart };