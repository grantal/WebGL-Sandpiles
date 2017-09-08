const max = 1048576 - 1;
const capacity = 4;
var captureFrame = false;

function resize(canvas) {
  // Lookup the size the browser is displaying the canvas.
  var displayWidth  = canvas.clientWidth;
  var displayHeight = canvas.clientHeight;
 
  // Check if the canvas is not the same size.
  if (canvas.width  != displayWidth ||
      canvas.height != displayHeight) {
 
    // Make the canvas the same size
    canvas.width  = displayWidth;
    canvas.height = displayHeight;
  }
}

function SAND(canvas, scale) {
    var gl = this.gl = canvas.getContext('webgl', {preserveDrawingBuffer: true});/*Igloo.getContext(canvas);*/
    if (gl == null) {
        alert('Could not initialize WebGL!');
        throw new Error('No WebGL');
    }
	gl.getExtension('OES_texture_float');
	
    scale = this.scale = 1;
    this.w = canvas.width;
	this.h = canvas.height;
    this.viewsize = vec2(this.w, this.h);
	this.viewx = 0;
	this.viewy = 0;
	this.dx = 100;
	this.dz = 300;
    this.statesize = vec2(this.w / scale, this.h / scale);
    this.timer = null;
    this.lasttick = SAND.now();
    this.fps = 0;
	
	this.d = 100.0;
	
	this.m = this.d;
	this.n = this.d;
	this.res = vec2(this.m, this.n);
	
	this.shift = vec2(-this.w/2, this.h/128);
	
	this.saves = [];
	this.save_id = 0;
	this.user_saves = 0;
	
	this.firing_vectors = [];
	this.firing_vector_id = 0;
	
	this.shape_choice = 1; //default to square

	this.identity = null;
	
	this.brush_height = 0;
	this.brush_type = 0;
	
	this.speed = 1;
	this.frames = 1;
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
    this.set(this.fullstate(0));
	//alert(this.get());
	/* this.step();
	this.draw();
	this.fire_sink_until_id(); */
	//this.set(this.add_random(this.get()));
	
	
	var toolbar = document.createElement( 'div' );
	toolbar.style.position = 'absolute';
	toolbar.style.top = '25px';
	toolbar.style.left = '25px';
	document.body.appendChild( toolbar );

	var rightside = document.createElement( 'div' );
	rightside.style.cssFloat = 'left';
	toolbar.appendChild( rightside );
	
 	

	

	add_form(toolbar, "inspect_val", "1", 'Inspect', f = function() {
		sand.brush_type = 6;
	});	
	add_form(toolbar, "full_field", "4", 'Set each cell to n', f = function() {
		sand.set(sand.fullstate($("#full_field").val()))		
	});
	
	
	
	add_form(toolbar, "arithmetic_field", "4", 'Add n to each cell', f = function() {
		sand.plus($("#arithmetic_field").val());
		sand.draw()
	});	
	
	var save_div = document.createElement( 'div' );
	save_div.setAttribute('id', 'saves');
	
	var adds_div = document.createElement( 'div' );
	adds_div.setAttribute('id', 'adds');
	
	add_form(toolbar, "fire_sink_field", "1", 'Fire sink k times', f = function() {
		sand.fire_sink($("#fire_sink_field").val());	
		sand.canvas.focus();
	});		
	add_form(toolbar, "height_field", "1", 'Set clicked cells to n', f = function() {
		sand.brush_height = ($("#height_field").val());
		sand.brush_type = 4;
	});	
	br(toolbar);
	add_form(toolbar, "save_field", "my sandpile", 'Save state', f = function() {
		sand.save();	
		sand.user_saves += 1;
		
		var newButton = document.createElement("input");
		newButton.type = "button";
		newButton.id = sand.save_id - 1;
		newButton.value = "load " + ($("#save_field").val());		
		newButton.onclick = function(){
			sand.load(newButton.id);
		};
		document.getElementById("saves").appendChild(newButton); 
		
		var newButtonAdd = document.createElement("input");
		newButtonAdd.type = "button";
		newButtonAdd.id = sand.save_id - 1;
		newButtonAdd.value = "add " + ($("#save_field").val());		
		newButtonAdd.onclick = function(){
			sand.set(sand.add(sand.saves[newButtonAdd.id], sand.get()));
		};
		document.getElementById("adds").appendChild(newButtonAdd); 	
	});	
	toolbar.appendChild(save_div);	
	toolbar.appendChild(adds_div);
	
	var firing_vectors_div = document.createElement( 'div' );
	firing_vectors_div.setAttribute('id', 'firing_vectors');	
	add_form(toolbar, "save_firing_vector_field", "my vector", 'Save firing vector', f = function() {

		sand.save_firing_vector();
		var newButton = document.createElement("input");
		newButton.type = "button";
		newButton.id = sand.firing_vector_id - 1;
		newButton.value = "fire " + ($("#save_firing_vector_field").val());		
		newButton.onclick = function(){
			sand.fire_vector(sand.firing_vectors[newButton.id]);

		};
		document.getElementById("firing_vectors").appendChild(newButton); 
	});		
	toolbar.appendChild(firing_vectors_div);
	
	
	
	add_form(toolbar, "name_field", "my sandpile", 'Download state', f = function() {
		var state = sand.get();
		download("data:text/csv;charset=utf-8," + state, $( "#name_field").val() + ".txt");
	});		
	
	add_form(toolbar, "speed_field", "1", 'Frames per millisecond', f = function() {
		sand.set_speed($( "#speed_field" ).val(), $( "#delay_field" ).val());	
		sand.draw()
	});	
	
	add_form(toolbar, "delay_field", "1", 'Milliseconds per frame', f = function() {
		sand.set_speed($( "#speed_field" ).val(), $( "#delay_field" ).val());	
		sand.draw()
	});	
	
	add_form(toolbar, "run_field", "100", 'Run for n steps', f = function() {
		sand.run($( "#run_field" ).val());
		sand.draw()
	});	
	
	

	//brush tools
	add_button(rightside, 'Add single grains', f = function() {
		sand.brush_type = 0;
	});
	
	add_button(rightside, 'Add sinks', f = function() {
		sand.brush_type = 1;
	});
	
	add_button(rightside, 'Add sources', f = function() {
		sand.brush_type = 2;
	});

	add_button(rightside, 'Add walls', f = function() {
		sand.brush_type = 3;
	});
	
	add_button(rightside, 'Fire', f = function() {
		sand.brush_type = 5;
	});
	
	

	
	
	
	
	add_form(toolbar, "size_field", this.d, 'Choose grid size', f = function() {
		var n = ($("#size_field").val());
			
		if (n < sand.w/sand.scale){
			sand.m = n;
			sand.n = n;
			sand.res.x = n;
			sand.res.y = n;
			sand.reset();
			sand.set_surface(1);
		} else {
			alert("Please choose a smaller grid. Max is " + (sand.w/sand.scale - 1) + ".");
		}
	});	
	
/* 	add_button(toolbar, 'fire_sink_until_id', f = function() {
		
	}); */
	
	

	add_form(toolbar, "state_val", "", 'Get state', f = function() {
		$("#state_val").val(sand.get());
	});

	add_form(toolbar, "firings_val", "", 'Get total firings', f = function() {
		var gl = sand.gl;
		var state = sand.get();
		var n = 0;
		
		for (var i = 0; i < state.length; i += 4){
			n += state[i + 3]; 
			//alert(n)
		} 
		
		//alert(n);
		$("#firings_val").val(n);
	});

	add_form(toolbar, "vector_val", "", 'Get firing vector', f = function() {
		var vec = sand.get_firing_vector(sand.get());
		$("#vector_val").val(vec);
		copyToClipboard(vec);
	});

	
	br(rightside);
	add_button(rightside, 'Calculate Identity', f = function() {
		sand.set_identity();
	});

	add_button(rightside, 'Approximate k', f = function() {
		$("#fire_sink_field").val(sand.approx_k());
	});

	add_button(rightside, 'Approximate Identity', f = function() {
		var n = sand.n;
		var m = sand.m;
		if (n == m){
			//alert('This may take a while');
			sand.reset();
			var v = sand.approx_identity(n);
			sand.fire_vector(v);
			$("#vector_val").val(v);
		} else {
			alert("This function not yet implemented for nonsquare grids")
		}
	});
		br(rightside);
		
	add_button(rightside, 'Stabilize', f = function() {
		sand.stabilize();
	});
	
	add_button(rightside, 'Dualize', f = function() {
		sand.dualize();
	});
	add_button(rightside, 'Reset', f = function() {
		sand.reset();
	});
	add_button(rightside, 'Clear firing vector', f = function() {
		sand.clear_firing_history();
		sand.draw();
	});
	br(rightside);
	add_button(rightside, 'Add a random grain', f = function() {
		sand.set(sand.add_random(sand.get()));
		sand.draw();
	});

	add_button(rightside, 'Calculate recurrent inverse of current state', f = function() {
		sand.rec_inverse();
		sand.draw();
	});
	add_form(toolbar, "fire_field", "my vector", 'Fire a vector', f = function() {
		sand.fire_vector($("#fire_field").val().split(",").map(Number));
	});	
	
	add_form(toolbar, "paste_field", "my state", 'Load a state', f = function() {
		sand.set($( "#paste_field" ).val().split(",").map(Number));
		sand.draw()
	});	
	
/* 	add_form(toolbar, "zoomval", "1000", 'Zoom', f = function() {
		sand.viewsize.x = $('#zoomval').val();
		sand.viewsize.y = $('#zoomval').val();
	});	
/*  */
/* 	add_form(toolbar, "zoomrateval", "300", 'Set zoom rate', f = function() {
		sand.dz = $("#zoomrateval").val();
	});	 */
	 
	var colors = [['Wesley', 0],['Luis', 1],['Which just fired', 2],['Unstable cells', 3],['Firing vector', 4],['256*3 colors', 5],['256^3 colors', 6]];
	add_select(toolbar, colors, f = function(e) {
		sand.color = e.target.value;
	});
}

