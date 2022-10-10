precision mediump float;

varying vec3 vVertexPosition;
varying vec2 vTextureCoord;

uniform sampler2D uTexture;

void main() {
    // just display our texture
    gl_FragColor = texture2D(uTexture, vTextureCoord);
}