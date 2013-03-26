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
		stage,fps = 30,blowfish,
		// function list
		init,setupScreen,updateStage,inflateBlowfish;
	
	/*  setupScreen - Initialize the Elements of the Mini-Game
		----------------------------------------------- */
	setupScreen = function(canvas){
		stage = new createjs.Stage(jQMap.$screen[0]);
		createjs.Ticker.useRAF = true;
		createjs.Ticker.setFPS(fps);
		
		// start spritsheet data
		$.getJSON('images/mobile/blowfishAnim.json',function(data){
			blowfish = new createjs.BitmapAnimation(new createjs.SpriteSheet(data));
			blowfish.gotoAndPlay('s1_idle');
			blowfish.state = 1;
			viewState = 1;
			blowfish.x = Math.floor(jQMap.$screen.width()/2) - 200;
			blowfish.y =0 ;
			stage.addChild(blowfish);
			// start the game loop
			createjs.Ticker.addEventListener('tick',updateStage)
			// inflate the fish!
			inflateBlowfish(4);
		});
	};
	
	/*  updateStage - Main Mobile Game Loop
	----------------------------------------------- */
	updateStage = function(){
		// check for changes in sensor data
		// pulse change? move fish
		// breath change? deflate
		stage.update();
	};
	
	/*  updateStage - Change the blowfish's state
		args:	state		- the state to transition to
		----------------------------------------------- */
	inflateBlowfish = (function(){
		var inprogress = false;
		return function(state){
			if(blowfish.state !== state && !inprogress){
				inprogress = true;
				if(state - blowfish.state < 0) { // deflate
					blowfish.gotoAndPlay('s'+(blowfish.state-1)+'_transR');
					blowfish.state-=1;
				} else { // inflate
					blowfish.gotoAndPlay('s'+blowfish.state+'_trans');
					blowfish.state+=1;
				}
				
				var idle = blowfish.addEventListener('animationend', function(event) {
					blowfish.gotoAndPlay('s'+blowfish.state+"_idle");
					blowfish.removeEventListener('animationend', idle);
					inprogress = false;
					inflateBlowfish(state);
				});
			}
		} // END - return function
	})();
	
	/* PUBLIC init - Module Initialization
		args:	container 	- the main html element of the view, ID ref
				canvas		- the canvas element for holding the mini-game, ID ref
	----------------------------------------------- */
	init = function(container, canvas){
		jQMap.$container = $(container);
		jQMap.$screen = $(canvas);
		
		$('#next').on('click',function(){
			if(blowfish.state != 4){
				inflateBlowfish(blowfish.state+1)
			}
		});
		$('#prev').on('click',function(){
			if(blowfish.state != 1){
				inflateBlowfish(blowfish.state-1)
			}
		});
		
		setupScreen();
		
	};
	
	return {
		init:init
	};
	
})(jQuery,_,createjs,d3);