function br(parent){
	var blank = document.createElement("br");
	parent.appendChild(blank);	
}

function add_select(parent, options, selectfunc){
	var select = document.createElement( 'select' );
	for (var i = 0; i < options.length; i++) {
		var option = document.createElement('option');
		option.textContent = options[i][0];
		option.value = options[i][1];
		select.appendChild(option) ;
	}

	select.addEventListener( 'change', function (event) {
		
		selectfunc(event);
		f.blur();
	});
	
	parent.appendChild(select);
}

function add_button(parent, buttontext, buttonfunc){
	var f = document.createElement('button'); 
	f.textContent = buttontext;
	f.addEventListener('click', function(event){
		event.preventDefault();
		buttonfunc();
		f.blur();
	}); 
	parent.appendChild( f );
}

function add_form(parent, fieldname, fieldval, buttontext, buttonfunc){
	var f = document.createElement('form');	
	
	var i = document.createElement("input"); 	
	i.setAttribute('type',"text");
	i.setAttribute('id',fieldname);
	i.setAttribute('value',fieldval);

	var s = document.createElement('button'); 
	s.setAttribute('type',"submit");
	s.textContent = buttontext;
	
	f.addEventListener('submit', function(event){
		event.preventDefault();
		buttonfunc(fieldname);
		i.blur();
	}); 
	
	f.appendChild( i );
	f.appendChild( s );	
	parent.appendChild( f );
}

SAND.now = function() {
    return Math.floor(Date.now() / 1000);
};

SAND.prototype.texture = function() {
	var state = new Float32Array(this.statesize.x * this.statesize.y * 4);
	for (var i = 0; i < state.length; i += 1) {
		state[i] = 0;
	}
	//alert(state);

    var gl = this.gl;
    var tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA,
                  this.statesize.x, this.statesize.y,
                  0, gl.RGBA, gl.FLOAT, state);
    return tex;
};

SAND.prototype.set = function(state) {
	var gl = this.gl;
    var rgba = new Float32Array(this.statesize.x * this.statesize.y * 4);
    for (var i = 0; i < state.length; i+=4) {
        rgba[i + 0] = state[i]/max;
		rgba[i + 1] = state[i + 1]/max;
		rgba[i + 2] = state[i + 2]/max;
        rgba[i + 3] = state[i + 3]/max;
    }
	 
    gl.bindTexture(gl.TEXTURE_2D, this.textures.front);
    gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0,
                     this.statesize.x, this.statesize.y,
                     gl.RGBA, gl.FLOAT, rgba);
					 
	//console.log(state); 
    return this;
};

SAND.prototype.setRandom = function(p) {
    var gl = this.gl, size = this.statesize.x * this.statesize.y;
	var state = this.get();
  
  
    
    for (var i = 0; i <= size*4; i = i + 4) {
		var r = Math.random();	
		for (var j = 1; j <= 4 ; j++){
			if (r <= (j/4)){
				state[i] = j - 1;
				break;
			}
		}
	}
	
    this.set(state); 
};

