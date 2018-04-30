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
    resize(gl.canvas);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    if (this.is2D){
        gl.bindTexture(gl.TEXTURE_2D, this.textures.front);

	var mat = this.translation(0,0);
	var matrix1 = vec3(mat[0], mat[1], mat[2]);
	var matrix2 = vec3(mat[3], mat[4], mat[5]);
	var matrix3 = vec3(mat[6], mat[7], mat[8]);
	
	var scale = vec2(this.w*this.scale, this.h*this.scale)
	
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
    } else { // 3D
        // The programinfo variable gets set when the shaders are loaded, so this function may
        // be called before it is ready
        if ((typeof this.programInfo !== 'undefined') && (typeof this.buffers3d !== 'undefined')) {
          drawScene(gl, this.programInfo, this.buffers3d, this.textures.front, this.xrot, this.yrot, this);
        }
    }
    return this;
};

/**
If the program is in 2d mode this will change it to 3d.
If in 3d, it will go to 2d.
*/
SAND.prototype.toggle_2D_3D = function() {

  this.is2D = !this.is2D;

  // if the buffers haven't been made, do it now
  if ((!this.is2D) && (typeof this.buffers3d === 'undefined')){
    this.make_buffers_wrapper()
  }
}

/**
Will call initBuffers and display the making buffers text
*/
SAND.prototype.make_buffers_wrapper = function() {
    force_order(
      '$(".thinking").text("Making Buffers...");', 
      `
      sand.buffers3d = sand.initBuffers(sand.gl);
      $(".thinking").text("");
      `
    );
}

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


//
// Draw the scene. Stolen from mozila webgl example
//
function drawScene(gl, programInfo, buffers, texture, xRotation, yRotation, sandObj) {
  
  gl.clearColor(0.0, 0.0, 0.3125, 1.0);  // Clear to navy blue, fully opaque
  gl.clearDepth(1.0);                 // Clear everything
  gl.enable(gl.DEPTH_TEST);           // Enable depth testing
  gl.depthFunc(gl.LEQUAL);            // Near things obscure far things

  // Clear the canvas before we start drawing on it.

  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // Create a perspective matrix, a special matrix that is
  // used to simulate the distortion of perspective in a camera.
  // Our field of view is 45 degrees, with a width/height
  // ratio that matches the display size of the canvas
  // and we only want to see objects between 0.1 units
  // and 100 units away from the camera.

  const fieldOfView = 45 * Math.PI / 180;   // in radians
  const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
  const zNear = 0.1;
  const zFar = 100.0;
  const projectionMatrix = mat4.create();

  // note: glmatrix.js always has the first argument
  // as the destination to receive the result.
  mat4.perspective(projectionMatrix,
                   fieldOfView,
                   aspect,
                   zNear,
                   zFar);

  // Set the drawing position to the "identity" point, which is
  // the center of the scene.
  const modelViewMatrix = sandObj.modelViewMatrix;

  // Now move the drawing position a bit to where we want to
  // start drawing the square.


  // Tell WebGL how to pull out the positions from the position
  // buffer into the vertexPosition attribute
  {
    const numComponents = 3;
    const type = gl.FLOAT;
    const normalize = false;
    const stride = 0;
    const offset = 0;
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
    gl.vertexAttribPointer(
        programInfo.attribLocations.vertexPosition,
        numComponents,
        type,
        normalize,
        stride,
        offset);
    gl.enableVertexAttribArray(
        programInfo.attribLocations.vertexPosition);
  }

  // Tell WebGL which indices to use to index the vertices
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indices);

  // Tell WebGL to use our program when drawing

  gl.useProgram(programInfo.program);

  // Set the shader uniforms
  gl.uniformMatrix4fv(
      programInfo.uniformLocations.projectionMatrix,
      false,
      projectionMatrix);
  gl.uniformMatrix4fv(
      programInfo.uniformLocations.modelViewMatrix,
      false,
      modelViewMatrix);
  gl.uniformMatrix4fv(
      programInfo.uniformLocations.gridToPointsMatrix,
      false,
      sandObj.gridToPointsMatrix);

  /*
  let allMat = mat4.create();
  mat4.mul(allMat, projectionMatrix, modelViewMatrix); 
  mat4.mul(allMat, allMat, sandObj.gridToPointsMatrix); 
  let invMat = mat4.create();
  mat4.invert(invMat, allMat);
  let mypos = vec4.fromValues(5,0,5,0);
  vec4.transformMat4(mypos, mypos, invMat);
  console.log(mypos);
  */

  // color scheme also can affect the height in 3D mode
  gl.uniform1f(
      programInfo.uniformLocations.colorScheme,
      sandObj.color);
  gl.uniform1f(
      programInfo.uniformLocations.heightMult,
      sandObj.heightMult);
  gl.uniform1f(
      programInfo.uniformLocations.width,
      sandObj.m);
  gl.uniform1f(
      programInfo.uniformLocations.length,
      sandObj.n);
  gl.uniform1f(
      programInfo.uniformLocations.wireframe,
      sandObj.wireframe);


    // Specify the texture to map onto the faces.

    // Tell WebGL we want to affect texture unit 0
    gl.activeTexture(gl.TEXTURE0);

    // Bind the texture to texture unit 0
    gl.bindTexture(gl.TEXTURE_2D, texture);

      // Tell the shader we bound the texture to texture unit 0
    gl.uniform1i(programInfo.uniformLocations.uSampler, 0);

  {
    const vertexCount = buffers.vertexCount;
    const type = gl.UNSIGNED_SHORT;
    const offset = 0;
    gl.drawElements(gl.TRIANGLES, vertexCount, type, offset);
  }

}
