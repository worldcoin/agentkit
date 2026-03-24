import { verifyCloudProof } from "@worldcoin/idkit";

/**
 * World ID Verifier for AgentKit.
 * Allows agents to verify that their human operator has a valid World ID.
 * Addresses the need for sybil-resistant agent actions.
 */
export class WorldIDVerifier {
    /**
     * Verifies a World ID proof.
     * @param proof The zero-knowledge proof from the user's World App.
     */
    async verifyOperator(proof: any, appId: string, action: string) {
        console.log(`Verifying humanity proof for action: ${action}...`);
        const result = await verifyCloudProof(proof, appId, action);
        return result.success;
    }
}