SAND.prototype.set_surface = function(n) {
	var gl = this.gl, w = this.statesize.x, h = this.statesize.y;
	var state = this.get();
	
	
	switch(n){
		case 0:
			for (var i = 0; i < state.length; i += 4) {
				
				if (i % 3 == 0 || i % 5 == 0){
					state[i + 1] = 0;
				} 
			}
			
			break;
			
		case 1:
			for (var i = 0; i < w; i++) {
				for (var j = 0; j < h; j++) {
					
					if (i < (w - this.res.x)/2.0 || i > w - .5 - (w - this.res.x)/2.0  || j < (h - this.res.y)/2.0 || j > h - .5 - (h - this.res.y)/2.0){
						
						state[(i + j*w)*4 + 1] = 0;
					} else {
						state[(i + j*w)*4 + 1] = 1;
					}
				}
			}
			
			break;
			
		case 2:
			for (var i = 0; i < w; i++) {
				for (var j = 0; j < h; j++) {
					
					if ((i - w*.5)*(i -  w*.5) + (j -  h*.5)*(j -  h*.5) > 1000.0)  {
						
						state[(i + j*w)*4 + 1] = 0;
					} else {
						state[(i + j*w)*4 + 1] = 1;
					}
				}
			}
			
			break;
			
		case 3:
			for (var i = 0; i < w; i++) {
				for (var j = 0; j < h; j++) {
					
					if (j > 100.0 || j < 200.0 || i > 200.0 || i < 100.00){
						
						state[(i + j*w)*4 + 1] = 1;
					} else {
						state[(i + j*w)*4 + 1] = 0;
					}
				}
			}
			
			break;
			
	}
	this.set(state); 
};


//reads the state to see which cells are not sinks (including on the outside)

//do this version if i want to keep a list always in the sand process, oterwise do version below

/* SAND.prototype.get_region = function() {
	var gl = this.gl;
	var state = this.get();
	
	for (var i = 0; i < state.length; i += 4){
		//check if current cell is already in the region list or not
		var index = this.region.indexOf(i);
		if (index == -1) {	//if not
			if (state[i + 1] != 1){ //but it should be
				this.region.push(i); //the add it
			}
		} else {	//otherwise check if it should be taken out of the region
			if (state[i + 1] == 1){
				this.region.splice(index, 1);
			}
		}
	}
};

//changes the region by adding or removing cells in cell list
SAND.prototype.edit_region = function(cell_list, action) {
	if (action == 0){
		for (var i = 0; i < cell_list.length; i++){
			this.region.push(cell_list[i]);
		}
	} else {
		for (var i = 0; i < cell_list.length; i++){
			var index = this.region.indexOf(cell_list[i]);
			if (index != -1){
				this.region.splice(index, 1);
			}
		}
	}
};

*/

SAND.prototype.get_region = function(state) {
	var region = [];
	
	for (var i = 0; i < state.length; i += 4){
		if (state[i + 1] == 1){ 
			region.push(i);
		}
	}
	
	return region;
};
 
SAND.prototype.add_random = function(state) {
	var region = this.get_region(state);
	
	var r = Math.floor(Math.random() * region.length);
	state[region[r]] += 1;
	
	return state;
};

SAND.prototype.fullstate = function(n) {
	var state = this.get();
	for (var i = 0; i < state.length; i += 1){
		//if (state[4*i + 1] == 1){
			state[4*i] = n;
		//}
	}
	return state;
};

SAND.prototype.reset = function() {	
	var gl = this.gl;
	var state = this.get();
	
	for (var i = 0; i < state.length; i += 1) {	
		state[i] = 0;							
    }
	
    this.set(state);
	this.set_surface(this.shape_choice);
};

SAND.prototype.clear_firing_history = function() {	
	var gl = this.gl;
	var state = this.get();
	
	for (var i = 0; i < state.length; i += 4) {	
		state[i + 3] = 0;							
    }
	
    this.set(state);
};

SAND.prototype.swap = function() {
    var tmp = this.textures.front;
    this.textures.front = this.textures.back;
    this.textures.back = tmp;
    return this;
};

SAND.prototype.step = function() {
    if (SAND.now() != this.lasttick) {
        $('.fps').text(this.fps + ' FPS');
        this.lasttick = SAND.now();
        this.fps = 0;
    } else {
        this.fps++;
    }
    var gl = this.gl;
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffers.step);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0,
                            gl.TEXTURE_2D, this.textures.back, 0);
    gl.bindTexture(gl.TEXTURE_2D, this.textures.front);
    gl.viewport(0, 0, this.statesize.x, this.statesize.y);
	//gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
	resize(gl.canvas);
    this.programs.sand.use()
        .attrib('quad', this.buffers.quad, 2)
        .uniform('state', 0, true)
        .uniform('matrix1', vec3(1,0,0))
		.uniform('matrix2', vec3(0,1,0))
		.uniform('matrix3', vec3(0,0,1))
        .uniform('scale', this.statesize)
		.uniform('res', this.res)
		//.uniformi('shape', 1) ugh figure this out
/* 		.uniform('max', max)
		.uniform('capacity', capacity) */
        .draw(gl.TRIANGLE_STRIP, 4);
    this.swap();
	//console.log(this.get());
    return this;
};


SAND.prototype.draw = function() {
    var gl = this.gl;
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.bindTexture(gl.TEXTURE_2D, this.textures.front);
	
	var z = 0;
	
	var mat = mats.translation(z,z);
	
	var matrix1 = vec3(mat[0], mat[1], mat[2]);
	var matrix2 = vec3(mat[3], mat[4], mat[5]);
	var matrix3 = vec3(mat[6], mat[7], mat[8]);
	
	//console.log(this.buffers.quad);
	resize(gl.canvas);
    //gl.viewport(0, 0, this.viewsize.x, this.viewsize.y);
	gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    this.programs.draw.use()
        .attrib('quad', this.buffers.quad, 2)

		.uniform('matrix1', matrix1)
		.uniform('matrix2', matrix2)
		.uniform('matrix3', matrix3)
		
        .uniform('state', 0, true)
        .uniform('scale',  this.viewsize)
        .uniform('shift',  this.shift)
		.uniform('color', this.color)
 		//.uniform('choices', this.choices) 
		
/* 		.uniform('max', max) */
		
 		
/*        .uniform('max_colors', this.max_colors)
        .uniform('color_schemes', this.color_schemes)
        .uniform('colors', this.colors) */
		
        .draw(gl.TRIANGLE_STRIP, 4);
		
 	/*if (captureFrame){
		captureFrame = false;
/		var webglImage = (function convertCanvasToImage(canvas) {
			var image = new Image();
			image.id = "pic"
			image.src = canvas.toDataURL();
			document.getElementById('sand').appendChild(image);
			return img;
		})(document.querySelectorAll('canvas')[0]); 
		canvasToImg();
*/
	 	
	
    return this;
};

function canvasToImg() {
      var canvas = document.getElementById('sand');
      //var ctx = canvas.getContext("webgl", {preserveDrawingBuffer: true});
	  
     /* //draw a red box
      ctx.fillStyle="#FF0000";
      ctx.fillRect(10,10,30,30); */

      var url = canvas.toDataURL("image/png", 1);

      var newImg = document.createElement("img");
      newImg.src = url;
      document.body.appendChild(newImg); 
};

SAND.prototype.save = function() {
	this.saves.push(sand.get());
	this.save_id = this.save_id + 1;
};

SAND.prototype.load = function(n) {
	this.set(this.saves[n]);
};

