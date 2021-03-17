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

		function onButtonPress(event)
		{
			if(event.keyCode !== 13)
				return;

			var requestedRoomKey = textBox.value.replace(/\s/g, "");
			requestedRoomKey.toLowerCase()

			if( requestedRoomKey.length === 2 ) {
				socket.emit("roomEntryRequest", { 
					requestedRoomKey, 
					storedId: window.localStorage.playerId || null
				});
				//and show something saying "waiting to be let in"
			}
			else
				textBox.value = "Sorry, request was not recognized"
		}

		if( 0 ) {
			textBox.value = "oo"
			onButtonPress({keyCode:13});
		}
		else
			document.addEventListener( "keydown", onButtonPress );

		socket.on("roomInvitation", function (msg) {
			document.removeEventListener("keydown", onButtonPress);

			socket.playerId = msg.playerId

			while(document.body.children.length)
				document.body.removeChild(document.body.children[document.body.children.length-1]);

			document.body.style.margin = 0
			document.body.style.padding = 0
			document.body.style.overflow = "hidden"

			socket.on("roomInvitation", () => {
				window.location.reload()
			});

			init(socket, msg.roomId);
			//you don't need to give socketId, it has that!
		});
	});
})();