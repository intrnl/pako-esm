import * as zlib_deflate from './zlib/deflate.js';
import * as commons from './utils/common.js';
import * as strings from './utils/strings.js';
import msg from './zlib/messages.js';
import ZStream from './zlib/zstream.js';

var toString = Object.prototype.toString;

/* Public constants ==========================================================*/
/* ===========================================================================*/

var Z_NO_FLUSH      = 0;
var Z_FINISH        = 4;

var Z_OK            = 0;
var Z_STREAM_END    = 1;
var Z_SYNC_FLUSH    = 2;

var Z_DEFAULT_COMPRESSION = -1;

var Z_DEFAULT_STRATEGY    = 0;

var Z_DEFLATED  = 8;

/* ===========================================================================*/


/**
 * class Deflate
 *
 * Generic JS-style wrapper for zlib calls. If you don't need
 * streaming behaviour - use more simple functions: [[deflate]],
 * [[deflateRaw]] and [[gzip]].
 **/

/* internal
 * Deflate.chunks -> Array
 *
 * Chunks of output data, if [[Deflate#onData]] not overridden.
 **/

/**
 * Deflate.result -> Uint8Array|Array
 *
 * Compressed result, generated by default [[Deflate#onData]]
 * and [[Deflate#onEnd]] handlers. Filled after you push last chunk
 * (call [[Deflate#push]] with `Z_FINISH` / `true` param)  or if you
 * push a chunk with explicit flush (call [[Deflate#push]] with
 * `Z_SYNC_FLUSH` param).
 **/

/**
 * Deflate.err -> Number
 *
 * Error code after deflate finished. 0 (Z_OK) on success.
 * You will not need it in real life, because deflate errors
 * are possible only on wrong options or bad `onData` / `onEnd`
 * custom handlers.
 **/

/**
 * Deflate.msg -> String
 *
 * Error message, if [[Deflate.err]] != 0
 **/


/**
 * new Deflate(options)
 * - options (Object): zlib deflate options.
 *
 * Creates new deflator instance with specified params. Throws exception
 * on bad params. Supported options:
 *
 * - `level`
 * - `windowBits`
 * - `memLevel`
 * - `strategy`
 * - `dictionary`
 *
 * [http://zlib.net/manual.html#Advanced](http://zlib.net/manual.html#Advanced)
 * for more information on these.
 *
 * Additional options, for internal needs:
 *
 * - `chunkSize` - size of generated data chunks (16K by default)
 * - `raw` (Boolean) - do raw deflate
 * - `gzip` (Boolean) - create gzip wrapper
 * - `to` (String) - if equal to 'string', then result will be "binary string"
 *    (each char code [0..255])
 * - `header` (Object) - custom header for gzip
 *   - `text` (Boolean) - true if compressed data believed to be text
 *   - `time` (Number) - modification time, unix timestamp
 *   - `os` (Number) - operation system code
 *   - `extra` (Array) - array of bytes with extra data (max 65536)
 *   - `name` (String) - file name (binary string)
 *   - `comment` (String) - comment (binary string)
 *   - `hcrc` (Boolean) - true if header crc should be added
 *
 * ##### Example:
 *
 * ```javascript
 * var pako = require('pako')
 *   , chunk1 = Uint8Array([1,2,3,4,5,6,7,8,9])
 *   , chunk2 = Uint8Array([10,11,12,13,14,15,16,17,18,19]);
 *
 * var deflate = new pako.Deflate({ level: 3});
 *
 * deflate.push(chunk1, false);
 * deflate.push(chunk2, true);  // true -> last chunk
 *
 * if (deflate.err) { throw new Error(deflate.err); }
 *
 * console.log(deflate.result);
 * ```
 **/
