varying lowp vec4 vColor;
varying lowp vec3 vBC;


void main(void) {
    if(any(lessThan(vBC, vec3(0.02)))){
        gl_FragColor = vec4(0.0, 1.0, 0.0, 1.0);
    }
    else{
        gl_FragColor = vColor;
    }
}
