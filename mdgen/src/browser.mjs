import puppeteer from "puppeteer";

export function browserLaunchOptions() {
  const args = [
    "--no-sandbox",
    "--disable-setuid-sandbox",
    "--disable-dev-shm-usage"
  ];

  if (process.platform === "linux") {
    args.push(
      "--disable-gpu",
      "--disable-software-rasterizer",
      "--disable-crash-reporter",
      "--disable-crashpad",
      "--disable-breakpad",
      "--disable-extensions",
      "--disable-hang-monitor",
      "--disable-popup-blocking",
      "--disable-prompt-on-repost",
      "--disable-renderer-backgrounding",
      "--disable-sync",
      "--metrics-recording-only",
      "--mute-audio",
      "--no-default-browser-check",
      "--no-first-run",
      "--no-zygote",
      "--password-store=basic",
      "--use-mock-keychain",
      "--disable-features=Translate,BackForwardCache,MediaRouter,OptimizationHints"
    );
  }

  const launchOptions = {
    headless: process.platform === "linux" ? "shell" : true,
    protocolTimeout: 60000,
    args
  };

  if (process.env.PUPPETEER_EXECUTABLE_PATH) {
    launchOptions.executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
  }

  return launchOptions;
}

export function launchBrowser() {
  return puppeteer.launch(browserLaunchOptions());
}

export async function smokeTestBrowser() {
  if (process.platform !== "linux") {
    console.log("Chromium smoke test skipped outside Linux.");
    return;
  }

  const browser = await launchBrowser();

  try {
    const page = await browser.newPage();
    await page.setContent("<!doctype html><title>mdgen chromium smoke</title><p>ok</p>");
    await page.close();
  } finally {
    await browser.close();
  }

  console.log("Chromium smoke test passed.");
}
