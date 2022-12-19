import anime from "animejs"
import FallbackSlider from "./fallbackSlider"

export default fallback = ()=> {

    document.querySelectorAll('.casestudy-img-wrapper').forEach( (e, i) =>{
        let evenPath = "M0.404,0.006 c0.387,0.052,0.582,0.279,0.594,0.385 c0.031,0.169,-0.276,0.393,-0.373,0.461 c-0.098,0.068,-0.339,0.207,-0.499,0.122 C-0.002,0.907,-0.008,0.627,0.005,0.495 C0.036,0.313,0.031,-0.044,0.404,0.006"
        let oddPath ="M0.996,0.495 C1,0.627,1,0.907,0.875,0.975 c-0.16,0.084,-0.401,-0.054,-0.499,-0.122 c-0.098,-0.068,-0.404,-0.293,-0.373,-0.461 C0.015,0.285,0.21,0.058,0.597,0.006 C0.97,-0.044,0.965,0.313,0.996,0.495" 
        let svgpath = 'http://www.w3.org/2000/svg'
        // if(i < 2){


            let svg = document.createElementNS(svgpath, 'svg')
            svg.setAttributeNS(null, 'viewBox', "0 0 882 753")
            svg.style.position = 'absolute'
            svg.style.width = '100%'
            svg.setAttribute( 'preserveAspectRatio', "xMidYMid meet")
            svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
    
            let clipPath = document.createElementNS(svgpath, 'clipPath')
            clipPath.setAttributeNS(null, 'id', `clipper${i}`)
            clipPath.setAttributeNS(null, 'clipPathUnits', `objectBoundingBox`)
            let path = document.createElementNS(svgpath, 'path')
            path.setAttributeNS(null, 'd', i % 2 == 0 ? evenPath : oddPath)
            clipPath.appendChild(path)
            svg.appendChild(clipPath)
            e.appendChild(svg);
            // }
        
            let div = document.createElement('div')
            div.style.position ='absolute'
             div.style.width = '100%'
            div.style.aspectRatio = 1.17
            div.style.clipPath = `url(#clipper${i % 2 == 0 ? 0 : 1})`
           e.querySelector('img').style.aspectRatio = 1.17
            div.appendChild(e.querySelector('img'))
            e.appendChild(div)
    })


    anime({
        targets: '#preloader',
        opacity: 0,
        duration: 2000,
        delay: 500,
        easing: 'easeInSine',

    }).finished.then(() => {
        anime.set('#preloader', {
            display: 'none'
        })
    })

    const slider =  document.getElementById('slider') ?  new FallbackSlider(document.getElementById('slider'), document.getElementById('slider-dom'), document.getElementById('slider-trigger')) : false
    slider && slider.init()
    document.querySelectorAll('.section:not(:first-child)').forEach((e)=> {
        e.style.backgroundColor = "#040707"
    })
    document.querySelectorAll('[bg]').forEach( e => e.style.opacity = 0)
}