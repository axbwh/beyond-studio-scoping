import {Curtains, Plane, RenderTarget, ShaderPass, TextureLoader} from 'curtainsjs';
import {TextTexture} from './TextTexture';
import imgFrag from './shaders/img.frag'
import textShader from './textShader';
import pageFrag from './shaders/page.frag';
import ThreeD from './3d';
import Slider from './slider';
import HoverSlider from './hoverSlider';
import {hexToRgb, getCoord, rgbaToArray, lerpRgba }from './utils'
import anime from 'animejs';
import _, { delay } from 'lodash';
import * as THREE from 'three'

//https://github.com/martinlaxenaire/curtainsjs/blob/master/examples/multiple-textures/js/multiple.textures.setup.js
const parceled = true



class App {
    constructor(){
        this.mouse = { x : 0.5, y: 0.5}
        // track scroll values
        this.scroll = {
            value: 0,
            lastValue: 0,
            effect: 0,
        }
        
        this.axes = {
            range: 0,
            x: 0,
            y: 0,
            size: 0,
            rotation: 0,
        }

        this.origin = {
            x: 0,
            y: 0,
            rotation: 0,
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

        this.impulses = {
            acceleration: 0.005,
            rotation: 0,
            morph: 0,
        }

        this.lastFrame = 0

        this.frames = []
        this.pixelRatio = Math.min(1, window.devicePixelRatio)

        this.threeD = new ThreeD(this.pixelRatio)

    }

    init(){
        // create curtains instance
        this.curtains = new Curtains({
            container: "canvas",
            pixelRatio: this.pixelRatio
        })

        this.curtains.onSuccess(this.onSuccess.bind(this))
        this.curtains.onError(this.onError.bind(this))
    }

    onError(){
        document.querySelectorAll('img[puck]').forEach((el)=>{
            el.style.display = "none"
        })
    }

    initTimeline(){

        let origin =  getCoord(document.querySelector('[origin]'))

        this.origin = origin ? {
            x: origin.x,
            y: origin.y,
            size: origin.size,
            rotation: origin.rotation,
            range: this.origin.range,
            intro: this.origin.intro,
        } : this.origin

        let frames = [...document.querySelectorAll('[stick]')].map(el => {
            return {el: el, coord: getCoord(el)}
        })

        let colorFrames = [...document.querySelectorAll('[colora], [colorb], [colorc], [colord], [opacity]')].map(el =>{
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
            rotation: frames[0].coord.rotation
        } : this.axes

        colorFrames.length > 0 && colorFrames.slice().reverse().forEach(f =>{
            this.colors = {
                ...this.colors,
                ...f.coord.colors
            }
        }) // iterate backwards through array to reset colors to first value



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
                duration: duration,
                easing: 'easeInOutSine'
            }, previousTime)
        })

        timeline.add({
            duration: 0.00001
        }, document.body.offsetHeight - window.innerHeight - 0.00001)


        anime.set(this.colors, {
            ...this.colors
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
        this.onScroll()

        anime.set( this.hoverColors, {
            ...this.hoverColors,
        })

    }

    
    initText(target){

        const textEls = document.querySelectorAll('[text]')
        textEls.forEach(textEl => {            
            const plane = new Plane(this.curtains, textEl, {
                vertexShader: textShader.vs,
                fragmentShader: textShader.fs
            })
            // create the text texture and... that's it!
            const textTexture = new TextTexture({
                plane: plane,
                textElement: plane.htmlElement,
                sampler: "uTexture",
                resolution: 1,
                skipFontLoading: true, // we've already loaded the fonts
            })

            plane.setRenderTarget(target)
            textEl.style.color = "#ff000000"//make text invisible bhut still highlightable
        })

        this.pass.createTexture({
            sampler: 'uTxt',
            fromTexture: target.getTexture()
        })
    }


    onScroll(){
            let y = window.scrollY / (document.body.offsetHeight - window.innerHeight)
            this.timeline.seek(this.timeline.duration * y)
    }
    onResize(){
        this.initTimeline()

    }

    onSuccess(){
        
        this.slider = document.getElementById('slider') ?  new Slider(this.curtains, document.getElementById('slider'), document.getElementById('slider-dom'), document.getElementById('slider-trigger')) : false
        this.hoverSlider = document.getElementById('hover-slider') ? new HoverSlider(this.curtains, document.getElementById('hover-slider'), document.getElementById('hover-slider-trigger')) : false
        this.puckTarget = new RenderTarget(this.curtains)
        this.bgTarget = new RenderTarget(this.curtains)
        this.imgTarget = new RenderTarget(this.curtains)
        this.textTarget = new RenderTarget(this.curtains)


        Promise.all([
            document.fonts.load('300 1.375em "Atosmose", sans-serif'),
            document.fonts.load('200 1em "Atosmose", sans-serif'),
            document.fonts.load('400 1em "Outfit", sans-serif'),
            this.threeD.loadGlb()
        ]).then(this.onLoaded.bind(this))

        
    }

    onLoaded(){
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
                    value: [...hexToRgb("#0F1212"), 1.0],
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
                }
            }
        })

        this.pass.loadCanvas(this.threeD.canvas)
        this.initText(this.textTarget)
        //our img elements that will be in the puck & outside of it
        this.loadImg('img[gl]', this.imgTarget, 'uImg')
        // images that will be outside the puck
        this.loadImg('img[bg]', this.bgTarget, 'uBg')
        //images that will be inside the puck
        this.loadImg('img[puck]', this.puckTarget, 'uPuck')

        this.slider && this.slider.init(this.puckTarget, () =>  this.onFlip(this.impulses) )

        this.hoverSlider && this.hoverSlider.init(this.puckTarget, () =>  this.onFlip(this.impulses) )
  

        this.pass.onRender(this.onRender.bind(this))

        let _mouse = _.throttle(this.mouseEvent.bind(this), 10 ,{
            trailing: true,
            leading: true,
        })

        let _scroll = _.throttle(this.onScroll.bind(this), 10 ,{
            trailing: true,
            leading: true,
        })


       window.addEventListener("scroll", _scroll.bind(this));
       document.addEventListener('mousemove', _mouse.bind(this), false);


       this.curtains.onAfterResize(this.onResize.bind(this))
       this.threeD.setPos(this.origin)

       document.addEventListener('click', this.startAnim.bind(this))
       window.addEventListener("scroll", this.startAnim.bind(this))
        //this.loadAnim()

        this.colorTriggers.length > 0 && this.colorTriggers.forEach((e) => {
            e.el.addEventListener('mouseenter', ()=> {
                anime.set( this.hoverColors, {
                    ...this.hoverColors,
                    ...e.coord.hoverColors,
                    mix: 1
                })

               e.el.addEventListener('mouseleave', ()=>{
                this.hoverColors.mix = 0
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
       
    }

    startAnim(){
        if(!this.origin.loaded){
            anime({
                targets: this.origin,
                range: 1,
                duration: 2000,
                easing: 'easeOutBounce',
                delay: 0,
               })
               this.origin.loaded = true
               document.removeEventListener('click', this.startAnim.bind(this))
               window.removeEventListener("scroll", this.startAnim.bind(this))
        }
    }

    onFlip(impulses){
        impulses.rotation += 180;
    }

    monitorPerformance(delta){
        this.frames[this.frames.length] = delta
        if(this.frames.length >= 45){
           let total = this.frames.reduce((acc, val) => acc + val)
            console.log(total, total/45, 1 / 30, this.pixelRatio)
            if (total / 45 > 1 / 30 && this.pixelRatio > 0.65){
                this.pixelRatio =  this.pixelRatio - 0.075
                this.curtains.renderingScale = this.pixelRatio
                this.threeD.setPixelRatio(this.pixelRatio)
            }
            this.frames = []
        }
    }

    getDelta(){
        let delta = (performance.now() - this.lastFrame) / 1000
        delta = delta > 0.5 ? 0.5 : delta
        this.lastFrame = performance.now()
        this.monitorPerformance(delta)
        return delta
    }

    onRender(){

        let delta = this.getDelta()

        this.scroll.lastValue = this.scroll.value;
        this.scroll.value = this.curtains.getScrollValues().y;
        

        // clamp delta
        this.scroll.delta = Math.max(-17.5, Math.min(17.5, this.scroll.lastValue - this.scroll.value));

        this.scroll.effect = this.curtains.lerp(this.scroll.effect, this.scroll.delta, delta);
        this.pass.uniforms.scrollEffect.value = this.scroll.effect;


        anime.set('.section', {
            translateY: `${-this.scroll.effect}vh`
        }) //smoothscroll


        let mouseVal = this.pass.uniforms.mouse.value;

        //this.impulses.acceleration = THREE.MathUtils.damp(this.impulses.acceleration, 0.005, 1, delta)
        /// axes mixed with origin
        let ax = {
            ...this.axes,
            x: this.curtains.lerp(this.origin.x, this.axes.x, this.origin.range),
            y: this.curtains.lerp(this.origin.y, this.axes.y, this.origin.range),
            size: this.curtains.lerp(this.origin.size, this.axes.size, this.origin.range),
            range: this.curtains.lerp(this.origin.range, this.axes.range, this.origin.range),
        }
        ///
        this.threeD.move(ax, this.mouse, this.impulses.rotation, delta)
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

        this.pass.uniforms.colA.value = lerpRgba(this.pass.uniforms.colA.value, colAtarget, delta * 1.5)
        this.pass.uniforms.colB.value = lerpRgba(this.pass.uniforms.colB.value, colBtarget, delta * 1.5)
        this.pass.uniforms.colC.value = lerpRgba(this.pass.uniforms.colC.value, colCtarget, delta * 1.5)
        this.pass.uniforms.colD.value = lerpRgba(this.pass.uniforms.colD.value, colDtarget, delta * 1.5)
        this.pass.uniforms.gradientOpacity.value = this.curtains.lerp(this.pass.uniforms.gradientOpacity.value, colOtarget, delta * 1.5)
        this.pass.uniforms.morph.value = this.curtains.lerp(this.pass.uniforms.morph.value, this.impulses.morph, delta *1.5)
    }

    loadImg(query, target, sampler){
        const imgs = document.querySelectorAll(query)
        imgs.forEach((el) => {
            const plane = new Plane(this.curtains, el, {
              vertexShader: textShader.vs,
              fragmentShader: imgFrag,
            })
            plane.loadImage(el, { sampler: 'uTexture' })
            plane.setRenderTarget(target)
            el.style.opacity = 0
          })

        this.pass.createTexture({
            sampler: sampler,
            fromTexture: target.getTexture(),
        })
    }

    mouseEvent(event){
        //event.preventDefault();
	    this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
	    this.mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;
    }

}

window.addEventListener('load', () => {
    // create curtains instance
    const app = new App()
    app.init()
});