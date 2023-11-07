const models = require('../models/models');
const providers = require('../models/providers');

const getInt = (key, defaultValue) => {
    const value = process.env[key];
    if (value === undefined) {
        return defaultValue;
    }
    return parseInt(value, 10);
};

const getConfig = (provider) => {
    const auth = {
        baseURL: process.env.OPENAI_API_BASE || 'https://api.openai.com/v1',
        apiKey: process.env.OPENAI_API_KEY,
        ...(process.env.HELICONE_API_KEY && {
            defaultHeaders: {
                'Helicone-Auth': `Bearer ${process.env.HELICONE_API_KEY}`
            }
        })
    };
    switch (provider) {
        case providers.AZURE:
            return {
                baseURL: `${process.env.AZURE_API_BASE}/openai/deployments/${process.env.AZURE_DEPLOYMENT_NAME}`,
                defaultQuery: {
                    ...auth.defaultQuery,
                    'api-version': process.env.AZURE_API_VERSION
                },
                defaultHeaders: {
                    ...auth.defaultHeaders,
                    'api-key': process.env.OPENAI_API_KEY
                }
            };
        case providers.OPENAI:
        default:
            return auth;
    }
};

const getEnv = (config = {}) => {
    require('dotenv').config(config); // eslint-disable-line global-require

    const provider = process.env.AI_PROVIDER;
    return {
        port: getInt('PORT', 3000),
        logLevel: process.env.LOG_LEVEL || 'info',
        slack: {
            botToken: process.env.SLACK_BOT_TOKEN,
            signingSecret: process.env.SLACK_SIGNING_SECRET,
            appToken: process.env.SLACK_APP_TOKEN,
            appMention: {
                quoteUserMessage: process.env.SLACK_APP_MENTION_QUOTE_USER_MESSAGE === 'true'
            }
        },
        openAI: {
            provider,
            config: getConfig(provider),
            chat: {
                model: process.env.OPENAI_CHAT_MODEL || models.GPT_3_5_TURBO,
                enableSummarize: process.env.OPENAI_CHAT_ENABLE_SUMMARIZE === 'true',
                numOfMessages: getInt('OPENAI_CHAT_NUM_OF_MESSAGES', 2),
                ttl: getInt('OPENAI_CHAT_TTL', null),
                systemMessage: process.env.OPENAI_CHAT_SYSTEM_MESSAGE
            }
        }
    };
};

module.exports = {
    ...getEnv(),
    getEnv
};
