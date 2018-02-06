precision mediump float;

uniform float uColorScheme;

varying lowp vec4 vColor;
varying lowp vec4 vCell;

int color_choice = int(uColorScheme);

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

    ivec4 result;
    ivec4 cell = ivec4(vCell);
    int size = int(abs(float(cell.r)));

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

    gl_FragColor = encode(result);
}
