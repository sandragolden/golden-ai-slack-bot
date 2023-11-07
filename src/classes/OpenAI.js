const roles = require('../models/roles');
const apiTypes = require('../models/apiTypes');
const models = require('../models/models');
const { InvalidModelError, ModelTypeNotMatchedError } = require('./Error');
const { log4js } = require('../helpers/logger');

const logger = log4js.getLogger('OpenAI');

class OpenAI {
    constructor(openai, cache, config) {
        this.openai = openai;
        this.cache = cache;
        this.config = config;

        if (!models.isValidModel(this.config.chat.model)) {
            throw new InvalidModelError('OPENAI_CHAT_MODEL', this.config.chat.model);
        }
        if (!models.isMatchType(this.config.chat.model, apiTypes.CHAT)) {
            throw new ModelTypeNotMatchedError('OPENAI_CHAT_MODEL', this.config.chat.model, apiTypes.CHAT);
        }
    }

    async chat(id, message, options) {
        // get last messages from cache
        let lastMessages = this.cache.get(`conversation-${id}`) ?? [];
        // If chat is enabled and there are enough messages to summarize, summarize the last messages
        if (this.config.chat.enableSummarize && lastMessages.length >= this.getNumOfMessages()) {
            const summary = await this.summarizeMessages(lastMessages);
            lastMessages = [{ role: roles.SYSTEM, content: summary }];
        }
        // Add the user's message to the array of messages
        lastMessages = [...lastMessages, { role: roles.USER, content: message }];
        if (!this.config.chat.enableSummarize) {
            // Consider response from OpenAI, we keep only the last N - 1 messages
            lastMessages = lastMessages.slice(-this.getNumOfMessages() + 1);
        }

        const predefinedSystemMessages = this.config.chat.systemMessage
            ? [
                {
                    role: roles.SYSTEM,
                    content: this.config.chat.systemMessage
                }
            ]
            : [];

        const res = await this.createChatCompletion([...predefinedSystemMessages, ...lastMessages], options);

        // Add the assistant's response to the array of messages and update the cache
        this.cache.set(
            `conversation-${id}`,
            [...lastMessages, { role: roles.ASSISTANT, content: res }],
            this.config.chat.ttl
        );

        logger.debug('cached messages: ', this.cache.get(`conversation-${id}`));

        return res;
    }

    async askQuestionInTheThread(question, conversations, locale = 'en') {
        logger.debug('Locale: ', locale);
        logger.debug('Question: ', question);
        logger.debug('Conversations: ', conversations.join('\n'));

        return await this.createChatCompletion(
            [
                {
                    role: roles.USER,
                    content:
                        `#lang:${locale} Answer the question based on the following conversation:\n`
                        + `[conversation start]\n${conversations.join('\n')}\n[conversation end]\n`
                        + `Question: ${question}`
                }
            ],
            { temperature: 0.0 }
        );
    }

    async summarizeConversations(conversations, locale = 'en') {
        logger.debug('Locale: ', locale);
        logger.debug('Conversations: ', conversations.join('\n'));

        return await this.createChatCompletion(
            [
                {
                    role: roles.USER,
                    content:
                        `#lang:${locale} `
                        + 'Summarize the following text very succinctly, '
                        + `with the most unique and helpful points: \n${conversations.join('\n')}`
                }
            ],
            { temperature: 0.0 }
        );
    }

    async summarizeMessages(messages) {
        return await this.createChatCompletion(
            [
                {
                    role: roles.USER,
                    content: `Summarize the following messages succinctly: ${JSON.stringify(messages)}`
                }
            ],
            { temperature: 0.0 }
        );
    }

    getNumOfMessages() {
        const { numOfMessages } = this.config.chat;

        if (numOfMessages < 2) {
            throw new Error('OPENAI_CHAT_NUM_OF_MESSAGES must be >= 2.');
        }

        if (numOfMessages % 2 !== 0) {
            throw new Error('OPENAI_CHAT_NUM_OF_MESSAGES must be an even number.');
        }

        return numOfMessages;
    }

    async getThoughtOfTheDay() {
        const currentDate = new Date();
        const currentDay = currentDate.getDay();
        // isSwimDay should be true if it's Wednesday or Saturday or Sunday
        const isSwimDay = currentDay === 3 || currentDay === 6 || currentDay === 0;
        return await this.createSingleChatCompletion(
            roles.USER,
            `
      Play the role of a software engineer that also enjoys swimming when I ask "Thought of the day?".
      Start with the date ${currentDate.toLocaleDateString()} and provide a software development prediction for the day.
      ${
    isSwimDay
        ? 'Today is a swimming day so provide a swimming focus for practice today.'
        : 'Today is not a swimming day but please provide a swimming thought for the day.'
}
      For example, whether today is suitable for swimming, deployment, hotfix, code modification, 
      code review, meetings, arguing with engineers, work day stress, etc

      Thought of the day?
      `
        );
    }

    async createSingleChatCompletion(role, message, options) {
        return await this.createChatCompletion([{ role, content: message }], options);
    }

    async createChatCompletion(messages, options) {
        logger.debug('Create chat completion parameters: ', messages, options);

        const res = await this.openai.chat.completions.create({
            model: this.config.chat.model,
            messages,
            ...options
        });

        logger.debug('Create chat completion response: ', JSON.stringify(res, null, 2));

        return res.choices[0].message.content;
    }

    async generateImage(prompt) {
        logger.debug('Create image parameters: ', prompt);

        const res = await this.openai.images.generate({
            prompt,
            n: 1,
            size: '512x512',
            response_format: 'b64_json'
        });

        logger.debug('Create image response: ', res);

        return res.data[0].b64_json;
    }
}

module.exports = OpenAI;
