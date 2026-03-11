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
    return { parent: page, popup };
  }

  // Navigate to a specific vertical slide and show some fragments
  async function goToSlide(popup, vSlide, fragments = 2) {
    await popup.evaluate((v) => { Reveal.slide(0, v); }, vSlide);
    await delay(500);
    for (let f = 0; f < fragments; f++) {
      await popup.keyboard.press('j');
      await delay(150);
    }
    await delay(300);
  }

  // --- 1. Paragraph highlighting (slide v=1, sentence 3) ---
  console.log('Capturing: paragraph highlighting...');
  {
    const { parent, popup } = await openPresentation();
    await goToSlide(popup, 1, 3);
    await popup.screenshot({ path: path.join(IMG_DIR, 'linguistics.gif') });
    console.log('  -> linguistics.gif saved');
    await popup.close();
    await parent.close();
  }

  // --- 2. MCQ Quiz (slide v=14) ---
  console.log('Capturing: MCQ quiz...');
  {
    const { parent, popup } = await openPresentation();
    await goToSlide(popup, 14, 2);
    const info = await popup.evaluate(() => Reveal.getIndices());
    console.log('  Indices:', JSON.stringify(info));
    await popup.screenshot({ path: path.join(IMG_DIR, 'quiz.gif') });
    console.log('  -> quiz.gif saved');
    await popup.close();
    await parent.close();
  }

  // --- 3. Table (slide v=8) ---
  console.log('Capturing: table...');
  {
    const { parent, popup } = await openPresentation();
    await goToSlide(popup, 8, 2);
    const info = await popup.evaluate(() => Reveal.getIndices());
    console.log('  Indices:', JSON.stringify(info));
    await popup.screenshot({ path: path.join(IMG_DIR, 'speech.gif') });
    console.log('  -> speech.gif saved');
    await popup.close();
    await parent.close();
  }

  // --- 4. GIF frames (first & last sentence of each slide) ---
  console.log('Capturing: GIF frames...');
  {
    const { parent, popup } = await openPresentation();
    const framesDir = path.join(IMG_DIR, 'screenshots');
    let n = 1;

    // Frame 1: Title slide
    await popup.screenshot({ path: path.join(framesDir, `frame-0${n++}.png`) });

    // Frame 2: Paragraph - first sentence (slide 1)
    await goToSlide(popup, 1, 1);
    await popup.screenshot({ path: path.join(framesDir, `frame-0${n++}.png`) });

    // Frame 3: Paragraph - last sentence (sentence 4)
    await popup.keyboard.press('j');
    await delay(150);
    await popup.keyboard.press('j');
    await delay(150);
    await popup.keyboard.press('j');
    await delay(300);
    await popup.screenshot({ path: path.join(framesDir, `frame-0${n++}.png`) });

    // Frame 4: List - first item (slide 5)
    await goToSlide(popup, 5, 4);
    await popup.screenshot({ path: path.join(framesDir, `frame-0${n++}.png`) });

    // Frame 5: List - last item
    await popup.keyboard.press('j');
    await delay(150);
    await popup.keyboard.press('j');
    await delay(300);
    await popup.screenshot({ path: path.join(framesDir, `frame-0${n++}.png`) });

    // Frame 6: Table (slide 8)
    await goToSlide(popup, 8, 2);
    await popup.screenshot({ path: path.join(framesDir, `frame-0${n++}.png`) });

    // Frame 7: MCQ quiz (slide 14)
    await goToSlide(popup, 14, 2);
    await popup.screenshot({ path: path.join(framesDir, `frame-0${n++}.png`) });

    console.log(`  -> ${n - 1} GIF frames saved`);
    await popup.close();
    await parent.close();
  }

  await browser.close();
  console.log('Done!');
}

main().catch(err => { console.error(err); process.exit(1); });
