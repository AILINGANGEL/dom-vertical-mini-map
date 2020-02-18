/* global MutationObserver */
import domToImage from 'dom-to-image'

export default class DomVerticalMiniMap {
  // noinspection JSAnnotator

  /**
   * @param {HTMLElement or String} target
   * @param {HTMLElement} scrollTarget
   * @param {String} container
   * @param {String} stylesBackgroundColor
   * @param {String} stylesBorderColor
   * @param {String} stylesPosition
   * @param {String} stylesWidth
   * @param {Number} stylesZIndex
   * @param {Boolean} scrollEnabled
   * @param {String} viewportStylesBackgroundColor
   */
  constructor (
    {
      target,
      scrollTarget,
      container,
      styles: {
        width: mapWidth,
        height: mapHeight = Infinity
      },
      scroll: {
        enabled: scrollEnabled = true,
        styles: {
          backgroundColor: viewportStylesBackgroundColor = 'rgba(108, 117, 125, 0.3)'
        } = {}
      } = {}
    } = {}
  ) {
    this._version = VERSION

    if (typeof target === 'string') {
      this._target = document.querySelector(target)
    } else if (target && target.nodeType === 1) {
      this._target = target
    } else {
      this._target = document.body
    }
    // 滑动目标元素，用来设置minimap上的滚动元素位置
    this._scrollTarget = scrollTarget || this._target
    // minimap的容器
    this._mapElement = document.querySelector(container)
    // 视口元素
    this._viewPortElement = null
    this._mapPicture = new Image()

    this._mutationObserver = null

    this._isScrollElementEnabled = (
      typeof scrollEnabled === 'boolean'
        ? scrollEnabled
        : true
    )

    this._mapElementStyles = {
      width: mapWidth,
      height: mapHeight
    }

    this._viewPortElementStyles = {
      backgroundColor: viewportStylesBackgroundColor
    }
  }

  /**
   * Initialize component DomVerticalMiniMap.
   *
   * @private
   */
  async _init () {
    const isScrollElementEnabled = this._isScrollElementEnabled
    this._initMapElement()
    if (isScrollElementEnabled) {
      this._initViewPortElement()
    }
    await this._initMapPicture()
    this._initMutationObserver()
    this._mutationObserver.observe(this._mapElement, {
      attributes: true,
      characterData: true,
      childList: true,
      subtree: true
    })
  }

  /**
   * Initialize {HTMLElement} MapElement.
   *
   * @private
   */
  _initMapElement () {
    this._mapElement.style.overflow = 'auto'
    this._mapElement.addEventListener(
      'click',
      DomVerticalMiniMap.scrollTargetTo.bind(this) /* eslint-disable-line */
    )
  }

  /**
   * Initialize {HTMLElement} MapPicture.
   *
   * @private
   */
  async _initMapPicture () {
    const dataUrl = await domToImage.toPng(this._target)
    this._mapPicture.src = dataUrl
    const { width, height } = this._mapElementStyles
    if (width) {
      this._mapPicture.width = width
    }

    this._mapPicture.onload = () => {
      console.log('yyyyy', this._mapPicture.naturalHeight, this._mapPicture.naturalWidth)
      // 找出minimap的最大高度
      // 视口的高度-Minimap距离视口顶部的距离- marginTop - borderTopWidth - padding-top
      const { top } = this._mapElement.getBoundingClientRect()
      const { 'margin-top': marginTop, 'border-top-width': borderTopWidth, 'padding-top': paddingTop, 'padding-bottom': paddingBottom, 'box-sizing': boxSizing } = window.getComputedStyle(this._mapElement)
      const picHeight = this._mapPicture.clientHeight
      let maxHeight = window.innerHeight - top - parseInt(marginTop)
      if (boxSizing === 'content-box') {
        maxHeight -= (parseInt(borderTopWidth) * 2 + parseInt(paddingTop) + parseInt(paddingBottom))
      }
      this._mapElement.style.height = Math.min(height, picHeight, maxHeight) + 'px'
    }

    this._mapElement.appendChild(this._mapPicture)
  }
  /**
   * Initialize {MutationObserver} _mutationObserver for observe DOM.
   *
   * @private
   */
  _initMutationObserver () {
    this._mutationObserver = new MutationObserver(mutations =>
      mutations.forEach(mutation => {
        if (this._isScrollElementEnabled) {
          this._setViewPortElementStyle()
        }
      })
    )
  }

