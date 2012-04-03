
/**
	Dynamic Light Sources for ImpactJS (http://www.impactjs.com)

	@version 0.10 - 2012-04-03
	@author Marc Henklein ( @snooze82 )

	@description



*/

ig.module(
	'game.light'
)
.defines(function(){

LightManager = ig.Class.extend({
	vector: function(_x,_y){
        this.x = _x;
        this.y = _y;  
    },
    lightSource: function(_entity, _angle, _angleSpread ,_radius, _color, _pulseFactor, _lightOffset){
    	this.entity = _entity;
        this.color = _color;
        this.radius = _radius;
        this.angleSpread = _angleSpread;
        this.position = {x:0,y:0};
        this.angle = _angle;
        this.pulseFactor = _pulseFactor ? _pulseFactor : 5 ;
        this.lightOffset = _lightOffset ? _lightOffset :  {x:0,y:0};
    },
    shadowLayer: '',
    shadowCtx: '',
    lightLayer: '',
    lightCtx: '',
    baseColor: 'rgba(0,0,0,0.6)',
    pulseAngle: 0,
	lights: [],
	_drawn: false,
	init: function(_baseColor) {
		// build canvas
		this.shadowLayer = ig.$new('canvas');
		this.shadowLayer.width = ig.system.width;
		this.shadowLayer.height = ig.system.height;
		this.shadowCtx = this.shadowLayer.getContext('2d');

		this.lightLayer = ig.$new('canvas');
		this.lightLayer.width = ig.system.width;
		this.lightLayer.height = ig.system.height;
		this.lightCtx = this.lightLayer.getContext('2d');


		if (_baseColor) this.baseColor = _baseColor;
	},
	addLight: function(entity, startAngle, angleSpread, radius, color, pulseFactor, lightOffset) {
		var newLightSource = new this.lightSource(entity, startAngle, angleSpread, radius, color, pulseFactor, lightOffset);
		this.lights.push(newLightSource);
		return newLightSource;
	},
	shine: function() {
		this.drawShadowMap();
		this.drawLightMap();
	},
	update: function() {
		// update position of light sources
		for (var lightIndex = 0; lightIndex < this.lights.length; lightIndex++) {
			var l = this.lights[lightIndex];
			l.position.x = l.entity.pos.x - ig.game.screen.x + l.entity.size.x/2 + l.lightOffset.x;
			l.position.y = l.entity.pos.y - ig.game.screen.y + l.entity.size.y/2 + l.lightOffset.y;
		}
		this._drawn = false;

	},
	drawMaps: function() {
		// do not draw if not yet updated
		if (this._drawn) return;

		// update pulsating
    	this.pulseAngle += 0.03;

    	this.shadowCtx.clearRect(0,0, this.shadowLayer.width, this.shadowLayer.height);
    	this.lightCtx.clearRect(0,0, this.shadowLayer.width, this.shadowLayer.height);

    	// fill canvas with dark, semi transparent color ...
    	this.shadowCtx.fillStyle = this.baseColor; // configurable
 		this.shadowCtx.fillRect(0,0, ig.system.width, ig.system.height);

 		// ... and cut out our lightrays
		this.shadowCtx.globalCompositeOperation = 'source-out';

		
    	for (var lightIndex = 0; lightIndex < this.lights.length; lightIndex++) {
    		var light = this.lights[lightIndex];
    	
    		// BUGFIX: hier lokalte radius variable nehmen, wenn die nicht richtig benutzt wird. 
    		var localRadius = light.radius + (Math.sin(this.pulseAngle) * light.pulseFactor);
    		this.shadowCtx.save();
    		this.lightCtx.save();

			this.shadowCtx.strokeStyle = light.color;
			this.shadowCtx.lineWidth = 5;

			this.lightCtx.strokeStyle = light.color;
			this.lightCtx.lineWidth = 5;

			var curAngle = light.angle - (light.angleSpread/2);
			var addTo = 3/ light.radius;

			// iterate through each ray
			for(curAngle; curAngle < light.angle + (light.angleSpread/2); curAngle += (addTo * (180/Math.PI))*2) {
        		var dynLen = localRadius; //light.radius; //  + Math.sin((light.angle + light.angleSpread) / 10)*10;
        
        	
            	var resultLen = dynLen;


            	var rads = curAngle * (Math.PI / 180),		// 
   	 	        end = new this.vector(light.position.x, light.position.y);

   	 	        // start tile-iteration
   	 	        for (var y=0; y<=ig.system.height; y+=ig.game.collisionMap.tilesize) {
        			for (var x=0; x<=ig.system.width; x+=ig.game.collisionMap.tilesize) {
        				if (ig.game.collisionMap.getTile(x+ig.game.screen.x, y+ig.game.screen.y) == 1) {
        					
        					var distY = ((y+ig.game.collisionMap.tilesize/2)) - light.position.y;
        					var distX = ((x+ig.game.collisionMap.tilesize/2)) - light.position.x;
        					var newDist =  Math.sqrt((distY*distY) + (distX*distX));
        					if (localRadius >= newDist) {

        						//var rads = curAngle * (Math.PI / 180),
  				        		var pointPos = new this.vector(light.position.x, light.position.y);
        
     	 						pointPos.x += Math.cos(rads) * newDist;
       							pointPos.y += Math.sin(rads) * newDist;

       							
       							if (pointPos.x > (x) && pointPos.x < (x + ig.game.collisionMap.tilesize) && pointPos.y > (y) && pointPos.y < (y + ig.game.collisionMap.tilesize) && newDist < resultLen) {
    									resultLen = newDist;
       					 		}
        					}
        				}
        			}
       			}

   	 	        // end tile iteration

   	 	        end.x += Math.cos(rads) * resultLen;
        		end.y += Math.sin(rads) * resultLen;

        		this.shadowCtx.beginPath();
        		this.shadowCtx.moveTo(light.position.x, light.position.y);
        		this.shadowCtx.lineTo(end.x, end.y);
        		this.shadowCtx.closePath();
        		this.shadowCtx.stroke();

        		this.lightCtx.beginPath();
        		this.lightCtx.moveTo(light.position.x, light.position.y);
        		this.lightCtx.lineTo(end.x, end.y);
        		this.lightCtx.closePath();
        		this.lightCtx.stroke();
		
    		} // end ray/ angle-spread iteration

    		// ready to restore
    		this.lightCtx.restore();
			this.shadowCtx.restore();

	    } // light iteration

		this._drawn = true;
	},
	drawLightMap: function() {
		if (!this._drawn) this.drawMaps();
     	ig.system.context.drawImage(this.lightLayer,0,0, ig.system.width * ig.system.scale, ig.system.height * ig.system.scale);

	},
	drawShadowMap: function() {
 		if (!this._drawn) this.drawMaps();
    	ig.system.context.drawImage(this.shadowLayer,0,0, ig.system.width * ig.system.scale, ig.system.height * ig.system.scale);
	}

});

});