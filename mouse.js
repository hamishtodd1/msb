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

		if(mouse.clicking && !mouse.oldClicking) {
			let highestR = null
			let highestZ = -Infinity
			for(let i = 0; i < rectangles.length; ++i) {
				let r = rectangles[i]
				if (r.onClick !== undefined && r.mouseInside() && r.visible && r.position.z > highestZ) {
					highestR = r
					highestZ = r.position.z
				}
			}

			if( highestR !== null && highestR.onClick !== undefined)
				highestR.onClick()
		}
	}

	let a = new THREE.Mesh(new THREE.SphereGeometry(.5))
	scene.add(a)

	//We assume that you are looking directly at the xy plane, and that the renderer is the view dimensions
	asynchronous.updateFromClientCoordinates = function(rawX,rawY)
	{
		//center
		asynchronous.position.x = rawX - ( window.innerWidth / 2 );
		asynchronous.position.y = -rawY+ ( window.innerHeight/ 2 );
		
		//scale
		asynchronous.position.x /= window.innerWidth / 2;
		asynchronous.position.y /= window.innerHeight / 2;

		if (camera.rotation.z !== 0.) {
			let temp = asynchronous.position.y
			asynchronous.position.y = asynchronous.position.x
			asynchronous.position.x = -temp
		}
		
		var centerToFrameVertical = (camera.getTop() - camera.getBottom()) / 2;
		var centerToFrameHorizontal = centerToFrameVertical * camera.aspect;
		
		asynchronous.position.x *= centerToFrameHorizontal;
		asynchronous.position.y *= centerToFrameVertical;

		a.position.copy(asynchronous.position)
		a.position.z = 0.

		// log(asynchronous.position)
	}

	{
		document.addEventListener('mousemove', function (event) {
			event.preventDefault();
			asynchronous.updateFromClientCoordinates(event.clientX, event.clientY)
		})

		document.addEventListener('mousedown', function (event) {
			event.preventDefault();
			asynchronous.clicking = true;
			asynchronous.updateFromClientCoordinates(event.clientX, event.clientY)
		})

		document.addEventListener('mouseup', function (event) {
			event.preventDefault();
			asynchronous.clicking = false;
		})
	}

	{
		document.addEventListener( 'touchstart', function(event) {
			event.preventDefault();
			asynchronous.clicking = true;
			asynchronous.updateFromClientCoordinates(event.changedTouches[0].clientX,event.changedTouches[0].clientY)
		})
		document.addEventListener( 'touchmove', function( event ) {
			event.preventDefault();
			asynchronous.updateFromClientCoordinates(event.changedTouches[0].clientX,event.changedTouches[0].clientY)
		})
		document.addEventListener( 'touchend', function(event) {
			event.preventDefault();
			asynchronous.clicking = false;
		})
	}
}