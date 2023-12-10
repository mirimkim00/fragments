const { createErrorResponse } = require('../../response');
const { Fragment } = require('../../model/fragment');
const path = require('path');
const logger = require('../../logger');

module.exports = async (req, res) => {
  let extension = query.ext.split('.').pop();
  const query = path.parse(req.params.id);
  try {
    let fragmentMetadata = await Fragment.byId(req.user, query.name);
    let fragment = await fragmentMetadata.getData();
    extension = fragmentMetadata.extConvert(extension);
    
    if (query.ext == '' || fragmentMetadata.type.endsWith(extension)) {
      res.setHeader('Content-Type', fragmentMetadata.type);
      res.status(200).send(Buffer.from(fragment));
      logger.info(
        { fragmentData: fragment, contentType: fragmentMetadata.type },
        `Retrieved fragment data successfully!`
      );
    } else {
      try {
        if (fragmentMetadata.isText || fragmentMetadata.type == 'application/json') {
          let result = await fragmentMetadata.textConvert(extension);
          res.setHeader('Content-Type', `text/${extension}`);
          res.status(200).send(Buffer.from(result));
          logger.info({ targetType: extension }, `Successful conversion to ${extension}`);
        } else {
          let result = await fragmentMetadata.imageConvert(extension);
          res.setHeader('Content-Type', `image/${extension}`);
          res.status(200).send(result);
          logger.info({ targetType: extension }, `Successful conversion to ${extension}`);
        }
      } catch (err) {
        res.status(415).json(createErrorResponse(415, `The Extension is Unknown/Unsupported type`));
      }
    }
  } catch (err) {
    res.status(404).json(createErrorResponse(404, `Unknown Fragment`));
  }
};

