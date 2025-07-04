import mongoose, { Document, Schema } from 'mongoose';
import { IContent } from './Content';
import { IUser } from './User';

export interface IAISuggestion extends Document {
  content: IContent['_id'];
  text: string;
  type: string;
  category: string;
  confidence: number;
  model: string;
  metadata: {
    position: {
      start: number;
      end: number;
    };
    context: string;
    originalText: string;
  };
  status: string;
  createdBy: IUser['_id'];
  appliedAt?: Date;
  createdAt: Date;
}

const AISuggestionSchema = new Schema<IAISuggestion>({
  content: {
    type: Schema.Types.ObjectId,
    ref: 'Content',
    required: true
  },
  text: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['STYLE', 'PLOT', 'CHARACTER', 'DIALOGUE', 'STRUCTURE'],
    required: true
  },
  category: {
    type: String,
    required: true
  },
  confidence: {
    type: Number,
    required: true,
    min: 0,
    max: 1
  },
  model: {
    type: String,
    enum: ['GEMINI', 'T5'],
    required: true
  },
  metadata: {
    position: {
      start: {
        type: Number,
        required: true
      },
      end: {
        type: Number,
        required: true
      }
    },
    context: {
      type: String,
      required: true
    },
    originalText: {
      type: String,
      required: true
    }
  },
  status: {
    type: String,
    enum: ['PENDING', 'APPLIED', 'REJECTED'],
    default: 'PENDING'
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  appliedAt: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Create indexes for efficient querying
AISuggestionSchema.index({ content: 1, type: 1 });
AISuggestionSchema.index({ content: 1, status: 1 });
AISuggestionSchema.index({ createdBy: 1 });
AISuggestionSchema.index({ createdAt: -1 });

// Middleware to validate confidence score
AISuggestionSchema.pre('save', function(next) {
  if (this.confidence < 0 || this.confidence > 1) {
    next(new Error('Confidence score must be between 0 and 1'));
  }
  next();
});

// Update appliedAt timestamp when status changes to APPLIED
AISuggestionSchema.pre('save', function(next) {
  if (this.isModified('status') && this.status === 'APPLIED') {
    this.appliedAt = new Date();
  }
  next();
});

export default mongoose.model<IAISuggestion>('AISuggestion', AISuggestionSchema);