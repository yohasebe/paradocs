/**
 * CloudTTS - Cloud TTS provider integration (OpenAI, ElevenLabs).
 *
 * Features:
 * - Streaming playback via MediaSource API (starts before full download)
 * - Prefetching of next segment while current plays
 * - AbortController for request cancellation on stop/error
 * - Fallback to blob download for browsers without MediaSource
 *
 * Compatible with CommonJS (for testing with Jest).
 */

(function (root) {
  'use strict';

  var OPENAI_VOICES = ['alloy', 'ash', 'ballad', 'coral', 'echo', 'fable', 'nova', 'onyx', 'sage', 'shimmer'];
  var FETCH_TIMEOUT = 15000;      // 15s timeout for voice list fetch
  var SYNTHESIS_TIMEOUT = 30000;  // 30s timeout for speech synthesis

  var PROVIDERS = {
    openai: {
      buildRequest: function (text, voice, apiKey) {
        var payload = { model: 'tts-1', voice: voice, input: text };
        if (_speed !== 1.0) payload.speed = _speed;
        return {
          url: 'https://api.openai.com/v1/audio/speech',
          headers: {
            'Authorization': 'Bearer ' + apiKey,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        };
      }
    },
    elevenlabs: {
      buildRequest: function (text, voice, apiKey) {
        return {
          url: 'https://api.elevenlabs.io/v1/text-to-speech/' + encodeURIComponent(voice),
          headers: {
            'xi-api-key': apiKey,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ text: text, model_id: 'eleven_multilingual_v2' })
        };
      }
    }
  };

  var _provider = 'browser';
  var _apiKey = '';
  var _voice = '';
  var _speed = 1.0;
  var _currentAudio = null;
  var _playing = false;
  var _stopRequested = false;
  // Track active AbortControllers for cancellation
  var _activeAbortControllers = [];

  var CloudTTS = {};

  CloudTTS.OPENAI_VOICES = OPENAI_VOICES;

  CloudTTS.setProvider = function (name) {
    _provider = (name && PROVIDERS[name]) ? name : 'browser';
  };

  CloudTTS.getProvider = function () {
    return _provider;
  };

  CloudTTS.setApiKey = function (key) {
    _apiKey = key || '';
  };

  CloudTTS.setVoice = function (voiceId) {
    _voice = voiceId || '';
  };

  CloudTTS.setSpeed = function (speed) {
    _speed = parseFloat(speed) || 1.0;
  };

  CloudTTS.isCloudProvider = function () {
    return _provider !== 'browser' && !!PROVIDERS[_provider];
  };

  /**
   * Create an AbortController with timeout.
   * Tracks it for cancellation via stop().
   */
  function _createAbort(timeout) {
    if (typeof AbortController === 'undefined') return { signal: undefined, abort: function () {} };
    var ac = new AbortController();
    var timer = setTimeout(function () { ac.abort(); }, timeout || FETCH_TIMEOUT);
    ac.signal.addEventListener('abort', function () { clearTimeout(timer); });
    _activeAbortControllers.push(ac);
    return ac;
  }

  /** Remove a completed AbortController from tracking. */
  function _removeAbort(ac) {
    var idx = _activeAbortControllers.indexOf(ac);
    if (idx >= 0) _activeAbortControllers.splice(idx, 1);
  }

  /** Abort all tracked requests. */
  function _abortAll() {
    var controllers = _activeAbortControllers.slice();
    _activeAbortControllers = [];
    controllers.forEach(function (ac) {
      try { ac.abort(); } catch (e) { /* ignore */ }
    });
  }

  /**
   * Fetch available voices from ElevenLabs.
   * Returns Promise<Array<{voice_id, name}>>
   */
  CloudTTS.fetchVoices = function (apiKey) {
    var ac = _createAbort(FETCH_TIMEOUT);
    return fetch('https://api.elevenlabs.io/v1/voices', {
      method: 'GET',
      headers: { 'xi-api-key': apiKey },
      signal: ac.signal
    }).then(function (res) {
      _removeAbort(ac);
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return res.json();
    }).then(function (data) {
      return (data.voices || []).map(function (v) {
        return { voice_id: v.voice_id, name: v.name };
      });
    }).catch(function (err) {
      _removeAbort(ac);
      throw err;
    });
  };

  /**
   * Verify an API key by making a lightweight test request.
   */
  CloudTTS.verifyApiKey = function (provider, apiKey) {
    if (!apiKey || !apiKey.trim()) {
      return Promise.resolve({ valid: false, error: 'Empty key' });
    }

    var ac = _createAbort(FETCH_TIMEOUT);
    var url, headers;

    if (provider === 'openai') {
      url = 'https://api.openai.com/v1/models';
      headers = { 'Authorization': 'Bearer ' + apiKey };
    } else if (provider === 'elevenlabs') {
      url = 'https://api.elevenlabs.io/v1/user';
      headers = { 'xi-api-key': apiKey };
    } else {
      _removeAbort(ac);
      return Promise.resolve({ valid: false, error: 'Unknown provider' });
    }

    return fetch(url, {
      method: 'GET',
      headers: headers,
      signal: ac.signal
    }).then(function (res) {
      _removeAbort(ac);
      if (res.ok) return { valid: true };
      if (res.status === 401) return { valid: false, error: 'Invalid API key' };
      return { valid: false, error: 'HTTP ' + res.status };
    }).catch(function (err) {
      _removeAbort(ac);
      if (err.name === 'AbortError') return { valid: false, error: 'Request timed out' };
      return { valid: false, error: err.message };
    });
  };

  /**
   * Synthesize text via the current cloud provider (blob download).
   * Returns Promise<string> (object URL for audio playback).
   */
  CloudTTS.synthesize = function (text) {
    var provider = PROVIDERS[_provider];
    if (!provider) return Promise.reject(new Error('Unknown provider: ' + _provider));
    if (!_apiKey) return Promise.reject(new Error('API key not set'));
    if (!text || !text.trim()) return Promise.reject(new Error('Empty text'));

    var req = provider.buildRequest(text, _voice, _apiKey);
    var ac = _createAbort(SYNTHESIS_TIMEOUT); // 30s for synthesis
    return fetch(req.url, {
      method: 'POST',
      headers: req.headers,
      body: req.body,
      signal: ac.signal
    }).then(function (res) {
      _removeAbort(ac);
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return res.blob();
    }).then(function (blob) {
      return URL.createObjectURL(blob);
    }).catch(function (err) {
      _removeAbort(ac);
      throw err;
    });
  };

  // ---- Internal: streaming and non-streaming audio creation ----

  function canStream() {
    return (typeof MediaSource !== 'undefined') &&
           MediaSource.isTypeSupported('audio/mpeg');
  }

  function _buildReq(text) {
    var provider = PROVIDERS[_provider];
    if (!provider || !_apiKey || !text || !text.trim()) return null;
    return provider.buildRequest(text, _voice, _apiKey);
  }

  /**
   * Create an Audio element via streaming (MediaSource API).
   * Returns Promise<Audio>.
   */
  function _createStreamingAudio(req) {
    var ac = _createAbort(SYNTHESIS_TIMEOUT);

    return new Promise(function (resolve, reject) {
      var mediaSource = new MediaSource();
      var blobUrl = URL.createObjectURL(mediaSource);
      var audio = new Audio(blobUrl);
      audio._blobUrl = blobUrl;
      var resolved = false;

      function fail(err) {
        _removeAbort(ac);
        if (audio._blobUrl) { URL.revokeObjectURL(audio._blobUrl); audio._blobUrl = null; }
        if (!resolved) { resolved = true; reject(err); }
      }

      mediaSource.addEventListener('sourceopen', function () {
        var sourceBuffer;
        try {
          sourceBuffer = mediaSource.addSourceBuffer('audio/mpeg');
        } catch (e) {
          fail(e);
          return;
        }

        fetch(req.url, { method: 'POST', headers: req.headers, body: req.body, signal: ac.signal })
          .then(function (res) {
            if (!res.ok) { fail(new Error('HTTP ' + res.status)); return; }

            var reader = res.body.getReader();
            // Store reader on audio for cancellation
            audio._reader = reader;

            function pump() {
              reader.read().then(function (result) {
                if (_stopRequested) { reader.cancel(); _removeAbort(ac); return; }

                if (result.done) {
                  _removeAbort(ac);
                  try {
                    if (!sourceBuffer.updating && mediaSource.readyState === 'open') {
                      mediaSource.endOfStream();
                    } else if (sourceBuffer.updating) {
                      sourceBuffer.addEventListener('updateend', function () {
                        if (mediaSource.readyState === 'open') mediaSource.endOfStream();
                      }, { once: true });
                    }
                  } catch (e) { /* ignore */ }
                  return;
                }

                function doAppend() {
                  try {
                    sourceBuffer.appendBuffer(result.value);
                  } catch (e) { fail(e); return; }
                  sourceBuffer.addEventListener('updateend', function () {
                    if (!resolved) { resolved = true; _removeAbort(ac); resolve(audio); }
                    pump();
                  }, { once: true });
                }

                if (sourceBuffer.updating) {
                  sourceBuffer.addEventListener('updateend', doAppend, { once: true });
                } else {
                  doAppend();
                }
              }).catch(function (err) { fail(err); });
            }

            pump();
          })
          .catch(function (err) { fail(err); });
      });

      mediaSource.addEventListener('error', function () {
        fail(new Error('MediaSource error'));
      });
    });
  }

  /**
   * Create an Audio element via full blob download (fallback).
   * Returns Promise<Audio>.
   */
  function _createBlobAudio(req) {
    var ac = _createAbort(SYNTHESIS_TIMEOUT);
    return fetch(req.url, { method: 'POST', headers: req.headers, body: req.body, signal: ac.signal })
      .then(function (res) {
        _removeAbort(ac);
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.blob();
      })
      .then(function (blob) {
        var url = URL.createObjectURL(blob);
        var audio = new Audio(url);
        audio._blobUrl = url;
        return audio;
      })
      .catch(function (err) {
        _removeAbort(ac);
        throw err;
      });
  }

  /**
   * Create an Audio element — streaming if supported, blob otherwise.
   * Returns Promise<Audio>.
   */
  function _createAudio(text) {
    var req = _buildReq(text);
    if (!req) return Promise.reject(new Error('Invalid request'));
    if (canStream()) return _createStreamingAudio(req);
    return _createBlobAudio(req);
  }

  // ---- Sequence playback ----

  function nextNonEmpty(phrases, from) {
    for (var i = from; i < phrases.length; i++) {
      if (phrases[i] && phrases[i].trim()) return i;
    }
    return -1;
  }

  /**
   * Play an array of phrases sequentially with streaming + prefetching.
   */
  CloudTTS.speakSequence = function (phrases, onEnd, onError) {
    _stopRequested = false;
    _playing = true;

    function cleanupAudio(audio) {
      if (audio) {
        if (audio._reader) { try { audio._reader.cancel(); } catch (e) { /* ignore */ } }
        if (audio._blobUrl) { URL.revokeObjectURL(audio._blobUrl); audio._blobUrl = null; }
      }
    }

    function playNext(index, prefetchPromise) {
      var cur = prefetchPromise ? index : nextNonEmpty(phrases, index);
      if (_stopRequested || cur < 0) {
        _playing = false;
        _currentAudio = null;
        if (onEnd) onEnd();
        return;
      }

      var audioPromise = prefetchPromise || _createAudio(phrases[cur]);

      audioPromise.then(function (audio) {
        if (_stopRequested) {
          cleanupAudio(audio);
          _playing = false;
          _currentAudio = null;
          if (onEnd) onEnd();
          return;
        }

        _currentAudio = audio;

        // Prefetch next segment while current plays
        var nextIdx = nextNonEmpty(phrases, cur + 1);
        var nextPrefetch = (nextIdx >= 0) ? _createAudio(phrases[nextIdx]) : null;

        audio.onended = function () {
          cleanupAudio(audio);
          _currentAudio = null;
          if (nextIdx >= 0 && nextPrefetch) {
            playNext(nextIdx, nextPrefetch);
          } else {
            _playing = false;
            if (onEnd) onEnd();
          }
        };

        audio.onerror = function () {
          cleanupAudio(audio);
          _currentAudio = null;
          _playing = false;
          // Cancel prefetch on error
          _abortAll();
          if (onError) onError(new Error('Audio playback error'));
        };

        audio.play().catch(function (err) {
          cleanupAudio(audio);
          _currentAudio = null;
          _playing = false;
          _abortAll();
          if (onError) onError(err);
        });
      }).catch(function (err) {
        _currentAudio = null;
        _playing = false;
        // Cancel prefetch on error
        _abortAll();
        if (onError) onError(err);
      });
    }

    playNext(0, null);
  };

  CloudTTS.stop = function () {
    _stopRequested = true;
    // Cancel all in-flight requests (current + prefetched)
    _abortAll();
    if (_currentAudio) {
      _currentAudio.pause();
      if (_currentAudio._reader) {
        try { _currentAudio._reader.cancel(); } catch (e) { /* ignore */ }
      }
      if (_currentAudio._blobUrl) {
        URL.revokeObjectURL(_currentAudio._blobUrl);
      }
      _currentAudio = null;
    }
    _playing = false;
  };

  CloudTTS.isPlaying = function () {
    return _playing;
  };

  // For testing: expose internals
  CloudTTS._PROVIDERS = PROVIDERS;
  CloudTTS._createAudio = _createAudio;

  // Export
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = CloudTTS;
  } else {
    root.CloudTTS = CloudTTS;
  }

})(typeof window !== 'undefined' ? window : this);
