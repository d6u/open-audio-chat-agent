## Setup

Prerequisites:

- NodeJS v22
- pnpm

After getting NodeJS v22 and pnpm available:

1. `pnpm install`

2. Create a `.env` file in `api-server`:

   ```
   PORT=8080
   OPENAI_API_KEY=
   ```

   Pub a valid API key at `OPENAI_API_KEY`

3. Create a `.env` file in `web-app`:

   ```
   VITE_API_SERVER_BASE_URL=ws://localhost:8080
   ```

   Note the base URL port value must match api-server's

### Optional

- To run test scripts in `scripts`, create a `.env` file in `scripts`:
  ```
  OPENAI_API_KEY=
  ```
  Pub a valid API key at `OPENAI_API_KEY`

## Start

At repo root

```sh
pnpm dev
```
