import parseColor from 'parse-color';

const hexToRgb = hex =>
  hex.replace(/^#?([a-f\d])([a-f\d])([a-f\d])$/i
             ,(m, r, g, b) => '#' + r + r + g + g + b + b)
    .substring(1).match(/.{2}/g)
    .map(x => parseInt(x, 16) / 255)

const rgbaToArray = string => string.replace(/[^\d,]/g, '').split(',').map((x, i) => i < 3 ? parseInt(x) / 255 : parseInt(x))

const normX = (x) =>{
    return (x / window.innerWidth) * 2 - 1
}

function easeInExpo(x) {
    return x === 0 ? 0 : Math.pow(2, 10 * x - 10);
    }

function easeOutExpo(x) {
    return x === 1 ? 1 : 1 - Math.pow(2, -10 * x);
    }

const lerpRgba =  (col1, col2, factor = 0.5) => col1.map( (x, i) => x + factor*(col2[i]-x) )

const normY = (y) =>{
    return -(y/ window.innerHeight) * 2 + 1
}

const normCoord = (x, y) => {
    nx = normX(x)
    ny = normY(y)
    return { x: nx, y: ny}
}
const getCoord = (el) => {
    if(!el) return false
    let scrollDom = document.querySelector('.scrolldom')
    let rect = el.getBoundingClientRect()
    
    let keyframe = rect.top + rect.height / 2 + scrollDom.scrollTop - window.innerHeight / 2
    keyframe = keyframe < 0 ? 0 : keyframe
    let yoffset = el.getAttribute('yoffset') === 'bottom'
    keyframe =  !yoffset ? keyframe : rect.top + rect.height / 2 + scrollDom.scrollTop

    let scale = el.getAttribute('scale') ? el.getAttribute('scale') : 1
    let colora = el.getAttribute('colora') ? parseColor(el.getAttribute('colora')).hex : false
    let colorb = el.getAttribute('colorb') ? parseColor(el.getAttribute('colorb')).hex : false
    let colorc = el.getAttribute('colorc') ? parseColor(el.getAttribute('colorc')).hex : false
    let colord = el.getAttribute('colord') ? parseColor(el.getAttribute('colord')).hex : false
    let opacity = el.getAttribute('copacity') ? el.getAttribute('copacity') : false
    let rotation = el.getAttribute('rotation') ? parseInt(el.getAttribute('rotation') ): 0
    let stick = el.getAttribute('stick')
    let rotRange = el.getAttribute('rotrange') ? el.getAttribute('rotrange') : 1
    let easing = el.getAttribute('easing') ? el.getAttribute('easing') : 'easeInOutQuart'
    easing = yoffset ? 'easeInQuart' : easing
    rotRange = isNaN(rotRange) ? 1 : rotRange
    let range = isNaN(stick) ? 1 : 1 - stick


    let hcolora = el.getAttribute('hcolora') ? parseColor(el.getAttribute('hcolora')).hex : false
    let hcolorb = el.getAttribute('hcolorb') ? parseColor(el.getAttribute('hcolorb')).hex : false
    let hcolorc = el.getAttribute('hcolorc') ? parseColor(el.getAttribute('hcolorc')).hex : false
    let hcolord = el.getAttribute('hcolord') ? parseColor(el.getAttribute('hcolord')).hex : false
    let hopacity = el.getAttribute('hopacity') ? el.getAttribute('hopacity') : false

    return {
        x: normX(rect.x + rect.width / 2) - scrollDom.scrollLeft,
        y: el.getAttribute('yoffset') ? el.getAttribute('yoffset') === 'bottom' ? normY((rect.top + scrollDom.scrollTop + rect.height/2) - (scrollDom.scrollHeight - window.innerHeight) ) : normY(rect.top + rect.height/2 - keyframe) : 0,
        size: rect.width > rect.height ? rect.height * scale: rect.width * (scale /1.29),
        h: rect.height,
        w: rect.width,
        rotation: rotation,
        keyframe: keyframe,
        range: range,
        rotRange: rotRange,
        easing: easing,
        colors: {
          ...(colora && {a: colora}),
          ...(colorb && {b: colorb}),
          ...(colorc && {c: colorc}),
          ...(colord && {d: colord}),
          ...(opacity && {opacity: opacity}),
        },
        hoverColors: {
            ...(hcolora && {a: hcolora}),
            ...(hcolorb && {b: hcolorb}),
            ...(hcolorc && {c: hcolorc}),
            ...(hcolord && {d: hcolord}),
            ...(hopacity && {opacity: hopacity}),
          }
        //keyframed when the element y center is half way down the screen
    }
}

const map_range = (value, low1, high1, low2, high2) => {
    return low2 + ((high2 - low2) * (value - low1)) / (high1 - low1);
}
const clamp = (num, min, max) => Math.min(Math.max(num, min), max);

const mapClamp = (value, low1, high1, low2, high2) =>  clamp(map_range(value, low1, high1, low2, high2), low2, high2)

const decodeHtml = str => 
  str.replace(/(&#(\d+);)/g, (match, capture, charCode) => 
    String.fromCharCode(charCode));


export {hexToRgb, lerpRgba, rgbaToArray, normCoord,normX, normY, getCoord, mapClamp, easeInExpo, easeOutExpo, decodeHtml}