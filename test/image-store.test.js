/**
 * Tests for image-store.js (local image upload and management)
 *
 * @jest-environment jsdom
 */

const fs = require('fs');
const path = require('path');

// Load image-store.js into global scope
const storeCode = fs.readFileSync(
  path.join(__dirname, '..', 'docs', 'js', 'image-store.js'),
  'utf-8'
);
eval(storeCode);

// Helper: create a minimal JPEG-like Blob
function createTestBlob(sizeKB = 1, type = 'image/jpeg') {
  const bytes = new Uint8Array(sizeKB * 1024);
  // Minimal JPEG header
  if (type === 'image/jpeg') {
    bytes[0] = 0xFF; bytes[1] = 0xD8; bytes[2] = 0xFF; bytes[3] = 0xE0;
  }
  // Minimal PNG header
  if (type === 'image/png') {
    bytes[0] = 0x89; bytes[1] = 0x50; bytes[2] = 0x4E; bytes[3] = 0x47;
  }
  return new Blob([bytes], { type });
}

// Helper: create a File object
function createTestFile(name = 'test.jpg', sizeKB = 1, type = 'image/jpeg') {
  const blob = createTestBlob(sizeKB, type);
  return new File([blob], name, { type });
}

describe('ImageStore', () => {

  beforeEach(() => {
    ImageStore.clear();
  });

  describe('basic operations', () => {
    test('starts empty', () => {
      expect(ImageStore.count()).toBe(0);
      expect(ImageStore.list()).toEqual([]);
    });

    test('store and retrieve an image by name', async () => {
      const dataUrl = 'data:image/jpeg;base64,/9j/4AAQ';
      ImageStore.set('photo.jpg', dataUrl);

      expect(ImageStore.has('photo.jpg')).toBe(true);
      expect(ImageStore.get('photo.jpg')).toBe(dataUrl);
      expect(ImageStore.count()).toBe(1);
    });

    test('list returns all stored names', () => {
      ImageStore.set('a.jpg', 'data:image/jpeg;base64,aaa');
      ImageStore.set('b.png', 'data:image/png;base64,bbb');

      const names = ImageStore.list();
      expect(names).toContain('a.jpg');
      expect(names).toContain('b.png');
      expect(names.length).toBe(2);
    });

    test('overwrite existing image with same name', () => {
      ImageStore.set('img.jpg', 'data:image/jpeg;base64,old');
      ImageStore.set('img.jpg', 'data:image/jpeg;base64,new');

      expect(ImageStore.get('img.jpg')).toBe('data:image/jpeg;base64,new');
      expect(ImageStore.count()).toBe(1);
    });

    test('remove a specific image', () => {
      ImageStore.set('a.jpg', 'data:image/jpeg;base64,aaa');
      ImageStore.set('b.jpg', 'data:image/jpeg;base64,bbb');

      ImageStore.remove('a.jpg');
      expect(ImageStore.has('a.jpg')).toBe(false);
      expect(ImageStore.has('b.jpg')).toBe(true);
      expect(ImageStore.count()).toBe(1);
    });

    test('clear removes all images', () => {
      ImageStore.set('a.jpg', 'data:image/jpeg;base64,aaa');
      ImageStore.set('b.jpg', 'data:image/jpeg;base64,bbb');

      ImageStore.clear();
      expect(ImageStore.count()).toBe(0);
      expect(ImageStore.list()).toEqual([]);
    });

    test('get returns null for non-existent image', () => {
      expect(ImageStore.get('nonexistent.jpg')).toBeNull();
    });

    test('has returns false for non-existent image', () => {
      expect(ImageStore.has('nonexistent.jpg')).toBe(false);
    });
  });

  describe('name sanitization', () => {
    test('sanitizes special characters in filenames', () => {
      ImageStore.set('my photo (1).jpg', 'data:image/jpeg;base64,aaa');
      expect(ImageStore.has('my_photo__1_.jpg')).toBe(true);
    });

    test('sanitizes path separators', () => {
      ImageStore.set('path/to/image.jpg', 'data:image/jpeg;base64,aaa');
      expect(ImageStore.has('path_to_image.jpg')).toBe(true);
    });

    test('sanitizeName is consistent', () => {
      const name1 = ImageStore.sanitizeName('My Photo (1).jpg');
      const name2 = ImageStore.sanitizeName('My Photo (1).jpg');
      expect(name1).toBe(name2);
    });

    test('sanitizeName preserves extension', () => {
      expect(ImageStore.sanitizeName('test.jpg')).toBe('test.jpg');
      expect(ImageStore.sanitizeName('test.png')).toBe('test.png');
    });
  });

  describe('file processing', () => {
    test('processFile accepts image file types', async () => {
      const file = createTestFile('photo.jpg', 1, 'image/jpeg');
      const result = await ImageStore.processFile(file);

      expect(result.name).toBe('photo.jpg');
      expect(result.dataUrl).toMatch(/^data:image\//);
    });

    test('processFile accepts PNG files', async () => {
      const file = createTestFile('diagram.png', 1, 'image/png');
      const result = await ImageStore.processFile(file);

      expect(result.name).toBe('diagram.png');
      expect(result.dataUrl).toMatch(/^data:image\//);
    });

    test('processFile accepts GIF files', async () => {
      const file = createTestFile('anim.gif', 1, 'image/gif');
      const result = await ImageStore.processFile(file);

      expect(result.name).toBe('anim.gif');
    });

    test('processFile rejects non-image files', async () => {
      const file = new File(['hello'], 'script.js', { type: 'application/javascript' });
      await expect(ImageStore.processFile(file)).rejects.toThrow(/not a supported image/i);
    });

    test('processFile rejects SVG files (XSS risk)', async () => {
      const file = new File(['<svg></svg>'], 'icon.svg', { type: 'image/svg+xml' });
      await expect(ImageStore.processFile(file)).rejects.toThrow(/not a supported image/i);
    });

    test('processFile rejects files exceeding size limit', async () => {
      const file = createTestFile('huge.jpg', 5200, 'image/jpeg'); // > 5MB
      await expect(ImageStore.processFile(file)).rejects.toThrow(/exceeds.*limit/i);
    });

    test('processFile stores the image automatically', async () => {
      const file = createTestFile('auto.jpg', 1, 'image/jpeg');
      await ImageStore.processFile(file);

      expect(ImageStore.has('auto.jpg')).toBe(true);
    });
  });

  describe('total size tracking', () => {
    test('totalSize returns 0 when empty', () => {
      expect(ImageStore.totalSize()).toBe(0);
    });

    test('totalSize tracks stored data', () => {
      const data = 'data:image/jpeg;base64,AAAA';
      ImageStore.set('a.jpg', data);
      expect(ImageStore.totalSize()).toBe(data.length);
    });

    test('totalSize updates on remove', () => {
      ImageStore.set('a.jpg', 'data:image/jpeg;base64,AAAA');
      ImageStore.set('b.jpg', 'data:image/jpeg;base64,BBBB');
      const sizeBefore = ImageStore.totalSize();

      ImageStore.remove('a.jpg');
      expect(ImageStore.totalSize()).toBeLessThan(sizeBefore);
    });
  });

  describe('session storage integration', () => {
    test('toJSON serializes all images', () => {
      ImageStore.set('a.jpg', 'data:image/jpeg;base64,aaa');
      ImageStore.set('b.png', 'data:image/png;base64,bbb');

      const json = ImageStore.toJSON();
      const parsed = JSON.parse(json);

      expect(parsed['a.jpg']).toBe('data:image/jpeg;base64,aaa');
      expect(parsed['b.png']).toBe('data:image/png;base64,bbb');
    });

    test('fromJSON restores images', () => {
      const data = { 'x.jpg': 'data:image/jpeg;base64,xxx' };
      ImageStore.fromJSON(JSON.stringify(data));

      expect(ImageStore.has('x.jpg')).toBe(true);
      expect(ImageStore.get('x.jpg')).toBe('data:image/jpeg;base64,xxx');
    });

    test('toJSON returns empty object when no images', () => {
      expect(ImageStore.toJSON()).toBe('{}');
    });
  });
});
