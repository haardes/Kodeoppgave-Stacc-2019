window.onload = function () {
  getPaymentPlan();
};

// Remove the option to submit a form by pressing Enter when inside an input
window.addEventListener(
  "keydown",
  e => {
    if (
      e.keyIdentifier == "U+000A" ||
      e.keyIdentifier == "Enter" ||
      e.keyCode == 13
    ) {
      if (e.target.nodeName == "INPUT" && e.target.type == "number") {
        e.preventDefault();
        return false;
      }
    }
  },
  true
);

document.querySelectorAll(".input-container").forEach(div => {
  const slider = div.querySelector("input[type=range]");
  const input = div.querySelector("input[type=number]");

  slider.addEventListener("input", e => {
    input.value = e.target.valueAsNumber;
  });

  slider.addEventListener("change", e => {
    getPaymentPlan();
  });

  input.addEventListener("change", e => {
    let rounded = Math.round(e.target.valueAsNumber / 100000) * 100000;

    if (rounded > slider.max) {
      rounded = slider.max;
    } else if (rounded < slider.min) {
      rounded = slider.min;
    }

    e.target.value = rounded;
    slider.value = rounded;

    getPaymentPlan();
  });
});

var myChart;
var myPie;

function getPaymentPlan() {
  var xhr = new XMLHttpRequest();
  var url = "https://visningsrom.stacc.com/dd_server_laaneberegning/rest/laaneberegning/v1/nedbetalingsplan";
  xhr.open("POST", url, true);
  xhr.setRequestHeader("Content-Type", "application/json");
  xhr.onreadystatechange = function () {
    if (xhr.readyState === 4 && xhr.status === 200) {
      var json = JSON.parse(xhr.responseText);
      prepareData(json.nedbetalingsplan.innbetalinger);
    }
  };
  var data = JSON.stringify({
    "laanebelop": document.getElementById("loan-slider").valueAsNumber,
    "nominellRente": document.getElementById("interest-slider").valueAsNumber,
    "terminGebyr": 30,
    "utlopsDato": "2045-01-01",
    "saldoDato": "2020-01-01",
    "datoForsteInnbetaling": "2020-02-01",
    "ukjentVerdi": "TERMINBELOP"
  });

  xhr.send(data);
}


function prepareData(innbetalinger) {
  let data = {
    restbeløp: [],
    avdrag: [],
    renter: [],
    dato: [],
    totalRenter: 0,
    totalGebyr: 0,
    totalKost: document.getElementById("loan-slider").valueAsNumber
  }

  innbetalinger.forEach(innbetaling => {
    data.restbeløp.push(innbetaling.restgjeld);
    data.avdrag.push(innbetaling.innbetaling);
    data.renter.push(innbetaling.renter);
    data.dato.push(innbetaling.dato);
    data.totalRenter += innbetaling.renter;
    data.totalGebyr += innbetaling.gebyr;
    data.totalKost += (innbetaling.renter + innbetaling.gebyrer);
  });

  renderChart(data);
}


function renderChart(data) {
  let chartCtx = document.getElementById("chart").getContext("2d");
  let pieCtx = document.getElementById("pie").getContext("2d");

  //Hvis man rendrer grafen på nytt kan man ha problemer med "flickering" når man holder musen over verdier i grafen. Ved å ødelegge grafen før vi tegner
  //på nytt blir vi kvitt dette problemet. Ulempen er at grafen "flickrer" når den tegnes på nytt.
  if (myChart) myChart.destroy();

  myChart = new Chart(chartCtx, {
    type: "line",
    data: {
      labels: data.dato,
      datasets: [{
        label: "Restbeløp",
        data: data.restbeløp,
        yAxisID: "A",
        pointRadius: 0,
        borderColor: "rgb(2, 26, 238)",
        borderWidth: 2,
        backgroundColor: "rgba(2, 26, 238, 0.1)"
      }, {
        label: "Avdrag",
        data: data.avdrag,
        yAxisID: "B",
        pointRadius: 0,
        borderColor: "rgb(0, 255, 0)",
        borderWidth: 0.5,
        backgroundColor: "rgba(0, 255, 0, 0.1)"
      }, {
        label: "Renter",
        data: data.renter,
        yAxisID: "B",
        pointRadius: 0,
        pointHitRadius: 3,
        borderColor: "rgb(227, 4, 37)",
        borderWidth: 0.5,
        backgroundColor: "rgba(227, 4, 37, 0.1)"
      }]
    },
    options: {
      tooltips: {
        intersect: false,
        mode: "index",
        callbacks: {
          label: function (tooltipItem, data) {
            var label = data.datasets[tooltipItem.datasetIndex].label || '';

            if (label) {
              label += ': ';
            }

            label += Math.round(tooltipItem.yLabel).toLocaleString("en") + " kr";
            return label;
          }
        }
      },
      scales: {
        yAxes: [{
          id: "A",
          type: "linear",
          position: "left"
        }, {
          id: "B",
          type: "linear",
          position: "right"
        }]
      }
    }
  });

  if (myPie) myPie.destroy();

  myPie = new Chart(pieCtx, {
    type: 'pie',
    data: {
      datasets: [{
        label: 'Fordeling',
        data: [document.getElementById("loan-slider").valueAsNumber, data.totalGebyr, data.totalRenter],
        backgroundColor: ["rgb(2, 26, 238)", "rgb(0, 255, 0)", "rgb(227, 4, 37)"]
      }],
      labels: ["Nedbetaling lån", "Gebyrer", "Renter"]
    },
    options: {
      tooltips: {
        titleFontSize: 20,
        bodyFontSize: 20,
      }
    }
  });

}



/* function calculateLoan() {

  generatePaymentPlan(

    document.getElementById("loan-slider").valueAsNumber,

    30,

    document.getElementById("interest-slider").valueAsNumber,

    document.getElementById("duration-slider").valueAsNumber

  );

}



function generatePaymentPlan(loan, fee, interest, duration) {

  let plan = {
                    betalinger: []
                  };

                  calculatePayment(loan, fee, interest / 100, duration * 12, plan.betalinger);
                  console.log(plan);

                  let total = 0;
                  let totalFees = 0;
                  plan.betalinger.forEach(betaling => {
                    total += betaling.total;
                    totalFees += betaling.renter;
                    totalFees += betaling.gebyrer;
                  });

                  console.log(`Totalbeløp: ${total}`);
                  console.log(`Totalt renter/gebyrer: ${totalFees}`);

                  return plan;
                }

                /**
                 * En rekursiv funksjon for å generere en samling av betalinger
                 *
                 * @param {Number} balance Restbeløp av lånet
                 * @param {Number} fee Gebyr, per måned
                 * @param {Number} interest Nominell rente som "heltall"
                 * @param {Number} timeRemaining Antall måneder igjen å betale på lånet
                 * @param {Array} arr Samling der betalings-objektene skal settes inn
                 *
                function calculatePayment(balance, fee, interest, timeRemaining, arr) {
                  const avdrag = balance / timeRemaining;
                  const renter = (balance * interest) / 12;

                  arr.push({
                    restbeløp: balance,
                    dato: null,
                    avdrag: avdrag,
                    gebyrer: fee,
                    renter: renter,
                    total: avdrag + renter
                  });

                  if (timeRemaining > 1) {
                    calculatePayment(balance - avdrag, fee, interest, timeRemaining - 1, arr);
                  }
                } */