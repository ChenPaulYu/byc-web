import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import type { CvConfig } from '../types/cv';
import { CvDocument } from '../components/cv/CvDocument';
import { CvInline } from '../components/cv/CvInline';
import { CvReferences } from '../components/cv/CvReference';
import { cvHref, publicationLinks, visibleCvReferences } from './cv';

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
  assert.deepEqual(headings, ['Research Interests', 'Education', 'Honors & Awards', 'Research Experience', 'Open-Source Software & Toolkits', 'Work Experience', 'Publications', 'Interactive Art & Installations', 'Academic Service & Reviewing', 'Teaching Experience', 'Extracurricular Activities']);
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
  assert.equal(visibleCvReferences({ ...config, visibility: { publications: false, art: false } }).size, 0);
});
