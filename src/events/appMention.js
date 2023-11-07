const env = require('../config/env');
const app = require('../config/app');
const openai = require('../config/openai');
const { logger } = require('../helpers/logger');
const { ERROR_MESSAGES } = require('../constants');

app.event('app_mention', async ({ event, say }) => {
    logger.debug('app_mention', event);

    try {
        const id = `${event.channel}_${event.user}`;
        const answer = await openai.chat(id, event.text, {
            user: id
        });
        const userTextWithQuote = event.text
            .split('\n')
            .map((w) => `>${w}`)
            .join('\n');
        const answerText = env.slack.appMention.quoteUserMessage
            ? `<@${event.user}>\n${userTextWithQuote}\n${answer}`
            : `<@${event.user}> ${answer}`;

        await say({
            text: answer,
            blocks: [
                {
                    type: 'section',
                    text: {
                        type: 'mrkdwn',
                        text: answerText
                    }
                }
            ]
        });

        logger.debug('app_mention completed');
    } catch (error) {
        logger.error(error);
        await say(ERROR_MESSAGES.GENERIC_EVENT);
    }
});
