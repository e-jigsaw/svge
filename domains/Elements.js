import {types, getRoot, getSnapshot, applySnapshot} from 'mobx-state-tree'
import uniq from 'ramda/src/uniq'
import difference from 'ramda/src/difference'
import Point, {createPoint} from './Point.js'
import BoundingBox, {createBoundingBox} from './BoundingBox.js'
import Box from './Box.js'
import RectElement, {createRectElement} from './RectElement.js'
import convertPoint from '../utils/convertPoint.js'
import getLength from '../utils/getLength.js'
import {rad} from '../utils/constants.js'

const {optional, map, array, number, frozen} = types

export default types.model({
  surfaces: optional(map(array(number)), {
    front: []
  }),
  body: optional(map(RectElement), {}),
  undoStack: optional(array(frozen), []),
  redoStack: optional(array(frozen), []),
  head: 0,
  currentSurfaceKey: 'front',
  selected: optional(array(number), []),
  isDrag: false,
  isRotate: false,
  isResize: false,
  resizeOrigin: 0,
  freezedBoundingBox: optional(BoundingBox, {})
}).views(self => ({
  get boundingBox () {
    return self.selected.map(id => self.body.get(id)).reduce((prev, element) => {
      if (prev.xmin === null) {
        prev.xmin = element.corners.a.x
        prev.ymin = element.corners.a.y
        prev.xmax = element.corners.a.x
        prev.ymax = element.corners.a.y
      }
      element.corners.entries().map(([key, value]) => {
        const xc = value.x
        const yc = value.y
        if (xc < prev.xmin) prev.xmin = xc
        if (xc > prev.xmax) prev.xmax = xc
        if (yc < prev.ymin) prev.ymin = yc
        if (yc > prev.ymax) prev.ymax = yc
      })
      return prev
    }, {
      xmin: null,
      ymin: null,
      xmax: null,
      ymax: null
    })
  },
  get boundingBoxOrigin () {
    if (self.boundingBox.xmin === null) {
      return createPoint(0, 0)
    }
    return createPoint(
      self.boundingBox.xmax - (
        (self.boundingBox.xmax - self.boundingBox.xmin) / 2
      ),
      self.boundingBox.ymax - (
        (self.boundingBox.ymax - self.boundingBox.ymin) / 2
      )
    )
  },
  get canUndo () {
    return self.undoStack.length > 0
  },
  get canRedo () {
    return self.redoStack.length > 0
  },
  get currentSurface () {
    return self.surfaces.get(self.currentSurfaceKey)
  }
})).actions(self => ({
  init: () => {
    document.addEventListener('mousemove', self.onMove)
  },
  save: () => {
    self.redoStack.replace([])
    self.undoStack.push({
      surfaces: getSnapshot(self.surfaces),
      body: getSnapshot(self.body)
    })
  },
  _getSnapshots: () => ({
    surfaces: getSnapshot(self.surfaces),
    body: getSnapshot(self.body)
  }),
  _applySnapshots: ({surfaces, body}) => {
    applySnapshot(self.surfaces, surfaces)
    applySnapshot(self.body, body)
  },
  undo: _ => {
    const snapshots = self.undoStack.pop()
    self.redoStack.push(self._getSnapshots())
    self._applySnapshots(snapshots)
    self.selected.replace([])
  },
  redo: _ => {
    const snapshots = self.redoStack.pop()
    self.undoStack.push(self._getSnapshots())
    self._applySnapshots(snapshots)
    self.selected.replace([])
  },
  addRect: event => {
    self.save()
    self.body.set(self.head, createRectElement({
      x: 10,
      y: 10,
      width: 100,
      height: 100,
      id: self.head
    }))
    self.currentSurface.push(self.head)
    self.forceSelect(self.head)
    self.head += 1
  },
  select: id => event => {
    if (getRoot(self).keyboard.shiftKey) {
      self.postMultipleSelect(uniq([...self.selected.peek(), id]))
    } else {
      self.forceSelect(id)
    }
  },
  postMultipleSelect: ids => {
    self.selected.replace(ids)
    const {xmin, ymin, xmax, ymax} = self.boundingBox
    const boundingBox = Box.create({
      a: xmax - xmin,
      d: ymax - ymin,
      e: xmin,
      f: ymin
    })
    self.freezedBoundingBox = createBoundingBox(
      boundingBox, getRoot(self).design
    )
  },
  forceSelect: id => {
    self.selected.replace([id])
    self.freezedBoundingBox = createBoundingBox(
      self.body.get(id), getRoot(self).design
    )
  },
  _setPoint: event => {
    self.prevX = event.clientX
    self.prevY = event.clientY
  },
  dragStart: event => {
    event.preventDefault()
    self.save()
    self.isDrag = true
    self._setPoint(event)
  },
  rotateStart: event => {
    event.preventDefault()
    self.save()
    self.isRotate = true
    self._setPoint(event)
  },
  resizeStart: origin => event => self.postResizeStart(origin, event),
  postResizeStart: (origin, event) => {
    event.preventDefault()
    self.save()
    self.isResize = true
    self.resizeOrigin = origin
    self._setPoint(event)
  },
  dragEnd: event => {
    event.preventDefault()
    if (!self.isDrag && !self.isRotate && !self.isResize) {
      if (event.target.getAttribute('data-ignore-unselect') === null) {
        self.selected.replace([])
      }
    }
    self.isDrag = false
    self.isRotate = false
    self.isResize = false
  },
  _getPoints: event => {
    return {
      p1: convertPoint({
        x: self.prevX,
        y: self.prevY
      }),
      p2: convertPoint({
        x: event.clientX,
        y: event.clientY
      })
    }
  },
  _getDelta: event => {
    const {p1, p2} = self._getPoints(event)
    return {
      deltaX: p2.x - p1.x,
      deltaY: p2.y - p1.y
    }
  },
  onMove: event => {
    event.preventDefault()
    if (self.isDrag) {
      const {deltaX, deltaY} = self._getDelta(event)
      self._setPoint(event)
      self.selected.forEach(id => self.body.get(id).translate(deltaX, deltaY))
      self.freezedBoundingBox.translate(deltaX, deltaY)
    }
    if (self.isRotate) {
      const {currentDesignArea} = getRoot(self).design
      const {p1, p2} = self._getPoints(event)
      const oy = currentDesignArea.y + self.boundingBoxOrigin.y
      const ox = currentDesignArea.x + self.boundingBoxOrigin.y
      const pr = Math.atan2(oy - p1.y, ox - p1.x) / rad
      const r = Math.atan2(oy - p2.y, ox - p2.x) / rad
      const delta = r - pr
      self._setPoint(event)
      self.selected.forEach(id => self.body.get(id).rotate(
        delta, self.boundingBoxOrigin.x, self.boundingBoxOrigin.y
      ))
      self.freezedBoundingBox.rotate(
        delta,
        self.freezedBoundingBox.origin.x, self.freezedBoundingBox.origin.y
      )
    }
    if (self.isResize) {
      const {a, b, c, d} = self.freezedBoundingBox.corners
      const origins = [
        [a.x, a.y, c.x, c.y],
        [b.x, b.y, d.x, d.y],
        [c.x, c.y, a.x, a.y],
        [d.x, d.y, b.x, b.y]
      ][self.resizeOrigin]
      const {currentDesignArea} = getRoot(self).design
      const {p1, p2} = self._getPoints(event)
      const po = createPoint(origins[2], origins[3])
      self._setPoint(event)
      const d1 = getLength(p1, po)
      const d2 = getLength(p2, po)
      const diff = d2 - d1
      const len = getLength(createPoint(origins[0], origins[1]), po)
      const ratio = (len + diff) / len
      self.selected.forEach(id => self.body.get(id).equalizeScale(
        ratio,
        origins[2] - currentDesignArea.x,
        origins[3] - currentDesignArea.y
      ))
      self.freezedBoundingBox.equalizeScale(ratio, origins[2], origins[3])
    }
  },
  _flip: (id, x, y) => {
    const element = self.body.get(id)
    element.scale(x, y, element.origin.x, element.origin.y)
  },
  _flipBoundingBox: (x, y) => self.freezedBoundingBox.scale(
    x, y, self.freezedBoundingBox.origin.x, self.freezedBoundingBox.origin.y
  ),
  horizontalFlip: _ => {
    self.selected.forEach(id => self._flip(id, 1, -1))
    self._flipBoundingBox(1, -1)
  },
  verticalFlip: _ => {
    self.selected.forEach(id => self._flip(id, -1, 1))
    self._flipBoundingBox(-1, 1)
  },
  copy: key => _ => self.postCopy(key),
  postCopy: key => {
    let nextSelect = []
    self.selected.forEach(id => {
      const json = self.body.get(id).toJSON()
      if (json.type === 'rect') {
        const copy = RectElement.create(json)
        copy.setId(self.head)
        copy.stagger()
        self.body.set(self.head, copy)
      }
      self.currentSurface.push(self.head)
      nextSelect.push(self.head)
      self.head += 1
    })
    if (nextSelect.length === 1) self.forceSelect(nextSelect[0])
    else self.postMultipleSelect(nextSelect)
  },
  goUp: _ => {
    // TODO
  },
  goDown: _ => {
    // TODO
  },
  goTop: _ =>
    self.currentSurface.replace(
      difference(
        self.currentSurface, self.selected
      ).concat(self.selected.peek())
    ),
  goBottom: _ =>
    self.currentSurface.replace(
      self.selected.peek().concat(
        difference(self.currentSurface, self.selected)
      )
    )
}))
