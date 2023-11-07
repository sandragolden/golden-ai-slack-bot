const app = require('../config/app');
const Cache = require('../classes/Cache');
const openai = require('../config/openai');
const { logger } = require('../helpers/logger');
const { getThreadMessages } = require('../helpers/slack');

const cache = new Cache();
const { ERROR_MESSAGES } = require('../constants');

app.shortcut('ask', async ({ shortcut, ack, client }) => {
    logger.debug('/ask', shortcut);

    const channelId = shortcut.channel.id;
    const threadTs = shortcut.message.thread_ts ?? shortcut.message.ts;
    const privateMetadata = JSON.stringify({ channelId, threadTs });

    try {
        // Acknowledge shortcut request
        await ack();

        // Call the views.open method using one of the built-in WebClients
        await client.views.open({
            trigger_id: shortcut.trigger_id,
            view: {
                type: 'modal',
                callback_id: 'ask_submission',
                private_metadata: privateMetadata,
                title: {
                    type: 'plain_text',
                    text: 'Ask'
                },
                blocks: [
                    {
                        type: 'input',
                        block_id: 'ask-input',
                        element: {
                            type: 'plain_text_input',
                            multiline: true,
                            action_id: 'ask-input-action'
                        },
                        label: {
                            type: 'plain_text',
                            text: 'Ask a question about the thread:',
                            emoji: true
                        }
                    }
                ],
                submit: {
                    type: 'plain_text',
                    text: 'Submit'
                }
            }
        });
    } catch (error) {
        logger.error(error);

        await client.chat.postMessage({
            channel: channelId,
            text: ERROR_MESSAGES.SUMMARY_THREAD
        });
    }
});

app.view('ask_submission', async ({ ack, body, client }) => {
    logger.debug('ask_submission', body);

    const { private_metadata: privateMetadata, state } = body.view;
    const { channelId, threadTs } = JSON.parse(privateMetadata);
    const question = state.values['ask-input']['ask-input-action'].value;
    const locale = 'en';

    try {
        await ack();
        const messages = await getThreadMessages(channelId, threadTs, {
            client,
            cache
        });
        const answer = await openai.askQuestionInTheThread(question, messages, locale);
        const { permalink } = await client.chat.getPermalink({
            channel: channelId,
            message_ts: threadTs
        });
        await client.chat.postMessage({
            channel: channelId,
            text: `Question: ${question}\nAnswer: ${answer}`,
            blocks: [
                {
                    type: 'section',
                    text: {
                        type: 'mrkdwn',
                        text: `Question: ${question}\nAnswer: ${answer}\n\n*<${permalink}|Go to original thread>*`
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
