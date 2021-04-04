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


    Judgement mode
		Not centered
		Just cover the market half, your bets are visible below
		Your bets (not others') are visible in the background
		They zoom into place. Your cash too
		When you change which suspects are confirmed, the scaling takes a little time to respond
		Better arrow
 */

function initJudgement() {

    let col = 0x505050

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
        judgementMode = true
        waitingMessage.visible = false
    })

    const staticCashesValues = {}
    socket.on("game update", (msg) => {
        Object.keys(msg.staticCashes).forEach((playerId,i) => {
            staticCashesValues[playerId] = msg.staticCashes[playerId]
        })
    })

    // new THREE.TextureLoader().load("assets/judgement.png",(map)=>{
    //     let mat = new THREE.MeshBasicMaterial({map,color:bgColor})
    // })

    let judgementButton = Rectangle({
        onClick: () => {
            socket.emit("judgement mode requested")

            waitingMessage.visible = true
            waitingMessage.lastClicked = frameCount
        },
        label: "Judgement!",
        haveFrame: true,
        h: 1.,
        getScaleFromLabel: true,
        z: 0.,
        haveFrame: true,
        haveIntendedPosition: true
    })
    dashboard.push(judgementButton)



    


    const hider = Rectangle({
        col,
        w: 4., h: 4.,
        z: OVERLAY_Z,
        haveFrame: true,
        visible: false,
        getScale: (target) => {
            suspects[0].frame.getEdgeCenter("l",target)
            target.x *= 2.

            target.y = suspects[0].boardFrame.scale.y
        },
        getPosition: (target) =>{
            target.y = suspects[0].boardFrame.position.y
            target.x = 0.
        }
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

    let dividingLine = 0.
    updateFunctions.push(()=>{
        dividingLine = camera.getRight() - 8.
    })

    const youSign = Rectangle({
        label: "← You",
        h: 1.5,
        getScaleFromLabel: true,
        z: OVERLAY_Z + 2.,
        getPosition: (target) => {
            if (finalStaticCashes[socket.playerId] === undefined) {
                target.x = 0.
                target.y = 0.
            }
            else {
                target.y = finalStaticCashes[socket.playerId].position.y
                target.x = dividingLine + youSign.scale.x / 2.
            }
        }
    })

    updateFunctions.push( () => {
        // closeButton.visible = judgementMode
        hider.visible = judgementMode
        youSign.visible = judgementMode

        let gameHasBeenPlayedABit = false
        suspects.forEach((sus)=>{
            if( pm.getNumBoardBets(sus) < pm.betsPerSuspect )
                gameHasBeenPlayedABit = true
        })

        judgementButton.visible = !judgementMode && !waitingMessage.visible && gameHasBeenPlayedABit
    })

    const finalStaticCashes = {}
    finalStaticCashes[socket.playerId] = staticCash
    const finalAmounts = {}
    updateFunctions.push(() => {
        if (!judgementMode)
            return

        const playerIds = Object.keys(staticCashesValues)

        let max = -Infinity
        let min = Infinity

        let topPosition = hider.getEdgeCenter("t", v0).y - 3.
        let bottomPosition = hider.getEdgeCenter("b", v0).y + 2.

        playerIds.forEach((playerId) => {
            finalAmounts[playerId] = staticCashesValues[playerId]
            suspects.forEach((sus) => {
                if (!sus.confirmed)
                    return
                sus.betOwners.forEach((betOwner) => {
                    if (betOwner === playerId)
                        finalAmounts[playerId] += 1.
                })
            })

            max = Math.max(max, finalAmounts[playerId])
            min = Math.min(min, finalAmounts[playerId])

            if (playerId !== socket.playerId && finalStaticCashes[playerId] === undefined) {
                finalStaticCashes[playerId] = Rectangle({
                    mat: staticCash.mesh.material,
                    h: cashHeight,
                    w: 999999999.,
                    z: OVERLAY_Z + 1.,
                    haveIntendedPosition: true,
                    x: 0.
                })
            }

            finalStaticCashes[playerId].scale.x = cashWidth * staticCashesValues[playerId]
        })

        playerIds.forEach((playerId) => {
            let ranking = (finalAmounts[playerId] - min) / (max - min)
            finalStaticCashes[playerId].intendedPosition.y = bottomPosition + (topPosition - bottomPosition) * ranking

            finalStaticCashes[playerId].intendedPosition.x = dividingLine - finalStaticCashes[playerId].scale.x / 2.

            let numBetsSoFar = 0.
            suspects.forEach((suspect) => {
                if (!suspect.confirmed)
                    return

                //move this to bets.js
                // suspect.bets.forEach((bet) => {
                //     if (bet.owner === playerId) {
                //         log(bet.position.x)

                //         finalStaticCashes[playerId].getEdgeCenter("l", bet.intendedPosition)
                //         bet.intendedPosition.x -= bet.scale.x / 2.
                //         bet.intendedPosition.x -= numBetsSoFar * cashWidth

                //         bet.position.z = OVERLAY_Z + 1.

                //         log(bet.intendedPosition.x)

                //         log(bet.position.x)

                //         ++numBetsSoFar
                //     }
                // })
            })
        })
    })
}

//need confirmation boxes to be bigger