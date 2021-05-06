import {DataWriter} from "../../util/DataWriter";


export class CuckooFilterPacketData {

  bucketCountLog2: number;
  nestsPerBucket: number;
  victim: CuckooExtendedFingerprintData;
  bucketArray : number[]

  constructor(bucketCountLog2 : number, nestsPerBucket : number, victim : CuckooExtendedFingerprint, bucketArray: number[]) {
    this.bucketCountLog2 = bucketCountLog2;
    this.nestsPerBucket = nestsPerBucket;
    this.victim = new CuckooExtendedFingerprintData(victim);
    this.bucketArray = bucketArray
  }

  getPacket() : Buffer {
    let writer = new DataWriter(2 + 2*this.bucketArray.length)
    writer.putUInt8(this.bucketCountLog2)
    writer.putUInt8(this.nestsPerBucket)
    writer.putBuffer(this.victim.getPacket())
    for (let item of this.bucketArray) {
      writer.putUInt16(item);
    }
    return writer.getBuffer();
  }
}


export class CuckooExtendedFingerprintData {
  fingerprint: number;
  bucketA: number;
  bucketB: number;

  constructor(fingerprint: number | CuckooExtendedFingerprint, bucketA?: number, bucketB?: number) {
    if (typeof fingerprint === 'number') {
      this.fingerprint = fingerprint;
      this.bucketA = bucketA;
      this.bucketB = bucketB;
    }
    else {
      this.fingerprint = fingerprint.fingerprint;
      this.bucketA = fingerprint.bucketA;
      this.bucketB = fingerprint.bucketB;
    }
  }

  getPacket() : Buffer {
    let writer = new DataWriter(4);
    writer.putUInt16(this.fingerprint);
    writer.putUInt8(this.bucketA);
    writer.putUInt8(this.bucketB);
    return writer.getBuffer()
  }
}
