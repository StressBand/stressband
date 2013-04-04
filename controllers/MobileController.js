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