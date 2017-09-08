#ifdef GL_ES
precision highp float;
#endif

uniform sampler2D state;

uniform vec2 scale;

int max = 1048576 - 1;
vec2 center = vec2(.5, .5);

// data is stored in RBGA float channels
// r : sand height
// g : cell type, 0 = node, 1 = sink, 2 = source, 3 = wall
// b : two bits for "fired last round?" and "negative or positive sand?"
// a : total firings at this cell so far (since last reset)

// below are just some helper functions

// decode and encode color data and sand heights
ivec4 decode (vec4 data){
	return ivec4(floor( .5 + float(max) * data.r), floor(.5 + float(max) * data.g), floor(.5 + float(max) * data.b), floor(.5 + float(max) * data.a));
}

vec4 encode (ivec4 data){
	return vec4(float(data.r)/float(max), float(data.g)/float(max), float(data.b)/float(max), float(data.a)/float(max));
}

ivec4 get(int x, int y){ //lookup at current spot with some pixel offset
	return decode(texture2D(state, (gl_FragCoord.xy + vec2(x, y)) / scale));
}

int tens(int n){
	return int(floor(float(n)/float(10)));
}

int ones(int n){
	return n - 10*tens(n);
}

// main is executed for each pixel in the state texture once per frame (once per call of sand.step() in the javascript).

void main() {
	vec2 position = gl_FragCoord.xy;
	float x = position.x;
	float y = position.y;
	
	int N, E, W, S, C, F;
	int deg = 4; //this is just for walls, I subtract from this when adjacent to a wall
	ivec4 cell = get(0,0);
	ivec4 cellN = get(0,1);
	ivec4 cellE = get(1,0);
	ivec4 cellW = get(-1,0);
	ivec4 cellS = get(0,-1);
	vec4 result;
	
	if (cell.g == 0){
		result = encode(ivec4(0, 0, cell.b, cell.a));
	} else if (cell.g == 3){
		result = encode(ivec4(0,3, cell.b, cell.a));
	} else {
		// determine outdegree (I'm treating walls as the edge to that node being deleted)
		//if (cellN.g == 3){deg--;}
		//if (cellE.g == 3){deg--;}	
		//if (cellS.g == 3){deg--;} 
		//if (cellW.g == 3){deg--;}
		
		int deg = tens(cell.b);
		
		// checking if a neighbor fired last round (or if a neighbor is a source), in which case we get one		
		//if (tens(cellN.b) == 1 || cellN.g == 2){N = 1;} else {N = 0;} 	
		//if (tens(cellE.b) == 1 || cellE.g == 2){E = 1;} else {E = 0;} 	
		//if (tens(cellS.b) == 1 || cellS.g == 2){S = 1;} else {S = 0;} 	
		//if (tens(cellW.b) == 1 || cellW.g == 2){W = 1;} else {W = 0;} 	
		
		if (cellN.g == 2 || cellN.r >= tens(cellN.b)){N = 1;} else {N = 0;} 	
		if (cellE.g == 2 || cellE.r >= tens(cellE.b)){E = 1;} else {E = 0;} 	
		if (cellS.g == 2 || cellS.r >= tens(cellS.b)){S = 1;} else {S = 0;} 	
		if (cellW.g == 2 || cellW.r >= tens(cellW.b)){W = 1;} else {W = 0;} 	
		
		// these two parts below are the core of the cellular automata loop described in the computation section of the paper
		
		// if I will fire
		if (cell.r >= deg) {C = -deg; F = 1;} else {C = 0; F = 0;} 	
		
		// how much sand I get from neighbors
		if (ones(cell.b) == 1){
			if (N + E + S + W + C - cell.r >= 0){
				cell.r = (N + E + S + W + C) - cell.r;
				//cell.b = tens(cell.b);
			} else {
				cell.r = -1*(N + E + S + W + C - cell.r);
				//cell.b = tens(cell.b) + 1;
			}
		} else {
			cell.r = (N + E + S + W + C) + cell.r;
		}
		
		cell.a += F;					// total firings
		//cell.b = ones(cell.b) + 10*F;	// fired this time?

		result = encode(cell);
	}
		
	gl_FragColor = result;
}