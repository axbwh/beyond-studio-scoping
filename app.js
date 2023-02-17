import {Curtains, Plane, RenderTarget, ShaderPass, TextureLoader} from 'curtainsjs';
import {TextTexture} from './js/TextTexture';
import imgFrag from './shaders/img.frag'
import lineFrag from './shaders/line.frag'
import textShader from '/shaders/textShader';
import pageFrag from './shaders/page.frag';
import ThreeD from './js/3d';
import Slider from './js/slider';
import HoverSlider from './js/hoverSlider';
import {hexToRgb, getCoord, rgbaToArray, lerpRgba, easeInExpo, easeOutExpo, decodeHtml }from './js/utils'
import anime from 'animejs';
import _, { clamp, delay } from 'lodash';
import Stats from 'stats.js';
import * as THREE from 'three'
import Fade from './js/fadeIn';
import LoopSlider from './js/loopSlider';
import parseColor from 'parse-color';
import Card from './js/card';
import scrollToId from './js/scrollToId';
import { getGPUTier, getGPUTier } from 'detect-gpu';
import SvgPlane from './js/svg';
import fallback from './js/fallback';
import Preloader from './js/preloader';
import Logo from './js/logo';
import copyToClipboard from './js/copyToClipboard';
import VirtualScroll from 'virtual-scroll';
import ScrollBar from './js/scrollbar';


//https://github.com/martinlaxenaire/curtainsjs/blob/master/examples/multiple-textures/js/multiple.textures.setup.js
const parceled = true




class App {
    constructor(tier, preloader){
        this.preloader = preloader
        this.tier = tier
        this.mouse = { x : 0.5, y: 0.5}
        this.mse = {x: 0, y: 0}
        this.container = document.querySelector('.scrolldom')
        this.contHeight = this.container.scrollHeight
        this.y = 0
        this.ny = 0
        this.canScroll = true
        this.height = window.innerHeight
        this.width = window.innerWidth
        this.transition = false
        this.inMenu = false
        this.hasAnimed = false
        this.isAnimed = false
        // track scroll values
        this.scroll = {
            value: 0,
            lastValue: 0,
            effect: 0,
            delta: 0,
        }
        
        this.axes = {
            range: 0,
            x: 0,
            y: 0,
            size: 0,
            rotation: 0,
            rotRange: 0
        }

        this.origin = {
            x: 0,
            y: 0,
            rotation: 0,
            rotRange: 0,
            size:0,
            range: 0,
            intro: false
        }

        this.colors = {
            a: '#F198C0',
            b: "#61FCC4",
            c: '#F198C0',
            d: "#61FCC4",
            opacity: 0,
        }

        this.hoverColors ={
            a: '#F198C0',
            b: "#61FCC4",
            c: '#F198C0',
            d: "#61FCC4",
            opacity: 0,
            mix: 0
        }

        this.menuColors = {
            a: '#040707',
            b: '#040707',
            c: '#222',
            d: "#444",
            opacity: 1,
            mix: 0,
        }

        this.impulses = {
            acceleration: 0.005,
            rotation: 0,
            morph: 0,
            opacity: 0
        }

        this.lastFrame = 0

        this.frames = []
        this.pixelRatio = Math.min(this.tier.tier > 1 ? 1 + this.tier.tier / 2 : 1, window.devicePixelRatio)
        this.maxRatio = window.devicePixelRatio
        this.threeD = new ThreeD(this.pixelRatio, this.tier, this)
        this.textTextures = []
        this.ticking = false
        this.rendering = true
        this.textPlanes = []
    }

