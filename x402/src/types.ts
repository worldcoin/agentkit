export type AgentkitMode =
	| { type: 'free' }
	| { type: 'free-trial'; uses?: number }
	| { type: 'discount'; percent: number; uses?: number }

export interface DeclareAgentkitOptions {
	mode?: AgentkitMode
}
