const { test } = require('node:test');
const assert = require('node:assert/strict');
const { crc32 } = require('node:zlib');
const { repairGeneratedChecksum } = require('./nsis-uninstaller.cjs');
const { verify } = require('./verify-nsis.cjs');

test('recomputes CRC after PE stub changes without disabling integrity checks', () => {
    const executable = Buffer.alloc(1024);
    executable.write('MZ');
    executable.writeUInt32LE(1, 512);
    Buffer.from('efbeadde4e756c6c736f6674496e7374', 'hex').copy(executable, 516);
    executable.writeUInt32LE(512, 536);
    executable[600] = 42;
    const original = Buffer.from(executable);
    assert.throws(() => verify(executable), /integrity check failed/);
    repairGeneratedChecksum(executable);
    verify(executable);
    assert.deepEqual(executable.subarray(0, -4), original.subarray(0, -4));
    assert.equal(executable.readUInt32LE(1020), crc32(executable.subarray(512, 1020)));
    executable[600] = 43;
    assert.throws(() => verify(executable), /integrity check failed/);
    assert.notEqual(executable.readUInt32LE(1020), crc32(executable.subarray(512, 1020)));
});

test('rejects invalid or truncated executables', () => {
    assert.throws(() => repairGeneratedChecksum(Buffer.alloc(1024)));
    const executable = Buffer.alloc(1024);
    executable.write('MZ');
    assert.throws(() => repairGeneratedChecksum(executable));
    assert.throws(() => verify(executable));
});
