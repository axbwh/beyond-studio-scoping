#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

#pragma glslify: snoise3 = require(glsl-noise/simplex/3d)

varying vec3 vVertexPosition;
varying vec2 vTextureCoord;

uniform sampler2D uRenderTexture;
uniform sampler2D threeDTexture;

// lerped scroll deltas
// negative when scrolling down, positive when scrolling up
uniform float uScrollEffect;

// default to 2.5
uniform float uScrollStrength;


uniform vec4 uBgCol;
uniform vec4 uFgCol;
uniform vec4 uCol1;
uniform vec4 uCol2;
uniform vec4 uCol3;
uniform vec2 uMouse;
uniform float uTime;
void main() {
    vec2 uv = vTextureCoord;
    float horizontalStretch;
    vec4 threeDCol = texture2D(threeDTexture, vTextureCoord);

    // branching on an uniform is ok
    if(uScrollEffect >= 0.0) {
        uv.y *= 1.0 + -uScrollEffect * 0.00625 * uScrollStrength;
        horizontalStretch = sin(uv.y);
    }
    else if(uScrollEffect < 0.0) {
        uv.y += (uv.y - 1.0) * uScrollEffect * 0.00625 * uScrollStrength;
        horizontalStretch = sin(-1.0 * (1.0 - uv.y));
    }

    uv.x = uv.x * 2.0 - 1.0;
    uv.x *= 1.0 + uScrollEffect * 0.0035 * horizontalStretch * uScrollStrength;
    uv.x = (uv.x + 1.0) * 0.5;
    // moving the content underneath the square


    float morph = threeDCol.r * 0.5 + sin(threeDCol.b) * threeDCol.r * 1.0;
    float morphStrength = 0.02;
    //rgb split
    vec2 uvR = uv;
    vec2 uvG = uv;
    vec2 uvB = uv;

    uvR.x += morph * morphStrength;
    uvR.y += morph * morphStrength;
    uvG.x -= morph * morphStrength;
    uvG.y += morph * morphStrength;
    uvB.y -= morph * morphStrength;

    // uvR.x += morph * morphStrength;
    // uvR.y += morph * morphStrength;
    // uvG.x += morph * morphStrength + threeDCol.b * morphStrength / 2.0 ;
    // uvG.y += morph * morphStrength + threeDCol.b * morphStrength /2.0 ;
    // uvB.y -= morph * morphStrength;

    vec4 colR =  texture2D(uRenderTexture, uvR);
    vec4 colG =  texture2D(uRenderTexture, uvG);
    vec4 colB =  texture2D(uRenderTexture, uvB);
    float maxA = max(max(colR.a, colG.a), colB.a);
    maxA = max(colR.a, colG.a);
    maxA = colR.a;

    vec4 splitCol = vec4(colR.r, colG.g, colB.b, maxA);

    vec4 baseCol = texture2D(uRenderTexture, uv); // baseColor

    vec4 negCol = 1.0 - splitCol;
    negCol.a = splitCol.a;

    vec4 mixCol = mix(baseCol, negCol, threeDCol.g);

    float t = uTime /500.0  ;

    // gradient noise
    float noise = snoise3(vec3(uv.x - uMouse.x / 10.0 + t, uv.y - uMouse.y, (uMouse.x + uMouse.y) / 10.0 + t));
    float black = snoise3(vec3(uv.y - uMouse.y / 10.0, uv.x - uMouse.x, t * 1.0));

    vec4 gradient = mix(uCol1, uCol2, noise);
    gradient = mix(gradient, uBgCol, black);
    //

    mixCol = mix(mixCol, uBgCol, clamp(threeDCol.g - mixCol.a, 0.0, 1.0));

    mixCol = mix( gradient, mixCol, mixCol.a);

    gl_FragColor = mixCol;

    //gl_FragColor = gradient;
    //gl_FragColor = texture2D(threeDTexture, uv);
}