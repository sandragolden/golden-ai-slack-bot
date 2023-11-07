const { OpenAI } = require('openai');
const env = require('./env');
const Cache = require('../classes/Cache');
const OpenAIInstance = require('../classes/OpenAI');

const cache = new Cache();

const openAI = new OpenAI(env.openAI.config);
const openai = new OpenAIInstance(openAI, cache, env.openAI);

module.exports = openai;
