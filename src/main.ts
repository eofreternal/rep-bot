import { loadEnvFile } from 'node:process';
loadEnvFile("../.env");

import { App } from "@slack/bolt";
import { db } from "./db/index"
import * as schema from "./db/schema"
import { sql, eq, count, gt } from "drizzle-orm"

const app = new App({
    token: process.env.SLACK_BOT_TOKEN,
    socketMode: true,
    appToken: process.env.SLACK_APP_TOKEN,
});

// Taken from https://stardance.hackclub.com/missions/slack-bot/guide#step-3
app.command("/rep-bot-ping", async ({ command, ack, respond }) => {
    const start = Date.now();
    await ack();
    const latency = Date.now() - start;
    await respond({ text: `Pong!\nLatency: ${latency}ms` });
});

app.command("/rep-bot-profile", async ({ command, ack, respond }) => {
    await ack();
    const [data] = await db.select().from(schema.usersTable).where(eq(
        schema.usersTable.id, command.user_id
    ))

    const [ranking] = await db.select({ count: count() }).from(schema.usersTable).where(gt(schema.usersTable.rep, data.rep))

    await respond({ text: `Points: \`${data.rep ?? 0}\` - Ranking: \`#${ranking.count + 1}\``, response_type: "ephemeral" });
})

app.message(async ({ message, say }) => {
    if (message.type == "message") {
        if (message.subtype == undefined) {
            if (message.text == undefined) { return }
            const split = message.text?.split(" ")
            if (split.length !== 2) {
                return
            }

            if (["thanks", "thank", "thx"].includes(split[0]) == false) {
                return
            }

            if ((split[1].startsWith("<") && split[1].endsWith(">")) == false) {
                return
            }

            const userId = split[1].slice(1, -1).replaceAll("@", "")
            await db.insert(schema.usersTable).values({
                id: userId,
                rep: 1
            }).onConflictDoUpdate({
                target: schema.usersTable.id,
                set: {
                    rep: sql`${schema.usersTable.rep} + 1`,
                }
            })

            say({
                thread_ts: message.ts ?? message.thread_ts,
                text: `+1 rep to <${userId}>`
            })
        }
    }
})

async function main() {
    await app.start();

    app.logger.info("⚡️ Bolt app is running!");
}
main()