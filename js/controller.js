SAND.now = function() {
   return Math.floor(Date.now() / 1000);
};

SAND.prototype.stable_animate = function(){
	function f() {
		sand.step();
		sand.step();
		sand.draw();
		
		
		if(sand.check_unstable()){		
			setTimeout( f, 100 );
		} 
	}
	
	f();
};

SAND.prototype.start = function() {
	//console.log(this.speed)
	var n = this.speed.x;
	var m = this.speed.y;
	console.log(n, m)
    if (this.timer == null) {
        this.timer = setInterval(function(){
            for (var i = 0; i < n; i++){
                sand.step(); 
            }
            sand.draw();
        }, m);
    }
    return this;
};

SAND.prototype.stop = function() {
    clearInterval(this.timer);
    this.timer = null;
    return this;
};

SAND.prototype.toggle = function() {
	if (this.markov){
		this.markov = 0;
		return 1;
	}
	
    if (this.timer == null) {
        this.start();
    } else {
        this.stop();
    }
};

SAND.prototype.set_speed = function(n,m) {
    this.stop();
	this.speed = vec2(n, m);
    this.start();
};

SAND.prototype.run = function(n) {
	for (var i = 0; i < n; i++){
		sand.step();
                this.gl.clearColor(1.0, 0.0, 0.0, 1.0);
                this.gl.clear(gl.COLOR_BUFFER_BIT);
	}
	return this;
};

function resize(canvas) {
  var displayWidth  = canvas.clientWidth;
  var displayHeight = canvas.clientHeight;

  if (canvas.width  != displayWidth || canvas.height != displayHeight) {
    canvas.width  = displayWidth;
    canvas.height = displayHeight;
  }
}

