/* --------------------------------------------

stressband

a sensor-driven application for the monitoring and reflection on stressful events
3 / 30 / 12
 	
 	
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
var app = http.createServer(
  connect()
  .use(connect.favicon())
  .use(connect.logger('dev'))
  .use(connect.query())
  .use(connectRoute(function(router){
  	router.get('/mobile',function(req,res,next){
  		fs.readFile("views"+req.route+".html",function(err,data){
  			if(err) throw err;
  			mobile.initSensors(req.query);
  			res.end(data);
  		});
  		
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
	socket.emit('info', {'output': 'Connected. Listening for Sensor Data.. freq '+freq,'freq':freq});

});
