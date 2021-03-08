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
    const cameraFeedRect = Rectangle({
        map: videoTexture,
        visible: false,
        x: 0., y: 0., z: 5.,
        w: video.videoWidth, 
        h: video.videoHeight,
        getScale: (target) => {
            let dimension = Math.min(camera.top * 2., camera.right * 2.,)
            target.x = dimension
            target.y = dimension
        }
    })

    newSuspectButton = Rectangle({
        label: "new suspect",
        haveIntendedPosition: true,
        hasFrame: true,
        frameOnly: true,
        z: -5.,
        getScale:(target) => {
            target.x = suspectPanelDimensionsMr.offset.x
            target.y = suspectPanelDimensionsMr.offset.y
        },
        onClick: () => {
            // flipToOtherCameraButton.visible = true
            cameraFeedRect.visible = true
            takePictureButton.visible = true
            newSuspectButton.visible = false
        }
    })

    updateFunctions.push(()=>{
        newSuspectButton.intendedPosition.x = getPanelPositionX( suspects.length )

        let totalSuspects = 0
        suspects.forEach((s)=>{totalSuspects += s === undefined ? 0 : 1})
        newSuspectButton.visible = cameraFeedRect.visible === false && totalSuspects < pm.maxSuspects

        if(frameCount === 0)
            newSuspectButton.goToIntendedPosition()
    })

    // const flipToOtherCameraButton = Rectangle({
    //     x: 0., y: -5, w: 3., h: 1., z: 6.,
    //     col: 0x00FFFF,
    //     visible: false,
    //     onClick: () => {
    //         alert("sorry, don't know how to do this yet")
    //     }
    // })

    function takePicture() {
        // flipToOtherCameraButton.visible = false
        cameraFeedRect.visible = false
        takePictureButton.visible = false
        newSuspectButton.visible = true

        //no fucking idea why but this shit needs to be in here!
        const videoCaptureCanvas = document.createElement('canvas')
        videoCaptureCanvas.width = video.videoWidth
        videoCaptureCanvas.height = video.videoHeight
        const ctx = videoCaptureCanvas.getContext('2d')
        ctx.drawImage(video, 0, 0, video.videoWidth, video.videoHeight)

        let msg = {
            portraitImageSrc: videoCaptureCanvas.toDataURL("image/png")
        }
        socket.emit("new suspect", msg )
    }

    const takePictureButton = Rectangle({
        x: -0., y: -3, w: 3., h: 1., z: 6.,
        label: "take picture",
        col: 0x00FF00,
        visible: false,
        onClick: takePicture
    })

    // updateFunctions.push(() => {
    //     if (frameCount === 20 && suspects.length === 0)
    //         socket.emit("new suspect", {})
    // })
}