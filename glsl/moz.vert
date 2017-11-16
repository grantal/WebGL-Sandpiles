attribute vec4 aVertexPosition;
//attribute vec4 aVertexColor;

uniform vec4 uVertexColor;
uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;
uniform vec2 scale;
uniform vec2 shift;

varying lowp vec4 vColor;

uniform sampler2D uSampler;

int max = 1048576 - 1;

ivec4 decode (vec4 data){
	return ivec4(floor(.5 + float(max) * data.r), floor(.5 + float(max) * data.g), floor(.5 + float(max) * data.b), floor(.5 + float(max) * data.a));
}

ivec4 get(int x, int y){ //lookup at current spot with some pixel offset
	return decode(texture2D(uSampler, (vec2(x, y) + shift) / scale*2.0 ));
}

vec4 encode (ivec4 data){
	return vec4(float(data.r)/float(255), float(data.g)/float(255), float(data.b)/float(255), float(data.a)/float(255));
}



void main(void) {
    gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;

    // height stuff
    ivec4 cell;
    int x = int((aVertexPosition.x+0.5)*600.0);
    int y = int((aVertexPosition.z+0.5)*600.0);
    cell = get(x,y);

    int size = int(abs(float(cell.r)));

    ivec4 result;

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

    vColor = encode(result);
}
