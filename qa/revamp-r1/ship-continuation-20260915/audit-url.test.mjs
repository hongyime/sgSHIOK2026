import test from 'node:test';
import assert from 'node:assert/strict';
import { auditUrl } from './audit-url.mjs';
import { isOneMapTile } from '../request-audit-20260910/transport.mjs';

const tile = 'https://www.onemap.gov.sg/maps/tiles/Grey_HD/16/51721/32510.png';
test('ordinary tile retains exact cancellation identity', () => {
  assert.equal(auditUrl(tile), tile);
  assert.equal(isOneMapTile(auditUrl(tile)), true);
});
for (const suffix of ['?token=private-value', '#private-value']) {
  test('disqualifying tile suffix survives redaction: ' + suffix[0], () => {
    const result = auditUrl(tile + suffix);
    assert.equal(result.includes('private-value'), false);
    assert.equal(isOneMapTile(result), false);
  });
}
test('URL credentials cannot become an allowed tile', () => {
  const result = auditUrl(tile.replace('https://', 'https://private:password@'));
  assert.equal(result, 'https://redacted.invalid/credentials-present');
  assert.equal(isOneMapTile(result), false);
});
test('preview access stays private while selected walk remains identifiable', () => {
  assert.equal(auditUrl('https://preview.example/?_vercel_share=private-value&postal=018956&stop=bus%3A03501&transit=bus&route=shortest'),
    'https://preview.example/?postal=018956&transit=bus&stop=bus%3A03501&route=shortest');
});
test('malformed URLs do not throw from the protocol event handler', () => {
  assert.equal(auditUrl('bad URL'), 'invalid-url');
});
