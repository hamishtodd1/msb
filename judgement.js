/*
    You press the button
    It appears for everyone I guess

    We see all the players' piles

    a checkbox beneath each pic
    Maybe everyone has their rectangles stuck in a line
    Maybe they tween between them
    Scaled down? Squashed, area preservingly?
    Their colors go duller
    Well, you only need to see the important ones

    Winner indicator: flashing frame
 */

function initJudgement() {

    let col = 0x505050

    const rowHeight = 2.

    let waitingMessage = Rectangle({
        h: 16., w: 16.,
        label: ["Waiting for other", "players to press", "judgement button..."],
        col,
        visible: false
    })
    waitingMessage.lastClicked = 0
    updateFunctions.push(()=>{
        if (mouse.clicking && !mouse.oldClicking && 
            waitingMessage.visible === true && waitingMessage.lastClicked < frameCount - 5 ) {
            waitingMessage.visible = false
            socket.emit("judgement mode request cancelled")
            log("ugh",waitingMessage.lastClicked,frameCount)
        }
    })

    socket.on("judgement mode confirmed",()=>{
        playSound("judgement")
        judgementMode = true
        waitingMessage.visible = false
    })

    const staticCashesValues = {}
    socket.on("game update", (msg) => {
        Object.keys(msg.staticCashes).forEach((id,i) => {
            staticCashesValues[id] = msg.staticCashes[id]
        })
    })

    new THREE.TextureLoader().load("assets/judgement.png",(map)=>{
        let mat = new THREE.MeshBasicMaterial({map,color:bgColor})

        let jbDimension = 3.
        let judgementButton = Rectangle({
            onClick: () => {
                socket.emit("judgement mode requested")

                waitingMessage.visible = true
                waitingMessage.lastClicked = frameCount
            },
            mat,
            z: 0.,
            haveFrame: true,
            w: jbDimension, h: jbDimension,
            getPosition: (target) => {
                target.x = camera.getRight() - jbDimension / 2. - panelPaddingMr.offset.x
                target.y = camera.getTop() - jbDimension / 2. - panelPaddingMr.offset.x
            }
        })


        


        const hider = Rectangle({
            col,
            w: 4., h: 4.,
            z: OVERLAY_Z,
            haveFrame: true,
            visible: false,
            getScale: (target) => {
                let sus = suspects.find((s) => s !== undefined )
                if (sus === undefined)
                    return

                target.x = camera.getRight() * 2. - panelPaddingMr.offset.x * 2.
                target.y = sus.frame.scale.y - sus.frame.scale.x
            },
            getPosition: (target) =>{
                let sus = suspects.find((s)=> s !== undefined)
                if(sus === undefined)
                    return

                sus.frame.getEdgeCenter("b",target)
                target.y += hider.scale.y / 2.
                target.x = 0.
            }
            // suspects[0].frame.getEdgeCenter("t", target)
            // target.y -= portraitHeight / 2. + suspectSlipPadding
        })

        // let closeButton = null
        // let cbDimension = 2.
        // new THREE.TextureLoader().load("assets/close.png", (map) => {
        //     closeButton = Rectangle({
        //         w: cbDimension, h: cbDimension, z: OVERLAY_Z + 1.,
        //         map, visible: false,
        //         getPosition: (target) => {
        //             hider.getCorner("tr", target)
        //             target.x -= cbDimension / 2.
        //             target.y -= cbDimension / 2.
        //         },
        //         onClick: () => {
        //             judgementMode = false
        //         }
        //     })
        // })

        const youSign = Rectangle({
            label: "← You",
            h: rowHeight,
            getScaleFromLabel: true,
            z: OVERLAY_Z + 2.,
            getPosition: (target) => {
                if (finalCashes[socket.playerId] === undefined) {
                    target.x = 0.
                    target.y = 0.
                }
                else {
                    hider.getEdgeCenter("r", target)
                    target.x -= youSign.scale.x / 2. + .5

                    target.y = finalCashes[socket.playerId].position.y
                }
            }
        })

        updateFunctions.push( () => {
            // closeButton.visible = judgementMode
            hider.visible = judgementMode
            youSign.visible = judgementMode

            let gameHasActuallyBeenPlayedABit = false
            suspects.forEach((sus)=>{
                if( pm.getNumBoardBets(sus) < pm.betsPerSuspect )
                    gameHasActuallyBeenPlayedABit = true
            })

            judgementButton.visible = !judgementMode && !waitingMessage.visible && gameHasActuallyBeenPlayedABit
        })

        const finalCashes = {}
        updateFunctions.push(() => {
            if (!judgementMode)
                return

            const ids = Object.keys(staticCashesValues)

            Object.keys(staticCashesValues).forEach((id) => {
                if (finalCashes[id] === undefined) {
                    finalCashes[id] = Rectangle({
                        mat: cashMat,
                        h: betHeight,
                        w: 999999999.,
                        z: OVERLAY_Z + 1.,
                        haveIntendedPosition: true,
                        x: 0.
                    })
                }
            })

            let max = -Infinity
            let min = Infinity
            ids.forEach((id, i) => {
                finalCashes[id].scale.x = 0.
                finalCashes[id].scale.x += cashWidth * staticCashesValues[id]

                suspects.forEach((sus) => {
                    if (!sus.confirmed)
                        return
                    sus.bets.forEach((bet) => {
                        if (bet.owner === id)
                            finalCashes[id].scale.x += cashWidth
                    })
                })

                max = Math.max(max, finalCashes[id].scale.x)
                min = Math.min(min, finalCashes[id].scale.x)
            })

            let top = hider.getEdgeCenter("t", v0).y - 3.
            let bottom = hider.getEdgeCenter("b", v0).y + 2.
            ids.forEach((id) => {
                let ranking = (finalCashes[id].scale.x - min) / (max - min)
                finalCashes[id].intendedPosition.y = bottom + (top - bottom) * ranking
            })
        })
    })
}