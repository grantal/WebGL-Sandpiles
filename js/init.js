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
	
        // change the scale depending on size of window
        let lowestdim = Math.min($(window).width(), $(window).height());
        if (lowestdim < 600){
	    this.scale = 12*Math.pow((lowestdim/600),2);
        } else {
            this.scale = 12;
        }

        //xshift should be 1236 when window has width 600
        // similar for yshift
        let divisor = 2;
        // None of this math means anything, I just twiddled the numbers until it looked good
        let xshift = ((1236+(600/divisor))-($(window).width()/divisor))+((this.scale-12)*120);
        let yshift = ((1236+(600/divisor))-($(window).height()/divisor))+((this.scale-12)*120);
	this.shift = vec2(xshift, yshift);
	//this.shift = vec2(1236,1100);
    


	
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

  // Here's where we call the routine that builds all the
  // objects we'll be drawing.
  this.buffers3d = this.initBuffers(gl);
  this.xrot = 0;
  this.yrot = 0;

  // load vertex and fragment shaders
  $('#loader').load('glsl/moz.vert', vertCB);
  $('#loader').load('glsl/moz.frag', fragCB);
}

// callback function for when the shaders are loaded that finishes setting everything up
SAND.prototype.initShaders = function(){

  // abort if the vector shader or fragment shader are not loaded 
  if ((typeof this.vsSource === 'undefined') || (typeof this.fsSource === 'undefined')) {
    return false;
  }

  // Initialize a shader program; this is where all the lighting
  // for the vertices and so forth is established.
  const shaderProgram = initShaderProgram(this.gl, this.vsSource, this.fsSource);

  // Collect all the info needed to use the shader program.
  // Look up which attributes our shader program is using
  // for aVertexPosition, aVevrtexColor and also
  // look up uniform locations.
  this.programInfo = {
    program: shaderProgram,
    attribLocations: {
      vertexPosition: this.gl.getAttribLocation(shaderProgram, 'aVertexPosition'),
      vertexColor: this.gl.getAttribLocation(shaderProgram, 'aVertexColor'),
    },
    uniformLocations: {
      projectionMatrix: this.gl.getUniformLocation(shaderProgram, 'uProjectionMatrix'),
      modelViewMatrix: this.gl.getUniformLocation(shaderProgram, 'uModelViewMatrix'),
    },
  };
  return false;
}

// callback function for loading the vertex shader
function vertCB(r){
  sand.vsSource = r;
  sand.initShaders();
}

// callback function for loading the fragment shader
function fragCB(r){
  sand.fsSource = r; // set fsSource to the loaded file
  sand.initShaders();
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
    // arrow key controls to rotate the object
    switch (event.keyCode) {
      case 37: // left
        sand.xrot -= 0.1;
        break;
      case 38: // up
        sand.yrot -= 0.1;
        break;
      case 39: // right
        sand.xrot += 0.1;
        break;
      case 40: // down
        sand.yrot += 0.1;
        break;
    }

    // this was already here
    // I don't know what its for
    return !(event.keyCode === 32);
});




//
// initBuffers
//
// Initialize the buffers we'll need. For this demo, we just
// have one object -- a simple three-dimensional cube.
//
SAND.prototype.initBuffers = function (gl) {

  // Create a buffer for the cube's vertex positions.

  const positionBuffer = gl.createBuffer();

  // Select the positionBuffer as the one to apply buffer
  // operations to from here out.

  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

  // Now create an array of positions for the sandpile.

  let positions = [];
  for (let i = 0; i < this.m; i += 1) {
    for (let j = 0; j < this.n; j += 1) {
      positions = positions.concat(
            (i - (this.m / 2)) / (this.m / 2),
            0,
            (j - (this.n / 2)) / (this.n / 2)
          );
    }
  }

  // Now pass the list of positions into WebGL to build the
  // shape. We do this by creating a Float32Array from the
  // JavaScript array, then use it to fill the current buffer.

  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

  // Now set up the colors for the faces. We'll use solid colors
  // for each face.

  const faceColors = [
    [1.0,  1.0,  1.0,  1.0],    // Front face: white
    [1.0,  0.0,  0.0,  1.0],    // Back face: red
    [0.0,  1.0,  0.0,  1.0],    // Top face: green
    [0.0,  0.0,  1.0,  1.0],    // Bottom face: blue
    [1.0,  1.0,  0.0,  1.0],    // Right face: yellow
    [1.0,  0.0,  1.0,  1.0],    // Left face: purple
  ];

  // Convert the array of colors into a table for all the vertices.

  var colors = [];

  for (var j = 0; j < positions.length; ++j) {
    const c = faceColors[ j % faceColors.length];

    // Repeat each color four times for the four vertices of the face
    colors = colors.concat(c);
  }

  const colorBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);

  // Build the element array buffer; this specifies the indices
  // into the vertex arrays for each face's vertices.

  const indexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);

  // This array defines each face as two triangles, using the
  // indices into the vertex array to specify each triangle's
  // position.

  let indices = [];

  // number of vertices defined by the array 'positions'
  let points = positions.length / 3; 
  console.log(points);

  let width = this.m;
  // each point will connect to the eight points around it with 8 triangles
  // but for each 'j' we will just define the two triangles to the top left 
  // of the point
  for (j = 0; j < points; j++){
    // I'll refer to 'j' as the point at index j
    // if not on the left column
    if (j % width != 0){
      // if not on the first row
      if (j > width){
        // this adds two triangles,
        // one is between the point above j and the point to the top left of j
        // the other is between the top left one and the left one
        indices = indices.concat(j, j - width, (j - width) - 1, 
                                 j, j - 1,        (j - width) - 1);
      }
    }
  }

  console.log(indices);

  // Now send the element array to GL

  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,
      new Uint16Array(indices), gl.STATIC_DRAW);

  return {
    position: positionBuffer,
    color: colorBuffer,
    indices: indexBuffer,
  };
}

//
// Initialize a shader program, so WebGL knows how to draw our data
//
function initShaderProgram(gl, vsSource, fsSource) {
  const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
  const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);

  // Create the shader program

  const shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);

  // If creating the shader program failed, alert

  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    alert('Unable to initialize the shader program: ' + gl.getProgramInfoLog(shaderProgram));
    return null;
  }

  return shaderProgram;
}

//
// creates a shader of the given type, uploads the source and
// compiles it.
//
function loadShader(gl, type, source) {
  const shader = gl.createShader(type);

  // Send the source to the shader object

  gl.shaderSource(shader, source);

  // Compile the shader program

  gl.compileShader(shader);

  // See if it compiled successfully

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    alert('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }

  return shader;
}
