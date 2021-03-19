//Would also be nice if people could get in with a web link

(function()
{
	socket.on("serverConnected", () =>
	{
		var textBox = document.getElementById('gameIdBox')
		textBox.autofocus = true;
		for(var i = 0, il = document.body.children.length; i < il; i++ ) {
			if( document.body.children[i].localName === "canvas" || document.body.children[i].localName === "textarea")
				document.body.removeChild(document.body.children[i]);
		}

		let newGameButton = document.getElementById('newGameButton')
		newGameButton.onclick = ()=>{
			socket.emit("gameInitializationRequest", {
				storedId: window.localStorage.playerId || null
			})
		}

		function onButtonPress(event) {
			if(event.keyCode !== 13)
				return;

			log(event.keyCode)

			var requestedGameKey = textBox.value.replace(/\s/g, "");
			requestedGameKey.toLowerCase()

			socket.emit("gameEntryRequest", {
				requestedGameKey,
				storedId: window.localStorage.playerId || null
			})
		}

		if( 1 ) {
			textBox.value = 0
			onButtonPress({keyCode:13});
		}
		else
			document.addEventListener( "keydown", onButtonPress );

		socket.on("gameInvitation", function (msg) {
			socket.on("gameInvitation", () => {
				window.location.reload()
			});

			document.removeEventListener("keydown", onButtonPress);

			socket.playerId = msg.playerId

			while(document.body.children.length)
				document.body.removeChild(document.body.children[document.body.children.length-1]);

			document.body.style.margin = 0
			document.body.style.padding = 0
			document.body.style.overflow = "hidden"

			init(socket, msg.gameId);
			//you don't need to give socketId, it has that!
		});
	});
})();

//one reason for buggy player identification might be that you have a game that finished
//but there's still something there in local storage