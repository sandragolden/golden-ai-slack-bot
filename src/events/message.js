const app = require('../config/app');
const openai = require('../config/openai');
const { logger } = require('../helpers/logger');
const { ERROR_MESSAGES } = require('../constants');

app.message(async ({ event, say }) => {
    logger.debug('message', event);

    try {
        if (!event.user || !event.text) {
            logger.debug(`no user ${event.user} or text ${event.text} provided in message`);
            return;
        }

        const id = event.user;
        const answer = await openai.chat(id, event.text, {
            user: id
        });

        await say(answer);

        logger.debug('message completed');
    } catch (error) {
        logger.error(error);
        await say(ERROR_MESSAGES.GENERIC_EVENT);
    }
});
