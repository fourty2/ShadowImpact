ShadowImpact
============

This is a lighting class for  [ImpactJS](http://www.impactjs.com) to provide a simple shadow casting engine.

Features
--------

 * dynamic light sources for multiple entities
 * pulsating shine (torch style)
 * configurable colors
 * configurable light source offset
 * separate drawing methods for darkening layer and light layer 


Example
-------

a simple proof of concept is available here:
http://coldspace.henklein.com/


Installation
------------
* copy the light.js into your game folder
* register the class in your main.js:

```
.requires(
	'game.light'
)
```

* register a LightManager instance in your main.js:

```
MyGame = ig.Game.extend({
	lightManager: '',
	init: function() {
	this.lightManager = new LightManager();
}
```

* add the light manager to the update cycle (in your main.js):

```
update: function() {
	this.parent();
	this.lightManager.update();
}
```

* add the Lighting Draw calls to the impact.js lib/impact/game.js around the entitydrawing ( or somewhere else )

```
draw: function() {
	...
	this.lightManager.drawLightMap();
	this.drawEntities();
 	this.lightManager.drawShadowMap();
}
```

* add your light sources


Usage
-----

The Lighting Engine is Entity driven. That means, you're attaching a light source to an entity.
Lets add a light to our Player:

* in your init function, you add the light source:

```
init: function(x,y,settings) {
...
	this.light = ig.game.lightManager.addLight (this,  // entity
 	5, 	  // starting angle
	125,  // angle spread
	80,  // radius
	'rgba(255,255,255,0.1)', //color
	5,  	  // pulse factor
	{x:0,y:5},  	  // offset (from the middle of the entity)

	);

}
```
* to kill a light, you can use the ```removeLight(light)``` and ```removeLightByIndex(index)``` method.
* that's it! 
* you can change any configuration attribute within game livecycle.
  for example, if your player is in a flip-state, the starting angle has to flip also:

```
update: function() {
	...
	if (this.flip) {
		this.light.angle = 185;
	} else {
		this.light.angle = 5;
	}
}
```