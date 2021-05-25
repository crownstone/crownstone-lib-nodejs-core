import {Util} from "../../../src/util/Util";
import {RandomGeneratorMSWS} from "../../../src/filters/randomGenerator";
import {CuckooFilterCore} from "../../../src/filters/filterModules/CuckooFilter";
import {generateCuckooFilterParameters} from "../../../src/filters/filterModules/CuckooFilter";

beforeEach(async () => {})
beforeAll( async () => {})
afterAll(  async () => {})

test("Verify CRC16", async () => {
  expect(Util.crc16_ccitt([1,2,3,4,5])).toBe(37636)
  expect(Util.crc16_ccitt([63,63])).toBe(53016)
  expect(Util.crc16_ccitt([99,51])).toBe(17734)
  expect(Util.crc16_ccitt([170,251])).toBe(45518)
})

test("Run Cuckoo test 0", async () => {
  let max_buckets_log2 = 7
  let nests_per_bucket = 4
  let load_factor = 0.75

  let filter = new CuckooFilterCore(max_buckets_log2, nests_per_bucket)

  // setup test variables
  let max_items = filter.getMaxFingerprintCount()
  let num_items_to_test = max_items * load_factor;
  let fails = 0;

  for (let i = 0; i < num_items_to_test; i++) {
    let data = Buffer.alloc(4)
        data.writeUInt32LE(i,0)

    if (!filter.add(data)) {
      fails += 1
    }
  }
  expect(fails).toBe(0);
  fails = 0

  // check if they ended up in the filter
  for (let i = 0; i < num_items_to_test; i++) {
    let data = Buffer.alloc(4)
        data.writeUInt32LE(i,0)

    if (!filter.contains(data)) {
      fails += 1
    }
  }

  expect(fails).toBe(0);
})

test("Run Cuckoo test 1", async () => {
  let max_buckets_log2 = 7
  let nests_per_bucket = 4

  let filter = new CuckooFilterCore(max_buckets_log2, nests_per_bucket)

  let data = new Buffer('test','utf-8')

  // this check should not do anything weird when the filter is emptry
  expect(filter.contains(data)).toBeFalsy()
  expect(filter.add(data)).toBeTruthy()
  expect(filter.contains(data)).toBeTruthy()
  expect(filter.remove(data)).toBeTruthy()
  expect(filter.contains(data)).toBeFalsy()
})



test("Run Cuckoo test 2", async () => {
  let max_buckets_log2 = 7
  let nests_per_bucket = 4
  let load_factor = 0.95

  let filter = new CuckooFilterCore(max_buckets_log2, nests_per_bucket)

  let max_items = filter.getMaxFingerprintCount()
  let num_items_to_test = Math.floor(max_items * load_factor);
  expect(num_items_to_test).toBe(486)

  let fails = 0;

  let passMap = {};
  let mac_pass = [];
  let mac_random = [];

  let rand = new RandomGeneratorMSWS()

  for (let i = 0; i < num_items_to_test; i++) {
    mac_pass.push(generateMac(rand));
    mac_random.push(generateMac(rand));
  }


  // map for easy lookup
  for (let mac of mac_pass) {
    passMap[str(mac)] = true;
  }

  for (let i = 0; i < mac_pass.length; i++) {
    let mac = mac_pass[i];
    if (!filter.add(mac)) {
      fails++;
    }
  }
  expect(fails).toBe(0);

  for (let mac of mac_pass) {
    if (!filter.contains(mac)) { fails++; }
  }
  expect(fails).toBe(0);

  let false_positives = 0;
  let false_negatives = 0;

  for (let mac of mac_random) {
    let shouldContain = passMap[str(mac)] == true;
    let contains = filter.contains(mac);

    if (contains !== shouldContain) {
      if (contains) { false_positives += 1; }
      else          { false_negatives += 1; }
    }
  }

  expect(checkTolerance(false_negatives, mac_random.length, 0)).toBeTruthy();
  expect(checkTolerance(false_positives, mac_random.length, 0.05)).toBeTruthy();
  expect(false_positives).toBe(0);
})



test("Test Saturation Match", async () => {
  let filter = new CuckooFilterCore(0, 2)
  let data = Buffer.from('09cd', 'hex');

  filter.add(data);
  filter.saturate();

  expect(filter.contains(data)).toBe(true);
  for (let i = 0; i <= 0xffff; i++) {
    let buff = new Buffer(2);
    buff.writeUInt16LE(i,0);
    if (buff.compare(data) === 0) {
      expect(filter.contains(buff)).toBe(true);
    }
    else {
      expect(filter.contains(buff)).toBe(false);
    }
  }
})


function checkTolerance(fails, total, tolerance) {
  let fails_rel = fails / total
  return !(fails_rel > tolerance);

}

function str(mac) {
  let str = '';
  for (let byte of mac) {
    str += `${byte}:`
  }
  return str;
}

function generateMac(rand) {
  let mac = [];
  for (let i = 0; i < 6; i++) {
    mac.push(byte(rand))
  }
  return mac;
}

function byte(rand) {
  return Number(rand.get()%256n)
}
