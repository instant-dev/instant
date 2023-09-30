import OpenAI from 'openai';
const openai = new OpenAI({apiKey: process.env.OPENAI_API_KEY});

export const plugin = async (Instant) => {
  Instant.Vectors.setEngine(async (values) => {
    const embedding = await openai.embeddings.create({
      model: 'text-embedding-ada-002',
      input: values,
    });
    return embedding.data.map((entry, i) => entry.embedding);
  });
};