const { createSuccessResponse, createErrorResponse } = require('../../response');
const logger = require('../../logger');
const { Fragment } = require('../../model/fragment');

module.exports = async (req, res) => {
  try {
    const fragment = await Fragment.byId(req.user, req.params.id);
    res.status(200).send(createSuccessResponse({ fragment: fragment }));
    logger.info({ fragmentInfo: fragment }, 'Got user fragments metadata');
  } catch (err) {
    res.status(404).send(createErrorResponse(404, 'Not found - No such fragment exists'));
  }
};
