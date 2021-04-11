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

            return target
        }

        rect.goToIntendedPosition = () => {
            rect.position.x = rect.intendedPosition.x
            rect.position.y = rect.intendedPosition.y
        }

        rect.getCorner = function (corner, target) {
            target.x = this.position.x
            target.y = this.position.y

            target.y += this.scale.y / 2. * (corner[0] === "t" ? 1. : -1.)
            target.x += this.scale.x / 2. * (corner[1] === "l" ? -1. : 1.)
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
                let labelLines = typeof params.label === "string" ? [params.label] : params.label

                rect.textMeshes = Array(labelLines.length)
                labelLines.forEach((line,i)=>{
                    rect.textMeshes[i] = text(line, false)
                    scene.add(rect.textMeshes[i])
                })

                updateFunctions.push(() => {
                    let widestTextMesh = getMax(rect.textMeshes, (tm) => { return tm.scale.x })
                    if (!widestTextMesh)
                        return
                    const widestWidth = widestTextMesh.scale.x
                    const intendedWidth = rect.scale.x
                    const scaleMultiple = intendedWidth / widestWidth
                    rect.textMeshes.forEach((tm,i) => {
                        tm.position.x = rect.position.x
                        tm.position.y = rect.position.y + tm.scale.y * -(i-(rect.textMeshes.length-1.)/2.)
                        tm.position.z = rect.position.z + .05

                        tm.visible = rect.visible

                        tm.scale.multiplyScalar(scaleMultiple)

                        tm.position.z = rect.position.z
                    })

                    if(params.getScaleFromLabel ) {
                        let widestAspect = -1.
                        rect.textMeshes.forEach((tm)=>{
                            widestAspect = Math.max(widestAspect,tm.material.getAspect())
                        })
                        rect.scale.x = widestAspect * rect.scale.y / rect.textMeshes.length
                    }
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
                    if (rect.textMeshes !== undefined)
                        rect.textMeshes.forEach((tm)=>{tm.visible = newVal})
                }
            }
        }

        if (params.frameThickness || params.haveFrame) {
            rect.frameThickness = .05
            rect.edges = Array(4)
            for(let i = 0; i < 4; ++i) {
                const edge = tblr[i]
                let frameR = Rectangle({
                    mat: blackMaterial
                })
                rect.edges[i] = frameR
                
                updateFunctions.push(()=>{
                    rect.getEdgeCenter(edge,frameR.position)

                    frameR.position.z = rect.position.z + (params.frameZ === undefined ? 0. : params.frameZ)
                    if (edge === "l" || edge === "r") {
                        frameR.position.x += rect.frameThickness * .5 * (edge === "l" ? -1. : 1.)
                        frameR.scale.x = rect.frameThickness
                        frameR.scale.y = rect.scale.y + rect.frameThickness * 2.
                    }
                        
                    if (edge === "t" || edge === "b"){
                        frameR.position.y += rect.frameThickness * .5 * (edge === "t" ? 1. : -1.)
                        frameR.scale.y = rect.frameThickness
                        frameR.scale.x = rect.scale.x + rect.frameThickness * 2.
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