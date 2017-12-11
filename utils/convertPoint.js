export default ({x, y}) => {
  const svg = document.getElementById('svg_parent')
  const ctm = svg.getScreenCTM()
  const point = svg.createSVGPoint()
  point.x = x
  point.y = y
  return point.matrixTransform(ctm.inverse())
}
