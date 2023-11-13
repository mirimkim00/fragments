// src/routes/api/get.js

const { createSuccessResponse } = require('../../response');
const logger = require('../../logger');
const { Fragment } = require('../../model/fragment');

/**
 * Get a list of fragments for the current user
 */
module.exports = async (req, res) => {
  let isTrue = false;
  if (req.query.expand == 1) {
    isTrue = true;
  }

  const fragments = await Fragment.byUser(req.user, isTrue);
  res.status(200).json(createSuccessResponse({ fragments }));
  logger.info({ fragments }, `Got the user's fragment list`);
};