//these mats copied from webglfundamentals
var mats = {
  projection: function(width, height) {
    return [
      2 / width, 0, 0,
      0, -2 / height, 0,
      -1, 1, 1
    ];
  },

  identity: function() {
    return [
      1, 0, 0,
      0, 1, 0,
      0, 0, 1,
    ];
  },

  translation: function(tx, ty) {
    return [
      1, 0, 0,
      0, 1, 0,
      tx, ty, 1,
    ];
  },

  scaling: function(sx, sy) {
    return [
      sx, 0, 0,
      0, sy, 0,
      0, 0, 1,
    ];
  },
  
  multiply: function(a, b) {
    var a00 = a[0 * 3 + 0];
    var a01 = a[0 * 3 + 1];
    var a02 = a[0 * 3 + 2];
    var a10 = a[1 * 3 + 0];
    var a11 = a[1 * 3 + 1];
    var a12 = a[1 * 3 + 2];
    var a20 = a[2 * 3 + 0];
    var a21 = a[2 * 3 + 1];
    var a22 = a[2 * 3 + 2];
    var b00 = b[0 * 3 + 0];
    var b01 = b[0 * 3 + 1];
    var b02 = b[0 * 3 + 2];
    var b10 = b[1 * 3 + 0];
    var b11 = b[1 * 3 + 1];
    var b12 = b[1 * 3 + 2];
    var b20 = b[2 * 3 + 0];
    var b21 = b[2 * 3 + 1];
    var b22 = b[2 * 3 + 2];
    return [
      b00 * a00 + b01 * a10 + b02 * a20,
      b00 * a01 + b01 * a11 + b02 * a21,
      b00 * a02 + b01 * a12 + b02 * a22,
      b10 * a00 + b11 * a10 + b12 * a20,
      b10 * a01 + b11 * a11 + b12 * a21,
      b10 * a02 + b11 * a12 + b12 * a22,
      b20 * a00 + b21 * a10 + b22 * a20,
      b20 * a01 + b21 * a11 + b22 * a21,
      b20 * a02 + b21 * a12 + b22 * a22,
    ];
  },
  
  translate: function(m, tx, ty) {
    return mats.multiply(m, mats.translation(tx, ty));
  },

  scale: function(m, sx, sy) {
    return mats.multiply(m, mats.scaling(sx, sy));
  },
  
};

SAND.prototype.brush = function(x, y, choice, type) {
    var gl = this.gl, w = this.statesize.x, h = this.statesize.y;
	var state = this.get();
	
	switch(type){
		case 0:		
			if (choice){
				state[(x + y*w)*4] += 1;
			} else {
				state[(x + y*w)*4] -= 1;	
			}
			this.set(state);
			break;
			
		case 1:
			if (choice){
				state[(x + y*w)*4 + 1] = 0;
			} else {
				state[(x + y*w)*4 + 1] = 1;
			}
			this.set(state);
			break;
			
		case 2:
			if (choice){
				state[(x + y*w)*4 + 1] = 2;
			} else {
				state[(x + y*w)*4 + 1] = 1;
			}
			this.set(state);
			break;
			
		case 3:
			if (choice){
				state[(x + y*w)*4 + 1] = 3;
			} else {
				state[(x + y*w)*4 + 1] = 1;
			}
			this.set(state);
			break;
			
		case 4:
			if (choice){
				state[(x + y*w)*4] = this.brush_height;
			}
			this.set(state);
			break;
			
		case 5:
			if (choice){
				state[(x + y*w)*4] -= 4;
				
				state[(x + 1 + y*w)*4] += 1;
				state[(x - 1 + y*w)*4] += 1;
				state[(x + (y + 1)*w)*4] += 1;
				state[(x + (y - 1)*w)*4] += 1;
			} else {
				state[(x + y*w)*4] += 4;
				
				state[(x + 1 + y*w)*4] -= 1;
				state[(x - 1 + y*w)*4] -= 1;
				state[(x + (y + 1)*w)*4] -= 1;
				state[(x + (y - 1)*w)*4] -= 1;
			}
			state[(x + y*w)*4 + 2] = 10;
			this.set(state);
			break;
			
		case 6:
			$("#inspect_val").val(state.slice((x+y*w)*4, (x+y*w)*4 + 4));					
			break;
	}					
}; 


//called when clicking to add or delete cells from the region
SAND.prototype.draw_surface = function(x, y, choice){
	var gl = this.gl, w = this.statesize.x, h = this.statesize.y;
	var state = this.get();
	
	if (choice){
		state[(x + y*w)*4 + 1] = 1;
	} else {
		state[(x + y*w)*4 + 1] = 0;
	}
		
    this.set(state);
};

SAND.prototype.get = function() {
    var gl = this.gl, w = this.statesize.x, h = this.statesize.y;
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffers.step);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0,
                            gl.TEXTURE_2D, this.textures.front, 0);
    var state = new Float32Array(w * h * 4);
    gl.readPixels(0, 0, w, h, gl.RGBA, gl.FLOAT, state);
	//console.log(state)
	 for (var i = 0; i < state.length; i++) {   
		state[i] = state[i]*max;
	}  
	
	//console.log(state); 
    return state;
};

SAND.prototype.check_stable = function() {
	var gl = this.gl, w = this.statesize.x, h = this.statesize.y;
    var state = this.get();
	
	for (var i = 0; i < w * h * 4; i = i + 4) {      
		//alert(state[i+2]);
		if (state[i + 2] == 10 || state[i + 2] == 11){
			return 1;
		}
	}
	
	return 0;
}

//calculates closeness of two states
SAND.prototype.distance = function(state_1, state_2){
	var d = 0;
	
	for (var i = 0; i < state_1.length; i = i + 4) {   
		d += Math.pow(state_2[i] - state_1[i], 2);
	} 
	 
	return d;
};

SAND.prototype.markov_approximation = function(target) {
/* 	//if n is zero iterate until done
	if (n == 0) {
		var d; 
		while(d != 0){
			d = sand.markov_approximation(1, target);	
		}		
	} else {	 */
	
	//get state		
	var gl = this.gl, w = this.statesize.x, h = this.statesize.y;
	var init_state = this.get();

	//compare with target
	var d1 = sand.distance(init_state, target);
	
	//add a random grain
	var new_state = this.get();
	this.set(this.add_random(new_state));
	
	//while(!sand.check_stable()){sand.step();};
	//this.pause_markov_approximation();

	this.stabilize();//still not sure whats going wrong here, if anything
/* 	for(var i = 0; i < 1000; i++){
		this.step();
		this.draw();
	}
 */
	
	//compare with target
	var d2 = sand.distance(new_state, target);

/* 	alert(d1);
	alert(d2); */

	//if further, return to initial state
	if (d2 > d1) {
		this.set(init_state); 
		/* this.setFull(4); */alert(d1);alert(d2);
	}
 
	//display the state
	sand.draw();
		
	return sand.distance(this.get(), target);
};

SAND.prototype.start_markov_approximation = function(target, n) {
	sand.toggle();
	if (this.markov_timer == null) {
        this.markov_timer = setInterval(function(){
			for (var i = 0; i < n; i++) {
				if (sand.markov_approximation(target) == 0){
					sand.pause_markov_approximation();
				}	
				//sand.draw();	
			}
			
		}, 1);
    }
	sand.toggle();
};

