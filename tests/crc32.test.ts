import {Util} from "../src/util/Util";
test("Check crc32", async () => {
  let dataStr = '00ff01ff00000200000000c04e0000';
  let data = Buffer.from(dataStr,'hex');

  let crc = Util.crc32(data);
  expect(crc).toBe(560669980);
})