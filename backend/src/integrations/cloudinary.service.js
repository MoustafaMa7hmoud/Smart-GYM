const cloudinary            = require('../config/cloudinary');
const { CLOUDINARY_FOLDERS } = require('../utils/constants');
const logger                = require('../utils/logger');

/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  Cloudinary Service — wraps all Cloudinary SDK calls.
 *  Services should import THIS file, never config/cloudinary directly.
 * ─────────────────────────────────────────────────────────────────────────────
 */

/**
 * Delete an asset from Cloudinary by its public_id.
 * Silently handles failures so a missing asset never crashes the app.
 *
 * @param {string} publicId
 * @param {'image'|'video'|'raw'} resourceType
 */
const deleteAsset = async (publicId, resourceType = 'image') => {
  if (!publicId) return;
  try {
    const result = await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
    logger.debug(`Cloudinary delete [${resourceType}] ${publicId}: ${result.result}`);
    return result;
  } catch (err) {
    logger.warn(`Cloudinary delete failed for ${publicId}: ${err.message}`);
  }
};

/**
 * Upload a buffer or local file path to Cloudinary programmatically.
 * (Used when you need to upload from memory rather than via multer middleware.)
 *
 * @param {string|Buffer} source      - File path or base-64 data URI
 * @param {object}        options     - Extra Cloudinary upload options
 * @returns {{ url: string, publicId: string }}
 */
const uploadAsset = async (source, options = {}) => {
  const result = await cloudinary.uploader.upload(source, {
    folder:        CLOUDINARY_FOLDERS.IMAGES,
    resource_type: 'auto',
    ...options,
  });
  return { url: result.secure_url, publicId: result.public_id };
};

/**
 * Replace an existing Cloudinary asset:
 *  1. Delete the old one (non-blocking).
 *  2. Upload the new file.
 *
 * @param {string|null} oldPublicId
 * @param {string}      newSource
 * @param {object}      options
 */
const replaceAsset = async (oldPublicId, newSource, options = {}) => {
  await deleteAsset(oldPublicId, options.resource_type || 'image');
  return uploadAsset(newSource, options);
};

/**
 * Extract the publicId from a Cloudinary secure_url.
 * e.g. "https://res.cloudinary.com/<cloud>/image/upload/v123/smart-gym/avatars/abc.jpg"
 *   →  "smart-gym/avatars/abc"
 */
const extractPublicId = (url) => {
  if (!url) return null;
  try {
    const parts  = url.split('/');
    const upload = parts.indexOf('upload');
    // skip "upload" and the version segment (vXXXXXX)
    const relevant = parts.slice(upload + 2); // ["smart-gym", "avatars", "abc.jpg"]
    const last     = relevant[relevant.length - 1].replace(/\.[^.]+$/, ''); // strip extension
    relevant[relevant.length - 1] = last;
    return relevant.join('/');
  } catch {
    return null;
  }
};

module.exports = { deleteAsset, uploadAsset, replaceAsset, extractPublicId };
