import {Util} from "../util/Util";
import {RandomGeneratorMSWS} from "./randomGenerator";
import {CuckooFilterPacketData} from "../packets/filter/FilterPackets";

export class ExtendedFingerprint implements CuckooExtendedFingerprint{
  fingerprint : number;
  bucketA : number;
  bucketB : number;
  constructor(fingerprint : number, bucketA : number, bucketB : number) {
    this.fingerprint = fingerprint;
    this.bucketA = bucketA;
    this.bucketB = bucketB;
  }
}

export class CuckooFilter {

  max_kick_attempts : number = 100;

  bucketCountLog2 : number;
  bucketCount : number;
  nestPerBucket: number;
  victim : ExtendedFingerprint;
  bucketArray : number[] = [];

  constructor(bucketCountLog2: number, nestPerBucket: number) {
    this.bucketCountLog2 = bucketCountLog2;
    this.bucketCount = 1 << this.bucketCountLog2;
    this.nestPerBucket = nestPerBucket;
    this.victim = new ExtendedFingerprint(0,0,0);
    this.bucketArray = [];

    this.clear();
  }


  clear() {
    this.victim = new ExtendedFingerprint(0, 0, 0)
    this.bucketArray = new Array(this.getFingerPrintCount());
    for (let i = 0; i < this.bucketArray.length; i++) {
      this.bucketArray[i] = 0;
    }
  }

  getFingerPrintCount() {
    return this.bucketCount * this.nestPerBucket
  }

  hash(data: Buffer | number[]) {
    return Util.crc16_ccitt(data)
  }


  add(key: number[] | Buffer) : boolean {
    return this.addExtendedFingerprint(this.getExtendedFingerprint(key))
  }

  getExtendedFingerprint(key : number[] | Buffer) {
    let fingerprint = this.hash(key);

    let bytes = Buffer.alloc(2);
        bytes.writeUInt16LE(fingerprint,0);

    let hashed_fingerprint = this.hash(bytes);

    return new ExtendedFingerprint(
      fingerprint,
      hashed_fingerprint % this.bucketCount,
      (hashed_fingerprint ^ fingerprint) % this.bucketCount)
  }

  getExtendedFingerprintFromFingerprintAndBucket(fingerprint, bucketIndex) {
    let bucket_a = (bucketIndex % this.bucketCount) & 0xff;
    let bucket_b =((bucketIndex ^ fingerprint) % this.bucketCount) & 0xff;
    return new ExtendedFingerprint(fingerprint, bucket_a, bucket_b)
  }

  addExtendedFingerprint(fingerprint : ExtendedFingerprint) : boolean {
    if (this.containsExtendedFingerprint(fingerprint)) {
      return true;
    }

    if (this.victim.fingerprint != 0) {
      return false;
    }

    return this.moveExtendedFingerprint(fingerprint);
  }

  containsExtendedFingerprint(fingerprint: ExtendedFingerprint) : boolean {
    // (loops are split to improve cache hit rate)
    // search bucketA
    for (let i = 0; i < this.nestPerBucket; i++) {
      if (fingerprint.fingerprint == this.lookupFingerprint(fingerprint.bucketA, i)) {
        return true
      }
    }

    // search bucketB
    for (let i = 0; i < this.nestPerBucket; i++) {
      if (fingerprint.fingerprint == this.lookupFingerprint(fingerprint.bucketB, i)) {
        return true
      }
    }

    return false;
  }

  lookupFingerprint(bucket, index) {
    return this.bucketArray[this.lookupFingerprintIndex(bucket, index)]
  }

  lookupFingerprintIndex(bucketNumber, index) : number {
    return (bucketNumber * this.nestPerBucket) + index
  }

