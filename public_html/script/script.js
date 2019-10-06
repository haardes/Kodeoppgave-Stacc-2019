window.onload = function () {
  getFromApi();
};

document.querySelectorAll(".input-container").forEach(div => {
  const slider = div.querySelector("input[type=range]");
  const input = div.querySelector("input[type=number]");

  slider.addEventListener("input", e => {
    input.value = e.target.valueAsNumber;
  });

  slider.addEventListener("change", e => {
    getFromApi();
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

    getFromApi();
  });
});

document.getElementById("loan-type").addEventListener("change", e => {
  getFromApi();
});

/* document.getElementById("download-btn").addEventListener("click", e => {
  let xhr = new XMLHttpRequest();
  let filetype = document.getElementById("file-extension").value;
  let url = `/download/${filetype}`;
  xhr.open("GET", url);
  xhr.send();
}); */

var myChart;
var myPie;

function postJSON(url, data) {
  let xhr = new XMLHttpRequest();
  xhr.open("POST", url, true);
  xhr.setRequestHeader("Content-Type", "application/json");
  xhr.send(data);
  return xhr;
}

function getFromApi() {
  let url = "/api";
  let data = JSON.stringify({
    "laanebelop": document.getElementById("loan-slider").valueAsNumber,
    "nominellRente": document.getElementById("interest-slider").valueAsNumber,
    "lopetid": document.getElementById("duration-slider").valueAsNumber,
    "terminGebyr": 30,
    "saldoDato": "2020-01-01",
    "laanetype": (document.getElementById("loan-type").checked) ? "SERIE" : "ANNUITET"
  });

  let xhr = postJSON(url, data);
  xhr.onreadystatechange = function () {
    if (xhr.readyState === 4 && xhr.status === 200) {
      let json = JSON.parse(xhr.responseText);
      prepareData(json.nedbetalingsplan);
    }
  };
}

/* function getPaymentPlan() {
  var url = "https://visningsrom.stacc.com/dd_server_laaneberegning/rest/laaneberegning/v1/nedbetalingsplan";
  var data = JSON.stringify({
    "laanebelop": document.getElementById("loan-slider").valueAsNumber,
    "nominellRente": document.getElementById("interest-slider").valueAsNumber,
    "terminGebyr": 30,
    "utlopsDato": "2045-01-01",
    "saldoDato": "2020-01-01",
    "datoForsteInnbetaling": "2020-02-01",
    "ukjentVerdi": "TERMINBELOP"
  });

  let xhr = postJSON(url, data);
  xhr.onreadystatechange = function () {
    if (xhr.readyState === 4 && xhr.status === 200) {
      let json = JSON.parse(xhr.responseText);
      console.log(json);
      prepareData(json.nedbetalingsplan.innbetalinger);
    }
  };
} */


function prepareData(nedbetalingsplan) {
  let data = {
    restbelop: [],
    avdrag: [],
    renter: [],
    dato: [],
    gebyrerTotalt: nedbetalingsplan.gebyrerTotalt,
    renterTotalt: nedbetalingsplan.renterTotalt,
    totalBelop: nedbetalingsplan.totalBelop,
    effektivRente: nedbetalingsplan.effektivRente
  }

  nedbetalingsplan.innbetalinger.forEach(innbetaling => {
    data.restbelop.push(innbetaling.restbelop);
    data.avdrag.push(innbetaling.avdrag);
    data.renter.push(innbetaling.renter);
    data.dato.push(innbetaling.dato.substring(0, 10));
  });

  document.querySelector(".total-cost>span").innerHTML = `${(data.totalBelop).toFixed(0)}`;
  document.querySelector(".total-interest>span").innerHTML = `${(data.renterTotalt).toFixed(0)}`;
  document.querySelector(".fee>span").innerHTML = `${data.gebyrerTotalt}`;
  document.querySelector(".effective-interest>span").innerHTML = `${(data.effektivRente).toFixed(3)}`;

  if (document.getElementById("loan-type").checked) {
    document.querySelector(".monthly-cost>span").innerHTML =
      `${(data.renter[1] + data.avdrag[1]).toFixed(0)} - ${(data.renter[data.renter.length -1] + 
      data.avdrag[data.avdrag.length-1]).toFixed(0)}`;
  } else {
    document.querySelector(".monthly-cost>span").innerHTML = `${(data.renter[1] + data.avdrag[1] + nedbetalingsplan.terminGebyr).toFixed(0)}`;
  }

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
        data: data.restbelop,
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
        data: [document.getElementById("loan-slider").valueAsNumber, data.gebyrerTotalt, data.renterTotalt],
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