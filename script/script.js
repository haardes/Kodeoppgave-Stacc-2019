window.onload = function () {
    console.log("Loaded");
    this.generatePaymentPlan(2000000, 30, 0.03, 25);
}

function generatePaymentPlan(loan, fee, interest, duration) {
    let plan = {
        betalinger: []
    }

    calculatePayment(loan, fee, interest, duration * 12, plan.betalinger);
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
 */
function calculatePayment(balance, fee, interest, timeRemaining, arr) {
    const avdrag = balance / timeRemaining;
    const renter = balance * interest / 12;

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
}