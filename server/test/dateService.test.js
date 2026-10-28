import { describe, it } from 'node:test';
import assert from 'node:assert';
import { resolveDate } from '../src/services/dateService.js';

describe('dateService', () => {
  it('resolves Friday when today is Wednesday 2026-10-28 to 2026-10-30', () => {
    // 2026-10-28 is Wednesday
    const wednesday = new Date('2026-10-28T10:00:00+05:30');
    const res = resolveDate('Friday', wednesday);
    assert.strictEqual(res.iso, '2026-10-30');
    assert.strictEqual(res.friendly, 'Fri, 30 Oct 2026');
    assert.strictEqual(res.phrase, 'Friday');
  });

  it('resolves Friday when today is Friday 2026-10-30 to following Friday 2026-11-06', () => {
    const friday = new Date('2026-10-30T10:00:00+05:30');
    const res = resolveDate('Friday', friday);
    assert.strictEqual(res.iso, '2026-11-06');
    assert.strictEqual(res.friendly, 'Fri, 6 Nov 2026');
  });

  it('resolves today and tomorrow', () => {
    const base = new Date('2026-10-28T10:00:00+05:30');
    const today = resolveDate('today', base);
    const tomorrow = resolveDate('tomorrow', base);
    assert.strictEqual(today.iso, '2026-10-28');
    assert.strictEqual(tomorrow.iso, '2026-10-29');
  });

  it('resolves "in 3 days"', () => {
    const base = new Date('2026-10-28T10:00:00+05:30');
    const res = resolveDate('in 3 days', base);
    assert.strictEqual(res.iso, '2026-10-31');
  });

  it('throws for unparseable date phrase', () => {
    const base = new Date('2026-10-28T10:00:00+05:30');
    assert.throws(() => {
      resolveDate('some invalid phrase xyz', base);
    }, /Unable to resolve date phrase/);
  });
});
