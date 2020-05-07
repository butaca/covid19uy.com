import { State } from './person'
import { Society } from './params'

Chart.pluginService.register({
    afterDraw: chart => {
        if (typeof chart.config.options.lineAt != 'undefined') {
            const lineAt = chart.config.options.lineAt;
            const ctx = chart.chart.ctx;
            const xAxe = chart.scales[chart.config.options.scales.xAxes[0].id];
            const yAxe = chart.scales[chart.config.options.scales.yAxes[0].id];

            ctx.strokeStyle = "#d9554c";
            ctx.lineWidth = 2;
            ctx.beginPath();
            const lineY = yAxe.top + yAxe.height * (lineAt - yAxe.max) / (yAxe.min - yAxe.max);
            ctx.moveTo(xAxe.left, lineY);
            ctx.lineTo(xAxe.right, lineY);
            ctx.stroke();
            ctx.fillStyle = ctx.strokeStyle;
            ctx.fillText(chart.lang.healthSystemCapacity.other, xAxe.left + 4, lineY - 8);
        }
    }
});

class DiseaseChart {
    constructor(id, people, lang, state) {
        this.sampleTime = 0.25;
        this.people = people;
        this.state = state;
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
                lineAt: Society.healthSystemCapacity,
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
        this.chart.lang = lang;
        this.restart();
        let chart = this.chart;
        setInterval(function () {
            if (Society.healthSystemCapacity != chart.options.lineAt) {
                chart.options.lineAt = Society.healthSystemCapacity;
                chart.update();
            }
        }, 1 / 60 * 1000);
    }

    update(dt) {
        if (!this.done) {
            this.time -= dt;
            this.totalTime += dt;
            if (this.time <= 0) {

                this.time += this.sampleTime;
                this.chart.data.datasets[0].data.push(this.state.totalInfected);
                this.chart.data.datasets[1].data.push(this.state.totalDeaths);
                //TODO: assuming 1 day = 1 second
                this.chart.data.labels.push(Math.floor(this.totalTime));
                this.chart.update();
                if (this.state.totalInfected == 0) {
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