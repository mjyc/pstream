const { smap, sdebounce } = require("../../wppl/pstream.wppl.js");

test("smap", async () => {
  const input = [{ stamp: 0, value: 0 }, { stamp: 1, value: 1 }];
  const output = smap(x => x + 1, input);
  const expected = [{ stamp: 0, value: 1 }, { stamp: 1, value: 2 }];
  expect(output).toEqual(expected);
});

test("sdebounce", async () => {
  const input = [
    { stamp: 0, value: 0 },
    { stamp: 10, value: 1 },
    { stamp: 20, value: 2 },
    { stamp: 30, value: 3 },
    { stamp: 40, value: 4 },
    { stamp: 50, value: 5 },
    { stamp: 60, value: 6 },
    { stamp: 70, value: 7 },
    { stamp: 80, value: 8 },
    { stamp: 90, value: 9 }
  ];
  const output = sdebounce(x => x * 2, input);
  const expected = [
    { stamp: 0, value: 0 },
    { stamp: 12, value: 1 },
    { stamp: 24, value: 2 },
    { stamp: 36, value: 3 },
    { stamp: 48, value: 4 }
  ];
  expect(output).toEqual(expected);
});
