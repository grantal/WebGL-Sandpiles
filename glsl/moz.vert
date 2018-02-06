attribute vec4 aVertexPosition;

uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;
uniform float uHeightMultiplier;
// uGridMatrix will convert the points from being large integers with the corner of the grid at the origin
// to small floats with the center of the grid at the origin
uniform mat4 uGridMatrix;




varying lowp vec4 vColor;
varying lowp vec4 vCell;

uniform sampler2D uSampler;

// I copied these 3 functions from draw.frag with slight modifications
int max = 1048576 - 1;

vec4 decode (vec4 data){
	return vec4(floor(.5 + float(max) * data.r), floor(.5 + float(max) * data.g), floor(.5 + float(max) * data.b), floor(.5 + float(max) * data.a));
}

vec4 get(float givenx, float giveny){ //lookup at current spot with some pixel offset
        int x = int(givenx);
        int y = int(giveny);
        // So the sandplie is in the center of the texture and the texture is 1024x1024
        // 1024/2 = 512, 512 - (100/2) = 462
	return decode(texture2D(uSampler, (vec2(x, y) + vec2(206.0, 206.0)) / vec2(512.0, 512.0)));
}



void main(void) {

    // height stuff
    vCell = get(aVertexPosition.x, aVertexPosition.z);

    int size = int(abs(float(vCell.r)));


    vec4 vertexAdder; // will get added to the vertex position 
    // it will add the height of the cell to the y of the vertex
    vertexAdder = vec4(0.0, uHeightMultiplier * float(size), 0.0, 0.0); 

    gl_Position = uProjectionMatrix * uModelViewMatrix * uGridMatrix * (aVertexPosition + vertexAdder);

}
