const app = require('../config/app');
const openai = require('../config/openai');
const { logger } = require('../helpers/logger');
const { ERROR_MESSAGES, THOUGHT_ACK } = require('../constants');

app.command('/thought', async ({
    command, ack, say, respond
}) => {
    logger.debug('/thought', command);

    try {
        await ack(THOUGHT_ACK); // Acknowledge command request
        const action = command.channel_name === 'directmessage' ? respond : say;

        const answer = await openai.getThoughtOfTheDay();
        await action({
            text: '',
            response_type: 'ephemeral',
            replace_original: true,
            blocks: [
                {
                    type: 'section',
                    text: {
                        type: 'mrkdwn',
                        text: `<@${command.user_id}> ${answer}`
                    }
                }
            ]
        });

        logger.debug('/thought completed');
    } catch (error) {
        logger.error(error);
        await say(ERROR_MESSAGES.GENERIC_EVENT);
    }
});
