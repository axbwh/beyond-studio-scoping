import anime from 'animejs'

const copyToClipboard = () => {
  let tag = document.querySelector('.mail-tag')
  let hover = tag.childNodes[2]
  let base = tag.childNodes[1]
  let copied = tag.childNodes[0]

  let timeout = false
  let clicked = false
  let hovered = false

  anime.set([hover, copied], {
    opacity: 0,
    translateY: '-100%',
  })

  const copyHello = document.querySelectorAll('.copy-hello')

  let onLeave = () => {
    if(!hovered){
      anime({
        targets: hover,
        opacity: [1, 0],
        translateY: ['0%', '100%'],
        duration: 400,
        easing: 'easeOutQuart',
      })

      if (clicked) {
        anime({
          targets: copied,
          opacity: [0, 1],
          translateY: ['-100%', '0%'],
          duration: 400,
          easing: 'easeOutQuart',
        })
      } else {
        anime({
          targets: base,
          opacity: [0, 1],
          translateY: ['-100%', '0%'],
          duration: 400,
          easing: 'easeOutQuart',
        })
      }
    }
    hovered = false
  }

  copyHello.forEach((e) => {
    e.addEventListener('mouseenter', () => {
        anime({
          targets: hover,
          opacity: [0, 1],
          translateY: ['-100%', '0%'],
          duration: 400,
          easing: 'easeOutQuart',
        })
        if (clicked) {
          anime({
            targets: copied,
            opacity: [1, 0],
            translateY: ['0', '100%'],
            duration: 400,
            easing: 'easeOutQuart',
          })
        } else {
          anime({
            targets: base,
            opacity: [1, 0],
            translateY: ['0%', '100%'],
            duration: 400,
            easing: 'easeOutQuart',
          })
        }
    })

    e.addEventListener('mouseleave', () => {
      onLeave()
    })

    e.addEventListener('click', () => {
      anime({
        targets: hover,
        opacity: [1, 0],
        translateY: ['0%', '100%'],
        duration: 400,
        easing: 'easeOutQuart',
      })

      anime({
        targets: copied,
        opacity: [0, 1],
        translateY: ['-100%', '0%'],
        duration: 400,
        easing: 'easeOutQuart',
      })

      clicked = true
      hovered = true
      var email = 'hello@beyond.fun'
      navigator.clipboard.writeText(email)
    })
  })
}

export default copyToClipboard
// copy email to clipboard
