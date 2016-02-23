export function makeCircle(x, y, id, color = "red", type = "TMP") {
  return new fabric.Circle({
    radius: 10, 
    strokeWidth: 2, 
    stroke: '',
    fill: '',
    left: x,
    top: y,
    selectable: true,
    lockMovementX: true,
    lockScalingFlip: true,
    lockScalingX: true,
    lockScalingY: true,
    type: type,
    originX: 'center',
    originY: 'center',
    id: id
  });
}

export function makeLine(point1, point2) {
  return new fabric.Line([point1.originalLeft, point1.originalTop, point2.originalLeft, point2.originalTop], {
    fill: 'green',
    stroke: 'green',
    strokeWidth: 2,
    lockMovementX: true,
    lockScalingFlip: true,
    lockScalingX: true,
    lockScalingY: true,
    type: 'LINE'
  });
}