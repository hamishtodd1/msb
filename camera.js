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
    screenRect.visible = false
    updateFunctions.push(()=>{
        let dimension = Math.min(camera.top * 2., camera.right * 2.,)
        screenRect.scale.set(dimension,dimension,1.)
    })

    newSuspectButton = Rectangle({
        label: "new suspect",
        haveIntendedPosition: true
    })

    newSuspectButton.onClick = () => {
        screenRect.visible = true
        // flipToOtherCameraButton.visible = true
        takePictureButton.visible = true
    }

    updateFunctions.push(()=>{
        newSuspectButton.intendedPosition.x = getPanelPositionX( suspects.length )

        newSuspectButton.intendedPosition.x += 
            suspects.length * (suspectPanelDimensionsMr.offset.x)

        newSuspectButton.scale.x = suspectPanelDimensionsMr.offset.x
        newSuspectButton.scale.y = suspectPanelDimensionsMr.offset.x

        if(frameCount === 0) {
            newSuspectButton.position.x = newSuspectButton.intendedPosition.x
            newSuspectButton.position.y = newSuspectButton.intendedPosition.y
        }
    })

    /**
     * The plan is: you have a function getTweakable("variableName")
     * The tweakables are all shown in a ui, you can change them
     * 
     * Possibly better would be hidable rects that you can grab in place and resize
     */

    const flipToOtherCameraButton = Rectangle({
        x: 0., y: -5, w: 3., h: 1., z: 6.,
        col: 0x00FFFF,
        visible: false,
        onClick: () => {
            alert("sorry, don't know how to do this yet")
        }
    })

    const takePictureButton = Rectangle({
        x: -0., y: -3, w: 3., h: 1., z: 6.,
        label: "take picture",
        col: 0x00FF00,
        visible: false,
        onClick: () => {
            screenRect.visible = false
            flipToOtherCameraButton.visible = false
            takePictureButton.visible = false

            const canvas = document.createElement('canvas')
            canvas.width  = video.videoWidth
            canvas.height = video.videoHeight
            const ctx = canvas.getContext('2d')
            ctx.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);

            const portrait = Rectangle({
                map: new THREE.CanvasTexture(canvas),
                x: screenRect.position.x,
                y: screenRect.position.y,
                w: screenRect.scale.x,
                h: screenRect.scale.y,
                hasFrame: true
            })

            Suspect(portrait)
        }
    })
}