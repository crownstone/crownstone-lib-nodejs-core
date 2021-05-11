import {Util} from "../src/util/Util";

test("Check lollipop", async () => {

  expect(Util.isHigherLollipop(0, 4, 100, 6000)).toBeFalsy();
  expect(Util.isHigherLollipop(0, 0, 100, 6000)).toBeFalsy();
  expect(Util.isHigherLollipop(4, 0, 100, 6000)).toBeTruthy();
  expect(Util.isHigherLollipop(4, 101, 100, 6000)).toBeFalsy();

  expect(Util.isHigherLollipop(5900, 101, 100, 6000)).toBeFalsy();
  expect(Util.isHigherLollipop(101, 5900, 100, 6000)).toBeTruthy();

  expect(Util.isHigherLollipop(105, 2800, 100, 6000)).toBeFalsy();
  expect(Util.isHigherLollipop(2800, 105, 100, 6000)).toBeTruthy();

  expect(Util.isHigherLollipop(2800, 3400, 100, 6000)).toBeFalsy();
  expect(Util.isHigherLollipop(3400, 2800, 100, 6000)).toBeTruthy();

  expect(Util.isHigherLollipop(200, 3200, 100, 6100)).toBeFalsy();
  expect(Util.isHigherLollipop(200, 3201, 100, 6100)).toBeTruthy();
  expect(Util.isHigherLollipop(200, 300, 100, 6100)).toBeFalsy();
  expect(Util.isHigherLollipop(50, 3300, 100, 6100)).toBeFalsy();

})