/* --------------------------------------------

File:		mobile.js

Title:		StressBand Moble Display Module
Date:			3 / 24 / 2012
Author:		Wesley Lauka
 
Desc:			The client-side display and mini-game logic for stressband's mobile component

----------------------------------------------- */

window.SB = window.SB || {};

SB.mobile = (function($,_,createjs,d3){
	var
		jQMap = {	// keep track of common jQuery objects to save lookup time
			$container	:"",
			$screen		:""
		},
		stage,breaths = [],breathing,fps = 30,blowfish,fishBaseY = 30,
		// function list
		init,setupScreen,manageAnimations,updateStage,getRandomY,inflateBlowfish,logBreaths,endGame,graph;

	/*  setupScreen - Initialize the Elements of the Mini-Game
		----------------------------------------------- */
	setupScreen = function(canvas){
		stage = new createjs.Stage(jQMap.$screen[0]);
		createjs.Ticker.useRAF = true;
		createjs.Ticker.setFPS(fps);

		// get spritesheet data
		$.getJSON('images/mobile/blowfishAnim_003.json',function(data){
			blowfish = new createjs.BitmapAnimation(new createjs.SpriteSheet(data));
			blowfish.gotoAndPlay('s1_idle');
			blowfish.state = 1;
			blowfish.x = Math.floor(jQMap.$screen.width()/2) - 184;
			blowfish.y = fishBaseY;
			stage.addChild(blowfish);

			// start the game loop
			createjs.Ticker.addEventListener('tick',updateStage);
			// inflate the fish!
			inflateBlowfish(4);
			manageAnimations('undulate',{to:getRandomY()}); // move up and down
			manageAnimations('roll',{to:1}); // rotate a little
		});
	};

	/*  updateStage - Main Mobile Game Loop
	----------------------------------------------- */
	updateStage = function(){
		stage.update();
	};

	/*  getRandomY - Generate Random Y Delta, Positive or Negative
	----------------------------------------------- */
	getRandomY = function(){
		var dir = Math.random() < 0.5 ? -1 : 1;
		var val = fishBaseY + ( Math.floor( Math.random() * 20 ) * dir );
		return val;
	};

	/*  manageAnimations - Deal With the Blowfish's Animations
		args:	anim		- animation to start
				param{}		- animation parameters
	----------------------------------------------- */
	manageAnimations = function(anim,param){
		switch (anim) {
			case 'undulate':
				createjs.Tween.get(blowfish).to({y:param.to},1000,createjs.Ease.sineInOut).call(function(){
					manageAnimations('undulate',{to:getRandomY()});
				});
				break;
			case 'roll':
				createjs.Tween.get(blowfish).to({rotation:param.to},1000,createjs.Ease.linear).call(function(){
					manageAnimations('roll',{to: (param.to*-1)});
				});
				break;
			case 'updateY':
				if ('delta' in param) {
					fishBaseY = blowfish.y + param.delta; // all you have to do is change the base!
				} else if ('absolute' in param) {
					fishBaseY = param.absolute;
				}
				break;
			case 'finale':
				$('#breaths').fadeOut(500);
				createjs.Tween.get(blowfish,{override:true}).to({y:blowfish.y-40},1500,createjs.Ease.bounceIn).call(function(){
					createjs.Tween.get(blowfish,{override:true}).to({y:$(window).height()},4000,createjs.Ease.backInOut).call(function(){
						endGame();
					});
				});
				break;
		}

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
		}; // END - return function
	})();

	/*  logBreaths - Check sensor readings and record successful breaths
		args:	reading		- data point's differential from stretch sensor
		----------------------------------------------- */
	logBreaths = function(reading){
		// change these to alter sensitivity
		var peak = 0.85, valley = 0.1;
		if(reading > peak) { breathing = true; console.log('breath'); }
		if(reading < valley && breathing){
			console.log('breath over');
			breaths.push(new Date());
			$('#breaths li').not('.lit').eq(0).addClass('lit');
			breathing = false;
			if(breaths.length % 4 === 0 ){ // completed a round
				if(blowfish.state !== 1){
					inflateBlowfish(blowfish.state-1);
					$('#breaths li').removeClass('lit');
				} else {
					console.log('game over!');
					manageAnimations('finale');
				}
			}
		}
	};

	var updateY = (function() {
		// var pulseFloor = 50;
		// var pulseCeil = 100;

		var debug_fakery = 10;
		var debug_range = d3.scale.linear()
			.domain([0, 10])
			.range([50, 100]);

		var blowfish_range = d3.scale.linear()
			.clamp(true)
			.domain([50, 100])
			.range([325, 25]);

		var pulse_mavg = (function(){
			var buffer = [];
			var blen = 5;
			return function(val) {
				if (buffer.length === blen) {
					buffer.shift();
				}

				buffer.push(val);
				
				var sum = 0;
				if (buffer.length === blen){
					// Get rid of outliers.  Sometimes the sensor just goes nuts.
					return d3.median(buffer);
				} else {
					// Assume high pulse if we don't have enough data yet.
					return 100;
				}
			};
		})();

		// return function(reading) {};

		// return function(reading) {
		// 	debug_fakery -= 1;
		// 	manageAnimations('updateY', {absolute: blowfish_range(debug_range(debug_fakery))});
		// };

		return function(reading) {
			manageAnimations('updateY', {absolute: blowfish_range(pulse_mavg(reading))});
		};

	})();
	
	/* PUBLIC init - Module Initialization
		args:	container		- the main html element of the view, ID ref
					canvas			- the canvas element for holding the mini-game, ID ref
	----------------------------------------------- */
	init = function(container, canvas){
		jQMap.$container = $(container);
		jQMap.$screen = $(canvas);
		jQMap.$screen[0].width = $(window).width();
		jQMap.$screen[0].height = $(window).height();

		setupScreen();

		// moving through the prompts
		$('#prompt .card .next').on('click',function(e){
			if($(this).closest('.card').is(':last-child')){ // last prompt. start the game
				$('#cards').animate({'left':'-='+$(window).width()+'px'},function(){
					$('#prompt').fadeOut(1000);
				});
				// establish socket connection
				var socket = io.connect("http://localhost:4000");
				socket.on('sensor', function(sensor){
					logBreaths(sensor.diff);
					updateChart(sensor.diff);
				});

				socket.on('pulse', function(sensor) {
					console.log('Pulse: ', sensor.output);
					updateY(sensor.output);
				});

			} else { // cycle to next prompt
				$('#cards').animate({'left':'-='+$(window).width()+'px'});
			}

		});

		$('#cards').on('click','.cancel',function(e){ window.close(); });

		// are we in debug mode?
		if(window.location.search.indexOf('debug') !== -1){
			drawChart();
		}
	};

	/* endGame - Deal with Post Game Response 
	----------------------------------------------- */
	endGame = function(){
		var $endCard = $('#endCard li').eq(0).clone();
		$endCard.appendTo('#cards');
		$('#prompt').fadeIn(500);
		$endCard.on('click','.restart',function(e){
			$('#cards').animate({'left':-$(window).width()+'px'},function(){ // jump to severity card
				$endCard.remove();
				// reset the game
				blowfish.y = fishBaseY = 30;
				$('#breaths').fadeIn().children('li').removeClass('lit');
				breaths = [];
				inflateBlowfish(4);
			});
			return false;
		});

	};

	//-------------------------------- CHARTING FUNCTIONS ( FOR DEBUG ONLY )
	var chart,data,line,x;
	function drawChart(){
		// Set up the data object
		data = {
			min: 0,
			max: 1.2,
			readings: [],
			freq: 0
		};

		// Set up the Chart
		var container = document.getElementById('chart'),
			width = 250,
			height = 90,
			margin = [10,10,10,10];

		chart = d3.select(container).append('svg')
			.attr("width",width)
			.attr("height",height);

		x = d3.scale.linear().domain([0,80]).range([0, width]);
		var y = d3.scale.linear()
			.domain([data.max,data.min])
			.range([0+margin[2],height-margin[0]]);
		var yAxis = d3.svg.axis()
			.scale(y).orient('right');
		chart.append('g').attr('class', 'grid').call(yAxis.tickSize(width,-50,0).tickFormat(""));


		line = d3.svg.line()
			.x(function(d,i){ return x(i+80); })
			.y(function(d){ return y(d); })
			.interpolate("basis");

		chart.append("g").attr("id", "graph")
			.append("path")
			.attr("id","line")
			.attr("d",line(data.readings));

		// Clipping Mask
		chart.append("svg:clipPath")
			.attr("id","clip")
			.append("rect")
			.attr("width",width)
			.attr("height",height)
			.attr("stroke","red")
			.attr("fill","none")
			.attr("transform","translate(0,"+(margin[0])+")");
		d3.select('#graph').attr("clip-path", "url(#clip)");
	}

	function updateChart(point){
		data.readings.push(point);
		chart.select("#line")
			.attr("d",line(data.readings))
			.transition()
			.ease('linear')
			.duration(data.freq)
			.attr("transform", "translate(" + -x(data.readings.length) + ")");
	}
	//-------------------------------- END CHARTING FUNCTIONS ( FOR DEBUG ONLY )

	return {
		init:init,
		anim:manageAnimations
	};

})(jQuery,_,createjs,d3);
