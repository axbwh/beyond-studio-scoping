import { Plane } from 'curtainsjs'
import SvgPlane from './svg'
import frag from '/shaders/img.frag'
import textShader from '/shaders/textShader'

class LoopSlider {
  constructor(curtains, el, target) {
    this.planes = []
    this.contentWrapper = el.querySelector('.loop')
    this.contentWrapper.style.animation='none'
    this.width = this.contentWrapper.offsetWidth
    this.offset = 0

    el.querySelectorAll('svg').forEach((e, i) => {
      this.planes[i] = new SvgPlane(curtains, e, target, "#fff")
      e.parentElement.parentElement.style.opacity = 0
    })
  }

  resize(){
    this.offset = 0
    this.width = this.contentWrapper.offsetWidth
  }

  update(delta){
    this.offset = this.offset > -this.width / 2 ? this.offset - delta * 120 : 0
    this.planes.forEach((p, i) =>{
        //p.updateTranslation(this.offset)
        p.plane.relativeTranslation.x = this.offset
    })
  }
}

export default LoopSlider
