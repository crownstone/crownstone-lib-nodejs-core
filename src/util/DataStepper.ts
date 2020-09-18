import {CrownstoneError} from "../protocol/CrownstoneError";
import {CrownstoneErrorType} from "../declarations/enums";


export class DataStepper {

  buffer = null;
  position = 0;
  length = 0;


  constructor(buffer: Buffer) {
    this.buffer = buffer;
    this.length = buffer.length;
  }

  getUInt8() {
    let source = this._request(1);
    return source.readUInt8(0);
  }

  getUInt16() {
    let source = this._request(2);
    return source.readUInt16LE(0);
  }

  getUInt32() {
    let source = this._request(4);
    return source.readUInt32LE(0);
  }

  skip(count = 1) {
    if (this.position + count <= this.length) {
      this.position += count
    }
    else {
      throw new CrownstoneError(CrownstoneErrorType.INVALID_DATA_LENGTH, "Tried to get more bytes from buffer than were available.")
    }
  }

  getBuffer(size: number) {
    return this._request(size);
  }

  getRemainingBuffer() {
    let size = this.length - this.position;
    return this._request(size);
  }

  _request(size: number) : Buffer {
    if (this.position + size <= this.length) {
      let start = this.position;
      this.position += size;
      return this.buffer.slice(start, this.position);
    }
    else {
      throw new CrownstoneError(CrownstoneErrorType.INVALID_DATA_LENGTH, "Tried to get more bytes from buffer than were available.")
    }
  }

}



export class DataWriter {

  buffer : Buffer;
  position = 0;
  totalSize = 0;

  constructor(totalSize) {
    this.totalSize = totalSize;
    this.buffer = Buffer.alloc(totalSize);
  }

  getBuffer() : Buffer {
    return this.buffer;
  }

  putBuffer(buffer: Buffer) {
    this.position  += buffer.length;
    this.totalSize += buffer.length;
    this.buffer = Buffer.concat([this.buffer, buffer]);
  }

  putUInt32(data: number) {
    this._place(data, 4, "writeUInt32LE")
  }

  putUInt24(data: number) {
    let tempBuffer = Buffer.alloc(4);
    tempBuffer.writeUInt32LE(data, 0);
    this._place(tempBuffer[0], 1, "writeUInt8")
    this._place(tempBuffer[1], 1, "writeUInt8")
    this._place(tempBuffer[2], 1, "writeUInt8")
  }

  putUInt16(data: number) {
    this._place(data, 2, "writeUInt16LE");
  }

  putUInt8(data : number) {
    this._place(data, 2, "writeUInt8");
  }




  _place(data, count, method : "writeUInt16LE" | "writeUInt8" | "writeUInt32LE") {
    this.position += count;
    if (this.totalSize - 1 - this.position > 0) {
      this.buffer[method](data, this.position);
    }
    else {
      throw new CrownstoneError(CrownstoneErrorType.BUFFER_TOO_SHORT_FOR_DATA, "You tried to push more data into the buffer than you have allocated space for.")
    }
  }

}