const path = require('path');
const { expect } = require('chai');
const sinon = require('sinon');
const { getEnv } = require('../src/config/env');

const sandbox = sinon.createSandbox();

describe('env', () => {
    beforeEach(() => {
        // stub out the `hello` method
        sandbox.stub(process, 'env').value({});
    });

    afterEach(() => {
        // completely restore all fakes created through the sandbox
        sandbox.restore();
    });

    context('Azure provider', () => {
        it('should load azure OpenAI auth', () => {
            const env = getEnv({
                path: path.join(__dirname, '../tests/fixtures/azure-env')
            });

            expect(env.openAI.provider).to.eq('azure');
            expect(env.openAI.config.baseURL).to.eq('https://test.openai.azure.com/openai/deployments/TEST');
            expect(env.openAI.config.defaultQuery['api-version']).to.eq('2023-05-15');
            expect(env.openAI.config.defaultHeaders['api-key']).to.eq('AZURE_TEST_KEY');
        });
    });

    context('OpenAI provider', () => {
        it('should use default base path when base path is not specified', () => {
            const env = getEnv({
                path: path.join(__dirname, './fixtures/openai-env')
            });

            expect(env.openAI.provider).to.eq('openai');
            expect(env.openAI.config.baseURL).to.eq('https://api.openai.com/v1');
            expect(env.openAI.config.apiKey).to.eq('OPENAI_TEST_KEY');
        });

        it('Helicone Proxy', () => {
            const env = getEnv({
                path: path.join(__dirname, './fixtures/openai-env-helicone')
            });

            expect(env.openAI.provider).to.eq('openai');
            expect(env.openAI.config.baseURL).to.eq('https://oai.hconeai.com/v1');
            expect(env.openAI.config.apiKey).to.eq('OPENAI_TEST_KEY');
            expect(env.openAI.config.defaultHeaders['Helicone-Auth']).to.eq('Bearer OPENAI_HELICONE_KEY');
        });
    });
});
