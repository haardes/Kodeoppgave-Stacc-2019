module.exports = {
    generatePlan: function (loanObj) {
        let nedbetalingsplan = {
            saldoDato: new Date(loanObj.saldoDato),
            laanebelop: loanObj.laanebelop,
            lopetid: loanObj.lopetid,
            nominellRente: loanObj.nominellRente,
            terminGebyr: 30,
            innbetalinger: [],
            renterTotalt: 0,
            gebyrerTotalt: 0,
            totalBelop: 0,
            effektivRente: 0
        }

        let innbetaling = {
            dato: new Date(loanObj.saldoDato),
            restbelop: loanObj.laanebelop,
            avdrag: 0,
            renter: 0,
            gebyrer: 0,
            terminbelop: 0
        }

        nedbetalingsplan.innbetalinger.push(innbetaling);
        this.createPayment(nedbetalingsplan, innbetaling);
        this.calculateEffectiveInterest(nedbetalingsplan);

        return nedbetalingsplan;
    },

    createPayment: function (plan, forrigeInnbetaling) {
        let ferdigDato = new Date(plan.saldoDato);
        let year = plan.saldoDato.getFullYear();
        ferdigDato.setFullYear(year + plan.lopetid);

        //Lag kopi av innbetalingsobjektet
        let innbetaling = Object.create(forrigeInnbetaling);
        innbetaling.dato = this.addOneMonth(innbetaling.dato);

        if (innbetaling.dato < ferdigDato) {
            //Oppdater verdier for innbetalingen
            let nominell = plan.nominellRente / 100 / 12;
            innbetaling.gebyrer = plan.terminGebyr;
            innbetaling.terminbelop = plan.laanebelop * (nominell + (nominell / (Math.pow(1 + nominell, plan.lopetid * 12) - 1))) + innbetaling.gebyrer;
            innbetaling.renter = this.calculateInterest(plan, forrigeInnbetaling.dato, innbetaling);
            innbetaling.avdrag = innbetaling.terminbelop - innbetaling.renter - innbetaling.gebyrer;
            innbetaling.restbelop -= innbetaling.avdrag;

            //Oppdater verdier for totale summer i nedbetalingsplanen
            plan.renterTotalt += innbetaling.renter;
            plan.gebyrerTotalt += innbetaling.gebyrer;
            plan.totalBelop += innbetaling.terminbelop;

            plan.innbetalinger.push(innbetaling);
            this.createPayment(plan, innbetaling);

        } else if (innbetaling.dato <= ferdigDato) {
            //Oppdater verdier for innbetalingen
            let nominell = plan.nominellRente / 100 / 12;
            innbetaling.gebyrer = plan.terminGebyr;
            innbetaling.renter = this.calculateInterest(plan, forrigeInnbetaling.dato, innbetaling);

            //Liten hack for å få restbeløpet til 0. Uten får jeg noen (muligens) avrundingsfeil som ga +- 100kr igjen ved slutt
            innbetaling.terminbelop = innbetaling.restbelop + innbetaling.renter + innbetaling.gebyrer;
            innbetaling.avdrag = innbetaling.terminbelop - innbetaling.renter - innbetaling.gebyrer;
            innbetaling.restbelop = Math.round(innbetaling.restbelop - innbetaling.avdrag);

            //Oppdater verdier for totale summer i nedbetalingsplanen
            plan.renterTotalt += innbetaling.renter;
            plan.gebyrerTotalt += innbetaling.gebyrer;
            plan.totalBelop += innbetaling.terminbelop;

            plan.innbetalinger.push(innbetaling);
        }
    },

    calculateInterest: function (plan, prevDato, innbetaling) {
        let daysInYear = (this.isLeapYear(prevDato) ? 366 : 365);

        return (innbetaling.restbelop * (plan.nominellRente / 100) / daysInYear) * this.getDaysInMonth(prevDato); //Finn rente for måneden
    },

    //Dette er ikke en helt korrekt formel for utregning av effektiv rente, men den bør funke til dette bruket
    calculateEffectiveInterest: function (plan) {
        let nominellRente = plan.nominellRente;
        let nomOgGebyrer = nominellRente + ((plan.terminGebyr * 12 / (plan.laanebelop / 2)) * 100);

        const effektivRente = (Math.pow(1 + (nomOgGebyrer / 100 / 12), 12) - 1) * 100;
        plan.effektivRente = effektivRente;
    },

    isLeapYear: function (date) {
        //Hvis året er delelig på 4, skuddår
        //Hvis året er delelig på 100, ikke skuddår
        //Hvis året er delelig på 400, skuddår
        return ((date.getFullYear() % 4 === 0 && date.getFullYear() % 100 !== 0) || date.getFullYear() % 400 === 0);
    },

    getDaysInMonth: function (date) {
        return [31, (this.isLeapYear(date) ? 29 : 28), 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][date.getMonth()];
    },

    //Her bruker jeg UTC for å slippe å håndtere sommertid/vintertid. 
    //Dvs. man betaler 1 time for mye/lite renter den måneden det bytter fra sommertid til vintertid og motsatt
    addOneMonth: function (date) {
        let day = date.getDate();
        let month = date.getMonth();
        let year = date.getFullYear();
        let newDate = new Date(Date.UTC(year, month + 1, day));
        return newDate;
    }
}