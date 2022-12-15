import textShader from '/shaders/textShader'
import { Plane } from 'curtainsjs'

class SvgPlane {
    constructor(curtains, el, target, color){
    this.svg = el
    this.color = color
    this.canvas = document.createElement("canvas")
    this.context = this.canvas.getContext("2d");
    this.paths = [...this.svg.querySelectorAll('path')].map(p => p.getAttribute('d'))
    
    //let pathString = this.svg.querySelector('path').getAttribute('d')

    this.plane = new Plane(curtains, this.svg, {
        vertexShader: textShader.vs,
        fragmentShader: textShader.fs,
        onAfterResize: () => {
            this.sizeSvg()
        }
      })

    this.sizeSvg()
    this.plane.loadCanvas(this.canvas, {sampler: "uTexture"})
    this.plane.setRenderTarget(target)
    this.svg.style.opacity = 0
  }

  sizeSvg(){
    let rect = this.plane.getBoundingRect()
    this.canvas.width = rect.width
    this.canvas.height = rect.height
    this.context.width = rect.width
    this.context.height = rect.height

    this.paths.forEach(path => {
        let p = new Path2D(path)
        this.context.fillStyle = this.color
        this.context.fill(p)
    })
  }
}

export default SvgPlane
