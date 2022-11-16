import {Curtains, Plane, RenderTarget, ShaderPass, TextureLoader} from 'curtainsjs';
import {TextTexture} from './TextTexture';
import imgFrag from './shaders/img.frag'
import textShader from './textShader';
import pageFrag from './shaders/page.frag';
import ThreeD from './3d';
import Slider from './slider';
import {hexToRgb, getCoord, rgbaToArray }from './utils'
import anime from 'animejs';
import _ from 'lodash';

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
        this.threeD = new ThreeD()
        this.axes = {
            range: 0,
            x: 0,
            y: 0,
            size: 0,
        }

        this.colors = {
            a: '#F198C0',
            b: "#61FCC4",
            c: '#F198C0',
            d: "#61FCC4",
            opacity: 0,
        }


    }

    init(){
        // create curtains instance
        this.curtains = new Curtains({
            container: "canvas",
            pixelRatio: Math.min(1.5, window.devicePixelRatio)
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

        let frames = [...document.querySelectorAll('[stick]')].map(el => {
            return {el: el, coord: getCoord(el)}
        })

        let colorFrames = [...document.querySelectorAll('[colora], [colorb], [colorc], [colord], [opacity]')].map(el =>{
            return {el:el, coord: getCoord(el)}
        })

        this.axes = {
            range: frames[0].coord.range,
            x: frames[0].coord.x,
            y: frames[0].coord.y,
            size: frames[0].coord.size
        }


        let timeline = anime.timeline({
            targets: this.axes,
            easing: "linear",
            autoplay:false,
            loop: false
        })

        frames.forEach((frame, index)=>{
            let previousTime = index > 0 ? frames[index - 1].coord.keyframe : 0
            let duration = index > 0 ? frame.coord.keyframe - frames[index - 1].coord.keyframe : 0.00001
            timeline.add({
                range: frame.coord.range,
                x: frame.coord.x,
                y: frame.coord.y,
                size: frame.coord.size,
                duration: duration,
                easing: 'easeInOutSine'
            }, previousTime)
        })

        timeline.add({
            duration: 0.00001
        }, document.body.offsetHeight - window.innerHeight - 0.00001)

        colorFrames.forEach( (frame, index) => {
            let previousTime = index > 0 ? frames[index - 1].coord.keyframe : 0
            let duration = index > 0 ? frame.coord.keyframe - frames[index - 1].coord.keyframe : 0.00001
            timeline.add({
                targets: this.colors,
                ...frame.coord.colors,
                duration: duration,
            }, previousTime)
        })

        this.timeline = timeline
        this.onScroll()
    }

    onScroll(){
            let y = window.scrollY / (document.body.offsetHeight - window.innerHeight)
            this.timeline.seek(this.timeline.duration * y)

            console.log(rgbaToArray(this.colors.a))
    }

    onSuccess(){
        this.slider = new Slider(this.curtains, document.getElementById('slider'))
        this.initText()

        this.puckTarget = new RenderTarget(this.curtains)
        this.bgTarget = new RenderTarget(this.curtains)
        this.imgTarget = new RenderTarget(this.curtains)

        Promise.all([
            document.fonts.load('normal 400 1em "Archivo Black", sans-serif'),
            document.fonts.load('normal 300 1em "Merriweather Sans", sans-serif'),
            this.threeD.loadGlb()
        ]).then(this.onLoaded.bind(this))
    }

    onLoaded(){
        this.initTimeline()

        this.slider.init()
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
                gradientOpacity:{
                    name: 'uGradientOpacity',
                    type: '1f',
                    value: 0,
                }
            }
        })

        this.pass.loadCanvas(this.threeD.canvas)

        //our img elements that will be in the puck & outside of it
        this.loadImg('img[gl]', this.puckTarget, 'uImg')
        // images that will be outside the puck
        this.loadImg('img[bg]', this.bgTarget, 'uBg')
        //images that will be inside the puck
        this.loadImg('img[puck]', this.imgTarget, 'uPuck')

        // hide gradient
        document.getElementById('gradient').style.display = 'none';

        this.pass.onRender(this.onRender.bind(this))

        let _scroll = _.throttle(this.onScroll.bind(this), 10 ,{
            trailing: true,
            leading: true,
        })


       window.addEventListener("scroll", _scroll.bind(this));
    }

    onRender(){
        this.threeD.move(this.axes)
        this.threeD.render()

        this.scroll.lastValue = this.scroll.value;
        this.scroll.value = this.curtains.getScrollValues().y;
        

        // clamp delta
        this.scroll.delta = Math.max(-30, Math.min(30, this.scroll.lastValue - this.scroll.value));

        this.scroll.effect = this.curtains.lerp(this.scroll.effect, this.scroll.delta, 0.05);
        this.pass.uniforms.scrollEffect.value = this.scroll.effect;

        let mouseVal = this.pass.uniforms.mouse.value;

        let mouseLerp = [this.curtains.lerp( mouseVal[0] ,this.threeD.mouse.x, 0.05), this.curtains.lerp( mouseVal[1] ,this.threeD.mouse.y, 0.05) ] 
        this.pass.uniforms.mouse.value = mouseLerp;
        this.pass.uniforms.time.value += 1;

        this.pass.uniforms.colA.value = rgbaToArray(this.colors.a)
        this.pass.uniforms.colB.value = rgbaToArray(this.colors.b)
        this.pass.uniforms.colC.value = rgbaToArray(this.colors.c)
        this.pass.uniforms.colD.value = rgbaToArray(this.colors.d)
        this.pass.uniforms.gradientOpacity.value = this.colors.opacity
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

    initText(){
        const textEls = document.querySelectorAll('[text]')
        textEls.forEach(textEl => {            
            const textPlane = new Plane(this.curtains, textEl, {
                vertexShader: textShader.vs,
                fragmentShader: textShader.fs
            })
            // create the text texture and... that's it!
            const textTexture = new TextTexture({
                plane: textPlane,
                textElement: textPlane.htmlElement,
                sampler: "uTexture",
                resolution: 1.5,
                skipFontLoading: true, // we've already loaded the fonts
            })
            textEl.style.color = "#ff000000"//make text invisible bhut still highlightable
        })
    }


    
    onMove(event){
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