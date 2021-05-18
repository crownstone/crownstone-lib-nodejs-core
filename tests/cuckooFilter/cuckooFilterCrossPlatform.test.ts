import {CuckooFilterCore, generateCuckooFilterParameters} from "../../src/filters/filterModules/cuckooFilter";
import * as fs from "fs";
import path from "path";
import {
  FilterFormatMaskedAdData,
  FilterMetaData,
  FilterOutputDescription,
} from "../../src/packets/AssetFilters/FilterMetaDataPackets";
import {AssetFilter} from "../../src/filters/AssetFilter";
import {FilterOutputDescriptionType} from "../../src/packets/AssetFilters/FilterTypes";


beforeEach(async () => {})
beforeAll( async () => {})
afterAll(  async () => {})

test("CuckooFilter Cross platform test", async () => {
  let operationInstructions = fs.readFileSync(path.join(__dirname,'crossPlatformDataFiles', 'cuckoo_size_128_4_len_6_20.csv.cuck'),'utf-8')
  let lines = operationInstructions.split("\n");
  let filter = null;
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i]
    if (line[0] === '#') {
      // this is a comment, ignore
      continue;
    }
    if (line == "") { continue; }
    let items = line.split(",");

    if (items[0] === "cuckoofilter") {
      filter = new CuckooFilterCore(Number(items[1]), Number(items[2]));
      continue;
    }
    if (items[0] !== 'add') {
      continue;
    }

    if (!filter) {
      throw "Invalid testfile. Should have started with the filter";
    }

    // operation type is add;
    let data = []
    for (let i = 1; i < items.length; i++) {
      data.push(Number(items[i]));
    }

    expect(filter.add(data)).toBeTruthy()
  }

  let packet = filter.getPacket()
  let expectedFormat = fs.readFileSync(path.join(__dirname, 'crossPlatformDataFiles', "cuckoo_size_128_4_len_6_20.cuck"),'utf-8')
  let expectedBytes = expectedFormat.split(",")

  let matchCount = 0;
  for (let i = 0; i < packet.length; i++) {
    expect(packet[i]).toBe(Number(expectedBytes[i]))
    matchCount++;
  }

  // to be sure all bytes have been matched, check how many filled bytes there are in this array (a trailing , can cause an extra item which is empty)
  // and check if these have all been compared.
  let filledBytes = 0;
  for (let b of expectedBytes) {
    if (b) {
      filledBytes++;
    }
  }
  expect(matchCount).toBe(filledBytes);
})

test("CuckooFilter ADType crossPlatform test", async () => {
  let meta = new FilterMetaData(255);
  meta.input = new FilterFormatMaskedAdData(0xff, 3);
  meta.outputDescription = new FilterOutputDescription(FilterOutputDescriptionType.MAC_ADDRESS_REPORT)
  let filter = new AssetFilter(meta);

  let data = 'cd09';

  filter.addToFilter(Buffer.from(data, 'hex'));

  let params = generateCuckooFilterParameters(1);

  expect(params.bucketCountLog2).toBe(0);
  expect(params.nestPerBucket).toBe(2);

  let filterPacket = filter.getFilterPacket();
  let filterCRC = filter.getCRC();

  let stringifiedDataPacket = filterPacket.toString('hex');
  let stringifiedCRCPacket  = filterCRC.toString(16);

  expect(stringifiedDataPacket).toBe("00ff02ff03000000000002000000002eec0000");
  expect(stringifiedCRCPacket).toBe("4da705e8");
})