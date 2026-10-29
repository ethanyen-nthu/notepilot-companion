import { GatewayError } from './openai.mjs';
// Read JPEG frame dimensions without decompressing untrusted pixels.
export function validateJPEG(bytes) {
  if (bytes[0] !== 0xff || bytes[1] !== 0xd8)
    throw new GatewayError(400, 'invalid_image', 'Expected a JPEG crop.');
  let offset = 2;
  while (offset + 4 <= bytes.length) {
    if (bytes[offset++] !== 0xff) break;
    while (bytes[offset] === 0xff) offset++;
    const marker = bytes[offset++];
    if (marker === 0xda || marker === 0xd9) break;
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) continue;
    if (offset + 2 > bytes.length) break;
    const length = bytes.readUInt16BE(offset);
    if (length < 2 || offset + length > bytes.length) break;
    if ([0xc0, 0xc1, 0xc2].includes(marker) && length >= 8) {
      const height = bytes.readUInt16BE(offset + 3),
        width = bytes.readUInt16BE(offset + 5);
      if (width < 1 || height < 1 || width > 2048 || height > 2048)
        throw new GatewayError(
          413,
          'dimensions',
          'Image dimensions must be at most 2048 pixels per side.',
        );
      return { width, height };
    }
    offset += length;
  }
  throw new GatewayError(400, 'invalid_image', 'JPEG dimensions could not be validated.');
}
