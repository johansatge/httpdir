const storageKey = 'httpdir-theme'
const themeButtons = document.querySelectorAll('[data-theme]')
document.body.addEventListener('click', onClick)
setTheme(localStorage.getItem(storageKey))

function onClick(evt) {
  if (typeof evt.target.dataset.theme !== 'undefined') {
    setTheme(evt.target.dataset.theme)
  }
}

function setTheme(theme) {
  if (!['light', 'dark'].includes(theme)) {
    theme = 'dark'
  }
  themeButtons.forEach((button) => {
    const isCurrent = button.dataset.theme === theme
    button.classList[isCurrent ? 'add' : 'remove']('footer__link--theme-current')
  })
  localStorage.setItem(storageKey, theme)
  document.body.classList.remove('theme--light', 'theme--dark')
  document.body.classList.add('theme--' + theme)
}