    init(){
        document.querySelector('#canvas').style.height = `${this.height}px`
        // create curtains instance
        this.curtains = new Curtains({
            container: "canvas",
            pixelRatio: this.pixelRatio,
            watchScroll: false,
            autoResize: false
            //premultipliedAlpha: true,
            //antialias: false,
        })

        this.curtains.gl.blendFunc(this.curtains.gl.SRC_ALPHA, this.curtains.gl.ONE_MINUS_SRC_ALPHA)
        this.curtains.gl.blendFunc( this.curtains.gl.ONE_MINUS_DST_ALPHA, this.curtains.gl.DST_ALPHA)
        //this.curtains.gl.blendFunc(this.curtains.gl.SRC_COLOR, this.curtains.gl.ONE_MINUS_SRC_COLOR)
        this.curtains.gl.pixelStorei(this.curtains.gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);

        this.textureOptions = {
            // premultiplyAlpha: true,
            // minFilter: this.curtains.gl.LINEAR_MIPMAP_NEAREST,
            // anisotropy: 16,
            clear: true,
        }

        this.filters = document.querySelectorAll('label.filters')

        this.curtains.onSuccess(this.onSuccess.bind(this))
        this.curtains.onError(this.onError.bind(this))
    }

    onError(){
        document.querySelectorAll('img[puck]').forEach((el)=>{
            el.style.display = "none"
        })
    }

    initTimeline(){

        let origin = document.querySelector('[origin]') ? getCoord(document.querySelector('[origin]')) : getCoord(document.querySelector('.puck'))

        if(!this.isAnimed){
            this.origin = origin ? {
                x: origin.x,
                y: origin.y,
                size: origin.size,
                rotation: origin.rotation,
                rotRange: origin.rotRange,
                range: this.origin.range,
                intro: this.origin.intro,
            } : this.origin
        }

        let frames = [...document.querySelectorAll('[stick]')].map(el => {
            return {el: el, coord: getCoord(el)}
        })

        let colorFrames = [...document.querySelectorAll('[colora], [colorb], [colorc], [colord], [copacity]')].map(el =>{
            return {el:el, coord: getCoord(el)}
        })

        this.colorTriggers = [...document.querySelectorAll('[hcolora], [hcolorb], [hcolorc], [hcolord], [hopacity]')].map(el =>{
            return {el:el, coord: getCoord(el)}
        })

        this.axes = frames[0] ? {
            range: frames[0].coord.range,
            x: frames[0].coord.x,
            y: frames[0].coord.y,
            size: frames[0].coord.size,
            rotation: frames[0].coord.rotation,
            rotRange: frames[0].coord.rotRange
        } : this.axes

        colorFrames.length > 0 && colorFrames.slice().reverse().forEach(f =>{
            this.colors = {
                ...this.colors,
                ...f.coord.colors
            }
        }) // iterate backwards through array to reset colors to first value

        this.hoverColors = {
            ...this.hoverColors,
            ...this.colors
        }

        this.menuColors.c = this.colors.a
        this.menuColors.d = this.colors.b


        let timeline = anime.timeline({
            targets: this.axes,
            easing: "linear",
            autoplay:false,
            loop: false
        })


        frames.length > 0 && frames.forEach((frame, index)=>{

            let previousTime = index > 0 ? frames[index - 1].coord.keyframe : 0
            let duration = index > 0 ? frame.coord.keyframe - frames[index - 1].coord.keyframe : 0.00001
            timeline.add({
                range: frame.coord.range,
                x: frame.coord.x,
                y: frame.coord.y,
                size: frame.coord.size,
                rotation: frame.coord.rotation,
                rotRange: frame.coord.rotRange,
                duration: duration,
                easing: frame.coord.easing
            }, previousTime)
        })

        timeline.add({
            duration: 0.00001
        }, this.contHeight - this.height - 0.00001)

        anime.set(this.colors, {
            ...this.colors,
        }) // to convert #hex to rgba when no colrs are defined

        colorFrames.length > 0 && colorFrames.forEach( (frame, index) => {
            let previousTime = index > 0 ? colorFrames[index - 1].coord.keyframe : 0
            let duration = index > 0 ? frame.coord.keyframe - colorFrames[index - 1].coord.keyframe : 0.00001
            timeline.add({
                targets: this.colors,
                ...frame.coord.colors,
                duration: duration,
            }, previousTime)
        })

        this.timeline = timeline
        this.scroll.value = this.y
        this.onScroll()

        anime.set( this.hoverColors, {
            ...this.hoverColors,
        })

       

    }

