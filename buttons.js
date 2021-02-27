/*
	Send to haxiomic/mrdoob/wannerstedt, get "make it nicer looking for free by doing this:"
	
	Make something with bloody puzzles
	The youtube thing is a colossal perverse incentive
		Subtleties in interactive learning is your raison d'etre, but here we are, making something non-interactive
*/

function initButtons()
{
	let buttons = {}

	let modifiedButtons = {}
	bindButton = function( buttonName, onDown, buttonDescription,whileDown,ctrlKey ) {
		let collectionToAddTo = ctrlKey ? modifiedButtons : buttons

		if(collectionToAddTo[buttonName] !== undefined)
			console.error("attempted to bind a button that already has a binding: ", buttonName)

		if(buttonDescription !== undefined)
			console.log("\n",buttonName + ": " + buttonDescription)

		collectionToAddTo[buttonName] = {
			down: false,
			onDown: onDown
		}
		if(whileDown)
			collectionToAddTo[buttonName].whileDown = whileDown
	}

	//don't use ctrl or other things that conflict
	document.addEventListener( 'keydown', function(event) {
		let button = event.ctrlKey ? modifiedButtons[event.key] : buttons[event.key]

		if(button !== undefined && !button.down) {
			event.preventDefault()
			
			button.onDown()
			button.down = true

			if(event.key !== "v") //paste
				event.preventDefault()
		}
	}, false );
	document.addEventListener( 'keyup', function(event) {
		if (buttons[event.key] !== undefined)
			buttons[event.key].down = false
		if (modifiedButtons[event.key] !== undefined)
			modifiedButtons[event.key].down = false
	}, false );

	updateFunctions.push(function() {
		for(var buttonName in buttons ) {
			if( buttons[buttonName].down && buttons[buttonName].whileDown )
				buttons[buttonName].whileDown()
		}
	})

	//inputSimulator
	if(0) {
		console.warn("Simulating input...")

		let timer = 0
		let framesBetweenInputs = 3
		let inputsSoFar = 0
		// let inputs = ["enter", "down", "enter", "up", "up"]
		// let inputs = ["right", "enter", "up", "enter", "enter", ".9",
		// 	// "enter", "enter", "right", "enter"
		// ]
		let inputs = ["Enter", "Enter", "Enter"]

		let counter = -1.

		updateFunctions.push(function () {
			if ( inputsSoFar < inputs.length && frameCount !== 0 && frameCount % framesBetweenInputs === 0) {
				if (buttons[inputs[inputsSoFar]] === undefined) {
					if (counter === -1)
						counter = 0.
					counter += frameDelta
					if (counter > parseFloat(inputs[inputsSoFar]) )
						++inputsSoFar
				}
				else {
					buttons[inputs[inputsSoFar]].onDown()
					++inputsSoFar
				}
			}
		})
	}
}