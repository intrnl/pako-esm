// Deflate compression method
export let Z_DEFLATED: 8;

// Flush values
export let Z_NO_FLUSH: 0;
export let Z_PARTIAL_FLUSH: 1;
export let Z_SYNC_FLUSH: 2;
export let Z_FULL_FLUSH: 3;
export let Z_FINISH: 4;
export let Z_BLOCK: 5;
export let Z_TREES: 6;

// Strategy values
export let Z_FILTERED: 1;
export let Z_HUFFMAN_ONLY: 2;
export let Z_RLE: 3;
export let Z_FIXED: 4;
export let Z_DEFAULT_STRATEGY: 0;

// Compression levels
export let Z_NO_COMPRESSION: 0;
export let Z_BEST_SPEED: 1;
export let Z_BEST_COMPRESSION: 9;
export let Z_DEFAULT_COMPRESSION: -1;

// Data types
export let Z_BINARY: 0;
export let Z_TEXT: 1;
export let Z_UNKNOWN: 2;

// Return codes
export let Z_OK: 0;
export let Z_STREAM_END: 1;
export let Z_NEED_DICT: 2;
export let Z_ERRNO: -1;
export let Z_STREAM_ERROR: -2;
export let Z_DATA_ERROR: -3;
export let Z_BUF_ERROR: -5;
