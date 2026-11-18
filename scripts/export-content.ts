/**
 * Export the portfolio's ground-truth content (src/content/*.ts) to JSON so the
 * Python twin-agent can build its corpus from the same source the site renders.
 *
 * Run: npx tsx scripts/export-content.ts   (writes twin-agent/data/site.json)
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import {
  profile,
  socials,
  metrics,
  about,
  skillGroups,
  experience,
  education,
  recognition,
  languages,
  services,
  siteUrl,
} from "../src/content/site";
import { caseStudies, repos } from "../src/content/projects";

const out = join(process.cwd(), "twin-agent", "data", "site.json");
mkdirSync(dirname(out), { recursive: true });

const data = {
  siteUrl,
  profile,
  socials,
  metrics,
  about,
  skillGroups,
  experience,
  education,
  recognition,
  languages,
  services,
  caseStudies,
  repos,
};

writeFileSync(out, JSON.stringify(data, null, 2) + "\n", "utf-8");
console.log(`wrote ${out} (${caseStudies.length} case studies, ${repos.length} repos)`);
