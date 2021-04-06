function text(initialText,materialOnly)
{
	if (materialOnly === undefined)
		materialOnly = false

	const canvas = document.createElement("canvas");
	const context = canvas.getContext("2d");
	let material = new THREE.MeshBasicMaterial({map: new THREE.CanvasTexture(canvas)});

	let currentText = ""
	material.getText = function () {
		return currentText
	}

	let backGroundColor = "#" + renderer.getClearColor().getHexString()

	material.setColor = function(newColor) {
		if (newColor[0] !== "#")
			console.error("play by the html rules")

		backGroundColor = newColor
	}

	material.setText = function(text) {
		if(currentText === text)
			return

		currentText = text

		let font = "Trebuchet"
		let backgroundMargin = 50;
		let textSize = 100;
		context.font = textSize + "pt " + font;
		let textWidth = context.measureText(text).width;
		canvas.width = textWidth + backgroundMargin;
		canvas.height = textSize + backgroundMargin;

		context.font = textSize + "pt " + font;
		context.textAlign = "center";
		context.textBaseline = "middle";
		
		context.fillStyle = backGroundColor;
		context.fillRect(
			canvas.width / 2 - textWidth / 2 - backgroundMargin / 2, 
			canvas.height / 2 - textSize / 2 - backgroundMargin / 2,
			textWidth + backgroundMargin, 
			textSize + backgroundMargin);
		
		let textColor = "#FFFFFF"
		context.fillStyle = textColor;
		context.fillText(text, canvas.width / 2, canvas.height / 2);

		this.map.needsUpdate = true;

		if( materialOnly === false)
			sign.scale.x = material.getAspect() * sign.scale.y;
	}

	material.getAspect = function() {
		return canvas.width / canvas.height
	}

	if(materialOnly) {
		material.setText(initialText);
		return material
	}
	
	var sign = new THREE.Mesh(unitSquareGeo, material);
	material.setText(initialText);
	sign.scale.x = material.getAspect() * sign.scale.y;
	//so the question is "how wide is it?"

	return sign;
}