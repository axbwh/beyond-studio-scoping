precision mediump float;

varying vec3 vVertexPosition;
varying vec2 vTextureCoord;

uniform vec4 uColor;

void main() {
    // just display our texture
    gl_FragColor = uColor;
}