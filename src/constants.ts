import { Project, Experience, Education, Publication, Thesis, Award } from './types';

export const SOCIAL_LINKS = {
  email: "bernie40916@gmail.com",
  github: "https://github.com/chenpaulyu",
  scholar: "https://scholar.google.com",
  twitter: "https://twitter.com/Chen_Paul_u",
};

export const EDUCATION: Education[] = [
  {
    school: "National Taiwan University (NTU)",
    degree: "M.S. in Networking and Multimedia",
    duration: "Sep 2021 – Aug 2025",
    location: "Taipei, Taiwan"
  },
  {
    school: "National Taiwan University of Science and Technology (NTUST)",
    degree: "B.S. in Electrical Engineering",
    duration: "Sep 2013 – Jun 2018",
    location: "Taipei, Taiwan"
  }
];

export const WORK_EXPERIENCE: Experience[] = [
  {
    company: "Rhythm Culture Corporation",
    role: "Technical Lead",
    duration: "Jul 2023 – Present",
    location: "Taiwan",
    description: [
      "Developed TMC-CL1, a web-based music sampler for high school classrooms.",
      "Built agent-based Music AI systems spanning DJ, Producer, and Tutor roles for interactive creation and feedback workflows.",
      "Led projects funded by Taipei Music Center, TAICCA, and Taipei Government.",
      "Recognized at NeurIPS Creative AI Track 2024 and ISMIR LLM4Music Workshop 2025."
    ]
  },
  {
    company: "Zone Sound Creative Corporation",
    role: "Interactive Engineer",
    duration: "Mar 2019 – Aug 2019",
    location: "Taiwan",
    description: [
      "Shipped \"Taptap,\" a browser-based performance interface using a cappella samples; exhibited at Vocal Asia 2019 (Japan).",
      "Produced \"FusionTaiwanBeat,\" an audio-visual system featuring Taiwanese electronic music with DJ Sonica Calico & VJ Celso Urro; exhibited at MIDEM 2019 (France).",
      "Developed \"Duplex Transmission,\" a real-time audience-performer interaction system; performed at Songshan Culture Park (Taiwan) with Po-Hao Chi."
    ]
  }
];

export const RESEARCH_EXPERIENCE: Experience[] = [
  {
    company: "Computational Physicality Lab, NTU",
    role: "Research Assistant",
    duration: "Sep 2021 – Aug 2025",
    location: "Taiwan",
    description: [
      "Developed FlueBricks, a modular toolkit for designing customizable flute-like instruments.",
      "Utilized digital fabrication (Fusion 360, 3D printing) for rapid prototyping.",
      "Engineered Python & Arduino-based evaluation systems for acoustic analysis."
    ]
  },
  {
    company: "Creative AI Lab, Sony Group Corporation",
    role: "Research Intern",
    duration: "Nov 2020 – Sep 2021",
    location: "Tokyo, Japan (Remote)",
    description: [
      "Developed DJTransGAN, the first AI model for generating smooth DJ-like transitions.",
      "Designed automated DJ mixing systems integrating web crawlers and deep learning models.",
      "Open-sourced the project; 100+ GitHub stars."
    ]
  },
  {
    company: "Music and AI Lab, Academia Sinica",
    role: "Research Assistant",
    duration: "Jul 2019 – Sep 2023",
    location: "Taiwan",
    description: [
      "Led research in intelligent music production, loop-based retrieval and generation.",
      "Published 5+ papers in top music technology conferences (ISMIR).",
      "Mentored 5+ junior researchers and developed DeepMIR course materials.",
      "Collaborated with TikTok, Sony, and MTG at UPF on joint publications."
    ]
  }
];

export const TEACHING_EXPERIENCE: Experience[] = [
  {
    company: "BLND Creative Coding School",
    role: "Instructor",
    duration: "Aug 2020 – Jul 2023",
    location: "Taiwan",
    description: [
      "Taught creative coding, AI art, and interactive device design with Arduino.",
      "Led courses on Stable Diffusion workflows and GAN-based ML image generation from data collection to training."
    ]
  },
  {
    company: "OrangeApple Children Programming School",
    role: "Instructor",
    duration: "Jul 2015 – Sep 2019",
    location: "Taiwan",
    description: [
      "Taught web development and algorithms in JavaScript and C++ for elementary to senior high students.",
      "Covered advanced topics (sorting, recursion, dynamic programming, intro AI) and coached students for the APCS exam."
    ]
  }
];

