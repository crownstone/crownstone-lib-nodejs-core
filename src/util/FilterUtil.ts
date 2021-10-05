import {DataWriter} from "./DataWriter";
import {Util} from "./Util";
import {FilterUploadChunk} from "../packets/AssetFilters/FilterPackets";
import {LollipopUint16} from "./Lollipop";


export function increaseMasterVersion(currentVersion: number) : number {
  return LollipopUint16.increase(currentVersion, 1);
}

/**
 * Get the CRC for this filter based on the metaData and the filterPacket.
 * @param filters
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
  maxChunkSize = 128;

  constructor(filterId: number, filterData: Buffer, maxChunkSize: number = 128) {
    this.filterId = filterId;
    this.filterData = filterData;
    this.maxChunkSize = maxChunkSize;
  }

  getChunk(filterCommandProtocol: number) : { finished: boolean, packet: Buffer } {
    let totalSize = this.filterData.length;
    if (totalSize > this.maxChunkSize) {
      // CHUNK
      let chunkSize = Math.min(this.maxChunkSize, totalSize - this.index);
      let chunk = this.filterData.subarray(this.index, this.index+chunkSize)
      let result = {finished: chunkSize < this.maxChunkSize, packet: new FilterUploadChunk(this.filterId, this.index, totalSize, chunkSize, chunk).getPacket()};
      this.index += this.maxChunkSize;
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