function tens(n) {
	return (Math.floor(n/10));
}
function ones(n) {
	return n - 10*tens(n);
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

SAND.prototype.eventCoord = function(event) {
    var $target = $(event.target),
        x = event.pageX,
        y = $(window).height() - event.pageY;

    //return vec2(Math.floor((x + this.shift.x - (this.viewsize.x - 1000)/(2*r)) / (this.scale)), Math.floor((y + this.shift.y - (this.viewsize.y - 1000)/(2*r)) / this.scale));
    return vec2(Math.floor((x + this.shift.x)*2 / this.scale), Math.floor((y + this.shift.y)*2 / this.scale));
};


/* SAND.prototype.eventCoord = function(event) {
    var $target = $(event.target),
        offset = $target.offset(),
        border = 1,
        x = event.pageX - offset.left - border,
        y = $target.height() - (event.pageY - offset.top - border);
    return vec2(Math.floor((x + this.shift.x) / (this.viewsize.x/this.statesize.x)), Math.floor((y + this.shift.y) / (this.viewsize.x/this.statesize.x)));
}; */

SAND.prototype.shiftby = function(dx, dy){
	//if (sand.shift.x + dx > -sand.statesize.x*sand.scale/4){
		sand.shift.x += dx;
		sand.shift.y += dy;
	//}
	//console.log(sand.shift.x, sand.shift.y)
};

SAND.prototype.zoom = function(coords, dir) {

    var texcoord = vec2(coords.x/2, coords.y/2);
    //var windowcoord = vec2(event.originalEvent.clientX, $(window).height()  - event.originalEvent.clientY)

    dscale = sand.zoomspeed*sand.scale*dir
    if (sand.scale - dscale > 0.3 && sand.scale - dscale < 300){
        sand.scale -= dscale
		
		sand.shiftby(-texcoord.x*dscale, -texcoord.y*dscale)
		
        $('.zoom').text(Number((sand.scale).toFixed(1)) + 'x zoom')
    }
    //console.log("tex coord: " + texcoord);//s, "window coord: " + windowcoord, "scale: " + sand.scale)

    sand.draw();
};

SAND.prototype.brush = function(x, y, choice, type) {
    var gl = this.gl, w = this.statesize.x, h = this.statesize.y;
    var state = this.get();
	var index = (x + y*w)*4;

    switch(type){
        case 0:                // click to add or subtract
            if (choice){
                state[index] += this.brush_height;
            } else {
                state[index] -= 1;
            }
            this.set(state);
            break;

        case 1:                // click to edit surface
            if (choice){
                state[index + 1] = 0;
            } else {
                state[index + 1] = 1;
            }
            this.set(state);
			this.altered = 1;
            break;

        case 2:
            if (choice){    // click to place sources
                state[index + 1] = 2;
            } else {
                state[index + 1] = 1;
            }
            this.set(state);
			this.altered = 1;

            break;

        case 3:                // click to place walls
            if (choice){
                if (state[index + 1] != 3){
					state[index + 1] = 3;
					
				   /*  state[index + 4 + 2] = tens(state[index + 4 + 2])*10 + ones(state[index + 4 + 2]);
					state[index - 4 + 2] = tens(state[index - 4 + 2])*10 + ones(state[index - 4 + 2]);
					state[index + 4*w + 2] = tens(state[index + 4*w + 2])*10 + ones(state[index + 4*w + 2]);
					state[index - 4*w + 2] = tens(state[index - 4*w + 2])*10 + ones(state[index - 4*w + 2]);
	*/
					state[index + 4 + 2] = 10*(tens(state[index + 4 + 2]) - 1) + ones(state[index + 4 + 2]);
					state[index - 4 + 2] = 10*(tens(state[index - 4 + 2]) - 1) + ones(state[index - 4 + 2]);
					state[index + 4*w + 2] = 10*(tens(state[index + 4*w + 2]) - 1) + ones(state[index + 4*w + 2]);
					state[index - 4*w + 2] = 10*(tens(state[index - 4*w + 2]) - 1) + ones(state[index - 4*w + 2]);
				}
            } else {
                state[index + 1] = 1;
            }
            this.set(state);
			this.altered = 1;

            break;

        case 4:                // click to set to certain height
            if (choice){
                state[index] = this.brush_height;
            }
            this.set(state);
            break;

        case 5:                // click to fire
            if (choice){
                state[index] -= 4;
                state[index + 4] += 1;
                state[index - 4] += 1;
                state[index + 4*w] += 1;
                state[index - 4*w] += 1;
			} else {
	            state[index] += 4;
                state[index + 4] -= 1;
                state[index - 4] -= 1;
                state[index + 4*w] -= 1;
                state[index - 4*w] -= 1;
            }
            state[index + 2] = 10;
            this.set(state);
            break;

        case 6:                // click to inspect
            console.log(x, y, state.slice(index, index + 4));
            break;
    }
};

// resets modelViewMatrix to how it is when initialized
SAND.prototype.reset_camera = function() {
  // set modelViewMatrix to a new idetity matrix
  this.modelViewMatrix = mat4.create();

  // move it away from camera
  mat4.translate(this.modelViewMatrix,     // destination matrix
                 this.modelViewMatrix,     // matrix to translate
                 [-0.0, 0.0, -1.5]);  // amount to translate

  // rotate the y a bit
  mat4.rotate(this.modelViewMatrix,  // destination matrix
              this.modelViewMatrix,  // matrix to rotate
              Math.PI / 2,        // amount to rotate in radians
              [1, 0, 0]);       // axis to rotate around (Y)

}


function Controller(SAND) {
    this.sand = sand;
    var _this = this,
        $canvas = $(sand.gl.canvas);
    this.drag = null;
    var tempx;
    var tempy;
    var speed = 10;
    $canvas.on('mousedown', function(event) {
        lastx = event.clientX;
        lasty = event.clientY;
        if (sand.brush_type == 7){
            _this.drag = event.which;
            sand.draw();
        } else {
            event.preventDefault();
            _this.drag = event.which;
            var pos = sand.eventCoord(event);
            sand.brush(pos.x, pos.y, _this.drag == 1, sand.brush_type);
            sand.draw();

        }
    });
    $canvas.on('mouseup', function(event) {
        _this.drag = null;
    });
    $canvas.on('mousemove', function(event) {
        if (_this.drag) {
            var newx = event.clientX;
            var newy = event.clientY;

            var dx = newx - lastx;
            var dy = newy - lasty;
            lastx = newx;
            lasty = newy;
        }
        if (sand.brush_type == 7){
            event.preventDefault();
            if (_this.drag) {
		sand.shiftby(-dx, dy)

                sand.draw();
            }
        } else if (!sand.is2D) {
            // do rotation stuff if in 3d mode
            if (_this.drag) {
                sand.xrot += 0.1 * dx
                sand.yrot += 0.1 * dy
                mat4.rotate(sand.modelViewMatrix,       // destination matrix
                            sand.modelViewMatrix,       // matrix to rotate
                            0.01 * dy,                  // amount to rotate in radians
                            [sand.modelViewMatrix[0],   // axis to rotate around
                             sand.modelViewMatrix[4],   // (first column of matrix)
                             sand.modelViewMatrix[8]]); 
                mat4.rotate(sand.modelViewMatrix,       // destination matrix
                            sand.modelViewMatrix,       // matrix to rotate
                            0.01 * dx,                  // amount to rotate in radians
                            [sand.modelViewMatrix[1],   // axis to rotate around
                             sand.modelViewMatrix[5],   // (second column of matrix)
                             sand.modelViewMatrix[9]]); 
                      
            }
        } else {
            event.preventDefault();
            if (_this.drag) {
				var texcoord = sand.eventCoord(event);
				var windowcoord = vec2(event.originalEvent.clientX, $(window).height()  - event.originalEvent.clientY)

				
		//		console.log("tex coord: " + texcoord, "window coord: " + windowcoord, "scale: " + sand.scale)

                var pos = sand.eventCoord(event);
                sand.brush(pos.x, pos.y, _this.drag == 1, sand.brush_type);
                sand.draw();
                //console.log(pos);
            }
        }

    });
    $canvas.on('contextmenu', function(event) {
        event.preventDefault();
        return false;
    });
    // copied and modified from some jsfiddle that I can't find again
    $('#sand').bind('mousewheel DOMMouseScroll', function(e) {
/*         var pos = sand.eventCoord(e.originalEvent)
        pos.x = e.originalEvent.clientX;
        pos.y = $(window).height()-  e.originalEvent.clientY; */

        //console.log(pos)

        //var scrollTo = 0;
        e.preventDefault();
        var coords = sand.eventCoord(e.originalEvent)

        if (e.type == 'mousewheel') {
             var dir = -e.originalEvent.wheelDelta/120;
            //console.log(coords, dir);
            sand.zoom(coords, dir);

        }
        else if (e.type == 'DOMMouseScroll') {
            var dir = e.originalEvent.detail;
            //console.log(coords, dir);
            sand.zoom(coords, dir)
        }
        //$(this).scrollTop(scrollTo + $(this).scrollTop());
    });
    $(document).on('keyup', function(event) {
        switch (event.which) {

            case 46: /* [delete] */
                sand.reset();
				//sand.set_surface(sand.shape_choice)
                sand.draw();
                break;
            case 32: /* [space] */
                sand.toggle();
                break;
            case 87:
                // up
				sand.shiftby(0, sand.dx)
                //sand.shift.y += sand.dx;
                sand.draw();
                break;
            case 83:
                //down
				sand.shiftby(0, -sand.dx)
               // sand.shift.y -= sand.dx;
                sand.draw();
                break;
            case 65:
                //left
				sand.shiftby(-sand.dx, 0)
                //sand.shift.x -= sand.dx;
                sand.draw();
                break;
            case 68:
                //right
				sand.shiftby(sand.dx, 0)
                //sand.shift.x += sand.dx;
                sand.draw();
                break;
            case 109:
                //-
                sand.zoom(sand.dz, -1);
                break;
            case 107:
                //+
                sand.zoom(sand.dz, 1);
                break;
        }
    });
}
