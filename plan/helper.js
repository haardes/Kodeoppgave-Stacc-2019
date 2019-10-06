module.exports = {
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