import {DataWriter} from "../../util/DataWriter";
import {DataStepper} from "../../util/DataStepper";


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



const FILTER_SUMMARY_SIZE = 5;

export class FilterSummaries {
  supportedFilterProtocol: number;
  masterVersion:           number;
  masterCRC:               number;
  freeSpaceLeft:           number;
  filterSummaries:         FilterSummary[] = [];

  constructor(data: Buffer) {
    let stepper = new DataStepper(data);

    this.supportedFilterProtocol = stepper.getUInt8();
    this.masterVersion = stepper.getUInt16();
    this.masterCRC     = stepper.getUInt32();
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
  filterCRC: number;

  constructor(data) {
    let stepper = new DataStepper(data);
    this.filterId   = stepper.getUInt8()
    this.filterCRC  = stepper.getUInt32()
  }
}

