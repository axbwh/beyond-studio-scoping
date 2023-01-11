import anime from 'animejs';

class FallbackSlider {
  constructor(el, dom, trigger) {
    this.element = el
    this.dom = dom
    this.triggers = [...trigger.querySelectorAll('.slider-dot')]
    this.num = [...trigger.querySelectorAll('.text-sml')]
    this.doms = [...this.dom.querySelectorAll('.cms-item')]
    this.images = this.element.querySelectorAll('img')

    // this.images.forEach( (e, i) =>{
    //     e.style.clipPath = 'path("M356,4.4c341.2,38.1,513.2,204.3,523.7,282.3c27.4,123.6-242.9,288.3-328.9,338c-86.1,49.6-298.4,151.4-439.6,89.5C-1.8,664.6-6.8,459.1,4.8,362.5C32,229.5,27.2-32.3,356,4.4z")'
    // })


    this.element.style.display = 'none'

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
        anime.set(e.querySelectorAll('[slide]'), {
          opacity:0,
          translateY: '4vh',
          pointerEvents: 'none'
        })

        anime.set(e.querySelectorAll('.casestudy-img-wrapper'), {
            opacity:0,
        })

        e.style.pointerEvents = 'none'
      }else{
        anime.set(e.querySelectorAll('[slide]'), {
          pointerEvents: 'all'
        })
      }


    }) // hide sliders


    this.num[2].innerText = this.state.maxTextures

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

      this.doms.forEach( (d, i) =>{
          d.style.pointerEvents = i === this.activeIndex ? 'all' : 'none'

      })

      

      anime({
        targets: this.doms[this.state.activeIndex].querySelectorAll('[slide]'),
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
        targets: this.doms[this.state.activeIndex].querySelectorAll('.casestudy-img-wrapper'),
        scaleX: { value: ['100%', '0%'], duration: 800, easing: 'easeInQuart'},
        opacity: { value: 0, duration: 800, easing: 'easeInQuart'},
      })

      anime({
        targets: this.doms[this.state.nextIndex].querySelectorAll('.casestudy-img-wrapper'),
        scaleX: { value: ['0%', '100%'],duration: 800, easing: 'easeOutQuart'},
        opacity: { value: 1, duration: 800, easing: 'easeOutQuart'},
        delay: 800,
      })

      anime({
        targets: this.doms[this.state.nextIndex].querySelectorAll('[slide]'),
        opacity: { value: 1, duration: 400, easing: 'easeOutSine'},
        translateY: { value: ['4vh', '0vh'], duration: 400, easing: 'easeOutSine'},
        delay: anime.stagger(100, {start: 400})
      })

      setTimeout(() => {
        this.state.isChanging = false

        this.state.activeIndex = this.state.nextIndex

        // reset timer
        this.state.transitionTimer = 0
      }, 800) // add a bit of margin to the timer
    }
  }
}

export default FallbackSlider