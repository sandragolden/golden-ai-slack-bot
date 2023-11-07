const app = require('../config/app');
const openai = require('../config/openai');
const { logger } = require('../helpers/logger');
const { ERROR_MESSAGES, IMAGE_ACK } = require('../constants');

app.command('/image', async ({
    command, ack, say, respond
}) => {
    logger.debug('/image', command);

    try {
        // Acknowledge shortcut request
        await ack();

        const action = command.channel_name === 'directmessage' ? respond : say;

        if (command.text.length === 0) {
            // const botUserId = (await app.client.auth.test()).user_id;
            await action(':warning: Please provide a prompt to generate an image.');
            return;
        }

        await action(IMAGE_ACK);
        const base64Str = await openai.generateImage(command.text);
        const buffer = Buffer.from(base64Str, 'base64');

        await action({
            text: '',
            response_type: 'ephemeral',
            replace_original: true,
            blocks: [
                {
                    type: 'section',
                    text: {
                        type: 'mrkdwn',
                        text: `<@${command.user_id}> ${command.text}`
                    }
                }
            ]
        });

        await app.client.files.upload({
            channels: command.channel_id,
            file: buffer,
            filename: 'image.png',
            filetype: 'auto',
            title: command.text
        });

        logger.debug('/image completed');
    } catch (error) {
        logger.error(error);
        await say(ERROR_MESSAGES.GENERIC_EVENT);
    }
});
