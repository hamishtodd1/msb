function initSuspects() {
    let tickMat = new THREE.MeshBasicMaterial()
    new THREE.TextureLoader().load("assets/tick.png", (map) => {
        tickMat.map = map
        tickMat.needsUpdate = true
    })

    let confirmMat = text("Confirm: ",true)
    let deleteMat = text("Delete?", true)

    const suspectSlipPadding = .25

    let portraitHeight = 1.
    updateFunctions.push(() => {
        portraitHeight = suspectPanelDimensionsMr.offset.x - suspectSlipPadding * 2.
    })

    socket.on("suspect confirmation",(msg)=>{
        suspects[msg.index].confirmed = msg.value
    })

    Suspect = () => {
        let suspect = {}
        suspects.push(suspect)

        suspect.onBoard = false

        suspect.frame = Rectangle({
            frameOnly: true,
            haveFrame: true,
            z: -5.,
            getScale: (target) => {
                target.x = suspectPanelDimensionsMr.offset.x
                target.y = suspectPanelDimensionsMr.offset.y
            },
            haveIntendedPosition: true
        })
        updateFunctions.push(() => {
            if (!suspect.onBoard)
                suspect.frame.intendedPosition.x = camera.getRight() * 2.
            else
                suspect.frame.intendedPosition.x = getPanelPositionX(suspects.indexOf(suspect))
        })

        {
            let tbDimension = .8

            suspect.confirmed = false

            function getTickPosition(target) {
                suspect.frame.getEdgeCenter("t", target)
                target.y -= suspectSlipPadding * 2. + portraitHeight + tbDimension / 2.

                target.x += suspect.frame.scale.x * .35

                // target.y = camera.getTop() - tbDimension / 2. - panelPaddingMr.offset.x
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
                    log("yo")
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
                h: tbDimension, w: tbDimension * confirmMat.getAspect(),
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

        // var guiltButton = Rectangle({
        //     onClick: () => {
        //         log("guilty pressed")
        //     },
        //     label: "guilty!",
        //     z: 0.,
        //     haveFrame: true,
        //     getScale: (target) => {
        //         target.x = portrait.scale.x / 2.
        //         target.y = portrait.scale.y / 2.
        //     },
        //     getPosition: (target) => {
        //         target.x = suspect.frame.position.x - suspect.frame.scale.x / 4.
        //         target.y = suspect.frame.position.y //should be just below portrait
        //     }
        // })

        // var deleteButton = Rectangle({
        //     onClick: () => {
        //     log("delete pressed")
        //         socket.emit("delete",{suspect:suspects.indexOf(suspect)})
        // },
        //     label: "delete",
        //     // col: 0xFF0000,
        //     z: 0.,
        //     haveFrame: true,
        //     getScale: (target) => {
        //         target.x = portrait.scale.x / 2.
        //         target.y = portrait.scale.y / 2.
        //     },
        //     getPosition: (target) => {
        //         target.x = suspect.frame.position.x + suspect.frame.scale.x / 4.
        //         target.y = suspect.frame.position.y //should be just below portrait
        //     }
        // })

        //slots
        {
            function getFrameScale(target) {
                let clickableBoxHeight = .5 * (suspectPanelDimensionsMr.offset.y - portraitHeight - suspectSlipPadding * 4.)
                target.x = suspectPanelDimensionsMr.offset.x - suspectSlipPadding * 2.
                target.y = clickableBoxHeight
            }
            updateFunctions.push(()=>{
                boardMat.opacity -= frameDelta * .6
                handMat.opacity -= frameDelta * .6
            })
            let boardMat = new THREE.MeshBasicMaterial({
                color:0xFFFFFF,
                transparent:true,
                opacity:0.
            })
            suspect.boardFrame = Rectangle({
                onClick: () => {
                    // if(boardMat.opacity <= 0.)
                    {
                        socket.emit("buy", { suspect: suspects.indexOf(suspect) })
                        boardMat.opacity = .6
                    }
                },
                mat: boardMat,
                z: -4.,
                haveFrame: true,
                getScale: getFrameScale,
                getPosition: (target) => {
                    suspect.frame.getEdgeCenter("t", target)
                    target.y -= suspectSlipPadding * 2. + portraitHeight + suspect.boardFrame.scale.y / 2.

                    target.x += Math.pow(Math.max(boardMat.opacity, 0.), 2.) * Math.sin(frameCount * .7) * .2
                }
            })
            let handMat = new THREE.MeshBasicMaterial({ 
                color: 0xFFFFFF ,
                transparent:true,
                opacity:0.
            })
            suspect.handFrame = Rectangle({
                onClick: () => {
                    socket.emit("sell", { suspect: suspects.indexOf(suspect) })
                    handMat.opacity = .6
                },
                mat: handMat,
                z: -4.,
                haveFrame: true,
                getScale: getFrameScale,
                getPosition: (target) => {
                    suspect.frame.getEdgeCenter("b", target)
                    target.y += suspectSlipPadding * 1. + suspect.handFrame.scale.y / 2.

                    target.x += Math.max(handMat.opacity,0.) * Math.sin(frameCount * .7) * .2
                }
            })
        }

        suspect.portrait = Rectangle({
            map: new THREE.Texture(),
            x: 0., y: 0., w: 4., h: 4.,
            haveFrame: true,
            getScale: (target) => {
                target.x = suspectPanelDimensionsMr.offset.x - suspectSlipPadding * 2.
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
            suspect.bets.forEach((bet) => {
                if (bet.owner !== pm.BOARD_OWNERSHIP) {
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

            playSound("newSuspect")
            suspect.putOnBoard()
        }

        socket.emit("portrait received")
        //and when server receives this from all it'll make them all appear
        //also, it'll allow in more new suspects
    })
}