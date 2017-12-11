import {types} from 'mobx-state-tree'
import Box from './Box.js'

const RectElement = types.compose(Box, types.model({
  type: 'rect',
  id: 0,
  fill: '#000'
}))

export default RectElement
export const createRectElement = ({id, x, y, width, height, fill}) =>
  RectElement.create({
    id,
    a: width,
    d: height,
    e: x,
    f: y,
    fill
  })
