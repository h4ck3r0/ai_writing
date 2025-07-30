// backend/src/models/Team.ts

import { Document } from 'mongoose';

export interface ITeam extends Document {
  name: string;
  memberIds: string[];
  roles: { [userId: string]: 'admin' | 'editor' | 'viewer' };
  createdAt: Date;
  updatedAt: Date;
}