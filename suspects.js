/**
 * So the label says what percent return you get
 * It can be off to the side of the things
 */

function initSuspects() {
    let tickMat = new THREE.MeshBasicMaterial()
    new THREE.TextureLoader().load("assets/tick.png", (map) => {
        tickMat.map = map
        tickMat.needsUpdate = true
    })

    let confirmMat = text("Confirm: ",true)
    let deleteMat = text("Delete?", true)

    let judgeMats = []
    let crossMats = []
    new THREE.TextureLoader().load("assets/close.png", (map) => {
        crossMats.forEach((crossMat) => {
            crossMat.color.setHex(bgColor) 
            crossMat.map = map
            crossMat.needsUpdate = true
        })
    })
    new THREE.TextureLoader().load("assets/judgement.png", (map) => {
        judgeMats.forEach((judgeMat) => {
            judgeMat.color.setHex(bgColor)
            judgeMat.map = map
            judgeMat.needsUpdate = true
        })
    })

    const frameMat = new THREE.MeshBasicMaterial({ color: 0x888888 })

    const suspectSlipPadding = .25

    function getPortraitHeight() {
        return suspectPanelDimensions.x - suspectSlipPadding * 2.
    }
    getLittleButtonHeight = () => getPortraitHeight() / 2. - suspectSlipPadding / 2.

    // socket.on("suspect confirmation",(msg)=>{
    //     suspects[msg.index].confirmed = msg.value
    // })

    Suspect = () => {
        let suspect = {}
        suspects.push(suspect)

        suspect.onBoard = false

        suspect.frame = Rectangle({
            // frameOnly: true,
            haveFrame: true,
            mat: frameMat,
            z: -4.99999999,
            frameZ: -4.,
            getScale: (target) => {
                target.x = suspectPanelDimensions.x
                target.y = suspectPanelDimensions.y
            },
            haveIntendedPosition: true
        })
        updateFunctions.push(() => {
            if (!suspect.onBoard)
                suspect.frame.intendedPosition.x = camera.getRight() * 2.
            else
                suspect.frame.intendedPosition.x = getPanelPositionX(suspects.indexOf(suspect))

            suspect.frame.intendedPosition.y = suspectPositionY
        })

        //percentage
        {
            //might be nice to have a little arrow pointing that way

            let percentageDisplay = Rectangle({
                label: "88%",
                col: frameMat.color.getHex(),
                z: -4.9
            })
            percentageDisplay.textMeshes[0].material.setColor("#888888")
            updateFunctions.push(() => {
                if (!suspect.cashBits[0])
                    return

                let numInBoard = pm.getNumBoardBets(suspect)
                let cheapestAvailableBetSlotIndex = pm.betsPerSuspect - numInBoard - 1
                if (cheapestAvailableBetSlotIndex < 0) {
                    percentageDisplay.visible = false
                    return
                }
                percentageDisplay.visible = true


                let cheapestAvailableBetSlot = suspect.cashBits[cheapestAvailableBetSlotIndex].slot

                let price = pm.betPrices[cheapestAvailableBetSlotIndex]
                let percentage = Math.round(price * 100.)
                percentageDisplay.textMeshes[0].material.setText( 
                    (percentage > 9 ? "" : " ")
                    + percentage + "%")

                suspect.boardFrame.getEdgeCenter("l", v0)
                cheapestAvailableBetSlot.getEdgeCenter("l", v1)

                percentageDisplay.textMeshes[0].rotation.z = camera.rotation.z

                //pretty hacky, dunno why you can't just always have this
                // if(frameCount > 4) {
                //     percentageDisplay.scale.x = Math.abs(v0.x - v1.x)
                //     percentageDisplay.scale.y = percentageDisplay.scale.x
                // }
                // percentageDisplay.position.x = v1.x - percentageDisplay.scale.x / 2.
                // percentageDisplay.position.y = cheapestAvailableBetSlot.position.y

                cheapestAvailableBetSlot.getEdgeCenter("r", percentageDisplay.position)
                percentageDisplay.position.x += percentageDisplay.scale.x / 2. + .05
                percentageDisplay.position.y -= .2

                percentageDisplay.scale.x = 1.4
                percentageDisplay.scale.y = 1.4
            })
        }
        
        {
            function getFrameScale(target) {
                let clickableBoxHeight = .5 * (suspectPanelDimensions.y - getPortraitHeight() - suspectSlipPadding * 5. - getLittleButtonHeight())
                target.x = suspectPanelDimensions.x - suspectSlipPadding * 2.
                target.y = clickableBoxHeight

                //yes, it's a bit silly for this to happen a million times per frame, but whatever
                cashHeight = (clickableBoxHeight - .5) / pm.betsPerSuspect / 1.5
                slotFrameThickness = cashHeight / 2.
            }
            let coolDown = 0.
            let coolDownDuration = 1.5
            let coolDownIndicatorMat = new THREE.MeshBasicMaterial({
                color:0xFFFFFF,
                transparent:true,
                opacity:0.
            })
            updateFunctions.push(() => {
                coolDown = Math.max(0., coolDown - frameDelta / coolDownDuration)

                coolDownIndicatorMat.opacity = Math.pow(coolDown,.7)

                coolDownIndicatorMat.color.setRGB(
                    1.,
                    Math.max(coolDownIndicatorMat.color.g + .25,0.),
                    Math.max(coolDownIndicatorMat.color.b + .25,0.)
                )
            })
            let cooldownIndicator = Rectangle({
                z: -4.5,
                mat: coolDownIndicatorMat,
                getScale: (target)=>{
                    target.x = suspect.boardFrame.scale.x * (1.-coolDown)
                    target.y = suspect.boardFrame.scale.y * (1.-coolDown)
                },
                getPosition: (target) => {
                    target.x = suspect.boardFrame.position.x
                    target.y = suspect.boardFrame.position.y
                }
            })
            suspect.boardFrame = Rectangle({
                onClick: () => {
                    if(showingScoresMode)
                        return

                    if(coolDown <= 0.) {
                        socket.emit("buy", { suspectIndex: suspects.indexOf(suspect) })
                        coolDown = 1.
                    }
                    else {
                        coolDownIndicatorMat.color.g = 0.
                        coolDownIndicatorMat.color.b = 0.
                    }
                },
                z: -4.,
                frameOnly: true,
                haveFrame: true,
                getScale: getFrameScale,
                getPosition: (target) => {
                    suspect.frame.getEdgeCenter("t", target)
                    target.y -= suspectSlipPadding * 3. + getLittleButtonHeight() + getPortraitHeight() + suspect.boardFrame.scale.y / 2.

                    target.x += Math.pow(Math.max(coolDown, 0.), 8.) * Math.sin(frameCount * .7) * .2
                }
            })

            socket.on("unsuccessful buy", () => {
                let sound = sounds["exchangeFailure"]
                sound.currentTime = 0.
                let soundPromise = sound.play()
                soundPromise.then(function () { }).catch(function () { })
                coolDown = 0.
            })
            socket.on("unsuccessful sell", () => {
                let sound = sounds["exchangeFailure"]
                sound.currentTime = 0.
                let soundPromise = sound.play()
                soundPromise.then(function () { }).catch(function () { })
            })

            let sellCooldown = 0.
            updateFunctions.push(()=>{
                sellCooldown -= frameDelta
            })
            suspect.handFrame = Rectangle({
                onClick: () => {
                    if(showingScoresMode)
                        return

                    socket.emit("sell", { suspect: suspects.indexOf(suspect) })
                    sellCooldown = 1.
                },
                z: -4.,
                haveFrame: true,
                frameOnly:true,
                getScale: getFrameScale,
                getPosition: (target) => {
                    suspect.frame.getEdgeCenter("b", target)
                    target.y += suspectSlipPadding * 1. + suspect.handFrame.scale.y / 2.

                    target.x += Math.max(sellCooldown,0.) * Math.sin(frameCount * .7) * .2
                }
            })
        }

        suspect.portrait = Rectangle({
            map: new THREE.Texture(),
            x: 0., y: 0., w: 4., h: 4.,
            z: -4.,
            haveFrame: true,
            getScale: (target) => {
                target.x = getPortraitHeight()
                target.y = getPortraitHeight()
            },
            getPosition: (target) => {
                target.x = suspect.frame.position.x
                suspect.frame.getEdgeCenter("t", target)
                target.y -= getPortraitHeight() / 2. + suspectSlipPadding * 2. + getLittleButtonHeight()
            }
        })
        updateFunctions.push(() => {
            suspect.portrait.setRotationZ(camera.rotation.z)
        })
        
        bestowJudgementAndCross(suspect, judgeMats, crossMats, suspectSlipPadding)
        bestowCashBits(suspect)
        bestowBets(suspect)

        return {}
    }

    for(let i = 0; i < pm.maxSuspects; ++i)
        Suspect()

    socket.on("suspect portrait", (msg) => {
        setCameraStuffVisibility(false) //screw you if you're trying to make one!
        
        let suspect = suspects[msg.index]

        if(!msg.asap)
            socket.emit("portrait received", { index: msg.index })

        let image = document.createElement("img")
        image.src = msg.portraitImageSrc
        image.onload = () => {
            //there is a reason we can't just use the image. Just not sure what it is/
            const canvasForImage = document.createElement('canvas')
            canvasForImage.width = image.width
            canvasForImage.height = image.height
            canvasForImage.getContext('2d').drawImage(image, 0, 0, image.width, image.height)

            suspect.portrait.material.map = new THREE.CanvasTexture(canvasForImage)
            suspect.portrait.material.needsUpdate = true

            if(!msg.asap)
                socket.emit("portrait loaded",{index:msg.index})
        }
    })
}