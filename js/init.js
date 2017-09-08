const max = 1048576 - 1;

function SAND(canvas) {
    var gl = this.gl = canvas.getContext('webgl', {preserveDrawingBuffer: true});/*Igloo.getContext(canvas);*/
    if (gl == null) {
        alert('Could not initialize WebGL!');
        throw new Error('No WebGL');
    }
	gl.getExtension('OES_texture_float');
	

    this.w = canvas.width;
	this.h = canvas.height;
	
	this.d = 100;
	this.scale = 12;
	
    this.viewsize = vec2(this.w, this.h); // init zoom 
	this.statesize = vec2(this.w, this.h);
//	this.shift = vec2(-$(window).width()/4, -$(window).height()/4);
	

	this.dx = 100;
	this.dz = 100;
	this.zoomspeed = .08;
    
    this.timer = null;
    this.fps = 0;
	this.lasttick = SAND.now();


	this.m = this.d;
	this.n = this.d;
	
	//this.shift = vec2((-$(window).width() + this.m + 77)/(this.scale), ($(window).height() + this.n + 77)/(this.scale));
	this.shift = vec2(800,1100);


	
	this.saves = [];
	this.save_id = 0;
	this.user_saves = 0;
	
	this.identity_saves = [];
	this.identity_id = -1;
	
	this.firing_vectors = [];
	this.firing_vector_id = 0;
	
	this.shape_choice = 1; //default to square
	this.altered = 0;
	
	this.identity = null;
	
	this.brush_height = 0;
	this.brush_type = 0;
	
	this.speed = vec2(1, 1);
	this.frames = 1;
	this.markov = 0;
	this.color = 0.0;

    gl.disable(gl.DEPTH_TEST);
    this.programs = {
        copy: new Igloo.Program(gl, 'glsl/quad.vert', 'glsl/copy.frag'),
        sand: new Igloo.Program(gl, 'glsl/quad.vert', 'glsl/sand.frag'),
		draw: new Igloo.Program(gl, 'glsl/quad.vert', 'glsl/draw.frag')
    };
    this.buffers = {
        quad: new Igloo.Buffer(gl, new Float32Array([
                -1, -1, 1, -1, -1, 1, 1, 1
        ]))
    };
    this.textures = {
        front: this.texture(),
        back: this.texture()
    };
    this.framebuffers = {
        step: gl.createFramebuffer()
    };
	
	this.set_surface(this.shape_choice);
    this.set(this.fullstate(3));
	this.set_outdegree();

}

var sand = null, controller = null;
$(document).ready(function() {
    var $canvas = $('#sand');
    sand = new SAND($canvas[0]).draw().start();
	init_ui();
	$('.zoom').text(sand.scale + 'x zoom');
	$('.size').text(sand.m + ' by ' + sand.n );

    controller = new Controller(sand);

});

$(window).on('keydown', function(event) {
    return !(event.keyCode === 32);
});