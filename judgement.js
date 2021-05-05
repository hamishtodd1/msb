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

async function initJudgement(gameId) {
    let showingScoresMode = false

    let premadeStaticCashes = []
    let lowestUnusedPremadeStaticCash = 0
    for (let i = 0; i < 20; ++i) {
        premadeStaticCashes[i] = Rectangle({
            mat: cashMat,
            w: 999999999.,
            haveIntendedPosition: true,
            haveFrame: true,
            frameZ: OVERLAY_Z + .5,
            z: OVERLAY_Z + 1.,
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

    let titleHeight = 4.
    let title = Rectangle({
        h: titleHeight, getScaleFromLabel: true,
        z: OVERLAY_Z + .5,
        label: ["Player Ranking", "(don't forget to confirm bets on","guilty suspects if you're finishing!)"],
        col: bgColor,
        getPosition: (target) => {
            target.x = 0.
            target.y = hider.scale.y / 2. - title.scale.y / 2.
        },
        visible: false
    })

    const staticCashesValues = {}
    socket.on("game update", (msg) => {
        Object.keys(msg.staticCashes).forEach((playerId,i) => {
            staticCashesValues[playerId] = msg.staticCashes[playerId]
        })
    })

    let endGameButton = Rectangle({
        onClick: () => {
            showingScoresMode = true
        },
        label: "View ranking",
        haveFrame: true,
        h: 1.,
        getScaleFromLabel: true,
        z: OVERLAY_Z + 1.5,
        haveFrame: true,
        haveIntendedPosition: true
    })
    dashboard.push(endGameButton)

    const hider = Rectangle({
        col: 0x505050,
        w: 4., h: 4.,
        z: OVERLAY_Z,
        haveFrame: true,
        visible: false,
        getScale: (target) => {
            target.x = camera.getRight() * 2. - .5
            target.y = camera.getTop() * 2. - .5
        }
    })

    let cbDimension = 2.
    let cbMat = new THREE.MeshBasicMaterial({ color: bgColor })
    new THREE.TextureLoader().load("assets/close.png", (map) => {
        cbMat.map = map
        cbMat.needsUpdate = true
    })
    const closeButton = Rectangle({
        w: cbDimension, h: cbDimension, z: OVERLAY_Z + 1.,
        mat: cbMat,visible: false,
        getPosition: (target) => {
            hider.getCorner("tr", target)
            target.x -= cbDimension / 2.
            target.y -= cbDimension / 2.
        },
        onClick: () => {
            showingScoresMode = false
        }
    })

    let dividingLine = 0.
    updateFunctions.push(() => {
        dividingLine = camera.getRight() - 6.
    })

    let arrowMat = new THREE.MeshBasicMaterial({ color: bgColor })
    new THREE.TextureLoader().load("assets/arrow.png", (map) => {
        arrowMat.map = map
        arrowMat.needsUpdate = true
    })
    const arrow = Rectangle({
        w: 1.5, h: 1.5, z: OVERLAY_Z + 2.,
        mat: arrowMat,
        getPosition: (target) => {
            if (finalStaticCashes[socket.playerId] === undefined) {
                target.x = 0.
                target.y = 0.
            }
            else {
                target.y = finalStaticCashes[socket.playerId].position.y
                target.x = dividingLine + arrow.scale.x / 2. + .1
            }
        }
    })

    const youSign = Rectangle({
        label: "You",
        h: 1.5,
        getScaleFromLabel: true,
        z: OVERLAY_Z + 2.,
        getPosition: (target) => {
            arrow.getEdgeCenter("r", target)
            target.x += arrow.scale.x / 2.
        }
    })

    const finalStaticCashes = {}
    updateFunctions.push(() => {
        closeButton.visible = showingScoresMode
        hider.visible = showingScoresMode
        youSign.visible = showingScoresMode
        arrow.visible = showingScoresMode
        title.visible = showingScoresMode
        
        endGameButton.visible = !showingScoresMode
        idBox.visible = !showingScoresMode
        staticCash.visible = !showingScoresMode
        
        const playerIds = Object.keys(staticCashesValues)
        playerIds.forEach((playerId) => {
            if (finalStaticCashes[playerId] !== undefined)
                finalStaticCashes[playerId].visible = showingScoresMode
        })
        
        if (!showingScoresMode)
            return

        let max = -Infinity
        let min = Infinity

        let topPosition = hider.getEdgeCenter("t", v0).y - titleHeight - youSign.scale.y / 2. - 1.5
        let bottomPosition = hider.getEdgeCenter("b", v0).y + 1.5

        const finalAmounts = {}

        playerIds.forEach((playerId) => {
            finalAmounts[playerId] = staticCashesValues[playerId] + pm.getLooseCash(playerId,suspects)

            max = Math.max(max, finalAmounts[playerId])
            min = Math.min(min, finalAmounts[playerId])

            if (finalStaticCashes[playerId] === undefined) {
                finalStaticCashes[playerId] = premadeStaticCashes[lowestUnusedPremadeStaticCash]
                ++lowestUnusedPremadeStaticCash
            }

            finalStaticCashes[playerId].scale.x = cashWidth * staticCashesValues[playerId]
        })

        playerIds.forEach((playerId) => {
            let range = (max - min) === 0. ? 1. : (max - min)
            let ranking = (finalAmounts[playerId] - min) / range
            finalStaticCashes[playerId].intendedPosition.y = bottomPosition + (topPosition - bottomPosition) * ranking

            finalStaticCashes[playerId].intendedPosition.x = dividingLine - finalStaticCashes[playerId].scale.x / 2.

            finalStaticCashes[playerId].scale.y = cashHeight
        })

        delete finalAmounts
    })
}