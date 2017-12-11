import {types} from 'mobx-state-tree'
import Box from './Box.js'
import getLength from '../utils/getLength.js'

const BoundingBox = types.compose(Box).actions(self => ({
  init: () => {
    const len = getLength(self.corners.a, self.corners.c)
    self.equalizeScale((len + 100) / len, self.origin.x, self.origin.y)
  }
}))
export default BoundingBox

export const createBoundingBox = ({a, b, c, d, e, f}) => {
  const boundingBox = BoundingBox.create({a, b, c, d, e, f})
  boundingBox.init()
  return boundingBox
}
