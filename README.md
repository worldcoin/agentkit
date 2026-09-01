<div align="center">

# **AgentKit**

**Let an agent show that a person with a verified [World ID](https://docs.world.org/agents/agent-kit) controls it.**

<img src="registration.gif" alt="AgentKit registration" width="960" />

</div>

AgentKit lets an agent show that a verified person controls it. A service can use this proof to control access. AgentKit does not give the identity of the person to the service.

## Register an agent

Run this command:

```bash
npx @worldcoin/agentkit-cli register
```

The CLI creates an identity for the agent. It then asks you to complete a World ID check in World App. You register the identity only one time.

For more information, read the [registration guide](./cli/REGISTRATION.md).

## Add AgentKit to a service

Install the Core package:

```bash
npm install @worldcoin/agentkit-core
```

Add the integration skill to help an agent protect one endpoint:

```bash
npx skills add worldcoin/agentkit integrate-agentkit
```

## Optional x402 support

AgentKit also supports services that use x402. Install the server package:

```bash
npm install @worldcoin/agentkit
```

Add the client skill:

```bash
npx skills add worldcoin/agentkit agentkit-x402
```

Add the server integration skill:

```bash
npx skills add worldcoin/agentkit integrate-agentkit-x402
```

Read the [x402 integration guide](./x402/DOCS.md) for more information.