    removeText(){
        if(this.hasText){
            this.textPlanes.forEach( (plane, i) => {
                plane.visible = false
                plane.htmlElement.style.color = ''
            })
            this.hasText = false
        }
    }

    
    initText(target, pass=true){
        this.textElements = document.querySelectorAll('[text]')
        if(!this.tier.isMobile && this.tier.tier > 1){
            this.textElements.forEach((textEl, i) => {    
                
                //console.log(textEl.style.fontSize)
                this.textPlanes[i] = new Plane(this.curtains, textEl, {
                    vertexShader: textShader.vs,
                    fragmentShader: textShader.fs
                })
                // create the text texture and... that's it!
                this.textTextures[this.textTextures.length] = new TextTexture({
                    plane: this.textPlanes[i],
                    textElement: this.textPlanes[i].htmlElement,
                    sampler: "uTexture",
                    resolution: 1.5,
                    skipFontLoading: true, // we've already loaded the fonts
                })

                this.textPlanes[i].setRenderTarget(target)
                textEl.style.color = "#ff000000"//make text invisible bhut still highlightable
            })
        }

        this.hasText = true

        if(pass){
            this.pass.createTexture({
                sampler: 'uTxt',
                fromTexture: target.getTexture(),
            })
        }
    }

    loadImg(query, target, sampler, pass=true){

        const imgs = document.querySelectorAll(query)

        imgs.forEach((el) => {
            if(el.tagName.toLowerCase() == 'img'){
                const plane = new Plane(this.curtains, el, {
                    vertexShader: textShader.vs,
                    fragmentShader: imgFrag,
                  })
                  plane.loadImage(el, { sampler: 'uTexture' })
                  plane.setRenderTarget(target)
                  el.style.opacity = 0
            }else{ 
                if(!this.tier.isMobile){
                    const plane = new SvgPlane(this.curtains, el, target)
                }else if(el.parentElement.parentElement === document.querySelector('.footer-logo-wrapper')){
                    if(el.parentElement === document.querySelector('.footer-logo-wrapper .logo')){
                        el.style.opacity = 0
                    }
                }else{
                    const plane = new SvgPlane(this.curtains, el, target)
                }
            }
          })

          if(pass){
            this.pass.createTexture({
                sampler: sampler,
                fromTexture: target.getTexture(),
            })

          }


    }

    loadSvg(query, target, sampler, pass=true){
        const svgs = document.querySelectorAll(query)
    }

    initLines(){
        const divs = document.querySelectorAll('[line]')
        divs.forEach((el) => {
            const plane = new Plane(this.curtains, el, {
                vertexShader: textShader.vs,
                fragmentShader: lineFrag,
                uniforms:{
                    color: {
                        name: 'uColor',
                        type: '4f',
                        value: parseColor(window.getComputedStyle(el).backgroundColor).rgba.map((x,i) => i < 3 ? x/255 : x),
                    }
                  }
              })
  
              plane.setRenderTarget(this.textTarget)
              el.style.opacity = 0
        })
    }

    initCards(){
        this.cards = []
        if(this.tier.tier > 2 && !this.tier.isMobile){
            document.querySelectorAll('[card]').forEach((e, i) => {
                this.cards[i] = new Card(this.curtains, e, this.imgTarget)
            })
        }else{
            this.loadImg('[card] img', this.imgTarget, 'uImg', false)
        }
    }





    onResize(){
        this.height = window.innerHeight
        this.contHeight = this.container.scrollHeight
        this.width = window.innerWidth
        document.querySelector('#canvas').style.height = `${this.height}px`
        this.inMenu && this.menuClose()
        anime.set({
            targets: this.container,
            opacity: 1,
        })
        this.loopSlider && this.loopSlider.resize()
        this.scrollbar && this.scrollbar.onResize()


        this.y = 0
        this.scroll.value = 0
        this.container.scrollTop = this.scroll.value
        this.curtains.updateScrollValues(0, 0)
        this.curtains.resize()
        this.threeD.onWindowResize()
        
        this.initTimeline()

        this.scroll.value = this.ny * (this.contHeight - this.height)
        this.y = this.scroll.value
        this.curtains.updateScrollValues(0, this.scroll.value)
        this.container.scrollTop = this.scroll.value

        this.onScroll()

        this.cards.forEach(c => {
            c.resize()
        })

        this.rendering = true


    }

