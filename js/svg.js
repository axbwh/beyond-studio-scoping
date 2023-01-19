import textShader from '/shaders/textShader'
import fadeFrag from '/shaders/fade.frag'
import { Plane } from 'curtainsjs'
import { Canvg } from 'canvg'
import parseColor from 'parse-color'

class SvgPlane {
    constructor(curtains, el, target, color){
    this.svg = el
    this.color = color ? color : window.getComputedStyle(el).fill
    this.bgColor = [...parseColor(this.color).rgba]
    this.bgColor = `rgba(${this.bgColor[0]}, ${this.bgColor[1]}, ${this.bgColor[2]}, 0%)`
    this.canvas = document.createElement("canvas")
    this.context = this.canvas.getContext("2d")

    this.plane = new Plane(curtains, this.svg, {
        vertexShader: textShader.vs,
        fragmentShader: fadeFrag,
        uniforms:{
            opacity: {
                name: 'uOpacity',
                type: '1f',
                value: 1,
            }
        }})
        
        //.onAfterResize(() => this.sizeSvg())
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
    this.context.fillStyle = this.bgColor
    this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.context.fillStyle = this.color
    let v =  Canvg.from(this.context, this.svg.outerHTML)
    v.then( (svg)=>{
        svg.render()
    })
    //console.log(v)
    //v.render()
  }
}

export default SvgPlane
