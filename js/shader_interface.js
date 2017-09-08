SAND.prototype.texture = function() {
	var state = new Float32Array(this.statesize.x * this.statesize.y * 4);
	for (var i = 0; i < state.length; i += 1) {
		state[i] = 0;
	}
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

SAND.prototype.swap = function() {
	var tmp = this.textures.front;
	this.textures.front = this.textures.back;
	this.textures.back = tmp;
	return this;
};

SAND.prototype.translation = function(tx, ty) {
    return [
      1, 0, 0,
      0, 1, 0,
      tx, ty, 1,
    ];
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
	
	var mat = this.translation(0,0);
	var matrix1 = vec3(mat[0], mat[1], mat[2]);
	var matrix2 = vec3(mat[3], mat[4], mat[5]);
	var matrix3 = vec3(mat[6], mat[7], mat[8]);
	
	resize(gl.canvas);
    this.programs.sand.use()
        .attrib('quad', this.buffers.quad, 2)
        .uniform('state', 0, true)
        .uniform('matrix1', vec3(1,0,0))
		.uniform('matrix2', vec3(0,1,0))
		.uniform('matrix3', vec3(0,0,1))
        .uniform('scale', this.statesize)
        .draw(gl.TRIANGLE_STRIP, 4);
    this.swap();
    return this;
};

SAND.prototype.draw = function() {
    var gl = this.gl;
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.bindTexture(gl.TEXTURE_2D, this.textures.front);

	var mat = this.translation(0,0);
	var matrix1 = vec3(mat[0], mat[1], mat[2]);
	var matrix2 = vec3(mat[3], mat[4], mat[5]);
	var matrix3 = vec3(mat[6], mat[7], mat[8]);
	
	var scale = vec2(this.w*this.scale, this.h*this.scale)
	
	resize(gl.canvas);
	gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
	this.programs.draw.use()
		.attrib('quad', this.buffers.quad, 2)
		.uniform('matrix1', matrix1)
		.uniform('matrix2', matrix2)
		.uniform('matrix3', matrix3)		
		.uniform('state', 0, true)
		.uniform('scale',  scale)
		.uniform('shift',  this.shift)
		.uniform('color', this.color)
		.draw(gl.TRIANGLE_STRIP, 4);	
    return this;
};

SAND.prototype.get = function() {
    var gl = this.gl, w = this.statesize.x, h = this.statesize.y;
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffers.step);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0,
                            gl.TEXTURE_2D, this.textures.front, 0);
    var state = new Float32Array(w * h * 4);
    gl.readPixels(0, 0, w, h, gl.RGBA, gl.FLOAT, state);
	for (var i = 0; i < state.length; i++) {   
		state[i] = state[i]*max;
	}  
    return state;
	
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
					 
    return this;
};

