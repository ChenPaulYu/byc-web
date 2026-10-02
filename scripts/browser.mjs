/** Shared muted browser launch for local regression probes. */
import { chromium } from 'playwright';

export const launchBrowser = () => chromium.launch({
  executablePath: process.env.CHROME_PATH,
  args: ['--mute-audio'],
});
