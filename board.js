// function InstancedRect(num, params) {
//     if (params === undefined)
//         params = {}

//     let instancedMesh = new THREE.InstancedMesh(unitSquareGeo, new THREE.MeshBasicMaterial({ 
//         color: 0x000000
//     }), num)
//     scene.add(instancedMesh)

//     instancedMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

//     return instancedMesh
// }

async function initBoard() {
    //globals
    {
        cashWidth = 1.8
        cashHeight = 3.5 / pm.betsPerSuspect
        slotFrameThickness = cashHeight / 2.

        // var actualCashColor = new THREE.Color()
        cashMat = new THREE.MeshBasicMaterial()

        EVERYONE_ELSE_VERTICAL_POSITION = camera.getTop() * 1.3
        updateFunctions.push(() => {
            EVERYONE_ELSE_VERTICAL_POSITION = camera.getTop() * 1.15
        })

        getTotalCash = () => {
            let totalCash = staticCash.actualValueIncludingTbs
            totalCash += pm.getLooseCash(socket.playerId,suspects)

            return totalCash
        }

        staticCash = Rectangle({
            mat: cashMat,
            w: 20., //stand-in
            haveIntendedPosition:true,
            y: camera.getBottom() + .5,
            x: 0.,
            z: OVERLAY_Z + 1.
        })
        staticCash.actualValueIncludingTbs = 20. //stand-in
        updateFunctions.push(()=>{
            if( !showingScoresMode ) {
                staticCash.intendedPosition.y = camera.getBottom() + dashboardGap / 2.
                let totalCashWidth = getTotalCash() * cashWidth
                let looseCashWidth = pm.getLooseCash(socket.playerId, suspects) * cashWidth
                let totalCashFarRightEnd = totalCashWidth / 2.
                staticCash.intendedPosition.x = totalCashFarRightEnd - looseCashWidth - staticCash.scale.x / 2.
            }

            staticCash.scale.y = cashHeight
        })

        var transformedBetsFreezeTime = 0.
        var transformedBets = Array(pm.betsPerSuspect)
        for(let i = 0; i < pm.betsPerSuspect; ++i) {
            let tb = Rectangle({
                mat: cashMat,
                w: cashWidth,
                haveIntendedPosition: true,
            })
            tb.visible = false
            transformedBets[i] = tb
        }
        updateFunctions.push(()=>{
            transformedBetsFreezeTime -= frameDelta
            transformedBets.forEach((tb,i)=>{
                if (transformedBetsFreezeTime <= 0.) {
                    tb.intendedPosition.y = staticCash.intendedPosition.y
                    tb.intendedPosition.x = staticCash.intendedPosition.x - staticCash.scale.x / 2. - cashWidth * (i + .5)
                }

                tb.scale.y = cashHeight
            })
        })
    }

    getSlotY = function(index) {
        return (cashHeight + slotFrameThickness) * (index - (pm.betsPerSuspect - 1.) / 2.)
    }

    //TODO rename this, it's not that hard
    let gapBetweenPanels = .5
    suspectPanelDimensions = { 
        x: 0.,
        y: 20. - dashboardGap - .5
    }

    let minScreenWidth = camera.getTop() * 2.
    suspectPanelDimensions.minX = (minScreenWidth - gapBetweenPanels) / pm.maxSuspects - gapBetweenPanels
    function updateSuspectPanelDimensions() {
        let screenWidth = camera.getRight() * 2.
        suspectPanelDimensions.x = (screenWidth - gapBetweenPanels) / pm.maxSuspects - gapBetweenPanels
    }
    
    updateFunctions.push(updateSuspectPanelDimensions)

    updateFunctions.push(() => {
        let frst = dashboard[0]
        let last = dashboard[dashboard.length - 1]
        frst.position.x = camera.getLeft() + frst.scale.x / 2. + .5
        last.position.x = camera.getRight() - last.scale.x / 2. - .5

        dashboard.forEach((btn) => {
            btn.position.y = camera.getBottom() + dashboardGap / 2.
        })

        //maybe derive cashwidth from how much space there is between these two?
    })

    getPanelPositionX = function (suspectIndex) {
        let indexConsideringSomeMayHaveBeenDeleted = 0
        for(let i = 0; i < suspectIndex; ++i) {
            if (suspects[i].onBoard)
                ++indexConsideringSomeMayHaveBeenDeleted
        }
        //quite possibly
        return camera.getLeft() +
            gapBetweenPanels +
            suspectPanelDimensions.x / 2. +
            indexConsideringSomeMayHaveBeenDeleted * (suspectPanelDimensions.x + gapBetweenPanels)
    }

    const discreteViridis = [
        new THREE.Color(68. / 256., 0., 84. / 256.),
        new THREE.Color(55. / 256., 88. / 256., 141. / 256.),
        new THREE.Color(112. / 256., 208. / 256., 87. / 256.),
        new THREE.Color(255. / 256., 233. / 256., 36. / 256.)
    ]
    getViridis = (suspectIndex, target) => {
        if(suspectIndex >= pm.maxSuspects ) //it's the money
            target.copy(discreteViridis[2])
        else if (suspectIndex === pm.maxSuspects-1)
            target.copy(discreteViridis[3])
        else {
            let t = suspectIndex / pm.maxSuspects

            let a = t < .5 ? discreteViridis[0] : discreteViridis[1]
            let b = t < .5 ? discreteViridis[1] : discreteViridis[2]

            target.copy(a)
            target.lerpHSL(b, (t < .5 ? t : t - .5) * 2.)
        }
    }
    getViridis(pm.maxSuspects + 1, cashMat.color)

    socket.on("game update", (msg) => {

        transformedBets.forEach((tb, i) => { tb.visible = false })

        if(msg.staticCashes[socket.playerId] !== staticCash.actualValueIncludingTbs) {
            staticCash.actualValueIncludingTbs = msg.staticCashes[socket.playerId]
            staticCash.scale.x = staticCash.actualValueIncludingTbs * cashWidth
        }

        if (msg.suspectConfirmationAddOn !== null) {
            let numOwned = msg.suspectConfirmationAddOn.numOwneds[socket.playerId]
            staticCash.scale.x = (staticCash.actualValueIncludingTbs-numOwned) * cashWidth
            transformedBetsFreezeTime = .6
            for (let i = 0; i < numOwned; ++i) {
                transformedBets[i].position.x = suspects[msg.suspectConfirmationAddOn.index].handFrame.position.x
                transformedBets[i].position.y = suspects[msg.suspectConfirmationAddOn.index].handFrame.position.y + getSlotY(i)
                transformedBets[i].intendedPosition.x = transformedBets[i].position.x
                transformedBets[i].intendedPosition.y = transformedBets[i].position.y
                transformedBets[i].visible = true
            }
            
            {
                let sound = sounds["gotMoney"]
                sound.currentTime = 0.
                let soundPromise = sound.play()
                soundPromise.then(function () { }).catch(function () { })
            }
        }

        suspects.forEach((suspect, i) => {
            msg.suspects[i].betOwners.forEach((betOwner, j) => {
                suspect.betOwners[j] = betOwner
            })

            if (!suspect.onBoard && msg.suspects[i].onBoard && msg.suspectConfirmationAddOn === null) {
                let sound = sounds["newSuspect"]
                sound.currentTime = 0.
                let soundPromise = sound.play()
                soundPromise.then(function () { }).catch(function () { })
            }
            suspect.onBoard = msg.suspects[i].onBoard

            //can just have "waiting for another player to confirm suspect"

            //no need for everyone to judge at the same time, can just have a "view ranking" thing
        })

        let changedHandses = Array(pm.betsPerSuspect)
        suspects.forEach((suspect, i) => {
            suspect.cashBits.forEach((cashBit, j) => {
                let newAp = msg.suspects[i].cashBits[j].associatedPlayer
                changedHandses[j] = newAp !== cashBit.associatedPlayer
                cashBit.associatedPlayer = newAp
            })

            suspect.cashBits.forEach((cashBit, j) => {
                v0.set(
                    suspect.frame.position.x,
                    EVERYONE_ELSE_VERTICAL_POSITION,
                    cashBit.position.z)

                if (changedHandses[j]) {
                    let ownership = pm.getCashBitOwnership(suspect, cashBit)

                    let startP = null
                    if(ownership === pm.NO_OWNERSHIP) {
                        if(cashBit.associatedPlayer === socket.playerId)
                            startP = staticCash.position
                        else if(cashBit.associatedPlayer !== pm.NO_OWNERSHIP)
                            startP = v0
                        //and if it's NO_OWNERSHIP, well HOPEFULLY that means we've just not started
                    }
                    else
                        startP = cashBit.slot.position

                    if(startP !== null) {
                        cashBit.position.x = startP.x
                        cashBit.position.y = startP.y
                    }
                }
            })
        })
    })

    initSuspects()
    await initCamera()
}