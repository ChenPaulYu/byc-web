/**
 * Holds the small set of public-site identity links and curated project cards.
 * Reads: none; consumed by the public About, Layout, and Projects surfaces.
 */

import { Project } from './types';

export const SOCIAL_LINKS = {
  email: "bernie40916@gmail.com",
  github: "https://github.com/chenpaulyu",
  scholar: "https://scholar.google.com/citations?user=ydsKndkAAAAJ",
  linkedin: "https://www.linkedin.com/in/bo-yu-chen-bb074989/",
  twitter: "https://x.com/Chen_Paul_u",
};

export const PROJECTS: Project[] = [
  {
    id: "fluebricks",
    title: "FlueBricks",
    category: "Research",
    year: "2026",
    role: "Lead Researcher",
    description: "A construction kit for acoustic reasoning via building and customizing flute-like instruments. Accepted at CHI 2026.",
    tags: ["HCI", "Instrument Design", "Acoustics", "CHI 2026"],
    links: [
      { label: "Paper", url: "https://arxiv.org/abs/2604.03636", icon: "paper" },
      { label: "Video", url: "https://www.youtube.com/watch?v=00xJnwGVffU", icon: "demo" }
    ],
    image: "/content/projects/fluebricks/thumbnail.jpg"
  }
];
