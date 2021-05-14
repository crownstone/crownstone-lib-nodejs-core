

export const Util = {

  boundToUnity: function(value) {
    return Math.min(1,Math.max(value,0));
  },

  bound0_100: function(value) {
    return Util.boundToUnity(value) * 100;
  },

  getBitMaskUInt8: function(value) {
    const result = Array(8).fill(false);
    let one = 1;
    result[0] = (value & one) != 0;
    result[1] = (value & (one << 1)) != 0;
    result[2] = (value & (one << 2)) != 0;
    result[3] = (value & (one << 3)) != 0;
    result[4] = (value & (one << 4)) != 0;
    result[5] = (value & (one << 5)) != 0;
    result[6] = (value & (one << 6)) != 0;
    result[7] = (value & (one << 7)) != 0;
    return result
  },

  getBitMaskUInt32: function(value) {
    const result = Array(32).fill(false);
    let one = 1;

    for (let i = 0; i < 32; i++) {
      result[i] = (value & (one << i)) != 0;
    }

    return result;
  },

  UInt32FromBitmask : function(bitMask) {
    let result = 0;
    let one = 1;

    for (let i = 0; i < 32; i++) {
      if (bitMask[i]) {
        result = (result | (one << i))
      }
    }

    return result
  },

  pad: function(str) {
    if (Number(str) < 10) {
      return '0' + str;
    }
    return str;
  },

  getDateHourId: function(timestamp)  {
    if (timestamp === 0) {
      return 'unknown';
    }
    let date = new Date(timestamp);
    let month = Util.pad(date.getMonth() + 1);
    let day = Util.pad(date.getDate());
    let hours = Util.pad(date.getHours());

    return date.getFullYear() + '/' + month + '/' + day + ' ' + hours + ':00:00'
  },

  getDateFormat: function(timestamp)  {
    if (timestamp === 0) {
      return 'unknown';
    }
    let date = new Date(timestamp);
    let month = Util.pad(date.getMonth() + 1);
    let day = Util.pad(date.getDate());

    return date.getFullYear() + '/' + month + '/' + day
  },

  getDateTimeFormat: function(timestamp)  {
    if (timestamp === 0) {
      return 'unknown';
    }
    let date = new Date(timestamp);

    let month = Util.pad(date.getMonth() + 1);
    let day = Util.pad(date.getDate());
    let hours = Util.pad(date.getHours());
    let minutes = Util.pad(date.getMinutes());
    let seconds = Util.pad(date.getSeconds());

    return date.getFullYear() + '/' + month + '/' + day + ' ' + hours + ':' + minutes + ':' + seconds
  },

  getTimeFormat: function(timestamp, showSeconds = true)  {
    if (timestamp === 0) {
      return 'unknown';
    }

    let date = new Date(timestamp);

    let hours = date.getHours();
    let minutes = Util.pad(date.getMinutes());

    if (showSeconds === false) {
      return hours + ':' + minutes;
    }

    let seconds = Util.pad(date.getSeconds());

    return hours + ':' + minutes + ':' + seconds
  },

  getToken : () : string => {
    return Math.floor(Math.random() * 1e8 /* 65536 */).toString(36);
  },


  mixin: function(base, section, context) {
    for (let key in section) {
      if (section.hasOwnProperty(key)) {
        if (typeof section[key] === 'function') {
          base[key] = section[key].bind(context)
        }
        else {
          base[key] = section[key]
        }
      }
    }
  },

  spreadString: function(string) {
    let result = '';
    for (let i = 0; i < string.length; i++) {
      result += string[i];
      if (i !== (string.length-1) && string[i] !== ' ') {
        result += ' '
      }

      if (string[i] === ' ') {
        result += '   ';
      }
    }
    return result;
  },


  getUUID : () : string => {
    return (
      S4() + S4() + '-' +
      S4() + '-' +
      S4() + '-' +
      S4() + '-' +
      S4() + S4() + S4()
    );
  },

  getShortUUID : () : string => {
    return (
      S4() + S4() + '-' +
      S4()
    );
  },

  crc16_ccitt(arr8 : Buffer | number[]) : number {
    let crc = 0xFFFF

    for (let i = 0; i < arr8.length; i++) {
      let index = ((crc >> 8) ^ arr8[i]) & 0xFF
      crc = (crc16ccitt_table[index] ^ (crc << 8)) & 0xFFFF
    }
    return crc & 0xFFFF
  },


  // Used implementation from here: http://www.cse.yorku.ca/~oz/hash.html
  djb2Hash(arr8: Buffer | number[]) : number {
    let hash = 5381;

    for (let i = 0; i < arr8.length; i++) {
      hash = (hash * 33 + arr8[i]) & 0xffff;
    }
    return hash;
  },


  getDelayLabel: function(delay, fullLengthText = false) {
    if (delay < 60) {
      return Math.floor(delay) + ' seconds';
    }
    else {
      if (fullLengthText === true) {
        return Math.floor(delay / 60) + ' minutes';
      }
      else {
        return Math.floor(delay / 60) + ' min';
      }
    }
  },

  crownstoneTimeToTimestamp: function(csTimestamp) : number {
    let now = Date.now();
    if ((now / csTimestamp) < 10) {
      csTimestamp = csTimestamp / 1000;
    }
    let jsTimestamp = 1000*csTimestamp;
    let timezoneOffsetMinutes = new Date(jsTimestamp).getTimezoneOffset();

    return jsTimestamp + timezoneOffsetMinutes*60000;
  },

  timestampToCrownstoneTime: function(utcTimestamp) : number {
    // for holland in summer, timezoneOffsetMinutes is -120, winter will be -60
    let timezoneOffsetMinutes = new Date(utcTimestamp).getTimezoneOffset();

    return (utcTimestamp - timezoneOffsetMinutes*60000)/1000;
  },

  nowToCrownstoneTime: function() : number {
    return Util.timestampToCrownstoneTime(Date.now())
  },

  versions: {
    isHigher: function(version, compareWithVersion) {
      if (!version || !compareWithVersion) {
        return false;
      }

      let [versionClean, versionRc] = getRC(version);
      let [compareWithVersionClean, compareWithVersionRc] = getRC(compareWithVersion);

      if (checkSemVer(versionClean) === false || checkSemVer(compareWithVersionClean) === false) {
        return false;
      }

      let A = versionClean.split('.');
      let B = compareWithVersionClean.split('.');

      if (A[0] < B[0]) return false;
      else if (A[0] > B[0]) return true;
      else { // A[0] == B[0]
        if (A[1] < B[1]) return false;
        else if (A[1] > B[1]) return true;
        else { // A[1] == B[1]
          if (A[2] < B[2]) return false;
          else if (A[2] > B[2]) return true;
          else { // A[2] == B[2]
            if (versionRc === null && compareWithVersionRc === null) {
              return false;
            }
            else if (versionRc !== null && compareWithVersionRc !== null) {
              return (versionRc > compareWithVersionRc);
            }
            else if (versionRc !== null) {
              // 2.0.0.rc0 is smaller than 2.0.0
              return false;
            }
            else {
              return true;
            }
          }
        }
      }
    },


    /**
     * This is the same as the isHigherOrEqual except it allows access to githashes. It is up to the dev to determine what it can and cannot do.
     * @param myVersion
     * @param minimumRequiredVersion
     * @returns {any}
     */
    canIUse: function(myVersion, minimumRequiredVersion) {
      if (!myVersion)              { return false; }
      if (!minimumRequiredVersion) { return false; }

      let [myVersionClean, myVersionRc] = getRC(myVersion);
      let [minimumRequiredVersionClean, minimumRequiredVersionRc] = getRC(minimumRequiredVersion);

      if (checkSemVer(myVersionClean) === false) {
        return true;
      }

      return Util.versions.isHigherOrEqual(myVersionClean, minimumRequiredVersionClean);
    },

    isHigherOrEqual: function(version, compareWithVersion) {
      if (!version || !compareWithVersion) {
        return false;
      }

      let [versionClean, versionRc] = getRC(version);
      let [compareWithVersionClean, compareWithVersionRc] = getRC(compareWithVersion);

      if (checkSemVer(versionClean) === false || checkSemVer(compareWithVersionClean) === false) {
        return false;
      }

      if (version === compareWithVersion && version && compareWithVersion) {
        return true;
      }

      if (versionClean === compareWithVersionClean && versionClean && compareWithVersionClean && versionRc === compareWithVersionRc) {
        return true;
      }

      return Util.versions.isHigher(version, compareWithVersion);
    },

    isLower: function(version, compareWithVersion) {
      if (!version || !compareWithVersion) {
        return false;
      }

      let [versionClean, versionRc] = getRC(version);
      let [compareWithVersionClean, compareWithVersionRc] = getRC(compareWithVersion);

      if (checkSemVer(versionClean) === false || checkSemVer(compareWithVersionClean) === false) {
        return false;
      }

      // Do not allow compareWithVersion to be semver
      if (compareWithVersionClean.split(".").length !== 3) {
        return false;
      }

      // if version is NOT semver, is higher will be false so is lower is true.
      return !Util.versions.isHigherOrEqual(version, compareWithVersion);
    },
  },




  deepCopy(object) {
    return Util.deepExtend({}, object);
  },

  deepExtend: function (a, b, protoExtend = false, allowDeletion = false) {
    for (let prop in b) {
      if (b.hasOwnProperty(prop) || protoExtend === true) {
        if (b[prop] && b[prop].constructor === Object) {
          if (a[prop] === undefined) {
            a[prop] = {};
          }
          if (a[prop].constructor === Object) {
            Util.deepExtend(a[prop], b[prop], protoExtend);
          }
          else {
            if ((b[prop] === null) && a[prop] !== undefined && allowDeletion === true) {
              delete a[prop];
            }
            else {
              a[prop] = b[prop];
            }
          }
        }
        else if (Array.isArray(b[prop])) {
          a[prop] = [];
          for (let i = 0; i < b[prop].length; i++) {
            if (b[prop][i] && b[prop][i].constructor === Object) {
              a[prop].push(Util.deepExtend({},b[prop][i]));
            }
            else {
              a[prop].push(b[prop][i]);
            }
          }
        }
        else {
          if ((b[prop] === null) && a[prop] !== undefined && allowDeletion === true) {
            delete a[prop];
          }
          else {
            a[prop] = b[prop];
          }
        }
      }
    }
    return a;
  },

  deepCompare: function (a, b, d=0) {
    let iterated = false;
    for (let prop in b) {
      iterated = true;
      if (b.hasOwnProperty(prop)) {
        if (a[prop] === undefined) {
          return false;
        }
        else if (b[prop] && !a[prop] || a[prop] && !b[prop]) {
          return false;
        }
        else if (!b[prop] && !a[prop] && a[prop] != b[prop]) {
          return false;
        }
        else if (!b[prop] && !a[prop] && a[prop] == b[prop]) {
          continue;
        }
        else if (b[prop].constructor === Object) {
          if (a[prop].constructor === Object) {
            if (Util.deepCompare(a[prop], b[prop], d+1) === false) {
              return false
            }
          }
          else {
            return false;
          }
        }
        else if (Array.isArray(b[prop])) {
          if (Array.isArray(a[prop]) === false) {
            return false;
          }
          else if (a[prop].length !== b[prop].length) {
            return false;
          }

          for (let i = 0; i < b[prop].length; i++) {
            if (Util.deepCompare(a[prop][i], b[prop][i]) === false) {
              return false;
            }
          }
        }
        else {
          if (a[prop] !== b[prop]) {
            return false;
          }
        }
      }
    }

    if (!iterated) {
      return a === b;
    }

    return true;
  },

  promiseBatchPerformer: function(arr : any[], method : PromiseCallback) : Promise<void> {
    if (arr.length === 0) {
      return new Promise((resolve, reject) => { resolve() });
    }
    return Util._promiseBatchPerformer(arr, 0, method);
  },

  _promiseBatchPerformer: function(arr : any[], index : number, method : PromiseCallback) : Promise<void>  {
    return new Promise((resolve, reject) => {
      if (index < arr.length) {
        method(arr[index])
          .then(() => {
            return Util._promiseBatchPerformer(arr, index+1, method);
          })
          .then(() => {
            resolve()
          })
          .catch((err) => reject(err))
      }
      else {
        resolve();
      }
    })
  },

  capitalize: function(inputStr: string) {
    if (!inputStr) { return "" }

    return inputStr[0].toUpperCase() + inputStr.substr(1)
  },

  stringify: function(obj, space = 2) {
    let allKeys = [];
    JSON.stringify( obj, function( key, value ){ allKeys.push( key ); return value; } )
    allKeys.sort();
    return JSON.stringify( obj, allKeys, space);
  },



  wait: function(waitTimeMs : number) : Promise<void> {
    return new Promise(function(resolve, reject) {
      setTimeout(function() { resolve() }, waitTimeMs)
    })
  },

  prepareKey(key: string | Buffer) {
    if (!key) { return Buffer.alloc(16) }

    if (key instanceof Buffer) {
      return key;
    }

    if (key.length === 16) {
      return Buffer.from(key, 'ascii');
    }
    else if (key.length === 32) {
      return Buffer.from(key, 'hex')
    }
    else {
      throw "Invalid Key: " + key;
    }
  },


};