    onSuccess(){
        
        this.slider = document.getElementById('slider') ?  new Slider(this.curtains, document.getElementById('slider'), document.getElementById('slider-dom'), document.getElementById('slider-trigger')) : false
        this.hoverSlider = document.getElementById('hover-slider') ? new HoverSlider(this.curtains, document.getElementById('hover-slider'), document.getElementById('hover-slider-trigger')) : false   
        this.puckTarget = new RenderTarget(this.curtains, {
            texturesOptions : {
                ...this.textureOptions
            }
        })
        this.bgTarget = new RenderTarget(this.curtains, {
            texturesOptions : {
                ...this.textureOptions
            }
        })
        this.imgTarget = new RenderTarget(this.curtains, {
            texturesOptions : {
                ...this.textureOptions
            }
        })
        this.textTarget = new RenderTarget(this.curtains, {
            texturesOptions : {
                ...this.textureOptions
            }
        })

        Promise.all([
            document.fonts.load('300 1.375em "Atosmose", sans-serif'),
            document.fonts.load('200 1em "Atosmose", sans-serif'),
            document.fonts.load('400 1em "Outfit", sans-serif'),
            this.threeD.loadGlb()
        ]).then(this.onLoaded.bind(this))

        
    }

    onLoaded(){
        this.container.style.height = '100%'
        this.container.style.overflow = 'hidden'
        
        // this.stats = new Stats();
        // this.stats.showPanel( 0 ); // 0: fps, 1: ms, 2: mb, 3+: custom
        // this.stats.dom.classList.add('stats');
        // document.body.appendChild( this.stats.dom );

        this.initTimeline()


        this.pass = new ShaderPass(this.curtains, {
            fragmentShader: pageFrag,
            depth: true,
            uniforms: {
                scrollEffect: {
                    name: "uScrollEffect",
                    type: "1f",
                    value: this.scroll.effect,
                },
                scrollStrength: {
                    name: "uScrollStrength",
                    type: "1f",
                    value: 2.5,
                },
                bgCol:{
                    name: "uBgCol",
                    type: '4f',
                    value: [...hexToRgb("#111"), 1.0],
                },
                fgCol:{
                    name: "uFgCol",
                    type: '4f',
                    value: [...hexToRgb("#FFF"), 1.0],
                },
                colA:{
                    name: "uColA",
                    type: '4f',
                    value: rgbaToArray(this.colors.a),
                },
                colB:{
                    name: "uColB",
                    type: '4f',
                    value: rgbaToArray(this.colors.b),
                },
                colC:{
                    name: "uColC",
                    type: '4f',
                    value: rgbaToArray(this.colors.c),
                },
                colD:{
                    name: "uColD",
                    type: '4f',
                    value: rgbaToArray(this.colors.d),
                },
                mouse:{
                    name: "uMouse",
                    type: '2f',
                    value: [0, 0],
                },
                time:{
                    name: 'uTime',
                    type: '1f',
                    value: 0,
                },
                morph:{
                    name: 'uMorph',
                    type: '1f',
                    value: 1,
                },
                gradientOpacity:{
                    name: 'uGradientOpacity',
                    type: '1f',
                    value: 0,
                },
                opacity:{
                    name: 'uOpacity',
                    type: '1f',
                    value: 1,
                }
            }
        })
        this.pass.loadCanvas(this.threeD.canvas)
        this.initText(this.textTarget)
        //our img elements that will be in the puck & outside of it
        this.loadImg('img[gl], svg[gl]', this.imgTarget, 'uImg')
        // images that will be outside the puck
        this.loadImg('img[bg], svg[bg]', this.bgTarget, 'uBg')
        //images that will be inside the puck
        this.loadImg('img[puck], svg[puck]', this.puckTarget, 'uPuck')
        //this.initLines()
        this.initCards()
        this.fadeIn = document.querySelector('[fade="in"]') ? new Fade(this.curtains, document.querySelector('[fade="in"]'), this.puckTarget) : null
        this.fadeOut = document.querySelector('[fade="out"]') ? new Fade(this.curtains, document.querySelector('[fade="out"]'), this.puckTarget) : null



        this.slider && this.slider.init(this.puckTarget, this.threeD )

        this.hoverSlider && this.hoverSlider.init(this.puckTarget, () =>  this.onFlip(this.impulses) )
        if(!this.tier.isMobile){
            this.loopSlider = document.querySelector("#scrolling-bar") ? new LoopSlider(this.curtains, document.querySelector("#scrolling-bar"), this.imgTarget) : null
        }
        this.pass.onRender(this.onRender.bind(this))

        let _mouse = _.throttle(this.mouseEvent.bind(this), 16, {'trailing' : true, 'leading': true})
        let _resize = _.debounce(() => this.onResize(), 100, {'trailing' : true })

       document.addEventListener('mousemove', _mouse.bind(this), false);

       this.scroller = new VirtualScroll( {preventTouch: false, touchMultiplier : 3, mouseMultiplier : 0.5})

       this.scroller.on( event => {
        this.onScroll(event)
       })

       
       this.scrollbar = this.tier.isMobile ? false : new ScrollBar(this.container, this)

       this.threeD.setPos(this.origin)

       window.addEventListener('resize', ()=> {
        _resize()
       })

       window.visualViewport.addEventListener('resize', ()=>{
        _resize()
       });

       let observer = new ResizeObserver( ()=>{
            _resize()
       })

       this.container.querySelectorAll('img, #player, #submit').forEach(child => {
            observer.observe(child)
       })

        window.addEventListener("popstate", (event) => {
           this.storeScroll()
        });
        
        this.colorTriggers.length > 0 && this.colorTriggers.forEach((e) => {
            e.el.addEventListener('mouseenter', ()=> {
                
                !this.transition && anime.set( this.hoverColors, {
                    ...this.hoverColors,
                    ...e.coord.hoverColors,
                    mix: 1
                })
            })
            e.el.addEventListener('mouseleave', ()=>{
                
                !this.transition && anime.set( this.hoverColors, {
                    ...this.menuColors,
                    mix: this.inMenu ? 1 : 0,
                })
            })
        })

        document.querySelectorAll('a').forEach((e) => {
            e.addEventListener('mouseenter', ()=>{
                this.impulses.morph = 1.5
            })

            e.addEventListener('mouseleave', () =>{
                this.impulses.morph = 1
            } )
        })

        this.preload()

        this.activeFilters = []

        this.filters.forEach(e => {
            e.addEventListener('click', (event)=>{
                event.preventDefault()
                let tag = e.querySelector('span').innerHTML.toLowerCase()

                if(tag === 'reset all'){
                    this.activeFilters = []
                    this.filters.forEach(e =>{
                        e.classList.remove('filters-active')
                    })
                }else{
                        if(this.activeFilters.includes(tag)){
                        this.activeFilters = this.activeFilters.filter(f => f !== tag)
                        e.classList.remove('filters-active')
                    }else{
                        this.activeFilters[this.activeFilters.length] = tag
                        e.classList.add('filters-active')
                    }
                }
                
                
                // let tagged = document.querySelectorAll(`[category*="${tag}"]`)
                document.querySelectorAll('.cms-item').forEach((e, i) =>{
                    console.log(e)
                    let category = e.querySelector(`[category]`).getAttribute('category').toLowerCase()


                    e.style.display = this.activeFilters.includes(category) || this.activeFilters.length < 1 ? '' : 'none'                
                })
                this.curtains.resize()
                this.onResize()
            })
        })


        document.querySelectorAll('a:not([href^="#"], [target="_blank"])').forEach(e => {
            e.addEventListener('click', event => {
                event.preventDefault()
                this.onPageChange(e.href)
            })
        })

        document.querySelector('#menu-trigger').addEventListener('click', (event) =>{
            event.preventDefault()

            if (this.inMenu){
                this.menuClose()
            }else{
                this.menuOpen()
            }
            
        })
    //    this.maskIframe()
    }

