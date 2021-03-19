//--------------Bringing in libraries
const express = require("express");
const app = express();
app.use(express.static(__dirname ));

//Sends files
app.get("/", function(req, res) {
	res.sendFile(__dirname + "/index.html");
});

const http = require("http").Server(app);
const io = require("socket.io")(http);

const port = process.env.PORT || 443

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
	log("starting game: ", id)

	let game = {}
	games[id] = game

	game.sockets = []
	game.suspects = []

	let msg = {
		staticCashes: {},
		suspects: []
	}

	game.broadcastState = () => {
		game.sockets.forEach( (socket) => {
			msg.staticCashes[socket.playerId] = socket.staticCash
		})

		game.sockets.forEach( (socket)=>{
			game.suspects.forEach((suspect, i) => {
				if(suspect === undefined)
					msg.suspects[i] = null
				else {
					if(msg.suspects[i] === undefined) {
						msg.suspects[i] = {
							cashBits: Array(pm.betsPerSuspect),
							bets: Array(pm.betsPerSuspect)
						}
						for(let j = 0; j < pm.betsPerSuspect; ++j)
							msg.suspects[i].cashBits[j] = { associatedPlayer: pm.NO_OWNERSHIP }
						for(let j = 0; j < pm.betsPerSuspect; ++j)
							msg.suspects[i].bets[j] = { owner: pm.BOARD_OWNERSHIP }
					}

					for (let j = 0; j < pm.betsPerSuspect; ++j)
						msg.suspects[i].cashBits[j].associatedPlayer = game.suspects[i].cashBits[j].associatedPlayer
					for (let j = 0; j < pm.betsPerSuspect; ++j)
						msg.suspects[i].bets[j].owner = game.suspects[i].bets[j].owner
				}
			})

			socket.emit("game update", msg)
		})
		//various translations needed
	}
}

//Default game
beginGame(0);

