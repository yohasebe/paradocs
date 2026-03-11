#!/usr/bin/env node
import puppeteer from 'puppeteer';
import path from 'path';

const IMG_DIR = '/Users/yohasebe/Library/CloudStorage/Dropbox/code/paradocs/docs/img';
const BASE_URL = 'http://localhost:8765';

function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

async function main() {
  const browser = await puppeteer.launch({
    headless: true,
    defaultViewport: { width: 1920, height: 1080, deviceScaleFactor: 2 }
  });

  async function openPresentation() {
    const page = await browser.newPage();
    await page.goto(BASE_URL, { waitUntil: 'networkidle2' });
    await delay(2000);
    const popupPromise = new Promise(resolve => {
      browser.once('targetcreated', async target => {
        const p = await target.page();
        if (p) resolve(p);
      });
    });
    await page.click('#submit_button');
    const popup = await popupPromise;
    await delay(5000);
    // Intercept requests to redirect external image URLs to local server
    await popup.setRequestInterception(true);
    popup.on('request', (req) => {
      const url = req.url();
      if (url.includes('yohasebe.com/paradocs/')) {
        const localUrl = url.replace(/https?:\/\/[^/]*\/paradocs\//, `${BASE_URL}/`);
        req.continue({ url: localUrl });
      } else {
        req.continue();
      }
    });
    return { parent: page, popup };
  }

  // Navigate to a specific vertical slide and fragment index
  // fragmentIndex: -1 = no fragments shown, 0 = first fragment, etc.
  async function goToFragment(popup, vSlide, fragmentIndex = -1) {
    await popup.evaluate((v, f) => { Reveal.slide(0, v, f); }, vSlide, fragmentIndex);
    await delay(500);
  }

  // Get total fragment count on the current slide
  async function getFragmentCount(popup, vSlide) {
    return await popup.evaluate((v) => {
      const slide = Reveal.getSlide(0, v);
      return slide ? slide.querySelectorAll('.fragment').length : 0;
    }, vSlide);
  }

  // Take a screenshot with padded frame number
  async function capture(popup, dir, n) {
    await popup.screenshot({ path: path.join(dir, `frame-${String(n).padStart(2,'0')}.png`) });
  }

  // --- Debug: Print fragment counts for key slides ---
  {
    const { parent, popup } = await openPresentation();
    for (const v of [1, 5, 8, 13, 14]) {
      const count = await getFragmentCount(popup, v);
      console.log(`  Slide v=${v}: ${count} fragments`);
    }
    await popup.close();
    await parent.close();
  }

  // --- 1. Carousel: Paragraph highlighting (slide v=1, sentence 3) ---
  console.log('Capturing: paragraph highlighting...');
  {
    const { parent, popup } = await openPresentation();
    await goToFragment(popup, 1, 2);  // 0-indexed: fragment 2 = sentence 3
    await popup.screenshot({ path: path.join(IMG_DIR, 'linguistics.gif') });
    console.log('  -> linguistics.gif saved');
    await popup.close();
    await parent.close();
  }

  // --- 2. Carousel: MCQ Quiz (slide v=14, all fragments shown) ---
  console.log('Capturing: MCQ quiz...');
  {
    const { parent, popup } = await openPresentation();
    const count = await getFragmentCount(popup, 14);
    await goToFragment(popup, 14, count - 1);
    await popup.screenshot({ path: path.join(IMG_DIR, 'quiz.gif') });
    console.log('  -> quiz.gif saved');
    await popup.close();
    await parent.close();
  }

  // --- 3. Carousel: Table (slide v=8, all fragments shown) ---
  console.log('Capturing: table...');
  {
    const { parent, popup } = await openPresentation();
    const count = await getFragmentCount(popup, 8);
    await goToFragment(popup, 8, count - 1);
    await popup.screenshot({ path: path.join(IMG_DIR, 'speech.gif') });
    console.log('  -> speech.gif saved');
    await popup.close();
    await parent.close();
  }

  // --- 4. GIF frames for README ---
  console.log('Capturing: GIF frames...');
  {
    const { parent, popup } = await openPresentation();
    const framesDir = path.join(IMG_DIR, 'screenshots');
    let n = 1;

    // Frame 1: Title slide (v=0)
    await capture(popup, framesDir, n++);

    // Frames 2-5: Paragraph - all 4 sentences one by one (v=1)
    // v=1 has 4 sentence fragments (indices 0-3)
    for (let f = 0; f < 4; f++) {
      await goToFragment(popup, 1, f);
      await capture(popup, framesDir, n++);
    }

    // Frames 6-8: Unordered List - all 3 items (v=5)
    // v=5: heading + 3 intro sentences + 3 list items
    // List items are the last 3 fragments
    {
      const total = await getFragmentCount(popup, 5);
      console.log(`  List slide: ${total} fragments, capturing last 3`);
      for (let i = 2; i >= 0; i--) {
        await goToFragment(popup, 5, total - 1 - i);
        await capture(popup, framesDir, n++);
      }
    }

    // Frames 9-10: Table - all sentence highlights (v=8)
    // v=8: 2 sentence fragments + table(static, no fragment)
    {
      const total = await getFragmentCount(popup, 8);
      console.log(`  Table slide: ${total} fragments, capturing all`);
      for (let f = 0; f < total; f++) {
        await goToFragment(popup, 8, f);
        await capture(popup, framesDir, n++);
      }
    }

    // Frame 11: Pop-up Image (v=12)
    // v=12: 3 sentences, each with a popup image
    // Use keyboard navigation so fragmentshown event fires and image popup appears
    {
      await goToFragment(popup, 12, -1);  // navigate to slide, no fragments
      // Advance to fragment 0 (first image: Mona Lisa)
      await popup.keyboard.press('j');
      await delay(500);
      // Wait for network to idle (image load from external URL)
      await popup.waitForNetworkIdle({ idleTime: 2000, timeout: 10000 }).catch(() => {});
      await delay(500);
      // Click the enlarge button twice to make image bigger for screenshot
      for (let i = 0; i < 2; i++) {
        await popup.evaluate(() => {
          const enlarge = document.querySelector('.gadgets div.imagenote div.enlarge');
          if (enlarge) enlarge.click();
        });
        await delay(300);
      }
      await capture(popup, framesDir, n++);
    }

    // Frames 12-14: Fill-in-the-blank Quiz - all 3 items (v=13)
    // v=13: heading + 1 intro sentence + 3 quiz items
    // Quiz items are the last 3 fragments
    {
      const total = await getFragmentCount(popup, 13);
      console.log(`  Quiz slide: ${total} fragments, capturing last 3`);
      for (let i = 2; i >= 0; i--) {
        await goToFragment(popup, 13, total - 1 - i);
        await capture(popup, framesDir, n++);
      }
    }

    // Frames 14-16: MCQ Quiz (v=14)
    // Show all fragments so MCQ is visible, then interact
    {
      const total = await getFragmentCount(popup, 14);
      await goToFragment(popup, 14, total - 1);

      // Frame 14: MCQ initial state (question visible, no answer selected)
      await capture(popup, framesDir, n++);

      // Frame 15: Click wrong answer (first option with data-correct="false")
      await popup.evaluate(() => {
        document.querySelector('.mcq-option[data-correct="false"]').click();
      });
      await delay(500);
      await capture(popup, framesDir, n++);

      // Frame 16: Reset and click correct answer
      await popup.evaluate(() => {
        document.querySelector('.mcq-reset').click();
      });
      await delay(300);
      await popup.evaluate(() => {
        document.querySelector('.mcq-option[data-correct="true"]').click();
      });
      await delay(500);
      await capture(popup, framesDir, n++);
    }

    console.log(`  -> ${n - 1} GIF frames saved`);
    await popup.close();
    await parent.close();
  }

  await browser.close();
  console.log('Done!');
}

main().catch(err => { console.error(err); process.exit(1); });
