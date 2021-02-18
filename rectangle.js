function Rectangle(params) {
    const rect = {}
    rectangles.push(rect)

    {
        let mat = params.mat ?
            params.mat :
            new THREE.MeshBasicMaterial()

        if (params.map)
            mat.map = params.map

        if (params.col)
            mat.color.setHex( params.col )

        rect.mesh = new THREE.Mesh(unitSquareGeo, mat)
        scene.add(rect.mesh)
        rect.position = rect.mesh.position
        rect.scale = rect.mesh.scale
    }

    if (params.intendedPosition ) {
        rect.intendedPosition = params.intendedPosition
        updateFunctions.push(()=>{
            rect.position.lerp(rect.intendedPosition,.1)
        })
    }
    if (params.intendedScale) {
        rect.intendedScale = params.intendedScale
        updateFunctions.push(() => {
            rect.scale.lerp(rect.intendedScale, .1)
        })
    }

    if(params.visible !== undefined)
        rect.mesh.visible = params.visible

    if(params.x)
        rect.position.x = params.x
    if (params.y)
        rect.position.y = params.y
    if(params.z)
        rect.position.z = params.z
    if (params.w)
        rect.mesh.scale.x = params.w
    if (params.h)
        rect.mesh.scale.y = params.h

    if (params.onClick) {
        rect.onClick = params.onClick
    }

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

    return rect
}