const S4 = function () {
  return Math.floor(Math.random() * 0x10000 /* 65536 */).toString(16);
};


function getRC(version) {
  let lowerCaseVersion = version.toLowerCase();
  let lowerCaseRC_split = lowerCaseVersion.split("-rc");
  let RC = null;
  if (lowerCaseRC_split.length > 1) {
    RC = lowerCaseRC_split[1];
  }

  return [lowerCaseRC_split[0], RC];
}

let checkSemVer = (str) => {
  if (!str) { return false; }

  // a git commit hash is longer than 12, we pick 12 so 123.122.1234 is the max semver length.
  if (str.length > 12) {
    return false;
  }

  let A = str.split('.');

  // further ensure only semver is compared
  if (A.length !== 3) {
    return false;
  }

  return true;
};

const crc16ccitt_table = [
  0x0000, 0x1021, 0x2042, 0x3063, 0x4084, 0x50a5, 0x60c6, 0x70e7,
  0x8108, 0x9129, 0xa14a, 0xb16b, 0xc18c, 0xd1ad, 0xe1ce, 0xf1ef,
  0x1231, 0x0210, 0x3273, 0x2252, 0x52b5, 0x4294, 0x72f7, 0x62d6,
  0x9339, 0x8318, 0xb37b, 0xa35a, 0xd3bd, 0xc39c, 0xf3ff, 0xe3de,
  0x2462, 0x3443, 0x0420, 0x1401, 0x64e6, 0x74c7, 0x44a4, 0x5485,
  0xa56a, 0xb54b, 0x8528, 0x9509, 0xe5ee, 0xf5cf, 0xc5ac, 0xd58d,
  0x3653, 0x2672, 0x1611, 0x0630, 0x76d7, 0x66f6, 0x5695, 0x46b4,
  0xb75b, 0xa77a, 0x9719, 0x8738, 0xf7df, 0xe7fe, 0xd79d, 0xc7bc,
  0x48c4, 0x58e5, 0x6886, 0x78a7, 0x0840, 0x1861, 0x2802, 0x3823,
  0xc9cc, 0xd9ed, 0xe98e, 0xf9af, 0x8948, 0x9969, 0xa90a, 0xb92b,
  0x5af5, 0x4ad4, 0x7ab7, 0x6a96, 0x1a71, 0x0a50, 0x3a33, 0x2a12,
  0xdbfd, 0xcbdc, 0xfbbf, 0xeb9e, 0x9b79, 0x8b58, 0xbb3b, 0xab1a,
  0x6ca6, 0x7c87, 0x4ce4, 0x5cc5, 0x2c22, 0x3c03, 0x0c60, 0x1c41,
  0xedae, 0xfd8f, 0xcdec, 0xddcd, 0xad2a, 0xbd0b, 0x8d68, 0x9d49,
  0x7e97, 0x6eb6, 0x5ed5, 0x4ef4, 0x3e13, 0x2e32, 0x1e51, 0x0e70,
  0xff9f, 0xefbe, 0xdfdd, 0xcffc, 0xbf1b, 0xaf3a, 0x9f59, 0x8f78,
  0x9188, 0x81a9, 0xb1ca, 0xa1eb, 0xd10c, 0xc12d, 0xf14e, 0xe16f,
  0x1080, 0x00a1, 0x30c2, 0x20e3, 0x5004, 0x4025, 0x7046, 0x6067,
  0x83b9, 0x9398, 0xa3fb, 0xb3da, 0xc33d, 0xd31c, 0xe37f, 0xf35e,
  0x02b1, 0x1290, 0x22f3, 0x32d2, 0x4235, 0x5214, 0x6277, 0x7256,
  0xb5ea, 0xa5cb, 0x95a8, 0x8589, 0xf56e, 0xe54f, 0xd52c, 0xc50d,
  0x34e2, 0x24c3, 0x14a0, 0x0481, 0x7466, 0x6447, 0x5424, 0x4405,
  0xa7db, 0xb7fa, 0x8799, 0x97b8, 0xe75f, 0xf77e, 0xc71d, 0xd73c,
  0x26d3, 0x36f2, 0x0691, 0x16b0, 0x6657, 0x7676, 0x4615, 0x5634,
  0xd94c, 0xc96d, 0xf90e, 0xe92f, 0x99c8, 0x89e9, 0xb98a, 0xa9ab,
  0x5844, 0x4865, 0x7806, 0x6827, 0x18c0, 0x08e1, 0x3882, 0x28a3,
  0xcb7d, 0xdb5c, 0xeb3f, 0xfb1e, 0x8bf9, 0x9bd8, 0xabbb, 0xbb9a,
  0x4a75, 0x5a54, 0x6a37, 0x7a16, 0x0af1, 0x1ad0, 0x2ab3, 0x3a92,
  0xfd2e, 0xed0f, 0xdd6c, 0xcd4d, 0xbdaa, 0xad8b, 0x9de8, 0x8dc9,
  0x7c26, 0x6c07, 0x5c64, 0x4c45, 0x3ca2, 0x2c83, 0x1ce0, 0x0cc1,
  0xef1f, 0xff3e, 0xcf5d, 0xdf7c, 0xaf9b, 0xbfba, 0x8fd9, 0x9ff8,
  0x6e17, 0x7e36, 0x4e55, 0x5e74, 0x2e93, 0x3eb2, 0x0ed1, 0x1ef0
]