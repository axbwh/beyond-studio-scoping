import {Plane, RenderTarget, ShaderPass} from 'curtainsjs';
import fadeFrag from '/shaders/fade.frag'
import textShader from '/shaders/textShader';

class Fade {
  constructor(curtains, el, target) {
    this.plane = new Plane(curtains, el, {
      vertexShader: textShader.vs,
      fragmentShader: fadeFrag,
      uniforms:{
        opacity: {
            name: 'uOpacity',
            type: '1f',
            value: 0,
        }
      }
    })
    this.plane.loadImage(el, { sampler: 'uTexture' })
    this.plane.setRenderTarget(target)
    el.style.opacity = 0
  }
}

export default Fade
