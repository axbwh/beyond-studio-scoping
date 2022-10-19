#pragma glslify: snoise3 = require(glsl-noise/simplex/3d)
varying vec2 vUv;
void main()
{

    vec2 uv = vUv;

    //gradient from edge
    vec2 uvn=abs(uv-0.5)*2.0;
    vec2 distV     = uvn;
    float maxDist  = max(abs(distV.x), abs(distV.y));
    float circular = length(distV);
    float square   = maxDist;
    float mix = mix(circular,square,maxDist);
    mix = smoothstep(0.1, 1.0, mix);
    //

    //noise
     float noise = snoise3(vec3(uv.x * 2.0, uv.y * 2.0, 10.0));
    //
    noise = 0.0;

    gl_FragColor = vec4(mix, 1.0, noise, 1.0);
}