#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

#pragma glslify: snoise3 = require(glsl-noise/simplex/3d)
#pragma glslify: ease = require(glsl-easings/elastic-in)
#pragma glslify: blend = require(glsl-blend-overlay)


varying vec3 vVertexPosition;
varying vec2 vTextureCoord;

uniform sampler2D uTxt;
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
uniform vec4 uColA;
uniform vec4 uColB;
uniform vec4 uColC;
uniform vec4 uColD;
uniform vec2 uMouse;
uniform float uTime;
uniform float uGradientOpacity;
uniform float uMorph;
uniform float uOpacity;

void main() {
    vec2 uv = vTextureCoord;
    float horizontalStretch;
    vec4 threeDCol = texture2D(threeDTexture, uv);

    // branching on an uniform is ok
    // if(uScrollEffect >= 0.0) {
    //     uv.y *= 1.0 + -uScrollEffect * 0.00625 * uScrollStrength;
    //     horizontalStretch = sin(uv.y);
    // }
    // else if(uScrollEffect < 0.0) {
    //     uv.y += (uv.y - 1.0) * uScrollEffect * 0.00625 * uScrollStrength;
    //     horizontalStretch = sin(-1.0 * (1.0 - uv.y));
    // }
    // horizontalStretch = 0.0;

    // uv.x = uv.x * 2.0 - 1.0;
    // uv.x *= 1.0 + uScrollEffect * 0.0035 * horizontalStretch * uScrollStrength;
    // uv.x = (uv.x + 1.0) * 0.5;
    // moving the content underneath the square

    // smoothscroll no stretch
    if(uScrollEffect >= 0.0) {
        uv.y += uScrollEffect;
    }
    else if(uScrollEffect < 0.0) {
        uv.y +=  uScrollEffect;
    }

    float baseMorph = threeDCol.r * 0.5 + ((sin(threeDCol.b) + 2.0) / 2.0) * threeDCol.r * 0.5;
    //baseMorph = clamp(threeDCol.r, 0.0001, 0.999);
    float morphStrength = 0.005  * uMorph;
    float morph = ease(threeDCol.r);
    float baseStrength = 0.02 * uMorph;

    vec2 muv = vec2(uv.x + baseMorph * baseStrength, uv.y  + baseMorph * baseStrength);

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

    vec4 gradient = mix(uColA, uColB, noise);
    gradient = mix(gradient, uColA, black);
    gradient.r = clamp(gradient.r, 0.0, 0.85);
    gradient.g = clamp(gradient.g, 0.0, 0.85);
    gradient.b = clamp(gradient.b, 0.0, 0.85);
    vec4 puckGradient = mix(uColC, uColD, noise);
    puckGradient = mix(puckGradient, uColC, black);
    puckGradient.r = clamp(puckGradient.r, 0.0, 0.85);
    puckGradient.g = clamp(puckGradient.g, 0.0, 0.85);
    puckGradient.b = clamp(puckGradient.b, 0.0, 0.85);
    //


    vec4 colR =  texture2D(uTxt, uvR);
    vec4 colG =  texture2D(uTxt, uvG);
    vec4 colB =  texture2D(uTxt, uvB);

    vec4 bg = texture2D(uBg, uv); // images not in the puck
    vec4 puckCol =  vec4(texture2D(uPuck, uvR).r, texture2D(uPuck, uvG).g, texture2D(uPuck, uvB).b, 1.0); //images only in the pcuk

    puckCol.a = max(texture2D(uPuck, uvR).a, max(texture2D(uPuck, uvG).a, texture2D(uPuck, uvB).a));

    vec4 imgCol =  vec4(texture2D(uImg, uvR).r, texture2D(uImg, uvG).g, texture2D(uImg, uvB).b, 1.0); //images
    imgCol.a = max( max(texture2D(uImg, uvR).a, texture2D(uImg, uvG).a), texture2D(uImg, uvB).a);
 
    float maxA = max(max(colR.a, colG.a), colB.a);
    //maxA = max(colR.a, colG.a);
    //maxA = colR.a;

    vec4 splitCol = vec4(colR.r, colG.g, colB.b, maxA);
    vec4 baseCol =  texture2D(uTxt, uv) + bg + imgCol; // baseColor

    vec4 defCol = (1.0 - splitCol);
    defCol.a = splitCol.a;
    imgCol.rgb*= imgCol.a;
    vec4 puckImgCol = max(puckCol, imgCol);
    defCol =  mix(puckImgCol, defCol, defCol.a);



    float alpha = threeDCol.a;

    defCol = vec4(blend(defCol.rgb, puckGradient.rgb), defCol.a);
    //mix in gradient
    vec4 mixCol = mix(baseCol, defCol, alpha);

    vec4 bgCol = mix(uBgCol, puckGradient, uGradientOpacity);
    mixCol.a *= uOpacity;
    mixCol = mix(mixCol, bgCol, clamp(alpha - mixCol.a, 0.0 , 1.0));
    mixCol = mix( gradient, mixCol, mixCol.a); // gradient
    mixCol = mix( clamp(puckGradient* 2.0, 0.7, 1.0), mixCol, 1.0 - threeDCol.g * 0.875 * uMorph); // highlights

    gl_FragColor = mixCol;
    //gl_FragColor.rgb *= gl_FragColor.a;

    //gl_FragColor = gradient;
    //gl_FragColor = texture2D(threeDTexture, uv);
    //gl_FragColor = vec4(texture2D(uImg, muv).rgb, 1.0);
    //gl_FragColor = vec4(baseMorph, 0.0,0.0,1.0);
    //gl_FragColor = threeDCol;
}