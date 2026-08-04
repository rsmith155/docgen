#!/usr/bin/env node
const { Command } = require('commander');
const simpleGit = require('simple-git');
const fs = require('fs');
const path = require('path');

const { extractRoutes } = require('./lib/extractRoutes');
const { diffRoutes } = require('./lib/diffRoutes');
const { generateMarkdown } = require('./lib/generateMarkdown');

const program = new Command();

program
  .name('docgen')
  .description('Generates Markdown API documentation from the diff between two git commits.')
  .requiredOption('-r, --repo <path>', 'path to the target git repository')
  .requiredOption('-f, --file <path>', 'path to the file to diff, relative to the repo root')
  .requiredOption('--from <ref>', 'git ref for the "before" version (e.g. a commit hash)')
  .requiredOption('--to <ref>', 'git ref for the "after" version (e.g. HEAD)')
  .option('-o, --out <path>', 'output Markdown file path', './docs/api-update.md')
  .action(async (opts) => {
    const git = simpleGit(opts.repo);

    let beforeSource, afterSource;
    try {
      beforeSource = await git.show([`${opts.from}:${opts.file}`]);
    } catch (err) {
      console.error(`Could not read ${opts.file} at ${opts.from}: ${err.message}`);
      process.exit(1);
    }
    try {
      afterSource = await git.show([`${opts.to}:${opts.file}`]);
    } catch (err) {
      console.error(`Could not read ${opts.file} at ${opts.to}: ${err.message}`);
      process.exit(1);
    }

    const beforeRoutes = extractRoutes(beforeSource);
    const afterRoutes = extractRoutes(afterSource);
    const diff = diffRoutes(beforeRoutes, afterRoutes);

    const markdown = generateMarkdown(diff, { fromRef: opts.from, toRef: opts.to });

    const outPath = path.resolve(process.cwd(), opts.out);
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, markdown);

    console.log(`\nDocumentation written to ${outPath}`);
    console.log(`Summary: ${diff.added.length} added, ${diff.changed.length} changed, ${diff.removed.length} removed, ${diff.unchanged.length} unchanged.\n`);
  });

program.parse();
