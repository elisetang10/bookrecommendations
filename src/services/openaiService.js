import OpenAI from 'openai';

class OpenAIService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.REACT_APP_OPENAI_API_KEY,
      dangerouslyAllowBrowser: true // Note: In production, use a backend API
    });
  }

  async getBookRecommendations(userProfile) {
    const prompt = this.createRecommendationPrompt(userProfile);
    
    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: `You are a friendly book recommendation assistant. Always:
            - Use emojis in responses
            - Format recommendations as bullet points
            - Include book title, author, and genre
            - Keep responses concise
            - Address user by their name
            - Be enthusiastic about books`
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 800,
        temperature: 0.9,
      });

      return response.choices[0].message.content;
    } catch (error) {
      console.error('Error getting recommendations:', error);
      return this.getFallbackRecommendations(userProfile);
    }
  }

  async getBookSummary(bookTitle, author) {
    const prompt = `Please provide a brief, engaging summary of "${bookTitle}" by ${author}. Keep it to 2-3 sentences and include what makes it appealing to readers. Use emojis to make it friendly.`;
    
    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are a helpful book assistant. Provide concise, engaging book summaries with emojis."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 200,
        temperature: 0.6,
      });

      return response.choices[0].message.content;
    } catch (error) {
      console.error('Error getting book summary:', error);
      return `📚 This is a fantastic book that many readers love! I'd recommend checking it out on Goodreads or Amazon for detailed reviews and summaries. 😊`;
    }
  }

  async handleGeneralQuestion(question, userProfile) {
    const prompt = `User ${userProfile.name} asks: "${question}". 
    
    Context about user:
    - Favorite genres: ${userProfile.genres.join(', ')}
    - Recent books: ${userProfile.recentBooks.join(', ')}
    - Favorite books: ${userProfile.favoriteBooks.join(', ')}
    - Favorite authors: ${userProfile.favoriteAuthors.join(', ')}
    
    Respond helpfully as a book recommendation assistant. Use emojis and keep it concise.`;
    
    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are a friendly book recommendation assistant. Always use emojis and address users by name."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 300,
        temperature: 0.7,
      });

      return response.choices[0].message.content;
    } catch (error) {
      console.error('Error handling general question:', error);
      return `Thanks for asking, ${userProfile.name}! 😊 Is there anything specific about books or reading recommendations I can help you with? 📚`;
    }
  }

  createRecommendationPrompt(userProfile) {
    return `Please recommend 3-5 books for ${userProfile.name} based on their preferences:

    Favorite Genres: ${userProfile.genres.join(', ')}
    Recent Books: ${userProfile.recentBooks.join(', ')}
    All-time Favorites: ${userProfile.favoriteBooks.join(', ')}
    Favorite Authors: ${userProfile.favoriteAuthors.join(', ')}
    Uses: ${userProfile.bookLoggingApp || 'No specific app mentioned'}

    Please format as:
    • **Book Title** by Author Name
      📖 Genre: [Genre]
    
    Keep it friendly, use emojis, and end by asking if they'd like to learn more about any book.`;
  }

  getFallbackRecommendations(userProfile) {
    return `Hi ${userProfile.name}! 😊 I'm having trouble connecting right now, but based on your love for ${userProfile.genres[0] || 'great books'}, here are some popular recommendations:

    • **The Seven Husbands of Evelyn Hugo** by Taylor Jenkins Reid
      📖 Genre: Contemporary Fiction

    • **Dune** by Frank Herbert  
      📖 Genre: Science Fiction

    • **The Thursday Murder Club** by Richard Osman
      📖 Genre: Mystery

    Would you like to learn more about any of these books? 🤔`;
  }

  // Helper to check if a message contains book interest
  isBookInterest(message) {
    const interestWords = ['like', 'love', 'interested', 'want to read', 'sounds good', 'tell me more'];
    return interestWords.some(word => message.toLowerCase().includes(word));
  }

  // Helper to extract book title from user message
  extractBookTitle(message, bookTitles) {
    return bookTitles.find(title => 
      message.toLowerCase().includes(title.toLowerCase())
    );
  }
}

// Export as default
export default OpenAIService;
