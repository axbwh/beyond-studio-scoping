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
uniform sampler2D uImg;


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
    vec4 threeDCol = texture2D(threeDTexture, uv);

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

    float baseMorph = threeDCol.r * 0.5 + ((sin(threeDCol.b) + 2.0) / 2.0) * threeDCol.r * 0.5;
    //baseMorph = clamp(threeDCol.r, 0.0001, 0.999);
    float morphStrength = 0.005;
    float morph = ease(threeDCol.r);
    float baseStrength = 0.02;

    vec2 muv = vec2(clamp(uv.x, 0.0, 1.0) + baseMorph * baseStrength, clamp(uv.y, 0.0, 1.0)  + baseMorph * baseStrength);

    //rgb split
    vec2 uvR = muv;
    vec2 uvG = muv;
    vec2 uvB = muv;

    uvR.x += morph * morphStrength;
    uvR.y += morph * morphStrength;
    uvG.x -= morph * morphStrength;
    uvG.y += morph * morphStrength;
    uvB.y -= morph * morphStrength;

    
    float t = uTime /1000.0  ;

    // gradient noise
    float noise = snoise3(vec3(uv.x - uMouse.x / 20.0 + t, uv.y - uMouse.y *0.2, (uMouse.x + uMouse.y) / 20.0 + t));
    float black = snoise3(vec3(uv.y - uMouse.y / 20.0, uv.x - uMouse.x*0.2, t * 1.0));

    vec4 gradient = mix(uCol1, uCol2, noise);
    gradient = mix(gradient, uBgCol, black);
    //


    vec4 colR =  texture2D(uRenderTexture, uvR);
    vec4 colG =  texture2D(uRenderTexture, uvG);
    vec4 colB =  texture2D(uRenderTexture, uvB);

    vec4 bgCol = texture2D(uBg, uv); // images not in the puck
    vec4 puckCol =  vec4(texture2D(uPuck, uvR).r, texture2D(uPuck, uvG).g, texture2D(uPuck, uvB).b, 1.0); //images only in the pcuk

    puckCol.a = max(texture2D(uPuck, uvR).a, max(texture2D(uPuck, uvG).a, texture2D(uPuck, uvB).a));

    vec4 imgCol =  vec4(texture2D(uImg, uvR).r, texture2D(uImg, uvG).g, texture2D(uImg, uvB).b, 1.0); //images
    imgCol.a = max( max(texture2D(uImg, uvR).a, texture2D(uImg, uvG).a), texture2D(uImg, uvB).a);
 
    float maxA = max(max(colR.a, colG.a), colB.a);
    //maxA = max(colR.a, colG.a);
    //maxA = colR.a;

    vec4 splitCol = vec4(colR.r, colG.g, colB.b, maxA);
    vec4 baseCol =  texture2D(uRenderTexture, uv) + bgCol + imgCol; // baseColor

    vec4 defCol = (1.0 - splitCol);
    defCol.a = splitCol.a;
    defCol =  mix(puckCol + imgCol, defCol, defCol.a);



    float alpha = threeDCol.a;

    float gradientMix = 0.5;


    //defCol = mix(defCol, gradient, gradientMix);
    
    vec4 mixCol = mix(baseCol, defCol, alpha);
    mixCol = mix(mixCol, uBgCol, clamp(alpha - mixCol.a, 0.0, 1.0));
    mixCol = mix( gradient + threeDCol.g *0.8, mixCol, mixCol.a - threeDCol.g); // highlight

    gl_FragColor = mixCol;

    //gl_FragColor = gradient;
    //gl_FragColor = texture2D(threeDTexture, uv);
    //gl_FragColor = vec4(texture2D(uImg, muv).rgb, 1.0);
    //gl_FragColor = vec4(baseMorph, 0.0,0.0,1.0);
    //gl_FragColor = threeDCol;
}