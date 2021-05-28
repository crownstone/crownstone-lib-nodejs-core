import {ControlType} from './CrownstoneTypes';
import {AssetFilterCommand, ControlPacket, FactoryResetPacket} from "./BasePackets";
import {Util} from "../util/Util";
import {DataWriter} from "../util/DataWriter";
import {MeshCommandBroadcastPacket} from "./MeshPackets";

export class ControlPacketsGenerator {

  static getFactoryResetPacket() : Buffer {
    let buffer = Buffer.alloc(4);
    buffer.writeUInt32LE(0xdeadbeef,0);
    return buffer
  }

  static getCommandFactoryResetPacket() : Buffer {
    return new FactoryResetPacket().getPacket()
  }

  static getSwitchStatePacket(switchState: number) : Buffer {
    let convertedSwitchState = Util.bound0_100(switchState);
    return new ControlPacket(ControlType.SWITCH).loadUInt8(convertedSwitchState).getPacket()
  }

  static getResetPacket() : Buffer {
    return new ControlPacket(ControlType.RESET).getPacket()
  }

  static getPutInDFUPacket() : Buffer {
    return new ControlPacket(ControlType.GOTO_DFU).getPacket()
  }

  static getDisconnectPacket()  : Buffer {
    return new ControlPacket(ControlType.DISCONNECT).getPacket()
  }

  /**
   * @param state : 0 or 1
   * @returns {Buffer}
   */
  static getRelaySwitchPacket(state) : Buffer {
    return new ControlPacket(ControlType.RELAY).loadUInt8(state).getPacket()
  }

  /**
   * @param switchState   [0 .. 1]
   * @returns {Buffer}
   */
  static getPwmSwitchPacket(switchState) : Buffer {
    let convertedSwitchState = Util.bound0_100(switchState);

    return new ControlPacket(ControlType.PWM).loadUInt8(convertedSwitchState).getPacket()
  }


  static getResetErrorPacket(errorMask) : Buffer {
    return new ControlPacket(ControlType.RESET_ERRORS).loadUInt32(errorMask).getPacket()
  }

  /**
   * This is a LOCAL timestamp since epoch in seconds

   so if you live in GMT + 1 add 3600 to the timestamp

   * @param time
   * @returns {Buffer}
   */
  static getSetTimePacket(time) : Buffer {
    return new ControlPacket(ControlType.SET_TIME).loadUInt32(time).getPacket()
  }

  static getAllowDimmingPacket(allow) : Buffer {
    let allowByte = 0;
    if (allow) {
      allowByte = 1
    }

    return new ControlPacket(ControlType.ALLOW_DIMMING).loadUInt8(allowByte).getPacket()
  }

  static getLockSwitchPacket(lock) : Buffer {
    let lockByte = 0;
    if (lock) {
      lockByte = 1
    }
    return new ControlPacket(ControlType.LOCK_SWITCH).loadUInt8(lockByte).getPacket()
  }

  static getRegisterTrackedDevicesPacket(
    trackingNumber:number,
    locationUID:number,
    profileId:number,
    rssiOffset:number,
    ignoreForPresence:boolean,
    tapToToggleEnabled:boolean,
    deviceToken:number,
    ttlMinutes:number
  ) : Buffer {
    let data = new DataWriter(11);
    data.putUInt16(trackingNumber);
    data.putUInt8(locationUID);
    data.putUInt8(profileId);
    data.putUInt8(rssiOffset);

    let flags = 0;
    if (ignoreForPresence)  { flags += 1 << 1; }
    if (tapToToggleEnabled) { flags += 1 << 2; }

    data.putUInt8(flags)
    data.putUInt24(deviceToken);
    data.putUInt16(ttlMinutes);

    return new ControlPacket(ControlType.REGISTER_TRACKED_DEVICE).loadBuffer(data.getBuffer()).getPacket()
  }

  static getUartMessagePacket(message: string) : Buffer {
    return new ControlPacket(ControlType.UART_MESSAGE).loadString(message).getPacket()
  }


