import { Data, Header } from './types';


interface DeflateFunctionOpts {
	level?: -1 | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
	windowBits?: number;
	memLevel?: number;
	strategy?: number;
	dictionary?: any;
	raw?: boolean;
	to?: 'string';
}

export function deflate (data: Data, options: DeflateFunctionOpts & { to: 'string' }): string;
export function deflate (data: Data, options?: DeflateFunctionOpts): Uint8Array;

export function deflateRaw (data: Data, options: DeflateFunctionOpts & { to: 'string' }): string;
export function deflateRaw (data: Data, options?: DeflateFunctionOpts): Uint8Array;

export function gzip (data: Data, options: DeflateFunctionOpts & { to: 'string' }): string;
export function gzip (data: Data, options?: DeflateFunctionOpts): Uint8Array;


interface DeflateOptions {
	level?: -1 | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
	windowBits?: number;
	memLevel?: number;
	strategy?: number;
	dictionary?: any;
	raw?: boolean;
	to?: 'string';
	chunkSize?: number;
	gzip?: boolean;
	header?: Header;
}

export class Deflate {
	options: DeflateOptions;
	err: number;
	msg: string;
	result: Uint8Array | number[];

	constructor (options?: DeflateOptions);

	onData (chunk: Data): void;
	onEnd (status: number): void;

	push (data: Data | ArrayBuffer, mode?: number | boolean): boolean;
}
