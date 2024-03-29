import {DataWriter} from "../../util/DataWriter";
import {FilterInputType, FilterType} from "./FilterTypes";
import {UInt8Bitmask} from "../../util/Bitmask";

type filterPacketFormat = FilterFormatMacAddress | FilterFormatFullAdData | FilterFormatMaskedAdData | FilterInputManufacturerId;

export class FilterMetaData {
  type:              number;
  flags:             number;
  profileId:         number;
  input:             filterPacketFormat
  outputDescription: FilterOutputDescription

  constructor(profileId: number, type: number = FilterType.CUCKCOO, exclude: boolean = false) {
    this.profileId = profileId ?? 255;
    this.type = type;
    let flags = new UInt8Bitmask();
    if (exclude) {
      flags.setHigh(0);
    }
    this.flags = flags.value;
  }

  getPacket(filterCommandProtocol: number) : Buffer {
    let writer = new DataWriter(3);
    writer.putUInt8(this.type);
    writer.putUInt8(this.flags);
    writer.putUInt8(this.profileId);
    writer.putBuffer(this.input.getPacket(filterCommandProtocol));
    writer.putBuffer(this.outputDescription.getPacket(filterCommandProtocol));

    return writer.getBuffer();
  }
}

export class FilterFormatMacAddress {
  type: number = FilterInputType.MAC_ADDRESS;

  getPacket(filterCommandProtocol: number) : Buffer {
    let writer = new DataWriter(1);
    writer.putUInt8(this.type)
    return writer.getBuffer();
  }
}



export class FilterFormatFullAdData {
  type:   number = FilterInputType.FULL_AD_DATA;
  adType: number;

  constructor(adType: number) {
    this.adType = adType;
  }

  getPacket(filterCommandProtocol: number) : Buffer {
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

  getPacket(filterCommandProtocol: number) : Buffer {
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

  getPacket(filterCommandProtocol: number) : Buffer {
    let writer = new DataWriter(1);
    writer.putUInt8(this.type);
    if (this.format !== null) {
      writer.putBuffer(this.format.getPacket(filterCommandProtocol))
    }
    return writer.getBuffer();
  }
}

export class FilterInputManufacturerId extends FilterFormatMaskedAdData {
  constructor() {
    let adType = 0xff;
    let mask   = 3; // this only looks at bits 0 and 1, which is the uint16 after 0xff
    super(adType, mask)
  }
}
