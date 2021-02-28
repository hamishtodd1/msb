/*
    you are a lot more likely to make progress in academia than on politics
    could bet on an episode of first dates

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

    const slotMr = MeasuringRect("bet slot", false)
    const cashWidth = 2.2
    const betHeight = Math.abs(slotMr.offset.y)
    
    const betsPerSuspect = 16
    const betPrices = Array(betsPerSuspect)
    const slotFrameThickness = .04
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

    const cashMat = new THREE.MeshBasicMaterial({ color: 0x00FF00})
    const startingCash = entireColumnPrice * .6
    //you should increase this if nobody is ever able to buy the most expensive bets
    //they'll deffo get bought in endgame 
    const staticCash = Rectangle({
        mat: cashMat,
        h: betHeight,
        w: startingCash * cashWidth,
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

        // var guiltButton = Rectangle({
        //     onClick: () => {
        //         log("guilty pressed")
        //     },
        //     label: "guilty!",
        //     z: 0.,
        //     hasFrame: true,
        //     getScale: (target) => {
        //         target.x = portrait.scale.x / 2.
        //         target.y = portrait.scale.y / 2.
        //     },
        //     getPosition: (target) => {
        //         target.x = suspectFrame.position.x - suspectFrame.scale.x / 4.
        //         target.y = suspectFrame.position.y //should be just below portrait
        //     }
        // })
        // var deleteButton = Rectangle({
        //     onClick: () => {
        //         log("delete pressed")
        //     },
        //     label: "delete",
        //     // col: 0xFF0000,
        //     z: 0.,
        //     hasFrame: true,
        //     getScale: (target) => {
        //         target.x = portrait.scale.x / 2.
        //         target.y = portrait.scale.y / 2.
        //     },
        //     getPosition: (target) => {
        //         target.x = suspectFrame.position.x + suspectFrame.scale.x / 4.
        //         target.y = suspectFrame.position.y //should be just below portrait
        //     }
        // })

        function emulateServer(clientMsg) {
            
        //     if (clientMsg.action === "sell")
        //     {
        //         let suspectCashBit = suspect.cashBits[something]
        //         suspectCashBit.associatedOwnerIndex = myPlayerIndex
        //         //this will now be counted as part of your cash
        //         //the emptiness or not of its slot tells it where to actually go

        //         --numInHand
        //         ++numInBoard

        //         handleServerMessage(msg)
        //     }

        //     //on the server
        //     // {
        //     //     let cheapestBoardBetPrice = Infinity
        //     //     let cheapestBoardBet = null
        //     //     suspect.bets.forEach((bet, i) => {
        //     //         //actually you can work it out from numInBoard
        //     //         if (bet.ownerIndex === BOARD_OWNERSHIP && bet.scale.x < cheapestBoardBetPrice) {
        //     //             cheapestBoardBet = bet
        //     //             cheapestBoardBetPrice = bet.scale.x
        //     //         }
        //     //     })

        //     //     let playerCash = cash.scale.x
        //     //     suspects.forEach((suspect)=>{
        //     //         suspect.cashBits.forEach((cashBit)=>{
        //     //             if(cashBit.associatedOwnerIndex === myPlayerIndex)
        //     //                 playerCash += cashBit.scale.x
        //     //         })
        //     //     })

        //     //     if(cheapestBoardBetPrice <= playerCash) {
        //     //         --numInBoard
        //     //         ++numInHand

        //     //         suspect.cashBits[cheapestHeldByBoard].ownerIndex = myPlayerIndex
        //     //     }
        //     //     else {
        //     //         handleServerMessage("unsuccessfulBuy")
        //     //     }
        //     // }
        }

        // function handleServerMessage(msg) {
        //     if (msg === "unsuccessfulBuy")
        //     {
        //         log("FAILED BUY/SELL SOUND AND VISUAL EFFECT")
        //     }

        //     staticCash.scale.x = msg.playersCash
        //     cashBits.forEach((cashBit) => {
        //         if (cashBit.associatedOwnerIndex === myPlayerIndex)
        //             staticCash.scale.x -= cashBit.scale.x
        //     })

        //     // {
        //     //     suspect.cashBits.forEach((cashBit) => {
        //     //         const goneFromUsToSomeoneElseOrViceVersa =
        //     //             cashBit.associatedOwnerIndex !== newOwnerIndex &&
        //     //             cashBit.associatedOwnerIndex !== myPlayerIndex &&
        //     //             newOwnerIndex !== myPlayerIndex
        //     //         if (newOwnerIndex === BOARD_OWNERSHIP && goneFromUsToSomeoneElseOrViceVersa) {
        //     //             staticCash[cashBit.associatedOwnerIndex] += cashBit.scale.x
        //     //             cashBit.position = someonesWalletPosition
        //     //         }
        //     //         cashBit.associatedOwnerIndex = newOwner
        //     //     })

        //     //     //sfx for someone buying a bet is suction
        //     // }

        //     //when the server sends you stuff about your cash and where cashbits are
        //     {
        //         //a temporary simulation of what should happen
        //         // bets[cheapestHeldByBoard].ownerIndex = myPlayerIndex
        //         // cashBit.associatedOwnerIndex = myPlayerIndex
        //     }
        // }

        //slots
        {
            const myPlayerIndex = 0

            function getFrameScale(target) {
                let clickableBoxHeight = .5 * (suspectPanelDimensionsMr.offset.y - portrait.scale.y - suspectSlipPadding * 4.)
                target.x = suspectPanelDimensionsMr.offset.x - suspectSlipPadding * 2.
                target.y = clickableBoxHeight
            }
            var boardFrame = Rectangle({
                onClick: () => {
                    log("clicked to buy bet")

                    emulateServer("buy")
                },
                frameOnly: true,
                z: -4.,
                hasFrame: true,
                getScale: getFrameScale,
                getPosition: (target) => {
                    suspectFrame.getEdgeCenter("t",target)
                    target.y -= suspectSlipPadding * 2. + portrait.scale.y + boardFrame.scale.y / 2.
                }
            })
            var handFrame = Rectangle({
                onClick: () => {
                    log("clicked wallet")

                    emulateServer("sell")
                },
                frameOnly: true,
                z: -4.,
                hasFrame: true,
                getScale: getFrameScale,
                getPosition: (target) => {
                    suspectFrame.getEdgeCenter("b",target)
                    target.y += suspectSlipPadding * 1. + handFrame.scale.y / 2.
                }
            })

            updateFunctions.push(() => {

                //////////
                // BETS //
                //////////
                
                //errr sounds like these are the only numbers you need?
                let numInHand = 0
                let numInBoard = 0
                bets.forEach((bet) => {
                    if(bet.ownerIndex === myPlayerIndex)
                        ++numInHand
                    if(bet.ownerIndex === BOARD_OWNERSHIP)
                        ++numInBoard
                })

                //sort by which thing they're in and how high up they are
                bets.sort((betA, betB) => { //gotta be negative if a < b
                    if (betA.ownerIndex === betB.ownerIndex)
                        return betA.position.y - betB.position.y

                    let betBAtTop = betB.ownerIndex !== myPlayerIndex && betB.ownerIndex !== BOARD_OWNERSHIP
                    if (betBAtTop || betA.ownerIndex === myPlayerIndex)
                        return -1
                    else
                        return 1
                })

                bets.forEach((bet,i)=>{
                    if(i < numInHand)
                        bet.intendedPosition.y = handFrame.position.y + getSlotY(i)
                    else if(i < numInHand + numInBoard) {
                        i = i - numInHand
                        let slotIndex = betsPerSuspect - (numInBoard-i)
                        bet.intendedPosition.y = boardFrame.position.y + getSlotY(slotIndex)
                    }
                    else
                        bet.intendedPosition.y = camera.top * 1.3

                    if(frameCount === 1)
                        bet.goToIntendedPosition()
                    bet.intendedPosition.x = suspectFrame.position.x
                    bet.position.x = suspectFrame.position.x
                })

                //////////////
                // CASHBITS //
                //////////////

                {
                    //each frame, the slot's cashBit gets attracted to or repelled from its associatedOwner
                    //depending on whether it's owned by them, which we work out based on other things

                    // cashBits.forEach((cashBit) => {
                    //     const numEmptySlots = betsPerSuspect - numInBoard
                    //     const ownedByMarket = numEmptySlots - index > 0
                        
                    //     if (ownedByMarket) {
                    //         //go towards my slot
                    //         cashBit.intendedPosition.copy(cashBit.slot.position)
                    //     }
                    //     else if (cashBit.associatedOwnerIndex === myPlayerIndex) {
                    //         //go towards our hand
                    //         // cashBit.getEdgeCenter("l",v0)
                    //         // cashBit.setPositionFromEdge("r", v0.x, v0.y)
                    //     }
                    //     else {
                    //         cashBit.intendedPosition.y = 

                    //     }
                    // })
                        

                    // cashBit.intendedPosition.copy(slot.position)
                    // if(frameCount === 1)
                    //     cashBit.position.copy(slot.position)
                }
            })

            function getCheapestBet() {
                return getMax(suspect.bets, (bet)=>{
                    return bet.ownerIndex === BOARD_OWNERSHIP ? 1. / bet.scale.x : -Infinity
                })
            }

            updateFunctions.push(() => {
                let bet = null
                switch (frameCount / 30) {
                    case 1:
                        bet = getCheapestBet()
                        bet.ownerIndex = myPlayerIndex
                        break

                    case 2:
                        bet = getCheapestBet()
                        bet.ownerIndex = myPlayerIndex
                        break

                    case 3:
                        bet = getMax(suspect.bets, (bet) => {
                            return bet.ownerIndex === myPlayerIndex ? bet.position.y : -Infinity
                        })
                        bet.ownerIndex = BOARD_OWNERSHIP
                        break

                    case 4:
                        bet = getCheapestBet()
                        bet.ownerIndex = myPlayerIndex
                        break

                    case 5:
                        bet = getCheapestBet()
                        bet.ownerIndex = myPlayerIndex + 1 //i.e. some other player
                        break

                    default:
                }
            })

            function getSlotY(index) {
                return (betHeight + slotFrameThickness) * (index - (betsPerSuspect - 1.) / 2.)
            }

            let slots = []
            suspect.slots = slots
            // let cashBits = []
            // suspect.cashBits = cashBits
            for(let i = 0; i < betsPerSuspect; ++i) {
                const index = i
                let slot = Rectangle({
                    getPosition: (target) => {
                        target.x = suspectFrame.position.x - .5 * cashWidth + betPrices[index] * cashWidth / 2.

                        target.y = boardFrame.position.y + getSlotY(index)
                    },
                    getScale: (target) =>{
                        target.x = betPrices[index] * cashWidth
                        target.y = betHeight
                    },
                    z: -2.,
                    frameOnly: true,
                    frameThickness: slotFrameThickness
                })
                slots.push( slot )
                
                // let cashBit = Rectangle({
                //     getScale: (target) => {
                //         target.x = betPrices[index] * cashWidth
                //         target.y = betHeight
                //     },
                //     z: -3.,
                //     mat: cashMat,
                //     haveIntendedPosition: true
                // })
                // cashBit.slot = slot
                // cashBit.associatedOwnerIndex = -1
                // cashBits.push(cashBit)
            }

            let betMat = new THREE.MeshBasicMaterial({ color: new THREE.Color() })
            getViridis(suspects.indexOf(suspect), betMat.color)
            const bets = Array(betsPerSuspect)
            suspect.bets = bets
            for (let i = 0; i < betsPerSuspect; ++i) {
                let bet = Rectangle({
                    getScale: (target) => {
                        target.x = cashWidth
                        target.y = betHeight
                    },
                    haveIntendedPosition: true,
                    z: -3.,
                    mat: betMat
                })

                bets[i] = bet
                bet.ownerIndex = BOARD_OWNERSHIP
            }
        }

        return {}
    }

    const BOARD_OWNERSHIP = -1
    const NO_OWNERSHIP = -2

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