SAND.prototype.pause_markov_approximation = function() {
	clearInterval(this.markov_timer);
    this.markov_timer = null;
};

SAND.prototype.plus = function(n) {
	var state = sand.get();
	for (var i = 0; i <= state.length; i = i + 4){
		if (state[i + 1] == 1){
			for (var j = 0; j < n; j++){
					state[i] = state[i] + 1;
				}	
			}
		//}
	}
	sand.set(state);
};

SAND.prototype.minus = function(n) {
	var state = sand.get();
	for (var i = 0; i <= state.length; i = i + 4){
		if (state[i] - n >= 0) {
			state[i] = state[i] - n;
		} else {
			state[i] = 0
		}		
	}
	sand.set(state);
};

SAND.prototype.dualize = function() {
	var state = sand.get();
	for (var i = 0; i <= state.length; i += 4){
		state[i] = 3 - state[i];
	}
	sand.set(state);
};

SAND.prototype.start = function(n,m) {
    if (this.timer == null) {
        this.timer = setInterval(function(){
            for(var i = 0; i < n; i++){
				sand.step();
			}
			sand.draw();
        }, m);
    }
    return this;
};

SAND.prototype.set_speed = function(n,m) {
	this.stop();
	this.start(n,m);
};

SAND.prototype.stabilize = function() {
 	var gl = this.gl, w = this.statesize.x, h = this.statesize.y;
    var state = this.get();
	
	this.step();
	
	sand.set_speed(100,1);
	for (var i = 0; i < w * h * 4; i = i + 4) {      
		if (state[i + 1] == 2){
			alert("Cannot stabilize when source cells are present.");
			return 0;
		}
	}
	
	while (this.check_stable()){
		for(var i = 0; i < 1000; i++){
			this.step();
		}
	}
	
	sand.set_speed(1,1);
	this.draw();
	return 1;
};

SAND.prototype.set_identity = function() {
	//should readd the functionality of saving identity but
	//i need to save what the souce/sink state was at the time 
	//which is kind of fiddly
	
	//if (this.identity){
	//	this.set(this.identity);
//	} else {
		/* sand.stop();
		sand.set(sand.fullstate(0));
		sand.plus(6);
		//sand.step();
		
		sand.stabilize();
		sand.draw();
		
		sand.dualize();
		sand.plus(3); 
		//sand.step();
		
		sand.stabilize();
		this.start(this.speed, this.frames); */
		alert("This may take a while.");
		this.reset();
		this.fire_sink(this.approx_k());
		this.fire_sink_until_id([0, 0, 1000, 1, 1]);
		this.identity = sand.get();
	//}
};

SAND.prototype.rec_inverse = function() {
	this.toggle();
	//this.set(this.add(this.get(), this.fullstate(6)));
	this.plus(6);
	this.stabilize();
	this.dualize();
	this.plus(3);
	this.stabilize();
	this.toggle();
	this.draw();
	
};

//this function reads a state array and creates a firing vector out of the firing history
SAND.prototype.get_firing_vector = function(state){
	var region = this.get_region(state);
	
	var vector = new Float32Array(region.length);
	for (var i = 0; i < vector.length; i += 1){
		vector[i] = state[region[i] + 3];
	}
	//alert(vector);	
	return vector;
};

SAND.prototype.save_firing_vector = function(){
	var gl = this.gl, w = this.statesize.x, h = this.statesize.y;
    var state = this.get();
	
	this.firing_vectors.push(sand.get_firing_vector(state));
	this.firing_vector_id = this.firing_vector_id + 1;
};

SAND.prototype.fire_vector = function(vector) {
			
    var gl = this.gl, w = this.statesize.x, h = this.statesize.y;
	
    var state = this.get();
	
	var region = this.get_region(state);

	var newstate = this.get();
	//alert(vector);
	
	for (var i = 0; i < vector.length; i += 1){
		var j = region[i];
		var n = vector[i];
	//	alert(n);
		newstate[region[i]] -= 4*n;
		
		newstate[j + 4] += n;			
		newstate[j - 4] += n;			
		newstate[j + 4*w] += n;			
		newstate[j - 4*w] += n;			

		newstate[j + 3] += n;
	}
	
	sand.set(newstate);
	sand.draw(); 
	return 1;
};

SAND.prototype.set_max_inverse = function(){
	sand.stop();
	sand.reset();
	sand.set_identity();
	this.cmax_inverse_vector = sand.get_firing_vector(sand.identity);
	return 1;
};

SAND.prototype.add = function(state1, state2) {
	//note that the allowed region comes from state1
	var state = new Float32Array(state1.length);
	
	for (var i = 0; i <= state1.length; i += 4){
		if (state1[i + 1] == 1){
			state[i] = state1[i] + state2[i];
			state[i + 1] = 1;
		} else {
			state[i + 1] = 0;
		} 

	}
	
	return state;
};


/* SAND.prototype.add_fire = function(config, vector){
	var gl = this.gl, w = this.statesize.x, h = this.statesize.y;
    var state = this.get();
	
	this.stop();
	
	this.set(this.add(state, config));
	this.draw();
	
	this.fire_vector(vector);
	//this.start(1,1);
};
 */

SAND.prototype.run = function(n) {
	for (var i = 0; i < n; i++){
		sand.step();
	} 
	return this;
};


SAND.prototype.stop = function() {
    clearInterval(this.timer);
    this.timer = null;
    return this;
};

SAND.prototype.toggle = function() {
    if (this.timer == null) {
        this.start(this.speed, this.frames);
    } else {
        this.stop();
    }
};

SAND.prototype.eventCoord = function(event) {
    var $target = $(event.target),
        offset = $target.offset(),
        border = 1,
        x = event.pageX - offset.left - border,
        y = $target.height() - (event.pageY - offset.top - border);
    return vec2(Math.floor((x + this.shift.x) / (this.scale)), Math.floor((y + this.shift.y) / this.scale));
};

SAND.prototype.fire_sink_old = function(n){
	var gl = this.gl, w = this.statesize.x, h = this.statesize.y;
    var state = this.get();
	var newstate = this.get();
	
	for (var i = 0; i <= state.length; i += 4 ){
		if (state[i + 1] == 1){
			newstate[i] += n*((state[i + 4 + 1] == 0) + (state[i - 4 + 1] == 0) + (state[i + 4*w + 1] == 0) + (state[i - 4*w + 1] == 0));
		}
	}	
	sand.set(newstate);
	//sand.stabilize();
	//sand.draw();	
};

SAND.prototype.fire_sink = function(n){
    var state = this.get();
	var region = this.get_region(state);	
	var vector = new Float32Array(region.length);
	
	for (var i = 0; i < vector.length; i += 1){
		vector[i] = -n;
	}	
	
	this.fire_vector(vector);
};

