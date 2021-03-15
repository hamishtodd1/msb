function bestowBets(suspect) {
    let betMat = new THREE.MeshBasicMaterial({ color: new THREE.Color() })
    getViridis(suspects.indexOf(suspect), betMat.color)

    const bets = Array(pm.betsPerSuspect)
    suspect.bets = bets
    for (let i = 0; i < pm.betsPerSuspect; ++i) {
        let bet = Rectangle({
            getScale: (target) => {
                target.x = cashWidth
                target.y = betHeight
            },
            haveIntendedPosition: true,
            z: -3.,
            mat: betMat
        })

        bets[i] = bet
        bet.owner = pm.BOARD_OWNERSHIP
    }

    function sendUnusedBetClosestToY(y) {
        let closestBet = getMax(bets, (bet, j) => {
            if (betsAccountedFor[j] === true)
                return -Infinity
            else
                return -Math.abs(bet.position.y - y)
        })

        closestBet.intendedPosition.y = y
        betsAccountedFor[bets.indexOf(closestBet)] = true
    }

    // Haven't proven that this system works tbh

    const betsAccountedFor = Array(pm.betsPerSuspect)
    const previousOwners = Array(pm.betsPerSuspect)
    updateFunctions.push(() => {
        let numInBoard = pm.getNumBoardBets(suspect)
        let numInHand = 0
        suspect.bets.forEach((bet,i)=>{
            if(bet.owner === socket.id)
                ++numInHand

            if (bet.owner !== previousOwners[i]) {
                if (bet.owner === socket.id)
                    playSound("gotBet")
                else if (bet.owner !== pm.BOARD_OWNERSHIP)
                    playSound("someoneElseGotBet")
                previousOwners[i] = bet.owner
            }
        })

        for (let i = 0; i < pm.betsPerSuspect; ++i)
            betsAccountedFor[i] = false

        //fill hand
        for (let i = 0; i < numInHand; ++i) {
            let intendedY = suspect.handFrame.position.y + getSlotY(i)

            sendUnusedBetClosestToY(intendedY)
        }

        //fill slots
        for(let i = pm.betsPerSuspect-1; i > -1; --i) {
            let cb = suspect.cashBits[i]
            let slot = cb.slot
            
            if( i < pm.betsPerSuspect - numInBoard )
                break

            sendUnusedBetClosestToY(slot.position.y)
        }

        bets.forEach((bet, i) => {
            if(betsAccountedFor[i] === false)
                bet.intendedPosition.y = EVERYONE_ELSE_VERTICAL_POSITION
        })

        bets.forEach((bet, i) => {
            if (frameCount === 1)
                bet.goToIntendedPosition()
            bet.intendedPosition.x = suspect.frame.position.x
            bet.position.x = suspect.frame.position.x
        })
    })
}