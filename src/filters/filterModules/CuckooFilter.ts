import {Util} from "../../util/Util";
import {RandomGeneratorMSWS} from "./../RandomGenerator";
import {CuckooFilterPacketData} from "../../packets/AssetFilters/CuckooFilterPackets";

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

export function generateCuckooFilterParameters(amountOfItems) {
  let nestPerBucket     = 4;
  let requiredFitAmount = amountOfItems / 0.95;
  let bucketCount       = requiredFitAmount / nestPerBucket;

  let bucketCountLog2   = Math.max(0,Math.ceil(Math.log2(bucketCount)));
  let actualBucketCount = Math.pow(2, bucketCountLog2);
  let requiredNestSize  = Math.ceil(requiredFitAmount / actualBucketCount);

  return {
    bucketCountLog2: bucketCountLog2,
    nestPerBucket:   requiredNestSize,
  };
}

const EMPTY = -1e8;

export class CuckooFilterCore {

  max_kick_attempts : number = 100;
  bucketCountLog2   : number;
  bucketCount       : number;
  nestPerBucket     : number;
  victim            : ExtendedFingerprint;
  bucketArray       : number[] = [];

  constructor(bucketCountLog2: number, nestPerBucket: number) {
    this.bucketCountLog2 = bucketCountLog2;
    this.bucketCount = 1 << this.bucketCountLog2;
    this.nestPerBucket = nestPerBucket;
    this.victim = new ExtendedFingerprint(0,0,0);
    this.bucketArray = [];

    this.clear();
  }


  clear() {
    this.victim = new ExtendedFingerprint(0, 0, 0);
    this.bucketArray = new Array(this.getMaxFingerprintCount());
    for (let i = 0; i < this.bucketArray.length; i++) {
      this.bucketArray[i] = EMPTY;
    }
  }

  hash(data: Buffer | number[]) {
    return Util.crc16_ccitt(data);
  }

  add(key: number[] | Buffer) : boolean {

    return this.addExtendedFingerprint(this.getExtendedFingerprint(key));
  }

  getExtendedFingerprint(key : number[] | Buffer) {
    let fingerprint = this.hash(key);
    let hashed_fingerprint = Util.djb2Hash(key);

    return new ExtendedFingerprint(
      fingerprint,
      hashed_fingerprint % this.bucketCount,
      (hashed_fingerprint ^ fingerprint) % this.bucketCount);
  }

