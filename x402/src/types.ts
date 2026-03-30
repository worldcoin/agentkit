export type AgentkitMode =
	| { type: 'free' }
	| { type: 'free-trial'; uses?: number }
	| { type: 'discount'; percent: number; uses?: number }

export interface DeclareAgentkitOptions {
	domain?: string
	resourceUri?: string
	statement?: string
	version?: string
	network?: string | string[]
	expirationSeconds?: number
	mode?: AgentkitMode
}
