function bestowBets(suspect) {
    let betMat = new THREE.MeshBasicMaterial({ color: new THREE.Color() })
    getViridis(suspects.indexOf(suspect), betMat.color)

    const bets = Array(pm.betsPerSuspect)
    suspect.bets = bets
    const betOwners = Array(pm.betsPerSuspect)
    suspect.betOwners = betOwners
    for (let i = 0; i < pm.betsPerSuspect; ++i) {
        let bet = Rectangle({
            getScale: (target) => {
                target.x = cashWidth
                target.y = cashHeight
            },
            haveIntendedPosition: true,
            z: -3.,
            mat: betMat
        })

        bets[i] = bet
        suspect.betOwners[i] = pm.BOARD_OWNERSHIP
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
        betOwners.forEach( (betOwner,i) => {
            if(betOwner === socket.playerId)
                ++numInHand

            if (betOwner !== previousOwners[i]) {
                if (betOwner === socket.playerId) {
                    let sound = sounds["gotBet"]
                    sound.currentTime = 0.
                    let soundPromise = sound.play()
                    soundPromise.then(function () { }).catch(function () { })
                }
                else if (betOwner !== pm.BOARD_OWNERSHIP) {
                    let sound = sounds["someoneElseGotBet"]
                    sound.currentTime = 0.
                    let soundPromise = sound.play()
                    soundPromise.then(function () { }).catch(function () { })
                }
                previousOwners[i] = betOwner
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

        //And all of that stuff can be overriden...

        // if(showingScoresMode && suspect.confirmed) {
        //     log("yo")
        //     let numBetsSoFar = 0.
        //     bets.forEach((bet) => {
        //         Object.keys(finalStaticCashes).forEach((playerId)=>{
                    //yeah, you need to know what bet is owned by whom, surprise surprise

                    // if (bet.owner === playerId) {
                    //     finalStaticCashes[playerId].getEdgeCenter("l", bet.intendedPosition)
                    //     bet.intendedPosition.x -= bet.scale.x / 2.
                    //     bet.intendedPosition.x -= numBetsSoFar * cashWidth

                    //     bet.position.z = OVERLAY_Z + 1.

                    //     ++numBetsSoFar
                    // }
        //         })
        //     })
        // }
    })
}