function Deflate(options) {
	if (!(this instanceof Deflate)) return new Deflate(options);

	this.options = commons.assign({
		level: Z_DEFAULT_COMPRESSION,
		method: Z_DEFLATED,
		chunkSize: 16384,
		windowBits: 15,
		memLevel: 8,
		strategy: Z_DEFAULT_STRATEGY,
		to: ''
	}, options || {});

	var opt = this.options;

	if (opt.raw && (opt.windowBits > 0)) {
		opt.windowBits = -opt.windowBits;
	}

	else if (opt.gzip && (opt.windowBits > 0) && (opt.windowBits < 16)) {
		opt.windowBits += 16;
	}

	this.err    = 0;      // error code, if happens (0 = Z_OK)
	this.msg    = '';     // error message
	this.ended  = false;  // used to avoid multiple onEnd() calls
	this.chunks = [];     // chunks of compressed data

	this.strm = new ZStream();
	this.strm.avail_out = 0;

	var status = zlib_deflate.deflateInit2(
		this.strm,
		opt.level,
		opt.method,
		opt.windowBits,
		opt.memLevel,
		opt.strategy
	);

	if (status !== Z_OK) {
		throw new Error(msg[status]);
	}

	if (opt.header) {
		zlib_deflate.deflateSetHeader(this.strm, opt.header);
	}

	if (opt.dictionary) {
		var dict;
		// Convert data if needed
		if (typeof opt.dictionary === 'string') {
			// If we need to compress text, change encoding to utf8.
			dict = strings.string2buf(opt.dictionary);
		} else if (toString.call(opt.dictionary) === '[object ArrayBuffer]') {
			dict = new Uint8Array(opt.dictionary);
		} else {
			dict = opt.dictionary;
		}

		status = zlib_deflate.deflateSetDictionary(this.strm, dict);

		if (status !== Z_OK) {
			throw new Error(msg[status]);
		}

		this._dict_set = true;
	}
}

/**
 * Deflate#push(data[, mode]) -> Boolean
 * - data (Uint8Array|Array|ArrayBuffer|String): input data. Strings will be
 *   converted to utf8 byte sequence.
 * - mode (Number|Boolean): 0..6 for corresponding Z_NO_FLUSH..Z_TREE modes.
 *   See constants. Skipped or `false` means Z_NO_FLUSH, `true` means Z_FINISH.
 *
 * Sends input data to deflate pipe, generating [[Deflate#onData]] calls with
 * new compressed chunks. Returns `true` on success. The last data block must have
 * mode Z_FINISH (or `true`). That will flush internal pending buffers and call
 * [[Deflate#onEnd]]. For interim explicit flushes (without ending the stream) you
 * can use mode Z_SYNC_FLUSH, keeping the compression context.
 *
 * On fail call [[Deflate#onEnd]] with error code and return false.
 *
 * We strongly recommend to use `Uint8Array` on input for best speed (output
 * array format is detected automatically). Also, don't skip last param and always
 * use the same type in your code (boolean or number). That will improve JS speed.
 *
 * For regular `Array`-s make sure all elements are [0..255].
 *
 * ##### Example
 *
 * ```javascript
 * push(chunk, false); // push one of data chunks
 * ...
 * push(chunk, true);  // push last chunk
 * ```
 **/
Deflate.prototype.push = function (data, mode) {
	var strm = this.strm;
	var chunkSize = this.options.chunkSize;
	var status, _mode;

	if (this.ended) { return false; }

	_mode = (mode === ~~mode) ? mode : ((mode === true) ? Z_FINISH : Z_NO_FLUSH);

	// Convert data if needed
	if (typeof data === 'string') {
		// If we need to compress text, change encoding to utf8.
		strm.input = strings.string2buf(data);
	} else if (toString.call(data) === '[object ArrayBuffer]') {
		strm.input = new Uint8Array(data);
	} else {
		strm.input = data;
	}

	strm.next_in = 0;
	strm.avail_in = strm.input.length;

	do {
		if (strm.avail_out === 0) {
			strm.output = new commons.Buf8(chunkSize);
			strm.next_out = 0;
			strm.avail_out = chunkSize;
		}
		status = zlib_deflate.deflate(strm, _mode);    /* no bad return value */

		if (status !== Z_STREAM_END && status !== Z_OK) {
			this.onEnd(status);
			this.ended = true;
			return false;
		}
		if (strm.avail_out === 0 || (strm.avail_in === 0 && (_mode === Z_FINISH || _mode === Z_SYNC_FLUSH))) {
			if (this.options.to === 'string') {
				this.onData(strings.buf2binstring(commons.shrinkBuf(strm.output, strm.next_out)));
			} else {
				this.onData(commons.shrinkBuf(strm.output, strm.next_out));
			}
		}
	} while ((strm.avail_in > 0 || strm.avail_out === 0) && status !== Z_STREAM_END);

	// Finalize on the last chunk.
	if (_mode === Z_FINISH) {
		status = zlib_deflate.deflateEnd(this.strm);
		this.onEnd(status);
		this.ended = true;
		return status === Z_OK;
	}

	// callback interim results if Z_SYNC_FLUSH.
	if (_mode === Z_SYNC_FLUSH) {
		this.onEnd(Z_OK);
		strm.avail_out = 0;
		return true;
	}

	return true;
};


