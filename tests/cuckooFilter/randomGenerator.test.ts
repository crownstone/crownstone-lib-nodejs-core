import {RandomGeneratorMSWS} from "../../src/filters/randomGenerator";

beforeEach(async () => {})
beforeAll( async () => {})
afterAll(  async () => {})


/**
 * Small empirical analysis of even/odd bias in start values of random generator.
    No exact bounds on this are imposed at the moment, only testing API consistency.
 */
test("MSWS generator test", async () => {
  let a = new RandomGeneratorMSWS()
  expect(a.get()).toBe(3048033998n);
})

/**
 * Small empirical analysis of even/odd bias in start values of random generator.
    No exact bounds on this are imposed at the moment, only testing API consistency.
 */
test("MSWS generator test 2", async () => {
  let a = new RandomGeneratorMSWS(62777)
  expect(a.get()).toBe(70160621n)
})

