/**
 * @jest-environment jsdom
 */

const CloudTTS = require('../docs/js/cloud-tts');

// Mock URL.createObjectURL/revokeObjectURL for jsdom
var blobCounter = 0;
if (!URL.createObjectURL) {
  URL.createObjectURL = function () { return 'blob:mock-' + (++blobCounter); };
}
if (!URL.revokeObjectURL) {
  URL.revokeObjectURL = function () {};
}

describe('CloudTTS', () => {
  beforeEach(() => {
    CloudTTS.setProvider('browser');
    CloudTTS.setApiKey('');
    CloudTTS.setVoice('');
    CloudTTS.stop();
  });

  describe('provider management', () => {
    test('default provider is browser', () => {
      expect(CloudTTS.getProvider()).toBe('browser');
    });

    test('setProvider sets valid provider', () => {
      CloudTTS.setProvider('openai');
      expect(CloudTTS.getProvider()).toBe('openai');
    });

    test('setProvider sets elevenlabs', () => {
      CloudTTS.setProvider('elevenlabs');
      expect(CloudTTS.getProvider()).toBe('elevenlabs');
    });

    test('setProvider falls back to browser for invalid name', () => {
      CloudTTS.setProvider('invalid');
      expect(CloudTTS.getProvider()).toBe('browser');
    });

    test('isCloudProvider returns false for browser', () => {
      expect(CloudTTS.isCloudProvider()).toBe(false);
    });

    test('isCloudProvider returns true for openai', () => {
      CloudTTS.setProvider('openai');
      expect(CloudTTS.isCloudProvider()).toBe(true);
    });

    test('isCloudProvider returns true for elevenlabs', () => {
      CloudTTS.setProvider('elevenlabs');
      expect(CloudTTS.isCloudProvider()).toBe(true);
    });
  });

  describe('OPENAI_VOICES', () => {
    test('contains expected voices', () => {
      expect(CloudTTS.OPENAI_VOICES).toContain('alloy');
      expect(CloudTTS.OPENAI_VOICES).toContain('nova');
      expect(CloudTTS.OPENAI_VOICES).toContain('shimmer');
      expect(CloudTTS.OPENAI_VOICES.length).toBe(10);
    });
  });

  describe('buildRequest', () => {
    test('OpenAI builds correct request', () => {
      var req = CloudTTS._PROVIDERS.openai.buildRequest('hello', 'alloy', 'sk-test');
      expect(req.url).toBe('https://api.openai.com/v1/audio/speech');
      expect(req.headers['Authorization']).toBe('Bearer sk-test');
      expect(req.headers['Content-Type']).toBe('application/json');
      var body = JSON.parse(req.body);
      expect(body.model).toBe('tts-1');
      expect(body.voice).toBe('alloy');
      expect(body.input).toBe('hello');
    });

    test('ElevenLabs builds correct request', () => {
      var req = CloudTTS._PROVIDERS.elevenlabs.buildRequest('hello', 'voice123', 'el-key');
      expect(req.url).toBe('https://api.elevenlabs.io/v1/text-to-speech/voice123');
      expect(req.headers['xi-api-key']).toBe('el-key');
      expect(req.headers['Content-Type']).toBe('application/json');
      var body = JSON.parse(req.body);
      expect(body.text).toBe('hello');
      expect(body.model_id).toBe('eleven_multilingual_v2');
    });

    test('ElevenLabs encodes voice ID in URL', () => {
      var req = CloudTTS._PROVIDERS.elevenlabs.buildRequest('hi', 'voice/special', 'key');
      expect(req.url).toBe('https://api.elevenlabs.io/v1/text-to-speech/voice%2Fspecial');
    });
  });

  describe('synthesize', () => {
    test('rejects when API key not set', async () => {
      CloudTTS.setProvider('openai');
      await expect(CloudTTS.synthesize('hello')).rejects.toThrow('API key not set');
    });

    test('rejects when text is empty', async () => {
      CloudTTS.setProvider('openai');
      CloudTTS.setApiKey('sk-test');
      await expect(CloudTTS.synthesize('')).rejects.toThrow('Empty text');
    });

    test('rejects on unknown provider', async () => {
      // Force internal state
      CloudTTS.setProvider('openai');
      CloudTTS.setApiKey('sk-test');
      // Temporarily override
      var origProvider = CloudTTS.getProvider();
      CloudTTS.setProvider('browser');
      await expect(CloudTTS.synthesize('hello')).rejects.toThrow('Unknown provider');
      CloudTTS.setProvider(origProvider);
    });

    test('fetches and returns blob URL on success', async () => {
      CloudTTS.setProvider('openai');
      CloudTTS.setApiKey('sk-test');
      CloudTTS.setVoice('alloy');

      var mockBlob = new Blob(['audio'], { type: 'audio/mpeg' });
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        blob: () => Promise.resolve(mockBlob)
      });

      var url = await CloudTTS.synthesize('hello');
      expect(url).toMatch(/^blob:/);
      expect(global.fetch).toHaveBeenCalledTimes(1);

      var callArgs = global.fetch.mock.calls[0];
      expect(callArgs[0]).toBe('https://api.openai.com/v1/audio/speech');
      expect(callArgs[1].method).toBe('POST');

      URL.revokeObjectURL(url);
      delete global.fetch;
    });

    test('rejects on 401 error', async () => {
      CloudTTS.setProvider('openai');
      CloudTTS.setApiKey('bad-key');
      CloudTTS.setVoice('alloy');

      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 401
      });

      await expect(CloudTTS.synthesize('hello')).rejects.toThrow('HTTP 401');
      delete global.fetch;
    });

    test('rejects on 429 rate limit', async () => {
      CloudTTS.setProvider('openai');
      CloudTTS.setApiKey('sk-test');
      CloudTTS.setVoice('alloy');

      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 429
      });

      await expect(CloudTTS.synthesize('hello')).rejects.toThrow('HTTP 429');
      delete global.fetch;
    });

    test('rejects on network error', async () => {
      CloudTTS.setProvider('openai');
      CloudTTS.setApiKey('sk-test');
      CloudTTS.setVoice('alloy');

      global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));

      await expect(CloudTTS.synthesize('hello')).rejects.toThrow('Network error');
      delete global.fetch;
    });
  });

  describe('speakSequence', () => {
    var mockPlay;
    var mockPause;
    var mockAudioInstances;

    beforeEach(() => {
      mockAudioInstances = [];
      mockPlay = jest.fn().mockResolvedValue(undefined);
      mockPause = jest.fn();

      global.Audio = jest.fn().mockImplementation(function (url) {
        this.src = url;
        this.play = mockPlay;
        this.pause = mockPause;
        this.currentTime = 0;
        this.onended = null;
        this.onerror = null;
        mockAudioInstances.push(this);
        return this;
      });

      CloudTTS.setProvider('openai');
      CloudTTS.setApiKey('sk-test');
      CloudTTS.setVoice('alloy');
    });

    afterEach(() => {
      delete global.Audio;
      delete global.fetch;
    });

    test('plays phrases sequentially and calls onEnd', (done) => {
      var mockBlob = new Blob(['audio'], { type: 'audio/mpeg' });
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        blob: () => Promise.resolve(mockBlob)
      });

      // Make play() trigger onended asynchronously
      mockPlay.mockImplementation(function () {
        var self = this;
        return Promise.resolve().then(function () {
          setTimeout(function () {
            if (self.onended) self.onended();
          }, 10);
        });
      });

      CloudTTS.speakSequence(['hello', 'world'], function () {
        expect(global.fetch).toHaveBeenCalledTimes(2);
        expect(mockPlay).toHaveBeenCalledTimes(2);
        done();
      });
    });

    test('skips empty phrases', (done) => {
      var mockBlob = new Blob(['audio'], { type: 'audio/mpeg' });
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        blob: () => Promise.resolve(mockBlob)
      });

      mockPlay.mockImplementation(function () {
        var self = this;
        return Promise.resolve().then(function () {
          setTimeout(function () {
            if (self.onended) self.onended();
          }, 10);
        });
      });

      CloudTTS.speakSequence(['hello', '', '  ', 'world'], function () {
        expect(global.fetch).toHaveBeenCalledTimes(2);
        done();
      });
    });

    test('calls onError on fetch failure', (done) => {
      global.fetch = jest.fn().mockRejectedValue(new Error('Network fail'));

      CloudTTS.speakSequence(['hello'], null, function (err) {
        expect(err.message).toBe('Network fail');
        done();
      });
    });
  });

  describe('stop', () => {
    test('pauses current audio', () => {
      var mockPause = jest.fn();
      // Simulate internal state by setting up a playing audio
      CloudTTS.setProvider('openai');
      CloudTTS.setApiKey('sk-test');

      // Call stop (even without audio playing, should not throw)
      CloudTTS.stop();
      expect(CloudTTS.isPlaying()).toBe(false);
    });
  });

  describe('verifyApiKey', () => {
    afterEach(() => { delete global.fetch; });

    test('returns invalid for empty key', async () => {
      var result = await CloudTTS.verifyApiKey('openai', '');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Empty key');
    });

    test('returns valid for OpenAI on 200', async () => {
      global.fetch = jest.fn().mockResolvedValue({ ok: true });
      var result = await CloudTTS.verifyApiKey('openai', 'sk-test');
      expect(result.valid).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.openai.com/v1/models',
        expect.objectContaining({ method: 'GET' })
      );
    });

    test('returns invalid for OpenAI on 401', async () => {
      global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 401 });
      var result = await CloudTTS.verifyApiKey('openai', 'bad-key');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid API key');
    });

    test('returns valid for ElevenLabs on 200', async () => {
      global.fetch = jest.fn().mockResolvedValue({ ok: true });
      var result = await CloudTTS.verifyApiKey('elevenlabs', 'el-key');
      expect(result.valid).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.elevenlabs.io/v1/user',
        expect.objectContaining({ method: 'GET' })
      );
    });

    test('returns invalid for unknown provider', async () => {
      var result = await CloudTTS.verifyApiKey('unknown', 'key');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Unknown provider');
    });

    test('handles network error gracefully', async () => {
      global.fetch = jest.fn().mockRejectedValue(new Error('Network fail'));
      var result = await CloudTTS.verifyApiKey('openai', 'sk-test');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Network fail');
    });
  });

  describe('setSpeed', () => {
    test('sets speed and includes in OpenAI request', () => {
      CloudTTS.setSpeed(1.5);
      var req = CloudTTS._PROVIDERS.openai.buildRequest('hello', 'alloy', 'sk-test');
      var body = JSON.parse(req.body);
      expect(body.speed).toBe(1.5);
    });

    test('default speed (1.0) omits speed from OpenAI request', () => {
      CloudTTS.setSpeed(1.0);
      var req = CloudTTS._PROVIDERS.openai.buildRequest('hello', 'alloy', 'sk-test');
      var body = JSON.parse(req.body);
      expect(body.speed).toBeUndefined();
    });

    test('invalid speed falls back to 1.0', () => {
      CloudTTS.setSpeed('abc');
      var req = CloudTTS._PROVIDERS.openai.buildRequest('hello', 'alloy', 'sk-test');
      var body = JSON.parse(req.body);
      expect(body.speed).toBeUndefined();
    });

    test('ElevenLabs request does not include speed', () => {
      CloudTTS.setSpeed(1.5);
      var req = CloudTTS._PROVIDERS.elevenlabs.buildRequest('hello', 'voice1', 'el-key');
      var body = JSON.parse(req.body);
      expect(body.speed).toBeUndefined();
    });
  });

  describe('fetchVoices', () => {
    test('returns voice list on success', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          voices: [
            { voice_id: 'v1', name: 'Voice One' },
            { voice_id: 'v2', name: 'Voice Two' }
          ]
        })
      });

      var voices = await CloudTTS.fetchVoices('el-key');
      expect(voices).toEqual([
        { voice_id: 'v1', name: 'Voice One' },
        { voice_id: 'v2', name: 'Voice Two' }
      ]);

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.elevenlabs.io/v1/voices',
        expect.objectContaining({ method: 'GET', headers: { 'xi-api-key': 'el-key' } })
      );
      delete global.fetch;
    });

    test('rejects on HTTP error', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 401
      });

      await expect(CloudTTS.fetchVoices('bad-key')).rejects.toThrow('HTTP 401');
      delete global.fetch;
    });
  });
});
