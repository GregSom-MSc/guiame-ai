// Syncs one or more Notion pages into static HTML files on guiame.ai.
//
// Each configured page must be structured as nested Notion "toggle" blocks:
//   - Top level of the page  -> a "section" (gets its own photo band)
//   - A toggle with at least one toggle child -> a "subtitle" grouping,
//     rendering its nested toggles AND any of its own direct entries
//   - A toggle with no toggle children -> a "topic" (an accordion of
//     entries/prose)
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

const LIST_ITEM_TYPES = ["bulleted_list_item", "numbered_list_item"];

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

// Preserves bold/italic and embedded line breaks (Notion's shift+Enter is a
// literal "\n" inside a single rich-text run) instead of flattening
// everything to plain text — needed for poems/prose, not just plain labels.
function annotatedTextToHtml(richText) {
  return (richText || [])
    .map((rt) => {
      let text = escapeHtml(rt.plain_text).replace(/\n/g, "<br>\n");
      if (rt.annotations && rt.annotations.italic) text = `<em>${text}</em>`;
      if (rt.annotations && rt.annotations.bold) text = `<strong>${text}</strong>`;
      return text;
    })
    .join("");
}

// Notion has two kinds of "toggle": a plain Toggle list block (type
// "toggle"), and a Toggle heading (a heading_1/2/3 block with its toggle
// arrow turned on — same rich_text/children shape, but the API reports it
// as type "heading_1" etc. with is_toggleable: true). Treat both the same.
const HEADING_TYPES = ["heading_1", "heading_2", "heading_3"];

function isToggleLike(block) {
  if (block.type === "toggle") return true;
  if (HEADING_TYPES.includes(block.type)) {
    return Boolean(block[block.type].is_toggleable);
  }
  return false;
}

