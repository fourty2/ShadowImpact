ig.module( 
	'game.main' 
)
.requires(
	'impact.game',
	'impact.font',
	'game.entities.player',
	'game.entities.spike',
	'game.levels.test',
	// add our plugin
	'plugins.lights'
)
.defines(function(){

MyGame = ig.Game.extend({
	
	gravity: 300, // All entities are affected by this
	lightManager: '',
	// Load a font
	font: new ig.Font( 'media/04b03.font.png' ),
	
	
	init: function() {
		// Bind keys
		ig.input.bind( ig.KEY.LEFT_ARROW, 'left' );
		ig.input.bind( ig.KEY.RIGHT_ARROW, 'right' );
		ig.input.bind( ig.KEY.X, 'jump' );
		ig.input.bind( ig.KEY.C, 'shoot' );

		// initialize our lightmanager, 
		// the base background color can be added as a optional constructor parameter
		// be sure to add then also the  value array of this color. this is used to paint the background correctly
		 
		this.lightManager = new ig.LightManager('rgba(0,0,0,0.8)', [0,0,0, 255 * 0.8]);

		// Load the LevelTest as required above ('game.level.test')
		this.loadLevel( LevelTest );
	},
	
	update: function() {		
		// Update all entities and BackgroundMaps
		this.parent();
		// screen follows the player
		var player = this.getEntitiesByType( EntityPlayer )[0];
		if( player ) {
			this.screen.x = player.pos.x - ig.system.width/2;
			this.screen.y = player.pos.y - ig.system.height/2;
		}

		// update our shadowmap/lightmap state
		this.lightManager.update();


	},
	
	draw: function() {
		// Draw all entities and BackgroundMaps
		this.parent();
		// within your lib/impact/game.js in function draw() you can order the drawing routines
		// for example:
		// ig.game.lightManager.drawLightMap();		
		// this.drawEntities();
		// ig.game.lightManager.drawShadowMap();	

		// otherwise you can call shine(); directly
		this.lightManager.shine();
		this.font.draw( 'Arrow Keys, X, C', 2, 2 );
	}
});


// Start the Game with 60fps, a resolution of 240x160, scaled
// up by a factor of 2
ig.main( '#canvas', MyGame, 60, 240, 160, 2 );

});
