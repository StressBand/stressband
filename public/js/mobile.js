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
		stage,breaths = [],breathing,fps = 30,blowfish,
		// function list
		init,setupScreen,updateStage,inflateBlowfish,logBreaths,graph;
	
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
			blowfish.x = Math.floor(jQMap.$screen.width()/2) - 184;
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
		// do some undulating animation on the Y axis here
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
	
	/*  logBreaths - Check sensor readings and record successful breaths
		args:	reading		- data point's differential from stretch sensor
		----------------------------------------------- */
	logBreaths = function(reading){
		var peak = .85, valley = .1;
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
				}
			}
		}
	}
	
	/* PUBLIC init - Module Initialization
		args:	container 	- the main html element of the view, ID ref
				canvas		- the canvas element for holding the mini-game, ID ref
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
				$('#prompt').fadeOut(1000);
				// establish socket connection
				var socket = io.connect("http://localhost:4000");
				socket.on('sensor', function(sensor){
					logBreaths(sensor.diff);
					updateChart(sensor.diff);
				});
			} else { // cycle to next prompt
				$('#cards').animate({'left':'-='+$(window).width()+'px'});
			}

		});
		$('#cancel').on('click',function(e){ window.close() });
	
	
	
		// are we in debug mode?
		if(window.location.search.indexOf('debug') !== -1){
			drawChart();
			$('#controls').css('display','block');
			
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
			
		}		
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
			.attr("d",line(data.readings))
		
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
		init:init
	};
	
})(jQuery,_,createjs,d3);