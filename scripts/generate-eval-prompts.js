#!/usr/bin/env node

/**
 * Generate eval-prompts.json from SKILL.md files.
 *
 * Reads every skill's SKILL.md frontmatter (name, description) and "When to Use"
 * section to produce 2-3 realistic user prompts per skill, plus expectedOutputPatterns.
 *
 * Usage:
 *   node scripts/generate-eval-prompts.js                # generate for all skills
 *   node scripts/generate-eval-prompts.js --slug foo     # generate for one skill only
 *   node scripts/generate-eval-prompts.js --merge        # merge new skills into existing file
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SKILLS_DIR = path.join(ROOT, 'skills');
const OUTPUT = path.join(ROOT, 'test', 'eval-prompts.json');
const CATEGORIES = ['capabilities', 'composites', 'playbooks'];

// ── CLI args ────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const slugFilter = args.find((a) => a.startsWith('--slug='))?.split('=')[1]
  || (args.indexOf('--slug') !== -1 ? args[args.indexOf('--slug') + 1] : null);
const mergeMode = args.includes('--merge');

// ── Frontmatter parser ──────────────────────────────────────────────────────

function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return { fm: {}, body: content };

  const yaml = match[1];
  const body = content.slice(match[0].length).trim();
  const fm = {};
  let currentKey = null;
  let currentValue = '';

  for (const line of yaml.split('\n')) {
    const kvMatch = line.match(/^(\w[\w-]*):\s*(.*)/);
    if (kvMatch) {
      if (currentKey) fm[currentKey] = currentValue.trim().replace(/^['"]|['"]$/g, '');
      currentKey = kvMatch[1];
      currentValue = kvMatch[2];
    } else if (currentKey) {
      currentValue += ' ' + line.trim();
    }
  }
  if (currentKey) fm[currentKey] = currentValue.trim().replace(/^['"]|['"]$/g, '');

  // Parse array values
  for (const [key, val] of Object.entries(fm)) {
    if (typeof val === 'string' && val.startsWith('[') && val.endsWith(']')) {
      fm[key] = val.slice(1, -1).split(',').map((s) => s.trim());
    }
  }

  return { fm, body };
}

// ── Extract "When to Use" triggers ──────────────────────────────────────────

function extractWhenToUse(body) {
  const triggers = [];

  // Look for "When to Use" or "## When to Use" section
  const whenMatch = body.match(/##?\s*When to Use\s*\n([\s\S]*?)(?=\n##|\n---|\n$)/i);
  if (whenMatch) {
    const lines = whenMatch[1].split('\n');
    for (const line of lines) {
      // Extract quoted trigger phrases: - "Find leads from..."
      const quoted = line.match(/["""]([^"""]+)["""]/);
      if (quoted) {
        triggers.push(quoted[1].trim());
      } else {
        // Extract bullet items: - Find leads from...
        const bullet = line.match(/^[\s]*[-*]\s+(.+)/);
        if (bullet && bullet[1].length > 10) {
          triggers.push(bullet[1].trim().replace(/^["'`]|["'`]$/g, ''));
        }
      }
    }
  }

  return triggers;
}

// ── Extract Quick Start examples ────────────────────────────────────────────

function extractExamples(body) {
  const examples = [];

  // Look for comments in code blocks that describe usage
  const commentMatches = body.matchAll(/^#\s+(.+)$/gm);
  for (const m of commentMatches) {
    const comment = m[1].trim();
    if (comment.length > 15 && comment.length < 120 && !comment.startsWith('!')) {
      examples.push(comment);
    }
  }

  return examples.slice(0, 5);
}

// ── Generate prompts for a skill ────────────────────────────────────────────

function generatePromptsForSkill(slug, category, fm, body) {
  const description = fm.description || '';
  const name = fm.name || slug;
  const triggers = extractWhenToUse(body);
  const examples = extractExamples(body);

  const prompts = [];

  // Use trigger phrases directly if we have them
  for (const trigger of triggers.slice(0, 2)) {
    prompts.push(trigger);
  }

  // Generate from description keywords
  if (prompts.length < 2 && description) {
    // Turn description into a user request
    const descPrompt = descriptionToPrompt(description, name, slug);
    if (descPrompt) prompts.push(descPrompt);
  }

  // Generate from code examples
  if (prompts.length < 3) {
    for (const ex of examples.slice(0, 3 - prompts.length)) {
      // Clean up code comments into natural requests
      const cleaned = ex
        .replace(/^#+\s*/, '')
        .replace(/\(.*?\)$/, '')
        .replace(/\s*[-—]\s*.*$/, '')
        .trim();
      if (cleaned.length > 10 && !prompts.includes(cleaned)) {
        prompts.push(cleaned);
      }
    }
  }

  // Fallback: generate from slug + description
  if (prompts.length < 2) {
    const fallback = slugToPrompt(slug, description);
    if (fallback && !prompts.includes(fallback)) prompts.push(fallback);
  }

  // Ensure at least 2 prompts
  if (prompts.length < 2) {
    prompts.push(`Run the ${name} skill`);
  }

  // Generate expected output patterns from description + name
  const patterns = generateOutputPatterns(slug, description, name, body);

  return {
    slug,
    category,
    prompts: prompts.slice(0, 3),
    expectedOutputPatterns: patterns,
  };
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function descriptionToPrompt(description, name, slug) {
  // Extract action-oriented phrases
  const desc = description.toLowerCase();

  // Common patterns to convert
  const patterns = [
    { match: /scrape\s+(\w+)/i, template: (m) => `Scrape ${m[1]} data for our company` },
    { match: /find\s+(\w+)/i, template: (m) => `Find ${m[1]} for our business` },
    { match: /track\s+(\w+)/i, template: (m) => `Track ${m[1]} mentions and activity` },
    { match: /monitor\s+(\w+)/i, template: (m) => `Monitor ${m[1]} for relevant updates` },
    { match: /analyz/i, template: () => `Analyze ${name.replace(/-/g, ' ')} data` },
    { match: /generat/i, template: () => `Generate ${name.replace(/-/g, ' ')}` },
    { match: /creat/i, template: () => `Create ${name.replace(/-/g, ' ')}` },
    { match: /build/i, template: () => `Build ${name.replace(/-/g, ' ')}` },
  ];

  for (const p of patterns) {
    const m = description.match(p.match);
    if (m) return p.template(m);
  }

  // Generic fallback from description
  const firstSentence = description.split(/[.!]/)[0].trim();
  if (firstSentence.length > 15 && firstSentence.length < 120) {
    return firstSentence;
  }

  return null;
}

