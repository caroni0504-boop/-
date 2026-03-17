export interface EpisodeCut {
  id: string;
  content: string;
}

export interface Episode {
  id: string;
  title: string;
  content: string;
  cuts: EpisodeCut[];
}

export interface Chapter {
  id: string;
  title: string;
  content: string;
  episodes: Episode[];
}

export interface Season {
  id: string;
  title: string;
  treatment: string;
  chapters: Chapter[];
}

export interface TimelineNode {
  id: string;
  title: string;
  description: string;
}

export interface Project {
  id: string;
  title: string;
  logline: string;
  timeline: TimelineNode[];
  seasons: Season[];
}
