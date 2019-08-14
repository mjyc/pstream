const { smap } = require("../../src/wppl/pstream.wppl.js");

test("smap", async () => {
  const input = [{ stamp: 0, value: 0 }, { stamp: 1, value: 1 }];
  const output = smap(x => x + 1, input);
  const expected = [{ stamp: 0, value: 1 }, { stamp: 1, value: 2 }];
  expect(output).toEqual(expected);
});
