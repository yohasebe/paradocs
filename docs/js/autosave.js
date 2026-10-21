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
    this._keysKey = this._prefix + 'tts_keys';
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

  // ---- API keys ----
  // Keys go into the persistent settings only when the user opts in
  // ("remember"). Otherwise they live in sessionStorage and vanish with
  // the tab, so other pages on the same origin cannot read them later.

  var KEY_FIELDS = { openai: 'tts_api_key_openai', elevenlabs: 'tts_api_key_elevenlabs' };

  AutoSave.prototype._getSessionStorage = function () {
    try {
      return sessionStorage;
    } catch (_e) {
      return null;
    }
  };

  /**
   * Store per-provider keys ({ openai, elevenlabs }) according to `remember`.
   * Always removes them from the place they should not be.
   */
  AutoSave.prototype.saveApiKeys = function (keys, remember) {
    var settings = this.loadSettings() || {};
    var session = this._getSessionStorage();
    Object.keys(KEY_FIELDS).forEach(function (provider) {
      if (remember) {
        settings[KEY_FIELDS[provider]] = keys[provider] || '';
      } else {
        delete settings[KEY_FIELDS[provider]];
      }
    });
    delete settings.tts_api_key;  // legacy single-key field
    settings.tts_remember_key = !!remember;
    this.saveSettings(settings);
    if (!session) return;
    try {
      if (remember) {
        session.removeItem(this._keysKey);
      } else {
        session.setItem(this._keysKey, JSON.stringify(keys));
      }
    } catch (_e) { /* storage unavailable */ }
  };

  /**
   * Returns { keys: { openai, elevenlabs }, remember }.
   * Users whose keys were saved before the opt-in existed keep remember = true.
   */
  AutoSave.prototype.loadApiKeys = function () {
    var settings = this.loadSettings() || {};
    var keys = { openai: '', elevenlabs: '' };
    Object.keys(KEY_FIELDS).forEach(function (provider) {
      keys[provider] = settings[KEY_FIELDS[provider]] || '';
    });
    // Legacy: single key field tied to the selected provider
    if (settings.tts_api_key && KEY_FIELDS[settings.tts_provider] && !keys[settings.tts_provider]) {
      keys[settings.tts_provider] = settings.tts_api_key;
    }
    var remember = settings.tts_remember_key;
    if (typeof remember !== 'boolean') {
      remember = !!(keys.openai || keys.elevenlabs);
    }
    var session = this._getSessionStorage();
    if (session) {
      try {
        var sessionKeys = JSON.parse(session.getItem(this._keysKey));
        if (sessionKeys) {
          Object.keys(KEY_FIELDS).forEach(function (provider) {
            if (sessionKeys[provider]) keys[provider] = sessionKeys[provider];
          });
        }
      } catch (_e) { /* storage unavailable or malformed */ }
    }
    return { keys: keys, remember: remember };
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
      var text = storage.getItem(this._textKey);
      return text !== null && text.length > 0;
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
