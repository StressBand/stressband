/* --------------------------------------------

File:		app.js

Title:		StressBand Application
Date:		3 / 30 / 2012
Author:		Wesley Lauka
 
Desc:		The main stressband application, sets up http server, routing, and socket.io	

----------------------------------------------- */

var http = require('http'),
	fs = require('fs'),
	connectRoute = require('connect-route'),
	connect = require('connect'),
	io = require('socket.io'),
	
	mobile = require('./controllers/MobileController.js'),
	dash = require('./controllers/DashboardController.js');

/* set up the HTTP Server
----------------------------------------------- */
var renderView = function(res,path){
	fs.readFile("views"+path,function(err,data){
		if(err) throw err;
		res.end(data);
	});
}

var app = http.createServer(
  connect()
  .use(connect.favicon())
  .use(connect.logger('dev'))
  .use(connect.query())
  .use(connectRoute(function(router){
  	router.get('/',function(req,res,next){
  		console.log(req.route);
  		renderView(res,'/index.html');
  	});
  	router.get('/mobile',function(req,res,next){
  		console.log(req.route);
  	  	mobile.initSensors(req.query);
  	  	renderView(res,req.route+'.html');  		
  	});
  }))	
  .use(connect.static('public'))
);

global.sio = io.listen(app); 
app.listen(4000);
console.log("Running stressband on port 4000.");

/* Monitor Socket Communication
----------------------------------------------- */

sio.on('connection', function(socket) {
	socket.emit('info', {'output': 'Connected. Listening for Sensor Data.. '});
});