export const PUBLICATIONS: Publication[] = [
  {
    title: "FlueBricks: A Construction Kit of Flute-like Instrument for Acoustic Reasoning",
    authors: "<strong>*Bo-Yu Chen*</strong>, Chiao-Wei Huang, Lung-Pan Cheng",
    venue: "CHI 2026",
    year: "2026",
    acceptanceRate: "25%"
  },
  {
    title: "AI TrackMate: Finally, Someone Who Will Give Your Music More Than Just \"Sounds Great!\"",
    authors: "Yi-Lin Jiang, Chia-Ho Hsiung, Yen-Tung Yeh, Lu-Rong Chen, <strong>*Bo-Yu Chen*</strong>",
    venue: "NeurIPS Creative AI Track",
    year: "2024",
    acceptanceRate: "31%"
  },
  {
    title: "Automatic DJ Transitions with Differentiable Audio Effects and Generative Adversarial Networks",
    authors: "<strong>*Bo-Yu Chen*</strong>, Wei-Han Hsu, Wei-Hsiang Liao, Marco A. Martínez Ramírez, Yuki Mitsufuji, Yi-Hsuan Yang",
    venue: "ICASSP",
    year: "2022",
    acceptanceRate: "47%"
  },
  {
    title: "Exploiting Pre-trained Feature Networks for Generative Adversarial Networks in Audio-Domain Loop Generation",
    authors: "Yen-Tung Yeh, <strong>*Bo-Yu Chen*</strong>, Yi-Hsuan Yang",
    venue: "ISMIR",
    year: "2022",
    acceptanceRate: "43%"
  },
  {
    title: "A Benchmarking Initiative for Audio-Domain Music Generation Using the Freesound Loop Dataset",
    authors: "Tun-Min Hung, <strong>*Bo-Yu Chen*</strong>, Yen-Tung Yeh, Yi-Hsuan Yang",
    venue: "ISMIR",
    year: "2021",
    acceptanceRate: "34%"
  },
  {
    title: "Neural Loop Combiner: Neural Network Models for Assessing the Compatibility of Loops",
    authors: "<strong>*Bo-Yu Chen*</strong>, Jordan Smith, Yi-Hsuan Yang",
    venue: "ISMIR",
    year: "2020",
    acceptanceRate: "38%"
  }
];

export const THESES: Thesis[] = [
  {
    title: "FlueBricks: A Modular Toolkit for Interactive Flute-like Instrument Systems",
    authors: "<strong>*Bo-Yu Chen*</strong>, Chiao-Wei Huang, Lung-Pan Cheng",
    institution: "NTU",
    year: "2025"
  }
];

export const AWARDS: Award[] = [
  {
    title: "FlueBricks",
    venue: "TAICHI",
    year: "2025",
    detail: "Best Paper Award 🏆"
  }
];

export const PROJECTS: Project[] = [
  {
    id: "fluebricks",
    title: "FlueBricks",
    category: "Research",
    year: "2025",
    role: "Lead Researcher",
    description: "A modular toolkit for designing customizable flute-like instruments, enabling both traditional replication and novel designs via 3D printing.",
    tags: ["HCI", "Digital Fabrication", "Acoustics", "Python"],
    links: [],
    image: "https://picsum.photos/600/400?grayscale"
  },
  {
    id: "djtransgan",
    title: "DJTransGAN",
    category: "Research",
    year: "2022",
    role: "AI Researcher",
    description: "The first AI model for generating smooth DJ-like transitions between audio tracks. Published at ICASSP 2022.",
    tags: ["AI Music", "GANs", "Python", "Audio Processing"],
    links: [
      { label: "Paper", url: "#", icon: "paper" },
      { label: "Code", url: "#", icon: "code" }
    ],
    image: "https://picsum.photos/600/401?grayscale"
  },
  {
    id: "tmc-cl1",
    title: "TMC-CL1",
    category: "Engineering",
    year: "2024",
    role: "Tech Lead",
    description: "A Taipei Music Center-funded beat-making tool for novices, aligning musicians, designers, and engineers on DSP integration.",
    tags: ["Web Audio", "React", "DSP", "Education"],
    links: [
      { label: "Demo", url: "#", icon: "demo" }
    ],
    image: "https://picsum.photos/600/402?grayscale"
  },
  {
    id: "taptap",
    title: "Taptap",
    category: "Creative",
    year: "2019",
    role: "Interactive Engineer",
    description: "An interactive interface using O-KAI SINGERS' a cappella samples and Tone.js. Exhibited at Vocal Asia Festival, Japan.",
    tags: ["Tone.js", "Interactive", "Web Audio"],
    links: [
      { label: "Demo", url: "#", icon: "demo" }
    ],
    image: "https://picsum.photos/600/403?grayscale"
  }
];

export const REVIEWER = [
  { venue: "ISMIR", years: "2020–2025" },
  { venue: "ICASSP", years: "2025" },
  { venue: "NeurIPS Creative AI Track", years: "2025" }
];
