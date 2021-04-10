//matthew vandevander

function initSound() {
    let fileNames = [
        "judgement",
        "gotBet",
        "gotMoney",
        "exchangeFailure",
        "someoneElseGotBet",
        "someoneElseGotMoney",
        "newSuspect"
    ];
    fileNames.forEach( (fn) => {
        sounds[fn] = new Audio("assets/sfx/" + fn + ".wav")
        if(fn !== "exhangeFailure" && fn !== "newSuspect")
            sounds[fn].volume = .2
    })
}