    maskIframe(){
        document.querySelectorAll('iframe').forEach(i => {
            i.style.pointerEvents = 'none'
        })
    }

    storeScroll(){
        let slug = window.location.pathname
        sessionStorage.setItem(`scroll-${slug}`, this.container.scrollTop )
    }

    preload(){
        setTimeout(() => {
            this.preloader.hide()
            anime({
                targets: '#preloader',
                opacity: 0,
                duration: 2000,
                delay: 1000,
                easing: 'easeInSine',
    
            }).finished.then(() => {
                anime.set('#preloader', {
                    display: 'none'
                })
                this.preloader.stop(1)
            })
            anime({
                targets: this.impulses,
                opacity: 1,
                duration: 1500,
                delay: 1500,
                easing: 'easeInSine',
            })
            
            anime({
                targets: this.container,
                opacity: [0, 1],
                duration: 1500,
                delay: 1500,
                easing: 'easeInSine',
            })
    
            if(this.container.scrollTop > 10 || !this.fadeIn){
                this.startAnim(1000)
            }else{
                    document.addEventListener('click', () => this.startAnim())
                    this.container.addEventListener("scroll", () => this.startAnim())
    
            }
        }, 1000)

    }

    startAnim(delay = 0){
        if(!this.isAnimed && !this.transition){
            anime({
                targets: this.origin,
                range: 1,
                rotRange: 1,
                duration: 2500,
                easing: 'easeOutBounce',
                delay: delay,
               }).finished.then(() => {
                this.hasAnimed = true
                console.log('hasAnimed')
               })
               this.isAnimed = true
               console.log('isAnimed')
            //    document.removeEventListener('click', () => this.startAnim())
            //    this.container.removeEventListener("scroll", () => this.startAnim())
        }
    }

