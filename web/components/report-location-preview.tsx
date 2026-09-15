"use client";

import React, { useLayoutEffect, useRef } from 'react';
import type { ReportGeometry } from '../lib/reports';

/** Local geometry only: no private report coordinates are sent to a tile provider. */
export function ReportLocationPreview({ geometry }: { geometry: ReportGeometry }) {
  const canvas = useRef<HTMLCanvasElement | null>(null);
  const points = geometry.type === 'Point' ? [geometry.coordinates] : geometry.coordinates;
  useLayoutEffect(() => {
    const context = canvas.current?.getContext('2d');
    if (!context) return;
    const width = 800, height = 320, padding = 40;
    context.clearRect(0, 0, width, height);
    context.fillStyle = '#eef3f2'; context.fillRect(0, 0, width, height);
    context.strokeStyle = '#d5dfdc'; context.lineWidth = 1;
    for (let x = 0; x < width; x += 40) { context.beginPath(); context.moveTo(x, 0); context.lineTo(x, height); context.stroke(); }
    for (let y = 0; y < height; y += 40) { context.beginPath(); context.moveTo(0, y); context.lineTo(width, y); context.stroke(); }
    const averageLat = points.reduce((sum, point) => sum + point[1], 0) / points.length;
    const cos = Math.cos(averageLat * Math.PI / 180);
    const projected = points.map(([lng, lat]) => [lng * cos, -lat]);
    const xs = projected.map(p => p[0]), ys = projected.map(p => p[1]);
    const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
    const scale = Math.min((width - 2 * padding) / Math.max(maxX - minX, 0.0001), (height - 2 * padding) / Math.max(maxY - minY, 0.0001));
    const xy = projected.map(([x, y]) => [width / 2 + (x - (maxX + minX) / 2) * scale, height / 2 + (y - (maxY + minY) / 2) * scale]);
    context.strokeStyle = '#126a77'; context.lineWidth = 6; context.lineJoin = 'round'; context.lineCap = 'round';
    context.beginPath(); xy.forEach(([x, y], index) => { if (index === 0) context.moveTo(x, y); else context.lineTo(x, y); }); context.stroke();
    xy.forEach(([x, y], index) => {
      context.beginPath(); context.arc(x, y, index === 0 || index === xy.length - 1 ? 8 : 4, 0, Math.PI * 2);
      context.fillStyle = index === 0 ? '#9b344c' : '#126a77'; context.fill();
    });
    context.font = '600 20px system-ui'; context.fillStyle = '#35453f'; context.fillText('N', width - 34, 28);
  }, [geometry]);
  return <figure style={{ margin: 0 }}>
    <canvas ref={canvas} width={800} height={320} role="img" aria-label={geometry.type === 'Point' ? 'Reported point, north up' : `Reported section with ${points.length} points, north up`}
      style={{ width: '100%', height: 'auto', aspectRatio: '5 / 2', display: 'block', border: '1px solid #d5dfdc', borderRadius: 4 }} />
    <details><summary>Coordinates</summary><ol style={{ margin: '0 0 8px', paddingLeft: 24 }}>
      {points.map(([lng, lat], index) => <li key={index}>{lat}, {lng}</li>)}
    </ol></details>
  </figure>;
}
