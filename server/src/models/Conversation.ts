import mongoose, { Document, Model, Schema } from 'mongoose'

export interface IMessage {
  _id?: mongoose.Types.ObjectId
  sender: 'user' | 'assistant'
  text: string
  timestamp: Date
}

export interface IConversation extends Document {
  userId: mongoose.Types.ObjectId
  title: string
  language: 'en' | 'hi' | 'as'
  messages: IMessage[]
  contextReferences?: Record<string, unknown>
  createdAt: Date
  updatedAt: Date
}

const MessageSchema = new Schema<IMessage>(
  {
    sender: {
      type: String,
      enum: ['user', 'assistant'],
      required: true,
    },
    text: {
      type: String,
      required: true,
      trim: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true },
)

const ConversationSchema = new Schema<IConversation>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      default: 'Agricultural Consultation',
    },
    language: {
      type: String,
      enum: ['en', 'hi', 'as'],
      default: 'en',
    },
    messages: {
      type: [MessageSchema],
      default: [],
    },
    contextReferences: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  },
)

ConversationSchema.index({ userId: 1, updatedAt: -1 })

export const Conversation: Model<IConversation> =
  mongoose.models.Conversation ||
  mongoose.model<IConversation>('Conversation', ConversationSchema)

