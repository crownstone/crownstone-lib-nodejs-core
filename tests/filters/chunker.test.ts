import {FilterChunker} from "../../src/util/FilterUtil";


test("Filterchunker should work", async () => {
  let array = [];
  for (let i = 0; i < 40; i++) {
    array.push(i);
  }
  let data = Buffer.from(array);

  let chunker = new FilterChunker(0, data, 32);

  expect(chunker.getAmountOfChunks()).toBe(2);

  let chunk1 = chunker.getChunk()
  let chunk2 = chunker.getChunk()

  expect(chunk1.finished).toBeFalsy()
  expect(chunk2.finished).toBeTruthy()

  expect(chunk1.packet).toMatchSnapshot();
  expect(chunk2.packet).toMatchSnapshot();
})