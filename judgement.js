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

function initSuspectConfirmationWaitingSign() {
    suspectConfirmationWaitingSign = Rectangle({
        h: 8., getScaleFromLabel: true,
        haveFrame: true,
        label: ["Waiting for another", "player to press", "confirmation button..."],
        col: bgColor
    })
    suspectConfirmationWaitingSign.visible = false
    suspectConfirmationWaitingSign.frameCountAtLastConfirmationRequest = 0

    onMouseClickFunctions.push(() => {
        let needToDeconfirm = 
            suspectConfirmationWaitingSign.visible === true && 
            suspectConfirmationWaitingSign.frameCountAtLastConfirmationRequest < frameCount + 1
        
        if (needToDeconfirm) {
            suspectConfirmationWaitingSign.visible = false
            socket.emit("confirmation cancellation",{})
        }
    })
}

function bestowJudgementAndCross(suspect, judgeMats, crossMats,suspectSlipPadding) {
    let judge = Rectangle({
        mat: new THREE.MeshBasicMaterial({ transparent: true }),
        getScale: (target) => {
            target.x = getLittleButtonHeight()
            target.y = getLittleButtonHeight()
        },
        z: suspect.portrait.position.z,
        getPosition: (target) => {
            suspect.frame.getEdgeCenter("t", target)
            target.y -= suspectSlipPadding + judge.scale.y / 2.

            target.x = suspect.portrait.position.x - suspect.portrait.scale.x / 4. - suspectSlipPadding / 4.
        },
        haveFrame: true,
        onClick: () => {
            // if (judge.material.opacity === 1.)
            socket.emit("confirmation", { index: suspects.indexOf(suspect)})

            suspectConfirmationWaitingSign.visible = true
            suspectConfirmationWaitingSign.frameCountAtLastConfirmationRequest = frameCount
        },
    })
    judgeMats.push(judge.material)

    let cross = Rectangle({
        mat: new THREE.MeshBasicMaterial({ transparent: true }),
        getScale: (target) => {
            target.x = getLittleButtonHeight()
            target.y = getLittleButtonHeight()
        },
        z: suspect.portrait.position.z,
        getPosition: (target) => {
            suspect.frame.getEdgeCenter("t", target)
            target.y -= suspectSlipPadding + cross.scale.y / 2.

            target.x = suspect.portrait.position.x + suspect.portrait.scale.x / 4. + suspectSlipPadding / 4.
        },
        haveFrame: true,
        onClick: () => {
            // if (cross.material.opacity === 1.)
            socket.emit("delete", { index: suspects.indexOf(suspect) })
        },
    })
    crossMats.push(cross.material)

    updateFunctions.push(() => {
        let someoneHasABet = pm.getNumBoardBets(suspect) < pm.betsPerSuspect

        // cross.material.opacity = someoneHasABet ? .1 : 1.
        // judge.material.opacity = someoneHasABet ? 1. : .1
    })
}

function initJudgement(gameId) {

    let premadeStaticCashes = []
    let lowestUnusedPremadeStaticCash = 0
    for (let i = 0; i < 20; ++i) {
        premadeStaticCashes[i] = Rectangle({
            mat: cashMat,
            w: 999999999.,
            z: OVERLAY_Z + 1.,
            haveIntendedPosition: true,
        })
        premadeStaticCashes[i].visible = false
    }

    const idBox = Rectangle({
        label: "Game ID: " + gameId,
        getScaleFromLabel: true,
        haveIntendedPosition: true,
        haveFrame: true,
        z: OVERLAY_Z + 1.5
    })
    dashboard.push(idBox)

    let col = 0x505050

    let waitingMessage = Rectangle({
        h: 8., getScaleFromLabel: true,
        haveFrame: true,
        label: ["Waiting for another", "player to press", "end game button..."],
        col: bgColor,
        visible: false
    })
    waitingMessage.lastClicked = 0
    onMouseClickFunctions.push(()=>{
        if (waitingMessage.visible === true && waitingMessage.lastClicked < frameCount - 5) {
            waitingMessage.visible = false
            socket.emit("judgement mode request cancelled")
        }
    })

    let title = Rectangle({
        h: 2., getScaleFromLabel: true,
        z: OVERLAY_Z + .5,
        haveFrame: true,
        label: ["Final Ranking"],
        col: bgColor,
        getPosition: (target) => {
            target.x = 0.
            target.y = hider.scale.y / 2. - title.scale.y / 2.
        },
        visible: false
    })

    socket.on("judgement mode confirmed",()=>{
        showingScoresMode = true
        staticCash.visible = false
        endGameButton.visible = false
        waitingMessage.visible = false

        idBox.visible = false
    })

    const staticCashesValues = {}
    socket.on("game update", (msg) => {
        Object.keys(msg.staticCashes).forEach((playerId,i) => {
            staticCashesValues[playerId] = msg.staticCashes[playerId]
        })
    })

    const warningSign = temporarilyVisibleWarningSign(["Cannot end game until","all suspects have been","deleted or confirmed!"])
    let endGameButton = Rectangle({
        onClick: () => {
            let suspectOnBoard = false
            suspects.forEach(sus=>{if(sus.onBoard)suspectOnBoard = true})
            if(!suspectOnBoard) {
                socket.emit("judgement mode requested")

                waitingMessage.visible = true
                waitingMessage.lastClicked = frameCount
            }
            else
                warningSign.timeVisible = 2.5
        },
        label: "End game!",
        haveFrame: true,
        h: 1.,
        getScaleFromLabel: true,
        z: OVERLAY_Z + 1.5,
        haveFrame: true,
        haveIntendedPosition: true
    })
    dashboard.push(endGameButton)


    const hider = Rectangle({
        col,
        w: 4., h: 4.,
        z: OVERLAY_Z,
        haveFrame: true,
        visible: false,
        getScale: (target) => {
            target.x = camera.getRight() * 2. - .5
            target.y = camera.getTop() * 2. - .5
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
    //             showingScoresMode = false
    //         }
    //     })
    // })

    let dividingLine = 0.
    updateFunctions.push(()=>{
        dividingLine = camera.getRight() - 6.
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
        // closeButton.visible = showingScoresMode
        hider.visible = showingScoresMode
        youSign.visible = showingScoresMode
        title.visible = showingScoresMode
    })

    finalStaticCashes = {}
    const finalAmounts = {}
    updateFunctions.push(() => {
        if (!showingScoresMode)
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

            if (finalStaticCashes[playerId] === undefined) {
                finalStaticCashes[playerId] = premadeStaticCashes[lowestUnusedPremadeStaticCash]
                finalStaticCashes[playerId].visible = true
                ++lowestUnusedPremadeStaticCash
            }

            finalStaticCashes[playerId].scale.x = cashWidth * staticCashesValues[playerId]
        })

        playerIds.forEach((playerId) => {
            let ranking = (finalAmounts[playerId] - min) / (max - min)
            finalStaticCashes[playerId].intendedPosition.y = bottomPosition + (topPosition - bottomPosition) * ranking

            finalStaticCashes[playerId].intendedPosition.x = dividingLine - finalStaticCashes[playerId].scale.x / 2.

            finalStaticCashes[playerId].scale.y = cashHeight
        })
    })
}

//need confirmation boxes to be bigger