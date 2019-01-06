const express = require("express");
const app = express();
const server = require("http").Server(app);
const io = require("socket.io")(server);

var users = {};
var sockets = {};

app.get("/",function(req,res){
	res.sendFile(__dirname+"/files/index.html");
});
app.use("/files",express.static(__dirname+"/files"));

server.listen(80);

io.sockets.on("connection",function(socket){
	// Create random socket id and push it.
	var USER_ID = Math.floor((1+Math.random()) * 0x10000000000000).toString(16).substring(1);
	var COLOR = "#"+Math.floor((1+Math.random()) * 0x1000000).toString(16).substring(1);	
	console.log("User "+USER_ID+" joined the game!");
	if(!(USER_ID in users)) {
		user = {"userId":USER_ID,"x":300,"y":300,"username":"Unkown User","creationDate":Date.now(),"fill":COLOR};
		users[USER_ID] = user;
		sockets[USER_ID] = socket;
		socket.emit("joinGame",user);
	}
	// Kick the oldest user if the number of users exceeds 10.
	if(Object.keys(users).length >= 10) {
		var oldestUser = Object.values(users).reduce((u1,u2) => u1.creationDate >= u2.creationDate ? u2 : u1);
		delete users[oldestUser.userId];
		delete sockets[oldestUser.userId];
	}


	// Endpoints
	socket.on("registerUsername",function(data){
		if(USER_ID in users) {
			users[USER_ID].username = data.username;	
		}
	});
	socket.on("move",function(data){
		if(USER_ID in users) {
			users[USER_ID].x = data.x;
			users[USER_ID].y = data.y;
		}
	});
	socket.on("disconnect",function(){
		console.log(USER_ID+" has left the game!");
		delete users[USER_ID];
		delete sockets[USER_ID];
	});
});

setInterval(function(){
	for(var userId in users) {
		sockets[userId].emit("gameState",{"users":users});
	}
},1000/25);