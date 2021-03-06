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

function testIt() {
    let timeGoing = 0.
    updateFunctions.push(()=>{
        timeGoing += frameDelta
        if(timeGoing < 21.) {
            suspects[0].boardFrame.onClick()
            suspects[1].boardFrame.onClick()
        }
    })
}

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

        const highlightOutlineSize = cashHeight * 2.
        const staticCashHighlightMat = new THREE.MeshBasicMaterial({ color: 0x000000})
        staticCashHighlightedness = 0.
        const staticCashHighlight = Rectangle({
            mat: staticCashHighlightMat,
            x: 0.,
            y: camera.getBottom() + .5,
            z: -4.,
            getScale: (target) =>{
                target.x = getTotalCash() * cashWidth + 2. * highlightOutlineSize
                target.y = cashHeight + 2. * highlightOutlineSize
            },
        })

        // let cashMarkers = new THREE.Line(new )

        staticCash = Rectangle({
            mat: cashMat,
            w: 20., //stand-in
            frameZ: -4.,
            haveIntendedPosition:true,
            y: camera.getBottom() + .5,
            x: 0.,
            z: OVERLAY_Z + 1.
        })
        staticCash.actualValueIncludingTbs = 20. //stand-in
        staticCash.tail = new THREE.Vector3()
        let reverberation = 0.
        let reverberationDuration = 2.9
        socket.on("insufficient funds", () => {
            reverberation = 1.
            staticCashHighlightedness = 1.
        })
        updateFunctions.push(()=>{
            staticCashHighlightedness = Math.max(staticCashHighlightedness - frameDelta * 2.,0.)
            staticCashHighlightMat.color.setRGB(staticCashHighlightedness, staticCashHighlightedness, staticCashHighlightedness)

            staticCash.getEdgeCenter("r", staticCash.tail)

            staticCash.scale.x = staticCash.actualValueIncludingTbs * cashWidth
            transformedBets.forEach((tb) => {
                if (tb.visible)
                    staticCash.scale.x -= cashWidth
            })

            staticCash.intendedPosition.y = camera.getBottom() + dashboardGap / 2.

            reverberation = Math.max(0., reverberation - frameDelta / reverberationDuration)
            staticCashHighlight.position.y = staticCash.position.y +
                Math.pow(Math.max(reverberation, 0.), 8.) * Math.sin(frameCount * .4) * 1.4

            let totalCashWidth = getTotalCash() * cashWidth
            let totalCashFarRightEnd = totalCashWidth / 2.
            let looseCashWidth = pm.getLooseCash(socket.playerId, suspects) * cashWidth
            staticCash.intendedPosition.x = totalCashFarRightEnd - looseCashWidth - staticCash.scale.x / 2.

            staticCash.scale.y = cashHeight
        })

        var transformedBetsFreezeTime = 0.
        var transformedBets = Array(pm.betsPerSuspect)
        tbsMat = new THREE.MeshBasicMaterial({color: cashMat.color})
        Rectangle({mat:tbsMat,y:100.}) //no idea why you need this but the tbs are transparent if it's not there!
        tbsMat.colorToFlash = new THREE.Color(0.,0.,0.)
        for(let i = 0; i < pm.betsPerSuspect; ++i) {
            let tb = Rectangle({
                mat: tbsMat,
                w: cashWidth,
                haveFrame: true,
                frameZ: -4.,
                haveIntendedPosition: true,
                visible: false
            })
            transformedBets[i] = tb
        }
        updateFunctions.push(()=>{
            transformedBetsFreezeTime -= frameDelta

            if (transformedBetsFreezeTime <= 0.) {
                tbsMat.color.copy(cashMat.color)
            }
            else
                tbsMat.color.copy((frameCount % 30) < 15 ? cashMat.color : tbsMat.colorToFlash)

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

    let buySign = temporarilyVisibleWarningSign(["tap to", "buy bets"])
    let sellSign = temporarilyVisibleWarningSign(["tap to", "sell bets"])
    buySign.scale.multiplyScalar(.5)
    sellSign.scale.multiplyScalar(.5)
    let hadASuspectAtSomePoint = false

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
        frst.intendedPosition.x = camera.getLeft() + frst.scale.x / 2. + .5
        last.intendedPosition.x = camera.getRight() - last.scale.x / 2. - .5

        dashboard.forEach((btn) => {
            btn.intendedPosition.y = camera.getBottom() + dashboardGap / 2.
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

        staticCash.actualValueIncludingTbs = msg.staticCashes[socket.playerId]

        if (msg.suspectConfirmationAddOn !== null) {
            let suspect = suspects[msg.suspectConfirmationAddOn.index]

            let numOwned = msg.suspectConfirmationAddOn.numOwneds[socket.playerId]
            transformedBetsFreezeTime = 1.6
            tbsMat.needsUpdate = true
            tbsMat.colorToFlash.copy(suspect.color)
            tbsMat.needsUpdate = true

            for (let i = 0; i < numOwned; ++i) {
                transformedBets[i].position.x = suspect.handFrame.position.x
                transformedBets[i].position.y = suspect.handFrame.position.y + getSlotY(i)
                transformedBets[i].intendedPosition.x = transformedBets[i].position.x
                transformedBets[i].intendedPosition.y = transformedBets[i].position.y
                transformedBets[i].visible = true
            }
            for(let i = numOwned; i < pm.betsPerSuspect; ++i) {
                transformedBets[i].visible = false
            }

            suspectConfirmationWaitingSign.visible = false
            
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
            
            if (suspect.onBoard && !hadASuspectAtSomePoint) {
                hadASuspectAtSomePoint = true
                let countdown = 2.
                updateFunctions.push(() => {
                    if(countdown > 0. && countdown - frameDelta <= 0.) {
                        buySign.timeVisible = 3.
                        sellSign.timeVisible = 3.
                    }

                    countdown -= frameDelta

                    suspect.boardFrame.getEdgeCenter("r",buySign.position)
                    buySign.position.x += buySign.scale.x / 2.
                    suspect.handFrame.getEdgeCenter("r",sellSign.position)
                    sellSign.position.x += sellSign.scale.x / 2.
                })
            }

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

        // log(pm.getLooseCash(socket.playerId,suspects) + staticCash.actualValueIncludingTbs)
    })

    initSuspects()
    await initCamera()
}