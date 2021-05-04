import {DataWriter} from "../../util/DataWriter";
import {Util} from "../../util/Util";
import {DataStepper} from "../../util/DataStepper";

type filterPacketFormat = FilterFormatMacAddress | FilterFormatAdData | FilterFormatMaskedAdData;

export const FilterType = {
  CUCKCOO_V1: 0
}

export const FilterInputType = {
  MAC_ADDRESS:    0,
  AD_DATA:        1,
  MASKED_AD_DATA: 2,
}

export const FilterOutputDescriptionType = {
  MAC_ADDRESS_REPORT:   0,
  SHORT_ASSET_ID_TRACK: 1,
}


export class FilterMetaData {
  type:              number;
  profileId:         number;
  input:             filterPacketFormat
  outputDescription: FilterOutputDescription

  getPacket() : Buffer {
    let writer = new DataWriter(4);
    writer.putUInt8(this.type);
    writer.putUInt8(this.profileId);
    writer.putBuffer(this.input.getPacket());
    writer.putBuffer(this.outputDescription.getPacket());

    return writer.getBuffer();
  }
}

export class FilterFormatMacAddress {
  type: number = FilterInputType.MAC_ADDRESS;

  getPacket() : Buffer {
    let writer = new DataWriter(1);
    writer.putUInt8(this.type)
    return writer.getBuffer();
  }
}

export class FilterFormatAdData {
  type:   number = FilterInputType.AD_DATA;
  adType: number

  constructor(adType: number) {
    this.adType = adType;
  }

  getPacket() : Buffer {
    let writer = new DataWriter(2);
    writer.putUInt8(this.type)
    writer.putUInt8(this.adType)
    return writer.getBuffer();
  }
}

export class FilterFormatMaskedAdData {
  type:   number = FilterInputType.MASKED_AD_DATA;
  adType: number
  mask:   number

  constructor(adType: number, mask: number) {
    this.adType = adType;
    this.mask = mask;
  }

  getPacket() : Buffer {
    let writer = new DataWriter(6);
    writer.putUInt8(this.type)
    writer.putUInt8(this.adType)
    writer.putUInt32(this.mask);
    return writer.getBuffer();
  }
}

export class FilterOutputDescription {
  type:   number;
  format: filterPacketFormat | null

  constructor(type: number, format: filterPacketFormat | null = null) {
    this.type   = type;
    this.format = format;
  }

  getPacket() : Buffer {
    let writer = new DataWriter(1);
    writer.putUInt8(this.type);
    if (this.format !== null) {
      writer.putBuffer(this.format.getPacket())
    }
    return writer.getBuffer();
  }
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


export class FilterUploadChunk {
  filterId: number;
  chunkStartIndex: number;
  totalSize: number;
  chunkSize: number;
  chunk: Buffer;

  constructor(filterId: number, chunkStartIndex: number, totalSize: number, chunkSize: number, chunk: Buffer) {
    this.filterId = filterId;
    this.chunkStartIndex = chunkStartIndex;
    this.totalSize = totalSize;
    this.chunkSize = chunkSize;
    this.chunk = chunk;
  }

  getPacket() {
    let writer = new DataWriter(7);
    writer.putUInt8(this.filterId);
    writer.putUInt16(this.chunkStartIndex);
    writer.putUInt16(this.totalSize);
    writer.putUInt16(this.chunkSize);
    writer.putBuffer(this.chunk);
    return writer.getBuffer();
  }
}

export class FilterChunker {
  filterId: number
  filterData: Buffer;

  index = 0;
  maxChunkSize = 256;



  constructor(filterId: number, filterData: Buffer) {
    this.filterId = filterId;
    this.filterData = filterData;
  }

  getChunk() : { finished: boolean, packet: Buffer } {
    let totalSize = this.filterData.length;
    if (totalSize > this.maxChunkSize) {
      // CHUNK
      let chunkSize = Math.min(this.maxChunkSize, totalSize - this.index*this.maxChunkSize);
      let chunk = Buffer.from(this.filterData,this.index*this.maxChunkSize, chunkSize);
      let result = {finished: false, packet: new FilterUploadChunk(this.filterId, this.index, totalSize, chunkSize, chunk).getPacket()};
      this.index++;
      return result;
    }
    else {
      return {finished: true, packet: new FilterUploadChunk(this.filterId, this.index, totalSize, totalSize, this.filterData).getPacket()};
    }
  }
}


const FILTER_SUMMARY_SIZE = 4;

export class FilterSummaries {
  supportedFilterProtocol: number;
  masterVersion: number;
  masterCRC: number;
  freeSpaceLeft: number

  filterSummaries: FilterSummary[]
  constructor(data: Buffer) {
    let stepper = new DataStepper(data);

    this.supportedFilterProtocol = stepper.getUInt8();
    this.masterVersion = stepper.getUInt16();
    this.masterCRC     = stepper.getUInt16();
    this.freeSpaceLeft = stepper.getUInt16();

    let amountOfFilters = stepper.getRemainingByteCount() / FILTER_SUMMARY_SIZE;
    let summaries = stepper.getRemainingBuffer()

    for (let i = 0; i < amountOfFilters; i++) {
      let summary = Buffer.from(summaries, i * FILTER_SUMMARY_SIZE, FILTER_SUMMARY_SIZE);
      this.filterSummaries.push(new FilterSummary(summary));
    }

  }
}

export class FilterSummary {
  filterId: number;
  filterType: number;
  filterCRC: number;

  constructor(data) {
    let stepper = new DataStepper(data);
    this.filterId   = stepper.getUInt8()
    this.filterType = stepper.getUInt8()
    this.filterCRC  = stepper.getUInt16()
  }
}

