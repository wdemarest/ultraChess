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
		if(x == this.x || y == this.y || x-y == this.x-this.y || x+y == this.x+this.y){
			return true;
		}
	}
}

class Spawner extends Piece{
	constructor(team, x, y){
		super("Spawner", team, x, y)
	}
	canMoveTo(x, y){
		return false;
	}
}

class Wall extends Piece{
	constructor(team, x, y){
		super("Wall", team, x, y)
	}
	canMoveToSpecific(x, y){
		return false;
	}
}

class Board{
	constructor(){
		this.width = 8;
		this.height = 8;
		this.layout = [0,0,0,0,0,0,0,1, 0,0,0,0,0,0,0,0, 0,1,1,1,0,0,0,0, 0,0,0,0,0,0,0,0, 0,0,0,0,0,1,0,0, 0,0,0,0,0,1,0,0, 0,0,0,0,0,1,0,0, 1,0,0,0,0,0,0,0,]
	}
}

class Game{
	constructor(){
		this.pieceList = [];
		this.turn;

		this.board = new Board();

		this.slotsFilled = [false, false]
	}
	initializePieces(){
		this.pieceList = [];
		this.turn = 0;

		for(let i = 0; i < this.board.layout.length; i++){
			if(this.board.layout[i]){
				let x = Math.floor(i/this.board.width);
				let y = (i%this.board.width);
				this.pieceAdd(Math.random(), "Wall", "Terrain", x, y)
			}
		}

		this.pieceAdd(Math.random(), "Spawner", "Blue", 0, 0)
		this.pieceAdd(Math.random(), "Knight", "Blue", 0, 1)
		this.pieceAdd(Math.random(), "Emperor", "Blue", 1, 0)
		
		this.pieceAdd(Math.random(), "Spawner", "Red", 7, 7)
		this.pieceAdd(Math.random(), "Knight", "Red", 7, 6)
		this.pieceAdd(Math.random(), "Emperor", "Red", 6, 7)
	}
	pieceAdd(uid, type, team, x, y){
		let piece;
		if(type == "Wall"){
			piece = new Wall(team, x, y)
		}
		if(type == "Knight"){
			piece = new Knight(team, x, y)
		}
		if(type == "Emperor"){
			piece = new Emperor(team, x, y)
		}
		if(type == "Spawner"){
			piece = new Spawner(team, x, y)
		}
		piece.uid = uid;

		this.pieceList.push(piece)

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
		io.sockets.emit('state', {pieceList: game.pieceList});
	}

	socket.on('pieceAdd', (data) => {
		console.log("pieceAdd "+data)
		game.pieceAdd(data.uid, data.type, data.team, data.x, data.y)
		io.sockets.emit('pieceAdd', data);
	})

	socket.on('turn', (data) => {
		game.turn = 1-socket.playerNum;
		io.sockets.emit('turn');
	})

	socket.on('pieceMove', (data) => {
		console.log("pieceMove "+data)
		game.pieceList[data.index].x = data.x
		game.pieceList[data.index].y = data.y
		io.sockets.emit('pieceMove', data);
	})

	socket.on('disconnect', (data) => {
		game.slotsFilled[socket.playerNum] = false;
		console.log("user: "+socket.playerNum+" disconnected")
	})
})