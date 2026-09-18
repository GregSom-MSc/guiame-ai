// Syncs one or more Notion pages into static HTML files on guiame.ai.
//
// Each configured page must be structured as nested Notion "toggle" blocks:
//   - Top level of the page  -> a "section" (gets its own photo band)
//   - A toggle whose children are ALL toggles -> a "subtitle" grouping
//   - A toggle whose children are anything else -> a "topic" (an accordion
//     of entries, shown in the pill nav)
// This is derived purely from the block structure, not a hardcoded list of
// titles, so adding/renaming/moving a toggle in Notion needs no code change.
//
// Never logs or writes NOTION_TOKEN anywhere.

const fs = require("fs");
const path = require("path");
const { Client } = require("@notionhq/client");

const NOTION_TOKEN = process.env.NOTION_TOKEN;
if (!NOTION_TOKEN) {
  console.error("NOTION_TOKEN env var is required (never print its value).");
  process.exit(1);
}

const notion = new Client({ auth: NOTION_TOKEN });

// Add a new page to sync here: { notionPageId, outputFile }.
const PAGES = [
  {
    notionPageId: "1ea6f90a-2be0-8080-941e-f3e33aeec6ea",
    outputFile: "guiaedin.html",
  },
];

// Falls back to a default photo if a section title isn't in this map, so a
// brand-new top-level toggle in Notion still renders instead of erroring.
const SECTION_PHOTOS = {
  "📋 Prácticos para tu viaje": "assets/img/victoriastreetmain.jpg",
  "✨ Frases y curiosidades! 🖋🎵👻": "assets/img/greyfriarstombs.jpg",
};
const DEFAULT_SECTION_PHOTO = "assets/img/CastleView.jpg";
const DIVIDER_PHOTO = "assets/img/caltonhillpan.jpg";

const START_MARKER = "<!-- NOTION:CONTENT:START";
const END_MARKER = "<!-- NOTION:CONTENT:END -->";

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function plainText(richText) {
  return (richText || []).map((rt) => rt.plain_text).join("");
}

async function fetchChildren(blockId) {
  const blocks = [];
  let cursor;
  do {
    const res = await notion.blocks.children.list({
      block_id: blockId,
      start_cursor: cursor,
      page_size: 100,
    });
    blocks.push(...res.results);
    cursor = res.has_more ? res.next_cursor : undefined;
  } while (cursor);

  for (const block of blocks) {
    if (block.has_children) {
      block._children = await fetchChildren(block.id);
    }
  }
  return blocks;
}

function makeSlugger() {
  const used = new Set();
  return function slugify(text) {
    let base = text
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "") // strip accents after NFD decomposition
      .replace(/[^\p{L}\p{N}\s-]/gu, "") // strip emoji/punctuation
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-");
    if (!base) base = "topic";
    let slug = base;
    let i = 2;
    while (used.has(slug)) slug = `${base}-${i++}`;
    used.add(slug);
    return slug;
  };
}

function renderEntry(block) {
  const richText = block[block.type] && block[block.type].rich_text;
  if (!richText || richText.length === 0) return null;

  const linkSeg = richText.find((rt) => rt.href);
  const fullText = plainText(richText);
  let label = fullText;
  if (linkSeg) {
    const idx = fullText.lastIndexOf(linkSeg.plain_text);
    if (idx !== -1) label = fullText.slice(0, idx);
  }
  label = label.replace(/[:\s]+$/, "").trim();
  if (!label) label = fullText.trim();
  if (!label) return null;

  if (linkSeg) {
    return `                <li>
                  <a
                    href="${escapeHtml(linkSeg.href)}"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="entry-item"
                    aria-label="Ver enlace"
                  >
                    <div class="entry-item-text">
                      <strong>${escapeHtml(label)}</strong>
                      <p>${escapeHtml(linkSeg.href)}</p>
                    </div>
                    <span class="entry-item-link" aria-hidden="true">↗</span>
                  </a>
                </li>`;
  }
  return `                <li class="entry-item">
                  <div class="entry-item-text">
                    <strong>${escapeHtml(label)}</strong>
                  </div>
                </li>`;
}

