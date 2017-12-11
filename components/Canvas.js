import {Component} from 'react'
import {inject, observer} from 'mobx-react'

export default inject(({store}) => ({
  design: store.design,
  elements: store.elements
}))(observer(({design, elements}) => {
  const els = elements.surfaces.get('front').map(key => {
    const element = elements.body.get(key)
    if (element.type === 'rect') {
      return (
        <rect
          key={key} transform={element.transform} fill={element.fill}
          width="1" height="1"
        ></rect>
      )
    }
  })
  return (
    <svg
      id="svg_parent" width={design.size.width} height={design.size.height}
    >{els}</svg>
  )
}))
