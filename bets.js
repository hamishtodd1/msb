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

    updateFunctions.push(() => {

        let numInHand = 0
        let numInBoard = 0
        bets.forEach((bet) => {
            if (bet.owner === socket.id)
                ++numInHand
            if (bet.owner === pm.BOARD_OWNERSHIP)
                ++numInBoard
        })

        //sort by which thing they're in and how high up they are
        bets.sort((betA, betB) => { //gotta be negative if a < b
            if (betA.owner === betB.owner)
                return betA.position.y - betB.position.y

            let aBmt = getBottomMiddleTop(betA.owner)
            let bBmt = getBottomMiddleTop(betA.owner)
            return aBmt - bBmt
        })

        bets.forEach((bet, i) => {
            if (i < numInHand)
                bet.intendedPosition.y = suspect.handFrame.position.y + getSlotY(i)
            else if (i < numInHand + numInBoard) {
                i = i - numInHand
                let slotIndex = pm.betsPerSuspect - (numInBoard - i)
                bet.intendedPosition.y = suspect.boardFrame.position.y + getSlotY(slotIndex)
            }
            else
                bet.intendedPosition.y = EVERYONE_ELSE_VERTICAL_POSITION

            if (frameCount === 1)
                bet.goToIntendedPosition()
            bet.intendedPosition.x = suspect.frame.position.x
            bet.position.x = suspect.frame.position.x
        })
    })
}