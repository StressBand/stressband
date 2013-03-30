/* --------------------------------------------

File:		MobileController.js

Title:		StressBand Moble Controller
Date:		3 / 30 / 2012
Author:		Wesley Lauka
 
Desc:		The server-side controller for sensor data to the mobile display

----------------------------------------------- */
var serialport = require('serialPort');

var mavg = (function(){
	var buffer = [];
	var blen = 65;
	return function(val){
		if(buffer.length === blen) buffer.shift();
		buffer.push(val);
		var sum = 0;
		if(buffer.length === blen){
			for(var x = 0; x < blen; x++){
				sum += buffer[x];
			}
		}
		return sum / buffer.length;
	}; 
	
})();

// lets try this! a simple numeric differentiator ( central operator )
// http://stackoverflow.com/questions/627055/compute-a-derivative-using-discrete-methods
var diff = (function(){
	var buffer = [];
	return function(val){
		if(buffer.length === 3) buffer.shift(); 
		buffer.push(val)
		if (buffer.length === 3){
			var d = (buffer[0] - buffer[2]) / 2
		} else {
			var d = 0;
		}
		return d;
	}; 
	
})();

var initMonitoring = function(){
	var 
		ppath,serial, connect;
		
	serialport.list(function(err,ports){
		ports.forEach(function(port){
			if(port.manufacturer === 'FTDI') ppath = port.comName;
		});
		connect();
	});
	
	connect = function(){
		serial = new serialport.SerialPort(ppath, {
		    baudrate: 9600,
		    parser: serialport.parsers.readline("\n") 
		  });
		
		serial.on('open',function(){
			console.log('Connected to serial port '+ppath+'.');
			serial.on('data',function(data){
				var val = parseInt(data)
				var avg = mavg(val);
				var d = diff(avg);
				console.log({output:val,average:avg,diff:d});
				sio.sockets.emit('sensor',{output:val,average:avg,diff:d});
			});
			
		}); 
	};
};

var MobileController = {
	initSensors: function(query){
		if(query.sensor || query.sensor === "" ) initMonitoring();
	}
};
module.exports = MobileController;