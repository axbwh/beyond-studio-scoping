const hexToRgb = hex =>
  hex.replace(/^#?([a-f\d])([a-f\d])([a-f\d])$/i
             ,(m, r, g, b) => '#' + r + r + g + g + b + b)
    .substring(1).match(/.{2}/g)
    .map(x => parseInt(x, 16) / 255)

const rgbaToArray = string => string.replace(/[^\d,]/g, '').split(',').map((x, i) => i < 3 ? parseInt(x) / 255 : parseInt(x))

const normX = (x) =>{
    return (x / window.innerWidth) * 2 - 1
}

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
    let rect = el.getBoundingClientRect()
    let keyframe = rect.top + rect.height / 2 + window.scrollY - window.innerHeight / 2
    keyframe = keyframe < 0 ? 0 : keyframe;
    let stick = el.getAttribute('stick')
    let scale = el.getAttribute('scale') ? el.getAttribute('scale') : 1
    let colora = el.getAttribute('colora') ? el.getAttribute('colora') : false
    let colorb = el.getAttribute('colorb') ? el.getAttribute('colorb') : false
    let colorc = el.getAttribute('colorc') ? el.getAttribute('colorc') : false
    let colord = el.getAttribute('colord') ? el.getAttribute('colord') : false
    let opacity = el.getAttribute('opacity') ? el.getAttribute('opacity') : false
    let rotation = el.getAttribute('rotation') ? parseInt(el.getAttribute('rotation') ): 0
    let range = isNaN(stick) ? 1 : 1 - stick

    return {
        x: normX(rect.x + rect.width / 2) - window.scrollX,
        y: el.getAttribute('yoffset') ? normY(el.offsetTop + rect.height/2 + el.parentElement.offsetTop) : 0,
        size: rect.width > rect.height ? rect.height * scale: rect.width * scale,
        h: rect.height,
        w: rect.width,
        rotation: rotation,
        keyframe: keyframe,
        range: range,
        colors: {
          ...(colora && {a: colora}),
          ...(colorb && {b: colorb}),
          ...(colorc && {c: colorc}),
          ...(colord && {d: colord}),
          ...(opacity && {opacity: opacity}),
        }
        //keyframed when the element y center is half way down the screen
    }
}


export {hexToRgb, rgbaToArray, normCoord,normX, normY, getCoord}