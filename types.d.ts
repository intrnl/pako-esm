interface Header {
	text?: boolean;
	time?: number;
	os?: number;
	extra?: number[];
	name?: string;
	comment?: string;
	hcrc?: boolean;
}

export type Data = Uint8Array | number[] | string;
