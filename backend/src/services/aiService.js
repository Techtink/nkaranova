import OpenAI from 'openai';

class AIService {
  constructor() {
    this.openai = null;
    this.initialized = false;
  }

  initialize() {
    if (this.initialized) return;

    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
      });
      this.initialized = true;
    } else {
      console.log('OpenAI service not configured - AI features will use fallback');
    }
  }

  async findTailors(query, tailors) {
    this.initialize();

    if (!this.openai) {
      // Fallback: simple keyword matching
      return this.fallbackSearch(query, tailors);
    }

    try {
      // Prepare tailor data for AI
      const tailorSummaries = tailors.map(t => ({
        id: t._id.toString(),
        username: t.username,
        businessName: t.businessName,
        bio: t.bio,
        specialties: t.specialties,
        location: t.location,
        rating: t.averageRating,
        reviewCount: t.reviewCount,
        isVerified: t.verificationStatus === 'approved'
      }));

      const prompt = `You are a helpful assistant for a tailor marketplace. A customer is looking for a tailor with the following request:

"${query}"

Here are the available tailors:
${JSON.stringify(tailorSummaries, null, 2)}

Analyze the customer's request and rank the tailors by relevance. Return a JSON array of tailor IDs in order of best match to worst match. Only include tailors that are at least somewhat relevant. If none are relevant, return an empty array.

Consider:
- Specialties matching the request
- Location preferences if mentioned
- Experience level for complex requests
- Verification status for trust

Return ONLY a JSON array of IDs, nothing else. Example: ["id1", "id2", "id3"]`;

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 500
      });

      const response = completion.choices[0].message.content.trim();

      try {
        const rankedIds = JSON.parse(response);
        return rankedIds;
      } catch {
        console.error('Failed to parse AI response:', response);
        return this.fallbackSearch(query, tailors);
      }
    } catch (error) {
      console.error('AI search error:', error);
      return this.fallbackSearch(query, tailors);
    }
  }

  async getRecommendations(user, browsingHistory, tailors) {
    this.initialize();

    if (!this.openai) {
      // Fallback: return top-rated tailors
      return tailors
        .sort((a, b) => b.averageRating - a.averageRating)
        .slice(0, 5)
        .map(t => t._id.toString());
    }

    try {
      const prompt = `You are a recommendation engine for a tailor marketplace. Based on a user's browsing history, suggest tailors they might like.

User's browsing history (tailors they've viewed):
${JSON.stringify(browsingHistory, null, 2)}

Available tailors:
${JSON.stringify(tailors.map(t => ({
        id: t._id.toString(),
        username: t.username,
        specialties: t.specialties,
        location: t.location,
        rating: t.averageRating
      })), null, 2)}

Based on patterns in their browsing (specialties, locations, styles), recommend up to 5 tailors they haven't viewed yet. Return ONLY a JSON array of tailor IDs. Example: ["id1", "id2"]`;

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.5,
        max_tokens: 200
      });

      const response = completion.choices[0].message.content.trim();

      try {
        return JSON.parse(response);
      } catch {
        return tailors.slice(0, 5).map(t => t._id.toString());
      }
    } catch (error) {
      console.error('AI recommendation error:', error);
      return tailors.slice(0, 5).map(t => t._id.toString());
    }
  }

  fallbackSearch(query, tailors) {
    const queryLower = query.toLowerCase();
    const keywords = queryLower.split(/\s+/);

    const scored = tailors.map(tailor => {
      let score = 0;

      // Check specialties
      tailor.specialties?.forEach(specialty => {
        keywords.forEach(keyword => {
          if (specialty.toLowerCase().includes(keyword)) {
            score += 3;
          }
        });
      });

      // Check bio
      if (tailor.bio) {
        keywords.forEach(keyword => {
          if (tailor.bio.toLowerCase().includes(keyword)) {
            score += 1;
          }
        });
      }

      // Check location
      if (tailor.location) {
        const locationStr = `${tailor.location.city} ${tailor.location.state} ${tailor.location.country}`.toLowerCase();
        keywords.forEach(keyword => {
          if (locationStr.includes(keyword)) {
            score += 2;
          }
        });
      }

      // Boost verified tailors
      if (tailor.verificationStatus === 'approved') {
        score += 0.5;
      }

      // Boost by rating
      score += (tailor.averageRating || 0) * 0.2;

      return { id: tailor._id.toString(), score };
    });

    return scored
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .map(item => item.id);
  }
}

export default new AIService();
