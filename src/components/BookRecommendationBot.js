import React, { useState, useEffect, useRef } from 'react';
import { Send, Book, Sparkles, ExternalLink } from 'lucide-react';

const BookRecommendationBot = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [currentStep, setCurrentStep] = useState(0);
  const [userProfile, setUserProfile] = useState({
    name: '',
    genres: [],
    recentBooks: [],
    favoriteBooks: [],
    favoriteAuthors: [],
    bookLoggingApp: ''
  });
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const questions = [
    {
      id: 'name',
      text: "Hi there! 👋 I'm your personal book recommendation assistant. What's your name?",
      type: 'text'
    },
    {
      id: 'genres',
      text: "Nice to meet you, {name}! 📚 What are your favorite genres? You can select multiple:",
      type: 'multiple',
      options: ['Fiction', 'Non-Fiction', 'Mystery/Thriller', 'Romance', 'Sci-Fi', 'Fantasy', 'Biography', 'Self-Help', 'History', 'Poetry']
    },
    {
      id: 'recentBooks',
      text: "Great choices! 🎯 What are some books you've read recently? (Just list the titles)",
      type: 'text'
    },
    {
      id: 'favoriteBooks',
      text: "Thanks! And what are some of your all-time favorite books? ⭐",
      type: 'text'
    },
    {
      id: 'favoriteAuthors',
      text: "Perfect! Do you have any favorite authors? 👨‍💼👩‍💼",
      type: 'text'
    },
    {
      id: 'bookLoggingApp',
      text: "Last question! Do you use any book tracking apps like Goodreads, Fable, or StoryGraph? 📱",
      type: 'text'
    }
  ];

  const sampleBooks = [
    {
      title: "The Seven Husbands of Evelyn Hugo",
      author: "Taylor Jenkins Reid",
      genre: "Fiction",
      summary: "A reclusive Hollywood icon finally tells her life story to a young journalist, revealing secrets about her seven marriages and rise to fame.",
      amazonUrl: "https://amazon.com/dp/1501161938",
      goodreadsUrl: "https://goodreads.com/book/show/32620332"
    },
    {
      title: "Dune",
      author: "Frank Herbert",
      genre: "Sci-Fi",
      summary: "On the desert planet Arrakis, young Paul Atreides becomes embroiled in a struggle for control of the universe's most valuable substance.",
      amazonUrl: "https://amazon.com/dp/0441172717",
      goodreadsUrl: "https://goodreads.com/book/show/44767458"
    },
    {
      title: "The Thursday Murder Club",
      author: "Richard Osman",
      genre: "Mystery",
      summary: "Four retirees in a peaceful retirement village meet weekly to investigate cold cases, until they find themselves in the middle of their first live case.",
      amazonUrl: "https://amazon.com/dp/1984880241",
      goodreadsUrl: "https://goodreads.com/book/show/46000520"
    }
  ];

  useEffect(() => {
    // Start the conversation
    addBotMessage(questions[0].text);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const addBotMessage = (text, delay = 1000) => {
    setIsTyping(true);
    setTimeout(() => {
      setMessages(prev => [...prev, { text, sender: 'bot', timestamp: new Date() }]);
      setIsTyping(false);
    }, delay);
  };

  const addUserMessage = (text) => {
    setMessages(prev => [...prev, { text, sender: 'user', timestamp: new Date() }]);
  };

  const handleSend = () => {
    if (!input.trim()) return;

    addUserMessage(input);
    processUserInput(input);
    setInput('');
  };

  const processUserInput = (input) => {
    const currentQuestion = questions[currentStep];
    
    if (currentQuestion) {
      // Update user profile
      const updatedProfile = { ...userProfile };
      
      if (currentQuestion.id === 'name') {
        updatedProfile.name = input;
      } else if (currentQuestion.id === 'genres') {
        updatedProfile.genres = input.split(',').map(g => g.trim());
      } else if (currentQuestion.id === 'recentBooks') {
        updatedProfile.recentBooks = input.split(',').map(b => b.trim());
      } else if (currentQuestion.id === 'favoriteBooks') {
        updatedProfile.favoriteBooks = input.split(',').map(b => b.trim());
      } else if (currentQuestion.id === 'favoriteAuthors') {
        updatedProfile.favoriteAuthors = input.split(',').map(a => a.trim());
      } else if (currentQuestion.id === 'bookLoggingApp') {
        updatedProfile.bookLoggingApp = input;
      }
      
      setUserProfile(updatedProfile);
      
      // Move to next question or provide recommendations
      if (currentStep < questions.length - 1) {
        setCurrentStep(currentStep + 1);
        const nextQuestion = questions[currentStep + 1];
        const questionText = nextQuestion.text.replace('{name}', updatedProfile.name);
        addBotMessage(questionText);
      } else {
        // Finished questions, provide recommendations
        provideRecommendations(updatedProfile);
      }
    } else {
      // Handle general chat after setup
      handleGeneralChat(input);
    }
  };

  const handleGenreSelection = (selectedGenres) => {
    const genreText = selectedGenres.join(', ');
    addUserMessage(genreText);
    
    const updatedProfile = { ...userProfile, genres: selectedGenres };
    setUserProfile(updatedProfile);
    
    setCurrentStep(currentStep + 1);
    addBotMessage(questions[currentStep + 1].text);
  };

  const provideRecommendations = (profile) => {
    setTimeout(() => {
      const message = `Perfect, ${profile.name}! 🎉 Based on your preferences, here are some personalized recommendations:\n\n• **${sampleBooks[0].title}** by ${sampleBooks[0].author}\n  📖 Genre: ${sampleBooks[0].genre}\n\n• **${sampleBooks[1].title}** by ${sampleBooks[1].author}\n  📖 Genre: ${sampleBooks[1].genre}\n\n• **${sampleBooks[2].title}** by ${sampleBooks[2].author}\n  📖 Genre: ${sampleBooks[2].genre}\n\nWould you like to learn more about any of these books? Just type the book name! 😊`;
      
      addBotMessage(message);
    }, 1500);
  };

  const handleGeneralChat = (input) => {
    const lowerInput = input.toLowerCase();
    
    // Check if user is asking about a specific book
    const mentionedBook = sampleBooks.find(book => 
      lowerInput.includes(book.title.toLowerCase()) || 
      lowerInput.includes(book.author.toLowerCase())
    );
    
    if (mentionedBook) {
      if (lowerInput.includes('tell me more') || lowerInput.includes('learn more') || lowerInput.includes('summary')) {
        addBotMessage(`📚 **${mentionedBook.title}** by ${mentionedBook.author}\n\n${mentionedBook.summary}\n\nWould you like me to find links to purchase or add this to your reading list? 🔗`);
      } else if (lowerInput.includes('like') || lowerInput.includes('love') || lowerInput.includes('interested')) {
        addBotMessage(`Awesome! 🎉 I'm so glad you're interested in **${mentionedBook.title}**!\n\nHere are some links:\n• [Amazon](${mentionedBook.amazonUrl}) 🛒\n• [Goodreads](${mentionedBook.goodreadsUrl}) 📖\n\nWould you like more recommendations similar to this one? 😊`);
      } else {
        addBotMessage(`📖 **${mentionedBook.title}** by ${mentionedBook.author} - ${mentionedBook.genre}\n\nWould you like me to tell you more about this book or find similar recommendations? 🤔`);
      }
    } else {
      addBotMessage(`Thanks for chatting, ${userProfile.name}! 😊 Is there anything specific you'd like to know about the books I recommended, or would you like different suggestions? 📚`);
    }
  };

  return (
    <div className="flex flex-col h-screen max-w-2xl mx-auto bg-gradient-to-br from-purple-50 to-blue-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="bg-gradient-to-r from-purple-500 to-blue-500 p-2 rounded-full">
            <Book className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-gray-800">BookBot</h1>
            <p className="text-sm text-gray-500">Your Personal Reading Assistant</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => (
          <div key={index} className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl ${
              message.sender === 'user'
                ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white'
                : 'bg-white text-gray-800 shadow-md border border-gray-100'
            }`}>
              {message.sender === 'bot' && (
                <div className="flex items-center space-x-2 mb-2">
                  <Sparkles className="w-4 h-4 text-purple-500" />
                  <span className="text-xs font-medium text-purple-600">BookBot</span>
                </div>
              )}
              <div className="whitespace-pre-line">
                {message.text.split('\n').map((line, i) => {
                  if (line.includes('[Amazon]') || line.includes('[Goodreads]')) {
                    return (
                      <div key={i} className="flex items-center space-x-1 text-blue-600 hover:text-blue-800">
                        <ExternalLink className="w-3 h-3" />
                        <span className="cursor-pointer underline">{line}</span>
                      </div>
                    );
                  }
                  return <div key={i}>{line}</div>;
                })}
              </div>
            </div>
          </div>
        ))}
        
        {/* Genre selection for step 2 */}
        {currentStep === 1 && questions[currentStep].type === 'multiple' && (
          <div className="flex justify-start">
            <div className="bg-white p-4 rounded-2xl shadow-md border border-gray-100 max-w-md">
              <div className="grid grid-cols-2 gap-2">
                {questions[currentStep].options.map((genre) => (
                  <button
                    key={genre}
                    onClick={() => {
                      const currentGenres = userProfile.genres.includes(genre) 
                        ? userProfile.genres.filter(g => g !== genre)
                        : [...userProfile.genres, genre];
                      setUserProfile({...userProfile, genres: currentGenres});
                    }}
                    className={`p-2 text-sm rounded-lg border transition-colors ${
                      userProfile.genres.includes(genre)
                        ? 'bg-purple-100 border-purple-300 text-purple-700'
                        : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {genre}
                  </button>
                ))}
              </div>
              <button
                onClick={() => handleGenreSelection(userProfile.genres)}
                disabled={userProfile.genres.length === 0}
                className="w-full mt-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white py-2 px-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue with selected genres
              </button>
            </div>
          </div>
        )}

        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-white px-4 py-3 rounded-2xl shadow-md border border-gray-100">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 bg-white border-t border-gray-200">
        <div className="flex space-x-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type your message..."
            className="flex-1 px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className="bg-gradient-to-r from-purple-500 to-blue-500 text-white p-3 rounded-full hover:from-purple-600 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default BookRecommendationBot;

