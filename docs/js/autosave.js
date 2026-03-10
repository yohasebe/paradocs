/**
 * AutoSave - localStorage persistence for editor text and form settings.
 *
 * Usage (browser):
 *   var autosave = new AutoSave('paradocs_');
 *   autosave.saveText(editor.getValue());
 *   var saved = autosave.loadText();
 *
 * The module is also compatible with CommonJS (for testing with Jest).
 */

(function (root) {
  'use strict';

  var DEBOUNCE_MS = 1000;

  function AutoSave(prefix) {
    this._prefix = prefix || 'paradocs_';
    this._textKey = this._prefix + 'editor_text';
    this._settingsKey = this._prefix + 'settings';
    this._timer = null;
  }

  // ---- private helpers ----

  AutoSave.prototype._getStorage = function () {
    try {
      return localStorage;
    } catch (_e) {
      return null;
    }
  };

  // ---- text ----

  AutoSave.prototype.saveText = function (text) {
    var storage = this._getStorage();
    if (!storage) return;
    try {
      storage.setItem(this._textKey, text);
    } catch (_e) { /* quota exceeded or other error */ }
  };

  AutoSave.prototype.loadText = function () {
    var storage = this._getStorage();
    if (!storage) return null;
    try {
      return storage.getItem(this._textKey);
    } catch (_e) {
      return null;
    }
  };

  // ---- settings ----

  AutoSave.prototype.saveSettings = function (settings) {
    var storage = this._getStorage();
    if (!storage) return;
    try {
      storage.setItem(this._settingsKey, JSON.stringify(settings));
    } catch (_e) { /* quota exceeded or other error */ }
  };

  AutoSave.prototype.loadSettings = function () {
    var storage = this._getStorage();
    if (!storage) return null;
    try {
      var raw = storage.getItem(this._settingsKey);
      if (raw === null) return null;
      return JSON.parse(raw);
    } catch (_e) {
      return null;
    }
  };

  // ---- clear ----

  AutoSave.prototype.clear = function () {
    var storage = this._getStorage();
    if (!storage) return;
    try {
      storage.removeItem(this._textKey);
      storage.removeItem(this._settingsKey);
    } catch (_e) { /* ignore */ }
  };

  // ---- hasSavedData ----

  AutoSave.prototype.hasSavedData = function () {
    var storage = this._getStorage();
    if (!storage) return false;
    try {
      return storage.getItem(this._textKey) !== null;
    } catch (_e) {
      return false;
    }
  };

  // ---- debounced save ----

  AutoSave.prototype.debouncedSaveText = function (text) {
    var self = this;
    if (self._timer) {
      clearTimeout(self._timer);
    }
    self._timer = setTimeout(function () {
      self.saveText(text);
      self._timer = null;
    }, DEBOUNCE_MS);
  };

  // ---- export ----

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AutoSave: AutoSave };
  } else {
    root.AutoSave = AutoSave;
  }

})(typeof window !== 'undefined' ? window : this);