    trans(){
        this.transition = true

        this.impulses.opacity = 0

        anime({
            targets: this.hoverColors,
            c:"#040707",
            d:"#040707",
            opacity: 1,
            mix: 1,
            duration: 1000,
            easing: "easeInOutSine"
        })

        anime({
            targets: this.container,
            opacity: 0,
        })

        return anime({
            targets: this.origin,
            range:0,
            duration: 1500,
            x: 0,
            y: 0,
            size: this.width > this.height ? this.width* 2.2: this.height * (2.2 /1.29),
            easing: 'easeInOutExpo',
        })
    }

    
    onPageChange(href){
        this.trans()
        this.preloader.restart()
        this.storeScroll()
        anime({
            targets: '.burger-menu',
            opacity: 0,
            duration: 1500,
            easing: 'easeInOutExpo'
        })

        anime.set('#preloader', {
            display: ''
        })

        anime({
            targets: '#preloader',
            opacity: 1,
            duration: 1000,
            delay: 1000,
            easing: 'easeInSine',
        })
        .finished
        //.then(() => this.preloader.stop)
        .then(() => window.location.href = href)
    }

    menuOpen(){
        this.canScroll = false
        this.inMenu = true
        this.transition = true
        this.impulses.opacity = 0      
        this.menuColors.mix = 1

        // anime({
        //     targets: this.hoverColors,
        //     c:"#040707",
        //     d:"#040707",
        //     opacity: 1,
        //     mix: 1,
        //     duration: 1000,
        //     easing: "easeInOutSine"
        // })

        anime({
            targets: [this.container, this.scrollbar.track],
            opacity: 0,
        })
        
        anime({
            targets: this.hoverColors,
            ...this.menuColors,
            opacity: 1,
            mix: 1,
            duration: 1000,
            easing: "easeInOutSine"
        })

        anime({
            targets: this.origin,
            x: this.width > this.height ? 1 : 0,
            y: this.width > this.height ? 0 : -1,
            size: this.width > this.height ? this.height : this.width / 1.29,
            range: 0.3,
            rotRange: 1,
            duration: 1500,
            delay: 0,
            easing:"easeInOutExpo"
        }).finished.then( () => {
            this.transition = false
        })


        anime.set('.burger-menu', {
            backgroundColor: "#00000000"
        })
    }

    menuClose(){
        this.canScroll = true
        this.transition = true
        this.inMenu = false

        this.impulses.opacity = 1

        anime({
            targets: this.hoverColors,
            ...this.menuColors,
            mix: 0,
            duration: 1000,
            easing: "easeInOutSine"
        })

        anime({
            targets: [this.container, this.scrollbar.track],
            opacity: 1,
        })

       anime({
            targets: this.origin,
            range:1,
            duration: 2000,
            easing: 'easeOutBounce'
        }).finished.then( () =>{
            this.transition = false
        })
    }

