const { expect } = require('chai');
const OpenAIInstance = require('../src/classes/OpenAI');
const roles = require('../src/models/roles');
const models = require('../src/models/models');
const { InvalidModelError, ModelTypeNotMatchedError } = require('../src/classes/Error');

const fakeOpenAIApi = {
    chat: {
        completions: {
            create: () => ({
                choices: [
                    {
                        message: {
                            content: 'This is response from OpenAI.'
                        }
                    }
                ]
            })
        }
    }
};

class FakeCache {
    constructor() {
        this.cache = {};
    }

    get(key) {
        return this.cache[key];
    }

    set(key, value) {
        this.cache[key] = value;
    }
}

describe('OpenAIInstance', () => {
    describe('constructor', () => {
        it('should throw an error when chat model is invalid', () => {
            expect(() => new OpenAIInstance(fakeOpenAIApi, {}, { chat: { model: 'invalid' } })).to.throw(
                InvalidModelError
            );
        });

        it('should throw an error when chat model is not a chat model', () => {
            expect(() => new OpenAIInstance(fakeOpenAIApi, {}, { chat: { model: models.WHISPER_1 } })).to.throw(
                ModelTypeNotMatchedError
            );
        });
    });

    describe('getNumOfMessages', () => {
        it('should throw an error when numOfMessages is < 2', () => {
            const openAI = new OpenAIInstance(
                fakeOpenAIApi,
                {},
                { chat: { model: models.GPT_3_5_TURBO, numOfMessages: 1 } }
            );

            expect(() => openAI.getNumOfMessages()).to.throw('OPENAI_CHAT_NUM_OF_MESSAGES must be >= 2.');
        });

        it('should throw an error when numOfMessages is not an even number', () => {
            const openAI = new OpenAIInstance(
                fakeOpenAIApi,
                {},
                { chat: { model: models.GPT_3_5_TURBO, numOfMessages: 3 } }
            );

            expect(() => openAI.getNumOfMessages()).to.throw('OPENAI_CHAT_NUM_OF_MESSAGES must be an even number.');
        });

        it('should return numOfMessages when numOfMessages is >= 2 and an even number', () => {
            const openAI = new OpenAIInstance(
                fakeOpenAIApi,
                {},
                { chat: { model: models.GPT_3_5_TURBO, numOfMessages: 4 } }
            );

            expect(openAI.getNumOfMessages()).to.eq(4);
        });
    });

    describe('chat', async () => {
        it('cache should all messages when messages <= numOfMessages', async () => {
            const fakeCache = new FakeCache();
            const openAI = new OpenAIInstance(fakeOpenAIApi, fakeCache, {
                chat: { model: models.GPT_3_5_TURBO, numOfMessages: 4 }
            });

            await openAI.chat('id', 'message 1');

            const cachedMessages = fakeCache.get('conversation-id');
            expect(cachedMessages.length).to.eq(2);
            expect(cachedMessages[0]).to.deep.eq({
                role: roles.USER,
                content: 'message 1'
            });
            expect(cachedMessages[1]).to.deep.eq({
                role: roles.ASSISTANT,
                content: 'This is response from OpenAI.'
            });
        });

        it('cache should only last numOfMessages when messages > numOfMessages', async () => {
            const fakeCache = new FakeCache();
            const openAI = new OpenAIInstance(fakeOpenAIApi, fakeCache, {
                chat: { model: models.GPT_3_5_TURBO, numOfMessages: 4 }
            });

            await openAI.chat('id', 'message 1');
            await openAI.chat('id', 'message 2');
            await openAI.chat('id', 'message 3');

            const cachedMessages = fakeCache.get('conversation-id');
            expect(cachedMessages.length).to.eq(4);
            expect(cachedMessages[0]).to.deep.eq({
                role: roles.USER,
                content: 'message 2'
            });
            expect(cachedMessages[1]).to.deep.eq({
                role: roles.ASSISTANT,
                content: 'This is response from OpenAI.'
            });
            expect(cachedMessages[2]).to.deep.eq({
                role: roles.USER,
                content: 'message 3'
            });
            expect(cachedMessages[3]).to.deep.eq({
                role: roles.ASSISTANT,
                content: 'This is response from OpenAI.'
            });
        });
    });
});
