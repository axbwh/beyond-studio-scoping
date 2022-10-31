#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

#pragma glslify: snoise3 = require(glsl-noise/simplex/3d)
#pragma glslify: ease = require(glsl-easings/elastic-in)


varying vec3 vVertexPosition;
varying vec2 vTextureCoord;

uniform sampler2D uRenderTexture;
uniform sampler2D threeDTexture;
uniform sampler2D uPuck;
uniform sampler2D uBg;


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


    float baseMorph = threeDCol.r * 0.5 + sin(threeDCol.b) * threeDCol.r * 1.0;
    float morphStrength = 0.005;
    float morph = ease(threeDCol.r);
    float baseStrength = 0.02;

    uv += baseMorph * baseStrength;
    //rgb split
    vec2 uvR = uv;
    vec2 uvG = uv;
    vec2 uvB = uv;

    uvR.x += morph * morphStrength;
    uvR.y += morph * morphStrength;
    uvG.x -= morph * morphStrength;
    uvG.y += morph * morphStrength;
    uvB.y -= morph * morphStrength;


    vec4 colR =  texture2D(uRenderTexture, uvR);
    vec4 colG =  texture2D(uRenderTexture, uvG);
    vec4 colB =  texture2D(uRenderTexture, uvB);

    vec4 bgCol = texture2D(uBg, uv); // the bg
    vec4 puckCol =  vec4(texture2D(uPuck, uvR).r, texture2D(uPuck, uvG).g, texture2D(uPuck, uvB).b, 1.0); //images in the pcuk
    puckCol.a = max(puckCol.r, max(puckCol.g, puckCol.b));

    float maxA = max(max(colR.a, colG.a), colB.a);
    //maxA = max(colR.a, colG.a);
    //maxA = colR.a;

    vec4 splitCol = vec4(colR.r, colG.g, colB.b, maxA);
    vec4 baseCol =  texture2D(uBg, uv); // baseColor

    vec4 negCol = (1.0 - splitCol) + puckCol + bgCol ;
    negCol.a = max(splitCol.a, puckCol.a);


    float alpha = threeDCol.a;

    vec4 mixCol = mix(baseCol, negCol, alpha);

    float t = uTime /1000.0  ;

    // gradient noise
    float noise = snoise3(vec3(uv.x - uMouse.x / 20.0 + t, uv.y - uMouse.y *0.2, (uMouse.x + uMouse.y) / 20.0 + t));
    float black = snoise3(vec3(uv.y - uMouse.y / 20.0, uv.x - uMouse.x*0.2, t * 1.0));

    vec4 gradient = mix(uCol1, uCol2, noise);
    gradient = mix(gradient, uBgCol, black);
    //

    mixCol = mix(mixCol, uBgCol, clamp(alpha - mixCol.a, 0.0, 1.0));

    mixCol = mix( gradient + threeDCol.g *0.8, mixCol, mixCol.a - threeDCol.g);

    gl_FragColor = mixCol;

    //gl_FragColor = gradient;
    //gl_FragColor = texture2D(threeDTexture, uv);
}