import { loadEnvFile } from 'node:process';
loadEnvFile();

import { App } from "@slack/bolt";

const app = new App({
    token: process.env.SLACK_BOT_TOKEN,
    socketMode: true,
    appToken: process.env.SLACK_APP_TOKEN,
});

async function main() {
    await app.start();

    app.logger.info("⚡️ Bolt app is running!");
}
main()