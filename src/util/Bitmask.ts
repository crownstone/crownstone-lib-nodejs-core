
let availableBitmaskSizes = [1,2,4];

export class Bitmask {
  size: number;
  value: number = 0

  constructor(size: number, value: number = null) {
    this.size = size;
    if (availableBitmaskSizes.indexOf(this.size) === -1) {
      throw "INVALID_BITMASK_SIZE";
    }

    if (value !== null) {
      let maxValue = this.size*256 - 1;
      if (value > maxValue) {
        throw "VALUE_DOES_NOT_FIT_IN_BITMASK_SIZE";
      }
      this.value = value;
    }
  }

  setHigh(index: number | number[]) : void {
    let _setHigh = (index) => {
      if (index >= (this.size*8)) {
        throw "INDEX_DOES_NOT_FIT_IN_BITMASK_SIZE";
      }

      if (this.isHigh(index) === false) {
        this.value += 1 << index;
      }
    }

    if (typeof index === 'number') {
      _setHigh(index);
    }
    else if (Array.isArray(index)) {
      for (let indx of index) {
        _setHigh(indx);
      }
    }
    else {
      throw "INVALID_INPUT";
    }
  }


  setLow(index: number | number[]) : void {
    let _setLow = (index) => {
      if (index >= (this.size * 8)) {
        throw "INDEX_DOES_NOT_FIT_IN_BITMASK_SIZE";
      }
      if (this.isHigh(index)) {
        this.value -= 1 << index;
      }
    }

    if (typeof index === 'number') {
      _setLow(index);
    }
    else if (Array.isArray(index)) {
      for (let indx of index) {
        _setLow(indx);
      }
    }
    else {
      throw "INVALID_INPUT";
    }
  }

  isHigh(index: number) : boolean {
    return (this.value & (1 << index)) > 0;
  }

  getPacket() : Buffer {
    switch (this.size) {
      case 1:
        return Buffer.from([this.value]);
      case 2:
        let buf = Buffer.alloc(2);
        buf.writeUInt16LE(this.value, 0);
        return buf;
      case 4:
        buf = Buffer.alloc(4);
        buf.writeUInt32LE(this.value, 0);
        return buf;
    }
  }
}

export class UInt8Bitmask extends Bitmask {
  constructor(value: number = null) { super(1, value); }
}
export class UInt16Bitmask extends Bitmask {
  constructor(value: number = null) { super(2, value); }
}
export class UInt32Bitmask extends Bitmask {
  constructor(value: number = null) { super(4, value); }
}