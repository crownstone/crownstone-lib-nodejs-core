import {DataWriter} from "../../util/DataWriter";


export class ExactMatchFilter {

  itemSize: number;
  itemCount: number;
  items : Buffer[] = [];

  constructor(itemSize: number) {
    this.itemSize = itemSize;
  }

  add(data: Buffer) {
    if (data.length != this.itemSize) {
      throw "INVALID_SIZE_DATA_FOR_FILTER"
    }

    if (this.contains(data) === false) {
      this.items.push(data);
    }
  }

  contains(data: Buffer) : boolean {
    // Buffer.compare(buf1, buf2);
    // 0 if they are equal
    // 1 if buf1 is higher than buf2
    // -1 if buf1 is lower than buf2

    for (let item of this.items) {
      if (item.compare(data) === 0) {
        return true;
      }
    }

    return false;
  }

  _sort() {
    this.items.sort((a,b) => { return a.compare(b); })
  }


  getPacket() {
    this.itemCount = this.items.length;
    this._sort();

    let writer = new DataWriter(2);
    writer.putUInt8(this.itemCount);
    writer.putUInt8(this.itemSize);

    for (let item of this.items) {
      writer.putBuffer(item);
    }

    return writer.getBuffer();
  }
}