

class StoneKeepAlivePacket {
  crownstoneId = 0;
  actionAndState = 0;

  /**
   crownstoneId: byte
   action:  boolean
   state:  number [0..1]
   */
  constructor(crownstoneId, action, state) {
    let switchState = Math.min(1, Math.max(0, state)) * 100;
    if (!action) {
      switchState = 255;
    }

    this.crownstoneId = crownstoneId;
    this.actionAndState = switchState;
  }

  getPacket() {
    let packet = Buffer.alloc(2);
    packet.writeUInt8(this.crownstoneId,  0);
    packet.writeUInt8(this.actionAndState,1);
    return packet;
  }
}


class MeshKeepAlivePacket {
  type = 0;
  timeout = 0;
  reserved = [];
  packets = [];

  contructor(packetType, timeout, packets : [StoneKeepAlivePacket]) {
    this.type = packetType.value;
    this.timeout = timeout;
    this.packets = packets;
    this.reserved = [0, 0]
  }

  getPacket() {
    let packet = Buffer.alloc(4);
    packet.writeUInt8(this.type,0);
    packet.writeUInt16BE(this.timeout,1);
    packet.writeUInt8(this.packets.length,3);

    for (let i = 0; i < this.packets.length; i++) {
      packet = Buffer.concat([packet, this.packets[i].getPacket()]);
    }

    return packet
  }
}

class MeshCommandPacket {
  type = 0;
  bitmask = 0;
  crownstoneIds = [];
  payload : Buffer;

  contructor(packetType, crownstoneIds : [number], payload : Buffer) {
    this.type = packetType;
    this.crownstoneIds = crownstoneIds;
    this.payload = payload;
  }

  getPacket(){
    let idBuffer = Buffer.alloc(this.crownstoneIds.length);
    for ( let i = 0; i < this.crownstoneIds.length; i++) {
      idBuffer.writeUInt8(this.crownstoneIds[i],i);
    }

    let packet = Buffer.alloc(4);
    packet.writeUInt8(this.type,0);
    packet.writeUInt8(this.bitmask,1);
    packet.writeUInt8(this.crownstoneIds.length,2);

    packet = Buffer.concat([packet, idBuffer, this.payload]);

    return packet
  }
}

class StoneMultiSwitchPacket {
  timeout = 0;
  crownstoneId = 0;
  state = 0;
  intent = 0;

  /**
   * crownstoneId:
   * state:  number [0..1]
   * timeout:
   * intent: intentType
   **/
  contructor(crownstoneId : number, state : number, timeout: number, intent) {
    this.crownstoneId = crownstoneId;
    this.state = Math.min(1, Math.max(0, state)) * 100; // map to [0 .. 100]
    this.timeout = timeout;
    this.intent = intent
  }

  getPacket() {
    let packet = Buffer.alloc(5);
    packet.writeUInt8(this.crownstoneId,0);
    packet.writeUInt8(this.state,1);
    packet.writeUInt16BE(this.timeout,2);
    packet.writeUInt8(this.intent,4);

    return packet
  }
}


class MeshMultiSwitchPacket {
  type = 0;
  packets = [];

  contructor(packetType, packets : [StoneMultiSwitchPacket]) {
    this.type = packetType;
    this.packets = packets
  }

  getPacket() {
    let packet = Buffer.alloc(2);
    packet.writeUInt8(this.type,0);
    packet.writeUInt8(this.packets.length,1);

    for (let i = 0; i < this.packets.length; i++) {
      packet = Buffer.concat([packet, this.packets[i].getPacket()]);
    }

    return packet
  }
}