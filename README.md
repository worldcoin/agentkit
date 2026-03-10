### How to start

1. Create a repo from this template.
2. Clone the repo to your local machine.
3. Run `pnpm install` to install the dependencies.
4. Run `pnpm dev` to start the development server.

### Auth

- For the authenticaton we are using Sign In with Worldcoin configured via next-auth. You can find the configuration in `pages/api/auth/[...nextauth].js`.
- To make auth work you will need to set these envs:
  - `WLD_CLIENT_ID`. Go to the Developer Portal and create a new app. You will get the client id there. Select an app -> Sign in with World ID tab -> copy the client id.
  - `WLD_CLIENT_SECRET`. Go to the Developer Portal use the same app as for the WLD_CLIENT_ID. Select an app -> Sign in with World ID tab -> Client secret input -> If you doing this for the first time you will need to press "Reset" button to generate the secret.
  - `NEXTAUTH_SECRET`. This is a random string that is used to encrypt the session token. You can generate it with `openssl rand -base64 32` or use any other method to generate a random string. ([Source](https://next-auth.js.org/configuration/options#description-1))
- Set a redirect URL in the Developer Portal. Go to the Developer Portal -> Same app -> Sign in with World ID tab -> Redirects section -> Add `http://localhost:3000/api/auth/callback/worldcoin` for local development. For production, replace `http://localhost:3000` with your domain.

### MiniKit

<!-- TODO: Update url -->

- Already installed and ready to use. You can find the documentation here: [MiniKit]()

<!-- TODO: Update testing instructions -->

- To test you need to...

### Optional

- `.vscode/`: Visual Studio Code settings
  - If you don't use Visual Studio Code, you can delete this folder.
  - VSC settings include auto-formatting and lint fix on file save. You can disable this by adjusting the settings in `.vscode/settings.json`.
- `app/api/verify-siwe`: This is an API route that can be used to verify the Sign-In with Ethereum. You can delete this folder if you don't need SIWE.
- `scenes/Home/MiniKitDemoClient`: This is a component that has a set of test fields. To test it you will to launch your mini app inside WorldApp. Can be deleted if you don't need it or if you already tested it.

### Environment Variables

- To keep ENVs in sync with TypeScript types, you can use the `env.d.ts` file. This file is used to define the types of the ENVs that are used in the app. If you add a new ENV, make sure to add it to the `Env` type in `env.d.ts`.

### Observability

- Operational logging, tracing, alerts, and incident triage are documented in `docs/OBSERVABILITY_RUNBOOK.md`.
