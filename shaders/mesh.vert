varying vec4 mvPosition;
varying mat3 vNormalMatrix;
varying mat4 mvMatrix;
varying vec2 vUv;
void main()
{
  // is a predefined vertex attribute (see WebGLProgram)
  vNormalMatrix =  normalMatrix;
  mvMatrix = modelViewMatrix;
  mvPosition = modelViewMatrix * vec4(position, 1.0);
  vUv = uv;
  gl_Position = projectionMatrix * mvPosition;
}