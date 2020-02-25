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
    this._timer = null

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
    this._initMapPicture()
    window.addEventListener('resize', this._initMapPicture.bind(this))
    if (isScrollElementEnabled) {
      this._initViewPortElement()
    }
    this._initMutationObserver()
    this._mutationObserver.observe(this._target, {
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
    this._mapElement.style.overflow = 'hidden'
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
    this._mapPictureUrl = await domToImage.toPng(this._target)
    this._mapPicture.src = this._mapPictureUrl
    this._mapPicture.style.position = 'relative'
    let { height } = this._mapElementStyles
    const mapElementWidth = this.getMapElementWidth()
    this._mapPicture.width = mapElementWidth
    this._mapPicture.onload = () => {
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
        clearTimeout(this._timer)
        this._timer = setTimeout(() => {
          this._initMapPicture()
          if (this._isScrollElementEnabled) {
            this._setViewPortElementStyle()
          }
          clearTimeout(this._timer)
        }, 500)
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
    if (this._scrollTarget === document.documentElement) {
      window.addEventListener('scroll', this._setViewPortElementStyle.bind(this))
    } else {
      this._scrollTarget.addEventListener('scroll', this._setViewPortElementStyle.bind(this))
    }
    window.addEventListener('resize', this._setViewPortElementStyle.bind(this))
  }

  getMapElementWidth () {
    let { width } = this._mapElementStyles
    if (typeof width === 'string' && width.indexOf('%') > -1) {
      width = this._scrollTarget.clientWidth * parseFloat(width) / 100
    } else {
      width = parseFloat(width)
    }
    return width
  }

  /**
   * Click map to scroll the target vertically to coordinate.
   *
   * @param {Event} event
   */
  static scrollTargetTo (event) {
    const { offsetY } = event
    let originPicWidth = this._mapPicture.naturalWidth
    let currentPicWidth = this._mapPicture.width
    this._scrollTarget.scrollTo(0, offsetY * originPicWidth / currentPicWidth)
  }

  /**
   * Set 'style' attribute of _viewPortElement.
   *
   * @private
   */
  _setViewPortElementStyle () {
    const { clientHeight: mapHeight, scrollHeight: mapScrollHeight } = this._mapElement
    const { scrollTop, scrollHeight, clientHeight, clientWidth } = this._scrollTarget
    const mapElementWidth = this.getMapElementWidth()
    this._viewPortElement.style.height = mapElementWidth * (clientHeight / clientWidth) + 'px'

    // 视口移动的top值/minimap的总高度 === 目标滚动元素滚动的距离/ 目标滚动元素的总高度
    const viewPortTop = scrollTop / scrollHeight * mapScrollHeight
    // console.log('------------')
    // console.log('目标元素=> 可见宽度, 可见高度, 滑动的距离, 总高度, 可见高度/总高度, 可滑动距离', this._scrollTarget.clientWidth, clientHeight, scrollTop, scrollHeight, clientHeight / scrollHeight, scrollHeight - clientHeight)
    // console.log('minimap当前视口区域=>宽度, 滑动的距离, 高度, 视口的高度/图片总高度', this._viewPortElement.clientWidth, viewPortTop, this._viewPortElement.clientHeight, this._viewPortElement.clientHeight / picHeight)
    // console.log('minimap=> 可见高度, 总高度, 可滑动距离', mapHeight, mapScrollHeight, mapScrollHeight - mapHeight)
    // console.log('map可滑动距离/目标元素可滑动距离', (mapScrollHeight - mapHeight) / (scrollHeight - clientHeight))
    // console.log('map图片=> 高度', this._mapPicture.width, picHeight)
    if (mapHeight < mapScrollHeight) {
      // minimap有溢出，需要跟随target滚动
      // 目标滚动元素滚动的距离/目标滚动元素的总高度 === minimap滚动的距离 / minimap的总高度
      // const top = scrollTop / scrollHeight * mapScrollHeight
      const scrollTargetOverflowHeight = scrollHeight - clientHeight
      const mapOverflowHeight = mapScrollHeight - mapHeight
      const mapTop = scrollTop * mapOverflowHeight / scrollTargetOverflowHeight
      this._mapPicture.style.top = -mapTop + 'px'
      this._viewPortElement.style.top = viewPortTop - mapTop + 'px'
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
      this._scrollTarget.removeEventListener('scroll', this._setViewPortElementStyle.bind(this))
      window.removeEventListener('resize', this._setViewPortElementStyle.bind(this))

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
