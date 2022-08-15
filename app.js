import {Curtains, Plane, RenderTarget, PingPongPlane, ShaderPass} from 'curtainsjs';
import {TextTexture} from './TextTexture';
import sliderShader from './sliderShader';
import textShader from './textShader';

//https://github.com/martinlaxenaire/curtainsjs/blob/master/examples/multiple-textures/js/multiple.textures.setup.js

const scrollFs = `
    #ifdef GL_FRAGMENT_PRECISION_HIGH
    precision highp float;
    #else
    precision mediump float;
    #endif

    varying vec3 vVertexPosition;
    varying vec2 vTextureCoord;

    uniform sampler2D uRenderTexture;

    // lerped scroll deltas
    // negative when scrolling down, positive when scrolling up
    uniform float uScrollEffect;

    // default to 2.5
    uniform float uScrollStrength;


    void main() {
        vec2 scrollTextCoords = vTextureCoord;
        float horizontalStretch;

        // branching on an uniform is ok
        if(uScrollEffect >= 0.0) {
            scrollTextCoords.y *= 1.0 + -uScrollEffect * 0.00625 * uScrollStrength;
            horizontalStretch = sin(scrollTextCoords.y);
        }
        else if(uScrollEffect < 0.0) {
            scrollTextCoords.y += (scrollTextCoords.y - 1.0) * uScrollEffect * 0.00625 * uScrollStrength;
            horizontalStretch = sin(-1.0 * (1.0 - scrollTextCoords.y));
        }

        scrollTextCoords.x = scrollTextCoords.x * 2.0 - 1.0;
        scrollTextCoords.x *= 1.0 + uScrollEffect * 0.0035 * horizontalStretch * uScrollStrength;
        scrollTextCoords.x = (scrollTextCoords.x + 1.0) * 0.5;

        gl_FragColor = texture2D(uRenderTexture, scrollTextCoords);
    }
`;

window.addEventListener('load', () => {
    // create curtains instance
    const curtains = new Curtains({
        container: "canvas",
        pixelRatio: Math.min(1.5, window.devicePixelRatio)
    });
    const sliderTarget = new RenderTarget(curtains);

    // track scroll values
    const scroll = {
        value: 0,
        lastValue: 0,
        effect: 0,
    };

     // get our plane element
    const planeElement = document.getElementById('slider');
    const canvasElement = document.getElementById('canvas');

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
            vertexShader: sliderShader.vs,
            fragmentShader: sliderShader.fs,
            uniforms: {
                transitionTimer: {
                    name: "uTransitionTimer",
                    type: "1f",
                    value: 0,
                },
            },
        };

        const multiTexturesPlane = new Plane(curtains, planeElement, params);

        multiTexturesPlane.setRenderTarget(sliderTarget) 

        ////////////////////
    // on success
    curtains.onSuccess(() => {
        const fonts = {
            list: [
                'normal 400 1em "Archivo Black", sans-serif',
                'normal 300 1em "Merriweather Sans", sans-serif',
            ],
            loaded: 0
        };

        
        multiTexturesPlane.onLoading((texture) => {
            // improve texture rendering on small screens with LINEAR_MIPMAP_NEAREST minFilter
            texture.setMinFilter(curtains.gl.LINEAR_MIPMAP_NEAREST);
        }).onReady(() => {
            // the idea here is to create two additionnal textures
            // the first one will contain our visible image
            // the second one will contain our entering (next) image
            // that way we will deal with only activeTex and nextTex samplers in the fragment shader
            // and we could easily add more images in the slideshow...
            const displacement = multiTexturesPlane.createTexture({
                sampler: "displacement",
                fromTexture: multiTexturesPlane.textures[0]
            });

            // first we set our very first image as the active texture
            const activeTex = multiTexturesPlane.createTexture({
                sampler: "activeTex",
                fromTexture: multiTexturesPlane.textures[slideshowState.activeTextureIndex]
            });
            // next we set the second image as next texture but this is not mandatory
            // as we will reset the next texture on slide change
            const nextTex = multiTexturesPlane.createTexture({
                sampler: "nextTex",
                fromTexture: multiTexturesPlane.textures[slideshowState.nextTextureIndex]
            });
    
            planeElement.addEventListener("click", () => {
                console.log('click baby')
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
                    nextTex.setSource(multiTexturesPlane.images[slideshowState.nextTextureIndex]);
    
                    setTimeout(() => {
                        // disable drawing now that the transition is over
                        //curtains.disableDrawing();
    
                        slideshowState.isChanging = false;
                        slideshowState.activeTextureIndex = slideshowState.nextTextureIndex;
                        // our next texture becomes our active texture
                        activeTex.setSource(multiTexturesPlane.images[slideshowState.activeTextureIndex]);
                        // reset timer
                        slideshowState.transitionTimer = 0;
    
                    }, 1700); // add a bit of margin to the timer
                }
    
            });
            
        })
        
        multiTexturesPlane.onRender(() => {
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
            multiTexturesPlane.uniforms.transitionTimer.value = slideshowState.transitionTimer;
        });

        // const plane = new Plane(curtains, planeElement);


        const sliderPass = new ShaderPass(curtains, {
            renderTarget: sliderTarget,
        })

        // load the fonts first
        fonts.list.forEach(font => {
            document.fonts.load(font).then(() => {
                fonts.loaded++;

                if(fonts.loaded === fonts.list.length) {

                    // create our shader pass
                    const scrollPass = new ShaderPass(curtains, {
                        fragmentShader: scrollFs,
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
                        }
                    });

                    // calculate the lerped scroll effect
                    scrollPass.onRender(() => {
                        scroll.lastValue = scroll.value;
                        scroll.value = curtains.getScrollValues().y;

                        // clamp delta
                        scroll.delta = Math.max(-30, Math.min(30, scroll.lastValue - scroll.value));

                        scroll.effect = curtains.lerp(scroll.effect, scroll.delta, 0.05);
                        scrollPass.uniforms.scrollEffect.value = scroll.effect;
                    });
                    

                    // create our text planes
                    const textEls = document.querySelectorAll('.text-plane');
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
                    });
                    
                }
            })
        })
    });
});