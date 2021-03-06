
import DomVerticalMiniMap from '../src/index.js'
import './styles.css'

const grid = document.querySelector('.grid')

const div1 = document.createElement('div')
div1.classList.add('form-group')
const label = document.createElement('label')
const input = document.createElement('input')
const textArea = document.createElement('textArea')

div1.appendChild(label)

const div2 = div1.cloneNode(true)

div1.appendChild(input)
div2.appendChild(textArea)

const toggleClass = function (inputElement) {
  if (inputElement.value.length) {
    inputElement.classList.remove('has-error')
  } else {
    inputElement.classList.add('has-error')
  }
}

const addNode = function () {
  const divCloned = (
    Math.round(Math.random())
      ? div1.cloneNode(true)
      : div2.cloneNode(true)
  )

  const label = divCloned.querySelector('label')
  const input = divCloned.querySelector('input, textArea')

  const gridChildLength = grid.childNodes.length

  label.htmlFor = gridChildLength.toString()
  label.textContent = `label ${gridChildLength}`
  input.id = gridChildLength.toString()

  input.addEventListener('input', toggleClass.bind(null, input))

  if (Math.round(Math.random())) {
    input.value = `inputValue ${gridChildLength}`
  } else {
    input.classList.add('has-error')
  }

  grid.appendChild(divCloned)
}

const removeNode = function () {
  const lastChild = grid.lastChild
  lastChild.removeEventListener('input', toggleClass.bind(null, lastChild))

  if (lastChild != null) {
    grid.removeChild(lastChild)
  }
}

for (let i = 0; i < 50; ++i) {
  addNode()
}

const createMap = function (map) {
  if (map != null) {
    map.create()
  }
}

const destroyMap = function (map) {
  if (map != null) {
    const mapElement = map.root

    if (mapElement != null) {
      map.destroy()
    }
  }
}

const refreshMap = function (map) {
  if (map != null) {
    const mapElement = map.root

    if (mapElement != null) {
      map.refresh()
    }
  }
}

const target = document.querySelector('.grid')
const scrollTarget = document.querySelector('.grid-container')
const config = {
  container: '#mini-map',
  scrollTarget: scrollTarget,
  target: target,
  styles: {
    width: '20%'
  }
}

const buttonAdd = document.querySelector('#add')
const buttonRemove = document.querySelector('#remove')
const buttonCreate = document.querySelector('#create')
const buttonDestroy = document.querySelector('#destroy')
const buttonRefresh = document.querySelector('#refresh')

buttonAdd.addEventListener('click', addNode)
buttonRemove.addEventListener('click', removeNode)

const miniMap = new DomVerticalMiniMap(config)

createMap(miniMap)

buttonCreate.addEventListener('click', createMap.bind(null, miniMap))
buttonDestroy.addEventListener('click', destroyMap.bind(null, miniMap))
buttonRefresh.addEventListener('click', refreshMap.bind(null, miniMap))
