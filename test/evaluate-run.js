#!/usr/bin/env node

/**
 * Skill E2E Evaluator — parses Claude CLI stream-json traces and checks
 * that each skill was correctly searched, loaded, and executed.
 *
 * The stream-json format from `claude --print --verbose --output-format stream-json`
 * emits newline-delimited JSON. Each event is a top-level object:
 *
 *   {type: "system",    subtype: "init", ...}          — session init
 *   {type: "assistant", message: {content: [...]}, ...} — assistant turn (text, tool_use, thinking)
 *   {type: "user",      message: {content: [...]}, ...} — user turn (tool_result)
 *   {type: "result",    subtype: "success", result: "...", permission_denials: [...]}
 *
 * Tool calls are in assistant message content blocks:
 *   {type: "tool_use", name: "Bash", id: "toolu_...", input: {command: "..."}}
 *
 * Tool results are in user message content blocks:
 *   {type: "tool_result", tool_use_id: "toolu_...", content: "...", is_error: true/false}
 *
 * Usage:
 *   node test/evaluate-run.js test/results/2026-04-05-1430/
 *   node test/evaluate-run.js test/results/2026-04-05-1430/ --slug twitter-scraper
 *   node test/evaluate-run.js test/results/2026-04-05-1430/ --failures-only
 *   node test/evaluate-run.js test/results/2026-04-05-1430/ --json
 */

const fs = require('fs');
const path = require('path');

// ── CLI args ────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const runDirArg = args.find((a) => !a.startsWith('--'));
const slugFilter = (() => {
  const eq = args.find((a) => a.startsWith('--slug='));
  if (eq) return eq.split('=')[1];
  const idx = args.indexOf('--slug');
  if (idx !== -1 && args[idx + 1]) return args[idx + 1];
  return null;
})();
const failuresOnly = args.includes('--failures-only');
const jsonOutput = args.includes('--json');

if (!runDirArg) {
  console.error('Usage: node test/evaluate-run.js <run-dir> [--slug <slug>] [--failures-only] [--json]');
  process.exit(1);
}

const runDir = path.isAbsolute(runDirArg) ? runDirArg : path.resolve(process.cwd(), runDirArg);

if (!fs.existsSync(runDir)) {
  console.error(`Run directory not found: ${runDir}`);
  process.exit(1);
}

// ── Load trace files ────────────────────────────────────────────────────────

const traceFiles = fs.readdirSync(runDir)
  .filter((f) => f.endsWith('.json') && !f.startsWith('_'))
  .filter((f) => !slugFilter || f === `${slugFilter}.json`);

if (traceFiles.length === 0) {
  console.error('No trace files found in run directory.');
  process.exit(1);
}

// ── Parse events into tool calls, text, and metadata ────────────────────────

function parseTrace(events) {
  const toolCalls = [];   // {name, input, id, output, isError}
  const textChunks = [];  // all text output from assistant
  let permissionDenials = [];
  let resultEvent = null;

  for (const evt of events) {
    if (!evt || !evt.type) continue;

    // ── assistant message: extract tool_use and text blocks ──
    if (evt.type === 'assistant' && evt.message && Array.isArray(evt.message.content)) {
      for (const block of evt.message.content) {
        if (block.type === 'tool_use') {
          toolCalls.push({
            name: block.name || '',
            input: block.input || {},
            id: block.id || '',
            output: '',
            isError: false,
          });
        } else if (block.type === 'text' && block.text) {
          textChunks.push(block.text);
        }
        // thinking blocks are ignored for evaluation
      }
      continue;
    }

    // ── user message: extract tool_result blocks ──
    if (evt.type === 'user' && evt.message && Array.isArray(evt.message.content)) {
      for (const block of evt.message.content) {
        if (block.type === 'tool_result') {
          const content = typeof block.content === 'string'
            ? block.content
            : Array.isArray(block.content)
              ? block.content.map((c) => c.text || '').join('\n')
              : '';

          // Match to the tool call by tool_use_id
          const tc = toolCalls.find((t) => t.id === block.tool_use_id);
          if (tc) {
            tc.output = content;
            tc.isError = !!block.is_error;
          }
        }
      }
      continue;
    }

    // ── result event: final output + permission denials ──
    if (evt.type === 'result') {
      resultEvent = evt;
      if (typeof evt.result === 'string') {
        textChunks.push(evt.result);
      }
      if (Array.isArray(evt.permission_denials)) {
        permissionDenials = evt.permission_denials;
      }
      continue;
    }
  }

  return {
    toolCalls,
    textOutput: textChunks.join('\n'),
    permissionDenials,
    resultEvent,
  };
}

