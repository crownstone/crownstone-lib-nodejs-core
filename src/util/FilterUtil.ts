import {DataWriter} from "./DataWriter";
import {Util} from "./Util";
import {FilterMetaData} from "../packets/filter/FilterPackets";

/**
 * Get the CRC for this filter based on the metaData and the filterPacket.
 * @param metadata
 * @param filterPacket
 */
export function getMasterCRC(filters: Record<filterId, filterCRC>) : number {
  // Get filterCRC
  let ids = Object.keys(filters);
  ids.sort((a,b) => { return Number(a) - Number(b)});

  let writer = new DataWriter(ids.length*2);
  for (let id of ids) {
    writer.putUInt16(filters[id])
  }

  return Util.crc16_ccitt(writer.getBuffer())
}


/**
 * Get the CRC for this filter based on the metaData and the filterPacket.
 * @param metadata
 * @param filterPacket
 */
export function getFilterCRC(metadata: FilterMetaData, filterPacket: Buffer) : number {
  // Get filterCRC
  let dataWriter = new DataWriter(2);
  dataWriter.putUInt8(metadata.type);
  dataWriter.putBuffer(metadata.input.getPacket())
  dataWriter.putBuffer(metadata.outputDescription.getPacket())
  dataWriter.putUInt8(metadata.profileId);
  dataWriter.putBuffer(filterPacket);
  return Util.crc16_ccitt(dataWriter.getBuffer());
}


