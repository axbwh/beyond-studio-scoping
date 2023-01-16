import anime from "animejs"
import { clamp } from "lodash"

class ScrollBar {
    constructor(container, app){
        this.track = document.body.appendChild( document.createElement('div'))
        this.tab = this.track.appendChild(document.createElement('div'))
        this.app = app

        this.track.style.position = 'fixed'
        this.track.style.top = 0
        this.track.style.right= 0
        this.track.style.height = '100vh'
        this.track.style.width = '0.5vw'
        this.track.style.background = '#040707'
        this.track.style.zIndex = '997'

        this.track.classList.add('scroll-track')
    

        this.container = container

        this.tabHeight = (window.innerHeight / (this.container.scrollHeight - window.innerHeight)) * window.innerHeight
        this.tab.style.height = `${this.tabHeight}px`
       
        this.tab.style.transformOrigin = '0 0'

        // anime.set(this.tab, {
        //     scaleY : `${this.tabHeight * 100}%`
        // })

        this.tab.style.background = '#ffffff'
        this.tab.style.width = '100%'

        this.y = 0
        this.yTarget = 0
        this.initialY = 0
        this.newY = 0
        this.move = false

        this.maxY = window.innerHeight - this.tabHeight

        window.addEventListener( 'resize', () => this.onResize() )

        this.tab.addEventListener('mousedown', (e) => {
            e.preventDefault()
            this.initialY = e.clientY
            this.move = true
            this.app.canScroll = false
        })

        this.ticking = false

        window.addEventListener('mousemove', (e) => {
          if (!this.ticking) {
            window.requestAnimationFrame(() => {
            this.onMove(e)
              this.ticking = false
            })
          }
          this.ticking = true
        })

        this.track.addEventListener('click', (e) => {
            e.preventDefault()
            this.move = true
            this.onMove(e)
            this.move = false
        })

        window.addEventListener('mouseup', (e) => {
            e.preventDefault()
            this.move = false
            this.app.canScroll = true
        })
    }

    onResize(){
        this.tabHeight = (window.innerHeight / (this.container.scrollHeight - window.innerHeight)) * window.innerHeight
        this.tab.style.height = `${this.tabHeight}px`
        this.maxY = window.innerHeight - this.tabHeight
    
    }

    set(y){
            this.y = y * this.maxY
            this.tab.style.transform = `translateY(${this.y}px)`
    }

    onMove(e){
        if(this.move){
            e.preventDefault()
            this.newY = e.clientY

            this.yTarget = this.yTarget - (this.initialY - this.newY)
            this.yTarget = clamp(this.yTarget, 0, this.maxY)

            this.initialY = this.newY
            
            this.app.onBar(this.yTarget / this.maxY)

        }
        }
        
}

export default ScrollBar