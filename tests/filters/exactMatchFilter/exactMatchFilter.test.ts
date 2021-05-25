import {ExactMatchFilter} from "../../../src/filters/filterModules/ExactMatchFilter";
import {AssetFilter} from "../../../src/filters/AssetFilter";
import {FilterType} from "../../../src/packets/AssetFilters/FilterTypes";


test("Buffer things", async () => {
  let buff = Buffer.from([1,2,3])
  let buff2 = Buffer.from([1,2,3])
  let buff3 = Buffer.from([3,2,3])
  let buff4 = Buffer.from([1,2,4])
  let buff5 = Buffer.from([1])

  // Buffer.compare(buf1, buf2);
  // 0 if they are equal
  // 1 if buf1 is higher than buf2
  // -1 if buf1 is lower than buf2
  expect(buff.compare(buff2)).toBe(0);
  expect(buff.compare(buff3)).toBe(-1);
  expect(buff.compare(buff4)).toBe(-1);
  expect(buff.compare(buff5)).toBe(1);

  let arr = [];
  arr.push(buff);
  arr.push(buff2);
  arr.push(buff3);
  arr.push(buff4);
  arr.push(buff5);

  arr.sort((a,b) => { return a.compare(b); })
  expect(arr[0].compare(buff5)).toBe(0);
})


test("exact match packet construction", async () => {
  let filter = new ExactMatchFilter(2);

  let data = Buffer.from('09cd','hex');
  filter.add(data);

  expect([...filter.getPacket()]).toStrictEqual([1,2,0x09, 0xcd])
})

test("Asset Filter type determiniation", async () => {
  let filter = new AssetFilter()
    .filterOnManufacturerId()
    .outputMacRssiReport()

  let data = Buffer.from('09cd','hex');
  filter.addToFilter(data);

  expect(filter._determineFilterType()).toBe(FilterType.EXACT_MATCH);
})