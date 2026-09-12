export function ready(snapshot) {
  return snapshot?.status === 'ready' && snapshot.featureCount === 4
    && typeof snapshot.routeKey === 'string' && snapshot.routeKey.length > 0
    && snapshot.renderedKeys?.length === 1 && snapshot.renderedKeys[0] === snapshot.routeKey
    && snapshot.basemap === true && snapshot.tiles === true && snapshot.moving === false;
}
export function stablePair(before, after) {
  return ready(before) && ready(after) && before.routeKey === after.routeKey
    && before.timeOrigin === after.timeOrigin && before.url === after.url
    && JSON.stringify(before.viewport) === JSON.stringify(after.viewport);
}
export function settleCounter() {
  let previous, count = 0;
  return snapshot => {
    count = previous && stablePair(previous, snapshot) ? count + 1 : ready(snapshot) ? 1 : 0;
    previous = snapshot;
    return count >= 3;
  };
}
