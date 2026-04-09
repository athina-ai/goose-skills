#!/usr/bin/env node

/**
 * Skill E2E Eval Runner — spawns `claude --print` for each skill prompt
 * and captures the full execution trace via --output-format stream-json.
 *
 * Usage:
 *   node test/run-eval.js                              # run all skills sequentially
 *   node test/run-eval.js --slug twitter-mention-tracker # run one skill
 *   node test/run-eval.js --category capabilities       # run a category
 *   node test/run-eval.js --parallel 3                  # run N concurrent
 *   node test/run-eval.js --resume 2026-04-05-1430      # resume a partial run
 *   node test/run-eval.js --budget 0.50                 # per-skill budget (default $1)
 *   node test/run-eval.js --dry-run                     # list what would run, don't execute
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const PROMPTS_PATH = path.join(__dirname, 'eval-prompts.json');
const RESULTS_DIR = path.join(__dirname, 'results');

// ── CLI args ────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);

function getArg(name) {
  const eq = args.find((a) => a.startsWith(`--${name}=`));
  if (eq) return eq.split('=')[1];
  const idx = args.indexOf(`--${name}`);
  if (idx !== -1 && args[idx + 1] && !args[idx + 1].startsWith('--')) return args[idx + 1];
  return null;
}

const slugFilter = getArg('slug');
const categoryFilter = getArg('category');
const parallel = parseInt(getArg('parallel') || '1', 10);
const resumeRunId = getArg('resume');
const budget = getArg('budget') || '1.00';
const dryRun = args.includes('--dry-run');

// ── Load prompts ────────────────────────────────────────────────────────────

if (!fs.existsSync(PROMPTS_PATH)) {
  console.error('Error: test/eval-prompts.json not found. Run: node scripts/generate-eval-prompts.js');
  process.exit(1);
}

const evalData = JSON.parse(fs.readFileSync(PROMPTS_PATH, 'utf8'));
let skills = evalData.skills || [];

// Apply filters
if (slugFilter) {
  skills = skills.filter((s) => s.slug === slugFilter);
  if (skills.length === 0) {
    console.error(`No skill found with slug: ${slugFilter}`);
    process.exit(1);
  }
}
if (categoryFilter) {
  skills = skills.filter((s) => s.category === categoryFilter);
  if (skills.length === 0) {
    console.error(`No skills found in category: ${categoryFilter}`);
    process.exit(1);
  }
}

// ── Run ID and output dir ───────────────────────────────────────────────────

function makeRunId() {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}`;
}

const runId = resumeRunId || makeRunId();
const runDir = path.join(RESULTS_DIR, runId);

if (!fs.existsSync(RESULTS_DIR)) fs.mkdirSync(RESULTS_DIR, { recursive: true });
if (!fs.existsSync(runDir)) fs.mkdirSync(runDir, { recursive: true });

// ── Resume: skip already-completed slugs ────────────────────────────────────

if (resumeRunId) {
  const completed = fs.readdirSync(runDir)
    .filter((f) => f.endsWith('.json') && !f.startsWith('_'))
    .map((f) => f.replace('.json', ''));

  const before = skills.length;
  skills = skills.filter((s) => !completed.includes(s.slug));
  console.log(`Resuming run ${runId}: ${before - skills.length} already completed, ${skills.length} remaining.`);
}

// ── Dry run ─────────────────────────────────────────────────────────────────

if (dryRun) {
  console.log(`Dry run — would execute ${skills.length} skills:`);
  for (const s of skills) {
    console.log(`  ${s.slug} (${s.category}) — "${s.prompts[0]}"`);
  }
  process.exit(0);
}

// ── Write run metadata ──────────────────────────────────────────────────────

const meta = {
  runId,
  startedAt: new Date().toISOString(),
  filters: { slug: slugFilter, category: categoryFilter },
  parallel,
  budget,
  totalSkills: skills.length,
};

fs.writeFileSync(path.join(runDir, '_meta.json'), JSON.stringify(meta, null, 2) + '\n');

// ── Prompt prefix ───────────────────────────────────────────────────────────

const PROMPT_PREFIX = `You have the GooseWorks skills platform installed. \
Use the /gooseworks-master skill to accomplish this task. \
Start by invoking the Skill tool with skill "gooseworks-master", \
then search for the right skill via the API, fetch it, and run its scripts. \
Do NOT ask clarifying questions — just execute the skill with reasonable defaults.

Task: `;

// ── Spawn Claude CLI ────────────────────────────────────────────────────────

function runSkill(skill) {
  return new Promise((resolve) => {
    const prompt = skill.prompts[0]; // Use first prompt
    const fullPrompt = PROMPT_PREFIX + prompt;
    const outPath = path.join(runDir, `${skill.slug}.json`);

    const startTime = Date.now();
    console.log(`[START] ${skill.slug} — "${prompt.slice(0, 60)}..."`);

    const cliArgs = [
      '--print',
      '--verbose',
      '--output-format', 'stream-json',
      '--no-session-persistence',
      '--permission-mode', 'bypassPermissions',
      '--max-budget-usd', budget,
      fullPrompt,
    ];

    const child = spawn('claude', cliArgs, {
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env },
      timeout: 5 * 60 * 1000, // 5 minute timeout per skill
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (chunk) => { stdout += chunk.toString(); });
    child.stderr.on('data', (chunk) => { stderr += chunk.toString(); });

    child.on('close', (code) => {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      const status = code === 0 ? 'OK' : `EXIT ${code}`;
      console.log(`[${status}] ${skill.slug} — ${elapsed}s`);

      // Parse stream-json events
      const events = [];
      for (const line of stdout.split('\n')) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        try {
          events.push(JSON.parse(trimmed));
        } catch {
          // Non-JSON line, skip
        }
      }

      const result = {
        slug: skill.slug,
        category: skill.category,
        prompt,
        expectedOutputPatterns: skill.expectedOutputPatterns,
        exitCode: code,
        elapsedSeconds: parseFloat(elapsed),
        eventCount: events.length,
        events,
        stderr: stderr.trim() || undefined,
      };

      fs.writeFileSync(outPath, JSON.stringify(result, null, 2) + '\n');
      resolve(result);
    });

    child.on('error', (err) => {
      console.error(`[ERROR] ${skill.slug} — ${err.message}`);
      const result = {
        slug: skill.slug,
        category: skill.category,
        prompt,
        expectedOutputPatterns: skill.expectedOutputPatterns,
        exitCode: -1,
        elapsedSeconds: ((Date.now() - startTime) / 1000),
        eventCount: 0,
        events: [],
        error: err.message,
      };
      fs.writeFileSync(outPath, JSON.stringify(result, null, 2) + '\n');
      resolve(result);
    });
  });
}

// ── Execution engine ────────────────────────────────────────────────────────

async function runAll() {
  console.log(`\nSkill E2E Eval — Run ${runId}`);
  console.log(`Skills: ${skills.length} | Parallel: ${parallel} | Budget: $${budget}/skill\n`);

  const results = [];
  const startTime = Date.now();

  if (parallel <= 1) {
    // Sequential
    for (const skill of skills) {
      results.push(await runSkill(skill));
    }
  } else {
    // Parallel with concurrency limit
    const queue = [...skills];
    const running = new Set();

    while (queue.length > 0 || running.size > 0) {
      while (running.size < parallel && queue.length > 0) {
        const skill = queue.shift();
        const promise = runSkill(skill).then((r) => {
          running.delete(promise);
          results.push(r);
        });
        running.add(promise);
      }
      if (running.size > 0) {
        await Promise.race(running);
      }
    }
  }

  const totalElapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  const passed = results.filter((r) => r.exitCode === 0).length;
  const failed = results.filter((r) => r.exitCode !== 0).length;

  console.log(`\nDone in ${totalElapsed}s — ${passed} OK, ${failed} failed.`);
  console.log(`Results: ${runDir}/`);
  console.log(`\nRun evaluator: node test/evaluate-run.js ${path.relative(ROOT, runDir)}`);
}

runAll().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
