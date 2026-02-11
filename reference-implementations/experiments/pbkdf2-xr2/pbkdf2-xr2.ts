// This implementation is written in Typsescript to run in Deno. It will
// need to be converted to javascript in order to run in most environments.
// It deliberately uses the Web Subtle Crypto implementation available in Deno
// and most modern web browsers.

const bitmasks = [
  1,
  2,
  4,
  8,
  16,
  32,
  64,
  128,
];

export function randomBits(numBits: number): Uint8Array<ArrayBuffer> {
  const nBytes = Math.ceil(numBits / 8);
  const bytes = new Uint8Array(nBytes);
  crypto.getRandomValues(bytes);
  // set the bits we are not using to 0
  const lastByteIdx = bytes.length - 1;
  const lastByte = bytes[lastByteIdx];
  const nExtraBits = (nBytes * 8) - numBits;
  if (nExtraBits > 0) {
    const maskBits = 8 - nExtraBits;
    let mask = 0;
    for (let midx = 0; midx < maskBits; midx++) {
      mask = mask + bitmasks[midx];
    }
    bytes[lastByteIdx] = lastByte & mask;
  }

  return bytes;
}

type HashFn = (
  src: Uint8Array<ArrayBuffer>,
  salt: Uint8Array<ArrayBuffer>,
) => Promise<ArrayBuffer>;

export async function hashXR2(
  hash: HashFn,
  numBits: number,
  src: Uint8Array<ArrayBuffer>,
  salt: Uint8Array<ArrayBuffer>,
): Promise<ArrayBuffer> {
  const bits = randomBits(numBits);
  return await hashSaltPepper(hash, src, salt, bits);
}

export async function hashFindXR2(
  hash: HashFn,
  numBits: number,
  src: Uint8Array<ArrayBuffer>,
  salt: Uint8Array<ArrayBuffer>,
  find: Uint8Array<ArrayBuffer>,
): Promise<Uint8Array[]> {
  const max = 1n << BigInt(numBits);
  const nBytes = Math.ceil(numBits / 8);

  const dec = new TextDecoder();
  const f = dec.decode(find);
  const found: Uint8Array[] = [];

  for (let p = 0n; p < max; p++) {
    const pepper = new Uint8Array(nBytes);
    for (let i = 0; i < nBytes; i++) {
      const shifted = p >> BigInt(i) * 8n;
      pepper[i] = Number(shifted & 0xffn);
    }

    const r = dec.decode(await hashSaltPepper(hash, src, salt, pepper));
    if (r == f) {
      // NOTE: not doing an early return to see if we have more than one match
      // and to ensure that finding matches always takes roughly the same amount
      // of time
      found.push(pepper);
    }
  }

  return found;
}

export async function hashSaltPepper(
  hash: HashFn,
  src: Uint8Array<ArrayBuffer>,
  salt: Uint8Array<ArrayBuffer>,
  pepper: Uint8Array<ArrayBuffer>,
): Promise<ArrayBuffer> {
  const base = await hash(src, salt);

  const layer2 = new Uint8Array(base.byteLength + pepper.byteLength);
  layer2.set(new Uint8Array(base), 0);
  layer2.set(pepper, base.byteLength);
  return hash(layer2, salt);
}

export async function pbkdf2(
  source: Uint8Array<ArrayBuffer>,
  salt: Uint8Array<ArrayBuffer>,
): Promise<ArrayBuffer> {
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    source,
    "PBKDF2",
    false,
    ["deriveBits", "deriveKey"],
  );

  const key = await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"],
  );

  const exbuf = await crypto.subtle.exportKey("raw", key);
  return exbuf;
}
