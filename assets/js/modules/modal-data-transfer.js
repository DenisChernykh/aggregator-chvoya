const triggerAttribute = "data-modal-id"
const itemAttribute = "data-transfer-item"

const sourceTextAttr = "data-transfer-text"
const targetTextAttr = "data-transfer-text-modal"

const sourceSrcAttr = "data-transfer-src"
const targetSrcAttr = "data-transfer-src-modal"

export function getCleanText(element) {
  return element?.textContent?.replace(/\s+/g, " ").trim() || ""
}

export function setTargetContent(target, htmlContent, textContent) {
  if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") {
    target.value = textContent
    return
  }

  target.innerHTML = htmlContent
}

export function setTargetImage(target, srcValue, altValue = "") {
  if (!target || !srcValue) return

  if (target.tagName === "IMG") {
    target.setAttribute("src", srcValue)
    target.setAttribute("alt", altValue)
    return
  }

  target.style.backgroundImage = `url('${srcValue}')`
}

export function transferTextData(container, modal) {
  const sourceTextElements = container.querySelectorAll(`[${sourceTextAttr}]`)

  sourceTextElements.forEach((source) => {
    const key = source.getAttribute(sourceTextAttr)
    const htmlContent = source.innerHTML
    const textContent = getCleanText(source)

    const targetElements = modal.querySelectorAll(`[${targetTextAttr}="${key}"]`)
    targetElements.forEach((target) => {
      setTargetContent(target, htmlContent, textContent)
    })
  })
}

export function transferImageData(container, modal) {
  const sourceImgElements = container.querySelectorAll(`[${sourceSrcAttr}]`)

  sourceImgElements.forEach((source) => {
    const key = source.getAttribute(sourceSrcAttr)

    let image = null
    if (source.tagName === "IMG") {
      image = source
    } else {
      image = source.querySelector("img")
    }

    const srcValue = image?.getAttribute("src") || ""
    const altValue = image?.getAttribute("alt") || ""

    const targetImgElements = modal.querySelectorAll(`[${targetSrcAttr}="${key}"]`)
    targetImgElements.forEach((target) => {
      setTargetImage(target, srcValue, altValue)
    })
  })
}

export function transferModalData(container, modal) {
  if (!container || !modal) return

  transferTextData(container, modal)
  transferImageData(container, modal)
}

export function initModalDataTransfer() {
  const triggerButtons = document.querySelectorAll(`[${triggerAttribute}]`)

  triggerButtons.forEach((button) => {
    button.addEventListener("click", function () {
      const modalId = this.getAttribute(triggerAttribute)
      const modal = document.querySelector(`[data-modal="${modalId}"]`)
      const container = this.closest(`[${itemAttribute}]`)

      transferModalData(container, modal)
    })
  })
}
