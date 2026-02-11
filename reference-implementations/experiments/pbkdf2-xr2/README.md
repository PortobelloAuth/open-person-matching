# PBKDF2 XR2: PBKDF2 of PBKDF2 + random bits

1. Base hash is hash of routing salt and routing key demographic + complex
   demographic + other demographic(s)
2. Concatenate base hash with 8+ random bits and the hash again

## Overcome length extension and possibly complexity challenges

Legitimate responders must calculate the base hash with data that they have and
then calculate 2^n (where n is the number of random bits) hashes to figure out
which random bits were chosen. Because base hash is 256 (or more) hash bits that
an attacker can’t calculate and are difficult to distinguish between correct and
incorrect, complexity is at least the complexity of the unknown inputs to the
base hash multiplied by 2^n. Length extension doesn’t work because the random
bits are added at the intermediate stage, so the final hash has a fixed length
input and the base hash isn’t known.

The responder must send back a hash proving that they know the correct random
bits.