function renderToggleNode(block, slugify, pillNavEntries) {
  const title = plainText(block.toggle.rich_text).trim() || "Sin título";
  const children = block._children || [];
  const childToggles = children.filter((c) => c.type === "toggle");
  const isGroup = children.length > 0 && childToggles.length === children.length;

  if (isGroup) {
    const inner = children
      .map((c) => renderToggleNode(c, slugify, pillNavEntries))
      .join("\n");
    return `          <details class="subtitle-toggle">
            <summary>${escapeHtml(title)}</summary>
            <div class="subtitle-toggle-body">
${inner}
            </div>
          </details>`;
  }

  const slug = slugify(title);
  pillNavEntries.push({ slug, title });
  const entriesHtml = children
    .map(renderEntry)
    .filter(Boolean)
    .join("\n");

  return `          <details class="topic-accordion" id="${slug}">
            <summary>${escapeHtml(title)}</summary>
            <div class="topic-accordion-body">
              <ul class="entry-list">
${entriesHtml}
              </ul>
            </div>
          </details>`;
}

function renderSection(block, slugify, pillNavEntries) {
  const title = plainText(block.toggle.rich_text).trim() || "Sin título";
  const photo = SECTION_PHOTOS[title] || DEFAULT_SECTION_PHOTO;
  const children = block._children || [];
  const innerHtml = children
    .map((c) => (c.type === "toggle" ? renderToggleNode(c, slugify, pillNavEntries) : ""))
    .filter(Boolean)
    .join("\n\n");

  return `      <details class="section-toggle">
        <summary>${escapeHtml(title)}</summary>
        <section
          class="section-band"
          style="background-image: url(&quot;${photo}&quot;);"
        >
          <div class="section-band-content">
            <h2>${escapeHtml(title)}</h2>
            <p>1️⃣ Elige un tema — 2️⃣ Pica para desplegar</p>
          </div>
        </section>

        <section class="examples">
          <div class="container" style="max-width: 820px">
${innerHtml}
          </div>
        </section>
      </details>`;
}

function renderPillNav(entries) {
  const links = entries
    .map((e) => `          <a href="#${e.slug}">${escapeHtml(e.title)}</a>`)
    .join("\n");
  return `      <div class="pill-nav-wrap">
        <nav class="pill-nav" aria-label="Ir directo a un tema">
${links}
        </nav>
      </div>`;
}

function renderDivider() {
  return `      <div
        class="section-divider-photo"
        style="background-image: url('${DIVIDER_PHOTO}')"
      ></div>`;
}

async function buildContentHtml(pageId) {
  const topBlocks = await fetchChildren(pageId);
  const sections = topBlocks.filter((b) => b.type === "toggle");
  if (sections.length === 0) {
    throw new Error("No top-level toggle blocks found on the Notion page.");
  }

  const slugify = makeSlugger();
  const pillNavEntries = [];
  const sectionHtmlParts = sections.map((s) =>
    renderSection(s, slugify, pillNavEntries)
  );

  const withDividers = [];
  sectionHtmlParts.forEach((html, i) => {
    withDividers.push(html);
    if (i < sectionHtmlParts.length - 1) withDividers.push(renderDivider());
  });

  return `${renderPillNav(pillNavEntries)}\n\n${withDividers.join("\n\n")}`;
}

function writeContentIntoFile(filePath, contentHtml) {
  const existing = fs.readFileSync(filePath, "utf8");

  const startIdx = existing.indexOf(START_MARKER);
  if (startIdx === -1) {
    throw new Error(`${START_MARKER} not found in ${filePath}`);
  }
  const startCommentClose = existing.indexOf("-->", startIdx);
  if (startCommentClose === -1) {
    throw new Error(`Unterminated start marker comment in ${filePath}`);
  }
  const contentStart = startCommentClose + 3;

  const contentEnd = existing.indexOf(END_MARKER, contentStart);
  if (contentEnd === -1) {
    throw new Error(`${END_MARKER} not found in ${filePath}`);
  }

  const before = existing.slice(0, contentStart);
  const after = existing.slice(contentEnd);
  const updated = `${before}\n\n${contentHtml}\n\n      ${after}`;
  fs.writeFileSync(filePath, updated, "utf8");
}

async function main() {
  for (const { notionPageId, outputFile } of PAGES) {
    console.log(`Syncing ${outputFile} from Notion page ${notionPageId}...`);
    const contentHtml = await buildContentHtml(notionPageId);
    const filePath = path.join(__dirname, "..", outputFile);
    writeContentIntoFile(filePath, contentHtml);
    console.log(`Wrote ${outputFile}.`);
  }
}

main().catch((err) => {
  console.error("Sync failed:", err.message);
  process.exit(1);
});
