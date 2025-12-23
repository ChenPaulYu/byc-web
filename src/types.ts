export interface Project {
  id: string;
  title: string;
  category: 'Research' | 'Engineering' | 'Creative';
  year: string;
  role: string;
  description: string;
  tags: string[];
  links: {
    label: string;
    url: string;
    icon?: 'video' | 'paper' | 'code' | 'demo';
  }[];
  image?: string;
}

export interface Experience {
  company: string;
  role: string;
  duration: string;
  location: string;
  description: string[];
}

export interface Education {
  school: string;
  degree: string;
  duration: string;
  location: string;
}

export interface Publication {
  title: string;
  authors: string;
  venue: string;
  year: string;
  link?: string;
}