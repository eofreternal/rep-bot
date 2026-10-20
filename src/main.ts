import { loadEnvFile } from 'node:process';
loadEnvFile("../.env");

import { App, ButtonAction } from "@slack/bolt";
import { db } from "./db/index"
import * as schema from "./db/schema"
import { sql, eq, count, gt, desc } from "drizzle-orm"

import type {
    Button,
    RichTextBlock,
    RichTextSection,
} from '@slack/types'

import { sleep } from "./utils"

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

// Learned how to do this from https://github.com/jeremy46231/slack-stats/blob/main/src/leaderboardMessage.ts
async function buildTable(currentPage: number) {
    const data = await db.select().from(schema.usersTable).offset(currentPage * 10).limit(10).orderBy(desc(schema.usersTable.rep))
    const dataRows: RichTextBlock[][] = data.map((item, index) => [
        {
            type: 'rich_text',
            elements: [{ type: 'rich_text_section', elements: [{ type: 'text', text: index.toString() }] } as RichTextSection],
        },
        {
            type: 'rich_text',
            elements: [{ type: 'rich_text_section', elements: [{ type: 'user', user_id: item.id }] } as RichTextSection],
        },
        {
            type: 'rich_text',
            elements: [{ type: 'rich_text_section', elements: [{ type: 'text', text: item.rep.toString() }] } as RichTextSection],
        }
    ])

    const headerRow: RichTextBlock[] = [
        {
            type: 'rich_text',
            elements: [{ type: 'rich_text_section', elements: [{ type: 'text', text: "#", style: { bold: true } }] } as RichTextSection],
        },
        {
            type: 'rich_text',
            elements: [{ type: 'rich_text_section', elements: [{ type: 'text', text: "Person", style: { bold: true } }] } as RichTextSection],
        },
        {
            type: 'rich_text',
            elements: [{ type: 'rich_text_section', elements: [{ type: 'text', text: "Rep", style: { bold: true } }] } as RichTextSection],
        }
    ]

    if (dataRows.length == 0) {
        dataRows.push([
            {
                type: 'rich_text',
                elements: [{ type: 'rich_text_section', elements: [{ type: 'text', text: "0" }] } as RichTextSection],
            },
            {
                type: 'rich_text',
                elements: [{ type: 'rich_text_section', elements: [{ type: 'text', text: "No people on this page" }] } as RichTextSection],
            },
            {
                type: 'rich_text',
                elements: [{ type: 'rich_text_section', elements: [{ type: 'text', text: "0" }] } as RichTextSection],
            }
        ])
    }

    return {
        type: "table",
        rows: [
            headerRow,
            ...dataRows
        ]
    }
}

app.command("/rep-bot-lb", async ({ command, ack, respond, body, client }) => {
    await ack();

    const table = await buildTable(0)
    await client.chat.postMessage({
        channel: body.channel_id,
        text: "Rep Bot Leaderboard",
        blocks: [table,
            {
                type: "context",
                elements: [{ type: "mrkdwn", text: `*Page 1*` }]
            },
            {
                type: "actions", elements: [{
                    type: "button",
                    text: { type: "plain_text", text: "Next" },
                    action_id: "paginate_next",
                    value: "1"
                }]
            }
        ]
    });
})

app.action(/paginate_(next|prev)/, async ({ action, ack, respond, body, client }) => {
    await ack()

    const buttonAction = action as ButtonAction
    if (buttonAction.value == undefined) {
        console.log("error man wtf")
        await respond({
            replace_original: true,
            blocks: [{
                type: 'rich_text',
                elements: [{ type: 'rich_text_section', elements: [{ type: 'text', text: "Something went wrong. Why is buttonAction.value undefined?" }] } as RichTextSection],
            }]
        })
        return
    }
    const page = parseInt(buttonAction.value)

    const buttons: Button[] = [{
        type: "button",
        text: { type: "plain_text", text: "Previous" },
        action_id: "paginate_prev",
        value: (page - 1).toString()
    }]
    if (page > 0) {
        buttons.push({
            type: "button",
            text: { type: "plain_text", text: "Next" },
            action_id: "paginate_next",
            value: (page + 1).toString()
        })
    }

    const table = await buildTable(page)
    await client.chat.update({
        channel: body.channel!.id,
        ts: body.message.ts,
        blocks: [table,
            {
                type: "context",
                elements: [{ type: "mrkdwn", text: `*Page ${page + 1}*` }]
            },
            { type: "actions", elements: buttons }
        ]
    });
})

function fetchUserPingIdThing(text: string[]) {
    for (let i = 0; i < text.length; i++) {
        if ((text[i].startsWith("<") && text[i].endsWith(">")) == true) {
            return text[i].slice(1, -1).replaceAll("@", "").toUpperCase()
        }
    }
    return undefined
}

async function incrementMessagesInChannel(channelId: string) {
    await db.insert(schema.messagesInChannelTable).values({
        id: channelId,
        number: 1,
        firstMessageTimestamp: Date.now()
    }).onConflictDoUpdate({
        target: schema.messagesInChannelTable.id,
        set: {
            number: sql`${schema.messagesInChannelTable.number} + 1`,
        }
    })
}

app.message(async ({ message, say }) => {
    const thanks = ["thanks", "thank", "ty", "thx"]

    if (message.type == "message") {
        if (message.subtype == undefined) {
            if (message.text == undefined) { return }
            incrementMessagesInChannel(message.channel)

            const splitArray = message.text?.toLowerCase().split(" ")
            const splitSet = new Set(splitArray)

            if (thanks.some(item => splitSet.has(item)) == false) {
                return
            }

            const userId = fetchUserPingIdThing(splitArray)

            if (userId == undefined) {
                return
            }

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
                text: `+1 rep to <@${userId}>`
            })

            await db.insert(schema.logsTable).values({
                channel: message.channel,
                creationDate: Date.now()
            })
        }
    }
})

async function loop() {
    const aDayInSeconds = 60 * 60 * 24
    while (true) {
        const allChannels = await db.select().from(schema.messagesInChannelTable)
        const table = await buildTable(0)
        allChannels.forEach(async channel => {
            const currentTime = Date.now()
            const aDayPassed = ((currentTime - channel.lastBotMessage) / 1000) >= aDayInSeconds
            const moreThan20Messages = channel.number >= 20
            if (aDayPassed && moreThan20Messages) {
                app.client.chat.postMessage({
                    channel: channel.id,
                    text: "Remember to thank the person that helped you!",
                    blocks: [
                        {
                            type: "section",
                            text: {
                                type: "mrkdwn",
                                text: "Remember to thank the person that helped you! Say \`thanks @[their username]\`\n*Leaderboard*"
                            },
                        },
                        table,
                        {
                            type: "actions", elements: [{
                                type: "button",
                                text: { type: "plain_text", text: "Next" },
                                action_id: "paginate_next",
                                value: "1"
                            }]
                        }
                    ]
                })

                await db.update(schema.messagesInChannelTable).set({
                    lastBotMessage: Date.now(),
                    number: 0
                }).where(eq(schema.messagesInChannelTable.id, channel.id))
            }
        })

        await sleep(1000)
    }
}

async function main() {
    await app.start();
    loop()

    app.logger.info("⚡️ Bolt app is running!");
}
main()