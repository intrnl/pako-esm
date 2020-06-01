import { Data, Header } from './types';


interface InflateFunctionOpts {
	windowBits?: number;
	raw?: boolean;
	to?: 'string';
}

export function inflate (data: Data, options: InflateFunctionOpts & { to: 'string' }): string;
export function inflate (data: Data, options?: InflateFunctionOpts): Uint8Array;

export function inflateRaw (data: Data, options: InflateFunctionOpts & { to: 'string' }): string;
export function inflateRaw (data: Data, options?: InflateFunctionOpts): Uint8Array;

export function ungzip (data: Data, options: InflateFunctionOpts & { to: 'string' }): string;
export function ungzip (data: Data, options?: InflateFunctionOpts): Uint8Array;


interface InflateOptions {
	windowBits?: number;
	dictionary?: any;
	raw?: boolean;
	to?: 'string';
	chunkSize?: number;
}

export class Inflate {
	options: InflateOptions;
	header?: Header;
	err: number;
	msg: string;
	result: Data;

	constructor (options?: InflateOptions);

	onData (chunk: Data): void;
	onEnd (status: number): void;
	push (data: Data | ArrayBuffer, mode?: number | boolean): boolean;
}
