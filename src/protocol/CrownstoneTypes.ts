
export const ControlType = {
  SETUP                        : 0,
  FACTORY_RESET                : 1,
  GET_STATE                    : 2,
  SET_STATE                    : 3,
  GET_BOOTLOADER_VERSION       : 4,
  GET_UICR_DATA                : 5,
  SET_IBEACON_CONFIG_ID        : 6,
  GET_MAC_ADDRESS              : 7,
  RESET                        : 10,
  GOTO_DFU                     : 11,
  NO_OPERATION                 : 12,
  DISCONNECT                   : 13,
  SWITCH                       : 20,
  MULTISWITCH                  : 21,
  PWM                          : 22,
  RELAY                        : 23,
  SET_TIME                     : 30,
  SET_TX                       : 31,
  RESET_ERRORS                 : 32,
  MESH_COMMAND                 : 33,
  SET_SUN_TIMES                : 34,
  GET_TIME                     : 35,
  REFRESH_TOPOLOGY             : 36,
  ALLOW_DIMMING                : 40,
  LOCK_SWITCH                  : 41,
  UART_MESSAGE                 : 50,
  SAVE_BEHAVIOUR               : 60,
  REPLACE_BEHAVIOUR            : 61,
  REMOVE_BEHAVIOUR             : 62,
  GET_BEHAVIOUR                : 63,
  GET_BEHAVIOUR_INDICES        : 64,
  GET_BEHAVIOUR_DEBUG          : 69,
  REGISTER_TRACKED_DEVICE      : 70,
  TRACKED_DEVICE_HEARTBEAT     : 71,
  GET_UPTIME                   : 80,
  GET_ADC_RESTARTS             : 81,
  GET_SWITCH_HISTORY           : 82,
  GET_POWERSAMPLES             : 83,
  GET_MIN_SCHEDULER_FREE_SPACE : 84,
  GET_LAST_RESET_REASON        : 85,
  GET_GPREGRET                 : 86,
  GET_ADC_CHANNEL_SWAPS        : 87,
  GET_RAM_STATISTICS           : 88,
  UPLOAD_MICROAPP              : 90,
  CLEAN_FLASH                  : 100,
  UPLOAD_FILTER                : 110,
  REMOVE_FILTER                : 111,
  COMMIT_FILTER_CHANGES        : 112,
  GET_FILTER_SUMMARIES         : 113,

  UNSPECIFIED                  : 65535
};

export let ControlTypeInv = {}
Object.keys(ControlType).forEach((value) => { ControlTypeInv[ControlType[value]] = value; })


export const StateType = {
  PWM_PERIOD                          : 5,
  IBEACON_MAJOR                       : 6,
  IBEACON_MINOR                       : 7,
  IBEACON_UUID                        : 8,
  IBEACON_TX_POWER                    : 9,
  TX_POWER                            : 11,
  ADVERTISEMENT_INTERVAL              : 12,
  SCAN_DURATION                       : 16,
  SCAN_BREAK_DURATION                 : 18,
  BOOT_DELAY                          : 19,
  MAX_CHIP_TEMP                       : 20,
  MESH_ENABLED                        : 24,
  ENCRYPTION_ENABLED                  : 25,
  IBEACON_ENABLED                     : 26,
  SCANNER_ENABLED                     : 27,
  SPHERE_UID                          : 33,
  CROWNSTONE_IDENTIFIER               : 34,
  ADMIN_ENCRYPTION_KEY                : 35,
  MEMBER_ENCRYPTION_KEY               : 36,
  BASIC_ENCRYPTION_KEY                : 37,
  SCAN_INTERVAL                       : 39,
  SCAN_WINDOW                         : 40,
  RELAY_HIGH_DURATION                 : 41,
  LOW_TX_POWER                        : 42,
  VOLTAGE_MULTIPLIER                  : 43,
  CURRENT_MULITPLIER                  : 44,
  VOLTAGE_ZERO                        : 45,
  CURRENT_ZERO                        : 46,
  POWER_ZERO                          : 47,
  CURRENT_CONSUMPTION_THRESHOLD       : 50,
  CURRENT_CONSUMPTION_THRESHOLD_DIMMER: 51,
  DIMMER_TEMP_UP_VOLTAGE              : 52,
  DIMMER_TEMP_DOWN_VOLTAGE            : 53,
  DIMMING_ALLOWED                     : 54,
  SWITCH_LOCKED                       : 55,
  SWITCHCRAFT_ENABLED                 : 56,
  SWITCHCRAFT_THRESHOLD               : 57,
  UART_ENABLED                        : 59,
  DEVICE_NAME                         : 60,
  SERVICE_DATA_KEY                    : 61,
  MESH_DEVICE_KEY                     : 62,
  MESH_APPLICATION_KEY                : 63,
  MESH_NETWORK_KEY                    : 64,
  LOCALIZATION_KEY                    : 65,
  START_DIMMER_ON_ZERO_CROSSING       : 66,
  TAP_TO_TOGGLE_ENABLED               : 67,
  TAP_TO_TOGGLE_RSSI_THRESHOLD_OFFSET : 68,
  RESET_COUNTER                       : 128,
  SWITCH_STATE                        : 129,
  ACCUMULATED_ENERGY                  : 130,
  POWER_USAGE                         : 131,
  TRACKED_DEVICES                     : 132,
  SCHEDULE                            : 133,
  OPERATION_MODE                      : 134,
  TEMPERATURE                         : 135,
  TIME                                : 136,
  ERROR_BITMASK                       : 139,
  SUNTIMES                            : 149,
  BEHAVIOUR_SETTINGS                  : 150,
  SOFT_ON_SPEED                       : 156,
  HUB_MODE                            : 157,
  UART_KEY                            : 158
};