/**
 * Deflate#onData(chunk) -> Void
 * - chunk (Uint8Array|Array|String): output data. Type of array depends
 *   on js engine support. When string output requested, each chunk
 *   will be string.
 *
 * By default, stores data blocks in `chunks[]` property and glue
 * those in `onEnd`. Override this handler, if you need another behaviour.
 **/
Deflate.prototype.onData = function (chunk) {
	this.chunks.push(chunk);
};


/**
 * Deflate#onEnd(status) -> Void
 * - status (Number): deflate status. 0 (Z_OK) on success,
 *   other if not.
 *
 * Called once after you tell deflate that the input stream is
 * complete (Z_FINISH) or should be flushed (Z_SYNC_FLUSH)
 * or if an error happened. By default - join collected chunks,
 * free memory and fill `results` / `err` properties.
 **/
Deflate.prototype.onEnd = function (status) {
	// On success - join
	if (status === Z_OK) {
		if (this.options.to === 'string') {
			this.result = this.chunks.join('');
		} else {
			this.result = commons.flattenChunks(this.chunks);
		}
	}
	this.chunks = [];
	this.err = status;
	this.msg = this.strm.msg;
};


/**
 * deflate(data[, options]) -> Uint8Array|Array|String
 * - data (Uint8Array|Array|String): input data to compress.
 * - options (Object): zlib deflate options.
 *
 * Compress `data` with deflate algorithm and `options`.
 *
 * Supported options are:
 *
 * - level
 * - windowBits
 * - memLevel
 * - strategy
 * - dictionary
 *
 * [http://zlib.net/manual.html#Advanced](http://zlib.net/manual.html#Advanced)
 * for more information on these.
 *
 * Sugar (options):
 *
 * - `raw` (Boolean) - say that we work with raw stream, if you don't wish to specify
 *   negative windowBits implicitly.
 * - `to` (String) - if equal to 'string', then result will be "binary string"
 *    (each char code [0..255])
 *
 * ##### Example:
 *
 * ```javascript
 * var pako = require('pako')
 *   , data = Uint8Array([1,2,3,4,5,6,7,8,9]);
 *
 * console.log(pako.deflate(data));
 * ```
 **/
function deflate(input, options) {
	var deflator = new Deflate(options);

	deflator.push(input, true);

	// That will never happens, if you don't cheat with options :)
	if (deflator.err) { throw deflator.msg || msg[deflator.err]; }

	return deflator.result;
}


/**
 * deflateRaw(data[, options]) -> Uint8Array|Array|String
 * - data (Uint8Array|Array|String): input data to compress.
 * - options (Object): zlib deflate options.
 *
 * The same as [[deflate]], but creates raw data, without wrapper
 * (header and adler32 crc).
 **/
function deflateRaw(input, options) {
	options = options || {};
	options.raw = true;
	return deflate(input, options);
}


/**
 * gzip(data[, options]) -> Uint8Array|Array|String
 * - data (Uint8Array|Array|String): input data to compress.
 * - options (Object): zlib deflate options.
 *
 * The same as [[deflate]], but create gzip wrapper instead of
 * deflate one.
 **/
function gzip(input, options) {
	options = options || {};
	options.gzip = true;
	return deflate(input, options);
}


export {
	Deflate,
	deflate,
	deflateRaw,
	gzip,
};
