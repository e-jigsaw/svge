import {types} from 'mobx-state-tree'

const Point = types.model({
  x: 0,
  y: 0
})

export default Point
export const createPoint = (x, y) => Point.create({x, y})