function slugToPrompt(slug, description) {
  const words = slug.split('-').join(' ');
  return `Help me with ${words}`;
}

function generateOutputPatterns(slug, description, name, body) {
  const patterns = [];
  // Use slug as primary signal — it's the most specific identifier
  const slugLower = slug.toLowerCase();
  const desc = (description + ' ' + name).toLowerCase();

  // Domain-specific patterns — ordered by specificity (most specific first)
  // Slug-based matching takes priority over description-based
  const domainPatterns = [
    { keywords: ['twitter'], inSlug: true, patterns: ['tweet', 'post', 'author'] },
    { keywords: ['reddit'], inSlug: true, patterns: ['subreddit', 'post', 'comment'] },
    { keywords: ['linkedin'], inSlug: true, patterns: ['profile', 'linkedin', 'connection'] },
    { keywords: ['apollo'], inSlug: true, patterns: ['lead', 'contact', 'email'] },
    { keywords: ['hacker-news', 'hn'], inSlug: true, patterns: ['post', 'points', 'comment'] },
    { keywords: ['product-hunt'], inSlug: true, patterns: ['product', 'upvote', 'maker'] },
    { keywords: ['youtube'], inSlug: true, patterns: ['video', 'transcript', 'channel'] },
    { keywords: ['google-ad', 'meta-ad', 'ad-'], inSlug: true, patterns: ['ad', 'campaign', 'creative'] },
    { keywords: ['seo'], inSlug: true, patterns: ['keyword', 'ranking', 'traffic'] },
    { keywords: ['outreach', 'cold-email', 'email-draft'], inSlug: true, patterns: ['email', 'subject', 'sequence'] },
    { keywords: ['lead', 'prospecting', 'contact'], inSlug: true, patterns: ['lead', 'contact', 'company'] },
    { keywords: ['competitor', 'battlecard'], inSlug: true, patterns: ['competitor', 'analysis', 'market'] },
    { keywords: ['scraper', 'scrape'], inSlug: true, patterns: ['data', 'result', 'found'] },
    { keywords: ['content', 'blog', 'newsletter'], inSlug: true, patterns: ['content', 'article', 'post'] },
    { keywords: ['icp', 'persona'], inSlug: true, patterns: ['persona', 'profile', 'segment'] },
    { keywords: ['slide', 'deck', 'carousel'], inSlug: true, patterns: ['slide', 'html', 'presentation'] },
    { keywords: ['brand'], inSlug: true, patterns: ['brand', 'voice', 'tone'] },
    { keywords: ['review'], inSlug: true, patterns: ['review', 'rating', 'feedback'] },
    { keywords: ['signal', 'monitor'], inSlug: true, patterns: ['signal', 'alert', 'detected'] },
    { keywords: ['pipeline', 'workflow', 'playbook'], inSlug: true, patterns: ['step', 'pipeline', 'complete'] },
    // Fallback: description-based matching
    { keywords: ['ad', 'campaign'], inSlug: false, patterns: ['ad', 'campaign', 'creative'] },
    { keywords: ['lead', 'prospect'], inSlug: false, patterns: ['lead', 'contact', 'company'] },
    { keywords: ['email'], inSlug: false, patterns: ['email', 'subject', 'message'] },
  ];

  // First pass: match against slug (most specific)
  for (const dp of domainPatterns) {
    if (dp.inSlug && dp.keywords.some((kw) => slugLower.includes(kw))) {
      for (const p of dp.patterns) {
        if (!patterns.includes(p)) patterns.push(p);
      }
      break;
    }
  }

  // Second pass: if no slug match, try description
  if (patterns.length === 0) {
    for (const dp of domainPatterns) {
      if (dp.keywords.some((kw) => desc.includes(kw))) {
        for (const p of dp.patterns) {
          if (!patterns.includes(p)) patterns.push(p);
        }
        break;
      }
    }
  }

  // Ensure at least some patterns
  if (patterns.length === 0) {
    patterns.push('result', 'data');
  }

  return patterns.slice(0, 4);
}

