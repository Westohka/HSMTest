import BN from 'bn.js';
const asn1 = require('asn1.js');

const secp256k1n = new BN('fffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141', 16);
const secp256k1n_2 = new BN('7fffffffffffffffffffffffffffffff5d576e7357a4501ddfe92f46681b20a0', 16);

export const SGreaterThenSecp256k1n = (S: BN) => S.cmp(secp256k1n_2) === 1;

export const Eip2SParamRecalculate = (S: BN): BN => (SGreaterThenSecp256k1n(S) ? secp256k1n.sub(S) : S);

export const getRSFromSignature = (signature: Buffer, isDerEncoded = true, encoding = 'hex'): {R: Buffer, S: Buffer} => {
  const result = { R: null, S: null };
  if (signature.byteLength < 64) {
    throw new Error('Wrong signature length');
  }

  if (isDerEncoded) {
    const EcdsaDerSig = asn1.define('EC', function () {
      return this.seq().obj(
        this.key('r').int(),
        this.key('s').int()
      );
    });
    const der = EcdsaDerSig.decode(signature, 'der');
    result.R = der.r.toBuffer();
    result.S = der.s;
  }
  else {
    result.R = signature.slice(0, 32);
    result.S = new BN(signature.slice(32, 64).toString('hex'), 16);
  }

  result.S = Eip2SParamRecalculate(result.S).toBuffer('be', 32);

  return result;
};

export const getRlpSignature = (signature: Buffer, v: Buffer): Buffer => {
  const result = { R: null, S: null };
  if (signature.byteLength < 64) {
    throw new Error('Wrong signature length');
  }

  const EcdsaDerSig = asn1.define('EC', function () {
    return this.seq().obj(
      this.key('r').int(),
      this.key('s').int()
    );
  });
  const der = EcdsaDerSig.decode(signature, 'der');
  result.R = der.r.toBuffer();
  result.S = der.s;

  result.S = Eip2SParamRecalculate(result.S).toBuffer('be', 32);

  const rlpSignature = Buffer.concat([result.R, result.S, v]);
  return rlpSignature;
};
