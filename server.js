///////////////
// IMPORTING //
///////////////

const express = require("express");
const app = express();
app.use(express.static(__dirname ));

//Sends files
app.get("/", function(req, res) {
	res.sendFile(__dirname + "/index.html");
});

const http = require("http").Server(app);
const io = require("socket.io")(http);

const port = process.env.PORT || 80
http.listen(port, () => {
	log("\nServer is listening on port ", port);
})

////////////////////
// INFRASTRUCTURE //
////////////////////

const log = console.log

const pm = require("./shared.js")

const games = {}

function beginGame(id) {

	//check on old games
	Object.keys(games).forEach((gameId)=>{
		let gotAtLeastOneStillPinging = false

		games[gameId].sockets.forEach((sock)=>{
			if((Date.now() - sock.timeOfLastPing)/1000. < 6. )
				gotAtLeastOneStillPinging = true
		})

		if(!gotAtLeastOneStillPinging) {
		log("\ndeleting game ", gameId)
			delete games[gameId]
		}
		//will that clear everything? Hopefully
	})

	log("starting game: ", id)

	let game = {}
	games[id] = game

	game.sockets = []
	game.suspects = []
	game.staticCashes = {}

	game.timeAtLastPortrait = 0

	let msg = {
		staticCashes: game.staticCashes,
		suspects: [],
		suspectConfirmationAddOn: null
	}

	game.broadcastState = (suspectConfirmationAddOn) => {
		if (suspectConfirmationAddOn === undefined)
			msg.suspectConfirmationAddOn = null
		else
			msg.suspectConfirmationAddOn = suspectConfirmationAddOn
		game.suspects.forEach((suspect, i) => {
			if(msg.suspects[i] === undefined) {
				msg.suspects[i] = {
					cashBits: Array(pm.betsPerSuspect),
					betOwners: game.suspects[i].betOwners,
					onBoard: game.suspects[i].onBoard
				}
				for(let j = 0; j < pm.betsPerSuspect; ++j)
					msg.suspects[i].cashBits[j] = { associatedPlayer: pm.NO_OWNERSHIP }
			}

			msg.suspects[i].onBoard = suspect.onBoard

			for (let j = 0; j < pm.betsPerSuspect; ++j)
				msg.suspects[i].cashBits[j].associatedPlayer = game.suspects[i].cashBits[j].associatedPlayer
		})
		game.sockets.forEach( (socket)=>{
			socket.emit("game update", msg)
		})
	}
}

//Default game
beginGame(0);

let unambiguousAlphanumerics = "abcdefghijkmnpqrstuvwxyz23456789"

function generateGameId() {
	let ret = ""
	for(let i = 0; i < 4; ++i) {
		let index = Math.floor(Math.random() * unambiguousAlphanumerics.length)
		ret += unambiguousAlphanumerics[index]
	}

	return ret
}

