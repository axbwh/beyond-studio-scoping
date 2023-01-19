import anime from 'animejs';
import {Plane, RenderTarget, ShaderPass} from 'curtainsjs';
import { delay } from 'lodash';
import sliderFrag from '/shaders/slider.frag'
import sliderVert from '/shaders/slider.vert'

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

  init(target, threeD) {

    this.threeD = threeD

    this.doms.forEach((e, i) =>{
      if(i != this.state.activeIndex){
        anime.set(e.querySelectorAll('[slide]'), {
          opacity:0,
          translateY: '4vh',
          pointerEvents: 'none'
        })

        e.style.pointerEvents = 'none'
      }else{
        anime.set(e.querySelectorAll('[slide]'), {
          pointerEvents: 'all'
        })
      }
    }) // hide sliders


    this.num[2].innerText = this.state.maxTextures
    this.target = target
    this.plane = new Plane(this.curtains, this.element, this.params) // create a plane for our slider
    this.plane.setRenderTarget(target)

    this.plane.onLoading((texture) => {
        // improve texture rendering on small screens with LINEAR_MIPMAP_NEAREST minFilter
        texture.setMinFilter(this.curtains.gl.NEAREST)
      })
      .onReady(this.onReady.bind(this))
      .onRender(this.onRender.bind(this))
      this.element.style.opacity = 0

      this.time = 0
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

    this.timeline = anime.timeline({ autoplay: false, loop: true, easing: 'linear'})

    this.doms.forEach((d, i) =>{
      this.timeline.add({
        targets: d.querySelectorAll('[slide]'),
        opacity: { value: [0, 1], duration: 400},
        translateY: { value: ['4vh', '0vh'], duration: 400},
        delay: anime.stagger(100)
      }).add({
        targets: d.querySelectorAll('[slide]'),
        opacity: { value: [1, 0], duration: 400},
        translateY: { value: ['0vh', '-4vh'], duration: 400},
        delay: anime.stagger(100)
      })
    })
    
    this.timeTarget = this.timeline.duration / (this.doms.length * 2)
    this.time = this.timeTarget
    this.timeline.seek(this.time)

  }

  onClick(i) {
      // if (!this.state.isChanging) {
      // enable drawing for now
      //curtains.enableDrawing();

      // reset timer
      this.state.transitionTimer = 0
      this.state.isChanging = true

      let frameLength = this.timeline.duration / (this.doms.length *2)

      if(i < 1){
          
        this.threeD.rotationTarget += 180

        this.timeTarget += frameLength * 2

          // check what will be next image
          if (this.state.activeIndex < this.state.maxTextures - 1) {
            this.state.nextIndex = this.state.activeIndex + 1
          } else {
            this.state.nextIndex = 0
          }


      }else{
        this.timeTarget -= frameLength * 2
        this.threeD.rotationTarget -= 180

        if (this.state.activeIndex > 0) {
          this.state.nextIndex = this.state.activeIndex - 1
        } else {
          this.state.nextIndex = this.state.maxTextures - 1
        }


      }

      this.doms.forEach( (d, i) =>{
        d.style.pointerEvents = i === this.state.nextIndex ? 'all' : 'none'

        anime.set(d.querySelectorAll('[slide]'), {
          pointerEvents: i === this.state.nextIndex ? 'all' : 'none'
        })
    })

      
    // this.doms.forEach((dom, i) => {
    //   if(i != this.state.nextIndex){
    //     anime({
    //       targets: dom.querySelectorAll('[slide]'),
    //       opacity: { value: 0, duration: 400, easing: 'easeInSine'},
    //       translateY: { value: '-4vh', duration: 400, easing: 'easeInSine'},
    //       delay: anime.stagger(100)
    //     })
    //   }
    // })


      

      // anime({
      //   targets: this.num[0],
      //   opacity: { value: 0, duration: 400, easing: 'easeInSine'},
      //   translateY: { value: '-4vh', duration: 400, easing: 'easeInSine'},
      // })
      
      this.num[0].innerText = this.state.nextIndex + 1
      // anime({
      //   targets: this.num[0],
      //   opacity: { value: 1, duration: 400, easing: 'easeOutSine'},
      //   translateY: { value: ['4vh', '0vh'], duration: 400, easing: 'easeOutSine'},
      //   delay: 800
      // })

      // anime({
      //   targets: this.doms[this.state.nextIndex].querySelectorAll('[slide]'),
      //   opacity: { value: 1, duration: 400, easing: 'easeOutSine'},
      //   translateY: { value: ['4vh', '0vh'], duration: 400, easing: 'easeOutSine'},
      //   delay: anime.stagger(100, {start: 400})
      // })
  

      // apply it to our next texture
      this.next.setSource(this.images[this.state.nextIndex])
      this.displacement.setSource(this.images[this.state.activeIndex])
      this.state.activeIndex = this.state.nextIndex
      // our next texture becomes our active texture
      this.active.setSource(this.images[this.state.activeIndex])

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

      if(this.timeline){


        this.time = this.curtains.lerp(this.time, this.timeTarget, delta * 5)
        
        if(this.time >= this.timeline.duration){
          this.time -= this.timeline.duration
          this.timeTarget = this.timeTarget % this.timeline.duration
        }
  
        if(this.time <= 0){
          this.time += this.timeline.duration
          this.timeTarget = this.timeline.duration - (Math.abs(this.timeTarget) % this.timeline.duration)
        }
  
        this.timeline.seek(this.time)
    
      }

      // use damping to smoothen transition
      this.state.transitionTimer += (90 - this.state.transitionTimer) * delta * 3

      // force end of animation as damping is slower the closer we get from the end value
      if ( this.state.transitionTimer >= 90 - (delta*2.5)  && this.state.transitionTimer !== 90) {
        this.state.isChanging = false
        this.state.transitionTimer = 90
        this.time = this.timeTarget
      }
    }

    // update our transition timer uniform
    this.plane.uniforms.transitionTimer.value = this.state.transitionTimer
  }
}

export default Slider