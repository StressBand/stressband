/*---------------------
	:: Mobile 
	-> controller
---------------------*/
var five = require('johnny-five');
	

var initMonitoring = function(){
	/*var board = new five.Board();
	
	board.on("ready",function(){
		
		// Create strech sensor
		var stress = new five.Sensor({
			pin:'A0',
			freq:'250'
		});
		
		board.repl.inject({
		stress: stress
		});
	
		stress.on('read', function(err, val){
			// log new value
			// transform for peak detection -> try with dst.js?
			// if peak, send data over socket
		});
	
	}); // END board -> Ready 
	*/
};

var MobileController = {
	index: function(req, res){
		initMonitoring();
		res.view({layout:'mobile_layout'}); 
	}
};
module.exports = MobileController;