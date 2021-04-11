function bestowCashBits(suspect) {
    let cashBits = []
    suspect.cashBits = cashBits
    for (let i = 0; i < pm.betsPerSuspect; ++i) {
        const index = i
        let slot = Rectangle({
            getPosition: (target) => {
                target.x = suspect.frame.position.x 
                    - .5 * cashWidth 
                    + pm.betPrices[index] * cashWidth / 2.

                target.y = suspect.boardFrame.position.y + getSlotY(index)
            },
            getScale: (target) => {
                target.x = pm.betPrices[index] * cashWidth
                target.y = cashHeight
            },
            z: -2.,
            haveFrame:true,
            frameOnly: true,
        })
        updateFunctions.push(()=>{
            // slot.frameThickness = slotFrameThickness
        })

        let cashBit = Rectangle({
            getScale: (target) => {
                target.x = pm.betPrices[index] * cashWidth
                target.y = cashHeight
            },
            z: -3.,
            mat: cashMat,
            haveIntendedPosition: true
        })
        cashBit.slot = slot
        cashBit.associatedPlayer = pm.NO_OWNERSHIP
        cashBits.push(cashBit)
    }

    let previousOwners = Array(pm.betsPerSuspect)
    updateFunctions.push(() => {
        let tail = v0
        staticCash.getEdgeCenter("r", v0)

        cashBits.forEach((cashBit, i) => {
            let owner = pm.getCashBitOwnership(suspect, cashBit)
            if(owner !== previousOwners[i]) {
                if(owner === socket.playerId) {
                    let sound = sounds["gotMoney"]
                    sound.currentTime = 0.
                    let soundPromise = sound.play()
                    soundPromise.then(function () { }).catch(function () { })
                }
                else if(owner !== pm.NO_OWNERSHIP) {
                    let sound = sounds["someoneElseGotMoney"]
                    sound.currentTime = 0.
                    let soundPromise = sound.play()
                    soundPromise.then(function () { }).catch(function () { })
                }
                previousOwners[i] = owner
            }

            if (owner === pm.NO_OWNERSHIP) {
                cashBit.intendedPosition.x = cashBit.slot.position.x
                cashBit.intendedPosition.y = cashBit.slot.position.y
            }
            else if (owner === socket.playerId) {
                cashBit.intendedPosition.x = tail.x + cashBit.scale.x / 2.
                cashBit.intendedPosition.y = tail.y

                tail.x += cashBit.scale.x
            }
            else {
                cashBit.intendedPosition.x = cashBit.slot.position.x
                cashBit.intendedPosition.y = EVERYONE_ELSE_VERTICAL_POSITION
            }

            cashBit.visible = !(owner === pm.NO_OWNERSHIP && cashBit.associatedPlayer === pm.NO_OWNERSHIP)
        })
    })
}