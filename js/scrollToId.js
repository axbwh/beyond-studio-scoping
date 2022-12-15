import anime from "animejs"

scrollToId = () => {
    let container = document.querySelector('.scrolldom')
    if (container) {
      document.querySelectorAll("a[href^='\#']").forEach((e) => {
          let href = e.href.substring(e.href.lastIndexOf('#'))
          if(href.length === 1){
              e.addEventListener('click', () => {
                  anime({
                      targets: container,
                      scrollTop: 0,
                      duration: container.scrollTop / 2,
                      easing: 'easeInOutSine'
                  })
              }) 
          }else if(document.querySelector(href)){
              e.addEventListener('click', () => {
                  let target = document.querySelector(href).offsetTop
                  anime({
                      targets: container,
                      scrollTop: target,
                      duration: Math.abs(container.scrollTop -  target) / 2,
                      easing: 'easeInOutSine'
                  })
              })
          }
      })
    }
  }


export default scrollToId