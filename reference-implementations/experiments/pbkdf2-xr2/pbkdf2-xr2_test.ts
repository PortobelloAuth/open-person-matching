import { assertEquals } from "@std/assert";
import { hashFindXR2, hashXR2, pbkdf2, randomBits } from "./pbkdf2-xr2.ts";

Deno.test(async function hashXR2Test() {
  const enc = new TextEncoder();
  const dec = new TextDecoder();
  const rbits = 9;

  const src = "This is the source test string";
  const salt = randomBits(12 * 8);
  const hashResult = await hashXR2(pbkdf2, rbits, enc.encode(src), salt);
  const str = dec.decode(hashResult);

  const matchedXR2 = await hashFindXR2(
    pbkdf2,
    rbits,
    enc.encode(src),
    salt,
    enc.encode(str),
  );
  assertEquals(matchedXR2.length, 1);
});
