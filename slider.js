import anime from 'animejs';
import {Plane, RenderTarget, ShaderPass} from 'curtainsjs';
import sliderFrag from './shaders/slider.frag'
import sliderVert from './shaders/slider.vert'

class Slider {
  constructor(curtains, el, dom, trigger) {
    this.curtains = curtains
    this.element = el
    this.dom = dom
    this.triggers = [...trigger.querySelectorAll('.slider-dot')]
    this.num = [...trigger.querySelectorAll('.text-sml')]
    this.doms = [...this.dom.querySelectorAll('.cms-item')]
    this.images = this.element.querySelectorAll('img')


    this.dom.querySelectorAll('img').forEach((e) =>{
      e.style.display = 'none'
    })

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

    this.lastFrame = performance.now()

    // here we will handle which texture is visible and the timer to transition between images
    this.state = {
      activeIndex: 0,
      nextIndex: 1, // does not care for now
      maxTextures: this.images.length, 

      isChanging: false,
      transitionTimer: 0,
    }
  }

  init(target, callback) {

    this.doms.forEach((e, i) =>{
      if(i != this.state.activeIndex){
        anime.set(e.querySelectorAll('p, h3'), {
          opacity:0,
          translateY: '4vh'
        })
      }
    }) // hide sliders


    this.num[2].innerText = this.state.maxTextures

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

    this.triggers.forEach( (e, i) => {
      e.addEventListener('click', () => {
        this.onClick(i)
      })
    })
  }

  onClick(i) {
    if (!this.state.isChanging) {
      // enable drawing for now
      //curtains.enableDrawing();

      this.state.isChanging = true

      if(i < 1){
          // check what will be next image
          if (this.state.activeIndex < this.state.maxTextures - 1) {
            this.state.nextIndex = this.state.activeIndex + 1
          } else {
            this.state.nextIndex = 0
          }
      }else{
        if (this.state.activeIndex > 0) {
          this.state.nextIndex = this.state.activeIndex - 1
        } else {
          this.state.nextIndex = this.state.maxTextures - 1
        }
      }

      

      anime({
        targets: this.doms[this.state.activeIndex].querySelectorAll('p, h3'),
        opacity: { value: 0, duration: 400, easing: 'easeInSine'},
        translateY: { value: '-4vh', duration: 400, easing: 'easeInSine'},
        delay: anime.stagger(100)
      })

      anime({
        targets: this.num[0],
        opacity: { value: 0, duration: 400, easing: 'easeInSine'},
        translateY: { value: '-4vh', duration: 400, easing: 'easeInSine'},
      }).finished.then(()=> {
        this.num[0].innerText = this.state.nextIndex + 1
        anime({
          targets: this.num[0],
          opacity: { value: 1, duration: 400, easing: 'easeOutSine'},
          translateY: { value: ['4vh', '0vh'], duration: 400, easing: 'easeOutSine'}
        })
      })

      anime({
        targets: this.doms[this.state.nextIndex].querySelectorAll('p, h3'),
        opacity: { value: 1, duration: 400, easing: 'easeOutSine'},
        translateY: { value: ['4vh', '0vh'], duration: 400, easing: 'easeOutSine'},
        delay: anime.stagger(100, {start: 400})
      })
  

      // apply it to our next texture
      this.next.setSource(this.images[this.state.nextIndex])
      this.displacement.setSource(this.images[this.state.activeIndex])

      setTimeout(() => {
        // disable drawing now that the transition is over
        //curtains.disableDrawing();

        this.state.isChanging = false

        this.state.activeIndex = this.state.nextIndex
        // our next texture becomes our active texture
        this.active.setSource(this.images[this.state.activeIndex])

        // reset timer
        this.state.transitionTimer = 0
      }, 1700) // add a bit of margin to the timer

      this.callback()
    }
  }

  getDelta(){
    let delta = (performance.now() - this.lastFrame) / 1000
    delta = delta > 0.5 ? 0.5 : delta
    this.lastFrame = performance.now()
    return delta
}

  onRender() {

    let delta = this.getDelta()
    // increase or decrease our timer based on the active texture value
    if (this.state.isChanging) {
      // use damping to smoothen transition
      this.state.transitionTimer += (90 - this.state.transitionTimer) * delta * 2.5

      // force end of animation as damping is slower the closer we get from the end value
      if ( this.state.transitionTimer >= 90 - (delta*2.5)  && this.state.transitionTimer !== 90) {
        this.state.transitionTimer = 90
      }
    }

    // update our transition timer uniform
    this.plane.uniforms.transitionTimer.value = this.state.transitionTimer
  }
}

export default Slider