import {Curtains, Plane, RenderTarget, ShaderPass, TextureLoader} from 'curtainsjs';
import {TextTexture} from './TextTexture';
import sliderFrag from './shaders/slider.frag'
import sliderVert from './shaders/slider.vert'
import imgFrag from './shaders/img.frag'
import textShader from './textShader';
import pageFrag from './shaders/page.frag';
import ThreeD from './3d';
import {hexToRgb }from './utils'

//https://github.com/martinlaxenaire/curtainsjs/blob/master/examples/multiple-textures/js/multiple.textures.setup.js
const parceled = true

window.addEventListener('load', () => {
    // create curtains instance

    console.log('localhost')
    const curtains = new Curtains({
        container: "canvas",
        pixelRatio: Math.min(1.5, window.devicePixelRatio)
    });

    const sliderTarget = new RenderTarget(curtains) // create a new render target for our slider


    // track scroll values
    const scroll = {
        value: 0,
        lastValue: 0,
        effect: 0,
    };

     // get our plane element
    const planeElement = document.getElementById('slider');

    const threeD = new ThreeD()

        // here we will handle which texture is visible and the timer to transition between images
        const slideshowState = {
            activeTextureIndex: 1,
            nextTextureIndex: 2, // does not care for now
            maxTextures: planeElement.querySelectorAll("img").length - 1, // -1 because displacement image does not count
    
            isChanging: false,
            transitionTimer: 0,
        };
        // disable drawing for now
        //curtains.disableDrawing();

//////////////////////
            // some basic parameters
        const params = {
            vertexShader: sliderVert,
            fragmentShader: sliderFrag,
            uniforms: {
                transitionTimer: {
                    name: "uTransitionTimer",
                    type: "1f",
                    value: 0,
                },
            },
        };

        const sliderPlane = new Plane(curtains, planeElement, params);

        sliderPlane.setRenderTarget(sliderTarget)

        const sliderPass = new ShaderPass(curtains, {
            renderTarget: sliderTarget,
        }) // create a shaderPass from our slider rendertarget, so that our sliderPass can stack on top

        ////////////////////
    // on success
    curtains.onSuccess(() => {
        
        sliderPlane.onLoading((texture) => {
            // improve texture rendering on small screens with LINEAR_MIPMAP_NEAREST minFilter
            texture.setMinFilter(curtains.gl.LINEAR_MIPMAP_NEAREST);
        }).onReady(() => {
            // the idea here is to create two additionnal textures
            // the first one will contain our visible image
            // the second one will contain our entering (next) image
            // that way we will deal with only activeTex and nextTex samplers in the fragment shader
            // and we could easily add more images in the slideshow...
            const displacement = sliderPlane.createTexture({
                sampler: "displacement",
                fromTexture: sliderPlane.textures[0]
            });

            // first we set our very first image as the active texture
            const activeTex = sliderPlane.createTexture({
                sampler: "activeTex",
                fromTexture: sliderPlane.textures[slideshowState.activeTextureIndex]
            });
            // next we set the second image as next texture but this is not mandatory
            // as we will reset the next texture on slide change
            const nextTex = sliderPlane.createTexture({
                sampler: "nextTex",
                fromTexture: sliderPlane.textures[slideshowState.nextTextureIndex]
            });
    
            planeElement.addEventListener("click", () => {
                if(!slideshowState.isChanging) {
                    // enable drawing for now
                    //curtains.enableDrawing();
    
                    slideshowState.isChanging = true;
    
                    // check what will be next image
                    if(slideshowState.activeTextureIndex < slideshowState.maxTextures) {
                        slideshowState.nextTextureIndex = slideshowState.activeTextureIndex + 1;
                    }
                    else {
                        slideshowState.nextTextureIndex = 1;
                    }
                    // apply it to our next texture
                    nextTex.setSource(sliderPlane.images[slideshowState.nextTextureIndex]);
    
                    setTimeout(() => {
                        // disable drawing now that the transition is over
                        //curtains.disableDrawing();
    
                        slideshowState.isChanging = false;
                        slideshowState.activeTextureIndex = slideshowState.nextTextureIndex;
                        // our next texture becomes our active texture
                        activeTex.setSource(sliderPlane.images[slideshowState.activeTextureIndex]);
                        // reset timer
                        slideshowState.transitionTimer = 0;
    
                    }, 1700); // add a bit of margin to the timer
                }
    
            });
            
        })
        
        sliderPlane.onRender(() => {
            // increase or decrease our timer based on the active texture value
            if(slideshowState.isChanging) {
                // use damping to smoothen transition
                slideshowState.transitionTimer += (90 - slideshowState.transitionTimer) * 0.04;
    
                // force end of animation as damping is slower the closer we get from the end value
                if(slideshowState.transitionTimer >= 88.5 && slideshowState.transitionTimer !== 90) {
                    slideshowState.transitionTimer = 90;
                }
            }
    
            // update our transition timer uniform
            sliderPlane.uniforms.transitionTimer.value = slideshowState.transitionTimer;
        });


        ///// this is our scroll code

        const fonts = {
            list: [
                'normal 400 1em "Archivo Black", sans-serif',
                'normal 300 1em "Merriweather Sans", sans-serif',
            ],
            loaded: 0
        };

        // load the fonts first
        fonts.list.forEach(font => {
            document.fonts.load(font).then(() => {
                fonts.loaded++;

                if(fonts.loaded === fonts.list.length) {
                

                    // create our text planes
                    const textEls = document.querySelectorAll('[text]');

                    textEls.forEach(textEl => {
                        
                        
                        const textPlane = new Plane(curtains, textEl, {
                            vertexShader: textShader.vs,
                            fragmentShader: textShader.fs
                        });

                        // create the text texture and... that's it!
                        const textTexture = new TextTexture({
                            plane: textPlane,
                            textElement: textPlane.htmlElement,
                            sampler: "uTexture",
                            resolution: 1.5,
                            skipFontLoading: true, // we've already loaded the fonts
                        });

                        textEl.style.color = "#ff000000"
                    });

                    const puckTarget = new RenderTarget(curtains)
                    const bgTarget = new RenderTarget(curtains)


                    //our img elements that will be in the puck & outside of it
                    const imgs = document.querySelectorAll('img[gl]')
                    // images that will be outside the puck
                    const bgImgs = document.querySelectorAll('img[bg]')
                    //images that will be inside the puck
                    const puckImgs = document.querySelectorAll('img[puck]')

                    const loader = new TextureLoader(curtains)
                   

                    imgs.forEach((el) => {
                      const plane = new Plane(curtains, el, {
                        vertexShader: textShader.vs,
                        fragmentShader: imgFrag,
                      })
                      plane.loadImage(el, { sampler: 'uTexture' })
                      el.style.opacity = 0
                    })

                    puckImgs.forEach((el) => {
                      const plane = new Plane(curtains, el, {
                        vertexShader: textShader.vs,
                        fragmentShader: imgFrag,
                      })

                      plane.loadImage(el, { sampler: 'uTexture' })
                      plane.setRenderTarget(puckTarget)
                      el.style.opacity = 0
                    })

                    bgImgs.forEach((el) => {
                        const plane = new Plane(curtains, el, {
                          vertexShader: textShader.vs,
                          fragmentShader: imgFrag,
                        })
  
                        plane.loadImage(el, { sampler: 'uTexture' })
                        plane.setRenderTarget(bgTarget)
                        el.style.opacity = 0
                      })


                    // hide gradient
                    document.getElementById('gradient').style.display = 'none';


                    threeD.loadGlb().then(() => { //wait for our glbs to load
                                            // create our shader pass
                            const scrollPass = new ShaderPass(curtains, {
                                fragmentShader: pageFrag,
                                depth: false,
                                uniforms: {
                                    scrollEffect: {
                                        name: "uScrollEffect",
                                        type: "1f",
                                        value: scroll.effect,
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
                            });

                        scrollPass.loadCanvas(threeD.canvas) // creates a texture from our three.js canvas
                        
                        scrollPass.createTexture({
                            sampler: "uPuck",
                            fromTexture: puckTarget.getTexture()
                        })

                        scrollPass.createTexture({
                            sampler: "uBg",
                            fromTexture: bgTarget.getTexture()
                        })

                        // calculate the lerped scroll effect

                        let mouseLast = [0.5,0.5];
                        scrollPass.onRender(() => {
                            threeD.move()
                            threeD.render()
                            scroll.lastValue = scroll.value;
                            scroll.value = curtains.getScrollValues().y;
                            
    
                            // clamp delta
                            scroll.delta = Math.max(-30, Math.min(30, scroll.lastValue - scroll.value));
    
                            scroll.effect = curtains.lerp(scroll.effect, scroll.delta, 0.05);
                            scrollPass.uniforms.scrollEffect.value = scroll.effect;

                            mouseVal = scrollPass.uniforms.mouse.value;

                            let mouseLerp = [curtains.lerp( mouseVal[0] ,threeD.mouse.x, 0.05), curtains.lerp( mouseVal[1] ,threeD.mouse.y, 0.05) ] 
                            scrollPass.uniforms.mouse.value = mouseLerp;
                            scrollPass.uniforms.time.value += 1;
                        });
                    })   
                }
            })
        })
    });
});