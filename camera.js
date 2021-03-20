async function initCamera() {

    const video = document.createElement('video');
    {
        video.autoplay = false
        const mediaConfig = { video: { facingMode: "environment" } };
        const errBack = function (e) {
            console.log('An error has occurred!', e)
        };

        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            navigator.mediaDevices.getUserMedia(mediaConfig).then(function (stream) {
                video.srcObject = stream;
                log(stream)
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
            let dimension = Math.min(camera.getTop() * 2., camera.getRight() * 2.,)
            target.x = dimension
            target.y = dimension
        }
    })

    newSuspectButton = Rectangle({
        label: ["new", "suspect"],
        haveIntendedPosition: true,
        haveFrame: true,
        frameOnly: true,
        z: -5.,
        getScale: (target) => {
            target.x = suspectPanelDimensionsMr.offset.x
            target.y = suspectPanelDimensionsMr.offset.y
        },
        onClick: () => {
            setCameraStuffVisibility(true)
        }
    })

    updateFunctions.push(() => {
        newSuspectButton.intendedPosition.x = getPanelPositionX(suspects.length)

        let totalSuspects = 0
        suspects.forEach((s) => { totalSuspects += s.onBoard ? 1 : 0 })
        newSuspectButton.visible = cameraFeedRect.visible === false && totalSuspects < pm.maxSuspects

        if (frameCount === 0)
            newSuspectButton.goToIntendedPosition()
    })

    function takePicture() {
        setCameraStuffVisibility(false)

        //no fucking idea why but this shit needs to be in here!
        const videoCaptureCanvas = document.createElement('canvas')
        videoCaptureCanvas.width = 128
        videoCaptureCanvas.height = 128
        const ctx = videoCaptureCanvas.getContext('2d')
        ctx.drawImage(video, 0, 0, 128, 128)

        socket.emit("new suspect portrait", {
            portraitImageSrc: videoCaptureCanvas.toDataURL("image/png")
        })
    }

    let takePictureButton = null
    new THREE.TextureLoader().load("assets/takePicture.png", (map) => {
        takePictureButton = Rectangle({
            x: -0., y: -8., w: 3., h: 3., z: 6.,
            map,
            col: 0xFF0000,
            visible: false,
            onClick: takePicture
        })
    })

    setCameraStuffVisibility = (val) => {
        cameraFeedRect.visible = val
        takePictureButton.visible = val
        closeButton.visible = val
        newSuspectButton.visible = !val

        if (val)
            video.play()
        else
            video.pause()
    }

    let closeButton = null
    {
        let cbDimension = 2.
        new THREE.TextureLoader().load("assets/close.png", (map) => {
            closeButton = Rectangle({
                w: cbDimension, h: cbDimension, z: 6.,
                map,
                visible: false,
                getPosition: (target) => {
                    cameraFeedRect.getCorner("tr", target)
                    target.x -= cbDimension / 2.
                    target.y -= cbDimension / 2.
                },
                onClick: () => {
                    setCameraStuffVisibility(false)
                }
            })
        })
    }
}