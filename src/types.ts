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

export interface Character {
  id: string;
  name: string;
  role: string;
  description: string;
  info?: string;
  image?: string;
  catchphrase?: string;
  desire?: string;
  belief?: string;
  keywords?: string;
  personality?: string;
  appearance?: string;
  ability?: string;
  specialNotes?: string;
  infoItems?: { label: string; value: string }[];
}

export interface Nation {
  id: string;
  name: string;
  banner?: string;
  era: string;
  space: string;
  races: string;
  history: string;
  culture: string;
  environment: string;
  other: string;
}

export interface Organization {
  id: string;
  name: string;
  logo?: string;
  purpose: string;
  structure: string;
  symbol: string;
  clothing: string;
  memberIds: string[];
}

export interface StoryChapter {
  id: string;
  title: string;
  content: string;
}

export interface StoryAct {
  id: string;
  title: string;
  chapters: StoryChapter[];
}

export interface Project {
  id: string;
  title: string;
  logline: string;
  
  // Basic Settings
  synopsis: string;
  intent: string;
  message: string;
  genre: string;
  keywords: string;
  target: string;
  
  // World Settings
  worldBasic: string;
  worldTerminology: string;
  worldAbilitySystem: string;
  worldOtherSettings: string;
  worldMap: string;
  worldRegions: string;
  worldOrgs: string;
  nations: Nation[];
  organizations: Organization[];
  
  // Character Settings
  relationshipImages: string[];
  characters: Character[];
  
  // Story Development
  storyActs: StoryAct[];
  
  basicSettings: string;
  worldSettings: string;
  characterSettings: string;
  storyDevelopment: string;
  memo: string;
  progress: number;
  timeline: TimelineNode[];
  seasons: Season[];
  referenceCategories: ReferenceCategory[];
}

export interface ReferenceCategory {
  id: string;
  name: string;
  images: ReferenceImage[];
}

export interface ReferenceImage {
  id: string;
  url: string;
  tags: string[];
}
