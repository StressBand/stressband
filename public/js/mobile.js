/* --------------------------------------------

File:		mobile.js

Title:		StressBand Moble Display Module
Date:		3 / 24 / 2012
Author:		Wesley Lauka
 
Desc:		The client-side display and mini-game logic for stressband's mobile component

----------------------------------------------- */

window.SB = window.SB || {};

SB.mobile = (function($,_,createjs,d3){
	var
		jQMap = {	// keep track of common jQuery objects to save lookup time
			$container	:"",
			$screen		:""	
		},	
		init;
	
	/* PUBLIC init - Module Initialization
		args:	container 	- the main html element of the view
				canvas		- the html5 canvas element for holding the mini-game
	----------------------------------------------- */
	init = function(container, canvas){
		jQMap.$container = $(container);
		jQMap.$screen = $(canvas);
		console.log(jQMap);
	};
	
	return {
		init:init
	};
	
})(jQuery,_,createjs,d3);