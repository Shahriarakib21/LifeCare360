import mongoose, { Schema, Document } from 'mongoose';

export interface ILabArticle extends Document {
    title: string;
    slug: string;
    content: string;
    category: string;
    imageUrl?: string;
    linkedTests: string[];
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const LabArticleSchema = new Schema<ILabArticle>(
    {
        title: {
            type: String,
            required: true,
            trim: true,
        },
        slug: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            lowercase: true,
        },
        content: {
            type: String,
            required: true,
            trim: true,
            // Approximately 80-120 words recommended by requirements
        },
        category: {
            type: String,
            required: true,
            enum: ['Awareness', 'Preparation', 'Understanding', 'Health Tips'],
            default: 'Awareness',
        },
        imageUrl: {
            type: String,
            trim: true,
        },
        linkedTests: [
            {
                type: String,
                trim: true,
            },
        ],
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
    }
);

LabArticleSchema.index({ slug: 1 });
LabArticleSchema.index({ category: 1 });

export default mongoose.models.LabArticle || mongoose.model<ILabArticle>('LabArticle', LabArticleSchema);
