SAND.prototype.set_surface = function(n, m) {
	w = this.statesize.x, h = this.statesize.y;
	var state = this.get();
	//alert(n)
	this.set_outdegree();
	switch(n){
		case 0:
			for (var i = 0; i < w; i++) {
				for (var j = 0; j < h; j++) {
				
					if (Math.pow((i ), m) + Math.pow((j ), m) < Math.pow(this.m/2, m)){
						state[(i + j*w)*4  + 1] = 1;
					} 
				}
			}			
			break;
			
		case 1: //square
			for (var i = 0; i < w; i++) {
				for (var j = 0; j < h; j++) {
					if (state[(i + j*w)*4 + 1] == 0 || state[(i + j*w)*4 + 1] == 1){

						if (i < (w - this.m)/2.0 || i > w - .5 - (w - this.m)/2.0  || j < (h - this.n)/2.0 || j > h - .5 - (h - this.n)/2.0){					
							state[(i + j*w)*4 + 1] = 0;
						} else {
							state[(i + j*w)*4 + 1] = 1;
						}
					}
				}
			}	
			$('.size').text(this.m + ' by ' + this.n );
			
			break;
			
		case 2: //circle
			for (var i = 0; i < w; i++) {
				for (var j = 0; j < h; j++) {	
					if (state[(i + j*w)*4 + 1] == 0 || state[(i + j*w)*4 + 1] == 1){
				
						if ((i - w*.5)*(i -  w*.5) + (j -  h*.5)*(j -  h*.5) < (this.m/2)*(this.m/2))  {					
							state[(i + j*w)*4 + 1] = 1;
						} else {
							state[(i + j*w)*4 + 1] = 0;
						}
					}
				}
			}		
			$('.size').text(this.m/2 + ' radius disc' );

			break;
			
		case 3: //ellipse
			for (var i = 0; i < w; i++) {
				for (var j = 0; j < h; j++) {	
					if (state[(i + j*w)*4 + 1] == 0 || state[(i + j*w)*4 + 1] == 1){				
						if ((i - w*.5)*(i -  w*.5) + m*(j -  h*.5)*(j -  h*.5) < (this.m/2)*(this.m/2))  {					
							state[(i + j*w)*4 + 1] = 1;
						} else {
							state[(i + j*w)*4 + 1] = 0;
						}
					}
				}
			}				
			$('.size').text(this.m/2 + ' by ' + m*this.m/2 + ' ellipse' );

			break;	
		case 4: //diamond
			for (var i = 0; i < w; i++) {
				for (var j = 0; j < h; j++) {	
					if (state[(i + j*w)*4 + 1] == 0 || state[(i + j*w)*4 + 1] == 1){
						if (Math.abs(i - w*.5) + Math.abs(j - h*.5) < this.m/2)  {					
							state[(i + j*w)*4 + 1] = 1;
						} else {
							state[(i + j*w)*4 + 1] = 0;
						}
					}	
				}
			}				
			$('.size').text(this.m + ' width diamond' );

			break;	
		case 5: //annulus
			for (var i = 0; i < w; i++) {
				for (var j = 0; j < h; j++) {	
					if (state[(i + j*w)*4 + 1] == 0 || state[(i + j*w)*4 + 1] == 1){				
						if ((i - w*.5)*(i -  w*.5) + (j -  h*.5)*(j -  h*.5) < (this.m/2)*(this.m/2) ||
							(i - w*.5)*(i -  w*.5) + (j -  h*.5)*(j -  h*.5) > 10) {		
							state[(i + j*w)*4 + 1] = 1;
						} else {
							state[(i + j*w)*4 + 1] = 0;
						}
					}
				}
			}				
			//$('.size').text('Annulus with ' this.m + ' outer radius and ' + m + 'inner radius');

			break;	
			
	}
	this.set(state); 
};

SAND.prototype.set_outdegree = function() {
	var state = this.get();
	for (var i = 0; i < state.length; i += 4){
		state[i + 2] = 40;
	}
	this.set(state); 
};

