const bitmasks = {
  ff64 : 0xffffffffffffffffn,
  ff32 : 0xffffffffn,
  ff16 : 0xffffn,
  ff8  : 0xffn,
}

class MSWSState {
  x : bigint;
  w : bigint;
  s : bigint;

  /**
   Note: s must be uneven for a proper Msws sequence
   * @param x : bigint (int)
   * @param w : bigint (int)
   * @param s : bigint (int)
   */
  constructor(x : bigint, w : bigint, s : bigint) {
    // these numbers are limited to uint64
    // we assume these are all bigint
    this.x = x & bitmasks.ff64
    this.w = w & bitmasks.ff64
    this.s = s & bitmasks.ff64
  }
}

const seed_constants = [
  0x37e1c9b5e1a2b843n, 0x56e9d7a3d6234c87n, 0xc361be549a24e8c7n, 0xd25b9768a1582d7bn,
  0x18b2547d3de29b67n, 0xc1752836875c29adn, 0x4e85ba61e814cd25n, 0x17489dc6729386c1n,
  0x7c1563ad89c2a65dn, 0xcdb798e4ed82c675n, 0xd98b72e4b4e682c1n, 0xdacb7524e4b3927dn,
  0x53a8e9d7d1b5c827n, 0xe28459db142e98a7n, 0x72c1b3461e4569dbn, 0x1864e2d745e3b169n,
  0x6a2c143bdec97213n, 0xb5e1d923d741a985n, 0xb4875e967bc63d19n, 0x92b64d5a82db4697n,
  0x7cae812d896eb1a5n, 0xb53827d41769542dn, 0x6d89b42c68a31db5n, 0x75e26d434e2986d5n,
  0x7c82643d293cb865n, 0x64c3bd82e8637a95n, 0x2895c34d9dc83e61n, 0xa7d58c34dea35721n,
  0x3dbc5e687c8e61d5n, 0xb468a235e6d2b193n,
]

/**
 * As we need consistent cross-platform pseudo random number generation. This is a port of the
 * Middle Square Weyl Sequence Random Number Generator found on https://mswsrng.wixsite.com/rand .
 */
export class RandomGeneratorMSWS {

  seed: bigint;
  state: MSWSState

  constructor(seed : number | string = null) {
    if (seed === null) {
      this.seed = 0xb5ad4eceda1ce2a9n;
      this.state = new MSWSState(BigInt(0),BigInt(0), this.seed);
    }
    else {
      this.seed = BigInt(seed);
      this.state = RandomGeneratorMSWS._setSeed(this.seed);
    }


  }

  get() : bigint {
    return RandomGeneratorMSWS._msws(this.state);
  }

  /**
   * Returns random value and updates the state objects internals values.
   * @param state
   *
   * Returns int32 limited
   */
  static _msws(state : MSWSState) : bigint {
    state.x = (state.x * state.x) & bitmasks.ff64
    state.w = (state.w + state.s) & bitmasks.ff64
    state.x = (state.x + state.w) & bitmasks.ff64
    state.x = ((state.x >> 32n) | (state.x << 32n)) & bitmasks.ff64
    let result = state.x & bitmasks.ff32
    return result
  }

  static _setSeed(seed: bigint) {
    let n = seed & bitmasks.ff64;
    let r = BigInt(n / 100000000n);
    let t = BigInt(n % 100000000n);

    let q = BigInt(seed_constants.length);
    let si = seed_constants[Number(r % q)] // must be uneven (true for given values in seed_constants)
    r = r/q
    let wi = t * si + r * si * 100000000n;
    let xi = wi

    let mswsi = new RandomGeneratorMSWS()
    mswsi.state = new MSWSState(xi, wi, si)

    // get odd random number for low order digit
    let u = (mswsi.get() % 8n) * 2n + 1n;
    let v = 1n << u;

    // get rest of digits
    let m = 60n
    let c = 0n
    while (m > 0) {
      let j = mswsi.get() // get 8 digit 32-bit random word

      for (let i = 0n; i < 32; i += 4n) {
        let k = (j >> i) & 0xfn // get a digit
        if (k != 0n && (c & (1n << k)) == 0n) { // not 0 and not previous
          c |= (1n << k)
          u |= (k << m) // add digit to output
          m -= 4n
          if (m == 24n || m == 28n) {
            c = (1n << k) | v
          }
          if (m == 0n) {
            break
          }
        }
      }
    }

    return new MSWSState(u, u, u);
  }

}