// ── Main ────────────────────────────────────────────────────────────────────

function collectSkills() {
  const skills = [];

  for (const cat of CATEGORIES) {
    const catDir = path.join(SKILLS_DIR, cat);
    if (!fs.existsSync(catDir)) continue;

    const slugs = fs.readdirSync(catDir).filter((d) =>
      fs.statSync(path.join(catDir, d)).isDirectory()
    );

    for (const slug of slugs) {
      if (slugFilter && slug !== slugFilter) continue;

      const skillMd = path.join(catDir, slug, 'SKILL.md');
      if (!fs.existsSync(skillMd)) continue;

      const content = fs.readFileSync(skillMd, 'utf8');
      const { fm, body } = parseFrontmatter(content);

      skills.push(generatePromptsForSkill(slug, cat, fm, body));
    }
  }

  return skills.sort((a, b) => a.slug.localeCompare(b.slug));
}

const entries = collectSkills();

if (mergeMode && fs.existsSync(OUTPUT)) {
  // Merge: add new skills, keep existing entries unchanged
  const existing = JSON.parse(fs.readFileSync(OUTPUT, 'utf8'));
  const existingSlugs = new Set(existing.skills.map((s) => s.slug));

  let added = 0;
  for (const entry of entries) {
    if (!existingSlugs.has(entry.slug)) {
      existing.skills.push(entry);
      added++;
    }
  }
  existing.skills.sort((a, b) => a.slug.localeCompare(b.slug));

  fs.writeFileSync(OUTPUT, JSON.stringify(existing, null, 2) + '\n');
  console.log(`Merged: ${added} new skills added (${existing.skills.length} total).`);
} else {
  // Full generation
  const output = {
    description: 'Eval prompts for E2E skill testing. Generated by scripts/generate-eval-prompts.js, then hand-maintained.',
    version: '2.0.0',
    generated: new Date().toISOString().split('T')[0],
    skills: entries,
  };

  fs.writeFileSync(OUTPUT, JSON.stringify(output, null, 2) + '\n');
  console.log(`Generated ${OUTPUT} with ${entries.length} skills.`);
}
