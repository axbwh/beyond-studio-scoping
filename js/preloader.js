import lottie from 'lottie-web';

class Preloader {
    constructor(){
        this.wrap = document.querySelector('#preloader .hero-text-wrapper')
        this.anim = lottie.loadAnimation({
            container: this.wrap,
            renderer: 'svg',
            autoplay: true,
            loop: true,
            name: 'clocked',
            // animationData: data
            path:
                'https://uploads-ssl.webflow.com/5f287eb0037f68c8a08d3520/5fc454a806388fa94227b1ee_White-V01.json',
        })

        this.anim.addEventListener('data_ready', () => {
            console.log(this.anim)
            this.anim.play()
            this.wrap.querySelector('svg').style.opacity = '1'
            this.wrap.querySelector('svg').style.position = 'absolute'
            this.wrap.querySelector('img').style.opacity = '0'
        })
    }

    start(){
        this.anim.loop = true
        this.anim.play()
    }

    stop(loopNum = 1){
        let loop = 0
        let anim = this.anim
        return new Promise( (resolve, reject) => {
            anim.addEventListener('loopComplete', function loopListener() {
                loop = loop + 1
                if(loop >= loopNum){
                    anim.loop = false
                    anim.stop()
                    anim.removeEventListener('loopComplete', loopListener)
                    resolve()
                }

            })
        })
    }
}

export default Preloader