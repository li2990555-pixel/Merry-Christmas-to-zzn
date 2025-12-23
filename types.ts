
export enum TreeState {
  MERGED = 'MERGED',
  SCATTERED = 'SCATTERED'
}

export interface ParticleData {
  initialPos: { x: number; y: number; z: number };
  scatterPos: { x: number; y: number; z: number };
  currentPos: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number };
  scale: number;
  type: 'sphere' | 'box' | 'candy';
  color: string;
}

export interface HandData {
  isFist: boolean;
  isOpen: boolean;
  x: number;
  y: number;
}
