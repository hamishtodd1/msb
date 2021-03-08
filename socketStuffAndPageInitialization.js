//Would also be nice if people could get in with a web link

(function()
{
	socket.on( "logThisMessage", function(msg)
	{
		console.log(msg);
	});
	
	socket.on("serverConnected", function()
	{
		var defaultTextBoxContent = "Delete this text then enter one of the following:\n1. Session ID number (if someone has already set up a room)\n2. oo to get into the test room\n\nThen press enter";

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

			var request = textBox.value.replace(/\s/g, "");
			request.toLowerCase()

			if( request.length === 2 ) {
				socket.emit("roomEntryRequest", request);
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

			init(socket, roomInformation.ourID);
		});
	});
})();