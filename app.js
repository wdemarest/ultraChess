const express = require ("express")
const app = express()

//middlewares
app.use(express.static('.'))

//routes
app.get('/', (req, res) => {
	res.send('index.html')
})

app.get('/routeThing', (req, res) => {
	res.send("Hey look it's working")
})

//Listen on port 3000
server = app.listen(3000)

//socket.io instantiation
const io = require("socket.io")(server)

class Piece{
	constructor(type, team, x, y){
		this.uid = 0;
		this.type = type;
		this.team = team;
		this.x = x;
		this.y = y;
	}
}

class Knight extends Piece{
	constructor(team, x, y){
		super("Knight", team, x, y)
	}
	canMoveTo(x, y){
		if(x == this.x || y == this.y){
			return true;
		}
	}
}

class Emperor extends Piece{
	constructor(team, x, y){
		super("Emperor", team, x, y)
	}
	canMoveTo(x, y){
		if(x == this.x || y == this.y){
			return true;
		}
	}
}


class Game{
	constructor(){
		this.state = {
			pieceList: []
		}

		this.slotsFilled = [false, false]
	}
	initializePieces(){
		this.state.pieceList = [];

		this.pieceAdd(Math.random(), "Knight", "Blue", 0, 1)
		this.pieceAdd(Math.random(), "Emperor", "Blue", 1, 0)
		this.pieceAdd(Math.random(), "Knight", "Red", 6, 7)
		this.pieceAdd(Math.random(), "Emperor", "Red", 7, 6)
	}
	pieceAdd(uid, type, team, x, y){
		let piece;
		if(type == "Knight"){
			piece = new Knight(team, x, y)
		}
		if(type == "Emperor"){
			piece = new Emperor(team, x, y)
		}
		piece.uid = uid;

		this.state.pieceList.push(piece)

		return piece;
	}
}

let game = new Game();

//listen on every connection
io.on('connection', (socket) => {
	console.log('New user connected')

	socket.playerNum = (game.slotsFilled[0] ? 1 : 0);

	game.slotsFilled[socket.playerNum] = true;

	console.log(socket.playerNum)

	io.sockets.emit('setPlayerNum', {playerNum : socket.playerNum});

	if(game.slotsFilled[0] && game.slotsFilled[1]){
		game.initializePieces()
		io.sockets.emit('state', game.state);
	}

	socket.on('pieceAdd', (data) => {
		console.log("pieceAdd "+data)
		game.pieceAdd(data.uid, data.type, data.team, data.x, data.y)
		io.sockets.emit('pieceAdd', data);
	})

	socket.on('pieceMove', (data) => {
		console.log("pieceMove "+data)
		game.state.pieceList[data.index].x = data.x
		game.state.pieceList[data.index].y = data.y
		io.sockets.emit('pieceMove', data);
	})

	socket.on('disconnect', (data) => {
		game.slotsFilled[socket.playerNum] = false;
		console.log("user: "+socket.playerNum+" disconnected")
	})
})