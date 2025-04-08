import 'fabric';

const { fabric } = globalThis;

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
    hoverCursor: 'crosshair',
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
    fill: '',
    stroke: color,
    strokeWidth: 2,
    selectable: false,
    hoverCursor: 'crosshair',
  });
}

export function makeCircle(
  x,
  y,
  selectable,
  radius,
  color,
  id,
  type,
  text,
  strokeWidth,
) {
  return new fabric.Circle({
    radius,
    strokeWidth,
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
    defaultColor: color,
    hasControls: false,
    hasBorders: false,
    id,
    text,
  });
}

export function makeLine(
  x1,
  y1,
  x2,
  y2,
  col,
  wid,
  select,
  id,
  text,
  type,
  hover = 'crosshair',
) {
  return new fabric.Line([x1, y1, x2, y2], {
    fill: col,
    stroke: col,
    defaultColor: col,
    strokeWidth: wid,
    originX: 'center',
    originY: 'center',
    lockMovementX: true,
    lockMovementY: true,
    lockScalingFlip: true,
    lockScalingX: true,
    lockScalingY: true,
    hasRotatingPoint: false,
    type,
    selectable: select,
    hoverCursor: hover,
    hasControls: false,
    hasBorders: false,
    id,
    text,
  });
}

export function makeArrow(line, col, _select, _id, hover = 'crosshair') {
  const dist = Math.hypot(line.x1 - line.x2, line.y1 - line.y2);
  const angledeg =
    (Math.atan2(line.y1 - line.y2, line.x1 - line.x2) * 180) / Math.PI;
  const deltaX = dist * 0.99 * Math.cos((angledeg * Math.PI) / 180);
  const deltaY = dist * 0.99 * Math.sin((angledeg * Math.PI) / 180);
  return new fabric.Triangle({
    left: line.get('x1') - deltaX,
    top: line.get('y1') - deltaY,
    fill: col,
    stroke: col,
    defaultColor: col,
    originX: 'center',
    originY: 'center',
    hasBorders: false,
    hasControls: false,
    lockScalingX: true,
    lockScalingY: true,
    hasRotatingPoint: false,
    pointType: 'arrow_start',
    angle: angledeg - 90,
    width: 7,
    height: 10,
    hoverCursor: hover,
  });
}

export function makeAnchor(line, col, _select, _id, hover = 'crosshair') {
  const angledeg =
    (Math.atan2(line.y1 - line.y2, line.x1 - line.x2) * 180) / Math.PI;
  return new fabric.Rect({
    left: line.get('x1'),
    top: line.get('y1'),
    fill: col,
    stroke: col,
    defaultColor: col,
    originX: 'center',
    originY: 'center',
    hasBorders: false,
    hasControls: false,
    lockScalingX: true,
    lockScalingY: true,
    hasRotatingPoint: false,
    pointType: 'arrow_start',
    angle: angledeg - 90,
    width: 7,
    height: 2,
    hoverCursor: hover,
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
    hoverCursor: 'crosshair',
    hasBorders: false,
    fontFamily: 'Arial',
  });
}

export function makeScale(height, scaleLengthX, scaleLengthY, text) {
  return [
    makeLine(
      10,
      height - 10,
      scaleLengthX + 10,
      height - 10,
      'rgba(0, 255, 255, 1)',
      4,
      false,
    ),
    makeLine(
      10,
      height - 10,
      10,
      height - 10 - scaleLengthY,
      'rgba(0, 255, 255, 1)',
      4,
      false,
    ),
    makeText(20, height - 30, 16, 'rgba(0, 255, 255, 1)', text),
  ];
}

export function makeCross(x, y, imageRatio, width, height) {
  return [
    makeLine(
      x * imageRatio,
      0,
      x * imageRatio,
      height,
      'rgba(255,255,0,0.5)',
      2,
      false,
    ),
    makeLine(
      0,
      y * imageRatio,
      width,
      y * imageRatio,
      'rgba(255,255,0,0.5)',
      2,
      false,
    ),
  ];
}

export function makeCentringVerticalLine(x, _y, imageRatio, height) {
  return makeLine(
    x * imageRatio,
    0,
    x * imageRatio,
    height,
    'rgba(255,255,0,0.5)',
    2,
    false,
  );
}

export function makeCentringHorizontalLine(_x, y, imageRatio, width) {
  return makeLine(
    0,
    y * imageRatio,
    width,
    y * imageRatio,
    'rgba(255,255,0,0.5)',
    2,
    false,
  );
}

export function makeBeam(posX, posY, sizeX, sizeY, shape) {
  return [
    makeLine(posX - 3, posY, posX - 10, posY, 'rgba(0, 255, 255, 1)', 2, false),
    makeLine(posX, posY - 3, posX, posY - 10, 'rgba(0, 255, 255, 1)', 2, false),
    makeLine(posX + 3, posY, posX + 10, posY, 'rgba(0, 255, 255, 1)', 2, false),
    makeLine(posX, posY + 3, posX, posY + 10, 'rgba(0, 255, 255, 1)', 2, false),
    shape === 'ellipse'
      ? makeElipse(posX, posY, sizeX, sizeY, 'rgba(255, 0, 255)')
      : makeRectangle(posX, posY, sizeX, sizeY, 'rgba(255, 0, 255, 1)'),
  ];
}

