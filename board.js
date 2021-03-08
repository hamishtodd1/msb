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

function initBoard() {
    //globals
    {
        const slotMr = MeasuringRect("bet slot", false)
        cashWidth = 2.2
        betHeight = Math.abs(slotMr.offset.y)
        slotFrameThickness = .04

        cashMat = new THREE.MeshBasicMaterial()

        EVERYONE_ELSE_VERTICAL_POSITION = camera.top * 1.3
        updateFunctions.push(() => {
            EVERYONE_ELSE_VERTICAL_POSITION = camera.top * 1.3
        })

        getTotalCash = () => {
            return staticCash.scale.x / cashWidth + pm.getLooseCash(socket.id,suspects)
        }

        staticCash = Rectangle({
            mat: cashMat,
            h: betHeight,
            w: 999999999.,
            x: 0.,
            y: camera.bottom + .5
        })
    }

    getSlotY = function(index) {
        return (betHeight + slotFrameThickness) * (index - (pm.betsPerSuspect - 1.) / 2.)
    }

    suspectPanelDimensionsMr = MeasuringRect("suspectPanelDimensions")
    panelPaddingMr = MeasuringRect("panelPadding", true)
    getPanelPositionX = function (suspectIndex) {
        let indexConsideringSomeMayHaveBeenDeleted = 0
        for(let i = 0; i < suspectIndex; ++i) {
            if (suspects[i] !== undefined)
                ++indexConsideringSomeMayHaveBeenDeleted
        }
        //quite possibly
        return camera.left +
            panelPaddingMr.offset.x +
            suspectPanelDimensionsMr.offset.x / 2. +
            indexConsideringSomeMayHaveBeenDeleted * (suspectPanelDimensionsMr.offset.x + panelPaddingMr.offset.x)
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
    getViridis(pm.maxSuspects+1, cashMat.color)

    socket.on("new suspect", Suspect)

    socket.on("unsuccessful buy", () => {
        log("unsuccessful buy!")
        //sfx for someone buying a bet is suction
    })
    
    socket.on("room update", (msg) => {
        console.assert(msg.suspects.length === suspects.length)

        staticCash.scale.x = msg.staticCash * cashWidth

        suspects.forEach((suspect, i) => {
            suspect.bets.forEach((bet, j) => {
                bet.owner = msg.suspects[i].bets[j].owner
            })
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
                        if(cashBit.associatedPlayer === socket.id)
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
}