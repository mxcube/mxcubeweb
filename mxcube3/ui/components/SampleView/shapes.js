import 'fabric';
const fabric = window.fabric;

export function makeRectangle(posX, posY, sizeX, sizeY, color) {
  return new fabric.Rect({
    left: posX,
    top: posY,
    originX: 'center',
    originY: 'center',
    width: sizeX,
    height: sizeY,
    fill: '',
    stroke: color,
    strokeWidth: 3,
    selectable: false,
    hoverCursor: 'crosshair'
  });
}

export function makeElipse(posX, posY, sizeX, sizeY, color) {
  return new fabric.Ellipse({
    left: posX,
    top: posY,
    originX: 'center',
    originY: 'center',
    rx: sizeX / 2,
    ry: sizeY / 2,
    angle: 0,
    fill: '',
    stroke: color,
    strokeWidth: 3,
    selectable: false,
    hoverCursor: 'crosshair'
  });
}

export function makeCircle(x, y, selectable, radius, color = 'red', id = 'no id', type = 'TMP') {
  return new fabric.Circle({
    radius,
    strokeWidth: 2,
    stroke: color,
    fill: '',
    left: x,
    top: y,
    selectable,
    lockMovementX: true,
    lockMovementY: true,
    lockScalingFlip: true,
    lockScalingX: true,
    lockScalingY: true,
    hoverCursor: 'pointer',
    type,
    originX: 'center',
    originY: 'center',
    hasRotatingPoint: false,
    id
  });
}

export function makeLine(x1, y1, x2, y2, color, width) {
  return new fabric.Line([x1, y1, x2, y2], {
    fill: color,
    stroke: color,
    strokeWidth: width,
    selectable: false,
    hoverCursor: 'crosshair'
  });
}

export function makeText(x, y, fontSize, color, text) {
  return new fabric.Text(text, {
    fontSize,
    fill: color,
    stroke: color,
    left: x,
    top: y,
    selectable: false,
    hoverCursor: 'crosshair'
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

export function makeBeam(posX, posY, sizeX, sizeY, shape) {
  return [
    makeLine(posX - 20, posY, posX + 20, posY, 'red', 1),
    makeLine(posX, posY - 20, posX, posY + 20, 'red', 1),
    (shape === 'ellipse' ?
      makeElipse(posX, posY, sizeX, sizeY, 'blue') :
      makeRectangle(posX, posY, sizeX, sizeY, 'blue'))
  ];
}

export function makeDistanceLine(p1, p2, iR, ppMm, color, width) {
  const a = p1.x - p2.x;
  const b = p1.y - p2.y;
  const length = parseInt(Math.sqrt(a * a + b * b) / ppMm * 1000, 10);
  return [
    makeLine(p1.x / iR, p1.y / iR, p2.x / iR, p2.y / iR, color, width),
    makeText(p2.x / iR, p2.y / iR, 12, color, `${length} µm`)
  ];
}

export function makePoint(x, y, id, color, type) {
  return [
    makeCircle(x, y, true, 10, color, id, type),
    makeText(x + 10, y - 25, 14, color, `P${id}`)
  ];
}

export function makePoints(points, imageRatio) {
  const fabricPoints = [];
  for (const id in points) {
    if ({}.hasOwnProperty.call(points, id)) {
      switch (points[id].type) {
        case 'SAVED':
          fabricPoints.push(
            ...makePoint(points[id].x / imageRatio,
              points[id].y / imageRatio, id,
              'yellow',
              'SAVED'
            )
          );
          break;
        case 'TMP':
          fabricPoints.push(
            ...makePoint(
              points[id].x / imageRatio,
              points[id].y / imageRatio,
              id,
              'white',
              'TMP'
            )
          );
          break;
        default:
          throw new Error('Server gave point with unknown type');
      }
    }
  }
  return fabricPoints;
}

export function makeImageOverlay(iR, ppMm, bP, bSh, bSi, cCP, dP, canvas) {
  const imageOverlay = [];
  const scaleLength = 0.05 * ppMm / iR;
  imageOverlay.push(
    ...makeBeam(
      bP[0] / iR,
      bP[1] / iR,
      bSi.x * ppMm / iR,
      bSi.y * ppMm / iR,
      bSh
      )
    );
  imageOverlay.push(...makeScale(canvas.height, scaleLength, 'green', '50 µm'));
  if (cCP.length) {
    const point = cCP[cCP.length - 1];
    imageOverlay.push(...makeCross(point, iR, canvas.width, canvas.height));
  }
  if (dP.length === 2) {
    const point1 = dP[0];
    const point2 = dP[1];
    imageOverlay.push(...makeDistanceLine(point1, point2, iR, ppMm, 'red', 2));
  }
  return imageOverlay;
}