    monitorPerformance(delta){
        this.frames[this.frames.length] = delta
        if(this.frames.length >= 45){
           let total = this.frames.reduce((acc, val) => acc + val)
            if (total / 45 > 1 / 30 && this.pixelRatio > 0.8){
                let minus = total /45 > 1 / 15 ? 0.15 : 0.1
                this.pixelRatio =  this.pixelRatio - minus
                // anime.set(this.container, {
                //     translateY: 0
                // }) //conteract smoothscroll
                this.curtains.setPixelRatio(this.pixelRatio)
                this.threeD.setPixelRatio(this.pixelRatio)
            }

            if(this.pixelRatio < 0.85 && this.hasText){
                this.removeText()
            }

            //console.log(total / 45, 1 / 50, total / 45 < 1 / 50, this.pixelRatio, this.maxRatio)

            this.frames = []
        }
    }

    getDelta(){
        let delta = (performance.now() - this.lastFrame) / 1000
        delta = delta > 1.0 ? 1.0 : delta
        this.lastFrame = performance.now()
        this.monitorPerformance(delta)
        return delta
    }

    onScroll(e){
        if(this.canScroll){
            this.y = e? this.y - e.deltaY : this.y
            this.y = clamp(this.y, 0, this.contHeight - this.height)    
        }
    }

    onBar(y){
        this.y = y * (this.contHeight - this.height)
    }

    onRender(){
        if(this.rendering){
        // this.stats.begin()
        
        let delta = this.getDelta()
        //this.scroll.lastValue = this.scroll.value
       
        this.scroll.value = this.curtains.lerp(this.scroll.value, this.y, delta * 2.5)

        this.curtains.updateScrollValues(0, this.scroll.value)
        this.container.scrollTop = this.scroll.value

        this.ny = this.scroll.value / (this.contHeight - this.height)

        this.scrollbar && this.scrollbar.set(this.ny)
        this.timeline.seek(this.timeline.duration * this.ny)

        let mouseVal = this.pass.uniforms.mouse.value;

        //this.impulses.acceleration = THREE.MathUtils.damp(this.impulses.acceleration, 0.005, 1, delta)
        /// axes mixed with origin
        let ax = {
            ...this.axes,
            x: this.curtains.lerp(this.origin.x, this.axes.x, this.origin.range),
            y: this.curtains.lerp(this.origin.y, this.axes.y, this.origin.range),
            size: this.curtains.lerp(this.origin.size, this.axes.size, this.origin.range),
            range: this.curtains.lerp(this.origin.range, this.axes.range, this.origin.range),
            rotRange: this.curtains.lerp(this.origin.rotRange, this.axes.rotRange, this.origin.rotRange)
        }
        ///
        this.threeD.move(ax, this.mouse, delta)
        this.threeD.render()

        let mouseLerp = [this.curtains.lerp( mouseVal[0] ,this.mouse.x, delta * 3.125), this.curtains.lerp( mouseVal[1] ,this.mouse.y, delta * 3.125) ] 
        this.pass.uniforms.mouse.value = mouseLerp;
        this.pass.uniforms.time.value += delta * 50;

        //this.impulses.color = this.curtains.lerp(this.impulses.color, this.hoverColors.mix, delta * 3.15)
        let colAtarget = lerpRgba(rgbaToArray(this.colors.a), rgbaToArray(this.hoverColors.a), this.hoverColors.mix)
        let colBtarget = lerpRgba(rgbaToArray(this.colors.b), rgbaToArray(this.hoverColors.b), this.hoverColors.mix)
        let colCtarget = lerpRgba(rgbaToArray(this.colors.c), rgbaToArray(this.hoverColors.c), this.hoverColors.mix)
        let colDtarget = lerpRgba(rgbaToArray(this.colors.d), rgbaToArray(this.hoverColors.d), this.hoverColors.mix)
        let colOtarget = this.curtains.lerp(this.colors.opacity, this.hoverColors.opacity, this.hoverColors.mix)
        colOtarget = this.curtains.lerp(1.0, colOtarget, this.origin.range)

        this.pass.uniforms.colA.value = lerpRgba(this.pass.uniforms.colA.value, colAtarget, delta * 1.5)
        this.pass.uniforms.colB.value = lerpRgba(this.pass.uniforms.colB.value, colBtarget, delta * 1.5)
        this.pass.uniforms.colC.value = lerpRgba(this.pass.uniforms.colC.value, colCtarget, delta * 1.5)
        this.pass.uniforms.colD.value = lerpRgba(this.pass.uniforms.colD.value, colDtarget, delta * 1.5)
        this.pass.uniforms.gradientOpacity.value = this.curtains.lerp(this.pass.uniforms.gradientOpacity.value, colOtarget, delta * 1.5)
        this.pass.uniforms.morph.value = this.curtains.lerp(this.pass.uniforms.morph.value, ax.rotRange, delta *1.5)
        // this.pass.uniforms.morph.value = this.pass.uniforms.morph.value > 0.01 ? this.pass.uniforms.morph.value : 0
        this.pass.uniforms.opacity.value = this.curtains.lerp(this.pass.uniforms.opacity.value, this.impulses.opacity, delta *4)

        if(this.fadeIn && this.fadeOut){
            this.fadeIn.plane.uniforms.opacity.value = this.curtains.lerp(this.fadeIn.plane.uniforms.opacity.value, this.origin.range, delta * 4)
            this.fadeOut.plane.uniforms.opacity.value = this.curtains.lerp(this.fadeOut.plane.uniforms.opacity.value, 1.0 - this.origin.range, delta * 4)
        }

        this.loopSlider && this.loopSlider.update(delta)

        this.cards.forEach(c => {
            c.update(delta, this.mse)
        })

        // this.stats.end()
        }
    }

