import { Plane, Vec3 } from 'curtainsjs'
import frag from '/shaders/img.frag'
import textShader from '/shaders/textShader'
import lineFrag from '/shaders/line.frag'
import {TextTexture} from '/js/TextTexture';
import parseColor from 'parse-color';
import { lerpRgba, mapClamp } from '/js/utils';
import { throws } from 'assert';
import SvgPlane from './svg';

class Card {
  constructor(curtains, el, target) {
    this.planes = []
    this.el = el
    this.curtains = curtains
    this.target = target
    this.rotation = {x: 0, y: 0}
    this.hover = false
    this.color = parseColor(window.getComputedStyle(el.querySelector('.divider:not(.card-hover)')).backgroundColor).rgba.map((x,i) => i < 3 ? x/255 : x)
    this.hColor = parseColor(window.getComputedStyle(el.querySelector('.card-hover')).backgroundColor).rgba.map((x,i) => i < 3 ? x/255 : x)
    this.oColor = this.color
    this.scale = 1

    el.querySelectorAll('img').forEach((e, i) => {
      this.planes[i] = new Plane(curtains, e, {
        vertexShader: textShader.vs,
        fragmentShader: frag,
      })
      this.planes[i].loadImage(e, { sampler: 'uTexture' })
      this.planes[i].setRenderTarget(target)
      e.style.opacity = 0 
    })

    el.querySelectorAll('p').forEach((textEl) => {
        let i = this.planes.length
        this.planes[i] = new Plane(curtains, textEl, {
            vertexShader: textShader.vs,
            fragmentShader: textShader.fs
        })

        let texture = new TextTexture({
            plane: this.planes[i],
            textElement: this.planes[i].htmlElement,
            sampler: "uTexture",
            resolution: 1.2,
            skipFontLoading: true, // we've already loaded the fonts
        })

        this.planes[i].setRenderTarget(target)
        textEl.style.color = "#ff000000"
    })
    this.lines = []
    
        el.querySelectorAll('.divider:not(.card-hover)').forEach(e => {
            let i = this.planes.length
            this.planes[i] = new Plane(curtains, e, {
                vertexShader: textShader.vs,
                fragmentShader: lineFrag,
                uniforms:{
                    color: {
                        name: 'uColor',
                        type: '4f',
                        value: this.color,
                    }
                  }
              })

              this.planes[i].setRenderTarget(target)
              e.style.opacity = 0 
              this.lines[this.lines.length] = i
        })

        el.querySelectorAll('.card-hover').forEach(e => {
            e.style.display = 'none'
        })

        this.createSvg()
        this.resize()
        this.el.addEventListener('mouseenter', () => {
            this.hover = true
            this.resize()
        })
        this.el.addEventListener('mouseleave', () =>{
            this.hover = false
        })

       

        
  }

  createSvg(){

    this.svg = this.el.querySelector('svg')
    let color = window.getComputedStyle(this.el.querySelector('.card-hover')).backgroundColor
    //this.svg.style.fill = color
    this.svgPlane = new  SvgPlane(this.curtains, this.svg, this.target)
    let i = this.planes.length
    this.planes[i] = this.svgPlane.plane
    this.svgPlane = i
  }

  resize(){

    //this.sizeSvg()

    let cardRect = this.el.getBoundingClientRect()
    let center = {
        x: (cardRect.left + cardRect.width /2) * this.curtains.pixelRatio,
        y:( cardRect.top + cardRect.height /2) * this.curtains.pixelRatio,
    }

    this.planes.forEach((p, i )=> {

        let rect = p.getBoundingRect()
        let cardCenter ={ 
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height /2
        }

        let origin = {
            x: (center.x - cardCenter.x) / rect.width + 0.5,
            y: (center.y - cardCenter.y) / rect.height + 0.5,
            z: -Math.abs(((center.y - cardCenter.y) / cardRect.height)) / 20
        }

        p.setTransformOrigin(new Vec3(origin.x, origin.y, origin.z))
    })

    this.center = {
        x1: cardRect.left,
        x: cardRect.left + cardRect.width /2,
        x2: cardRect.left + cardRect.width,
        y1: cardRect.top,
        y: cardRect.top + cardRect.height /2,    
        y2: cardRect.top + cardRect.height,
    }
  }

  update(delta, mouse){
    
    let rotation = {
        x: this.hover ? (Math.PI / 4)  * (this.center.y - mouse.x) : 0 ,
        y: this.hover ? (Math.PI / 2)  * - (this.center.x - mouse.y) : 0,
    }

    let deg = Math.PI / 180

    rotation = {
        x: this.hover ? mapClamp(mouse.y, this.center.y1, this.center.y2, -30 * deg, 30 * deg) : 0 ,
        y: this.hover ? mapClamp(mouse.x, this.center.x1, this.center.x2, -30 * deg, 30 * deg) : 0,
    }
    

    this.rotation.y = this.curtains.lerp(this.rotation.y, rotation.y, delta )
    this.rotation.x = this.curtains.lerp(this.rotation.x, rotation.x, delta )

    this.color = lerpRgba(this.color, this.hover ? this.hColor : this.oColor, delta * 2)
    this.scale = this.curtains.lerp(this.scale, this.hover ? 1 : 0.9, delta*2 )

    this.planes.forEach((p, i) =>{

        if(this.lines.includes(i)){
            p.uniforms.color.value =  this.color
        }

        p.rotation.y = this.rotation.y
        p.rotation.x = this.rotation.x

        p.scale.x = this.scale
        p.scale.y = this.scale
    })
  }
}

export default Card