  /**
   * Initialize {HTMLElement} _viewPortElement.
   *
   * @private
   */
  _initViewPortElement () {
    this._viewPortElement = document.createElement('div')
    this._viewPortElement.classList.add('dom-vertical-mini-map-scroll')
    this._mapElement.appendChild(this._viewPortElement)
    this._viewPortElement.style.backgroundColor = this._viewPortElementStyles['backgroundColor']
    const { clientHeight: targetHeight, clientWidth: targetWidth } = this._scrollTarget
    console.log('xxxxxx', this._viewPortElement.clientHeight)
    this._viewPortElement.style.height = this._mapElementStyles.width * (targetHeight / targetWidth) + 'px'
    window.addEventListener('scroll', this._setViewPortElementStyle.bind(this))
    // window.addEventListener('resize', this._setViewPortElementStyle.bind(this))
  }

  /**
   * Return top and bottom coordinates of HTMLElement.
   *
   * @param {HTMLElement} element
   * @returns {{top: {Number} number, bottom: {Number} number}}
   */
  static getElementCoordinates (element) {
    const box = element.getBoundingClientRect()
    const body = document.body
    const documentElement = document.documentElement

    const scrollTop = window.pageYOffset || documentElement.scrollTop || body.scrollTop
    const clientTop = documentElement.clientTop || body.clientTop || 0

    const top = box.top + scrollTop - clientTop

    return {
      top: top,
      bottom: top + element.offsetHeight
    }
  }

  /**
   * Return height of Window, height of Document and height with scroll of Document.
   *
   * @returns {{windowHeight: number, documentHeight: number, documentScrollTop: number}}
   */
  static getDocumentProperties () {
    const body = document.body
    const documentElement = document.documentElement

    const windowHeight = documentElement.clientHeight
    const documentHeight = Math.max(
      body.scrollHeight, documentElement.scrollHeight,
      body.offsetHeight, documentElement.offsetHeight,
      body.clientHeight, windowHeight
    )

    return {
      windowHeight: windowHeight,
      documentHeight: documentHeight,
      documentScrollTop: window.pageYOffset || documentElement.scrollTop
    }
  }

  /**
   * Click map to scroll the target vertically to coordinate.
   *
   * @param {Event} event
   */
  static scrollTargetTo (event) {
    const { offsetY } = event
    this._target.scrollTo(0, offsetY)
    let originPicWidth = this._mapPicture.naturalWidth
    let currentPicWidth = this._mapPicture.width
    this._scrollTarget.scrollTo(0, offsetY * originPicWidth / currentPicWidth)
  }

