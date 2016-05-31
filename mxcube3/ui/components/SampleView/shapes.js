import 'fabric';
const fabric = window.fabric;

export function makeCircle(x, y, id = 'no id', color = 'red', type = 'TMP') {
  return new fabric.Circle({
    radius: 10,
    strokeWidth: 2,
    stroke: color,
    fill: '',
    left: x,
    top: y,
    selectable: true,
    lockMovementX: true,
    lockMovementY: true,
    lockScalingFlip: true,
    lockScalingX: true,
    lockScalingY: true,
    type,
    originX: 'center',
    originY: 'center',
    id
  });
}

export function makeLine(x1, y1, x2, y2, color, width) {
  return new fabric.Line([x1, y1, x2, y2], {
    fill: color,
    stroke: color,
    strokeWidth: width,
    selectable: false
  });
}

export function makeText(x, y, fontSize, color, text) {
  return new fabric.Text(text, {
    fontSize,
    fill: color,
    stroke: color,
    left: x,
    top: y,
    selectable: false
  });
}

export function makeScale(height, scaleLength, color, text) {
  return [
    makeLine(10, height - 10, scaleLength + 10, height - 10, 'green', 4),
    makeLine(10, height - 10, 10, height - 10 - scaleLength, 'green', 4),
    makeText(20, height - 30, 16, color, text)
  ];
}

export function makeCross(point, imageRatio, width, height) {
  return [
    makeLine(point.x / imageRatio, 0, point.x / imageRatio, height, 'yellow', 2),
    makeLine(0, point.y / imageRatio, width, point.y / imageRatio, 'yellow', 2)
  ];
}

export function makeBeam(x, y, radius) {
  return [
    new fabric.Line([x - 20, y, x + 20, y], {
      fill: 'red',
      stroke: 'red',
      strokeWidth: 1,
      selectable: false
    }),
    new fabric.Line([x, y - 20, x, y + 20], {
      fill: 'red',
      stroke: 'red',
      strokeWidth: 1,
      selectable: false
    }),
    new fabric.Circle({
      radius,
      strokeWidth: 2,
      stroke: 'blue',
      fill: '',
      left: x,
      top: y,
      selectable: false,
      originX: 'center',
      originY: 'center'
    })
  ];
}

export function makePoint(x, y, id, color, type) {
  return [
    makeCircle(x, y, id, color, type),
    makeText(x + 10, y - 25, 14, color, `P${id}`)
  ];
}
