//matthew vandevander

function initSound() {
    const sounds = {};
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

    playSound = (event) => {
        let sound = sounds[event]
        sound.currentTime = 0.
        let soundPromise = sound.play()
        soundPromise.then(function () { }).catch(function () { }) //suppress promise
    }
}