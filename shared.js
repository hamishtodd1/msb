const pm = {}

pm.maxSuspects = 8
pm.betsPerSuspect = 24
let cheapestBet = .04501 //probably the lowest percentage people think about is 5%

pm.betPrices = Array(pm.betsPerSuspect)
for (let i = 0.; i < pm.betsPerSuspect; ++i)
    pm.betPrices[i] = Math.pow(cheapestBet, 1. - i / pm.betsPerSuspect)

{
    let entireColumnPrice = 0.
    for (let i = 0.; i < pm.betsPerSuspect; ++i)
        entireColumnPrice += pm.betPrices[i]
    let arbitraryValueChosenByRobinHanson = .6
    pm.startingCash = entireColumnPrice * arbitraryValueChosenByRobinHanson // STARTING CASH
}

pm.BOARD_OWNERSHIP = -1
pm.NO_OWNERSHIP = -2 //urgh, or "no association"? bit of a mess

// function getCheapestBet() {
//     return getMax(suspect.bets, (bet) => {
//         return bet.ownerIndex === pm.BOARD_OWNERSHIP ? 1. / bet.scale.x : -Infinity
//     })
// }

pm.getNumBoardBets = (suspect) => {
    let numInBoard = 0
    suspect.betOwners.forEach((betOwner) => {
        if (betOwner === pm.BOARD_OWNERSHIP)
            ++numInBoard
    })
    return numInBoard
}

pm.isCashBitOnBoard = (suspect,index) => {
    let numBetsOnBoard = pm.getNumBoardBets(suspect)
    let numCashBitsOnBoard = pm.betsPerSuspect - numBetsOnBoard
    return index < numCashBitsOnBoard
}

pm.getCashBitOwnership = (suspect,cashBit) => {
    if (pm.isCashBitOnBoard(suspect,suspect.cashBits.indexOf(cashBit)))
        return pm.NO_OWNERSHIP //more like board ownership
    else
        return cashBit.associatedPlayer
}

pm.getLooseCash = (playerId, susArray) => {
    let ret = 0.

    susArray.forEach((suspect) => {
        suspect.cashBits.forEach((cashBit, i) => {
            if (pm.getCashBitOwnership(suspect, cashBit) === playerId)
                ret += pm.betPrices[i]
        })
    })

    return ret
}

module.exports = pm