  /**
   * Scroll Document vertically to Element.
   *
   * @param {Event} event
   * @param {HTMLElement} focusElement
   * @param {HTMLElement} scrollElement
   * @param {String} scrollType
   */
  static scrollDocumentToElement (
    {
      focusElement = null,
      scrollElement = null,
      scrollType = 'top'
    } = {},
    event
  ) {
    let element = null

    if (focusElement != null) {
      focusElement.focus()

      element = focusElement
    }

    if (scrollElement != null) {
      element = scrollElement
    }

    if (element == null) {
      event.stopPropagation()
      return
    }

    if (scrollType === 'top') {
      element.scrollIntoView(true)
    } else if (scrollType === 'bottom') {
      element.scrollIntoView(false)
    } else if (scrollType === 'middle') {
      const { windowHeight, documentHeight } = DomVerticalMiniMap.getDocumentProperties()
      const { top } = DomVerticalMiniMap.getElementCoordinates(element)

      const halfWindowHeight = windowHeight / 2

      if ((top - halfWindowHeight) < 0) {
        element.scrollIntoView(true)
      } else {
        if ((top + halfWindowHeight) > documentHeight) {
          element.scrollIntoView(false)
        } else {
          window.scrollTo(0, top - halfWindowHeight)
        }
      }
    }

    event.stopPropagation()
  }
  /**
   * Set 'style' attribute of _viewPortElement.
   *
   * @private
   */
  _setViewPortElementStyle () {
    const { clientHeight: mapHeight, scrollHeight: mapScrollHeight } = this._mapElement
    const { scrollTop, scrollHeight, clientHeight } = this._scrollTarget
    const picHeight = this._mapPicture.height
    // 视口移动的top值/minimap的总高度 === 目标滚动元素滚动的距离/ 目标滚动元素的总高度
    const viewPortTop = scrollTop / scrollHeight * mapScrollHeight
    console.log('------------')
    console.log('目标元素=> 可见宽度, 可见高度, 滑动的距离, 总高度, 可见高度/总高度, 可滑动距离', this._scrollTarget.clientWidth, clientHeight, scrollTop, scrollHeight, clientHeight / scrollHeight, scrollHeight - clientHeight)
    console.log('minimap当前视口区域=>宽度, 滑动的距离, 高度, 视口的高度/图片总高度', this._viewPortElement.clientWidth, viewPortTop, this._viewPortElement.clientHeight, this._viewPortElement.clientHeight / picHeight)
    console.log('minimap=> 可见高度, 总高度, 可滑动距离', mapHeight, mapScrollHeight, mapScrollHeight - mapHeight)
    console.log('map可滑动距离/目标元素可滑动距离', (mapScrollHeight - mapHeight) / (scrollHeight - clientHeight))
    console.log('map图片=> 高度', this._mapPicture.width, picHeight)
    if (mapHeight < mapScrollHeight) {
      // minimap有溢出，需要跟随target滚动
      // 目标滚动元素滚动的距离/目标滚动元素的总高度 === minimap滚动的距离 / minimap的总高度
      // const top = scrollTop / scrollHeight * mapScrollHeight
      const scrollTargetOverflowHeight = scrollHeight - clientHeight
      const mapOverflowHeight = mapScrollHeight - mapHeight
      const mapTop = scrollTop * mapOverflowHeight / scrollTargetOverflowHeight
      console.log('minimap scroll dis=>', mapTop)
      this._mapElement.scrollTo({ top: mapTop })
      const viewportTopVal = viewPortTop - mapTop
      console.log('viewport scroll dis=>', viewportTopVal)
      this._viewPortElement.style.top = viewPortTop + 'px'
    } else {
      // 没有溢出，只需要滚动视口viewport
      // top不能小于0, top的值+视口的高度不能超过map的高度
      const { clientHeight: viewPortHeight } = this._viewPortElement
      if ((viewPortTop + viewPortHeight) < mapHeight) {
        this._viewPortElement.style.top = viewPortTop + 'px'
      }
    }
  }

  /**
   * Create and inject DomVerticalMiniMap component in DOM.
   *
   */
  create () {
    this._init()

    const isScrollElementEnabled = this._isScrollElementEnabled

    if (isScrollElementEnabled) {
      this._setViewPortElementStyle()
    }
  }

  /**
   * Reset DomVerticalMiniMap component and remove it from DOM.
   *
   */
  destroy () {
    const mapElement = this._mapElement
    const isScrollElementEnabled = this._isScrollElementEnabled

    this._mutationObserver.disconnect()
    this._mutationObserver = null

    /* eslint-disable-next-line */
    mapElement.removeEventListener('click', DomVerticalMiniMap.scrollTargetTo.bind(this))

    if (isScrollElementEnabled) {
      window.removeEventListener('scroll', this._setViewPortElementStyle.bind(this))
      // window.removeEventListener('resize', this._setViewPortElementStyle.bind(this))

      this._viewPortElement.remove()
      this._viewPortElement = null
    }
    mapElement.remove()
    this._mapElement = null
  }

  /**
   * Reinitialize MapPointElements and refresh styles of _viewPortElement and MapPointElements
   *
   */
  refresh () {
    if (this._isScrollElementEnabled) {
      this._setViewPortElementStyle()
    }
  }

  /**
   * Return {HTMLElement} _mapElement (root element of DomVerticalMiniMap component)
   *
   * @returns {(HTMLElement | null)}
   */
  get root () {
    return this._mapElement
  }

  /**
   * Return version of current DomVerticalMiniMap
   *
   * @returns {String}
   */
  get version () {
    return this._version
  }
}
