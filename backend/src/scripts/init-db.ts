import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User';
import Content from '../models/Content';
import AISuggestion from '../models/AISuggestion';

// Load environment variables
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ai_writing_platform';

async function initializeDatabase() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('Connected successfully to MongoDB');

        // Create indexes
        console.log('Creating indexes...');

        // User indexes
        await User.collection.createIndex({ email: 1 }, { unique: true });
        await User.collection.createIndex({ 'preferences.defaultFormat': 1 });

        // Content indexes
        await Content.collection.createIndex({ author: 1 });
        await Content.collection.createIndex({ format: 1 });
        await Content.collection.createIndex({ 'settings.isPublic': 1 });
        await Content.collection.createIndex({ 'settings.collaborators': 1 });
        await Content.collection.createIndex({ lastModified: -1 });
        await Content.collection.createIndex({ 
            title: 'text', 
            content: 'text', 
            'metadata.characters': 'text' 
        });

        // AI Suggestion indexes
        await AISuggestion.collection.createIndex({ content: 1, type: 1 });
        await AISuggestion.collection.createIndex({ content: 1, status: 1 });
        await AISuggestion.collection.createIndex({ createdBy: 1 });
        await AISuggestion.collection.createIndex({ createdAt: -1 });
        await AISuggestion.collection.createIndex({ confidence: -1 });

        // Create admin user if not exists
        const adminEmail = 'admin@aiwriting.com';
        const adminExists = await User.findOne({ email: adminEmail });
        
        if (!adminExists) {
            console.log('Creating admin user...');
            const adminUser = new User({
                email: adminEmail,
                password: 'admin123', // Will be hashed by the model
                name: 'Admin User',
                isAdmin: true,
                preferences: {
                    defaultFormat: 'NOVEL',
                    theme: 'light',
                    aiSuggestions: true
                }
            });
            await adminUser.save();
            console.log('Admin user created successfully');
        }

        // Create sample content if database is empty
        const contentCount = await Content.countDocuments();
        if (contentCount === 0) {
            console.log('Creating sample content...');
            const admin = await User.findOne({ email: adminEmail });
            
            if (admin) {
                const sampleContent = new Content({
                    title: 'Welcome to AI Writing Platform',
                    content: 'This is a sample document to help you get started...',
                    format: 'NOVEL',
                    author: admin._id,
                    version: 1,
                    metadata: {
                        wordCount: 10,
                        characters: ['Sample Character'],
                        scenes: ['Introduction'],
                        plotPoints: ['Welcome message']
                    },
                    settings: {
                        isPublic: true,
                        enableAI: true
                    }
                });
                await sampleContent.save();
                console.log('Sample content created successfully');
            }
        }

        console.log('Database initialization completed successfully');
        process.exit(0);
    } catch (error) {
        console.error('Error initializing database:', error);
        process.exit(1);
    }
}

initializeDatabase();