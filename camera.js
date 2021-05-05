async function initCamera() {

    let portraitRejectedSign = temporarilyVisibleWarningSign("Portrait rejected")
    socket.on("portrait rejected", () => {
        portraitRejectedSign.timeVisible = 3.
    })

    let noCameraSign = temporarilyVisibleWarningSign(["Camera rejected","or unavailable"])

    setCameraStuffVisibility = () => {}

    let cameraSetUpAttemptMade = false

    newSuspectButton = Rectangle({
        // label: ["new", "bets"],
        haveIntendedPosition: true,
        haveFrame: true,
        frameOnly: true,
        z: -5.,
        getScale: (target) => {
            target.x = suspectPanelDimensions.x
            target.y = suspectPanelDimensions.y
        },
        onClick: () => {
            if(cameraSetUpAttemptMade) {
                setCameraStuffVisibility(true)
            }
            else {
                cameraSetUpAttemptMade = true
                attemptToSetUpCamera()
            }
        }
    })
    
    let newSuspectMat = new THREE.MeshBasicMaterial({ color: bgColor })
    new THREE.TextureLoader().load("assets/add.png", (map) => {
        newSuspectMat.map = map
        newSuspectMat.needsUpdate = true
    })
    let newSuspectPic = Rectangle({
        mat: newSuspectMat,
        getScale: (target) => {
            target.x = suspectPanelDimensions.x
            target.y = suspectPanelDimensions.x
        },
        getPosition: (target) => {
            target.x = newSuspectButton.position.x
            target.y = newSuspectButton.position.y
        },
        z: newSuspectButton.position.z - 3.
    })

    updateFunctions.push(() => {
        newSuspectPic.visible = newSuspectButton.visible

        newSuspectButton.intendedPosition.x = getPanelPositionX(suspects.length)

        newSuspectButton.intendedPosition.y = suspectPositionY

        if (frameCount === 0)
            newSuspectButton.goToIntendedPosition()
    })

    const video = document.createElement('video');
    video.setAttribute('autoplay', '')
    video.setAttribute('muted', '')
    video.setAttribute('playsinline', '')

    function attemptToSetUpCamera()
    {
        const mediaConfig = { video: { facingMode: "environment" } };
        const disallowOrImpossibilityFunc = function (e) {
            newSuspectButton.visible = false
            newSuspectPic.visible = false

            noCameraSign.timeVisible = 3.
        };

        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            navigator.mediaDevices.getUserMedia(mediaConfig).then(function (stream) {
                video.srcObject = stream;
                pictureTakingIsNowPossible()
            }).catch(disallowOrImpossibilityFunc);
        }
        /* Legacy code below! */
        else if (navigator.getUserMedia) { // Standard
            navigator.getUserMedia(mediaConfig, function (stream) {
                video.src = stream;
                pictureTakingIsNowPossible()
            }, disallowOrImpossibilityFunc);
        } else if (navigator.webkitGetUserMedia) { // WebKit-prefixed
            navigator.webkitGetUserMedia(mediaConfig, function (stream) {
                video.src = window.webkitURL.createObjectURL(stream);
                pictureTakingIsNowPossible()
            }, disallowOrImpossibilityFunc);
        } else if (navigator.mozGetUserMedia) { // Mozilla-prefixed
            navigator.mozGetUserMedia(mediaConfig, function (stream) {
                video.src = window.URL.createObjectURL(stream);
                pictureTakingIsNowPossible()
            }, disallowOrImpossibilityFunc);
        }
    }

    const videoTexture = new THREE.VideoTexture(video)
    videoTexture.minFilter = THREE.LinearFilter
    let cameraFeedRect = Rectangle({
        map: videoTexture,
        x: 0., y: 0., z: 8.5,
        getScale: (target) => {
            let windowTall = camera.rotation.z !== 0.
            let videoTall = video.videoWidth / video.videoHeight < 1.
            if (!windowTall) {
                if (!videoTall) {
                    target.y = camera.getTop() * 2.
                    target.x = target.y * (video.videoWidth / video.videoHeight)
                    cameraFeedRect.setRotationZ(0.)
                }
                else {
                    target.y = camera.getTop() * 2.
                    target.x = target.y * (video.videoWidth / video.videoHeight)
                    cameraFeedRect.setRotationZ(TAU / 4.)
                }
            }
            else {
                if (!videoTall) {
                    target.x = camera.getTop() * 2.
                    target.y = target.x / (video.videoWidth / video.videoHeight)
                    cameraFeedRect.setRotationZ(TAU / 4.)
                }
                else {
                    target.x = camera.getTop() * 2.
                    target.y = target.x / (video.videoWidth / video.videoHeight)
                    cameraFeedRect.setRotationZ(TAU / 4.)
                }
            }
        }
    })

    let cocMat = new THREE.MeshBasicMaterial({ transparent: true, opacity: .0001 })
    let clickOutCatcher = Rectangle({
        mat: cocMat,
        z: cameraFeedRect.position.z - 2.,
        w: 180., h: 20.,
        onClick: () => {
            setCameraStuffVisibility(false)
        }
    })

    function pictureTakingIsNowPossible() {
        updateFunctions.push(() => {
            let totalSuspects = 0
            suspects.forEach((s) => { totalSuspects += s.onBoard ? 1 : 0 })

            newSuspectButton.visible =
                cameraFeedRect.visible === false &&
                totalSuspects < pm.maxSuspects
        })

        setCameraStuffVisibility(true)
    }

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

    setCameraStuffVisibility = (val) => {
        cameraFeedRect.visible = val
        takePictureButton.visible = val
        clickOutCatcher.visible = val
        square.visible = val

        if (val)
            video.play()
        else
            video.pause()
    }

    // document.addEventListener('paste', function (e) {
    //     if (e.clipboardData) {
    //         var items = e.clipboardData.items;
    //         if (!items) return;

    //         for (var i = 0; i < items.length; i++) {
    //             if (items[i].type.indexOf("image") !== -1) {
    //                 var blob = items[i].getAsFile();
    //                 var URLObj = window.URL || window.webkitURL;
    //                 var source = URLObj.createObjectURL(blob);

    //                 var pastedImage = new Image();
    //                 pastedImage.onload = function () {
    //                     let canvas = document.createElement('canvas')
    //                     let ctx = canvas.getContext('2d')
    //                     canvas.width = pastedImage.width;
    //                     canvas.height = pastedImage.height;
    //                     ctx.drawImage(pastedImage, 0, 0);

    //                     goIntoEditingMode(new THREE.CanvasTexture(canvas))
    //                 }
    //                 pastedImage.src = source;

    //                 e.preventDefault();
    //                 return;
    //             }
    //         }
    //         copiedImageNotFoundSign.material.opacity = 2;
    //     }
    // }, false);

    setCameraStuffVisibility(false)
}