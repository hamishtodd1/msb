//Would also be nice if people could get in with a web link

socket.on("serverConnected", () =>
{
	log("connected")

	initSound()

	let newGameButton = document.getElementById('newGameButton')
	newGameButton.onclick = () => {

		//would be nice to have this but it has to be IN this function but what if the id is rejected?
		// let sound = sounds["newSuspect"]
		// sound.currentTime = 0.
		// let soundPromise = sound.play()
		// soundPromise.then(function () { }).catch(function () { })

		socket.emit("gameInitializationRequest", {
			playerId: window.localStorage.playerId ? window.localStorage.playerId : null
		})
	}

	let textBox = document.getElementById('gameIdBox')
	textBox.autofocus = true;
	for (let i = 0, il = document.body.children.length; i < il; i++) {
		if (document.body.children[i].localName === "canvas" || document.body.children[i].localName === "textarea")
			document.body.removeChild(document.body.children[i]);
	}

	function onGameIdSubmit() {
		log("submitting")
		let requestedGameKey = textBox.value.replace(/\s/g, "").toLowerCase()

		socket.emit("gameEntryRequest", {
			requestedGameKey,
			playerId: window.localStorage.playerId ? window.localStorage.playerId : null
		})
	}

	let enterGameButton = document.getElementById('enterGameButton')
	enterGameButton.onclick = () =>{
		// let sound = sounds["newSuspect"]
		// sound.currentTime = 0.
		// let soundPromise = sound.play()
		// soundPromise.then(function () { }).catch(function () { })

		onGameIdSubmit()
	}

	function onButtonPress(event) {
		if(event.keyCode !== 13)
			return;

		// let sound = sounds["newSuspect"]
		// sound.currentTime = 0.
		// let soundPromise = sound.play()
		// soundPromise.then(function () { }).catch(function () { })

		onGameIdSubmit()
	}

	socket.on("gameInvitation", function (msg) {
		log("invited")
		document.removeEventListener("keydown", onButtonPress);

		socket.playerId = msg.playerId
		window.localStorage.playerId = socket.playerId

		while(document.body.children.length)
			document.body.removeChild(document.body.children[document.body.children.length-1]);

		document.body.style.margin = 0
		document.body.style.padding = 0
		document.body.style.overflow = "hidden"

		init(socket, msg.gameId);
	});

	if (0) {
		textBox.value = 0
		enterGameButton.onclick()
	}
	else
		document.addEventListener("keydown", onButtonPress)
});