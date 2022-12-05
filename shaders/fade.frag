precision mediump float;

varying vec3 vVertexPosition;
varying vec2 vTextureCoord;

uniform sampler2D uTexture;
uniform float uOpacity;

void main() {
    // just display our texture
    vec4 texture = texture2D(uTexture, vTextureCoord);
    gl_FragColor = vec4(texture.rgb, texture.a * uOpacity);
}