import {Plane, RenderTarget, ShaderPass} from 'curtainsjs';
import sliderFrag from './shaders/slider.frag'
import sliderVert from './shaders/slider.vert'

class Slider {
  constructor(curtains, el) {
    this.curtains = curtains
    this.element = el

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
      maxTextures: this.element.querySelectorAll('img').length - 1, // -1 because displacement image does not count

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

    this.element.addEventListener('click', this.onClick.bind(this))
  }

  onClick() {
    if (!this.state.isChanging) {
      // enable drawing for now
      //curtains.enableDrawing();

      this.state.isChanging = true

      // check what will be next image
      if (this.state.activeIndex < this.state.maxTextures) {
        this.state.nextIndex = this.state.activeIndex + 1
      } else {
        this.state.nextIndex = 1
      }

      // apply it to our next texture
      this.next.setSource(this.plane.images[this.state.nextIndex])
      this.displacement.setSource(this.plane.images[this.state.activeIndex])

      setTimeout(() => {
        // disable drawing now that the transition is over
        //curtains.disableDrawing();

        this.state.isChanging = false

        this.state.activeIndex = this.state.nextIndex
        // our next texture becomes our active texture
        this.active.setSource(this.plane.images[this.state.activeIndex])

        // reset timer
        this.state.transitionTimer = 0
      }, 1700) // add a bit of margin to the timer

      this.callback()
    }
  }

  onRender() {
    // increase or decrease our timer based on the active texture value
    if (this.state.isChanging) {
      // use damping to smoothen transition
      this.state.transitionTimer += (90 - this.state.transitionTimer) * 0.04

      // force end of animation as damping is slower the closer we get from the end value
      if ( this.state.transitionTimer >= 88.9 && this.state.transitionTimer !== 90) {
        this.state.transitionTimer = 90
      }
    }

    // update our transition timer uniform
    this.plane.uniforms.transitionTimer.value = this.state.transitionTimer
  }
}

export default Slider