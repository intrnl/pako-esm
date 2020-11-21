function create (input, output) {
  return {
    input,
    output: [
      { file: output + '.mjs', format: 'esm' },
      { file: output + '.js', format: 'cjs' },
    ],
  };
}

export default [
  create('./lib/index.js', './dist/pako-esm'),
  create('./lib/inflate.js', './dist/pako-esm-inflate'),
  create('./lib/deflate.js', './dist/pako-esm-deflate'),
  create('./lib/zlib/constants.js', './dist/pako-esm-constants'),
];