SAND.prototype.is_equal = function(state1, state2){
	for (var i = 0; i < state1.length; i += 4){
		if (state1[i] != state2[i]){
			return 0;
		}
	}
	return 1;
};

//fires sink until hits identity, options are [start value, alerts?, alert every n steps, track distance?, step length]
SAND.prototype.fire_sink_until_id = function(options){


	//var n = options[4];
	
	
	
	//var start = options[0];
	//this.fire_sink(start);
	//counter += start;
	
	//if (options[3]){
	//	var distance = [];
	//}
	

	
	//var distance = this.distance(this.get(), this.identity);

	var newstate, oldstate;
	var counter = 0;
	var equal = 0;
	
	while(!equal){
		
		oldstate = this.get();
		
		this.fire_sink(1);	
		this.stabilize();		
		
		newstate = this.get();
		
		if (!this.is_equal(newstate, oldstate)){		
			counter += 1;	
		} else {
			equal = 1;
			this.set(oldstate);
		}
		
		
		//alert(newstate, oldstate);
 		//if (options[1] && counter % options[2] == 0){
		//	alert("fired sink " + counter + " times");
		//} 
		
		//if (options[3]){
		//	distance.push(this.distance(this.get(), this.identity));
		//}
		//distance = this.distance(this.get(), this.identity);
	}
	
	//alert("fired sink " + counter + " times");
	//copyToClipboard(this.get_firing_vector(oldstate));
//	alert(distance);
};

SAND.prototype.approx_k = function() {	
	return Math.floor((2/3)*(Math.floor(sand.m/2)*Math.floor(sand.m/2)) + .40476*(Math.floor(sand.m/2)) + .40476/2)
};

SAND.prototype.approx_identity = function(n) {
	//first guess coefficients and scaling factor
	var a = 0.003923647*n + 0.478870693;
    var b = -0.643221*n  + 1.669965;
    var c = -1.145061*n    + 4.808167;
	
	//alert(a);
	//alert(b);
	//alert(c);
	
	var k = -this.approx_k();
	
	//alert(k);
	
	
	//create spanning polynomials
	var f = function(x) {return a*x*x + b*x + c;};
    var g = function(y) {return a*y*y + b*y + c;};
	var h = function(x, y) {return Math.round(f(x)*g(y)/k);};
	
	//alert(h(0,0));
	
	//construct firing vector
	var v = new Float32Array(n*n);
	for (var j = 0; j < n; j++){
		for (var i = 0; i < n; i++){
			v[n*j + i] = h(i, j);
		}
	}
	
	//console.log(v);
	return v;
};

SAND.prototype.approx_identity_3 = function(n) {
	//first guess coefficients and scaling factor
	var a = 0.00000000000000001741667*n + -0.000000000002181074;
    var b = 0.003923647*n  + 0.4788707;
    var c = -0.643221*n    + 1.669965;
	var d = -1.145061*n    + 4.808167;
	
	//alert(a);
	//alert(b);
	//alert(c);
	
	var k = -this.approx_k();
	
	//alert(k);
	
	
	//create spanning polynomials
	var f = function(x) {return a*x*x*x + b*x*x + c*x + d;};
    var g = function(y) {return a*y*y*y + b*y*y + c*y + d;};
	var h = function(x, y) {return Math.round(f(x)*g(y)/k);};
	
	//alert(h(0,0));
	
	//construct firing vector
	var v = new Float32Array(n*n);
	for (var j = 0; j < n; j++){
		for (var i = 0; i < n; i++){
			v[n*j + i] = h(i, j);
		}
	}
	
	//console.log(v);
	return v;
};

SAND.prototype.zoom = function(dz, n) {
	if (n < 0) {
		if (sand.viewsize.x - dz >= 300){
			sand.viewsize.x -= dz;
			sand.viewsize.y -= dz;
			sand.shift.x -= dz/2;
			sand.shift.y -= dz/2;
			//$("#zoomval").val(sand.viewsize.x);
			/* sand.viewx -= sand.dx;
			sand.viewy -= sand.dx; */
		}
	} else {
		sand.viewsize.x += dz;
		sand.viewsize.y += dz;
		sand.shift.x += dz/2;
		sand.shift.y += dz/2;
		//$("#zoomval").val(sand.viewsize.x);
	}
	
	sand.draw();
};



