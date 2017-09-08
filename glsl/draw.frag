#ifdef GL_ES
precision highp float;
#endif

uniform vec2 scale;
uniform vec2 shift;
uniform sampler2D state;
uniform float color;

int max = 1048576 - 1;

int color_choice = int(color);

ivec4 decode (vec4 data){
	return ivec4(floor(.5 + float(max) * data.r), floor(.5 + float(max) * data.g), floor(.5 + float(max) * data.b), floor(.5 + float(max) * data.a));
}

vec4 encode (ivec4 data){
	return vec4(float(data.r)/float(255), float(data.g)/float(255), float(data.b)/float(255), float(data.a)/float(255));
}

ivec4 get(int x, int y){ //lookup at current spot with some pixel offset
	return decode(texture2D(state, (gl_FragCoord.xy + vec2(x, y) + shift) / scale*2.0 ));
}

int hundreds(int n, int base){
	return int(floor(float(n)/float(base*base)));
}

int tens(int n, int base){
	return int(floor(float(n)/float(base)));
}

int ones(int n, int base){
	return n - 10*tens(n, base);
}

vec4 color_select(ivec4 cell, int select, int sinks, int sources){
	ivec4 result;	
	
	if (select == 0){ 		
		int size = int(abs(float(cell.r)));
		
		//wesley colors
		
		if (size == 0){		
			result = ivec4(0,0,255,0);	//dark blue
		} else if (size == 1){
			result = ivec4(255,255,0,0);	//yellow
		} else if (size == 2){
			result = ivec4(51,255,255,0);	//light blue
		} else if (size == 3){
			result = ivec4(153,76,0,0);	//brown
		} else if (size >= 4){
			result = ivec4(255,255,255,0);	//white
		} 	

		if (cell.r < 0) {
			result = ivec4(100) - result;
		}
		
		if (cell.g == 0){
			result = ivec4(0,0,128,0);
		} else if (cell.g == 2){
			result = ivec4(0,255,0,0);
		} else if (cell.g == 3){
			result = ivec4(255,0,0,0);
		} 
		
	} else if (select == 1){ 	
		int size = int(abs(float(cell.r)));
		
		//this scheme for the numberphile video
		
		if (size == 0){		
			result = ivec4(10,10,100,0);	//black
		} else if (size == 1){
			result = ivec4(255,255,0,0);	//yellow
		} else if (size == 2){
			result = ivec4(0,0,255,0);	// blue
		} else if (size == 3){
			result = ivec4(255,0,0,0);	//red
		} else if (size >= 4){
			result = ivec4(255,255,255,0);	//white
		} 	
		
		result = ivec4(result.r, result.g, result.b, 0);

		if (cell.r < 0) {
			result = ivec4(255) - result;
		}	
		
		if (cell.g == 0){
			result = ivec4(0,0,128,0);
		} else if (cell.g == 2){
			result = ivec4(0,255,0,0);
		} else if (cell.g == 3){
			result = ivec4(255,0,0,0);
		}
	
	} else if (select == 2){	
		
		// shows outdegree
		
		int deg = tens(cell.b, 10);
		
		result = ivec4((deg + 1)*(255/5)   , (deg + 1)*(255/5)  , (deg + 1)*(255/5), 0);
		
	
		if (cell.g == 0){
			result = ivec4(0,0,128,0);
		} else if (cell.g == 2){
			result = ivec4(0,255,0,0);
		} else if (cell.g == 3){
			result = ivec4(255,0,0,0);
		}
	
	} else if (select == 3){	
		
		//this scheme shows unstable vertices
		
		if (cell.r == 4) {
			result = ivec4(255,255,255,0);
		} else {
			result = ivec4(50,50,50,0);
		}
		
		if (cell.g == 0){
			result = ivec4(0,0,128,0);
		} else if (cell.g == 2){
			result = ivec4(0,255,0,0);
		} else if (cell.g == 3){
			result = ivec4(255,0,0,0);
		}	
		
	} else if (select == 4){	
	
		//shows how many times a cell has fired  (256^3 colors)
		int size = int(abs(float(cell.a)));
		int base = 10; //must be 0 < base < 256	

		result = ivec4(ones(size, base)*(300/base), tens(size, base)*(255/base), hundreds(size, base)*(255/base), 0);
	//	result = ivec4(0, tens(size, base)*(255/base), hundreds(size, base)*(255/base), 0);
	
		if (cell.a < 0) {
			result = ivec4(255) - result;
		}

		if (cell.g == 0){
			result = ivec4(0,0,128,0);
		} else if (cell.g == 2){
			result = ivec4(0,255,0,0);
		} else if (cell.g == 3){
			result = ivec4(255,0,0,0);
		}	
		
	} else if (select == 5){	
		//multiplicative gradient (256*3 colors)
		int size = int(abs(float(cell.r)));
		int base = 10; //must be 0 < base < 256	
		
		if (size < base * 1) {
			result = ivec4(0, 0, size*(255/base), 0);
		} else if (size < base * 2) {
			result = ivec4(0, (size - base)*(128/base), 255, 0);
		} else {
			result = ivec4((size - base - base) *(64/base), 255, 255, 0);
		}
		
		if (cell.r < 0) {
			result = ivec4(255) - result;
		}
		
		if (cell.g == 0){
			result = ivec4(0,0,128,0);
		} else if (cell.g == 2){
			result = ivec4(0,255,0,0);
		} else if (cell.g == 3){
			result = ivec4(255,0,0,0);
		}		
		
	} else if (select == 6){	
		int size = int(abs(float(cell.r)));
		//exponential gradient (256^3 colors)
		
		int base = 10; //must be 0 < base < 256	
		
		result = ivec4(ones(size, base)*(255/base), tens(size, base)*(255/base), hundreds(size, base)*(255/base), 0);
		
		if (cell.r < 0) {
			result = ivec4(255) - result;
		}
		
		if (cell.g == 0){
			result = ivec4(0,0,128,0);
		} else if (cell.g == 2){
			result = ivec4(0,255,0,0);
		} else if (cell.g == 3){
			result = ivec4(255,0,0,0);
		}		
		
	} else if (select == 7){	
		int size = int(abs(float(cell.r)));
		// grayscale

		if (size > 3){
			result = ivec4(255,255,255,0);
		} else {
			result = ivec4((size + 1)*(255/5)   , (size + 1)*(255/5)  , (size + 1)*(255/5), 0);
		}
		
		if (cell.r < 0) {
			result = ivec4(255) - result;
		}
		
		if (cell.g == 0){
			result = ivec4(0,0,0,0);
		} else if (cell.g == 2){
			result = ivec4(0,255,0,0);
		} else if (cell.g == 3){
			result = ivec4(255,0,0,0);
		}

	} else if (select == 8){	
		// sand digit rep.
		int size = int(abs(float(cell.r)));
		int base = 10; //must be 0 < base < 256	

		result = ivec4(ones(size, base)*(300/base), tens(size, base)*(255/base), hundreds(size, base)*(255/base), 0);
	
		if (cell.r < 0) {
			result = ivec4(255) - result;
		}

		if (cell.g == 0){
			result = ivec4(0,0,128,0);
		} else if (cell.g == 2){
			result = ivec4(0,255,0,0);
		} else if (cell.g == 3){
			result = ivec4(255,0,0,0);
		}	
		
	}
	
	
	
	
	//can add as many color schemes as you'd like
	return encode(result);
}

void main() {	
	gl_FragColor = color_select(get(0,0), color_choice, 0, 0);
}