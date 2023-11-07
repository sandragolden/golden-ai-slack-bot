const models = require('../models/models');

class InvalidModelError extends Error {
    constructor(configName, currentModel) {
        super(`${configName} must be one of ${models.values()}. Current model: ${currentModel}.`);
        this.name = 'InvalidModelError';
    }
}

class ModelTypeNotMatchedError extends Error {
    constructor(configName, currentModel, correctType) {
        super(`${configName} must be a ${correctType} model. Current model: ${currentModel}.`);
        this.name = 'ModelTypeNotMatchedError';
    }
}

module.exports = {
    InvalidModelError,
    ModelTypeNotMatchedError
};
