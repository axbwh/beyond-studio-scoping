import { Plane } from 'curtainsjs'
import frag from '/shaders/img.frag'
import textShader from '/shaders/textShader'

class LoopSlider {
  constructor(curtains, el, target) {
    this.planes = []
    this.contentWrapper = el.querySelector('.loop')
    console.log(this.contentWrapper.style)
    this.contentWrapper.style.animation='none'
    this.width = this.contentWrapper.offsetWidth
    this.offset = 0
    el.querySelectorAll('img').forEach((e, i) => {
      this.planes[i] = new Plane(curtains, e, {
        vertexShader: textShader.vs,
        fragmentShader: frag,
      })
      this.planes[i].loadImage(e, { sampler: 'uTexture' })
      this.planes[i].setRenderTarget(target)
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
        p.relativeTranslation.x = this.offset
    })
  }
}

export default LoopSlider
