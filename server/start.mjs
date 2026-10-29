import { createGateway, loadConfig, ready } from './gateway.mjs';
const config = loadConfig();
const host = process.env.GATEWAY_HOST || '127.0.0.1';
const port = Number(process.env.PORT || 8787);
createGateway(config).listen(port, host, () =>
  console.log(
    `NotePilot gateway listening on ${host}:${port}; live AI ${ready(config) ? 'enabled' : 'disabled'}.`,
  ),
);