io.on("connection", (socket) => {

	let self = socket
	var gameId = ""

	log("potential user connected")

	socket.emit("serverConnected")

	socket.on("gameInitializationRequest", (msg) => {
		socket.playerId = msg.playerId ? msg.playerId : socket.id

		let gameId = generateGameId()
		while (games[gameId] !== undefined )
			gameId = generateGameId()
		
		beginGame( gameId )

		bringIntoGame(gameId)
	});

	socket.on("gameEntryRequest", (msg) => {
		socket.playerId = msg.playerId ? msg.playerId : socket.id

		if( games[msg.requestedGameKey] === undefined )
			socket.emit("game not found")
		else {
			gameId = msg.requestedGameKey
			bringIntoGame(gameId)
		}
	});

	function bringIntoGame(gameId) {
		const game = games[gameId]

		self.emit("gameInvitation", {
			gameId,
			playerId: socket.playerId
		} );

		game.sockets.push(self);

		log( "\nallocating ", self.playerId, " to game ", gameId, "\ncurrent number of sockets: ", game.sockets.length);

		//possibly this isn't always triggering
		self.on("disconnect", () => {
			game.sockets.splice(game.sockets.indexOf(self),1);

			log("player disconnected")

			if( gameId !== "oo" && game.sockets.length === 0)
				delete game;
		})

		////////////////////////
		// THE IMPORTANT PART //
		////////////////////////

		if(!game.staticCashes[socket.playerId])
			game.staticCashes[socket.playerId] = pm.startingCash

		//imagine at first that there's a SMALL reward for manipulation
		//and a SMALL amt of extra cash for manipulator

		//Hey, maybe you should be able to buy the entire board.
		//It's only meant to be about whether these things will make extra money for you

		getTotalCash = (socket) => {
			return game.staticCashes[socket.playerId] + pm.getLooseCash(socket.playerId, game.suspects)
		}

		const suspects = game.suspects

		for(let i = 0; i < pm.maxSuspects; ++i) {
			let suspect = {
				cashBits: Array(pm.betsPerSuspect),
				betOwners: Array(pm.betsPerSuspect),
				portraitImageSrc: "",
				onBoard: false,
				playerAttemptingConfirmation: null,
				portraitSenderSocket: null
			}

			suspects.push(suspect)
			
			for(let j = 0; j < pm.betsPerSuspect; ++j) {
				suspect.cashBits[j] = {
					associatedPlayer: pm.NO_OWNERSHIP,
					value: pm.betPrices[j]
				}

				suspect.betOwners[j] = pm.BOARD_OWNERSHIP
			}
		}
		//we're partway through making this into all pre-initialized and then the pics just come along

		// self.on("suspect confirmation", (msg) => {
		// 	game.sockets.forEach((sock)=>{
		// 		sock.emit("suspect confirmation",msg)
		// 	})
		// })

		self.on("confirmation", (msg) => {
			let suspect = suspects[msg.index]
			
			if( suspect.playerAttemptingConfirmation === null) 
				suspect.playerAttemptingConfirmation = self.playerId
			else {
				game.sockets.forEach((sock)=>{
					mergeCashBitsIntoStaticCash(suspect, sock)
				})

				suspect.cashBits.forEach((cb)=>{
					cb.associatedPlayer = pm.NO_OWNERSHIP
				})

				suspect.betOwners.forEach((betOwner)=>{
					if(betOwner !== pm.BOARD_OWNERSHIP)
						game.staticCashes[betOwner] += 1.
				})

				let numOwneds = {}
				game.sockets.forEach((sock,j) => {
					numOwneds[sock.playerId] = 0
					for (let i = 0; i < pm.betsPerSuspect; ++i) {
						if (suspect.betOwners[i] === sock.playerId)
							++numOwneds[sock.playerId]
					}
				})

				suspect.onBoard = false
				for (let i = 0; i < pm.betsPerSuspect; ++i)
					suspect.betOwners[i] = pm.BOARD_OWNERSHIP
				suspect.playerAttemptingConfirmation = null

				game.broadcastState({
					index: suspects.indexOf(suspect),
					numOwneds
				})

			}
		})
		self.on("confirmation cancellation", (msg) => {
			game.suspects.forEach((sus)=>{
				if(sus.playerAttemptingConfirmation === self.playerId)
					sus.playerAttemptingConfirmation = null
			})
		})

		self.on("delete",(msg)=>{
			let deletable = true
			game.suspects[msg.index].betOwners.forEach((betOwner)=>{
				if(betOwner !== pm.BOARD_OWNERSHIP)
					deletable = false
			})
			if(!deletable)
				return
			
			game.suspects[msg.index].onBoard = false
			game.broadcastState()
		})

		socket.on("pingAA", () => {
			socket.timeOfLastPing = Date.now()
			socket.emit("pongAA")
		})

		//portraits
		{
			socket.on("ready for suspect portraits", () => {
				game.suspects.forEach((suspect, i) => {
					if (suspect.portraitImageSrc !== "" && suspect.onBoard)
						emitPortrait(suspect, socket, true)
				})
				game.broadcastState()

				//note: you might not get all of them if one is added just as you arrive
			})

			self.on("new suspect portrait", (msg) => {
				let timeSinceLastPortrait = (Date.now() - game.timeAtLastPortrait) / 1000.

				if (timeSinceLastPortrait > 4.) {
					game.timeAtLastPortrait = Date.now()

					let suspect = game.suspects.find((suspect) => suspect.onBoard === false)
					suspect.portraitSenderSocket = self
					suspect.portraitImageSrc = msg.portraitImageSrc

					suspect.stillPingingSocketsPortraitLoadededness = {}
					game.sockets.forEach((sock) => {
						if(sock.timeOfLastPing - Date.now() < 5000)
							suspect.stillPingingSocketsPortraitLoadededness[sock.playerId] = false
						emitPortrait(suspect, sock, false)
					})
					game.broadcastState()
				}
				else
					self.emit("portrait rejected")
			})

			function emitPortrait(suspect, particularSocket, asap) {
				log("sending suspect " + suspects.indexOf(suspect))
				particularSocket.emit("suspect portrait", {
					index: suspects.indexOf(suspect),
					portraitImageSrc: suspect.portraitImageSrc,
					asap
				})
			}

			socket.on("portrait loaded", (msg) => {
				let suspect = suspects[msg.index]
				suspect.stillPingingSocketsPortraitLoadededness[socket.playerId] = true

				let loadedForAllPlayers = true
				Object.keys(suspect.stillPingingSocketsPortraitLoadededness).forEach( (sockId) => {
					if (suspect.stillPingingSocketsPortraitLoadededness[sockId] === false)
						loadedForAllPlayers = false
				})

				if (loadedForAllPlayers) {
					suspect.onBoard = true
					attemptBuy(suspect.portraitSenderSocket, msg.index)

					game.broadcastState()
				}
			})
		}

		function potentiallyStartJudgementMode() {
			let numRequests = 0
			game.sockets.forEach((sock, i) => {
				if (sock.jugementModeBeingRequested )
					++numRequests
			})

			if (numRequests >= 2) {
				//it is time!
				mergeSocketOwnedCashBitsIntoStaticCash(self)
				game.sockets.forEach((sock) => {
					sock.emit("judgement mode confirmed")
				})
			}
		}

		self.jugementModeBeingRequested = false
		self.on("judgement mode requested",()=>{
			self.jugementModeBeingRequested = true

			potentiallyStartJudgementMode()
		})
		self.on("judgement mode request cancelled",()=>{
			self.jugementModeBeingRequested = false
		})

		self.on("sell", (msg) => {
			let suspect = suspects[msg.suspect]
			log("total cash", getTotalCash(self))

			let betToSellIndex = suspect.betOwners.indexOf(self.playerId)
			if (betToSellIndex === -1)
				self.emit("unsuccessful sell")
			else {
				let numInBoard = pm.getNumBoardBets(suspect)
				let slotIndex = pm.betsPerSuspect - numInBoard - 1

				let cb = suspect.cashBits[slotIndex]
				let currentOwnerId = pm.getCashBitOwnership(suspect, cb)

				if (currentOwnerId !== pm.NO_OWNERSHIP)
					game.staticCashes[currentOwnerId] += pm.betPrices[slotIndex]

				cb.associatedPlayer = self.playerId

				suspect.betOwners[betToSellIndex] = pm.BOARD_OWNERSHIP

				game.broadcastState()
			}
		})

		//just buy then sell with one player, then buy then sell with other

		function attemptBuy(socketToBuy,suspectIndex) {
			let suspect = suspects[suspectIndex]
			
			if(suspect.onBoard === false)
				socketToBuy.emit("unsuccessful buy")

			let betToBuyIndex = suspect.betOwners.indexOf( pm.BOARD_OWNERSHIP )
			if (betToBuyIndex === -1)
				socketToBuy.emit("unsuccessful buy") //no bets left
			else {
				let numInBoard = pm.getNumBoardBets(suspect)
				let slotIndex = pm.betsPerSuspect - numInBoard

				if (pm.betPrices[slotIndex] > getTotalCash(socketToBuy)) {
					socketToBuy.emit("insufficient funds")
				}
				else {
					let cb = suspect.cashBits[slotIndex]
					let currentOwnerId = pm.getCashBitOwnership(suspect, cb)

					if (currentOwnerId !== socketToBuy.playerId) { //you were the last to sell to this slot
						if (currentOwnerId !== pm.NO_OWNERSHIP )
							game.staticCashes[currentOwnerId] += pm.betPrices[slotIndex]

						cb.associatedPlayer = socketToBuy.playerId
						game.staticCashes[socketToBuy.playerId] -= pm.betPrices[slotIndex]
					}

					suspect.betOwners[betToBuyIndex] = socketToBuy.playerId

					if (game.staticCashes[socketToBuy.playerId] < 0.)
						mergeSocketOwnedCashBitsIntoStaticCash(socketToBuy)
					
					game.broadcastState()
				}
			}
		}

		self.on("buy", (msg)=>{
			log(msg.suspectIndex)
			attemptBuy(self,msg.suspectIndex)
		})

		function mergeSocketOwnedCashBitsIntoStaticCash(sock) {
			suspects.forEach((sus) => {
				mergeCashBitsIntoStaticCash(sus, sock)
			})
		}

		function mergeCashBitsIntoStaticCash(sus,sock) {
			sus.cashBits.forEach((cb, i) => {
				if (pm.getCashBitOwnership(sus, cb) === sock.playerId) {
					cb.associatedPlayer = pm.NO_OWNERSHIP
					game.staticCashes[sock.playerId] += cb.value
				}
			})
		}
	}
});