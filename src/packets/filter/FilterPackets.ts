import {DataWriter} from "../../util/DataWriter";


export class FilterMetaData {
  type: number = 0;  // this is a protocol kind of thing. It defines the rest of this packet, as well as the type of the filter
  filterCRC: number;
  profileId: number;
  input: FilterInputMacAddress |
         FilterInputAdData
  outputDescription: FilterOutputDescriptionReport      |
                     FilterOutputDescriptionTrackAdData |
                     FilterOutputDescriptionTrackMacAddress

  constructor() {}

  getPacket() {
    let writer = new DataWriter(4);
    writer.putUInt8(this.type)
    writer.putUInt16(this.filterCRC)
    writer.putUInt8(this.profileId)
    writer.putBuffer(this.input.getPacket())
    writer.putBuffer(this.outputDescription.getPacket())
  }
}


export class FilterInputMacAddress {
  type: number

  getPacket() {
    let writer = new DataWriter(1);
    writer.putUInt8(this.type)
    return writer.getBuffer();
  }
}

export class FilterInputAdData {
  type: number
  adType: number
  mask:   number

  constructor(type: number, adType: number, mask: number) {
    this.type = type;
    this.adType = adType;
    this.mask = mask;
  }

  getPacket() {
    let writer = new DataWriter(6);
    writer.putUInt8(this.type)
    writer.putUInt8(this.adType)
    writer.putUInt32(this.mask);
    return writer.getBuffer();
  }
}

export class FilterOutputDescriptionReport {
  type: number;
  representation: number;

  constructor(type: number, representation: number) {
    this.type = type;
    this.representation = representation;
  }

  getPacket() {
    let writer = new DataWriter(2);
    writer.putUInt8(this.type)
    writer.putUInt8(this.representation)
    return writer.getBuffer();
  }
}

export class FilterOutputDescriptionTrackAdData {
  type: number
  representation: number
  adType: number
  mask:   number

  constructor(type: number, representation: number, adType: number, mask: number) {
    this.type = type;
    this.representation = representation;
    this.adType = adType;
    this.mask = mask;
  }

  getPacket() {
    let writer = new DataWriter(7);
    writer.putUInt8(this.type)
    writer.putUInt8(this.representation)
    writer.putUInt8(this.adType)
    writer.putUInt32(this.mask);
    return writer.getBuffer();
  }
}

export class FilterOutputDescriptionTrackMacAddress {
  type: number
  representation: number

  constructor(type: number, representation: number) {
    this.type = type;
    this.representation = representation;
  }

  getPacket() {
    let writer = new DataWriter(2);
    writer.putUInt8(this.type)
    writer.putUInt8(this.representation)
    return writer.getBuffer();
  }
}

export const FilterInputTypes = {
  MAC_ADDRESS: 0,
  AD_DATA:     1,
}

export const FilterOutputDescriptionTypes = {
  TRACK:  0,
  REPORT: 1,
}

export const FilterOutputDescriptionReportTypes = {
  MAC_ADDRESS: 0,
  AD_DATA:     1,
}

export const FilterOutputDescriptionTrackTypes = {
  MAC_ADDRESS: 0,
  AD_DATA:     1,
}


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

