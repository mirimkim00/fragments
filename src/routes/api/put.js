const { Fragment } = require('../../model/fragment');
const logger = require('../../logger');
const { createErrorResponse, createSuccessResponse } = require('../../response');
const api = process.env.API_URL || 'http://localhost:8080';

module.exports = async (req, res) => {
  try {
    const fragment = await Fragment.byId(req.user, req.params.id);
    if (req.get('Content-Type') != fragment.type) {
      res
        .status(400)
        .send(createErrorResponse(400, 'Content-type does not match'));
    } else {
      await fragment.setData(req.body);
      res.location(`${api}/v1/fragments/${fragment.id}`);
      res.status(200).send(createSuccessResponse({ fragment, formats: fragment.formats }));
      logger.info({ fragment: fragment }, `Updated fragment data successfully!`);
    }
  } catch (err) {
    res.status(404).send(createErrorResponse(404, 'Invalid fragment'));
  }
};
