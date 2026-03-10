// idkit-core only supports browser/React Native. Node & Bun expose the same
// Web Crypto API, so we trick its `isBrowser` check to pick WebCryptoAdapter.
if (typeof globalThis.window === 'undefined') {
	// @ts-expect-error – minimal shim so browser-or-node reports isBrowser=true
	globalThis.window = { document: {}, crypto: globalThis.crypto }
}
