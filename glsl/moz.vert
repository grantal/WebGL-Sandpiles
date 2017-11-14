attribute vec4 aVertexPosition;
//attribute vec4 aVertexColor;

uniform vec4 uVertexColor;
uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;

varying lowp vec4 vColor;

void main(void) {
  gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
  vColor = vec4(0.0, (aVertexPosition.x + 1.0) * 0.5, (aVertexPosition.z + 1.0) * 0.5, 1.0);
}