// ── Evaluation checks ───────────────────────────────────────────────────────

function getCommand(tc) {
  return tc.input?.command || tc.input?.cmd || '';
}

/** Did Claude call /api/skills/search? */
function checkSearch(toolCalls) {
  for (const t of toolCalls) {
    if (t.name === 'Bash') {
      const cmd = getCommand(t);
      if (cmd.includes('/api/skills/search') || cmd.includes('skills/search')) {
        return { found: true, command: cmd };
      }
    }
  }
  return { found: false };
}

/** Does the expected slug appear anywhere in tool calls/outputs/text? */
function checkCorrectSkill(toolCalls, textOutput, slug) {
  for (const t of toolCalls) {
    const cmd = getCommand(t);
    const output = t.output || '';
    if (cmd.includes(slug) || output.includes(slug)) {
      return { found: true };
    }
  }
  if (textOutput.includes(slug)) {
    return { found: true };
  }
  return { found: false };
}

/** Did Claude call /api/skills/catalog/<slug>? */
function checkSkillLoaded(toolCalls, slug) {
  for (const t of toolCalls) {
    if (t.name === 'Bash') {
      const cmd = getCommand(t);
      if (cmd.includes(`/api/skills/catalog/${slug}`) || cmd.includes(`skills/catalog/${slug}`)) {
        return { found: true, command: cmd };
      }
    }
  }
  return { found: false };
}

/** Did Claude run a script from /tmp/gooseworks-scripts/? */
function checkScriptExecuted(toolCalls, slug) {
  for (const t of toolCalls) {
    if (t.name === 'Bash') {
      const cmd = getCommand(t);
      if (
        cmd.includes('/tmp/gooseworks-scripts/') ||
        cmd.includes(`scripts/${slug}`) ||
        (cmd.includes('python3 ') && cmd.includes(slug))
      ) {
        return { found: true, command: cmd };
      }
    }
  }
  return { found: false };
}

/** Were there errors in Bash tool outputs? */
function checkNoErrors(toolCalls) {
  const errors = [];
  for (const t of toolCalls) {
    if (t.name === 'Bash' && t.isError) {
      errors.push({
        command: getCommand(t).slice(0, 80),
        error: (t.output || '').slice(0, 200),
      });
    } else if (t.name === 'Bash') {
      const output = t.output || '';
      if (
        output.includes('Traceback (most recent call last)') ||
        output.includes('command not found')
      ) {
        errors.push({
          command: getCommand(t).slice(0, 80),
          error: output.slice(0, 200),
        });
      }
    }
  }
  return { clean: errors.length === 0, errors };
}

/** Does the final text output contain expected patterns? */
function checkOutputQuality(textOutput, expectedPatterns) {
  if (!expectedPatterns || expectedPatterns.length === 0) {
    return { pass: true, matched: [], missing: [] };
  }

  const lower = textOutput.toLowerCase();
  const matched = [];
  const missing = [];

  for (const pattern of expectedPatterns) {
    if (lower.includes(pattern.toLowerCase())) {
      matched.push(pattern);
    } else {
      missing.push(pattern);
    }
  }

  const pass = matched.length >= Math.ceil(expectedPatterns.length / 2);
  return { pass, matched, missing };
}

// ── Evaluate each trace ─────────────────────────────────────────────────────

const results = [];

for (const file of traceFiles) {
  const filePath = path.join(runDir, file);
  const trace = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const slug = trace.slug || file.replace('.json', '');
  const events = trace.events || [];

  // No events = runner error
  if (events.length === 0) {
    const errorMsg = trace.stderr || trace.error || 'no events captured';
    results.push({
      slug,
      category: trace.category,
      exitCode: trace.exitCode,
      elapsed: trace.elapsedSeconds,
      checks: {
        search: false, correctSkill: false, loaded: false,
        executed: false, noErrors: false, outputQuality: false,
      },
      status: 'ERROR',
      details: {
        errors: [{ command: 'claude --print', error: errorMsg.slice(0, 200) }],
        outputMatched: [],
        outputMissing: trace.expectedOutputPatterns || [],
      },
    });
    continue;
  }

  const { toolCalls, textOutput, permissionDenials, resultEvent } = parseTrace(events);

  const search = checkSearch(toolCalls);
  const correctSkill = checkCorrectSkill(toolCalls, textOutput, slug);
  const loaded = checkSkillLoaded(toolCalls, slug);
  const executed = checkScriptExecuted(toolCalls, slug);
  const noErrors = checkNoErrors(toolCalls);
  const outputQuality = checkOutputQuality(textOutput, trace.expectedOutputPatterns);

  const checks = {
    search: search.found,
    correctSkill: correctSkill.found,
    loaded: loaded.found,
    executed: executed.found,
    noErrors: noErrors.clean,
    outputQuality: outputQuality.pass,
  };

  const passCount = Object.values(checks).filter(Boolean).length;
  const status = passCount >= 5 ? 'PASS' : passCount >= 3 ? 'PARTIAL' : 'FAIL';

  results.push({
    slug,
    category: trace.category,
    exitCode: trace.exitCode,
    elapsed: trace.elapsedSeconds,
    checks,
    status,
    details: {
      searchCommand: search.command,
      loadCommand: loaded.command,
      executeCommand: executed.command,
      errors: noErrors.errors,
      permissionDenials: permissionDenials.length,
      outputMatched: outputQuality.matched,
      outputMissing: outputQuality.missing,
      toolCallCount: toolCalls.length,
      textLength: textOutput.length,
      costUsd: resultEvent?.total_cost_usd,
    },
  });
}

