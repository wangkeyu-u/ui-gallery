// ============================================================
// Type Definitions
// ============================================================

export interface UIProject {
  id: string;
  name: string;
  description: string;
  source: string;
  originalUrl: string;
  author: string;
  projectType: string;
  styleFamily: string;
  styleFamilyName: string;
  styleFamilyNameZh: string;
  styleDescription: string;
  mood: string[];
  materials: string[];
  industry: string[];
  density: string;
  isDark: boolean;
  colors: { bg: string | null; accent: string | null; text: string | null };
  fontFamily: string | null;
  interactions: string[];
  animations: string[];
  layoutTraits: string[];
  previewImage: string;
  prompt: string;
  hifiPassed: boolean;
  animOk: boolean;
  capabilities: string[];
  searchText: string;
}

export interface ComponentLibrary {
  id: string;
  name: string;
  description: string;
  framework: string[];
  category: string;
  categoryLabel: string;
  vendor: string;
  documentationUrl: string;
  repoUrl: string;
  license: string;
  installCommand: string;
  components: string[];
  previewImage: string;
  styleFamily: string;
  codeAvailable: boolean;
  capabilities: string[];
  searchText: string;
}

export interface StyleFamily {
  key: string;
  name: string;
  nameZh: string;
  description: string;
  keywords: string[];
  mood: string[];
  materials: string[];
}

export interface SearchResult {
  project: UIProject;
  score: number;
  reasons: string[];
}

export interface ThemeDNA {
  themeName: string;
  coreMood: string;
  useCase: string;
  targetUser: string;
  colorSystem: string;
  typeHierarchy: string;
  spacing: string;
  borderRadius: string;
  borderRules: string;
  shadowRules: string;
  materialExpression: string;
  artDirection: string;
  pageComposition: string;
  componentForm: string;
  interactionStates: string;
  animationRhythm: string;
  responsiveRules: string;
  accessibility: string;
  forbiddenPatterns: string;
  references: string;
}

export interface SavedTheme {
  id: string;
  name: string;
  dna: ThemeDNA;
  referenceProjectId: string;
  createdAt: string;
  updatedAt: string;
  version: number;
}

export interface UserPreference {
  likedProjectIds: string[];
  dislikedProjectIds: string[];
  positiveKeywords: string[];
  negativeKeywords: string[];
  lockedDecisions: string[];
  colorPreferences: string[];
  materialPreferences: string[];
  densityPreferences: string[];
  fontPreferences: string[];
  animationPreferences: string[];
  rejectedPatterns: string[];
  history: { action: string; value: string; timestamp: string }[];
}
