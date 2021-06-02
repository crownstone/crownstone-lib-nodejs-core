import {Bitmask} from "../src/util/Bitmask";

test("Check lollipop", async () => {

  let mask = new Bitmask(1);

  mask.setHigh(1);

  expect(mask.value).toBe(2);

  mask.setHigh([0,1])

  expect(mask.value).toBe(3);

  mask.setLow([0])

  expect(mask.value).toBe(2);

  expect(mask.isHigh(0)).toBeFalsy()
  expect(mask.isHigh(1)).toBeTruthy()

  expect([...mask.getPacket()]).toStrictEqual([2])
})