SAND.prototype.get_region = function(state) {
	var region = [];
	
	for (var i = 0; i < state.length; i += 4){
		if (state[i + 1] == 1){ 
			region.push(i);
		}
	}
	
	return region;
};

/**
Takes an index into the the state, like the ones that get_region returns and
returns the (x,y) coordinates of that point with the center of the sandpile being
the origin
*/
SAND.prototype.convert_state_index_to_coord = function(index) {
        let w = this.statesize.x;
        let h = this.statesize.y;
        let reali = Math.floor(index / 4);
        let yheight = Math.floor(reali / w);
        let xheight = reali % w;
        let y = yheight - (h/2);
        let x = xheight - (w/2);
        return [x,y];

}

SAND.prototype.get_graph = function(state) {
	var region = [];
	
	for (var i = 0; i < state.length; i += 4){
		region.push(state[i + 1]);	
	}
	
	return region;
};
  
SAND.prototype.enumerate = function(){
	var state = sand.get();
	for (var i = 0; i < state.length/3; i += 4){
		state[i] = 100;
	}
	sand.set(state);
};

SAND.prototype.toggle_sinks = function(){
	var state = sand.get();
	for (var i = 0; i < state.length; i += 4){
		if (state[i + 1] == 0){
			state[i + 1] = 3;
		} else if (state[i + 1] == 3){
			state[i + 1] = 0;
		}
	}
	sand.set(state);
	sand.reset_outdegrees();
};

SAND.prototype.reset_outdegrees = function(){
	var state = sand.get();
	w = this.statesize.x;
	
	for (var i = 0; i < state.length; i += 4){
		
		var outdegree = 4;
		
		if (state[i + 4 + 1] == 3){outdegree -= 1;};
		if (state[i - 4 + 1] == 3){outdegree -= 1;};
		if (state[i + 4*w + 1] == 3){outdegree -= 1;};
		if (state[i - 4*w + 1] == 3){outdegree -= 1;};
		
		state[i + 2] = 10*(outdegree) + ones(state[i + 2]);
	}
	sand.set(state);
};

SAND.prototype.reset = function() {	
	var state = this.get();
	
	for (var i = 0; i < state.length; i += 4) {	
		state[i] = 0;							
		state[i + 1] = 0;							
		state[i + 2] = 40;							
		state[i + 3] = 0;							
	}
	
	this.set(state);
	this.set_surface(this.shape_choice);
	//alert(this.shape_choice)
};

SAND.prototype.is_equal = function(state1, state2){
	for (var i = 0; i < state1.length; i += 4){
		if (state1[i] != state2[i]){
			return 0;
		}
	}
	return 1;
};

SAND.prototype.add = function(state1, state2) {
	//note that the graph comes from state1

	var state = state1;
	//console.log(state1, state2)
	
	for (var i = 0; i <= state.length; i += 4){
		state[i] += state2[i];
	}
	
	return state;
};

SAND.prototype.dualize = function() {
	var state = sand.get();
	for (var i = 0; i <= state.length; i += 4){
		state[i] = 3 - state[i];
	}
	sand.set(state);
};

