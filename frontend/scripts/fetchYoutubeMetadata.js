const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

function extractVideoId(input) {
  if (!input) return null;
  const match = input.match(/(?:v=|youtu\.be\/|shorts\/)([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : null;
}

function pickThumbnail(details, microformat) {
  const thumbnails = details?.thumbnail?.thumbnails || microformat?.thumbnail?.thumbnails || [];
  return thumbnails.length ? thumbnails[thumbnails.length - 1].url : "";
}

function getPlayerResponse(html) {
  const match = html.match(/ytInitialPlayerResponse\s*=\s*({.*?});/s);
  if (!match || !match[1]) {
    throw new Error("Unable to find ytInitialPlayerResponse in the page HTML.");
  }
  return JSON.parse(match[1]);
}

async function fetchPlayerData(videoId) {
  const watchUrl = `https://www.youtube.com/watch?v=${videoId}`;
  const response = await fetch(watchUrl, {
    headers: {
      "Accept-Language": "en",
      "User-Agent": "Mozilla/5.0 (compatible; MypeptideBot/1.0)"
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${watchUrl}: ${response.status} ${response.statusText}`);
  }

  const html = await response.text();
  return getPlayerResponse(html);
}

function toVideoRecord(playerResponse, sortOrder) {
  const details = playerResponse?.videoDetails || {};
  const microformat = playerResponse?.microformat?.playerMicroformatRenderer || {};
  const now = new Date().toISOString();

  const videoId = details.videoId || microformat.externalVideoId;
  const title = details.title || microformat.title?.simpleText || "Untitled";
  const description = (details.shortDescription || microformat.description?.simpleText || "").trim();
  const durationSeconds = Number(details.lengthSeconds || microformat.lengthSeconds || 0);
  const thumbnailUrl = pickThumbnail(details, microformat);

  return {
    id: crypto.randomUUID(),
    title,
    description,
    videoId,
    platform: "youtube",
    thumbnailUrl,
    durationSeconds,
    category: "general",
    peptideId: null,
    sortOrder,
    isActive: true,
    createdAt: now,
    updatedAt: now,
    peptide_id: null,
    peptide: null,
    embedUrl: `https://www.youtube.com/embed/${videoId}`,
    customThumbnail: thumbnailUrl
  };
}

async function main() {
  const args = process.argv.slice(2).filter((arg) => !arg.startsWith("--"));
  const shouldWrite = process.argv.includes("--write");

  if (!args.length) {
    console.log("Usage: node scripts/fetchYoutubeMetadata.js <youtube-url> [more-urls...] [--write]");
    process.exit(1);
  }

  const dataPath = path.join(__dirname, "../src/lib/videosData.json");
  const existing = JSON.parse(fs.readFileSync(dataPath, "utf8"));
  const baseSort = existing.reduce((max, item) => Math.max(max, item.sortOrder || 0), 0);

  const results = [];
  for (const [index, url] of args.entries()) {
    const videoId = extractVideoId(url);
    if (!videoId) {
      throw new Error(`Cannot extract video id from: ${url}`);
    }

    const playerData = await fetchPlayerData(videoId);
    const record = toVideoRecord(playerData, baseSort + index + 1);
    results.push(record);
  }

  if (shouldWrite) {
    const updated = [...existing, ...results];
    fs.writeFileSync(dataPath, JSON.stringify(updated, null, 2));
    console.log(`Appended ${results.length} video(s) to videosData.json`);
  } else {
    console.log(JSON.stringify(results, null, 2));
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
