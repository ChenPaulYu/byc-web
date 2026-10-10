import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import type { CvConfig } from '../types/cv';
import { CvDocument } from '../components/cv/CvDocument';
import { CvPeopleProvider } from '../components/cv/CvPerson';
import { CvInline } from '../components/cv/CvInline';
import { CvReferences } from '../components/cv/CvReference';
import { cvHref, publicationLinks, visibleCvReferences, cvPreviewText } from './cv';

const config = JSON.parse(readFileSync('public/cv.config.json', 'utf8')) as CvConfig;
const render = (data: CvConfig) => renderToStaticMarkup(React.createElement(CvDocument, { config: data }));

test('CV inline copy formats legacy emphasis and escapes arbitrary HTML', () => {
  const html = renderToStaticMarkup(React.createElement(CvReferences.Provider, { value: visibleCvReferences(config) },
    React.createElement(CvInline, { text: '<strong>*Bo-Yu Chen*</strong> <img src=x onerror=alert(1)> [[C1]] [[A9]] {{Award}}' })));
  assert.match(html, /<strong>Bo-Yu Chen<\/strong>/);
  assert.doesNotMatch(html, /<img/);
  assert.match(html, /&lt;img/);
  assert.match(html, /href="#cv-ref-C1"/);
  assert.doesNotMatch(html, /href="#cv-ref-A9"/);
  assert.match(html, /cv-badge-award/);
});

test('legacy CV configs still render and legacy PDF resources remain usable', () => {
  const legacy: CvConfig = {
    header: { name: 'Example', tagline: 'Researcher' }, education: [], workExperience: [], researchExperience: [], teachingExperience: [],
    publications: [{ title: 'Legacy paper', authors: '<strong>Author</strong>', venue: 'CHI', year: '2020', pdf: '/papers/legacy.pdf' }],
    theses: [{ title: 'Legacy thesis', authors: '<strong>Author</strong>', institution: 'NTU', year: '2020' }],
    awards: [], reviewer: [], visibility: {}, customSections: [{ id: 'custom', title: 'Custom section', visible: true, items: [{ text: 'Custom item' }] }],
  };
  const html = render(legacy);
  assert.match(html, /href="\/papers\/legacy.pdf"/);
  assert.match(html, /Legacy thesis/);
  assert.match(html, /Custom item/);
  assert.match(html, /CHI, 2020/);
  assert.equal(publicationLinks({ ...legacy.publications[0], links: [{ kind: 'paper', url: '/new.pdf' }] }).length, 1);
});

