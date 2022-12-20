import lottie from 'lottie-web';
class Logo {
    constructor(){
        this.wrap = document.querySelector('.logo-wrapper')
        this.anim = lottie.loadAnimation({
            container: this.wrap,
            renderer: 'svg',
            autoplay: false,
            loop: true,
            name: 'other',
            // animationData: data,
             path: 'https://uploads-ssl.webflow.com/6370af344b77a6b1153f7f41/63a11a6423a6b712a7880753_Beyond_Preloader_Bug_Test_v01.json',
        })
         

        this.anim.addEventListener('data_ready', () => {
            this.wrap.querySelector('svg').style.opacity = '1'
            this.wrap.querySelector('svg').style.position = 'absolute'
            this.wrap.querySelector('img').style.opacity = '0'
        })

        this.wrap.addEventListener('mouseenter', () => this.start())
        this.wrap.addEventListener('mouseleave', ()=> this.stop())

        this.isPlaying = false
    }

    start(){
        
        if(!this.isPlaying){
            this.anim.loop = true
            this.anim.play()
            this.isPlaying = true
        }  
    }

    stop(){
        let anim = this.anim
        this.isPlaying = false
        return new Promise( (resolve, reject) => {
            anim.addEventListener('loopComplete', function loopListener() {
                    anim.removeEventListener('loopComplete', loopListener)
                    if(!this.isPlaying){
                    anim.loop = false
                    anim.stop()
                    }
                    resolve()

            }.bind(this))
        })
    }
}

export default Logo