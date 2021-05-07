import {DataWriter} from "./DataWriter";
import {Util} from "./Util";
import {FilterUploadChunk} from "../packets/AssetFilters/FilterPackets";
import {FilterMetaData} from "../packets/AssetFilters/FilterMetaDataPackets";

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

  getAmountOfChunks() : number {
    let totalSize = this.filterData.length;
    let count = Math.floor(totalSize/this.maxChunkSize);
    if (totalSize % this.maxChunkSize > 0) {
      count += 1;
    }
    return count;
  }
}