test('approved CV renders all sections in order with resolvable citations and LinkedIn', () => {
  const html = render(config);
  const headings = [...html.matchAll(/<h2>(.*?)<\/h2>/g)].map(match => match[1].replaceAll('&amp;', '&'));
  assert.deepEqual(headings, ['Research Interests', 'Education', 'Research Experience', 'Work Experience', 'Teaching Experience', 'Publications', 'Interactive Art & Installations', 'Open-Source Software & Toolkits', 'Honors & Awards', 'Academic Service & Reviewing', 'Extracurricular Activities']);
  const targets = [...html.matchAll(/id="(cv-ref-[^"]+)"/g)].map(match => match[1]);
  assert.equal(targets.length, 14);
  assert.equal(new Set(targets).size, targets.length);
  for (const [, target] of html.matchAll(/href="#(cv-ref-[^"]+)"/g)) assert.ok(targets.includes(target), target);
  assert.ok(html.includes(config.header.linkedin!));
  assert.doesNotMatch(html, /\[\[|\{\{|\*\*/);
});

test('hidden sections do not leave broken citation links', () => {
  const html = render({ ...config, visibility: { ...config.visibility, publications: false, art: false } });
  assert.doesNotMatch(html, /href="#cv-ref-/);
  assert.doesNotMatch(html, /<h2>Publications/);
});

test('resource URLs only allow web links and local absolute paths', () => {
  for (const bad of ['javascript:alert(1)', 'data:text/html,test', '//example.com', 'bad']) assert.equal(cvHref(bad), undefined);
  assert.equal(cvHref('https://example.com'), 'https://example.com');
  assert.equal(cvHref('/papers/test.pdf'), '/papers/test.pdf');
});


test('citation previews use visible source metadata and original resource links', () => {
  const entries = visibleCvReferences(config);
  const paper = config.publications.find(item => item.id === 'C2')!;
  assert.equal(entries.get('C2')?.title, paper.title);
  assert.deepEqual(entries.get('C2')?.links, publicationLinks(paper));
  assert.doesNotMatch(entries.get('C2')!.detail, /\*|<strong>/);
  assert.equal(entries.get('A1')?.kind, 'art');
  assert.equal(visibleCvReferences({ ...config, visibility: { publications: false, art: false, awards: false } }).size, 0);
});

test('award badges resolve visible records, share labels and omit hidden or removed awards', () => {
  const html = render(config);
  for (const award of config.awards.filter(item => item.id)) {
    assert.match(html, new RegExp(`id="cv-award-${award.id}"`));
    assert.equal((html.match(new RegExp(`href="#cv-award-${award.id}"`, 'g')) ?? []).length, 2);
    const preview = visibleCvReferences(config).get(`award:${award.id}`)!;
    assert.equal(preview.kind, 'award');
    assert.equal(preview.label, award.label);
    assert.doesNotMatch(preview.venue, /\[\[|\*|\{\{/);
  }
  const hidden = render({ ...config, visibility: { ...config.visibility, awards: false } });
  assert.doesNotMatch(hidden, /href="#cv-award-|\[\[award:/);
  const removed = render({ ...config, awards: [] });
  assert.doesNotMatch(removed, /href="#cv-award-|\[\[award:/);
  const updated = render({ ...config, awards: config.awards.map(item => item.id === 'taichi-thesis-2026' ? { ...item, label: 'Updated thesis honor' } : item) });
  assert.equal((updated.match(/Updated thesis honor/g) ?? []).length, 2);
});


test('inline resource icons preserve emphasis, reject unsafe URLs and stay readable in previews', () => {
  const text = '[**Professor**](https://example.com/person) [Unsafe](javascript:alert) [Data](data:text/html,test) [[C1]]';
  const html = renderToStaticMarkup(React.createElement(CvReferences.Provider, { value: visibleCvReferences(config) }, React.createElement(CvInline, { text })));
  assert.match(html, /class="cv-inline-resource"><strong>Professor<\/strong>/);
  assert.match(html, /class="cv-icon-link" href="https:\/\/example.com\/person"/);
  assert.match(html, /aria-haspopup="dialog"/);
  assert.doesNotMatch(html, /cv-inline-link/);
  assert.match(html, /rel="noopener noreferrer"/);
  assert.doesNotMatch(html, /href="(?:javascript:|data:)/);
  assert.match(html, /Unsafe/);
  assert.match(html, /href="#cv-ref-C1"/);
  assert.equal(cvPreviewText('[**Professor**](https://example.com/person)'), 'Professor');
  assert.equal((render(config).match(/href="https:\/\/www\.lungpancheng\.tw\/"/g) ?? []).length, 2);
  assert.equal((render(config).match(/href="https:\/\/affige\.github\.io\/index\.html"/g) ?? []).length, 1);
});


test('advisor profile references share URLs, preserve plain-link compatibility and reject unsafe destinations', () => {
  const person = { id: 'advisor', name: 'Example Professor', label: 'Prof. Example', url: 'https://example.com/advisor', relationship: 'Thesis Advisor', affiliation: 'Lab · University' };
  const inline = (url: string) => renderToStaticMarkup(React.createElement(CvPeopleProvider, { people: [{ ...person, url }], children: React.createElement(CvInline, { text: 'Advisor: [[person:advisor]]; [[person:missing]]' }) }));
  const html = inline(person.url);
  assert.match(html, /class="cv-person-link"/);
  assert.match(html, /aria-haspopup="dialog"/);
  assert.match(html, /href="https:\/\/example.com\/advisor"/);
  assert.match(html, /Prof\. Example/);
  assert.doesNotMatch(html, /\[\[person:/);
  assert.doesNotMatch(inline('javascript:alert(1)'), /<a /);
  const people = config.people!.map((item, i) => i === 0 ? { ...item, url: 'https://example.com/updated-advisor' } : item);
  const updated = render({ ...config, people });
  assert.equal((updated.match(/href="https:\/\/example.com\/updated-advisor"/g) ?? []).length, 2);
  assert.doesNotMatch(updated, /href="https:\/\/www\.lungpancheng\.tw\/"/);
});
