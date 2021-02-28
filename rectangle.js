function initRectangles() {
    let blackMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 })
    let tblr = "tblr"

    Rectangle = function(params) {
        if (params === undefined)
            params = {}

        const rect = {}
        rectangles.push(rect)

        rect.getEdgeCenter = function (edge, target) {
            target.y = this.position.y
            if (edge === "t" || edge === "b")
                target.y += this.scale.y * .5 * (edge === "b" ? -1. : 1.)

            target.x = this.position.x
            if (edge === "l" || edge === "r")
                target.x += this.scale.x * .5 * (edge === "l" ? -1. : 1.)
        }

        rect.goToIntendedPosition = () => {
            rect.position.x = rect.intendedPosition.x
            rect.position.y = rect.intendedPosition.y
        }

        rect.getCorner = function (corner, target) {
            target.x = this.position.x
            target.y = this.position.y

            target.y += this.scale.y * 2. * (corner[0] === "t" ? 1. : -1.)
            target.x += this.scale.x * 2. * (corner[1] === "l" ? -1. : 1.)
        }
        //the bets are all the same length as the money they're worth

        rect.setPositionFromEdge = function (edge,x,y) {
            rect.position.x = 0
            rect.position.y = 0
            rect.getEdgeCenter(edge, v0)

            rect.position.x = x - v0.x
            rect.position.y = y - v0.y
        }
        rect.setPositionFromCorner = function (corner, x, y) {

            let xAddition = (corner[1] === "l" ? 1. : -1.) * this.scale.x / 2.
            this.position.x = x + xAddition

            if (y !== undefined) {
                let yAddition = (corner[0] === "t" ? -1. : 1.) * this.scale.y / 2.
                this.position.y = y + yAddition
            }

            if (this.intendedPosition !== undefined) {
                this.intendedPosition.x = this.position.x
                this.intendedPosition.y = this.position.y
            }
        }

        {
            let mat = params.mat ?
                params.mat :
                new THREE.MeshBasicMaterial()

            if (params.label) {
                let textMesh = text(params.label, false)
                rect.textMesh = textMesh
                scene.add(textMesh)
                updateFunctions.push(() => {
                    textMesh.position.x = rect.position.x
                    textMesh.position.y = rect.position.y
                    textMesh.position.z = rect.position.z + .05

                    textMesh.visible = rect.visible

                    const intendedWidth = rect.scale.x
                    const scaleMultiple = intendedWidth / textMesh.scale.x
                    textMesh.scale.multiplyScalar(scaleMultiple)
                })
            }

            if (params.map)
                mat.map = params.map

            if (params.col)
                mat.color.setHex(params.col)

            if (params.opacity) {
                mat.transparent = true
                mat.opacity = params.opacity
            }

            rect.mesh = new THREE.Mesh(unitSquareGeo, mat)
            scene.add(rect.mesh)
            {
                rect.position = rect.mesh.position
                rect.scale = rect.mesh.scale
                rect.color = mat.color

                rect.visible = true
                if (params.visible !== undefined)
                    rect.visible = params.visible
                updateFunctions.push(() => {
                    if(params.frameOnly)
                        rect.mesh.visible = false
                    else
                        rect.mesh.visible = rect.visible

                    if (rect.edges) {
                        rect.edges.forEach((edge) => {
                            edge.visible = rect.visible
                        })
                    }
                })

                rect.toggleVisibility = () => {
                    let newVal = !rect.visible
                    rect.visible = newVal
                    if (rect.textMesh !== undefined)
                        rect.textMesh.visible = newVal
                }
            }
        }

        if (params.frameThickness || params.hasFrame) {
            let thickness = params.frameThickness || .05
            rect.edges = Array(4)
            for(let i = 0; i < 4; ++i) {
                const edge = tblr[i]
                let frameR = Rectangle({
                    mat: blackMaterial
                })
                rect.edges[i] = frameR
                
                updateFunctions.push(()=>{
                    rect.getEdgeCenter(edge,frameR.position)

                    if (edge === "l" || edge === "r") {
                        frameR.position.x += thickness * .5 * (edge === "l" ? -1. : 1.)
                        frameR.scale.x = thickness
                        frameR.scale.y = rect.scale.y + thickness * 2.
                    }
                        
                    if (edge === "t" || edge === "b"){
                        frameR.position.y += thickness * .5 * (edge === "t" ? 1. : -1.)
                        frameR.scale.y = thickness
                        frameR.scale.x = rect.scale.x + thickness * 2.
                    }
                })
            }
        }

        {
            if (params.x)
                rect.position.x = params.x
            if (params.y)
                rect.position.y = params.y
            if (params.z)
                rect.position.z = params.z
            if (params.w)
                rect.mesh.scale.x = params.w
            if (params.h)
                rect.mesh.scale.y = params.h

            if (params.getPosition) {
                updateFunctions.push(() => {
                    params.getPosition(rect.position)
                })
            }
            if (params.getScale) {
                updateFunctions.push(() => {
                    params.getScale(rect.scale)
                })
            }

            if (params.haveIntendedPosition) {
                rect.intendedPosition = new THREE.Vector3().copy(rect.position)
                updateFunctions.push(() => {
                    rect.position.x += (rect.intendedPosition.x - rect.position.x) * .1
                    rect.position.y += (rect.intendedPosition.y - rect.position.y) * .1
                })
            }

            if (params.haveIntendedScale) {
                rect.intendedScale = new THREE.Vector3().copy(rect.scale)
                updateFunctions.push(() => {
                    rect.scale.x += (rect.intendedScale.x - rect.scale.x) * .1
                    rect.scale.y += (rect.intendedScale.y - rect.scale.y) * .1
                })
            }
        }

        {
            if (params.onClick)
                rect.onClick = params.onClick

            rect.pointInside = (p) => {
                v0.copy(p)

                rect.mesh.updateMatrixWorld()
                rect.mesh.worldToLocal(v0)
                if (-.5 < v0.x && v0.x < .5 &&
                    -.5 < v0.y && v0.y < .5)
                    return true
                else
                    return false
            }
            rect.mouseInside = () => {
                return rect.pointInside(mouse.position)
            }
        }

        return rect
    }
}