export function makeDistanceLine(p1, p2, iR, ppMm, color, width) {
  const a = (p1.x - p2.x) / ppMm[0];
  const b = (p1.y - p2.y) / ppMm[1];
  const length = Number.parseInt(Math.hypot(a, b) * 1000, 10);
  return [
    makeLine(p1.x * iR, p1.y * iR, p2.x * iR, p2.y * iR, color, width, false),
    makeText(p2.x * iR, p2.y * iR, 14, color, `${length} µm`),
  ];
}

export function makePoint(x, y, id, color, type, name, strokeWidth) {
  const text = makeText(x + 10, y - 25, 14, color, name);
  const circle = makeCircle(x, y, true, 10, color, id, type, text, strokeWidth);
  return [circle, text];
}

export function makePoints(points, imageRatio) {
  const fabricPoints = [];

  // eslint-disable-next-line guard-for-in
  for (const id in points) {
    const [x, y] = points[id].screenCoord;
    switch (points[id].state) {
      case 'SAVED': {
        fabricPoints.push(
          ...makePoint(
            x * imageRatio,
            y * imageRatio,
            id,
            points[id].selected ? '#88ff5b' : '#e4ff09',
            'SAVED',
            points[id].name,
            points[id].selected ? 3 : 2,
          ),
        );
        break;
      }
      case 'TMP': {
        fabricPoints.push(
          ...makePoint(
            x * imageRatio,
            y * imageRatio,
            id,
            'white',
            'TMP',
            points[id].name,
            points[id].selected ? 3 : 2,
          ),
        );
        break;
      }
      default: {
        throw new Error('Server gave point with unknown type');
      }
    }
  }
  return fabricPoints;
}

export function makeTwoDPoints(points, imageRatio) {
  const fabricPoints = [];
  // eslint-disable-next-line guard-for-in
  for (const id in points) {
    const [x, y] = points[id].screenCoord;

    switch (points[id].state) {
      case 'SAVED': {
        fabricPoints.push(
          ...makePoint(
            x * imageRatio,
            y * imageRatio,
            id,
            points[id].selected ? '#88ff5b' : '#33BEFF',
            'SAVED',
            points[id].name,
            points[id].selected ? 3 : 2,
          ),
        );
        break;
      }
      case 'TMP': {
        fabricPoints.push(
          ...makePoint(
            x * imageRatio,
            y * imageRatio,
            id,
            'white',
            'TMP',
            points[id].name,
            points[id].selected ? 3 : 2,
          ),
        );
        break;
      }
      default: {
        throw new Error('Server gave point with unknown type');
      }
    }
  }
  return fabricPoints;
}

export function pointLine(
  x1,
  y1,
  x2,
  y2,
  color,
  width,
  selectable,
  id,
  name,
  cursor,
) {
  const text = makeText((x1 + x2) / 2, (y1 + y2) / 2, 14, color, name);
  const line = makeLine(
    x1,
    y1,
    x2,
    y2,
    color,
    width,
    selectable,
    id,
    text,
    'LINE',
    cursor,
  );
  const arrow = makeArrow(line, color, selectable, id);
  const anchor = makeAnchor(line, color, selectable, id);
  return [text, line, arrow, anchor];
}

export function makeLines(lines, imageRatio) {
  const fabricLines = [];
  Object.keys(lines).forEach((id) => {
    const line = lines[id];
    const [x1, y1, x2, y2] = line.screenCoord;

    fabricLines.push(
      ...pointLine(
        x1 * imageRatio,
        y1 * imageRatio,
        x2 * imageRatio,
        y2 * imageRatio,
        line.selected ? '#88ff5b' : '#e4ff09',
        line.selected ? 3 : 2,
        true,
        id,
        line.name,
        'pointer',
      ),
    );
  });
  return fabricLines;
}

export function makeImageOverlay(iR, ppMm, bP, bSh, bSi, cCP, dP, canvas) {
  const imageOverlay = [];
  const scaleLengthX = 0.05 * ppMm[0] * iR;
  const scaleLengthY = 0.05 * ppMm[1] * iR;

  imageOverlay.push(
    ...makeBeam(
      bP[0] * iR,
      bP[1] * iR,
      bSi.x * ppMm[0] * iR,
      bSi.y * ppMm[1] * iR,
      bSh,
    ),
    ...makeScale(canvas.height, scaleLengthX, scaleLengthY, '50 µm'),
  );
  if (cCP.length > 0) {
    const point = cCP[cCP.length - 1];
    imageOverlay.push(...makeCross(point, iR, canvas.width, canvas.height));
  }
  if (dP.length === 2) {
    const [point1, point2] = dP;
    imageOverlay.push(...makeDistanceLine(point1, point2, iR, ppMm, 'red', 2));
  }
  return imageOverlay;
}
