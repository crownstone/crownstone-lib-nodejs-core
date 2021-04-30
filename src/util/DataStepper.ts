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

  getInt8() {
    let source = this._request(1);
    return source.readInt8(0);
  }

  getUInt16() {
    let source = this._request(2);
    return source.readUInt16LE(0);
  }

  getInt16() {
    let source = this._request(2);
    return source.readInt16LE(0);
  }

  getUInt32() {
    let source = this._request(4);
    return source.readUInt32LE(0);
  }

  getInt32() {
    let source = this._request(4);
    return source.readInt32LE(0);
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
    let size = this.getRemainingByteCount();
    return this._request(size);
  }

  getRemainingByteCount(): number {
    return this.length - this.position;
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
