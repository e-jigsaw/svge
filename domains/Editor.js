import {types} from 'mobx-state-tree'
import Design from './Design.js'
import Elements from './Elements.js'

const {optional} = types

export default types.model({
  design: optional(Design, {}),
  elements: optional(Elements, {})
}).actions(self => ({
  init: () => {
    self.elements.init()
  }
}))
