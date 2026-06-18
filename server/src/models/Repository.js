import mongoose from 'mongoose';

const { Schema } = mongoose;

const fileSchema = new Schema(
  {
    path: { type: String, required: true },
    language: { type: String, required: true },
    lineCount: { type: Number, required: true },
    size: { type: Number, required: true },
    content: { type: String, required: true },
  },
  { _id: false }
);

const repositorySchema = new Schema(
  {
    name: { type: String, required: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    description: { type: String },
    files: { type: [fileSchema], default: [] },
    meta: {
      owner:       { type: String },
      repo:        { type: String },
      branch:      { type: String },
      stars:       { type: Number },
      description: { type: String },
      language:    { type: String },
      url:         { type: String },
    },
  },
  { timestamps: true }
);

const Repository = mongoose.model('Repository', repositorySchema);
export default Repository;
