async function initCamera() {

    const video = document.createElement('video');
    {
        video.autoplay = true
        const mediaConfig = { video: true, facingMode: "environment" };
        const errBack = function (e) {
            console.log('An error has occurred!', e)
        };

        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            navigator.mediaDevices.getUserMedia(mediaConfig).then(function (stream) {
                video.srcObject = stream;
                video.play();
            });
        }
        /* Legacy code below! */
        else if (navigator.getUserMedia) { // Standard
            navigator.getUserMedia(mediaConfig, function (stream) {
                video.src = stream;
                video.play();
            }, errBack);
        } else if (navigator.webkitGetUserMedia) { // WebKit-prefixed
            navigator.webkitGetUserMedia(mediaConfig, function (stream) {
                video.src = window.webkitURL.createObjectURL(stream);
                video.play();
            }, errBack);
        } else if (navigator.mozGetUserMedia) { // Mozilla-prefixed
            navigator.mozGetUserMedia(mediaConfig, function (stream) {
                video.src = window.URL.createObjectURL(stream);
                video.play();
            }, errBack);
        }
    }

    const videoTexture = new THREE.VideoTexture(video)
    videoTexture.minFilter = THREE.LinearFilter
    const screenRect = Rectangle({
        map: videoTexture,
        visible:false,
        x: 0., y: 0., w: 8., h: 8., z: 5.
    })
    screenRect.mesh.visible = false

    const newSuspectButton = Rectangle({
        x: -4., y: -4.,
        w: 2., h: 2.,
        onClick: () => {
            screenRect.mesh.visible = true
            // flipToOtherCameraButton.mesh.visible = true
            takePictureButton.mesh.visible = true
        }
    })

    // const flipToOtherCameraButton = Rectangle({
    //     x: 5., y: -3, w: 3., h: 1., z: 6.,
    //     col: 0x00FFFF,
    //     visible: false,
    //     onClick: () => {
    //         alert("sorry, don't know how to do this yet")
    //     }
    // })

    const takePictureButton = Rectangle({
        x: -0., y: -3, w: 3., h: 1., z: 6.,
        col: 0x00FF00,
        visible: false,
        onClick: () => {
            screenRect.mesh.visible = false
            // flipToOtherCameraButton.mesh.visible = false
            takePictureButton.mesh.visible = false

            const canvas = document.createElement('canvas')
            canvas.width  = video.videoWidth
            canvas.height = video.videoHeight
            const ctx = canvas.getContext('2d')
            ctx.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);

            Rectangle({
                map: new THREE.CanvasTexture(canvas),
                x: screenRect.position.x, 
                y: screenRect.position.y,
                w: screenRect.scale.x,
                h: screenRect.scale.y,

                intendedPosition: new THREE.Vector3().copy(newSuspectButton.position),
                intendedScale: new THREE.Vector3().copy(newSuspectButton.scale)
            })

            newSuspectButton.position.x += 4.
        }
    })
}