  getExtendedFingerprintFromFingerprintAndBucket(fingerprint, bucketIndex) {
    let bucket_a = (bucketIndex % this.bucketCount) & 0xff;
    let bucket_b =((bucketIndex ^ fingerprint) % this.bucketCount) & 0xff;
    return new ExtendedFingerprint(fingerprint, bucket_a, bucket_b);
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
        return true;
      }
    }

    // search bucketB
    for (let i = 0; i < this.nestPerBucket; i++) {
      if (fingerprint.fingerprint == this.lookupFingerprint(fingerprint.bucketB, i)) {
        return true;
      }
    }

    return false;
  }

  lookupFingerprint(bucket, index) {
    return this.bucketArray[this.lookupFingerprintIndex(bucket, index)];
  }

  lookupFingerprintIndex(bucketNumber, index) : number {
    return (bucketNumber * this.nestPerBucket) + index;
  }

  moveExtendedFingerprint(entry_to_insert: ExtendedFingerprint) : boolean {
    // seeding with a hash for this filter guarantees exact same sequence of
    // random integers used for moving fingerprints in the filter on every crownstone.
    let seed = this.filterHash();
    let rand = new RandomGeneratorMSWS(seed);

    for (let i = 0; i < this.max_kick_attempts; i++) {
      // try to add to bucket A
      if (this.addFingerprintToBucket(entry_to_insert.fingerprint, entry_to_insert.bucketA)) {
        return true;
      }

      // try to add to bucket B
      if (this.addFingerprintToBucket(entry_to_insert.fingerprint, entry_to_insert.bucketB)) {
        return true;
      }

      // no success, time to kick a fingerprint from one of our buckets

      // determine which bucket to kick from
      let ran = rand.get();
      let kick_A = ran % 2n;
      let kicked_item_bucket = kick_A ? entry_to_insert.bucketA : entry_to_insert.bucketB;


      // and which fingerprint index
      let kicked_item_index = Number(rand.get() % BigInt(this.nestPerBucket));

      // swap entry to insert and the randomly chosen ('kicked') item
      let kicked_item_fingerprint_index = this.lookupFingerprintIndex(kicked_item_bucket, kicked_item_index);
      let kicked_item_fingerprint_value = this.bucketArray[kicked_item_fingerprint_index];

      this.bucketArray[kicked_item_fingerprint_index] = entry_to_insert.fingerprint;

      entry_to_insert = this.getExtendedFingerprintFromFingerprintAndBucket(kicked_item_fingerprint_value, kicked_item_bucket);

      // next iteration will try to re-insert the footprint previously at (h,i).
    }

    // iteration ended: failed to re-place the last kicked entry into the buffer after max attempts.
    this.victim = entry_to_insert;

    return false;
  }

  addFingerprintToBucket(fingerprint: number, bucketNumber) {
    for (let i = 0; i < this.nestPerBucket; i++) {
      let index = this.lookupFingerprintIndex(bucketNumber, i);
      if (this.bucketArray[index] == EMPTY) {
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
      str += `${d}.`;
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
    if (this.removeFingerprintFromBucket(fingerprint.fingerprint, fingerprint.bucketA) ||
        this.removeFingerprintFromBucket(fingerprint.fingerprint, fingerprint.bucketB)) {
      // short ciruits nicely:
      //    tries bucketA,
      //    on fail try B,
      //    if either succes, fix victim.
      if (this.victim.fingerprint != 0) {
        if (this.addExtendedFingerprint(this.victim)) {
          this.victim = new ExtendedFingerprint(0, 0, 0);
        }
      }
      return true;
    }
    return false;
  }


  removeFingerprintFromBucket(fingerprint: number, bucketNumber: number) {
    for (let i = 0; i < this.nestPerBucket; i++) {
      let candidate = this.lookupFingerprintIndex(bucketNumber, i) // candidate_fingerprint_for_removal_in_array_index
      if (this.bucketArray[candidate] === fingerprint) {
        this.bucketArray[candidate] = EMPTY;
        // to keep the bucket front loaded, move the last non-zero
        // fingerprint behind i into the slot.
        for (let j = this.nestPerBucket - 1; j > i; j--) {
          let last = this.lookupFingerprintIndex(bucketNumber, j);
          if (this.bucketArray[last] != EMPTY) {
            this.bucketArray[candidate] = this.bucketArray[last];
            this.bucketArray[last] = EMPTY;
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


  getPacket(filterCommandProtocol = 0) : Buffer {
    let data = new CuckooFilterPacketData(this.bucketCountLog2, this.nestPerBucket, this.victim, this._getCleanedupBucketArray())
    return data.getPacket();
  }

  /**
   * This will add duplicate data to fill up all duplicate slots.
   * If we leave these empty, the cuckoo filter will match on 0xffff, regardless if that fingerprint is added to the filter.
   */
  saturate() {
    this.bucketArray = this._getCleanedupBucketArray(this.bucketArray[0]);
  }

  /**
   * This will filter out all the EMPTY values and replace them with something. If we replace them with 0, we get the normal C++ implementation
   * If we replace them with the first fingerprint, we avoid false positives on things that hash to 0. Also, with this implementation
   * 0 is a valid hash value!
   * @param replaceValue
   */
  _getCleanedupBucketArray(replaceValue = 0) {
    let actualBucketArray = [];
    let initialItem = replaceValue;
    for (let item of this.bucketArray) {
      if (item === EMPTY) {
        actualBucketArray.push(initialItem);
      }
      else {
        actualBucketArray.push(item);
      }
    }
    return actualBucketArray;
  }
}


export class CuckooFilter extends CuckooFilterCore {
  constructor(amountOfItems: number) {
    let params = generateCuckooFilterParameters(amountOfItems);
    super(params.bucketCountLog2, params.nestPerBucket);
  }
}

