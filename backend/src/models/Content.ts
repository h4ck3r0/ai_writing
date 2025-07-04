import mongoose, { Document, Schema } from 'mongoose';
import { IUser } from './User';

export interface IContent extends Document {
  title: string;
  content: string;
  format: string;
  author: IUser['_id'];
  version: number;
  lastModified: Date;
  metadata: {
    wordCount: number;
    characters: string[];
    scenes: string[];
    plotPoints: string[];
  };
  history: {
    timestamp: Date;
    content: string;
    version: number;
  }[];
  settings: {
    isPublic: boolean;
    collaborators: IUser['_id'][];
    enableAI: boolean;
  };
}

const ContentSchema = new Schema<IContent>({
  title: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    type: String,
    required: true
  },
  format: {
    type: String,
    enum: ['NOVEL', 'SCREENPLAY', 'GAME_SCRIPT'],
    required: true
  },
  author: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  version: {
    type: Number,
    default: 1
  },
  lastModified: {
    type: Date,
    default: Date.now
  },
  metadata: {
    wordCount: {
      type: Number,
      default: 0
    },
    characters: [{
      type: String,
      trim: true
    }],
    scenes: [{
      type: String,
      trim: true
    }],
    plotPoints: [{
      type: String,
      trim: true
    }]
  },
  history: [{
    timestamp: {
      type: Date,
      default: Date.now
    },
    content: {
      type: String,
      required: true
    },
    version: {
      type: Number,
      required: true
    }
  }],
  settings: {
    isPublic: {
      type: Boolean,
      default: false
    },
    collaborators: [{
      type: Schema.Types.ObjectId,
      ref: 'User'
    }],
    enableAI: {
      type: Boolean,
      default: true
    }
  }
}, {
  timestamps: true
});

// Update lastModified and increment version on content change
ContentSchema.pre('save', function(next) {
  if (this.isModified('content')) {
    this.lastModified = new Date();
    this.version += 1;
    
    // Add to history
    this.history.push({
      timestamp: this.lastModified,
      content: this.content,
      version: this.version
    });

    // Update word count
    this.metadata.wordCount = this.content.trim().split(/\s+/).length;
  }
  next();
});

// Limit history size to last 10 versions
ContentSchema.post('save', function(doc) {
  if (doc.history.length > 10) {
    doc.history = doc.history.slice(-10);
    doc.save();
  }
});

export default mongoose.model<IContent>('Content', ContentSchema);