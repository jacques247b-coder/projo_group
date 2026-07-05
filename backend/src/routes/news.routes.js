// PROJO GROUP — News RSS Proxy
// Fetches RSS feeds server-side to avoid CORS issues
const express = require("express");
const router = express.Router();

// GET /api/news?url=<rss_url>
router.get("/", async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: "url required" });

  // Whitelist allowed news domains
  const allowed = [
    "feeds.news24.com", "feeds.bbci.co.uk", "ewn.co.za",
    "www.timeslive.co.za", "www.dailymaverick.co.za",
    "www.iol.co.za", "www.netwerk24.com", "www.sowetanlive.co.za",
  ];
  const domain = new URL(url).hostname;
  if (!allowed.some(d => domain.includes(d))) {
    return res.status(403).json({ error: "Domain not allowed" });
  }

  try {
    const fetch = (...args) => import('node-fetch').then(({default: f}) => f(...args));
    const response = await fetch(url, {
      headers: { "User-Agent": "PROJO-GROUP-RSS/1.0", "Accept": "application/rss+xml, application/xml, text/xml" },
      timeout: 8000,
    });
    const xml = await response.text();

    // Parse XML to JSON manually (simple regex approach - no extra packages)
    const items = [];
    const itemMatches = xml.match(/<item>([\s\S]*?)<\/item>/g) || [];

    for (const item of itemMatches.slice(0, 10)) {
      const get = (tag) => {
        const m = item.match(new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]></${tag}>|<${tag}[^>]*>([^<]*)</${tag}>`));
        return m ? (m[1] || m[2] || "").trim() : "";
      };
      const getMedia = () => {
        const m = item.match(/media:content[^>]*url="([^"]+)"|enclosure[^>]*url="([^"]+)"|<media:thumbnail[^>]*url="([^"]+)"/);
        return m ? (m[1] || m[2] || m[3] || "") : "";
      };

      items.push({
        title: get("title"),
        link: get("link") || item.match(/<link>([^<]+)<\/link>/)?.[1] || "",
        description: get("description").replace(/<[^>]+>/g, "").slice(0, 200),
        pubDate: get("pubDate"),
        thumbnail: getMedia(),
      });
    }

    res.json({ items, count: items.length });
  } catch (err) {
    res.status(500).json({ error: "Could not fetch feed: " + err.message });
  }
});

module.exports = router;
