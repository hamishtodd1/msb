//should be possible easily with the draw thing
//show the square

async function initCamera(suspectPositionY) {

    setCameraStuffVisibility = () => {}

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
                setEverythingUp()
            });
        }
        /* Legacy code below! */
        else if (navigator.getUserMedia) { // Standard
            navigator.getUserMedia(mediaConfig, function (stream) {
                video.src = stream;
                setEverythingUp()
            }, errBack);
        } else if (navigator.webkitGetUserMedia) { // WebKit-prefixed
            navigator.webkitGetUserMedia(mediaConfig, function (stream) {
                video.src = window.webkitURL.createObjectURL(stream);
                setEverythingUp()
            }, errBack);
        } else if (navigator.mozGetUserMedia) { // Mozilla-prefixed
            navigator.mozGetUserMedia(mediaConfig, function (stream) {
                video.src = window.URL.createObjectURL(stream);
                setEverythingUp()
            }, errBack);
        }
    }

    function setEverythingUp() {
        const videoTexture = new THREE.VideoTexture(video)
        videoTexture.minFilter = THREE.LinearFilter
        const cameraFeedRect = Rectangle({
            map: videoTexture,
            x: 0., y: 0., z: 8.5,
            getScale: (target) => {
                target.y = Math.min(camera.getTop() * 2., camera.getRight() * 2.,)
                
                target.x = target.y * (video.videoWidth / video.videoHeight)
            }
        })

        let cocMat = new THREE.MeshBasicMaterial({ transparent: true, opacity: .0001 })
        let clickOutCatcher = Rectangle({
            mat: cocMat,
            z: cameraFeedRect.position.z - 2.,
            w: 60., h: 20.,
            onClick: () => {
                setCameraStuffVisibility(false)
            }
        })

        newSuspectButton = Rectangle({
            label: ["new", "bets"],
            haveIntendedPosition: true,
            haveFrame: true,
            frameOnly: true,
            z: -5.,
            getScale: (target) => {
                target.x = suspectPanelDimensions.x
                target.y = suspectPanelDimensions.y
            },
            onClick: () => {
                if(judgementMode)
                    return
                    
                setCameraStuffVisibility(true)
            }
        })

        updateFunctions.push(() => {
            newSuspectButton.intendedPosition.x = getPanelPositionX(suspects.length)

            newSuspectButton.position.y = suspectPositionY

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
            //90 * 90 < 8192, power of 2
            videoCaptureCanvas.width = 90
            videoCaptureCanvas.height = 90
            const ctx = videoCaptureCanvas.getContext('2d')

            let widthThatGetsCut = Math.round(90 * (video.videoWidth / video.videoHeight))
            let placeToPutLeft = Math.round(videoCaptureCanvas.width / 2. - widthThatGetsCut / 2.)
            ctx.drawImage(video, placeToPutLeft, 0, widthThatGetsCut, 90)

            socket.emit("new suspect portrait", {
                portraitImageSrc: videoCaptureCanvas.toDataURL("image/png")
            })
        }

        let tpbMat = new THREE.MeshBasicMaterial()
        let takePictureButton = Rectangle({
            x: -0., y: -8., w: 4.5, h: 4.5, z: cameraFeedRect.position.z + .2,
            mat: tpbMat,
            col: 0xFF0000,
            onClick: takePicture
        })
        new THREE.TextureLoader().load("assets/takePicture.png", (map) => {
            tpbMat.map = map
            tpbMat.needsUpdate = true
        })

        let square = Rectangle({
            frameOnly: true,
            haveFrame: true,
            w: 19.5, h: 19.5,
            z: cameraFeedRect.position.z + .2
        })

        let cbMat = new THREE.MeshBasicMaterial()
        let cbDimension = 2.
        let closeButton = Rectangle({
            w: cbDimension, h: cbDimension, z: cameraFeedRect.position.z + .2,
            mat: cbMat,
            getPosition: (target) => {
                cameraFeedRect.getCorner("tr", target)
                target.y -= cbDimension / 2.
                target.x -= cbDimension / 2.

                target.x = Math.min(target.x, camera.getRight() - cbDimension / 2.)
            },
            onClick: () => {
                setCameraStuffVisibility(false)
            }
        })
        new THREE.TextureLoader().load("assets/close.png", (map) => {
            cbMat.map = map
            cbMat.needsUpdate = true
        })

        setCameraStuffVisibility = (val) => {
            cameraFeedRect.visible = val
            takePictureButton.visible = val
            closeButton.visible = val
            clickOutCatcher.visible = val
            square.visible = val

            if (val)
                video.play()
            else
                video.pause()
        }

        setCameraStuffVisibility(false)
    }
}

//need to do camera rotation for camera feed rect