export const DeviceType = {
  UNDEFINED             : 0,
  PLUG                  : 1,
  GUIDESTONE            : 2,
  BUILTIN               : 3,
  CROWNSTONE_USB        : 4,
  BUILTIN_ONE           : 5,

  getLabel: function(value) {
    let keys = Object.keys(DeviceType);
    for (let i = 0; i < keys.length; i++) {
      if (DeviceType[keys[i]] === value) {
        return keys[i];
      }
    }
    return 'undefined';
  },
};

export const ResultValue = {
  SUCCESS               : 0,      // Completed successfully.
  WAIT_FOR_SUCCESS      : 1,      // Command is successful so far, but you need to wait for SUCCESS.
  SUCCESS_NO_CHANGE     : 2,      // Command is successful, but nothing changed.
  BUFFER_UNASSIGNED     : 16,     // No buffer was assigned for the command.
  BUFFER_LOCKED         : 17,     // Buffer is locked, failed queue command.
  BUFFER_TO_SMALL       : 18,     // Buffer is too small for operation.
  NOT_ALIGNED           : 19,     // NOT_ALIGNED	Buffer is not aligned.
  WRONG_PAYLOAD_LENGTH  : 32,     // Wrong payload length provided.
  WRONG_PARAMETER       : 33,     // Wrong parameter provided.
  INVALID_MESSAGE       : 34,     // invalid message provided.
  UNKNOWN_OP_CODE       : 35,     // Unknown operation code provided.
  UNKNOWN_TYPE          : 36,     // Unknown type provided.
  NOT_FOUND             : 37,     // The thing you were looking for was not found.
  NO_SPACE              : 38,     // NO_SPACE	There is no space for this command.
  BUSY                  : 39,     // BUSY	Wait for something to be done. You can usually retry later.
  WRONG_STATE           : 40,     // WRONG_STATE	The crownstone is in a wrong state.
  ALREADY_EXISTS        : 41,     // ALREADY_EXISTS	Item already exists.
  TIMEOUT               : 42,     // TIMEOUT	Operation timed out.
  CANCELED              : 43,     // CANCELED	Operation was canceled.
  PROTOCOL_UNSUPPORTED  : 44,     // PROTOCOL_UNSUPPORTED	The protocol is not supported.
  MISMATCH              : 45,     // MISMATCH	There is a mismatch, usually in CRC/checksum/hash.
  NO_ACCESS             : 48,     // NO_ACCESS	Invalid access for this command.
  UNSAFE                : 49,     // UNSAFE	It's unsafe to execute this command.
  NOT_AVAILABLE         : 64,     // Command currently not available.
  NOT_IMPLEMENTED       : 65,     // Command not implemented (not yet or not anymore).
  NOT_INITIALIZED       : 67,     // NOT_INITIALIZED	Something must first be initialized.
  NOT_STARTED           : 68,     // NOT_STARTED	Something must first be started.
  NOT_POWERED           : 69,     // NOT_POWERED
  WRITE_DISABLED        : 80,     // Write is disabled for given type.
  WRITE_NOT_ALLOWED     : 81,     // Direct write is not allowed for this type, use command instead.
  READ_FAILED           : 82,     // Direct write is not allowed for this type, use command instead.
  ADC_INVALID_CHANNEL   : 96,     // Invalid adc input channel selected.
  EVENT_UNHANDLED       : 112,    // Invalid adc input channel selected.
};

export let ResultValueInv = {}
Object.keys(ResultValue).forEach((value) => { ResultValueInv[ResultValue[value]] = value; })

export const ProcessType = {
  CONTINUE              : 0,
  FINISHED              : 1,
  ABORT_ERROR           : 2,
};

export const BroadcastTypes = {
  NO_OP                 : 0,
  MULTI_SWITCH          : 1,
  SET_TIME              : 2,
  BEHAVIOUR_SETTINGS    : 3,
};
