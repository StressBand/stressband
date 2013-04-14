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
			if (port.manufacturer === 'FTDI') {
				ppath = port.comName;
			} else if (port.manufacturer.search(/Arduino/) !== -1) {
				ppath = port.comName.replace(/cu/, 'tty');
			}
		});

		console.log("Located Arduino: ", ppath);
		connect();
	});

	connect = function(){
		serial = new serialport.SerialPort(ppath, {
			baudrate: 115200,
			parser: serialport.parsers.readline("\n")
		});

		serial.on('open',function() {
			console.log('Connected to serial port '+ppath+'.');
			serial.on('data',function(data) {
				// Sometimes if the transmission was interrupted strange things happen.
				if (data) {
					var dataType = data[0];
					var val = parseInt(data.slice(1));

					if (dataType == 'B') {
						// Pulse data.
						sio.sockets.emit('pulse', {output: val});
						console.log({output:val});
					} else if (dataType == 'W') {
						// Breath data.
						var avg = mavg(val);
						if (avg) {
							var d = (1 - val / avg) * 100;
							sio.sockets.emit('sensor',{output:val,average:avg,diff:d});
						}
						// console.log({output:val,average:avg,diff:d});
					}
					// Else, we don't care -- either Q or S.
				}
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
