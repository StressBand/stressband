/*---------------------
	:: Mobile 
	-> controller
---------------------*/
var five = require('johnny-five');
	
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

	
	var board = new five.Board();
	board.on("ready",function(){   // NOTE: SWITCH TO VANILLA SERIALPORT IO
		
		// Create strech sensor
		var stress = new five.Sensor({
			pin:'A0',
			freq:'250'
		});
		
		board.repl.inject({
		stress: stress
		});
	
		stress.on('read', function(err, val){
			var avg = mavg(val);
			var d = diff(avg);
			sails.io.sockets.emit('sensor',{output:val,average:avg,diff:d});
		});
	
	}); // END board -> Ready 
};

var MobileController = {
	index: function(req, res){
		if(req.param('sensor')) initMonitoring();
		res.view({layout:'mobile_layout'}); 
	}
};
module.exports = MobileController;