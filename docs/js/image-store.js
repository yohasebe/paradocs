/**
 * ImageStore — In-memory store for locally uploaded images.
 *
 * Design:
 * - Images are stored as base64 data URLs in a Map (volatile, not persisted).
 * - Closing or reloading the page clears all images automatically.
 * - Supports serialize/deserialize (toJSON/fromJSON) for sessionStorage transfer.
 * - File names are sanitized to safe characters.
 * - SVG is rejected to prevent XSS.
 * - Max file size: 5MB per image.
 */

var ImageStore = (function() {
  'use strict';

  var ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  var MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

  var store = new Map();

  /**
   * Sanitize a file name to safe characters.
   * Replaces anything that isn't alphanumeric, dash, underscore, or dot with underscore.
   */
  function sanitizeName(name) {
    return name.replace(/[^a-zA-Z0-9._-]/g, '_');
  }

  /**
   * Store an image data URL by name.
   */
  function set(name, dataUrl) {
    var safeName = sanitizeName(name);
    store.set(safeName, dataUrl);
  }

  /**
   * Get an image data URL by name. Returns null if not found.
   */
  function get(name) {
    var safeName = sanitizeName(name);
    return store.get(safeName) || null;
  }

  /**
   * Check if an image exists by name.
   */
  function has(name) {
    var safeName = sanitizeName(name);
    return store.has(safeName);
  }

  /**
   * Remove a specific image by name.
   */
  function remove(name) {
    var safeName = sanitizeName(name);
    store.delete(safeName);
  }

  /**
   * Remove all images.
   */
  function clear() {
    store.clear();
  }

  /**
   * Get the number of stored images.
   */
  function count() {
    return store.size;
  }

  /**
   * List all stored image names.
   */
  function list() {
    return Array.from(store.keys());
  }

  /**
   * Get total size of all stored data URLs in characters.
   */
  function totalSize() {
    var size = 0;
    store.forEach(function(value) {
      size += value.length;
    });
    return size;
  }

  /**
   * Process a File object: validate, read as data URL, and store.
   * Returns a Promise that resolves with { name, dataUrl }.
   */
  function processFile(file) {
    return new Promise(function(resolve, reject) {
      if (ALLOWED_TYPES.indexOf(file.type) === -1) {
        reject(new Error(file.name + ' is not a supported image type. Allowed: JPEG, PNG, GIF, WebP.'));
        return;
      }

      if (file.size > MAX_FILE_SIZE) {
        reject(new Error(file.name + ' exceeds the 5MB size limit.'));
        return;
      }

      var reader = new FileReader();
      reader.onload = function(e) {
        var dataUrl = e.target.result;
        var safeName = sanitizeName(file.name);
        store.set(safeName, dataUrl);
        resolve({ name: safeName, dataUrl: dataUrl });
      };
      reader.onerror = function() {
        reject(new Error('Failed to read file: ' + file.name));
      };
      reader.readAsDataURL(file);
    });
  }

  /**
   * Serialize all images to a JSON string for sessionStorage transfer.
   */
  function toJSON() {
    var obj = {};
    store.forEach(function(value, key) {
      obj[key] = value;
    });
    return JSON.stringify(obj);
  }

  /**
   * Restore images from a JSON string.
   */
  function fromJSON(json) {
    var obj = JSON.parse(json);
    var dataUrlPattern = /^data:image\/(jpeg|png|gif|webp);base64,[A-Za-z0-9+/=]+$/i;
    for (var key in obj) {
      if (obj.hasOwnProperty(key)) {
        var safeName = sanitizeName(key);
        var value = obj[key];
        // Validate that the value is a safe image data URL
        if (typeof value === 'string' && dataUrlPattern.test(value)) {
          store.set(safeName, value);
        }
      }
    }
  }

  return {
    sanitizeName: sanitizeName,
    set: set,
    get: get,
    has: has,
    remove: remove,
    clear: clear,
    count: count,
    list: list,
    totalSize: totalSize,
    processFile: processFile,
    toJSON: toJSON,
    fromJSON: fromJSON
  };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = ImageStore;
}