SAND.prototype.plus = function(n) {
	var state = sand.get();
	for (var i = 0; i <= state.length; i = i + 4){
		if (state[i + 1] == 1){
			for (var j = 0; j < n; j++){
				state[i] = state[i] + 1;
			}	
		}
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

SAND.prototype.fullstate = function(n) {
	var state = this.get();
	for (var i = 0; i < state.length; i += 1){
		state[4*i] = n;
	}
	return state;
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

SAND.prototype.add_random = function(state) {
	var region = this.get_region(state);
	
	var r = Math.floor(Math.random() * region.length);
	state[region[r]] += 1;
	
	return state;
};

SAND.prototype.fire_vector = function(vector) {
	var gl = this.gl, w = this.statesize.x, h = this.statesize.y;

	var state = this.get();
	var region = this.get_region(state);
	var newstate = this.get();

	for (var i = 0; i < vector.length; i += 1){
		var j = region[i];
		var n = vector[i];
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

SAND.prototype.save = function() {
	this.saves.push(sand.get());
	this.save_id = this.save_id + 1;	
};

SAND.prototype.seek_identity = function() {
	var region = this.get_graph(this.get());
	console.log("current region: " +region)
	for (var i = 0; i < this.identity_saves.length; i++){
		
		var equal = true;
		for (var j = 0; j < this.identity_saves[i][1].length; j++){
			if (this.identity_saves[i][1][j] != region[j]){
				equal = false;
			}
		}
		
		//console.log("saved region: " + this.identity_saves[i][1])
		//console.log("equal? " + equal)
		
		if (equal){
			//alert("found match at index: " + i)
			return i;
		}
	}
	//alert('not found')
	return null;
};

SAND.prototype.save_identity = function() {
	var state = this.get();
	this.identity_saves.push([state, this.get_graph(state)]);
	this.identity_id += 1;
	//console.log(this.identity_saves)
	//alert("saved as: " + this.identity_id)
	return this.identity_id;	
};

SAND.prototype.load = function(n) {
	this.set(this.saves[n]);
};

SAND.prototype.get_firing_vector = function(state){
	var region = this.get_region(state);
	
	var vector = new Float32Array(region.length);
	for (var i = 0; i < vector.length; i += 1){
		vector[i] = state[region[i] + 3];
	}	
	return vector;
};

SAND.prototype.save_firing_vector = function(){
	var gl = this.gl, w = this.statesize.x, h = this.statesize.y;
    var state = this.get();
	
	this.firing_vectors.push(sand.get_firing_vector(state));
	this.firing_vector_id = this.firing_vector_id + 1;
};

SAND.prototype.clear_firing_history = function() {	
	var gl = this.gl;
	var state = this.get();
	
	for (var i = 0; i < state.length; i += 4) {	
		state[i + 3] = 0;							
  }
	
  this.set(state);
};

// get the laplacian for this graph
// just depends on the size and shape of the graph,
// not what sand is there
SAND.prototype.get_laplacian = function(state) {
    let region = this.get_graph(state);
    w = this.statesize.x, h = this.statesize.y;
    // first pass, if a cell is not zero, put how many nonzero cells 
    // we've seen before this + 1
    let nodeSeen = 1;
    for (let i = 0; i < region.length; i++){
        if (region[i] != 0) {
            region[i] = nodeSeen;
            nodeSeen++;
        }
    }
    console.log(region.filter(i => i != 0))
    // the height of the matrix is how many nodes there are
    // in the graph plus one for the sink
    rows = [];
    for (let j = 0; j < h; j++){
        for (let i = 0; i < w; i++){
            // if there is a node here
            if (region[j*w + i] != 0) {
                let myRow = new Array(nodeSeen); //size of rows is number of nodes + 1 for sink
                myRow.fill(0);
                // since we're on a grid, all nodes have 4 connections
                let position = region[j*w + i] - 1;
                myRow[position] = 4;
                // check the four nodes around the current one
                nonSinkConnections = 0;
                let neighbors = [j*w + (i-1), j*w + (i+1), (j-1)*w + i, (j+1)*w + i];
                neighbors.forEach(function(k) {
                    if (region[k] != 0) {
                        let neigh = region[k] - 1;
                        myRow[neigh] = -1 
                        nonSinkConnections++;
                    }
                });
                // add sink connections
                myRow[myRow.length-1] = -(4 - nonSinkConnections);
                rows.push(myRow);
            }
        }
    }
    // add sink row by copying the last column
    let sinkRow = new Array(nodeSeen);
    sinkRow.fill(0);
    let sinkConnects = 0;
    for(let i = 0; i < rows.length; i++){
        sinkRow[i] = rows[i][rows[i].length - 1]; 
        sinkConnects -= sinkRow[i];
    }
    sinkRow[sinkRow.length - 1] = sinkConnects;
    rows.push(sinkRow);
    return rows;
}

// set sand by a list using the laplacian ordering
SAND.prototype.set_l = function (conf){
    let state = this.get()
    let region = this.get_graph(state);
    let confI = 0;
    for (let i = 0; i < region.length; i++){
        if (region[i] != 0) {
            state[4*i] = conf[confI];
            confI++;    
        }
    }
    this.set(state);
}

