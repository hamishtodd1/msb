//Would also be nice if people could get in with a web link

socket.on("serverConnected", () =>
{
	let newGameButton = document.getElementById('newGameButton')
	newGameButton.onclick = () => {
		socket.emit("gameInitializationRequest", {
			playerId: window.localStorage.playerId ? window.localStorage.playerId : null
		})
	}

	var textBox = document.getElementById('gameIdBox')
	textBox.autofocus = true;
	for (var i = 0, il = document.body.children.length; i < il; i++) {
		if (document.body.children[i].localName === "canvas" || document.body.children[i].localName === "textarea")
			document.body.removeChild(document.body.children[i]);
	}

	function onGameIdSubmit() {
		var requestedGameKey = textBox.value.replace(/\s/g, "");
		requestedGameKey.toLowerCase()

		socket.emit("gameEntryRequest", {
			requestedGameKey,
			playerId: window.localStorage.playerId ? window.localStorage.playerId : null
		})
	}

	let enterGameButton = document.getElementById('enterGameButton')
	enterGameButton.onclick = onGameIdSubmit

	function onButtonPress(event) {
		if(event.keyCode !== 13)
			return;

		onGameIdSubmit()
	}

	if( 1 ) {
		textBox.value = 0
		onGameIdSubmit()
	}
	else
		document.addEventListener( "keydown", onButtonPress );

	socket.on("gameInvitation", function (msg) {
		document.removeEventListener("keydown", onButtonPress);

		socket.playerId = msg.playerId
		window.localStorage.playerId = socket.playerId

		while(document.body.children.length)
			document.body.removeChild(document.body.children[document.body.children.length-1]);

		document.body.style.margin = 0
		document.body.style.padding = 0
		document.body.style.overflow = "hidden"

		init(socket, msg.gameId);
		//you don't need to give socketId, it has that!
	});
});