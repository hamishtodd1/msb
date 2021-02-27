function initMeasuringRects() {
    const measuringRectOffset = 
        { "test": { "x": 4.231738035264483, "y": 3.375314861460957 }, "panelPadding": { "x": 2.216624685138539, "y": 1.7128463476070532 }, "bet slot": { "x": 3.6474164133738602, "y": 0.182370820668693 }, "suspectPanelDimensions": { "x": 4.55919395465995, "y": 18. } }

    const mrs = []

    bindButton(" ",()=>{
        mrs.forEach((mr) => {
            mr.toggleVisibility()
        })
        copyToClipboard(JSON.stringify(measuringRectOffset))
    })

    MeasuringRect = function(name, anchorToBottomLeft) {
        let grabbed = false

        let r = Rectangle({
            label: name,
            opacity: .2,
            z: 8.,
            // visible: false,
            onClick: () => {
                grabbed = true
            }
        })
        mrs.push(r)

        r.anchor = new THREE.Vector2()

        if (measuringRectOffset[name] === undefined) {
            measuringRectOffset[name] = {
                x:1.,
                y:1.
            }
        }
        let offset = measuringRectOffset[name] //i.e. dimensions
        r.offset = offset

        updateFunctions.push(() => {
            if (!mouse.clicking)
                grabbed = false

            if (grabbed) {
                offset.x = mouse.position.x - r.anchor.x
                offset.y = mouse.position.y - r.anchor.y
            }

            r.position.x = r.anchor.x + offset.x / 2.
            r.position.y = r.anchor.y + offset.y / 2.

            r.scale.x = Math.abs(offset.x)
            r.scale.y = Math.abs(offset.y)
            if (r.scale.x === 0.)
                r.scale.x = .0001
            if (r.scale.y === 0.)
                r.scale.y = .0001

            if(anchorToBottomLeft) {
                r.anchor.set(-camera.right, -camera.top)
            }
        })

        r.getIndicatedPosition = (target) => {
            target.x = r.anchor.x + offset.x
            target.y = r.anchor.y + offset.y
        }

        //and something about visibility which can be toggled

        return r
    }
}