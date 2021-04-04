/**
 * So the label says what percent return you get
 * It can be off to the side of the things
 */

function initSuspects(suspectPositionY) {
    let tickMat = new THREE.MeshBasicMaterial()
    new THREE.TextureLoader().load("assets/tick.png", (map) => {
        tickMat.map = map
        tickMat.needsUpdate = true
    })

    let confirmMat = text("Confirm: ",true)
    let deleteMat = text("Delete?", true)

    const frameMat = new THREE.MeshBasicMaterial({ color: 0x888888 })

    const suspectSlipPadding = .25

    let portraitHeight = 1.
    updateFunctions.push(() => {
        portraitHeight = suspectPanelDimensions.x - suspectSlipPadding * 2.
    })

    socket.on("suspect confirmation",(msg)=>{
        suspects[msg.index].confirmed = msg.value
    })

    Suspect = () => {
        let suspect = {}
        suspects.push(suspect)

        suspect.onBoard = false

        {
            //might be nice to have a little arrow pointing that way

            let percentageDisplay = Rectangle({
                label: "88%",
                col: bgColor,
                z: -4.9
            })
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
                percentageDisplay.textMeshes[0].material.setText(percentage + "%")

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

                //FUCK DUDE YOU'RE REPLACING THEIR CASH WHEN THEY REFRESH
                //probably the game has players, not sockets, and those have sockets

                cheapestAvailableBetSlot.getEdgeCenter("r", percentageDisplay.position)
                percentageDisplay.position.x += percentageDisplay.scale.x / 2. + .05
                percentageDisplay.position.y -= .2

                percentageDisplay.scale.x = 1.4
                percentageDisplay.scale.y = 1.4
            })
        }

        suspect.frame = Rectangle({
            // frameOnly: true,
            haveFrame: true,
            mat: frameMat,
            z: -4.99999999,
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

        {
            let tbDimension = .65

            suspect.confirmed = false

            function getTickPosition(target) {
                suspect.frame.getEdgeCenter("t", target)
                target.y -= suspectSlipPadding * 2. + portraitHeight + tbDimension / 2.

                target.x += suspect.frame.scale.x * .35
            }
            const tick = Rectangle({
                mat: tickMat,
                z: OVERLAY_Z + .5,
                w: tbDimension, h: tbDimension,
                visible: false,
                getPosition: getTickPosition
            })
            const boxForTick = Rectangle({
                onClick: () => {
                    socket.emit("suspect confirmation", { 
                        index: suspects.indexOf(suspect),
                        value: !suspect.confirmed
                    })
                },
                z: OVERLAY_Z + 1.,
                haveFrame: true,
                frameOnly: true,
                w: tbDimension, h: tbDimension,
                getPosition: getTickPosition
            })

            const labelR = Rectangle({
                h: tbDimension, 
                w: tbDimension * confirmMat.getAspect(),
                z: OVERLAY_Z + 1.,
                mat: confirmMat,
                getPosition: (target) => {
                    target.y = boxForTick.position.y
                    target.x = boxForTick.position.x - labelR.scale.x / 2. - .45
                }
            })

            updateFunctions.push( () => {
                boxForTick.visible = judgementMode
                tick.visible = suspect.confirmed && judgementMode
                labelR.visible = judgementMode
            })
        }
        
        {
            function getFrameScale(target) {
                let clickableBoxHeight = .5 * (suspectPanelDimensions.y - portraitHeight - suspectSlipPadding * 4.)
                target.x = suspectPanelDimensions.x - suspectSlipPadding * 2.
                target.y = clickableBoxHeight
            }
            let coolDown = 0.
            let coolDownIndicatorMat = new THREE.MeshBasicMaterial({
                color:0xFFFFFF,
                transparent:true,
                opacity:0.
            })
            updateFunctions.push(() => {
                coolDown = Math.max(0., coolDown - frameDelta)

                coolDownIndicatorMat.opacity = coolDown

                coolDownIndicatorMat.color.setRGB(
                    1.,
                    Math.max(coolDownIndicatorMat.color.g + .2,0.),
                    Math.max(coolDownIndicatorMat.color.b + .2,0.)
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
                    if(coolDown <= 0.) {
                        socket.emit("buy", { suspect: suspects.indexOf(suspect) })
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
                    target.y -= suspectSlipPadding * 2. + portraitHeight + suspect.boardFrame.scale.y / 2.

                    target.x += Math.pow(Math.max(coolDown, 0.), 2.) * Math.sin(frameCount * .7) * .2
                }
            })

            socket.on("unsuccessful buy", () => {
                playSound("exchangeFailure")
                coolDown = 0.
            })
            socket.on("unsuccessful sell", () => {
                playSound("exchangeFailure")
            })

            let sellCooldown = 0.
            updateFunctions.push(()=>{
                sellCooldown -= frameDelta
            })
            suspect.handFrame = Rectangle({
                onClick: () => {
                    if(judgementMode)
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
            haveFrame: true,
            getScale: (target) => {
                target.x = portraitHeight
                target.y = portraitHeight
            },
            getPosition: (target) => {
                target.x = suspect.frame.position.x
                suspect.frame.getEdgeCenter("t", target)
                target.y -= portraitHeight / 2. + suspectSlipPadding
            }
        })

        let deleteSign = Rectangle({
            onClick: ()=>{
                socket.emit("delete",{ index: suspects.indexOf(suspect) })
            },
            getScale: (target) => {
                target.x = suspect.portrait.scale.x
                target.y = suspect.portrait.scale.x / deleteMat.getAspect()
            },
            col: 0xFF0000,
            z: suspect.portrait.position.z + 1.,
            mat: deleteMat,
            getPosition: (target) => {
                suspect.portrait.getEdgeCenter("b",target)
                target.y += deleteSign.scale.y / 2.
            }
        })
        let deletable = false
        let hasAtSomePointHadABet = false
        updateFunctions.push(() => {
            deletable = hasAtSomePointHadABet
            suspect.betOwners.forEach((betOwner) => {
                if (betOwner !== pm.BOARD_OWNERSHIP) {
                    hasAtSomePointHadABet = true
                    deletable = false
                }
            })

            deleteSign.visible = deletable
        })

        suspect.putOnBoard = () => {
            deletable = false
            hasAtSomePointHadABet = false
            suspect.onBoard = true
        }

        updateFunctions.push(() => {
            suspect.portrait.mesh.rotation.z = camera.rotation.z
        })

        bestowCashBits(suspect)
        bestowBets(suspect)

        return {}
    }

    for(let i = 0; i < pm.maxSuspects; ++i)
        Suspect()

    socket.on("suspect portrait", (msg) => {
        setCameraStuffVisibility(false) //screw you if you're trying to make one!
        
        let suspect = suspects[msg.index]

        socket.emit("portrait received", { index: msg.index })

        let image = document.createElement("img")
        image.src = msg.portraitImageSrc
        image.onload = () => {
            //really not sure why we can't just use the image
            const canvasForImage = document.createElement('canvas')
            canvasForImage.width = image.width
            canvasForImage.height = image.height
            canvasForImage.getContext('2d').drawImage(image, 0, 0, image.width, image.height)

            suspect.portrait.mesh.material.map = new THREE.CanvasTexture(canvasForImage)
            suspect.portrait.mesh.material.needsUpdate = true

            socket.emit("portrait loaded",{index:msg.index})
        }

        //and when server receives this from all it'll make them all appear
        //also, it'll allow in more new suspects
    })

    socket.on("suspect onBoard", (msg) => {
        playSound("newSuspect")
        suspects[msg.index].putOnBoard()
    })
}