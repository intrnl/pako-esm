# pako-esm

ESM conversion of [pako](https://github.com/nodeca/pako), a high speed zlib
port to JavaScript.

## Differences to pako

There are no default exports, only named exports.

```js
import * as pako from 'pako-esm';
import { Inflate } from 'pako-esm/inflate.js';
import { Z_SYNC_FLUSH } from 'pako-esm/constants.js';
```
