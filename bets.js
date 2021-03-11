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

    function getBottomMiddleTop(owner) {
        if(owner === socket.id)
            return 0
        else if(owner === pm.BOARD_OWNERSHIP )
            return 1
        else
            return 2
    }

    function getUnusedBetClosestToY(y) {
        return getMax(bets, (bet, j) => {
            if (betsAccountedFor[j] === true)
                return -Infinity
            else
                return -Math.abs(bet.position.y - y)
        })
    }

    const betsAccountedFor = Array(pm.betsPerSuspect)
    updateFunctions.push(() => {

        let numInBoard = pm.getNumBoardBets(suspect)
        let numInHand = 0
        suspect.bets.forEach((bet)=>{
            if(bet.owner === socket.id)
                ++numInHand
        })

        for (let i = 0; i < pm.betsPerSuspect; ++i)
            betsAccountedFor[i] = false

        //fill hand
        for (let i = 0; i < numInHand; ++i) {
            let intendedY = suspect.handFrame.position.y + getSlotY(i)

            let closestBet = getUnusedBetClosestToY(intendedY)
            closestBet.intendedPosition.y = intendedY
            betsAccountedFor[bets.indexOf(closestBet)] = true
        }

        //fill slots
        for(let i = pm.betsPerSuspect-1; i > -1; --i) {
            let cb = suspect.cashBits[i]
            let slot = cb.slot
            
            if( i < pm.betsPerSuspect - numInBoard )
                break

            let closestBet = getUnusedBetClosestToY(slot.position.y)
            closestBet.intendedPosition.y = slot.position.y
            betsAccountedFor[bets.indexOf(closestBet)] = true
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


        

        // //sort by which thing they're in and how high up they are
        // bets.sort((betA, betB) => { //gotta be negative if a < b
        //     if (betA.owner === betB.owner)
        //         return betA.position.y - betB.position.y

        //     let aBmt = getBottomMiddleTop(betA.owner)
        //     let bBmt = getBottomMiddleTop(betA.owner)
        //     return aBmt - bBmt
        // })

        // bets.forEach((bet, i) => {
        //     if (i < numInHand) //hand
        //         bet.intendedPosition.y = suspect.handFrame.position.y + getSlotY(i)
        //     else if (i < numInHand + numInBoard) { //board
        //         i = i - numInHand
        //         let slotIndex = pm.betsPerSuspect - (numInBoard - i)
        //         bet.intendedPosition.y = suspect.boardFrame.position.y + getSlotY(slotIndex)
        //     }
        //     else //other player
        //         bet.intendedPosition.y = EVERYONE_ELSE_VERTICAL_POSITION

        //     if (frameCount === 1)
        //         bet.goToIntendedPosition()
        //     bet.intendedPosition.x = suspect.frame.position.x
        //     bet.position.x = suspect.frame.position.x
        // })

        // log(bets[0].position.y)
        // log(bets[bets.length-1].position.y)
    })
}