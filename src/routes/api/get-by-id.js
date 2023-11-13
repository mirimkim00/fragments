const { createErrorResponse } = require('../../response');
const { Fragment } = require('../../model/fragment');
const path = require('path');
const MarkdownIt = require('markdown-it'),
  md = new MarkdownIt();

module.exports = async (req, res) => {
  const extension = path.extname(req.params.id);
  const fragmentId = path.basename(req.params.id, extension);

  try {
    let fragmentMetadata = await Fragment.byId(req.user, fragmentId);
    let fragment = await fragmentMetadata.getData();

    if (!extension) {
      res.set('Content-type', fragmentMetadata.mimeType).status(200).send(fragment);
    } else if (extension) {
      if (
        (fragmentMetadata.mimeType.startsWith('text/') && extension === '.txt') ||
        (fragmentMetadata.mimeType === 'application/json' && extension === '.txt')
      ) {
        fragmentMetadata.type = 'text/plain';
        res.set('Content-type', fragmentMetadata.mimeType).status(200).send(fragment);
      } else if (
        (fragmentMetadata.mimeType === 'text/markdown' && extension === '.md') ||
        (fragmentMetadata.mimeType === 'text/html' && extension === '.html') ||
        (fragmentMetadata.mimeType === 'application/json' && extension === '.json')
      ) {
        res.set('Content-type', fragmentMetadata.mimeType).status(200).send(fragment);
      } else if (fragmentMetadata.mimeType === 'text/markdown' && extension === '.html') {
        fragmentMetadata.type = 'text/html';
        res
          .set('Content-type', fragmentMetadata.mimeType)
          .status(200)
          .send(md.render(`# ${fragment}`));
      } else {
        throw new Error('The Extension is Unknown/Unsupported type!');
      }
    }
  } catch (Error) {
    if (Error.message) {
      res.status(415).send(createErrorResponse(415, Error.message));
    } else {
      res.status(404).send(createErrorResponse(404, 'Unknown Fragment'));
    }
  }
};
