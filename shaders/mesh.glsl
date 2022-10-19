    #include <dithering_fragment>
    vec2 uv = vUv;

    //gradient from edge
    vec2 uvn=  abs(uv -0.5)*2.0;
    vec2 distV     = uvn;
    float maxDist  = max(abs(distV.x), abs(distV.y));
    float circular = length(distV);
    float square   = maxDist;
    float mix = mix(circular,square,maxDist);
    //mix = smoothstep(0.1, 1.0, mix);
    //

    //noise
    float noise = snoise(vec3(uv.x * 2.0, uv.y * 2.0, 10.0));
    //
    //float noise = 0.0;

    gl_FragColor = vec4(mix, outgoingLight.b, noise, 1.0);