function Controller(SAND) {
    this.sand = sand;
    var _this = this,
        $canvas = $(sand.gl.canvas);
    this.drag = null;
    $canvas.on('mousedown', function(event) {
		event.preventDefault();
        _this.drag = event.which;
        var pos = sand.eventCoord(event);
        sand.brush(pos.x, pos.y, _this.drag == 1, sand.brush_type);
        sand.draw();
    });
    $canvas.on('mouseup', function(event) {
        _this.drag = null;
    });
    $canvas.on('mousemove', function(event) {
		event.preventDefault();
        if (_this.drag) {
            var pos = sand.eventCoord(event);
            sand.brush(pos.x, pos.y, _this.drag == 1, sand.brush_type);
			sand.draw();
        }
		
    });
    $canvas.on('contextmenu', function(event) {
        event.preventDefault();
        return false;
    });
	
	//copied and modified from some jsfiddle, maybe find it again later?
	$('#sand').bind('mousewheel DOMMouseScroll', function(e) {
		var scrollTo = 0;
		e.preventDefault();
		if (e.type == 'mousewheel') {
			scrollTo = (e.originalEvent.wheelDelta * -1);
			sand.zoom(sand.dz, -e.originalEvent.wheelDelta);
		}
		else if (e.type == 'DOMMouseScroll') {
			scrollTo = 40 * e.originalEvent.detail;
			sand.zoom(sand.dz, -e.originalEvent.detail);
		}
		$(this).scrollTop(scrollTo + $(this).scrollTop());
		
	});
	
    $(document).on('keyup', function(event) {
        switch (event.which) {

			case 46: /* [delete] */
				sand.reset();
				sand.draw();
				/* sand.reset();
				sand.draw();
				sand.identity == sand.get();
				sand.saves = []; */
				break;
			case 32: /* [space] */
				sand.toggle();
				break;
	/* 		case 83: /* s 
				if (event.shiftKey) {
					if (this._save1){
						sand.set(this._save1);
					}			
				} else {
					this._save1 = sand.get();
				}

				break; */
			case 87:
				// up
				/* var canvas = document.getElementById("sand");
				if (sand.viewy + sand.dx >= canvas.height - sand.viewsize.y){
					sand.viewy = canvas.height - sand.viewsize.y;
				} else {
					sand.viewy += sand.dx;
				} */
				
				sand.shift.y += sand.dx;
				sand.draw();
				break;
			case 83:
				//down
				/* if (sand.viewy - sand.dx <= 0){
					sand.viewy = 0;
				} else {
					sand.viewy -= sand.dx;
				} */
				sand.shift.y -= sand.dx;
				sand.draw();
				break;
			case 65:
				//left
				/* if (sand.viewx - sand.dx <= 0){
					sand.viewx = 0;
				} else {
					sand.viewx -= sand.dx;
				} */
				sand.shift.x -= sand.dx;
				sand.draw();
				break;
			case 68:
				//var canvas = document.getElementById("sand");
				/* //right
				if (sand.viewx + sand.dx >= canvas.width - sand.viewsize.x){
					sand.viewx = canvas.width - sand.viewsize.x;
				} else {
					sand.viewx += sand.dx;
				} */
				sand.shift.x += sand.dx;
				sand.draw();
				break;
			case 109:
				//-
				sand.zoom(sand.dz, -1);
				
				/* var canvas = document.getElementById("sand");
				if (canvas.width*1.1 <= sand.viewsize.x){
					canvas.width = canvas.width*1.1;
					canvas.height = canvas.height*1.1;
				} else {
					canvas.width = sand.viewsize.x;
					canvas.height = sand.viewsize.y;
				} */
				break;
			case 107:
				//+
				sand.zoom(sand.dz, 1);
				
				/* sand.viewx += sand.dx;
				sand.viewy += sand.dx; */
				
				/* var canvas = document.getElementById("sand");
				if (canvas.width*.9 > 0) {
					canvas.width = canvas.width*.9;
					canvas.height = canvas.height*.9;
				} */
				break;
				
			/* case 48: 
				sand.setFull(0);
				sand.draw();
				break;
			case 49: 
				sand.setFull(1);
				sand.draw();
				break;
			case 50: 
				sand.setFull(2);
				sand.draw();
				break;
			case 51: 
				sand.setFull(3);
				sand.draw();
				break;	
			case 52: 
				sand.setFull(4);
				sand.draw();
				break;
			case 53:
				sand.setFull(5);
				sand.draw();
				break;
			case 54: 
				sand.setFull(6);
				sand.draw();
				break;
			case 55: 
				sand.setFull(7);
				sand.draw();
				break;
			case 56: 
				sand.setFull(8);
				sand.draw();
				break;		 	  */
        }
    });

	
	//put all these buttons under like one switch command
	$(document).on("click","#plus",function() {
		sand.plus(1);
		sand.draw();
	});

/* 	$(document).on("click","#scale_1",function() {
		sand.stop();
		set_scale(1);
	});
	
	$(document).on("click","#scale_2",function() {
		sand.stop();
		set_scale(2);
	});
	
	$(document).on("click","#scale_4",function() {
		sand.stop();
		set_scale(4);
	});
	
	$(document).on("click","#scale_8",function() {
		sand.stop();
		set_scale(8);
	});
	
	$(document).on("click","#scale_16",function() {
		sand.stop();
		set_scale(16);
	}); */
	
	//this should be the same as pressing s up there but its not for some reason???? //think this comment is obsolete
/* 	$(document).on("click","#save",function() {	
		
	}); */

	
/* 	$(document).on("click","#add",function() {
		if (this._save1){
			sand.set(this._save1);
		}	
		//sand.set(sand.add(this._save1, this._save2));
	}); */
	
 	$(document).on("click","#stabilize",function() {
		sand.stabilize();
		//sand.draw();
	}); 
	
	$(document).on("click","#identity",function() {
		sand.set_identity();
	}); 
	
	$(document).on("click","#set_rand",function() {
		sand.setRandom();
		sand.draw();
	}); 
	
	$(document).on("click","#dualize",function() {
		sand.dualize();
		sand.draw();
	}); 
	
	$(document).on("click","#clear_firing_vector",function() {
		sand.clear_firing_history();
		sand.draw();
	}); 
	
	$(document).on("click","#set_color",function() {
		sand.color = $('#color_choice').val();
	}); 
	
	
/* 	$(document).on("click","#max_inverse",function() {
		if (sand.set_max_inverse()){
			//alert("ok!");
			var newButton = document.createElement("input");
			newButton.type = "button";
			newButton.id = 99;
			newButton.value = "add cmax inverse";		
			newButton.onclick = function(){
				sand.add_fire(sand.fullstate(6), sand.cmax_inverse_vector);
			};
			document.getElementById("saves").appendChild(newButton); 
		}
	}); 	*/
	
	$(document).on("click","#rec_inverse",function() {
		sand.rec_inverse();
		sand.draw();
	}); 
	
	$(document).on("click","#add_rand",function() {
		sand.set(sand.add_random(sand.get()));
		sand.draw();
	}); 
	
	$(document).on("click","#store_for_comparison",function() {
		sand.save();
		sand.target_id = sand.save_id - 1;
		sand.target_ready = 1;
	}); 
	
 	$(document).on("click","#markov_approx_start",function() {
		if (sand.target_ready) {
			sand.start_markov_approximation(sand.saves[sand.target_id], 20);
		} else {
			alert("no target image");
		}
	});  
	
	$(document).on("click","#markov_approx_pause",function() {
		sand.pause_markov_approximation();
	});  
	
	$(document).on("click","#markov_approx_step",function() {
		sand.markov_approximation(sand.saves[sand.target_id]);
	});  
	
	$("#save_firing_vector").submit(function( event ) {	
		event.preventDefault();
		sand.save_firing_vector();
		var newButton = document.createElement("input");
		newButton.type = "button";
		newButton.id = sand.firing_vector_id - 1;
		newButton.value = "fire " + ($("#save_firing_vector_field").val());		
		newButton.onclick = function(){
			sand.fire_vector(sand.firing_vectors[newButton.id]);

		};
		document.getElementById("firing_vectors").appendChild(newButton); 
	});  
		
	$("#save").submit(function( event ) {		  
		event.preventDefault();
		
		sand.save();	
		sand.user_saves += 1;
		
		var newButton = document.createElement("input");
		newButton.type = "button";
		newButton.id = sand.save_id - 1;
		newButton.value = "load " + ($("#save_field").val());		
		newButton.onclick = function(){
			sand.load(newButton.id);
		};
		document.getElementById("saves").appendChild(newButton); 
		
		var newButtonAdd = document.createElement("input");
		newButtonAdd.type = "button";
		newButtonAdd.id = sand.save_id - 1;
		newButtonAdd.value = "add " + ($("#save_field").val());		
		newButtonAdd.onclick = function(){
			sand.set(sand.add(sand.saves[newButtonAdd.id], sand.get()));
		};
		document.getElementById("adds").appendChild(newButtonAdd); 
	});
	
	//$(document).on("click","#speed_up",function() {
	//	set_scale(sand.scale);
	//});//this is super hacky, have to understand what's really going on with this creating new 'threads'
	//pause doesn't work when you do this, because of the new controllers being made i think
	
/* 	$(document).on("click","#color_default",function() {
		sand.colors = 0;
	});
	
	$(document).on("click","#color_stable",function() {
		sand.colors = 1;
	});
 */
	$(document).on("click","#test",function() {
		sand.set(sand.add(sand.get(),sand.fullstate(1)));
	});

	$(document).on("click","#download",function() {	
		event.preventDefault();	
		var state = sand.get();
		download("data:text/csv;charset=utf-8," + state, $( "#name_field" ).val() + ".txt");
	});
	 
/* 	$(document).on("click","#zoom_in",function() {		
		var canvas = document.getElementById("sand");
		canvas.width = canvas.width - 500;
		canvas.height = canvas.height - 500;

	});

	$(document).on("click","#zoom_out",function() {		
		var canvas = document.getElementById("sand");
		if (canvas.width < sand.viewsize.x){
			canvas.width = canvas.width + 500;
			canvas.height = canvas.height + 500;
		}
	});
 */

	$("#zoom").submit(function( event ) {	
		event.preventDefault();	
		sand.dz = $( "#zoom_field" ).val();
		//sand.draw();
	});
	
	$("#speed").submit(function( event ) {		  
		sand.set_speed($( "#speed_field" ).val(), $( "#delay_field" ).val());	
		event.preventDefault();
		sand.draw()
	});
	
	$("#delay").submit(function( event ) {		  
		sand.set_speed($( "#speed_field" ).val(), $( "#delay_field" ).val());	
		event.preventDefault();
		sand.draw()
	});
	
	$("#run").submit(function( event ) {		  
		sand.run($( "#run_field" ).val());
		event.preventDefault();
		sand.draw()
	});
	
	$("#arithmetic").submit(function( event ) {		  
		sand.plus($("#arithmetic_field").val());
		event.preventDefault();
		sand.draw()
	});
	
	//brush tools
	
	$(document).on("click","#brush_sand",function() {
		sand.brush_type = 0;
	});
	
	$(document).on("click","#brush_sink",function() {
		sand.brush_type = 1;
	});
	
	$(document).on("click","#brush_source",function() {
		sand.brush_type = 2;
	});
	
	$(document).on("click","#brush_wall",function() {
		sand.brush_type = 3;
	});
	
	$(document).on("click","#brush_fire",function() {
		sand.brush_type = 5;
	});
	
	$(document).on("click","#brush_inspect",function() {
		sand.brush_type = 6;
	});
		
	$("#height").submit(function( event ) {		
		event.preventDefault();	
		sand.brush_height = ($("#height_field").val());
		sand.brush_type = 4;
	});
	
	$("#size").submit(function( event ) {		
		event.preventDefault();	
		var n = ($("#size_field").val());
			
		if (n < sand.w/sand.scale){
			sand.m = n;
			sand.n = n;
			sand.res.x = n;
			sand.res.y = n;
			sand.reset();
			sand.set_surface(1);
		} else {
			alert("Please choose a smaller grid. Max is " + (sand.w/sand.scale - 1) + ".");
		}
		
	
	});
	
/* 	$("#scale").submit(function( event ) {		
		event.preventDefault();	
		var n = ($("#scale_field").val());	
		sand.scale = n;
		
		sand.statesize.x = sand.w/n;
		sand.statesize.y = sand.h/n;
		sand.viewsize.x = sand.w/n;
		sand.viewsize.x = sand.h/n;
		
		sand.reset();
		sand.set_surface(1);
		sand.step();
		sand.draw();
	}); */
	
	
	
	$("#full").submit(function( event ) {		  
		var full = sand.fullstate($("#full_field").val());
		sand.set(full);
		event.preventDefault();
		sand.draw();
	});
	
	$("#fire_sink").submit(function( event ) {		
		event.preventDefault();	
		sand.fire_sink($("#fire_sink_field").val());
	});
	
	$(document).on("click","#fire_sink_until_id",function() {
		sand.fire_sink_until_id([0, 0, 1000, 1, 1]);
	});
	
	$(document).on("click","#reset",function() {
		sand.reset();
	});
	
	$(document).on("click","#get_state",function() {
		$("#state_val").val(sand.get());
	});
	
	$(document).on("click","#firings",function() {
		var gl = sand.gl;
		var state = sand.get();
		var n = 0;
		
		for (var i = 0; i < state.length; i += 4){
			n += state[i + 3]; 
			//alert(n)
		} 
		
		//alert(n);
		$("#firings_val").val(n);
	});
	
	$(document).on("click","#get_vector",function() {
		var vec = sand.get_firing_vector(sand.get());
		$("#vector_val").val(vec);
		copyToClipboard(vec);
	});
	
	$(document).on("click","#approx_k",function() {		
		$("#fire_sink_field").val(sand.approx_k());
	});
	
	$(document).on("click","#approx_identity",function() {
		var n = sand.n;
		var m = sand.m;
		if (n == m){
			//alert('may take a while');
			var v = sand.approx_identity(n);
			sand.fire_vector(v);
			$("#vector_val").val(v);
		} else {
			alert("This function not yet implemented for nonsquare grids")
		}
	});
	
	$(document).on("click","#approx_identity_3",function() {
		var n = sand.n;
		var m = sand.m;
		if (n == m){
			//alert('may take a while');
			var v = sand.approx_identity_3(n);
			sand.fire_vector(v);
			$("#vector_val").val(v);
		} else {
			alert("This function not yet implemented for nonsquare grids")
		}
	});
	
	$("#fire_vector").submit(function( event ) {		
		event.preventDefault();	
		sand.fire_vector($("#fire_field").val().split(",").map(Number));
	});

	
	$("#paste").submit(function( event ) {		
		event.preventDefault();	
		sand.set($( "#paste_field" ).val().split(",").map(Number));
		sand.draw()
	});
	
	/* $("#upload").submit(function( event ) {		
		alert(document.getElementById("sand_file").value);
	}); */
	
	
/* 	$("#scale").submit(function( event ) {		
		event.preventDefault();	
		set_scale(1 document.getElementById("scale").value );
	});
	 */
/* 	
	$(document).on("click","#scale",function() {
		set_scale(16);

	
	});  
 */
}


function download(data, name) {
  var link = document.createElement("a");
  link.download = name;
  var uri = data;
  link.href = uri;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  delete link;
  
}

function copyToClipboard(text) {
  window.prompt("Copy to clipboard: Ctrl+C, Enter", text);
}


function set_scale(n) {
	sand.stop();
	var sand = null, controller = null;
	$(document).ready(function() {
		var $canvas = $('#sand');
		sand = new SAND($canvas[0], n).draw().start(1, 1);
		controller = new Controller(sand);
	});
}
	
	//need to like kill the old one here, right now the more I change size the slower it changes? meaning that the old ones are still there taking up space or something
	//can apparently adapt this to increase speed, by creating more of the same size without killing old ones
	// if I uncomment "var sand = null;", then it runs faster with each click



/* Initialize everything */
var sand = null, controller = null;
$(document).ready(function() {
    var $canvas = $('#sand');
    sand = new SAND($canvas[0], 8).draw().start(1, 1);
    controller = new Controller(sand);
});
/* Don't scroll on spacebar */
$(window).on('keydown', function(event) {
    return !(event.keyCode === 32);
});
