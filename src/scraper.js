const puppeteer = require("puppeteer");

const fetchHomePage = async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto("https://www.dailymotion.com/us", {
    waitUntil: "networkidle0", // Wait for all non-lazy loaded images to load
  });
  const hrefs = await page.evaluate(async () => {
    async function timeout(ms) {
      return new Promise((resolve) => setTimeout(resolve, ms));
    }

    let windowHeight = window.innerHeight;
    let pageHeight = document.body.scrollHeight;
    for (let i = 1; i * windowHeight < pageHeight; i++) {
      window.scrollTo(0, i * windowHeight);
      await timeout(1000);
    }
    await timeout(5000);
    return Array.from(
      document.getElementsByClassName("VideoCard__videoImageWrapper___3NbLa"),
      (el) => {
        let link = el.getElementsByTagName("a")[0]?.href;
        let poster = el.getElementsByTagName("img")[0]?.src;
        let name = el.getElementsByTagName("img")[0]?.alt;
        if (link && poster && name)
          return {
            images: {
              poster,
            },
            name,
            link,
          };
      }
    );
  });
  await browser.close();
  return hrefs;
};

const fetchVideo = async (videoUrl) => {
  async function timeout(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  const browser = await puppeteer.launch({
    executablePath:
      "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  });
  const page = await browser.newPage();
  await page.goto(videoUrl, {
    waitUntil: "networkidle0", // Wait for all non-lazy loaded images to load
  });
  await page.setRequestInterception(true);
  let urls = [];

  page.on("request", (interceptedRequest) => {
    if (
      interceptedRequest.url().includes(".m3u8") &&
      interceptedRequest.url().includes("https://proxy")
    ) {
      interceptedRequest.continue();
      console.log(interceptedRequest.url(), "<-- url");
      urls.push(interceptedRequest.url());
    } else {
      interceptedRequest.abort();
    }
  });
  // waiting for ads finish
  await timeout(17000);
  await browser.close();
  return urls.find((item) => item.includes("hq"))
    ? urls.find((item) => item.includes("hq"))
    : urls[0];
};

module.exports = {
  fetchHomePage,
  fetchVideo,
};
