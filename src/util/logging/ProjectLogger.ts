import path from "path";
import fs from "fs";

const winston = require('winston');
require('winston-daily-rotate-file');
const util = require('util');


/** Setting up the formatter**/
function transform(info : any, opts: any) {
  const args = info[Symbol.for('splat')];
  if (args) { info.message = util.format(info.message, ...args); }
  return info;
}
function utilFormatter() { return {transform}; }
// @ts-ignore
let formatter = winston.format.printf(({level, message, label, timestamp}) => `${timestamp} ${label || '-'} ${level}: ${message}`)
let aggregatedFormat = winston.format.combine(
  winston.format.timestamp({format: 'YYYY-MM-DD HH:mm:ss.SSS'}),
  utilFormatter(),     // <-- this is what changed
  formatter,
);
// -----------------------------------

// CUSTOM LEVELS AND COLORS
const levels = {
  none:     0,
  critical: 1,
  error:    2,
  warn:     3,
  notice:   4,
  info:     5,
  debug:    6,
  verbose:  7,
  silly:    8
}
const colors = {
  none:     'gray',
  critical: 'bold black redBG',
  error:    'bold red',
  warn:     'bold yellow',
  notice:   'magenta',
  info:     'green',
  debug:    'cyan',
  verbose:  'gray',
  silly:    'white',
};

// -----------------------------------


// CONFIGURE TRANSPORTS
let fileLogBaseName   = process.env.CS_FILE_LOGGING_BASENAME          || 'crownstone-log';
let fileLogLevel      = process.env.CS_FILE_LOGGING_LEVEL             || 'info';
let consoleLogLevel   = process.env.CS_CONSOLE_LOGGING_LEVEL          || 'info';
let fileLoggingSilent = true;
if (process.env.CS_ENABLE_FILE_LOGGING === '1' || process.env.CS_ENABLE_FILE_LOGGING === 'true') {
  fileLoggingSilent = false;
}
if (process.argv.indexOf("--silent") >= 0) {
  fileLoggingSilent = true;
}
if (fileLogLevel === 'none') {
  fileLoggingSilent = true;
}


function validatePath(targetPath) {
  if (fs.existsSync(targetPath)) {
    return true;
  }
  else {
    let previousPath = path.join(targetPath, '../');
    if (validatePath(previousPath)) {
      // create
      fs.mkdirSync(targetPath);
      return true;
    }
  }
}


const addFileLoggingToLoggers = function() {
  if (FileTransport === null) {
    validatePath(process.env.CS_FILE_LOGGING_DIRNAME || '.');
    LoggerTransports.file = new winston.transports.DailyRotateFile({
      filename: fileLogBaseName+'-%DATE%.log',
      level: fileLogLevel,
      format: aggregatedFormat,
      datePattern: 'YYYY-MM-DD',
      zippedArchive: false,
      dirname: process.env.CS_FILE_LOGGING_DIRNAME || '.',
      maxSize:  '50m',
      maxFiles: '14d',
      auditFile: 'crownstone-log-config.json'
    });
  }

  let loggers = winston.loggers.loggers.keys();
  for (let loggerId of loggers) {
    let logger = winston.loggers.get(loggerId);
    logger.remove(LoggerTransports.file);
    logger.add(LoggerTransports.file);
  }
}
const removeFileLoggingFromLoggers = function() {
  let loggers = winston.loggers.loggers.keys();
  for (let loggerId of loggers) {
    let logger = winston.loggers.get(loggerId);
    logger.remove(LoggerTransports.file);
  }
  LoggerTransports.file = null;
}

export const LoggerTransports = {
  console: new winston.transports.Console({
    level: consoleLogLevel,
    format: winston.format.combine(winston.format.colorize(), aggregatedFormat)
  }),
  file: null,
  setFileLogging: (state) => {
    if (state) {
      addFileLoggingToLoggers()
    }
    else {
      removeFileLoggingFromLoggers()
    }
  }

}
// -----------------------------------


let ProjectLogger : any = null;
let FileTransport = null;

export const generateProjectLogger = function(projectName: string) {
  return function getLogger(_filename: string, individialLogger=false) {
    let filename = path.basename(_filename).replace(path.extname(_filename),'');
    if (individialLogger) {
      let customLogger = _createLogger(projectName + ":" + filename)
      return generateCustomLogger(customLogger, projectName, _filename)
    }
    if (ProjectLogger === null) {
      ProjectLogger = _createLogger(projectName);
    }

    return generateCustomLogger(ProjectLogger, projectName, filename);
  }
}

function _createLogger(projectName) {
  let existing = winston.loggers.loggers.get(projectName);
  if (existing !== undefined) {
    return existing;
  }

  let transportsToUse = [LoggerTransports.console];
  if (LoggerTransports.file !== null) {
    transportsToUse.push(LoggerTransports.file);
  }
  winston.loggers.add(projectName,{
    levels: levels,
    transports: transportsToUse,
  });
  winston.addColors(colors);
  return winston.loggers.get(projectName);
}

type _logGetter = (filename: string) => ((...args: any[]) => void);
const none : _logGetter = function(filename) {
  return function() { ProjectLogger.none(filename, ...arguments)};
}
const critical : _logGetter = function(filename) {
  return function() { ProjectLogger.critical(filename, ...arguments) };
}
const error : _logGetter = function(filename) {
  return function() { ProjectLogger.error(filename, ...arguments) };
}
const warn : _logGetter = function(filename) {
  return function() { ProjectLogger.warn(filename, ...arguments) };
}
const notice : _logGetter = function(filename) {
  return function() { ProjectLogger.notice(filename, ...arguments) };
}
const info : _logGetter = function(filename) {
  return function() { ProjectLogger.info(filename, ...arguments) };
}
const debug : _logGetter = function(filename) {
  return function() { ProjectLogger.debug(filename, ...arguments) };
}
const verbose : _logGetter = function(filename) {
  return function() { ProjectLogger.verbose(filename, ...arguments) };
}
const silly : _logGetter = function(filename) {
  return function() { ProjectLogger.silly(filename, ...arguments) };
}

function generateCustomLogger(logger, projectName, filename) {
  return {
    _logger:     logger,
    transports:  LoggerTransports,
    none:        none(    projectName + ":" + filename + " - "),
    critical:    critical(projectName + ":" + filename + " - "),
    error:       error(   projectName + ":" + filename + " - "),
    warn:        warn(    projectName + ":" + filename + " - "),
    notice:      notice(  projectName + ":" + filename + " - "),
    info:        info(    projectName + ":" + filename + " - "),
    debug:       debug(   projectName + ":" + filename + " - "),
    verbose:     verbose( projectName + ":" + filename + " - "),
    silly:       silly(   projectName + ":" + filename + " - "),
  }
}

