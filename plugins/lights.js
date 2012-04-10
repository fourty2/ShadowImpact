/**
	Dynamic Shadow Casting for ImpactJS (http://www.impactjs.com)

	@version 0.20
    @date 2012-04-10
	@author Marc Henklein ( @snooze82, snooze82@gmail.com )

    see https://github.com/fourty2/ShadowImpact for more information

**/
ig.module(
	'plugins.lights'
)
.requires(
	'impact.impact',
	'impact.entity'
)
.defines(function() {

ig.LightManager = ig.Class.extend({	
	instance: null,
	// singleton behaviour
	staticInstantiate: function(ignore) {
		if (ig.LightManager.instance == null) {
			return null;
		} else {
			return ig.LightManager.instance;
		}
	},
	// defaults
	lights: [],		// this array holds all lightsources
	_drawn: false,  // indicates if there is something to draw
	shadowLayer: null, // canvas and context for shadow map
	shadowCtx: null,
	lightLayer: null, // canvas and context for light map
	lightCtx: null, 
	baseColor: 'rgba(0,0,0,0.6)', // default shadow color
    pulseAngle: 0,
	vector: function(_x,_y){
        this.x = _x;
        this.y = _y;  
    },
    lightSource: function(_entity, _config){
    	this.entity = _entity;
        this.color = _config.color;
        this.shadowColor = _config.shadowColor ? _config.shadowColor : this.color;
        this.useGradients = _config.useGradients ? _config.useGradients : false;
        this.shadowGradientStart = _config.shadowGradientStart;
        this.shadowGradientStop = _config.shadowGradientStop;
        this.lightGradientStart = _config.lightGradientStart;
        this.lightGradientStop = _config.lightGradientStop;
        this.radius = _config.radius;
        this.angleSpread = _config.angleSpread;
        this.position = {x:0,y:0};
        this.angle = _config.angle;
        this.pulseFactor = _config.pulseFactor ? _config.pulseFactor : 5 ;
        this.lightOffset = _config.lightOffset ? _config.lightOffset :  {x:0,y:0};
    },
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
		ig.LightManager.instance = this;
	},
	addLight: function(entity, config) {
		var newLightSource = new this.lightSource(entity, config);
		this.lights.push(newLightSource);
		return newLightSource;
	},
    removeLightByIndex: function(index) {
        if (this.lights.length < index) {
            this.lights.splice(index,1);
        }
    },
    removeLight: function(light) {
        for (var i=0; i<this.lights.length; i++) {
            if (this.lights[i] == light) {
                this.lights.splice(i,1);
                break;
            }
        }
    },
	shine: function() {
		this.drawShadowMap();
		this.drawLightMap();
	},
	update: function() {
		// update position of light sources
		for (var lightIndex = this.lights.length; lightIndex--; ) {
			var l = this.lights[lightIndex];
			l.position.x = l.entity.pos.x - ig.game.screen.x + l.entity.size.x/2 + l.lightOffset.x;
			l.position.y = l.entity.pos.y - ig.game.screen.y + l.entity.size.y/2 + l.lightOffset.y;
            // create gradients 
            if (l.useGradients) {

                l.shadowGradient = this.lightCtx.createRadialGradient(l.position.x, l.position.y, 5, l.position.x, l.position.y, l.radius);
                l.shadowGradient.addColorStop(0, l.shadowGradientStart);
                l.shadowGradient.addColorStop(1, l.shadowGradientStop);

                l.lightGradient = this.lightCtx.createRadialGradient(l.position.x, l.position.y, 5, l.position.x, l.position.y, l.radius);
                l.lightGradient.addColorStop(0, l.lightGradientStart);
                l.lightGradient.addColorStop(1, l.lightGradientStop);
            }

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

		
    	for (var lightIndex = this.lights.length; lightIndex--; ) {
    		var light = this.lights[lightIndex];
    		var localRadius = light.radius + (Math.sin(this.pulseAngle) * light.pulseFactor);
    		this.shadowCtx.save();
    		this.lightCtx.save();

 
            if (light.useGradients) {
                this.lightCtx.fillStyle = light.lightGradient;
                this.shadowCtx.fillStyle = light.shadowGradient;
            } else {
                this.lightCtx.fillStyle = light.color;
                this.shadowCtx.fillStyle = light.shadowColor;
            }
 
            this.shadowCtx.lineWidth = 1;
            this.lightCtx.lineWidth = 1;

			var curAngle = light.angle - (light.angleSpread/2);
			var addTo = 3/ light.radius;

            this.shadowCtx.beginPath();
            this.shadowCtx.moveTo(light.position.x, light.position.y);
            this.lightCtx.beginPath();
            this.lightCtx.moveTo(light.position.x, light.position.y);
			// iterate through each ray
			for(curAngle; curAngle < light.angle + (light.angleSpread/2); curAngle += (addTo * (180/Math.PI))*2) {
        		var dynLen = localRadius; //light.radius; //  + Math.sin((light.angle + light.angleSpread) / 10)*10;
               // dynLen += curAngle;
        	
            	var resultLen = dynLen;
            	var rads = curAngle * (Math.PI / 180),		// 
   	 	        end = new this.vector(light.position.x, light.position.y);
           
   	 	        // start tile-iteration
   	 	        for (var y = ig.system.height; y-=ig.game.collisionMap.tilesize; ) {
        			for (var x=ig.system.width; x-=ig.game.collisionMap.tilesize; ) {
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

        		this.shadowCtx.lineTo(end.x, end.y);        		
        		this.lightCtx.lineTo(end.x, end.y);
                
    		} // end ray/ angle-spread iteration
            this.shadowCtx.closePath();
            this.shadowCtx.fill();
            this.lightCtx.closePath();
            this.lightCtx.fill();
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