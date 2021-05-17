import {DataWriter} from "./DataWriter";
import {Util} from "./Util";
import {FilterUploadChunk} from "../packets/AssetFilters/FilterPackets";
import {LollipopUint16} from "./Lollipop";


export function increaseMasterVersion(currentVersion: number) : number {
  return LollipopUint16.increase(currentVersion, 1);
}

/**
 * Get the CRC for this filter based on the metaData and the filterPacket.
 * @param metadata
 * @param filterPacket
 */
export function getMasterCRC(filters: Record<filterId, filterCRC>) : number {
  // Get filterCRC
  let ids = Object.keys(filters);
  ids.sort((a,b) => { return Number(a) - Number(b)});

  let writer = new DataWriter(ids.length*5);
  for (let id of ids) {
    writer.putUInt8(Number(id));
    writer.putUInt32(filters[id]);
  }

  return Util.crc32(writer.getBuffer())
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