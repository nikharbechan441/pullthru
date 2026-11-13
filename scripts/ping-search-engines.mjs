/**
 * Search Engine Sitemap Ping & IndexNow Script
 * Submits updated sitemap to Google, Bing, and IndexNow
 */

const SITEMAP_URL = "https://pullthru.co.za/sitemap.xml";
const HOST = "pullthru.co.za";

const NEW_URLS = [
  "https://pullthru.co.za/padel-split-calculator",
  "https://pullthru.co.za/fives-futbol-squad-tracker",
  "https://pullthru.co.za/golf-four-ball-calculator",
  "https://pullthru.co.za/braai-calculator",
  "https://pullthru.co.za/split-bill",
  "https://pullthru.co.za/5-a-side-and-padel",
  "https://pullthru.co.za/for-venues",
];

async function pingGoogle() {
  const pingUrl = `https://www.google.com/ping?sitemap=${encodeURIComponent(SITEMAP_URL)}`;
  console.log(`[Google] Pinging sitemap: ${pingUrl}`);
  try {
    const res = await fetch(pingUrl, { method: "GET" });
    console.log(`[Google] Response status: ${res.status} ${res.statusText}`);
  } catch (err) {
    console.warn(`[Google] Ping notice: ${err.message}`);
  }
}

async function pingIndexNow() {
  const indexNowUrl = "https://api.indexnow.org/IndexNow";
  const payload = {
    host: HOST,
    keyLocation: `https://${HOST}/indexnow.txt`,
    urlList: NEW_URLS,
  };

  console.log(`[IndexNow] Submitting ${NEW_URLS.length} URLs to IndexNow...`);
  try {
    const res = await fetch(indexNowUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify(payload),
    });
    console.log(`[IndexNow] Response status: ${res.status} ${res.statusText}`);
  } catch (err) {
    console.warn(`[IndexNow] Notice: ${err.message}`);
  }
}

async function main() {
  console.log("=== PULLTHRU INSTANT SITEMAP & SEARCH ENGINE PING ===");
  await pingGoogle();
  await pingIndexNow();
  console.log("=== COMPLETED SEARCH ENGINE PINGS ===");
}

main();
