import anime from "animejs"

scrollToId = (app) => {
    let container = document.querySelector('.scrolldom')



    if (container) {
        let slug = window.location.pathname
        console.log(slug, sessionStorage.getItem(`scroll-${slug}`))
        if(window.location.hash && document.querySelector(window.location.hash)){
            let target = document.querySelector(window.location.hash).offsetTop
            container.scrollTop = target
            if(app){
                app.y = target
            }
        }else if(sessionStorage.getItem(`scroll-${slug}`)){
            let target = sessionStorage.getItem(`scroll-${slug}`)
            if(app){
                app.y = target
            }
        }


      document.querySelectorAll("a[href^='\#']").forEach((e) => {
          let href = e.href.substring(e.href.lastIndexOf('#'))
          if(href.length === 1){
              e.addEventListener('click', () => {
                if(app){
                    app.y = 0
                }else{
                    anime({
                        targets: container,
                        scrollTop: 0,
                        duration: container.scrollTop / 2,
                        easing: 'easeInOutSine'
                    })
                }
              }) 
          }else if(document.querySelector(href)){
              e.addEventListener('click', () => {
                  let target = document.querySelector(href).offsetTop
                  if(app){
                    app.y = target
                    }else{

                  anime({
                      targets: container,
                      scrollTop: target,
                      duration: Math.abs(container.scrollTop -  target) / 2,
                      easing: 'easeInOutSine'
                  })
                }
              })
          }
      })
    }
  }


export default scrollToId