  moveExtendedFingerprint(entry_to_insert: ExtendedFingerprint) : boolean {
    // seeding with a hash for this filter guarantees exact same sequence of
    // random integers used for moving fingerprints in the filter on every crownstone.
    let seed = this.filterHash()
    let rand = new RandomGeneratorMSWS(seed)

    for (let i = 0; i < this.max_kick_attempts; i++) {
      // try to add to bucket A
      if (this.addFingerprintToBucket(entry_to_insert.fingerprint, entry_to_insert.bucketA)) {
        return true
      }

      // try to add to bucket B
      if (this.addFingerprintToBucket(entry_to_insert.fingerprint, entry_to_insert.bucketB)) {
        return true
      }


      // no success, time to kick a fingerprint from one of our buckets

      // determine which bucket to kick from
      let ran = rand.get();
      let kick_A = ran % 2n;
      let kicked_item_bucket = kick_A ? entry_to_insert.bucketA : entry_to_insert.bucketB


      // and which fingerprint index
      let kicked_item_index = Number(rand.get() % BigInt(this.nestPerBucket));

      // swap entry to insert and the randomly chosen ('kicked') item
      let kicked_item_fingerprint_index = this.lookupFingerprintIndex(kicked_item_bucket, kicked_item_index)
      let kicked_item_fingerprint_value = this.bucketArray[kicked_item_fingerprint_index]

      this.bucketArray[kicked_item_fingerprint_index] = entry_to_insert.fingerprint

      entry_to_insert = this.getExtendedFingerprintFromFingerprintAndBucket(kicked_item_fingerprint_value, kicked_item_bucket)

      // next iteration will try to re-insert the footprint previously at (h,i).
    }

    // iteration ended: failed to re-place the last kicked entry into the buffer after max attempts.
    this.victim = entry_to_insert

    return false
  }

  addFingerprintToBucket(fingerprint: number, bucketNumber) {
    for (let i = 0; i < this.nestPerBucket; i++) {
      let index = this.lookupFingerprintIndex(bucketNumber, i);
      if (this.bucketArray[index] == 0) {
        this.bucketArray[index] = fingerprint;
        return true;
      }
    }
    return false;
  }

  filterHash() {
    let data = this.getPacket();

    let str = '';
    for (let d of data) {
      str += `${d}.`
    }

    return this.hash(this.getPacket());
  }

  contains(key: number[] | Buffer) : boolean {
    return this.containsExtendedFingerprint(this.getExtendedFingerprint(key))
  }


  remove(key: number[] | Buffer) : boolean {
    return this.removeExtendedFingerprint(this.getExtendedFingerprint(key))
  }

  removeExtendedFingerprint(fingerprint: ExtendedFingerprint) : boolean {
    if (this.remove_fingerprint_from_bucket(fingerprint.fingerprint, fingerprint.bucketA) ||
        this.remove_fingerprint_from_bucket(fingerprint.fingerprint, fingerprint.bucketB)) {
      // short ciruits nicely:
      //    tries bucketA,
      //    on fail try B,
      //    if either succes, fix victim.
      if (this.victim.fingerprint != 0) {
        if (this.addExtendedFingerprint(this.victim)) {
          this.victim = new ExtendedFingerprint(0, 0, 0)
        }
      }
      return true
    }
    return false
  }


  remove_fingerprint_from_bucket(fingerprint: number, bucketNumber: number) {
    for (let i = 0; i < this.nestPerBucket; i++) {
      let candidate = this.lookupFingerprintIndex(bucketNumber, i) // candidate_fingerprint_for_removal_in_array_index
      if (this.bucketArray[candidate] === fingerprint) {
        this.bucketArray[candidate] = 0;
        // to keep the bucket front loaded, move the last non-zero
        // fingerprint behind i into the slot.
        for (let j = this.nestPerBucket - 1; j > i; j--) {
          let last = this.lookupFingerprintIndex(bucketNumber, j);
          if (this.bucketArray[last] != 0) {
            this.bucketArray[candidate] = this.bucketArray[last];
            this.bucketArray[last] = 0;
            break;
          }
        }
        return true;
      }
    }

    return false;
  }

  getMaxFingerprintCount() {
    return this.bucketCount * this.nestPerBucket;
  }


  getPacket() : Buffer {
    let data = new CuckooFilterPacketData(this.bucketCountLog2, this.nestPerBucket, this.victim, this.bucketArray)
    return data.getPacket();
  }
}

