const cameraTop = 10.
const camera = new THREE.OrthographicCamera(-10., 10., cameraTop, -cameraTop, 1, 100);
camera.position.z = 10.
scene.add(camera);

function initWindowResize()
{
	//we're going to keep the height as 10 and -10

	function respondToResize(event) {
		if (event !== undefined)
			event.preventDefault()

		renderer.setPixelRatio(window.devicePixelRatio)

		renderer.setSize(window.innerWidth, window.innerHeight);
		camera.aspect = window.innerWidth / window.innerHeight;

		camera.right = camera.aspect * cameraTop
		camera.left = -camera.aspect * cameraTop

		camera.updateProjectionMatrix();
	}
	window.addEventListener('resize', respondToResize, false);
	respondToResize();
}