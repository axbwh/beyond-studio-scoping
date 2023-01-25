import {Plane, RenderTarget, ShaderPass} from 'curtainsjs';
import sliderFrag from '/shaders/slider.frag'
import sliderVert from '/shaders/slider.vert'

class HoverSlider {
  constructor(curtains, el, trigger) {
    this.curtains = curtains
    this.element = el
    this.triggers = trigger.querySelectorAll('.service, .cms-item')
    this.images = this.element.querySelectorAll('img')

    this.params = {
      vertexShader: sliderVert,
      fragmentShader: sliderFrag,
      uniforms: {
        transitionTimer: {
          name: 'uTransitionTimer',
          type: '1f',
          value: 0,
        },
      },
    }

    // here we will handle which texture is visible and the timer to transition between images
    this.state = {
      activeIndex: 0,
      nextIndex: 1, // does not care for now
      maxTextures: this.images.length, // -1 because displacement image does not count

      isChanging: false,
      transitionTimer: 0,
    }
  }

  

  init(target, callback) {
    this.callback = callback
    //this.target = new RenderTarget(this.curtains) //create a render target for our slider
    this.target = target
    this.plane = new Plane(this.curtains, this.element, this.params) // create a plane for our slider
    this.plane.setRenderTarget(target)
    this.triggers.forEach((e, i)=> {
      // e.removeAttribute("href")
    })
    //this.pass = new ShaderPass(this.curtains, { renderTarget: this.target }) // create a shaderPass from our slider rendertarget, so that our sliderPass can stack on top

    this.plane.onLoading((texture) => {
        // improve texture rendering on small screens with LINEAR_MIPMAP_NEAREST minFilter
        texture.setMinFilter(this.curtains.gl.NEAREST)
      })
      .onReady(this.onReady.bind(this))
      .onRender(this.onRender.bind(this))
      this.element.style.opacity = 0
  }

  onReady() {
    // the idea here is to create two additionnal textures
    // the first one will contain our visible image
    // the second one will contain our entering (next) image
    // that way we will deal with only active and next samplers in the fragment shader
    // and we could easily add more images in the slideshow...
    this.displacement = this.plane.createTexture({
      sampler: 'displacement',
      fromTexture: this.plane.textures[this.state.nextIndex],
    })

    // first we set our very first image as the active texture
    this.active = this.plane.createTexture({
      sampler: 'activeTex',
      fromTexture: this.plane.textures[this.state.activeIndex],
    })
    // next we set the second image as next texture but this is not mandatory
    // as we will reset the next texture on slide change
    this.next = this.plane.createTexture({
      sampler: 'nextTex',
      fromTexture: this.plane.textures[this.state.activeIndex],
    })

    this.triggers.forEach((e, i)=> {
      e.addEventListener('mouseenter', ()=>{
        this.onEnter(i)
      })
    })
  }

  getDelta(){
    let delta = (performance.now() - this.lastFrame) / 1000
    delta = delta > 0.5 ? 0.5 : delta
    this.lastFrame = performance.now()
    return delta
}

  onEnter(i) {

    this.state.activeIndex = this.state.nextIndex
    this.active.setSource(this.images[this.state.activeIndex])
    this.displacement.setSource(this.images[this.state.activeIndex])
    this.next.setSource(this.images[i])
    this.state.nextIndex = i

    this.state.isChanging = true
    this.state.transitionTimer = 0;
  }

  onRender() {
    let delta = this.getDelta()
    // increase or decrease our timer based on the active texture value
    if (this.state.isChanging) {
      // use damping to smoothen transition
      this.state.transitionTimer += (90 - this.state.transitionTimer) * delta *4

      // force end of animation as damping is slower the closer we get from the end value
      if ( this.state.transitionTimer >= 90 -(delta*4) && this.state.transitionTimer !== 90) {
        this.state.transitionTimer = 90
      }
    }

    // update our transition timer uniform
    this.plane.uniforms.transitionTimer.value = this.state.transitionTimer
  }
}

export default HoverSlider