    mouseEvent(event){
        //event.preventDefault();
	    this.mouse.x = (event.clientX / this.width) * 2 - 1;
	    this.mouse.y = - (event.clientY / this.height) * 2 + 1;
        this.mse.x = event.clientX
        this.mse.y = event.clientY
    }
}

const onReady = async () => {

    let preloader = new Preloader()
    // let logo = new Logo()

    let rotation = 0
    document.querySelectorAll('[rotation]').forEach( (e) => {
        rotation = !isNaN(e.getAttribute('rotation')) ? e.getAttribute('rotation') : rotation
        if(e.getAttribute('rotation') == "order"){
            e.setAttribute('rotation', rotation >= 180 ? 0 : 180)
            rotation = e.getAttribute('rotation')
        }
    })

    copyToClipboard()

    document.querySelectorAll('[svg-embed]').forEach(e => {
        // let svg = parser.parseFromString(e.innerHTML, "image/svg+xml")
        let parent = e.parentElement
        parent.innerHTML = e.textContent
        let svg = parent.querySelector('svg')
        //svg.setAttribute('gl', '')
        svg.style.fill = "#fff"
        svg.style.width = '100%'
        svg.style.height = '100%'

    })


    if( document.querySelector('#scrolling-bar')){
    //logo loop 
    var outer = document.querySelector("#scrolling-bar");
    var content = outer.querySelector('#content');

    repeatContent(content, outer.offsetWidth);

    var el = outer.querySelector('#loop');
    el.innerHTML = el.innerHTML + el.innerHTML;

    function repeatContent(el, untill) {
    var html = el.innerHTML;
    var counter = 0; // prevents infinite loop

        while (el.offsetWidth < untill && counter < 100) {
        el.innerHTML += html;
        counter += 1;
        }
    }
    }

    let GPUTier = await getGPUTier()

    //GPUTier.tier = 0

    if(GPUTier.tier > 0){
    // create curtains instance
    const app = new App(GPUTier, preloader)
    app.init()
    scrollToId(app)
    }else{
       fallback()
       scrollToId()
    }
    
 }

if (document.readyState !== 'loading') {
  onReady()
} else {
  document.addEventListener('DOMContentLoaded', onReady)
}