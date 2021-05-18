

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


  crc32(arr8 : Buffer | number[]) : number {
    let crc = 0xFFFFFFFFn;

    for (let i = 0; i < arr8.length; i++) {
      let index = Number((crc ^ BigInt(arr8[i])) & 0xFFn);
      crc = (crc32_table[index] ^ (crc >> 8n)) & 0xFFFFFFFFn;
    }
    return Number(crc ^ 0xFFFFFFFFn);
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
];

const crc32_table = [
  0x00000000n, 0x77073096n, 0xee0e612cn, 0x990951ban, 0x076dc419n, 0x706af48fn, 0xe963a535n, 0x9e6495a3n,
  0x0edb8832n, 0x79dcb8a4n, 0xe0d5e91en, 0x97d2d988n, 0x09b64c2bn, 0x7eb17cbdn, 0xe7b82d07n, 0x90bf1d91n,
  0x1db71064n, 0x6ab020f2n, 0xf3b97148n, 0x84be41den, 0x1adad47dn, 0x6ddde4ebn, 0xf4d4b551n, 0x83d385c7n,
  0x136c9856n, 0x646ba8c0n, 0xfd62f97an, 0x8a65c9ecn, 0x14015c4fn, 0x63066cd9n, 0xfa0f3d63n, 0x8d080df5n,
  0x3b6e20c8n, 0x4c69105en, 0xd56041e4n, 0xa2677172n, 0x3c03e4d1n, 0x4b04d447n, 0xd20d85fdn, 0xa50ab56bn,
  0x35b5a8fan, 0x42b2986cn, 0xdbbbc9d6n, 0xacbcf940n, 0x32d86ce3n, 0x45df5c75n, 0xdcd60dcfn, 0xabd13d59n,
  0x26d930acn, 0x51de003an, 0xc8d75180n, 0xbfd06116n, 0x21b4f4b5n, 0x56b3c423n, 0xcfba9599n, 0xb8bda50fn,
  0x2802b89en, 0x5f058808n, 0xc60cd9b2n, 0xb10be924n, 0x2f6f7c87n, 0x58684c11n, 0xc1611dabn, 0xb6662d3dn,
  0x76dc4190n, 0x01db7106n, 0x98d220bcn, 0xefd5102an, 0x71b18589n, 0x06b6b51fn, 0x9fbfe4a5n, 0xe8b8d433n,
  0x7807c9a2n, 0x0f00f934n, 0x9609a88en, 0xe10e9818n, 0x7f6a0dbbn, 0x086d3d2dn, 0x91646c97n, 0xe6635c01n,
  0x6b6b51f4n, 0x1c6c6162n, 0x856530d8n, 0xf262004en, 0x6c0695edn, 0x1b01a57bn, 0x8208f4c1n, 0xf50fc457n,
  0x65b0d9c6n, 0x12b7e950n, 0x8bbeb8ean, 0xfcb9887cn, 0x62dd1ddfn, 0x15da2d49n, 0x8cd37cf3n, 0xfbd44c65n,
  0x4db26158n, 0x3ab551cen, 0xa3bc0074n, 0xd4bb30e2n, 0x4adfa541n, 0x3dd895d7n, 0xa4d1c46dn, 0xd3d6f4fbn,
  0x4369e96an, 0x346ed9fcn, 0xad678846n, 0xda60b8d0n, 0x44042d73n, 0x33031de5n, 0xaa0a4c5fn, 0xdd0d7cc9n,
  0x5005713cn, 0x270241aan, 0xbe0b1010n, 0xc90c2086n, 0x5768b525n, 0x206f85b3n, 0xb966d409n, 0xce61e49fn,
  0x5edef90en, 0x29d9c998n, 0xb0d09822n, 0xc7d7a8b4n, 0x59b33d17n, 0x2eb40d81n, 0xb7bd5c3bn, 0xc0ba6cadn,
  0xedb88320n, 0x9abfb3b6n, 0x03b6e20cn, 0x74b1d29an, 0xead54739n, 0x9dd277afn, 0x04db2615n, 0x73dc1683n,
  0xe3630b12n, 0x94643b84n, 0x0d6d6a3en, 0x7a6a5aa8n, 0xe40ecf0bn, 0x9309ff9dn, 0x0a00ae27n, 0x7d079eb1n,
  0xf00f9344n, 0x8708a3d2n, 0x1e01f268n, 0x6906c2fen, 0xf762575dn, 0x806567cbn, 0x196c3671n, 0x6e6b06e7n,
  0xfed41b76n, 0x89d32be0n, 0x10da7a5an, 0x67dd4accn, 0xf9b9df6fn, 0x8ebeeff9n, 0x17b7be43n, 0x60b08ed5n,
  0xd6d6a3e8n, 0xa1d1937en, 0x38d8c2c4n, 0x4fdff252n, 0xd1bb67f1n, 0xa6bc5767n, 0x3fb506ddn, 0x48b2364bn,
  0xd80d2bdan, 0xaf0a1b4cn, 0x36034af6n, 0x41047a60n, 0xdf60efc3n, 0xa867df55n, 0x316e8eefn, 0x4669be79n,
  0xcb61b38cn, 0xbc66831an, 0x256fd2a0n, 0x5268e236n, 0xcc0c7795n, 0xbb0b4703n, 0x220216b9n, 0x5505262fn,
  0xc5ba3bben, 0xb2bd0b28n, 0x2bb45a92n, 0x5cb36a04n, 0xc2d7ffa7n, 0xb5d0cf31n, 0x2cd99e8bn, 0x5bdeae1dn,
  0x9b64c2b0n, 0xec63f226n, 0x756aa39cn, 0x026d930an, 0x9c0906a9n, 0xeb0e363fn, 0x72076785n, 0x05005713n,
  0x95bf4a82n, 0xe2b87a14n, 0x7bb12baen, 0x0cb61b38n, 0x92d28e9bn, 0xe5d5be0dn, 0x7cdcefb7n, 0x0bdbdf21n,
  0x86d3d2d4n, 0xf1d4e242n, 0x68ddb3f8n, 0x1fda836en, 0x81be16cdn, 0xf6b9265bn, 0x6fb077e1n, 0x18b74777n,
  0x88085ae6n, 0xff0f6a70n, 0x66063bcan, 0x11010b5cn, 0x8f659effn, 0xf862ae69n, 0x616bffd3n, 0x166ccf45n,
  0xa00ae278n, 0xd70dd2een, 0x4e048354n, 0x3903b3c2n, 0xa7672661n, 0xd06016f7n, 0x4969474dn, 0x3e6e77dbn,
  0xaed16a4an, 0xd9d65adcn, 0x40df0b66n, 0x37d83bf0n, 0xa9bcae53n, 0xdebb9ec5n, 0x47b2cf7fn, 0x30b5ffe9n,
  0xbdbdf21cn, 0xcabac28an, 0x53b39330n, 0x24b4a3a6n, 0xbad03605n, 0xcdd70693n, 0x54de5729n, 0x23d967bfn,
  0xb3667a2en, 0xc4614ab8n, 0x5d681b02n, 0x2a6f2b94n, 0xb40bbe37n, 0xc30c8ea1n, 0x5a05df1bn, 0x2d02ef8dn,
];