// src/routes/api/get.js

const { createSuccessResponse } = require('../../response');
const logger = require('../../logger');
const { Fragment } = require('../../model/fragment');

/**
 * Get a list of fragments for the current user
 */
module.exports = async (req, res) => {
  try {
    const fragments = await Fragment.byUser(req.user, req.query.expand);
    res.status(200).send(createSuccessResponse({ fragments }));
    logger.info({ fragments }, `Retrieved fragment list`);
  } catch (err) {
    res.status(404).send(createErrorResponse(404, err));
  }
};
