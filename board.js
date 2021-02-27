/*
    Script for "murder mystery", sock puppets:
        Ahh help I'm being murdered
            BUT WHO COULD HAVE DONE THIS??
        Hello, I'm his estranged wife, and I must admit I really grew to dislike him
        I'm his Butler. I really liked him but it must be said that I had motive to 
        pause
        Didn't he say something about readjusting his will tomorrow?

        Hello. Well, I'm a Butler. But I certainly didn't do it
        AND I... AM... a random passer by, I don't know who that is at all
        Really? I could swear I've seen you around
        Nope, honestly never been here before. Are you sure you didn't do it?
        Well, ok, to be honest I did do it, I just couldn't stand him any more
        Alright I guess that clears that up
        OR DOES IT?
        No, yes, it's cleared up, it was definitely me
        THE END

        Oh alright, it was me actually

        Me: This man has been killed! But who was it?
        A: Well, I never liked him anyway
        B: I liked him a lot, although I do wish he would keep away from my poisonous frog collection
        Hmm, there is also his ex wife, who appears to have absconded to the bahamas
        Oh, it turns out it was me

    Do a game with
        Chia
        Devon
        Florian, Jacob
        Whatsisname, young guy in edinburgh

    Could also do this with:
        Who's going to end up with whom in a rom com
        Who will win football
        
    TODO
        Removing suspects (iff no bets)
        Marking winner
        Sfx
            cha ching https://freesound.org/people/Lucish_/sounds/554841/
            "Dumf, no money"

    Send to
        r/ssc
        r/wsb
        lesswrong
        London rationalish
        Friends:
            Chao, Chigozie, Devon, Florian and Jacob
            Facebook friends, every night
            Edindies friends

    one might get things like the radiolab "Buy and then immediately sell when you see the price"
    different name: "the hansonian betting board". Bet on anything you like
    advantage this might have over board game: you don't have to look down and check whether
        you've got bets on a character you've lost faith in being guilty,
        you can just immediately go over and decrease your bet
*/

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
    const maxSuspects = 6 //
    const suspectSlipPadding = .25

    suspectPanelDimensionsMr = MeasuringRect("suspectPanelDimensions")
    panelPaddingMr = MeasuringRect("panelPadding", true)
    getPanelPositionX = function (suspectIndex) {
        return -camera.right +
            panelPaddingMr.offset.x +
            suspectPanelDimensionsMr.offset.x / 2. +
            suspectIndex * (suspectPanelDimensionsMr.offset.x + panelPaddingMr.offset.x)
    }

    const discreteViridis = [
        new THREE.Color(68. / 256., 0., 84. / 256.),
        new THREE.Color(49. / 256., 102. / 256., 142. / 256.),
        new THREE.Color(112. / 256., 208. / 256., 87. / 256.)]
    getViridis = (t, target) => {
        let a = t < .5 ? discreteViridis[0] : discreteViridis[1]
        let b = t < .5 ? discreteViridis[1] : discreteViridis[2]

        target.copy(a)
        target.lerpHSL(b, (t < .5 ? t : t - .5) * 2.)
    }

    const betSlotMr = MeasuringRect("bet slot", false)
    const cashWidth = 2.2
    const betHeight = Math.abs(betSlotMr.offset.y)
    
    const betsPerSuspect = 16
    const betPrices = Array(betsPerSuspect)
    const betSlotFrameThickness = .04
    {
        //the value of a bet if you win is 1.
        let cheapestBet = 1. / 16.

        let betPriceStepDown = Math.pow(cheapestBet, 1. / betsPerSuspect)

        var entireColumnPrice = 0.
        for (let i = 0.; i < betsPerSuspect; ++i) {
            betPrices[i] = Math.pow(betPriceStepDown, betsPerSuspect - i)
            entireColumnPrice += betPrices[i]
        }
    }

    const cashCol = 0x00FF00
    const cash = Rectangle({
        col: cashCol,
        h: betHeight,
        w: entireColumnPrice * .6 * cashWidth,
        x: 0.,
        y: camera.bottom + .5
    })

    Suspect = (portrait) => {
        let suspect = {}
        suspects.push(suspect)

        updateFunctions.push(()=>{
            portrait.scale.x = suspectPanelDimensionsMr.offset.x - suspectSlipPadding * 2.
            portrait.scale.y = suspectPanelDimensionsMr.offset.x - suspectSlipPadding

            suspectFrame.getEdgeCenter("t", portrait.position)
            portrait.position.y -= portrait.scale.y / 2. + suspectSlipPadding
        })

        let suspectFrame = Rectangle({
            frameOnly: true,
            hasFrame: true,
            z: -5.,
            getScale:(target)=>{
                target.x = suspectPanelDimensionsMr.offset.x
                target.y = suspectPanelDimensionsMr.offset.y
            },
            getPosition: (target) =>{
                target.y = 0.
                target.x = camera.left + suspectPanelDimensionsMr.offset.x / 2. + panelPaddingMr.offset.x
            }
        })

        var guiltButton = Rectangle({
            onClick: () => {
                log("guilty pressed")
            },
            label: "guilty!",
            z: 0.,
            hasFrame: true,
            getScale: (target) => {
                target.x = portrait.scale.x / 2.
                target.y = portrait.scale.y / 2.
            },
            getPosition: (target) => {
                target.x = suspectFrame.position.x - suspectFrame.scale.x / 4.
                target.y = suspectFrame.position.y //should be just below portrait
            }
        })
        var deleteButton = Rectangle({
            onClick: () => {
                log("delete pressed")
            },
            label: "delete",
            // col: 0xFF0000,
            z: 0.,
            hasFrame: true,
            getScale: (target) => {
                target.x = portrait.scale.x / 2.
                target.y = portrait.scale.y / 2.
            },
            getPosition: (target) => {
                target.x = suspectFrame.position.x + suspectFrame.scale.x / 4.
                target.y = suspectFrame.position.y //should be just below portrait
            }
        })

        //slots
        {
            const numHeldByOpponents = 0
            const numHeldByMe = 0
            //or, could say from the server, for each bet, where it is

            function getClickableBoxScale(target) {
                let clickableBoxHeight = .5 * (suspectPanelDimensionsMr.offset.y - portrait.scale.y - suspectSlipPadding * 4.)
                target.x = suspectPanelDimensionsMr.offset.x - suspectSlipPadding * 2.
                target.y = clickableBoxHeight
            }
            var marketFrame = Rectangle({
                onClick: () => {
                    log("clicked market")
                    ++numHeldByMe
                },
                frameOnly: true,
                z: -4.,
                hasFrame: true,
                getScale: getClickableBoxScale,
                getPosition: (target) => {
                    suspectFrame.getEdgeCenter("t",target)
                    target.y -= suspectSlipPadding * 2. + portrait.scale.y + marketFrame.scale.y / 2.
                }
            })
            var handFrame = Rectangle({
                onClick: () => {
                    log("clicked wallet")
                    if(numHeldByMe < 0) {
                        log("you don't have any")
                        //maybe a little fake grey bet that's usually invisible 
                    }
                    else
                        --numHeldByMe //more like you send a message
                },
                frameOnly: true,
                z: -4.,
                hasFrame: true,
                getScale: getClickableBoxScale,
                getPosition: (target) => {
                    suspectFrame.getEdgeCenter("b",target)
                    target.y += suspectSlipPadding * 1. + handFrame.scale.y / 2.
                }
            })

            updateFunctions.push(() => {
                suspect.bets.forEach((bet, index) => {
                    bet.intendedPosition.x = suspectFrame.position.x
                    bet.position.x = bet.intendedPosition.x

                    //the information is "your hand has this many, the market has this many, your opponents have total - that"
                    //well it's more like "your hand has this many, your opponents have this man, the market is what's left over"
                    let frameToBeIn = frameCount < index * 10 ? marketFrame : handFrame
                    bet.intendedPosition.y = frameToBeIn.position.y + getSlotY(index)

                    if (frameCount === 1)
                        bet.position.y = bet.intendedPosition.y
                })
            })

            updateFunctions.push(() => {
                switch (frameCount / 40) {
                    case 1:
                        marketFrame.onClick()
                        break

                    case 2:
                        marketFrame.onClick()
                        break

                    case 3:
                        handFrame.onClick()
                        break

                    case 4:
                        marketFrame.onClick()
                        break

                    default:
                }
            })

            function getSlotY(index) {
                return  (betHeight + betSlotFrameThickness) * (index - (betsPerSuspect - 1.) / 2.)
            }

            let betSlots = Array(betsPerSuspect)
            for(let i = 0; i < betsPerSuspect; ++i) {
                const index = i
                let betSlot = Rectangle({
                    getPosition: (target) => {
                        target.x = suspectFrame.position.x - .5 * cashWidth + betPrices[index] * cashWidth / 2.

                        target.y = marketFrame.position.y + getSlotY(index)
                    },
                    getScale: (target) =>{
                        target.x = betPrices[index] * cashWidth
                        target.y = betHeight
                    },
                    z: -2.,
                    frameOnly: true,
                    frameThickness: betSlotFrameThickness
                })
                
                betSlots[i] = betSlot
            }
            

            let betMat = new THREE.MeshBasicMaterial({ color: new THREE.Color() })
            getViridis(suspects.indexOf(suspect), betMat.color)
            suspect.bets = Array(betsPerSuspect)
            for (let i = 0; i < betsPerSuspect; ++i) {
                const index = i
                let bet = Rectangle({
                    getScale: (target) => {
                        target.x = cashWidth
                        target.y = betHeight
                    },
                    haveIntendedPosition: true,
                    z: -3.,
                    mat: betMat
                })

                suspect.bets[i] = bet
            }
        }

        return {}
    }

    updateFunctions.push(()=>{
        if(frameCount === 20) {
            let testPortrait = Rectangle({
                hasFrame: true,
                haveIntendedPosition: true,
                haveIntendedScale: true
            })
            Suspect(testPortrait)
        }
    })
}