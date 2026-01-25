// lib/types.ts
export interface Project {
  id: string;
  name: string;
  description?: string;
  createdAt: number;
  updatedAt: number;
}

export interface Version {
  id: string;
  projectId: string;
  versionNum: number;
  sketchData: string;
  sketchImage: string;
  generatedCode: string;
  requirements?: string;
  createdAt: number;
}
