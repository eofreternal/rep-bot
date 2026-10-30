# Rep bot

> Humans like to see number go up. Number go up give dopamine. Maybe seeing number go up will incentivize human to help?

The #help channel on the Hack Club Slack is pretty active, but not so much other help channels (like for software/hardware). Maybe adding a leaderboard will improve how active they are?

# Commands

`/${BOT_NAME}-register` - Initally registers the channel in the database and sends the first reminder message
`/${BOT_NAME}-profile` - Shows your points and ranking on the leaderboard
`/${BOT_NAME}-lb` - Shows the leaderboard
`/${BOT_NAME}-ping`- Ping the bot to see if it's running

# How to use

say a message with "thank" or "thanks" or "thx" or "ty" and ping the person you want to give a point to
Examples:

- `Thanks @eternal`
- `Thank you for helping me, @eternal`

A message reminding people to thank the person that helped them to give them a point is sent in the channel if two conditions are met: if it's been more than 24 hours since the last message + if 20 messages have been sent in the channel since the last message

# Set up instructions

0. Create a the bot on Slack. It needs the following permissions:
   OAuth & Permissions

- app_mentions:read
- channels:history
- chat:write
- commands
- groups:history

App level tokens

- connections:write
- app_configurations:write
- authorizations:read

Socket Mode

- Event Subscriptions

Event Subscriptions - Subscribe to bot events

- message.channels
- message.groups

1. Rename the .env.example file to .env
2. Fill out the .env file
3. install the dependencies with `npm install` (or `pnpm install` or `bun install` or whatever install command it is for your package manager)
4. Set up the database by running `npx drizzle-kit generate` and `npx drizzle-kit migrate` (or, if you're using `pnpm` like me, run `pnpm exec drizzle-kit generate` and `pnpm exec drizzle-kit migrate`)
5. `cd` into the `src/` directory and run the `main.ts` file and enjoy!
