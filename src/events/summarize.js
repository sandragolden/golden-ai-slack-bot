const app = require('../config/app');
const Cache = require('../classes/Cache');
const openai = require('../config/openai');
const { logger } = require('../helpers/logger');
const { getThreadMessages } = require('../helpers/slack');

const cache = new Cache();
const { ERROR_MESSAGES } = require('../constants');

app.shortcut('summarize', async ({ shortcut, ack, client }) => {
    logger.debug('/summarize', shortcut);

    const channelId = shortcut.channel.id;
    const threadTs = shortcut.message.thread_ts ?? shortcut.message.ts;

    try {
        // Acknowledge shortcut request
        await ack();

        const locale = 'en';
        const messages = await getThreadMessages(channelId, threadTs, {
            client,
            cache
        });
        const answer = await openai.summarizeConversations(messages, locale);
        const { permalink } = await client.chat.getPermalink({
            channel: channelId,
            message_ts: threadTs
        });
        await client.chat.postMessage({
            channel: channelId,
            text: `Summary: ${answer}`,
            blocks: [
                {
                    type: 'section',
                    text: {
                        type: 'mrkdwn',
                        text: `Summary: ${answer}\n\n*<${permalink}|Go to original thread>*`
                    }
                }
            ]
        });

        logger.debug('/summarize completed');
    } catch (error) {
        logger.error(error);

        await client.chat.postMessage({
            channel: channelId,
            text: ERROR_MESSAGES.SUMMARY_THREAD
        });
    }
});
