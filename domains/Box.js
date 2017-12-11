import {types} from 'mobx-state-tree'
import {createPoint} from './Point'
import {rad} from '../utils/constants.js'
import getLength from '../utils/getLength.js'

export default types.model({
  a: 1,
  b: 0,
  c: 0,
  d: 1,
  e: 0,
  f: 0
}).views(self => ({
  get transform () {
    return `matrix(${self.a},${self.b},${self.c},${self.d},${self.e},${self.f})`
  },
  get origin () {
    return createPoint(
      (0.5 * self.a) + (0.5 * self.c) + self.e,
      (0.5 * self.b) + (0.5 * self.d) + self.f
    )
  },
  get corners () {
    return {
      a: createPoint(self.e, self.f),
      b: createPoint(self.a + self.e, self.b + self.f),
      c: createPoint(self.a + self.c + self.e, self.b + self.d + self.f),
      d: createPoint(self.c + self.e, self.d + self.f)
    }
  },
  get midPoints () {
    return {
      a: createPoint((0.5 * self.a) + self.e, (0.5 * self.b) + self.f),
      b: createPoint(
        self.a + (0.5 * self.c) + self.e, self.b + (0.5 * self.d) + self.f
      ),
      c: createPoint(
        (0.5 * self.a) + self.c + self.e, (0.5 * self.b) + self.d + self.f
      ),
      d: createPoint((0.5 * self.c) + self.e, (0.5 * self.d) + self.f)
    }
  },
  get viewBox () {
    const len = getLength(self.corners.a, self.corners.c)
    const hl = len / 2
    return `${self.origin.x - hl} ${self.origin.y - hl} ${len} ${len}`
  }
})).actions(self => ({
  translate: (x, y) => {
    self.e += x
    self.f += y
  },
  rotate: (r, x, y) => {
    const sin = Math.sin(r * rad)
    const cos = Math.cos(r * rad)
    self.translate(-x, -y)
    const {a, b, c, d, e, f} = self
    self.a = (a * cos) - (b * sin)
    self.b = (a * sin) + (b * cos)
    self.c = (c * cos) - (d * sin)
    self.d = (c * sin) + (d * cos)
    self.e = (e * cos) - (f * sin)
    self.f = (e * sin) + (f * cos)
    self.translate(x, y)
  },
  equalizeScale: (s, ox, oy) => self.scale(s, s, ox, oy),
  scale: (x, y, ox, oy) => {
    self.translate(-ox, -oy)
    self.a *= x
    self.b *= y
    self.c *= x
    self.d *= y
    self.e *= x
    self.f *= y
    self.translate(ox, oy)
  }
}))
