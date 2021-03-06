const cameraTop = VISIBLE_AREA_HEIGHT / 2.
const camera = new THREE.OrthographicCamera(-10., 10., cameraTop, -cameraTop, 1, 100);
camera.position.z = 10.
scene.add(camera);

camera.getTop = () => {
	return camera.rotation.z === 0. ? camera.top : camera.right
}
camera.getBottom = () => {
	return camera.rotation.z === 0. ? camera.bottom : camera.left
}
camera.getRight = () => {
	return camera.rotation.z === 0. ? camera.right : camera.top
}
camera.getLeft = () => {
	return camera.rotation.z === 0. ? camera.left : camera.bottom
}

function initWindowResize() {
	//we're going to keep the height as 10 and -10

	function respondToResize(event) {
		if (event !== undefined)
			event.preventDefault()

		renderer.setPixelRatio(window.devicePixelRatio)

		let width = window.innerWidth
			|| document.documentElement.clientWidth
			|| document.body.clientWidth;

		let height = window.innerHeight
			|| document.documentElement.clientHeight
			|| document.body.clientHeight;

		renderer.setSize(width, height);

		if (width > height) {
			camera.aspect = width / height

			camera.rotation.z = 0.

			camera.right = cameraTop * camera.aspect
			camera.left = -cameraTop * camera.aspect

			camera.top = cameraTop
			camera.bottom = -cameraTop //rename this shit
		}
		else {
			camera.aspect = height / width

			camera.top = cameraTop * camera.aspect
			camera.bottom = -cameraTop * camera.aspect

			camera.right = cameraTop
			camera.left = -cameraTop

			camera.rotation.z = Math.PI / 2.
		}

		camera.updateProjectionMatrix()
	}
	window.addEventListener('resize', respondToResize, false)
	respondToResize()
	document.body.appendChild(renderer.domElement)
}