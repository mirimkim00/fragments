// Use crypto.randomUUID() to create unique IDs, see:
// https://nodejs.org/api/crypto.html#cryptorandomuuidoptions
const { randomUUID } = require('crypto');
// Use https://www.npmjs.com/package/content-type to create/parse Content-Type headers
const contentType = require('content-type');
const logger = require('../logger');
const sharp = require('sharp');
const MarkdownIt = require('markdown-it'),
  md = new MarkdownIt();

// Functions for working with fragment metadata/data using our DB
const {
  readFragment,
  writeFragment,
  readFragmentData,
  writeFragmentData,
  listFragments,
  deleteFragment,
} = require('./data');

const supportedTypes = [
  'text/plain',
  'text/plain; charset=utf-8',
  'text/markdown',
  'text/html',
  'application/json',
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
];

class Fragment {
  constructor({ id, ownerId, created, updated, type, size = 0 }) {
    if (id) {
      this.id = id;
    } else {
      this.id = randomUUID();
    }

    if (ownerId) {
      this.ownerId = ownerId;
    } else {
      throw new Error(`ownerId is required, got ownerId=${ownerId}`);
    }

    if (type) {
      this.type = type;
    } else {
      throw new Error(`Content-Type is required, got Content-Type=${ownerId}`);
    }

    if (size < 0 || typeof size === 'string') {
      throw new Error('size cannot be negative and cannot be a type of String');
    } else {
      this.size = size;
    }

    if (created) {
      this.created = created;
    } else {
      this.created = new Date().toISOString();
    }
    if (updated) {
      this.updated = updated;
    } else {
      this.updated = new Date().toISOString();
    }
  }

  /**
   * Get all fragments (id or full) for the given user
   * @param {string} ownerId user's hashed email
   * @param {boolean} expand whether to expand ids to full fragments
   * @returns Promise<Array<Fragment>>
   */
  static async byUser(ownerId, expand = false) {
    logger.info({ ownerId, expand }, 'byUser()');
    try {
      const fragments = await listFragments(ownerId, expand);
      if (expand) {
        return fragments.map((fragment) => new Fragment(fragment));
      }
      return fragments;
    } catch (err) {
      return [];
    }
  }

  /**
   * Gets a fragment for the user by the given id.
   * @param {string} ownerId user's hashed email
   * @param {string} id fragment's id
   * @returns Promise<Fragment>
   */
  static async byId(ownerId, id) {
    logger.info({ ownerId, id }, 'byId()');
    try {
      return new Fragment(await readFragment(ownerId, id));
    } catch (err) {
      throw new Error(`Cannot find the fragment with that ID`);
    }
  }

  /**
   * Delete the user's fragment data and metadata for the given id
   * @param {string} ownerId user's hashed email
   * @param {string} id fragment's id
   * @returns Promise<void>
   */
  static delete(ownerId, id) {
    return deleteFragment(ownerId, id);
  }

  /**
   * Saves the current fragment to the database
   * @returns Promise<void>
   */
  save() {
    this.updated = new Date().toISOString();
    return writeFragment(this);
  }

  /**
   * Gets the fragment's data from the database
   * @returns Promise<Buffer>
   */
  getData() {
    return readFragmentData(this.ownerId, this.id);
  }

  /**
   * Set's the fragment's data in the database
   * @param {Buffer} data
   * @returns Promise<void>
   */
  async setData(data) {
    try {
      if (!data) {
        return Promise.reject(new Error('Data cannot be empty.'));
      }
      this.updated = new Date().toISOString();
      this.size = data.length;
      await writeFragment(this);
      return writeFragmentData(this.ownerId, this.id, data);
    } catch (err) {
      Promise.reject(err);
    }
  }

  /**
   * Returns the mime type (e.g., without encoding) for the fragment's type:
   * "text/html; charset=utf-8" -> "text/html"
   * @returns {string} fragment's mime type (without encoding)
   */
  get mimeType() {
    const { type } = contentType.parse(this.type);
    return type;
  }

  /**
   * Returns true if this fragment is a text/* mime type
   * @returns {boolean} true if fragment's type is text/*
   */
  get isText() {
    return this.mimeType.startsWith('text');
  }

  /**
   * Returns the formats into which this fragment type can be converted
   * @returns {Array<string>} list of supported mime types
   */
  get formats() {
    let result = [];
    if (
      this.type.includes('image/png') ||
      this.type.includes('image/jpeg') ||
      this.type.includes('image/gif') ||
      this.type.includes('image/webp')
    ) {
      result = ['image/png', 'image/jpeg', 'image/gif', 'image/webp'];
    } else if (this.type.includes('text/plain')) {
      result = ['text/plain'];
    } else if (this.type.includes('text/markdown')) {
      result = ['text/plain', 'text/html', 'text/markdown'];
    } else if (this.type.includes('text/html')) {
      result = ['text/plain', 'text/html'];
    } else if (this.type.includes('application/json')) {
      result = ['application/json', 'text/plain'];
    }

    return result;
  }

  /**
   * Returns true if we know how to work with this content type
   * @param {string} value a Content-Type value (e.g., 'text/plain' or 'text/plain: charset=utf-8')
   * @returns {boolean} true if we support this Content-Type (i.e., type/subtype)
   */
  static isSupportedType(value) {
    return supportedTypes.includes(value);
  }


  async textConvert(value) {
    var result, fragmentData;
    fragmentData = await this.getData();
    if (value == 'plain') {
      if (this.type == 'application/json') {
        result = JSON.parse(fragmentData);
      } else {
        result = fragmentData;
      }
    } else if (value == 'html') {
      if (this.type.endsWith('markdown')) {
        result = md.render(fragmentData.toString());
      }
    }

    return result;
  }

  async imageConvert(value) {
    var result, fragmentData;
    fragmentData = await this.getData();

    if (this.type.startsWith('image')) {
      if (value == 'gif') {
        result = sharp(fragmentData).gif();
      } else if (value == 'jpg' || value == 'jpeg') {
        result = sharp(fragmentData).jpeg();
      } else if (value == 'webp') {
        result = sharp(fragmentData).webp();
      } else if (value == 'png') {
        result = sharp(fragmentData).png();
      }
    }

    return result.toBuffer();
  }

  // based on the passed extension returns type name
  extConvert(value) {
    var extension;
    if (value == 'txt') {
      extension = 'plain';
    } else if (value == 'jpg') {
      extension = 'jpeg';
    } else if (value == 'md') {
      extension = 'markdown';
    } else {
      extension = value;
    }

    return extension;
  }
}

module.exports.Fragment = Fragment;
