export function makeCircle(x, y, id = "no id", color = "red", type = "TMP") {
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
    type: type,
    originX: 'center',
    originY: 'center',
    id: id
  });
}

export function makeLine(x1, y1, x2, y2) {
  return new fabric.Line([x1, y1, x2, y2], {
    fill: 'green',
    stroke: 'green',
    strokeWidth: 4,
    selectable: false
  });
}

export function makeText(x, y, fontSize) {
  return new fabric.Text("100 µm", {
    fontSize: fontSize,
    fill: 'green',
    stroke: 'green',
    left: x,
    top: y
  });
}

export function makeBeam(x, y, radius) {
  return new fabric.Circle({
    radius: radius, 
    strokeWidth: 2, 
    stroke: "blue",
    fill: '',
    left: x,
    top: y,
    selectable: false,
    originX: 'center',
    originY: 'center'
  });
}
