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

const rooms = {}

function beginRoom(id) {
	let room = {}
	rooms[id] = room

	room.sockets = []
	room.suspects = []

	let msg = {
		staticCashes: {},
		suspects: []
	}

	room.broadcastState = () => {
		room.sockets.forEach( (socket) => {
			msg.staticCashes[socket.id] = socket.staticCash
		})

		room.sockets.forEach( (socket)=>{
			room.suspects.forEach((suspect, i) => {
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
						msg.suspects[i].cashBits[j].associatedPlayer = room.suspects[i].cashBits[j].associatedPlayer
					for (let j = 0; j < pm.betsPerSuspect; ++j)
						msg.suspects[i].bets[j].owner = room.suspects[i].bets[j].owner
				}
			})

			socket.emit("room update", msg)
		})
		//various translations needed
	}
}

//Default room
beginRoom("oo");

io.on("connection", (socket) => {

	let self = socket

	log("potential user connected: ", socket.id);

	socket.emit("serverConnected");

	// socket.on("roomInitializationRequest", () => {

	// 	roomId = (Math.random()+1).toString(36).substr(2,2);
	// 	log( "starting room: ", roomId)
	// 	if( rooms[roomId] )
	// 		log("Tried to start a room that already exists?")

	// 	beginRoom( roomId)

	// 	bringIntoRoom(roomId)
	// });

	socket.on("roomEntryRequest", function(requestedRoomKey)
	{
		if( !rooms[requestedRoomKey] ) {
			log( "didn't find room ", requestedRoomKey, ", all we have is ", rooms)
			socket.emit("logThisMessage", "room not found");
		}
		else {
			roomId = requestedRoomKey;
			bringIntoRoom(roomId)
		}
	});

	function bringIntoRoom(roomId) {
		log(roomId)

		const room = rooms[roomId]

		self.emit("roomInvitation", {
			roomId
		} );

		room.sockets.push(self);

		log( "\nallocating ", self.id, " to room ", roomId, "\ncurrent number of sockets: ", room.sockets.length);

		//possibly this isn't always triggering
		self.on("disconnect", () => {
			startJudgementModeIfBeingRequestedByAll()
			//hmm, make sure we know the socket's bets etc before they go forever otherwise no conclusion

			room.sockets.splice(room.sockets.indexOf(self),1);

			log("player disconnected")

			if( roomId !== "oo" && room.sockets.length === 0)
				delete room;
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
			return socket.staticCash + pm.getLooseCash(socket.id, room.suspects)
		}

		const suspects = room.suspects

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

			room.sockets.forEach( (particularSocket) => {
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
			room.suspects.forEach((suspect, i) => {
				if (suspect !== undefined)
					emitSuspect(suspect,socket)
			})
			room.broadcastState()
		})

		// self.on("delete",(msg)=>{
		// 	delete suspects[msg.suspect]
		// })

		self.on("sell", (msg) => {
			let suspect = suspects[msg.suspect]
			log("total cash", getTotalCash(self))

			let betToSell = suspect.bets.find( bet => bet.owner === self.id )
			if (betToSell === undefined)
				self.emit("unsuccessful sell")
			else {
				let numInBoard = pm.getNumBoardBets(suspect)
				let slotIndex = pm.betsPerSuspect - numInBoard - 1

				let cb = suspect.cashBits[slotIndex]
				let currentOwner = pm.getCashBitOwnership(suspect, cb)

				if (currentOwner !== pm.NO_OWNERSHIP)
					currentOwner.staticCash += pm.betPrices[slotIndex]

				cb.associatedPlayer = self.id

				betToSell.owner = pm.BOARD_OWNERSHIP
				
				log("total cash", getTotalCash(self))

				room.broadcastState()
			}
		})

		//you have 10 staticCash
		//you buy a bet worth 1
		//you now have 9 staticCash
		//Also, a cashbit worth 1 is associated with you

		function startJudgementModeIfBeingRequestedByAll() {
			let startJudgementMode = true
			room.sockets.forEach((sock, i) => {
				log(i, sock.jugementModeBeingRequested)
				if (sock.jugementModeBeingRequested === false)
					startJudgementMode = false
			})

			if (startJudgementMode) {
				room.sockets.forEach((sock) => {
					sock.emit("judgement mode confirmed")
				})
			}
		}

		self.jugementModeBeingRequested = false
		self.on("judgement mode requested",()=>{
			self.jugementModeBeingRequested = true

			startJudgementModeIfBeingRequestedByAll()
		})
		self.on("judgement mode request cancelled",()=>{
			self.jugementModeBeingRequested = false
		})
		//another easy thing is showing the room id

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

					if (currentOwner !== self.id) { //you were the last to sell to this slot
						if (currentOwner !== pm.NO_OWNERSHIP )
							currentOwner.staticCash += pm.betPrices[slotIndex]

						cb.associatedPlayer = self.id
						self.staticCash -= pm.betPrices[slotIndex]
					}

					betToBuy.owner = self.id
					
					log("total cash", getTotalCash(self))

					mergeOwnedCashBitsIntoStaticCashIfNecessary()
					room.broadcastState()
				}
			}
		})

		self.associateCashBit = function( suspect, slotIndex ) {
			let cashBitToAssociate = suspect.cashBits[slotIndex]
			
			let currentOwner = pm.getCashBitOwnership(suspect,cashBitToAssociate)
			if( currentOwner !== pm.NO_OWNERSHIP)
				currentOwner.staticCash += cashBitToAssociate.value

			cashBitToAssociate.associatedPlayer = self.id
			self.staticCash -= cashBitToAssociate.value
			//this is NOT the thing that TAKES the cash. It's just changing visual depiction

			mergeOwnedCashBitsIntoStaticCashIfNecessary()
		}

		function mergeOwnedCashBitsIntoStaticCashIfNecessary() {
			//could only do some of them
			if (self.staticCash < 0.) {
				suspects.forEach((sus) => {
					sus.cashBits.forEach( (cb, i) => {
						if (pm.getCashBitOwnership(sus, cb) === self.id) {
							cb.associatedPlayer = pm.NO_OWNERSHIP
							self.staticCash += cb.value
						}
					})
				})
			}
		}
	}
});