// ── Output ──────────────────────────────────────────────────────────────────

if (jsonOutput) {
  const summary = makeSummary();
  fs.writeFileSync(path.join(runDir, '_summary.json'), JSON.stringify(summary, null, 2) + '\n');
  console.log(JSON.stringify(summary, null, 2));
  process.exit(0);
}

// ── Table output ────────────────────────────────────────────────────────────

const displayResults = failuresOnly
  ? results.filter((r) => r.status !== 'PASS')
  : results;

const check = (v) => v ? '\u2713' : '\u2717';
const runName = path.basename(runDir);

console.log(`\nSkill E2E Eval Results (${runName})`);
console.log('\u2550'.repeat(95));
console.log('');

console.log(
  pad('Skill', 30) +
  pad('Search', 8) +
  pad('Correct', 9) +
  pad('Loaded', 8) +
  pad('Exec', 8) +
  pad('Errors', 8) +
  pad('Output', 8) +
  pad('Status', 8)
);
console.log('-'.repeat(95));

for (const r of displayResults) {
  const c = r.checks;
  const statusColors = { PASS: '\x1b[32m', PARTIAL: '\x1b[33m', FAIL: '\x1b[31m', ERROR: '\x1b[35m' };
  const color = statusColors[r.status] || '\x1b[31m';
  const reset = '\x1b[0m';

  console.log(
    pad(r.slug, 30) +
    pad(check(c.search), 8) +
    pad(check(c.correctSkill), 9) +
    pad(check(c.loaded), 8) +
    pad(check(c.executed), 8) +
    pad(check(c.noErrors), 8) +
    pad(check(c.outputQuality), 8) +
    `${color}${r.status}${reset}`
  );

  // Show details for non-passing results
  if (r.status !== 'PASS') {
    if (r.details.permissionDenials > 0) {
      console.log(`  ${color}\u2514 ${r.details.permissionDenials} permission denial(s)${reset}`);
    }
    if (r.details.errors && r.details.errors.length > 0) {
      for (const err of r.details.errors.slice(0, 2)) {
        console.log(`  ${color}\u2514 ${err.error || err.command}${reset}`);
      }
    }
  }
}

console.log('');
console.log('-'.repeat(95));

const summary = makeSummary();
const parts = [`${summary.pass} PASS`, `${summary.partial} PARTIAL`, `${summary.fail} FAIL`];
if (summary.error > 0) parts.push(`${summary.error} ERROR`);

const totalCost = results.reduce((sum, r) => sum + (r.details.costUsd || 0), 0);
console.log(`Summary: ${parts.join(', ')} (${summary.total} total)`);
if (totalCost > 0) console.log(`Total cost: $${totalCost.toFixed(2)}`);
console.log('');

fs.writeFileSync(path.join(runDir, '_summary.json'), JSON.stringify(summary, null, 2) + '\n');
console.log(`Summary written to ${path.join(runDir, '_summary.json')}`);

if (summary.fail > 0 || summary.error > 0) process.exit(1);

// ── Helpers ─────────────────────────────────────────────────────────────────

function makeSummary() {
  return {
    runDir: path.basename(runDir),
    evaluatedAt: new Date().toISOString(),
    total: results.length,
    pass: results.filter((r) => r.status === 'PASS').length,
    partial: results.filter((r) => r.status === 'PARTIAL').length,
    fail: results.filter((r) => r.status === 'FAIL').length,
    error: results.filter((r) => r.status === 'ERROR').length,
    results,
  };
}

function pad(str, len) {
  if (str.length >= len) return str.slice(0, len - 1) + ' ';
  return str + ' '.repeat(len - str.length);
}