  static getSetupPacket(type, crownstoneId, adminKey : Buffer, memberKey : Buffer, guestKey : Buffer, meshAccessAddress, ibeaconUUID, ibeaconMajor, ibeaconMinor) : Buffer {
    let prefix = Buffer.alloc(2);
    prefix.writeUInt8(type,         0);
    prefix.writeUInt8(crownstoneId, 1);


    let meshBuffer = Buffer.alloc(4);
    meshBuffer.writeUInt32LE(meshAccessAddress,0);

    let processedUUID = ibeaconUUID.replace(/:/g,"").replace(/-/g,"");
    let uuidBuffer = Buffer.from(Buffer.from(processedUUID, 'hex').reverse());
    let ibeaconBuffer = Buffer.alloc(4);
    ibeaconBuffer.writeUInt16LE(ibeaconMajor, 0);
    ibeaconBuffer.writeUInt16LE(ibeaconMinor, 2);

    let data = Buffer.concat([prefix, adminKey, memberKey, guestKey, meshBuffer, uuidBuffer, ibeaconBuffer]);

    return new ControlPacket(ControlType.SETUP).loadBuffer(data).getPacket()
  }

  static getSetupPacketV2(
    sphereUid,
    crownstoneId,
    adminKey : Buffer,
    memberKey : Buffer,
    basicKey : Buffer,
    serviceDataKey : Buffer,
    localizationKey : Buffer,
    meshNetworkKey : Buffer,
    meshAppKey : Buffer,
    meshDeviceKey : Buffer,
    ibeaconUUID,
    ibeaconMajor,
    ibeaconMinor
  ) : Buffer {
    let prefix = Buffer.alloc(2);
    prefix.writeUInt8(crownstoneId, 0);
    prefix.writeUInt8(sphereUid,    1);

    let processedUUID = ibeaconUUID.replace(/:/g,"").replace(/-/g,"");
    let uuidBuffer = Buffer.from(Buffer.from(processedUUID, 'hex').reverse());
    let ibeaconBuffer = Buffer.alloc(4);
    ibeaconBuffer.writeUInt16LE(ibeaconMajor, 0);
    ibeaconBuffer.writeUInt16LE(ibeaconMinor, 2);

    let data = Buffer.concat([prefix, adminKey, memberKey, basicKey, serviceDataKey, localizationKey, meshDeviceKey, meshAppKey, meshNetworkKey, uuidBuffer, ibeaconBuffer]);

    return new ControlPacket(ControlType.SETUP).loadBuffer(data).getPacket()
  }


  static getRemoveFilterPacket(filterId: number) : Buffer {
    let assetCommand = new AssetFilterCommand().loadUInt8(filterId);
    return new ControlPacket(ControlType.REMOVE_FILTER).loadBuffer(assetCommand.getPacket()).getPacket()
  }


  static getGetFilterSummariesPacket() : Buffer {
    return new ControlPacket(ControlType.GET_FILTER_SUMMARIES).getPacket()
  }

  /**
   * The provided controlpacket will be wrapped in an MeshCommandBroadcastPacket, which will be wrapped in a Controlpacket.
   * @param controlPacket
   */
  static getMeshCommandBroadcastPacket(controlPacket: Buffer) : Buffer {
    return new ControlPacket(ControlType.MESH_COMMAND).loadBuffer(new MeshCommandBroadcastPacket(controlPacket).getPacket()).getPacket()
  }


  static getCommitFilterChangesPacket(masterVersion: number, masterCRC: number) : Buffer {
    let writer = new DataWriter(6);
    writer.putUInt16(masterVersion);
    writer.putUInt32(masterCRC)
    let assetCommand = new AssetFilterCommand().loadBuffer(writer.getBuffer());
    return new ControlPacket(ControlType.COMMIT_FILTER_CHANGES).loadBuffer(assetCommand.getPacket()).getPacket()
  }


  static getUploadFilterPacket(chunk: Buffer) : Buffer {
    let assetCommand = new AssetFilterCommand().loadBuffer(chunk);
    return new ControlPacket(ControlType.UPLOAD_FILTER).loadBuffer(assetCommand.getPacket()).getPacket()
  }

  static getRefreshTopologyPacket() : Buffer {
    return new ControlPacket(ControlType.REFRESH_TOPOLOGY).getPacket()
  }
}
