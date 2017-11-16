attribute vec4 aVertexPosition;
//attribute vec4 aVertexColor;

uniform vec4 uVertexColor;
uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;

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
    vec4 vertexAdder; // will get added to the vertex position 
    vertexAdder = vec4(0.0, 0.0, 0.0, 0.0); // no change as default

    //wesley colors

    if (size == 0){		
            result = ivec4(0,0,255,0);	//dark blue
    } else if (size == 1){
            result = ivec4(255,255,0,0);	//yellow
            vertexAdder = vec4(0.0, 0.1, 0.0, 0.0); // +1y
    } else if (size == 2){
            result = ivec4(51,255,255,0);	//light blue
            vertexAdder = vec4(0.0, 0.2, 0.0, 0.0); // +2y
    } else if (size == 3){
            result = ivec4(153,76,0,0);	//brown
            vertexAdder = vec4(0.0, 0.3, 0.0, 0.0); // +3y
    } else if (size >= 4){
            result = ivec4(255,255,255,0);	//white
            vertexAdder = vec4(0.0, 0.4, 0.0, 0.0); // +4y
    } 	

    if (cell.r < 0) {
            result = ivec4(100) - result;
            vertexAdder = vec4(0.0, -0.1, 0.0, 0.0); // -1y
    }

    if (cell.g == 0){
            result = ivec4(0,0,128,0);
    } else if (cell.g == 2){
            result = ivec4(0,255,0,0);
    } else if (cell.g == 3){
            result = ivec4(255,0,0,0);
    } 

    vColor = encode(result);

    
    gl_Position = uProjectionMatrix * uModelViewMatrix * (aVertexPosition + vertexAdder);

}
