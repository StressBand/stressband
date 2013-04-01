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

var mavg2 = (function(){
	var buffer = [];
	var blen = 5;
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
// http://math.fullerton.edu/mathews/n2003/NumericalDiffMod.html
var diff = (function(){
	var buffer = [];
	return function(val){
		if(buffer.length === 5) buffer.shift(); 
		buffer.push(val)
		if (buffer.length === 5){
			// first derivative
			d = (buffer[4] - buffer[0]) / 4
			// second derivative
			//d = buffer[0] - (2*buffer[2]) + buffer[4]
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
				var val = parseInt(data);
				var avg = mavg(val);
				if(avg){
					var d = (1 - val / avg) * 100;
					sio.sockets.emit('sensor',{output:val,average:avg,diff:d});
				}
				console.log({output:val,average:avg,diff:d});
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