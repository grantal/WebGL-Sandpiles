attribute vec4 aVertexPosition;

uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;
uniform float uColorScheme;

int color_choice = int(uColorScheme);

varying lowp vec4 vColor;

uniform sampler2D uSampler;

// I copied these 3 functions from draw.frag with slight modifications
int max = 1048576 - 1;

ivec4 decode (vec4 data){
	return ivec4(floor(.5 + float(max) * data.r), floor(.5 + float(max) * data.g), floor(.5 + float(max) * data.b), floor(.5 + float(max) * data.a));
}

ivec4 get(int x, int y){ //lookup at current spot with some pixel offset
        // if you look at the get function in draw.frag, it modifies the given xy by 'scale' and 'shift'
        // so I go the constants for this function by modifying 'scale' and 'shift' until I go something
        // that looked good and then I hardcoded it
	return decode(texture2D(uSampler, (vec2(x, y) + vec2(2780.0, 2780.0)) / vec2(12288.0, 12288.0) * 2.0));
}

vec4 encode (ivec4 data){
	return vec4(float(data.r)/float(255), float(data.g)/float(255), float(data.b)/float(255), float(data.a)/float(255));
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


void main(void) {

    // height stuff
    // scale the x and z so that we get the sort of values you'd expect for
    // gl_FragCoord in draw.frag
    // so normally the "get" function gets the location of a cell based on
    // the position of specific pixel, so I'm just scaling the vertex
    // coordinates so that they line up with the size of the screen
    int x = int((aVertexPosition.x+0.5)*600.0);
    int y = int((aVertexPosition.z+0.5)*600.0);
    ivec4 cell;
    cell = get(x,y);

    int size = int(abs(float(cell.r)));

    ivec4 result;

    if (color_choice == 0){ 		
            
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
            
    } else if (color_choice == 1){ 	
            
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
    
    } else if (color_choice == 2){	
            
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
    
    } else if (color_choice == 3){	
            
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
            
    } else if (color_choice == 4){	
    
            //shows how many times a cell has fired  (256^3 colors)
            size = int(abs(float(cell.a)));
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
            
    } else if (color_choice == 5){	
            //multiplicative gradient (256*3 colors)
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
            
    } else if (color_choice == 6){	
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
            
    } else if (color_choice == 7){	
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

    } else if (color_choice == 8){	
            // sand digit rep.
            size = int(abs(float(cell.r)));
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

    vec4 vertexAdder; // will get added to the vertex position 
    // it will add the height of the cell to the y of the vertex
    vertexAdder = vec4(0.0, 0.05 * float(size), 0.0, 0.0); 

    vColor = encode(result);
    
    gl_Position = uProjectionMatrix * uModelViewMatrix * (aVertexPosition + vertexAdder);

}