io.on("connection", (socket) => {

	let self = socket
	var gameId = ""

	log("potential user connected")

	socket.emit("serverConnected")

	socket.on("gameInitializationRequest", (msg) => {
		socket.playerId = msg.storedId || socket.id

		gameId = Object.keys(games).length
		
		beginGame( gameId )

		bringIntoGame(gameId)
	});

	socket.on("gameEntryRequest", (msg) => {
		socket.playerId = msg.storedId || socket.id

		if( games[msg.requestedGameKey] === undefined ) {
			log( "didn't find game ", msg.requestedGameKey, ", all we have is ", games)
			socket.emit("logThisMessage", "game not found");
		}
		else {
			gameId = msg.requestedGameKey;
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

		let entireColumnPrice = 0.
		for (let i = 0.; i < pm.betsPerSuspect; ++i)
			entireColumnPrice += pm.betPrices[i]
		let arbitraryValueChosenByRobinHanson = .6
		self.staticCash = entireColumnPrice * arbitraryValueChosenByRobinHanson // STARTING CASH
		//Hey, maybe you should be able to buy the entire board.
		//It's only meant to be about whether these things will make extra money for you

		getTotalCash = (socket) => {
			return socket.staticCash + pm.getLooseCash(socket.playerId, game.suspects)
		}

		const suspects = game.suspects

		Suspect = (msg) => {
			let suspect = {
				cashBits: Array(pm.betsPerSuspect),
				bets: Array(pm.betsPerSuspect),
				portraitImageSrc: msg.portraitImageSrc
			}

			suspects.push(suspect)
			log("adding suspect, number: " + suspects.indexOf(suspect))
			//or possibly you want to replace what was in there, this code does that
			// for(let i = 0; i <= suspects.length; ++i) {
			// 	if (suspects[i] === undefined) {
			// 		suspects[i] = suspect
			// 		break
			// 	}
			// }
			
			for(let i = 0; i < pm.betsPerSuspect; ++i) {
				suspect.cashBits[i] = {
					associatedPlayer: pm.NO_OWNERSHIP,
					value: pm.betPrices[i]
				}

				suspect.bets[i] = { owner: pm.BOARD_OWNERSHIP }
			}

			game.sockets.forEach( (particularSocket) => {
				emitSuspect(suspect, particularSocket)
			})
		}
		self.on("new suspect", Suspect )

		function emitSuspect(suspect,particularSocket) {
			log("sending suspect " + suspects.indexOf(suspect))
			particularSocket.emit("new suspect", {
				index: suspects.indexOf(suspect),
				portraitImageSrc: suspect.portraitImageSrc
			})
		}

		socket.on( "ready for suspect portraits", ()=>{
			game.suspects.forEach((suspect, i) => {
				if (suspect !== undefined)
					emitSuspect(suspect,socket)
			})
			game.broadcastState()
		})

		// self.on("delete",(msg)=>{
		// 	delete suspects[msg.suspect]
		// })

		self.on("sell", (msg) => {
			let suspect = suspects[msg.suspect]
			log("total cash", getTotalCash(self))

			let betToSell = suspect.bets.find( bet => bet.owner === self.playerId )
			if (betToSell === undefined)
				self.emit("unsuccessful sell")
			else {
				let numInBoard = pm.getNumBoardBets(suspect)
				let slotIndex = pm.betsPerSuspect - numInBoard - 1

				let cb = suspect.cashBits[slotIndex]
				let currentOwner = pm.getCashBitOwnership(suspect, cb)

				if (currentOwner !== pm.NO_OWNERSHIP)
					currentOwner.staticCash += pm.betPrices[slotIndex]

				cb.associatedPlayer = self.playerId

				betToSell.owner = pm.BOARD_OWNERSHIP
				
				log("total cash", getTotalCash(self))

				game.broadcastState()
			}
		})

		function potentiallyStartJudgementMode() {
			let numRequests = 0
			game.sockets.forEach((sock, i) => {
				if (sock.jugementModeBeingRequested )
					++numRequests
			})

			if (numRequests >= 2) {
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
		//another easy thing is showing the game id

		self.on("buy", (msg) => {
			let suspect = suspects[msg.suspect]
			log("total cash", getTotalCash(self))

			let betToBuy = suspect.bets.find(bet => bet.owner === pm.BOARD_OWNERSHIP)
			if (betToBuy === undefined)
				self.emit("unsuccessful buy") //no bets left
			else {
				let numInBoard = pm.getNumBoardBets(suspect)
				let slotIndex = pm.betsPerSuspect - numInBoard

				if (pm.betPrices[slotIndex] > getTotalCash(self))
					self.emit("unsuccessful buy") //too expensive
				else {
					let cb = suspect.cashBits[slotIndex]
					let currentOwner = pm.getCashBitOwnership(suspect, cb)

					if (currentOwner !== self.playerId) { //you were the last to sell to this slot
						if (currentOwner !== pm.NO_OWNERSHIP )
							currentOwner.staticCash += pm.betPrices[slotIndex]

						cb.associatedPlayer = self.playerId
						self.staticCash -= pm.betPrices[slotIndex]
					}

					betToBuy.owner = self.playerId
					
					log("total cash", getTotalCash(self))

					mergeOwnedCashBitsIntoStaticCashIfNecessary()
					game.broadcastState()
				}
			}
		})

		self.associateCashBit = function( suspect, slotIndex ) {
			let cashBitToAssociate = suspect.cashBits[slotIndex]
			
			let currentOwner = pm.getCashBitOwnership(suspect,cashBitToAssociate)
			if( currentOwner !== pm.NO_OWNERSHIP)
				currentOwner.staticCash += cashBitToAssociate.value

			cashBitToAssociate.associatedPlayer = self.playerId
			self.staticCash -= cashBitToAssociate.value
			//this is NOT the thing that TAKES the cash. It's just changing visual depiction

			mergeOwnedCashBitsIntoStaticCashIfNecessary()
		}

		function mergeOwnedCashBitsIntoStaticCashIfNecessary() {
			//could only do some of them
			if (self.staticCash < 0.) {
				suspects.forEach((sus) => {
					sus.cashBits.forEach( (cb, i) => {
						if (pm.getCashBitOwnership(sus, cb) === self.playerId) {
							cb.associatedPlayer = pm.NO_OWNERSHIP
							self.staticCash += cb.value
						}
					})
				})
			}
		}
	}
});