function getRichText(block) {
  return block[block.type] && block[block.type].rich_text;
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

// A single list item (bulleted/numbered) -> one entry card, linked if it
// carries a hyperlink annotation. Uses the rich-text array's own index to
// split label vs. link, rather than searching concatenated plain text, so
// a label that happens to repeat the link's display text elsewhere can't
// throw off where the label is cut.
function renderListEntry(block) {
  const richText = getRichText(block);
  if (!richText || richText.length === 0) return null;

  const linkIdx = richText.findIndex((rt) => rt.href);
  const linkSeg = linkIdx !== -1 ? richText[linkIdx] : null;
  const labelRuns = linkSeg ? richText.slice(0, linkIdx) : richText;

  let labelHtml = annotatedTextToHtml(labelRuns).replace(/[:\s]+$/, "").trim();
  if (!labelHtml) labelHtml = annotatedTextToHtml(richText).trim();
  if (!labelHtml) return null;

  if (linkSeg) {
    return `                <a
                  href="${escapeHtml(linkSeg.href)}"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="entry-item"
                  aria-label="Ver enlace"
                >
                  <div class="entry-item-text">
                    <strong>${labelHtml}</strong>
                    <p>${escapeHtml(linkSeg.href)}</p>
                  </div>
                  <span class="entry-item-link" aria-hidden="true">↗</span>
                </a>`;
  }
  return `                <div class="entry-item">
                  <div class="entry-item-text">
                    <strong>${labelHtml}</strong>
                  </div>
                </div>`;
}

// Consecutive plain "paragraph" blocks (a poem, a story) are joined into
// ONE flowing card instead of one fragmented card per line — an empty
// paragraph (Notion's own way of marking a blank line between stanzas)
// naturally becomes a blank line here too, and each block's own embedded
// "\n" runs are preserved via annotatedTextToHtml above.
function renderProseGroup(paragraphBlocks) {
  const html = paragraphBlocks
    .map((b) => annotatedTextToHtml(getRichText(b)))
    .join("<br>\n");
  return `                <div class="entry-item">
                  <div class="entry-item-text">
                    <p class="entry-item-prose">${html}</p>
                  </div>
                </div>`;
}

// A plain "paragraph" block is Notion's default for *both* a poem line
// AND a plain "Name: description" venue line typed without ever turning
// on the bullet-list formatting — the block type alone can't tell them
// apart. Content can: a real link, or a colon early in the line (the
// "Name: description" shape every venue/list line follows), means it's
// its own standalone entry; anything else is treated as flowing prose to
// be grouped with its neighbors (a poem's verses).
function looksLikeListEntry(richText) {
  if (!richText || richText.length === 0) return false;
  if (richText.some((rt) => rt.href)) return true;
  const text = plainText(richText);
  const colonIdx = text.indexOf(":");
  return colonIdx !== -1 && colonIdx < 60 && colonIdx < text.length - 1;
}

// Renders a mixed list of children in order — nested toggles, list-item
// entries, and prose paragraphs can all sit side by side (e.g. "Shopping"
// holding both sub-category toggles AND one direct link), which is why
// this isn't a strict "is this toggle a pure group or a pure leaf" check.
function renderChildren(children, slugify) {
  const parts = [];
  let proseBuffer = [];

  function flushProse() {
    if (proseBuffer.length > 0) {
      parts.push(renderProseGroup(proseBuffer));
      proseBuffer = [];
    }
  }

  for (const child of children) {
    if (isToggleLike(child)) {
      flushProse();
      parts.push(renderToggleNode(child, slugify));
    } else if (LIST_ITEM_TYPES.includes(child.type)) {
      flushProse();
      const rendered = renderListEntry(child);
      if (rendered) parts.push(rendered);
    } else if (child.type === "paragraph") {
      if (looksLikeListEntry(getRichText(child))) {
        flushProse();
        const rendered = renderListEntry(child);
        if (rendered) parts.push(rendered);
      } else {
        proseBuffer.push(child);
      }
    }
    // Other block types (dividers, images, etc.) are skipped for now.
  }
  flushProse();
  return parts;
}

function renderToggleNode(block, slugify) {
  const title = plainText(getRichText(block)).trim() || "Sin título";
  const children = block._children || [];
  const isGroup = children.some(isToggleLike);
  const innerParts = renderChildren(children, slugify);

  if (isGroup) {
    return `          <details class="subtitle-toggle">
            <summary>${escapeHtml(title)}</summary>
            <div class="subtitle-toggle-body">
${innerParts.join("\n")}
            </div>
          </details>`;
  }

  const slug = slugify(title);
  return `          <details class="topic-accordion" id="${slug}">
            <summary>${escapeHtml(title)}</summary>
            <div class="topic-accordion-body">
              <div class="entry-list">
${innerParts.join("\n")}
              </div>
            </div>
          </details>`;
}

function renderSection(block, slugify) {
  const title = plainText(getRichText(block)).trim() || "Sin título";
  const photo = SECTION_PHOTOS[title] || DEFAULT_SECTION_PHOTO;
  const children = block._children || [];
  const innerHtml = renderChildren(children, slugify).join("\n\n");

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

function renderDivider() {
  return `      <div
        class="section-divider-photo"
        style="background-image: url('${DIVIDER_PHOTO}')"
      ></div>`;
}

async function buildContentHtml(pageId) {
  const topBlocks = await fetchChildren(pageId);
  const sections = topBlocks.filter(isToggleLike);
  if (sections.length === 0) {
    // Diagnostic only — block types/flags, never rich_text content.
    const seenTypes = topBlocks
      .map((b) =>
        HEADING_TYPES.includes(b.type)
          ? `${b.type}(is_toggleable=${Boolean(b[b.type].is_toggleable)})`
          : b.type
      )
      .join(", ");
    throw new Error(
      `No top-level toggle-like blocks found. Top-level block types seen: [${seenTypes}]`
    );
  }

  const slugify = makeSlugger();
  const sectionHtmlParts = sections.map((s) => renderSection(s, slugify));

  const withDividers = [];
  sectionHtmlParts.forEach((html, i) => {
    withDividers.push(html);
    if (i < sectionHtmlParts.length - 1) withDividers.push(renderDivider());
  });

  return withDividers.join("\n\n");
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
