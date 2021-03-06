
interface keyMap {
  adminKey        : string,
  memberKey       : string,
  basicKey        : string,
  serviceDataKey  : string,
  localizationKey : string,
  meshNetworkKey  : string,
  meshAppKey      : string,
}

type PromiseCallback = (any) => Promise<any>

interface ServiceDataJson {
  opCode                    : number,
  dataType                  : number,
  stateOfExternalCrownstone : boolean,
  hasError                  : boolean,
  setupMode                 : boolean,
  crownstoneId              : number,
  switchState               : number,
  flagsBitmask              : number,
  temperature               : number,
  powerFactor               : number,
  powerUsageReal            : number,
  powerUsageApparent        : number,
  accumulatedEnergy         : number,
  timestamp                 : number,
  dimmerReady               : boolean,
  dimmingAllowed            : boolean,
  switchLocked              : boolean,
  switchCraftEnabled        : boolean,
  errorMode                 : boolean,
  errors                    : CrownstoneErrorJson,
  uniqueElement             : number,
  timeIsSet                 : boolean,
  deviceType                : string,
  rssiOfExternalCrownstone  : number,
}

interface CrownstoneErrorJson {
  overCurrent       : boolean,
  overCurrentDimmer : boolean,
  temperatureChip   : boolean,
  temperatureDimmer : boolean,
  dimmerOnFailure   : boolean,
  dimmerOffFailure  : boolean,
  bitMask           : number,
}

interface CuckooExtendedFingerprint {
  fingerprint: number,
  bucketA: number,
  bucketB: number
}

type filterId  = number;
type filterCRC = number;

interface FilterSyncingTargetData {
  masterVersion: number,
  masterCRC: number,
  filters: FilterData[]
}

interface FilterData {
  idOnCrownstone: number,
  crc:            number,
  filter:         Buffer
}