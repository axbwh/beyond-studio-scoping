import anime from 'animejs';
import lottie from 'lottie-web';

class Preloader {
    constructor(){
        this.wrap = document.querySelector('#preloader .puck')
        this.text = document.querySelector('#preloader p')
        this.anim = lottie.loadAnimation({
            container: this.wrap,
            renderer: 'svg',
            autoplay: true,
            loop: true,
            name: 'clocked',
            // animationData: data
            path:
                'https://uploads-ssl.webflow.com/6370af344b77a6b1153f7f41/63c89ef491c3e307e0ef43f9_Beyond_Preloader_Puck_v01.json',
        })
        
        this.forceStart = false
        this.text.classList.add('blink')

        anime.set(this.wrap, {
            opacity: 0
        })

        this.anim.addEventListener('data_ready', () => {
            console.log('ready')
            anime({
                targets: this.wrap,
                opacity: 1,
                duration: 1000,
                easing: "easeInOutSine"
            })
            this.anim.play()
            this.wrap.querySelector('svg').style.opacity = '1'
        })
    }

    restart(){
        this.text.classList.remove('blink')
        anime.set(this.wrap, {
            opacity: 0
        })
        
        anime({
            targets: '#preloader .hero-content-wrapper',
            opacity: 1,
            duration: 1000
        })
        this.forceStart = true
        this.anim.loop = true
        this.anim.play()

        
    }

    hide(delay = 0){
        anime({
            targets: '#preloader .hero-content-wrapper',
            opacity: 0,
            duration: 1000,
            delay: delay,
            easing: "easeInOutSine"
        })
    }

    stop(loopNum = 1){
        let loop = 0
        let self = this
        return new Promise( (resolve, reject) => {
            self.anim.addEventListener('loopComplete', function loopListener() {
                loop = loop + 1
                if(loop >= loopNum && !self.forceStart){
                    self.anim.loop = false
                    self.anim.stop()
                    self.anim.removeEventListener('loopComplete', loopListener)
                    resolve()
                }

            })
        })
    }
}

export default Preloader