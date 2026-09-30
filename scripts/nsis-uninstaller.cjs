const fs = require('node:fs/promises');
const { crc32 } = require('node:zlib');

function checksumLocation(buffer) {
    if (buffer.toString('ascii', 0, 2) !== 'MZ') throw new Error('Invalid PE executable');
    const signature = Buffer.from('efbeadde4e756c6c736f6674496e7374', 'hex');
    const offset = buffer.indexOf(signature) - 4;
    if (offset < 512 || offset % 512 !== 0 || offset + 28 > buffer.length) {
        throw new Error('Invalid NSIS header');
    }
    const flags = buffer.readUInt32LE(offset);
    if (!(flags & 1) || flags & 4) throw new Error('Expected CRC-enabled NSIS uninstaller');
    const end = offset + buffer.readUInt32LE(offset + 24);
    if (end !== buffer.length) throw new Error('Unexpected NSIS uninstaller size');
    return end - 4;
}

function repairGeneratedChecksum(buffer) {
    const location = checksumLocation(buffer);
    // NSIS excludes the first 512 bytes and the trailing CRC field.
    // Only called on fresh UninstallerReader output, before signing/embedding.
    buffer.writeUInt32LE(crc32(buffer.subarray(512, location)), location);
    return buffer;
}

let installed = false;
module.exports = async function beforePack(context) {
    if (process.platform !== 'darwin' || context.electronPlatformName !== 'win32' || installed) return;
    const { UninstallerReader } = require('app-builder-lib/out/targets/nsis/nsisUtil');
    const original = UninstallerReader.exec;
    // electron-builder 26.15.3 concatenates the PE stub and NSIS data but retains
    // the CRC for the original stub. Recalculate after that composition.
    UninstallerReader.exec = async function (installerPath, uninstallerPath) {
        await original.call(this, installerPath, uninstallerPath);
        const buffer = await fs.readFile(uninstallerPath);
        await fs.writeFile(uninstallerPath, repairGeneratedChecksum(buffer));
        console.log('Verified generated NSIS uninstaller CRC');
    };
    installed = true;
};
module.exports.repairGeneratedChecksum = repairGeneratedChecksum;
