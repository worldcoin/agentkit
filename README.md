<div align="center">

# **AgentKit**

**Let an agent show that a person with a verified [World ID](https://docs.world.org/agents/agent-kit) controls it.**

<img src="registration.gif" alt="AgentKit registration" width="960" />

</div>

AgentKit lets an agent show that a verified person controls it. A service can then give the agent free access, a trial, or a discount. AgentKit does not give the identity of the person to the service.

## Use AgentKit

Add the AgentKit x402 skill:

```bash
npx skills add worldcoin/agentkit agentkit-x402
```

The skill gives instructions to the agent. The agent tries AgentKit before it makes an x402 payment. During the first registration, World App can ask you to complete a World ID check.

To start registration yourself, use this command:

```bash
npx @worldcoin/agentkit-cli register
```

For more information, read the [registration guide](./cli/REGISTRATION.md). You can also read the [agent skill](./skills/agentkit-x402/SKILL.md).

## Build with AgentKit

Install the server package:

```bash
npm install @worldcoin/agentkit
```

Use this package to add AgentKit to an x402 service. The service can give free access, trials, or discounts.

Read the [x402 integration guide](./x402/DOCS.md) for setup instructions and examples.

To help an agent protect a normal HTTP endpoint, add this skill:

```bash
npx skills add worldcoin/agentkit integrate-agentkit
```

To help an agent protect an x402 endpoint, add this skill:

```bash
npx skills add worldcoin/agentkit integrate-agentkit-x402
```
