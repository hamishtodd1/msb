function initMouse()
{
	mouse = {};
	mouse.position = new THREE.Vector3();
	mouse.oldPosition = new THREE.Vector3();
	mouse.delta = new THREE.Vector3();
	mouse.clicking = false;
	mouse.oldClicking = false;

	var asynchronous = {
		position: new THREE.Vector3(),
		clicking: false,
	}

	mouse.updateFromAsync = function() {
		mouse.oldClicking = mouse.clicking;
		mouse.clicking = asynchronous.clicking;

		mouse.oldPosition.copy(mouse.position);
		mouse.position.copy(asynchronous.position);
		mouse.delta.subVectors(mouse.position, mouse.oldPosition)
	}

	// let a = new THREE.Mesh(new THREE.SphereGeometry(.5))
	// scene.add(a)

	//We assume that you are looking directly at the xy plane, and that the renderer is the view dimensions
	asynchronous.updateFromClientCoordinates = function(rawX,rawY)
	{
		//center
		asynchronous.position.x =  rawX - ( renderer.domElement.width  / window.devicePixelRatio / 2. )
		asynchronous.position.y = -rawY + ( renderer.domElement.height / window.devicePixelRatio / 2. )
		
		//scale
		asynchronous.position.x /= renderer.domElement.width  / window.devicePixelRatio  / 2.
		asynchronous.position.y /= renderer.domElement.height / window.devicePixelRatio  / 2.

		if (camera.rotation.z !== 0.) {
			let temp = asynchronous.position.y
			asynchronous.position.y = asynchronous.position.x
			asynchronous.position.x = -temp
		}
		
		var centerToFrameVertical = (camera.getTop() - camera.getBottom()) / 2.
		var centerToFrameHorizontal = centerToFrameVertical * camera.aspect
		
		asynchronous.position.x *= centerToFrameHorizontal
		asynchronous.position.y *= centerToFrameVertical

		// a.position.copy(asynchronous.position)
		// a.position.z = 0.

		// log(asynchronous.position)
	}

	{
		function onMouseOrFingerDown(event) {
			// event.preventDefault();
			asynchronous.clicking = true;
			let pos = event.changedTouches ? event.changedTouches[0] : event
			asynchronous.updateFromClientCoordinates(pos.clientX, pos.clientY)

			mouse.updateFromAsync()

			let highestR = null
			let highestZ = -Infinity
			for (let i = 0; i < rectangles.length; ++i) {
				let r = rectangles[i]
				if (r.onClick !== undefined && r.mouseInside() && r.visible && r.position.z > highestZ) {
					highestR = r
					highestZ = r.position.z
				}
			}

			if (highestR !== null && highestR.onClick !== undefined) {
				let nameOfSoundToPlay = highestR.onClick()
			}
		}
		
		function forTouch(event) {
			document.removeEventListener('mousedown',forMouse)
			onMouseOrFingerDown(event)
		}
		function forMouse(event) {
			document.removeEventListener('mousedown',forTouch)
			onMouseOrFingerDown(event)
		}
		document.addEventListener('touchstart', forTouch)
		document.addEventListener('mousedown',  forMouse)
		
		document.addEventListener('mouseup', function (event) {
			asynchronous.clicking = false;
			// event.preventDefault();
		})
		document.addEventListener( 'touchend', function(event) {
			asynchronous.clicking = false;
			// event.preventDefault();
		})
		
		document.addEventListener('mousemove', function (event) {
			asynchronous.updateFromClientCoordinates(event.clientX, event.clientY)
			// event.preventDefault();
		})
		document.addEventListener( 'touchmove', function( event ) {
			asynchronous.updateFromClientCoordinates(event.changedTouches[0].clientX,event.changedTouches[0].clientY)
			// event.preventDefault();
		})
	}
}