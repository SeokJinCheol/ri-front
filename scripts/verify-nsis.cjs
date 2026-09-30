const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { promisify } = require('node:util');
const { execFile } = require('node:child_process');
const { crc32 } = require('node:zlib');
const { getPath7za } = require('app-builder-lib/out/toolsets/7zip');
const execute = promisify(execFile);

function verify(buffer) {
    const signature = Buffer.from('efbeadde4e756c6c736f6674496e7374', 'hex');
    const offset = buffer.indexOf(signature) - 4;
    if (offset < 512 || offset % 512 || offset + 28 > buffer.length) {
        throw new Error('Invalid NSIS executable');
    }
    if (buffer.readUInt32LE(offset) & 4) throw new Error('NSIS CRC check is disabled');
    const end = offset + buffer.readUInt32LE(offset + 24);
    if (end > buffer.length || end < offset + 32) throw new Error('Truncated NSIS executable');
    if (buffer.readUInt32LE(end - 4) !== crc32(buffer.subarray(512, end - 4))) {
        throw new Error('NSIS integrity check failed');
    }
}

module.exports = async function verifyArtifact(event) {
    if (!event.file.endsWith('.exe')) return;
    verify(await fs.readFile(event.file));
    const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'ri-nsis-verify-'));
    try {
        await execute(await getPath7za(), [
            'e',
            event.file,
            `-o${directory}`,
            '$R0/Uninstall Real Iron.exe',
            '-y',
        ]);
        verify(await fs.readFile(path.join(directory, 'Uninstall Real Iron.exe')));
        console.log('Verified packaged installer and uninstaller CRCs');
    } finally {
        await fs.rm(directory, { recursive: true, force: true });
    }
};
module.exports.verify = verify;
