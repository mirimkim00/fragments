const { Fragment } = require('../../model/fragment');
const { createSuccessResponse, createErrorResponse } = require('../../response');
const logger = require('../../logger');

module.exports = async (req, res) => {
  try {
    await Fragment.delete(req.user, req.params.id);
    res.status(200).send(createSuccessResponse(200, 'Fragment successfully deleted!'));
    logger.info('Successfully deleted fragment');
  } catch (err) {
    res.status(404).send(createErrorResponse(404, 'Fragment not found'));
  }
};
