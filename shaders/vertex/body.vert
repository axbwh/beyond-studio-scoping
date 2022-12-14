vec4 worldPosition = vec4( transformed, 1.0 );
worldPosition = modelMatrix * worldPosition;

vec4 atPos = vec4(uAttractor, 1.0);
float dist = distance(uAttractor, worldPosition.xyz);
vec4 direction = normalize(atPos - worldPosition);
worldPosition =  vec4(worldPosition.xyz + uVelocity * sineIn( (3.5 - clamp(dist, 0.0, 3.5)) / 3.5), 1.0);

gl_Position = projectionMatrix * viewMatrix * worldPosition;
