import {Plane, RenderTarget, ShaderPass} from 'curtainsjs';
import SvgPlane from './svg';
import fadeFrag from '/shaders/fade.frag'
import textShader from '/shaders/textShader';

class Fade {
  constructor(curtains, el, target) {
    if(el.tagName.toLowerCase() == 'img'){
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
    }else{
    this.plane = new SvgPlane(curtains, el, target).plane
    }
  }
}

export default Fade
