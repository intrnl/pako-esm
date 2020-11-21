export let toString = Object.prototype.toString;
export let assign = Object.assign;
export let U8 = Uint8Array;
export let U16 = Uint16Array;
export let U32 = Uint32Array;
export let I32 = Int32Array;

// Join array of chunks to single array.
export function flattenChunks (chunks) {
  // calculate data length
  let len = 0;

  for (let i = 0, l = chunks.length; i < l; i++) {
    len += chunks[i].length;
  }

  // join chunks
  const result = new U8(len);

  for (let i = 0, pos = 0, l = chunks.length; i < l; i++) {
    let chunk = chunks[i];
    result.set(chunk, pos);
    pos += chunk.length;
  }

  return result;
}

export function createZeroArray (length) {
  return Array.from({ length }, () => 0);
}
