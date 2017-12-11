import {Component} from 'react'
import {inject, observer} from 'mobx-react'

export default inject(({store}) => ({
  design: store.design,
  elements: store.elements
}))(observer(({design, elements}) => {
  const changeWidth = event =>
    design.changeWidth(event.target.value)
  const changeHeight = event =>
    design.changeHeight(event.target.value)
  return (
    <div>
      <label>Width:</label>
      <input value={design.width} onChange={changeWidth} />
      <label>Height:</label>
      <input value={design.height} onChange={changeHeight} />
      <button onClick={elements.addRect}>rect</button>
    </div>
  )
}))
