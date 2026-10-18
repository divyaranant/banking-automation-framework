#!/usr/bin/env node
/**
 * Onboard a new FI:  npm run new-bank -- <bank-name> <retail|business|commercial|multi> [baseUrl]
 * Copies the template data from an existing bank and sets the feature list for the segment.
 * Review env.json / data.json afterwards: URLs, account numbers and amounts are bank specific.
 */
const fs = require('fs');
const path = require('path');
const { ROOT, listBanks } = require('../lib/bank-context');

const SEGMENT_FEATURES = {
  retail: ['auth', 'accounts', 'transfers', 'billpay', 'loans'],
  business: ['auth', 'accounts', 'transfers', 'billpay'],
  commercial: ['auth', 'accounts', 'transfers', 'billpay'],
  multi: ['auth', 'accounts', 'transfers', 'billpay', 'loans'],
};

const [name, segment, baseUrl] = process.argv.slice(2);
if (!name || !SEGMENT_FEATURES[segment]) {
  console.error('usage: new-bank <bank-name> <retail|business|commercial|multi> [baseUrl]');
  process.exit(1);
}

const target = path.join(ROOT, 'banks', name);
if (fs.existsSync(target)) {
  console.error(`banks/${name} already exists`);
  process.exit(1);
}

const template = path.join(ROOT, 'banks', listBanks()[0]);
fs.mkdirSync(target, { recursive: true });
fs.copyFileSync(path.join(template, 'data.json'), path.join(target, 'data.json'));

const env = JSON.parse(fs.readFileSync(path.join(template, 'env.json'), 'utf8'));
if (baseUrl) env.baseUrl = baseUrl;
fs.writeFileSync(path.join(target, 'env.json'), JSON.stringify(env, null, 2) + '\n');

fs.writeFileSync(
  path.join(target, 'bank.json'),
  JSON.stringify({ displayName: name, segment, features: SEGMENT_FEATURES[segment] }, null, 2) + '\n'
);

console.log(`Created banks/${name}. Next: edit env.json + data.json, store creds in Vault at secret/banks/${name}.`);
