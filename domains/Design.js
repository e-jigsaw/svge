import {types} from 'mobx-state-tree'

export default types.model({
  width: '1000',
  height: '1000'
}).views(self => ({
  get size () {
    return {
      width: parseInt(self.width) || 0,
      height: parseInt(self.height) || 0
    }
  },
  get currentDesignArea () {
    return {
      x: 0,
      y: 0,
      width: self.width,
      height: self.height
    }
  }
})).actions(self => ({
  changeWidth: width => (self.width = width),
  changeHeight: height => (self.height = height)
}))
