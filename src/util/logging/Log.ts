import {LOG_LEVEL, LogConfig} from "../../declarations/enums";

export class Logger {
  level : number;
  levelPrefix : string;
  levelConfig = LogConfig;

  constructor(level) {
    this.level = level;
    this.levelPrefix = this._getPrefix(level);
  }

  setLogLevel(levels) {
    this.levelConfig = levels;
  }

  log(...any) {
    this._log('Info -----', this.levelConfig.log, arguments);
  }

  ble(...any) {
    this._log('BLE ------', this.levelConfig.ble, arguments);
  }

  usb(...any) {
    this._log('USB ------', this.levelConfig.usb, arguments);
  }

  event(...any) {
    this._log('Event ----', this.levelConfig.events, arguments);
  }

  cloud(...any) {
    this._log('Cloud ----', this.levelConfig.cloud, arguments);
  }

  system(...any) {
    this._log('System ---', this.levelConfig.system, arguments);
  }

  error(...any) {
    this._logType('ERROR ----', this.levelConfig.log, LOG_LEVEL.error,  arguments);
  }

  warn(...any) {
    this._logType('WARNING --', this.levelConfig.log, LOG_LEVEL.warning,  arguments);
  }

  info(...any) {
    this._logType('Info -----', this.levelConfig.log, LOG_LEVEL.info,  arguments);
  }

  debug(...any) {
    this._logType('Debug ----', this.levelConfig.log, LOG_LEVEL.debug,  arguments);
  }

  verbose(...any) {
    this._logType('Verbose --', this.levelConfig.log, LOG_LEVEL.debug,  arguments);
  }


  _getPrefix(level) {
    switch(level) {
      case LOG_LEVEL.verbose:
        return 'v';
      case LOG_LEVEL.debug:
        return 'd';
      case LOG_LEVEL.info:
        return 'i';
      case LOG_LEVEL.warning:
        return 'w';
      case LOG_LEVEL.error:
        return 'e';
      default:
        return 'v';
    }
  }


  _log(type, configCheckField, allArguments) {
    if (configCheckField <= this.level) {
      let args = ['LOG' + this.levelPrefix + ' ' + type + ' :'];
      for (let i = 0; i < allArguments.length; i++) {
        let arg = allArguments[i];
        args.push(arg);
      }
      console.log.apply(this, args);
    }
  }

  _logType(type, configCheckField, forcedLevel, allArguments) {
    if (configCheckField <= forcedLevel) {
      let args = ['LOG' + this._getPrefix(forcedLevel) + ' ' + type + ' :'];
      for (let i = 0; i < allArguments.length; i++) {
        let arg = allArguments[i];
        args.push(arg);
      }
      console.log.apply(this, args);
    }
  }
}


export const LOGv   = new Logger(LOG_LEVEL.verbose);
export const LOGd   = new Logger(LOG_LEVEL.debug  );
export const LOGi   = new Logger(LOG_LEVEL.info   );
export const LOG    = new Logger(LOG_LEVEL.info   );
export const LOGw   = new Logger(LOG_LEVEL.warning);
export const LOGe   = new Logger(LOG_LEVEL.error  );

