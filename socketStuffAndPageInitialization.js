//Would also be nice if people could get in with a web link

(function()
{
	socket.on( "logThisMessage", function(msg)
	{
		console.log(msg);
	});
	
	socket.on("serverConnected", function()
	{
		var defaultTextBoxContent = `
		Delete this text then enter one of the following:
			1. Session ID number (if someone has already set up a room)
			2. oo to get into the test room
			
		Then press enter.
		
		1. At any time, any player can say "New suspect", and the show MUST be paused for a picture to be taken
		2. When, and ONLY WHEN, the credits roll, guilty suspects shall have their colors turned green
		3. That done, the player who owns the most green is the winner

		The World's Shortest Murder Mystery (use this as a practice)`
		// [embed a video of a game]

		var textBox = document.createElement("TEXTAREA");
		textBox.cols = 100;
		textBox.rows = 8;
		textBox.autofocus = true;
		textBox.value = defaultTextBoxContent;
		for(var i = 0, il = document.body.children.length; i < il; i++ ) {
			if( document.body.children[i].localName === "canvas" || document.body.children[i].localName === "textarea")
				document.body.removeChild(document.body.children[i]);
		}
		document.body.appendChild( textBox );

		function onButtonPress(event)
		{
			if(event.keyCode !== 13)
				return;

			var requestedRoomKey = textBox.value.replace(/\s/g, "");
			requestedRoomKey.toLowerCase()

			if(window.localStorage.playerId === undefined )
				window.localStorage.playerId = socket.playerId
			socket.playerId = window.localStorage.playerId

			if( requestedRoomKey.length === 2 ) {
				socket.emit("roomEntryRequest", { requestedRoomKey, playerId: socket.playerId});
				//and show something saying "waiting to be let in"
			}
			else
				textBox.value = "Sorry, request was not recognized"
		}

		if( 1 ) {
			textBox.value = "oo"
			onButtonPress({keyCode:13});
		}
		else
			document.addEventListener( "keydown", onButtonPress );

		socket.on("roomInvitation", function (roomInformation) {
			document.removeEventListener("keydown", onButtonPress);

			for (var i = 0, il = document.body.children.length; i < il; i++) {
				if (document.body.children[i].localName === "textarea")
					document.body.removeChild(document.body.children[i]);
			}

			socket.on("roomInvitation", () => {
				window.location.reload()
			});

			init(socket, roomInformation.roomId);
			//you don't need to give socketId, it has that!
		});
	});
})();