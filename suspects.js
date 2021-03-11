function initSuspects() {
    let tickMat = new THREE.MeshBasicMaterial()
    new THREE.TextureLoader().load("assets/tick.png", (map) => {
        tickMat.map = map
        tickMat.needsUpdate = true
    })

    let confirmMat = text("Confirm: ",true)

    Suspect = (msg) => {
        const suspectSlipPadding = .25

        let suspect = {}
        suspects[msg.index] = suspect

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
            suspect.frame.intendedPosition.y = 0.
            suspect.frame.intendedPosition.x = getPanelPositionX(suspects.indexOf(suspect))
        })

        {
            let tbDimension = .8

            suspect.confirmed = false

            function getTickPosition(target) {
                suspect.frame.getEdgeCenter("t", target)
                target.y -= suspectSlipPadding * 2. + portraitHeight + tbDimension / 2.

                target.x += suspect.frame.scale.x * .35

                // target.y = camera.top - tbDimension / 2. - panelPaddingMr.offset.x
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
                    suspect.confirmed = !suspect.confirmed
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
            suspect.boardFrame = Rectangle({
                onClick: () => {
                    socket.emit("buy", { suspect: suspects.indexOf(suspect) })
                },
                frameOnly: true,
                z: -4.,
                haveFrame: true,
                getScale: getFrameScale,
                getPosition: (target) => {
                    suspect.frame.getEdgeCenter("t", target)
                    target.y -= suspectSlipPadding * 2. + portraitHeight + suspect.boardFrame.scale.y / 2.
                }
            })
            suspect.handFrame = Rectangle({
                onClick: () => {
                    socket.emit("sell", { suspect: suspects.indexOf(suspect) })
                },
                frameOnly: true,
                z: -4.,
                haveFrame: true,
                getScale: getFrameScale,
                getPosition: (target) => {
                    suspect.frame.getEdgeCenter("b", target)
                    target.y += suspectSlipPadding * 1. + suspect.handFrame.scale.y / 2.
                }
            })
        }

        bestowCashBits(suspect)
        bestowBets(suspect)

        let image = document.createElement("img")
        image.src = msg.portraitImageSrc
        image.onload = () => {
            //really not sure why we can't just use the image
            const canvasForImage = document.createElement('canvas')
            canvasForImage.width = image.width
            canvasForImage.height = image.height
            canvasForImage.getContext('2d').drawImage(image, 0, 0, image.width, image.height)

            const portrait = Rectangle({
                map: new THREE.CanvasTexture(canvasForImage),
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
        }

        let portraitHeight = 1.
        updateFunctions.push(() => {
            portraitHeight = suspectPanelDimensionsMr.offset.x - suspectSlipPadding * 2.
        })

        return {}
    }
}