#ifdef GL_ES
precision highp float;
#endif

attribute vec2 quad;

uniform vec3 matrix1;
uniform vec3 matrix2;
uniform vec3 matrix3;

void main() {
	mat3 matrix = mat3(matrix1, matrix2, matrix3);	
	gl_Position = vec4((matrix*vec3(quad, 1)).xy, 0, 1.0);
}