import {Curtains, Plane, RenderTarget, ShaderPass, TextureLoader} from 'curtainsjs';
import {TextTexture} from './TextTexture';
import imgFrag from './shaders/img.frag'
import textShader from './textShader';
import pageFrag from './shaders/page.frag';
import ThreeD from './3d';
import Slider from './slider';
import {hexToRgb }from './utils'

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
    }
    init(){
        // create curtains instance
        this.curtains = new Curtains({
            container: "canvas",
            pixelRatio: Math.min(1.5, window.devicePixelRatio)
        })

        this.curtains.onSuccess(this.onSuccess.bind(this))
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
                col1:{
                    name: "uCol1",
                    type: '4f',
                    value: [...hexToRgb("#F198C0"), 1.0],
                },
                col2:{
                    name: "uCol2",
                    type: '4f',
                    value: [...hexToRgb("#61FCC4"), 1.0],
                },
                col3:{
                    name: "uCol3",
                    type: '4f',
                    value: [...hexToRgb("#FFF"), 1.0],
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
    }

    onRender(){
        this.threeD.move()
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
    }

    loadImg(query, target, sampler){
        console.log(query)
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

    onScroll(){

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