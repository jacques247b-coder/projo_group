// PROJO GROUP — News RSS Proxy
// Uses built-in https module - no external dependencies
const express = require("express");
const router = express.Router();
const https = require("https");
const http = require("http");

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith("https") ? https : http;
    const req = client.get(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 PROJO-RSS/1.0",
        "Accept": "application/rss+xml, application/xml, text/xml, */*",
      }
    }, (res) => {
      // Handle redirects
      if (res.statusCode === 301 || res.statusCode === 302) {
        return fetchUrl(res.headers.location).then(resolve).catch(reject);
      }
      let data = "";
      res.on("data", chunk => data += chunk);
      res.on("end", () => resolve(data));
    });
    req.on("error", reject);
    req.setTimeout(8000, () => { req.destroy(); reject(new Error("Timeout")); });
  });
}

function parseRSS(xml) {
  const items = [];
  const itemMatches = xml.match(/<item[\s\S]*?<\/item>/g) || [];
  for (const item of itemMatches.slice(0, 10)) {
    const get = (tag) => {
      const patterns = [
        new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\/${tag}>`),
        new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\/${tag}>`),
      ];
      for (const p of patterns) {
        const m = item.match(p);
        if (m && m[1]?.trim()) return m[1].trim();
      }
      return "";
    };
    const getLink = () => {
      const m = item.match(/<link>([^<]+)<\/link>/) ||
                item.match(/<link[^>]*href="([^"]+)"/) ||
                item.match(/<guid[^>]*>([^<]+)<\/guid>/);
      return m ? m[1].trim() : "";
    };
    const getThumb = () => {
      const m = item.match(/media:content[^>]*url="([^"]+)"/) ||
                item.match(/media:thumbnail[^>]*url="([^"]+)"/) ||
                item.match(/enclosure[^>]*url="([^"]+)"[^>]*type="image/);
      return m ? m[1] : "";
    };
    const desc = get("description").replace(/<[^>]+>/g, "").replace(/&nbsp;/g," ").replace(/&amp;/g,"&").replace(/&lt;/g,"<").replace(/&gt;/g,">").trim().slice(0, 180);
    items.push({
      title: get("title"),
      link: getLink(),
      description: desc,
      pubDate: get("pubDate"),
      thumbnail: getThumb(),
    });
  }
  return items.filter(i => i.title && i.link);
}

// Whitelisted RSS feeds with direct URLs
const FEEDS = {
  "news24":        "https://feeds.news24.com/articles/news24/TopStories/rss",
  "timeslive":     "https://www.timeslive.co.za/rss/",
  "dailymaverick": "https://www.dailymaverick.co.za/feed/",
  "ewn":           "https://ewn.co.za/Feed/News",
  "bbcworld":      "https://feeds.bbci.co.uk/news/world/rss.xml",
  "bbcsport":      "https://feeds.bbci.co.uk/sport/rss.xml",
  "iol":           "https://www.iol.co.za/rss",
  "netwerk24":     "https://www.netwerk24.com/rss",
};

// GET /api/news/:feed
router.get("/:feed", async (req, res) => {
  const feedUrl = FEEDS[req.params.feed];
  if (!feedUrl) return res.status(404).json({ error: "Feed not found", available: Object.keys(FEEDS) });
  try {
    const xml = await fetchUrl(feedUrl);
    const items = parseRSS(xml);
    res.json({ items, count: items.length, source: req.params.feed });
  } catch (err) {
    console.error(`[PROJO News] ${req.params.feed}:`, err.message);
    res.status(500).json({ error: err.message, items: [] });
  }
});

module.exports = router;
