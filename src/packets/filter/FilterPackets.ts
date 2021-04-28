import {DataWriter} from "../../util/DataWriter";
import {Util} from "../../util/Util";

type filter_macAddressType = "MAC_ADDRESS"
type filter_adDataType     = "AD_DATA"

type filter_outputReportType     = "REPORT"
type filter_outputReportDataType = "FULL_MAC_ADDRESS_RSSI"

type filter_outputTrackType                         = "TRACK"
type filter_outputTrackRepresentationMacAddressType = "MAC_ADDRESS"
type filter_outputTrackRepresentationAdType         = "AD_DATA"

interface InputMacAddress {
  type: filter_macAddressType
}

interface InputAdData {
  type:   filter_adDataType,
  adType: number,
  mask:   number
}

interface OutputDescriptionReport {
  type:           filter_outputReportType,
  representation: filter_outputReportDataType,
}

interface OutputDescriptionTrackMacAddress {
  type:           filter_outputTrackType,
  representation: filter_outputTrackRepresentationMacAddressType,
}

interface OutputDescriptionTrackAdData {
  type:           filter_outputTrackType,
  representation: filter_outputTrackRepresentationAdType,
  adType: number,
  mask:   number
}


export const FilterType = {
  CUCKCOO_V1: 0
}

export class FilterMetaData {
  type: number  // this is a protocol kind of thing. It defines the rest of this packet, as well as the type of the filter
  filterCRC: number;
  profileId: number;
  input: FilterInputMacAddress |
         FilterInputAdData
  outputDescription: FilterOutputDescriptionReport      |
                     FilterOutputDescriptionTrackAdData |
                     FilterOutputDescriptionTrackMacAddress

  constructor() {}

  getPacket() : Buffer {
    let writer = new DataWriter(4);
    writer.putUInt8(this.type)
    writer.putUInt16(this.filterCRC)
    writer.putUInt8(this.profileId)
    writer.putBuffer(this.input.getPacket())
    writer.putBuffer(this.outputDescription.getPacket())

    return writer.getBuffer();
  }
}


export class FilterInputMacAddress {
  type: number = FilterInputType.MAC_ADDRESS;

  getPacket() : Buffer {
    let writer = new DataWriter(1);
    writer.putUInt8(this.type)
    return writer.getBuffer();
  }
}

export class FilterInputAdData {
  type:   number = FilterInputType.AD_DATA;
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

export class FilterOutputDescriptionReport {
  type:           number = FilterOutputDescriptionType.REPORT;
  representation: number = FilterOutputDescriptionReportType.MAC_ADDRESS

  getPacket() : Buffer {
    let writer = new DataWriter(2);
    writer.putUInt8(this.type)
    writer.putUInt8(this.representation)
    return writer.getBuffer();
  }
}

export class FilterOutputDescriptionTrackAdData {
  type:           number = FilterOutputDescriptionType.TRACK;
  representation: number = FilterOutputDescriptionTrackType.AD_DATA;
  adType:         number
  mask:           number

  constructor(adType: number, mask: number) {
    this.adType = adType;
    this.mask   = mask;
  }

  getPacket() : Buffer {
    let writer = new DataWriter(7);
    writer.putUInt8(this.type)
    writer.putUInt8(this.representation)
    writer.putUInt8(this.adType)
    writer.putUInt32(this.mask);
    return writer.getBuffer();
  }
}

export class FilterOutputDescriptionTrackMacAddress {
  type:           number = FilterOutputDescriptionType.TRACK;
  representation: number = FilterOutputDescriptionTrackType.MAC_ADDRESS;

  getPacket() : Buffer {
    let writer = new DataWriter(2);
    writer.putUInt8(this.type)
    writer.putUInt8(this.representation)
    return writer.getBuffer();
  }
}

export const FilterInputType = {
  MAC_ADDRESS: 0,
  AD_DATA:     1,
}

export const FilterOutputDescriptionType = {
  TRACK:  0,
  REPORT: 1,
}

export const FilterOutputDescriptionReportType = {
  MAC_ADDRESS: 0,
}

export const FilterOutputDescriptionTrackType = {
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

export function getFilterMetaData(
  filterType : number,
  filterPacket : Buffer,
  profileId : number,
  inputData: InputMacAddress | InputAdData,
  outputDescription: OutputDescriptionReport | OutputDescriptionTrackMacAddress | OutputDescriptionTrackAdData
) {
  let meta = new FilterMetaData();

  meta.type      = filterType;
  meta.profileId = profileId;

  switch (inputData.type) {
    case "MAC_ADDRESS": meta.input = new FilterInputMacAddress(); break;
    case "AD_DATA":     meta.input = new FilterInputAdData( inputData.adType, inputData.mask ); break;
  }

  switch (outputDescription.type) {
    case "REPORT": meta.outputDescription = new FilterOutputDescriptionReport(); break;
    case "TRACK":
      switch (outputDescription.representation) {
        case "MAC_ADDRESS": meta.outputDescription = new FilterOutputDescriptionTrackMacAddress(); break;
        case "AD_DATA":     meta.outputDescription = new FilterOutputDescriptionTrackAdData(outputDescription.adType, outputDescription.mask); break;
      }
  }

  // Get filterCRC
  let dataWriter = new DataWriter(2);
  dataWriter.putUInt8(meta.type);
  dataWriter.putBuffer(meta.input.getPacket())
  dataWriter.putBuffer(meta.outputDescription.getPacket())
  dataWriter.putUInt8(meta.profileId);
  dataWriter.putBuffer(filterPacket);
  meta.filterCRC = Util.crc16_ccitt(dataWriter.getBuffer());

  return meta;
}

