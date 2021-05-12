import {Lollipop} from "../src/util/Lollipop";

test("Check lollipop", async () => {

  expect(Lollipop.isHigher(0, 4, 100, 6000)).toBeFalsy();
  expect(Lollipop.isHigher(0, 0, 100, 6000)).toBeFalsy();
  expect(Lollipop.isHigher(4, 0, 100, 6000)).toBeTruthy();
  expect(Lollipop.isHigher(4, 101, 100, 6000)).toBeFalsy();

  expect(Lollipop.isHigher(5900, 101, 100, 6000)).toBeFalsy();
  expect(Lollipop.isHigher(101, 5900, 100, 6000)).toBeTruthy();

  expect(Lollipop.isHigher(105, 2800, 100, 6000)).toBeFalsy();
  expect(Lollipop.isHigher(2800, 105, 100, 6000)).toBeTruthy();

  expect(Lollipop.isHigher(2800, 3400, 100, 6000)).toBeFalsy();
  expect(Lollipop.isHigher(3400, 2800, 100, 6000)).toBeTruthy();

  expect(Lollipop.isHigher(200, 3200, 100, 6100)).toBeFalsy();
  expect(Lollipop.isHigher(200, 3201, 100, 6100)).toBeTruthy();
  expect(Lollipop.isHigher(200, 300, 100, 6100)).toBeFalsy();
  expect(Lollipop.isHigher(50, 3300, 100, 6100)).toBeFalsy();

})