import React, { useState, useEffect, useRef } from 'react';
import { Send, Book, Sparkles, ExternalLink } from 'lucide-react';
import OpenAIService from '../services/openaiService';

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
  const [recommendedBooks, setRecommendedBooks] = useState([]);
  const [setupComplete, setSetupComplete] = useState(false);
  const [showGenreSelector, setShowGenreSelector] = useState(false);
  const messagesEndRef = useRef(null);
  const openAIService = useRef(new OpenAIService());

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
      options: ['Fiction', 'Non-Fiction', 'Mystery/Thriller', 'Romance', 'Sci-Fi', 'Fantasy', 'Biography', 'Self-Help', 'History', 'Poetry', 'Horror', 'Adventure', 'Young Adult', 'Classics']
    },
    {
      id: 'recentBooks',
      text: "Great choices! 🎯 What are some books you've read recently? (Just list the titles, separated by commas)",
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

  useEffect(() => {
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

  const handleSend = async () => {
    if (!input.trim()) return;

    addUserMessage(input);
    
    if (!setupComplete) {
      await processSetupInput(input);
    } else {
      await handlePostSetupChat(input);
    }
    
    setInput('');
  };

  const processSetupInput = async (input) => {
    const currentQuestion = questions[currentStep];
    const updatedProfile = { ...userProfile };
    
    if (currentQuestion.id === 'name') {
      updatedProfile.name = input.trim();
    } else if (currentQuestion.id === 'genres') {
      updatedProfile.genres = input.split(',').map(g => g.trim()).filter(g => g);
    } else if (currentQuestion.id === 'recentBooks') {
      updatedProfile.recentBooks = input.split(',').map(b => b.trim()).filter(b => b);
    } else if (currentQuestion.id === 'favoriteBooks') {
      updatedProfile.favoriteBooks = input.split(',').map(b => b.trim()).filter(b => b);
    } else if (currentQuestion.id === 'favoriteAuthors') {
      updatedProfile.favoriteAuthors = input.split(',').map(a => a.trim()).filter(a => a);
    } else if (currentQuestion.id === 'bookLoggingApp') {
      updatedProfile.bookLoggingApp = input.trim();
    }
    
    setUserProfile(updatedProfile);
    
    if (currentStep < questions.length - 1) {
      setCurrentStep(currentStep + 1);
      const nextQuestion = questions[currentStep + 1];
      const questionText = nextQuestion.text.replace('{name}', updatedProfile.name);
      
      if (nextQuestion.type === 'multiple') {
        setShowGenreSelector(true);
      }
      
      addBotMessage(questionText);
    } else {
      setSetupComplete(true);
      await getAIRecommendations(updatedProfile);
    }
  };

  const getAIRecommendations = async (profile) => {
    setIsTyping(true);
    
    try {
      const recommendations = await openAIService.current.getBookRecommendations(profile);
      
      setTimeout(() => {
        setMessages(prev => [...prev, { 
          text: recommendations, 
          sender: 'bot', 
          timestamp: new Date() 
        }]);
        setIsTyping(false);
      }, 1500);

      extractBooksFromRecommendations(recommendations);
      
      setTimeout(() => {
        setMessages(prev => [...prev, { 
          text: "Quick actions:", 
          sender: 'bot', 
          timestamp: new Date(),
          type: 'quick-actions'
        }]);
      }, 2000);
      
    } catch (error) {
      console.error('Error getting recommendations:', error);
      addBotMessage(`Sorry ${profile.name}, I'm having trouble getting recommendations right now. Let me try again in a moment! 😅`);
    }
  };

  const extractBooksFromRecommendations = (recommendations) => {
    const books = [];
    
    const boldMatches = recommendations.match(/\*\*(.*?)\*\*/g);
    if (boldMatches) {
      books.push(...boldMatches.map(match => match.replace(/\*\*/g, '').trim()));
    }
    
    const bulletMatches = recommendations.match(/•\s*(.+?)(?:by|📖)/gi);
    if (bulletMatches) {
      books.push(...bulletMatches.map(match => 
        match.replace(/•\s*/, '').replace(/by.*$/i, '').replace(/📖.*$/i, '').trim()
      ));
    }
    
    const uniqueBooks = [...new Set(books.filter(book => book && book.length > 0))];
    setRecommendedBooks(uniqueBooks);
  };

  const handlePostSetupChat = async (input) => {
    const lowerInput = input.toLowerCase();
    
    const mentionedBook = recommendedBooks.find(book => 
      lowerInput.includes(book.toLowerCase())
    );
    
    if (mentionedBook) {
      await handleBookSpecificQuery(mentionedBook, input);
    } else if (lowerInput.includes('more recommendations') || lowerInput.includes('different books') || 
               lowerInput.includes('other suggestions') || lowerInput.includes('new recommendations')) {
      await getAIRecommendations(userProfile);
    } else {
      await handleGeneralQuery(input);
    }
  };

  const handleBookSpecificQuery = async (bookTitle, userInput) => {
    const lowerInput = userInput.toLowerCase();
    
    // PRIORITY 1: Check for link requests FIRST
    if (lowerInput.includes('link') || lowerInput.includes('buy') || lowerInput.includes('purchase') || 
        lowerInput.includes('amazon') || lowerInput.includes('goodreads') || lowerInput.includes('where to get') ||
        lowerInput.includes('find it') || lowerInput.includes('get this book') || lowerInput.includes('where can i')) {
      
      const amazonUrl = `https://amazon.com/s?k=${encodeURIComponent(bookTitle)}`;
      const goodreadsUrl = `https://goodreads.com/search?q=${encodeURIComponent(bookTitle)}`;
      
      addBotMessage(`Perfect! Here are the links for **${bookTitle}**: 🔗\n\n• [Buy on Amazon](${amazonUrl}) 🛒\n• [View on Goodreads](${goodreadsUrl}) 📖\n\nNeed anything else, ${userProfile.name}? 😊`);
      return;
    }
    
    // PRIORITY 2: Check for summary/info requests
    if (lowerInput.includes('tell me more') || lowerInput.includes('learn more') || 
        lowerInput.includes('summary') || lowerInput.includes('about this book') || 
        lowerInput.includes('what is it about') || lowerInput.includes('more about') ||
        lowerInput.includes('tell me about')) {
      
      setIsTyping(true);
      
      try {
        const summary = await openAIService.current.getBookSummary(bookTitle, 'the author');
        
        setTimeout(() => {
          const amazonUrl = `https://amazon.com/s?k=${encodeURIComponent(bookTitle)}`;
          const goodreadsUrl = `https://goodreads.com/search?q=${encodeURIComponent(bookTitle)}`;
          
          const response = `📚 **${bookTitle}**\n\n${summary}\n\nWant to get this book? 🔗\n• [Buy on Amazon](${amazonUrl}) 🛒\n• [View on Goodreads](${goodreadsUrl}) 📖`;
          
          setMessages(prev => [...prev, { 
            text: response, 
            sender: 'bot', 
            timestamp: new Date() 
          }]);
          setIsTyping(false);
        }, 1000);
        
      } catch (error) {
        const amazonUrl = `https://amazon.com/s?k=${encodeURIComponent(bookTitle)}`;
        const goodreadsUrl = `https://goodreads.com/search?q=${encodeURIComponent(bookTitle)}`;
        addBotMessage(`Here's what I know about **${bookTitle}** - it's a fantastic read! 📚\n\n🔗 Links:\n• [Amazon](${amazonUrl})\n• [Goodreads](${goodreadsUrl})`);
      }
      return;
    }
    
    // PRIORITY 3: Check for interest/positive response
    if (lowerInput.includes('like') || lowerInput.includes('love') || lowerInput.includes('interested') || 
        lowerInput.includes('sounds good') || lowerInput.includes('want to read') || 
        lowerInput.includes('sounds interesting')) {
      
      const amazonUrl = `https://amazon.com/s?k=${encodeURIComponent(bookTitle)}`;
      const goodreadsUrl = `https://goodreads.com/search?q=${encodeURIComponent(bookTitle)}`;
      
      addBotMessage(`Awesome choice, ${userProfile.name}! 🎉 **${bookTitle}** is a great pick!\n\nHere are some links:\n• [Buy on Amazon](${amazonUrl}) 🛒\n• [View on Goodreads](${goodreadsUrl}) 📖\n\nWould you like more recommendations similar to this one? 😊`);
      return;
    }
    
    // Default response
    addBotMessage(`📖 **${bookTitle}** is an excellent choice! Would you like me to:\n\n• Tell you more about this book 📝\n• Find links to purchase it 🔗\n• Get similar recommendations 📚\n\nJust let me know! 😊`);
  };

  const handleGeneralQuery = async (input) => {
    const lowerInput = input.toLowerCase();
    
    // Check for general link requests
    if (lowerInput.includes('link') || lowerInput.includes('buy') || lowerInput.includes('purchase') || 
        lowerInput.includes('amazon') || lowerInput.includes('goodreads')) {
      
      if (recommendedBooks.length > 0) {
        let linksMessage = `Here are links for all my recommendations, ${userProfile.name}! 🔗\n\n`;
        
        recommendedBooks.slice(0, 3).forEach((book) => {
          const amazonUrl = `https://amazon.com/s?k=${encodeURIComponent(book)}`;
          const goodreadsUrl = `https://goodreads.com/search?q=${encodeURIComponent(book)}`;
          linksMessage += `**${book}**:\n• [Amazon](${amazonUrl}) 🛒\n• [Goodreads](${goodreadsUrl}) 📖\n\n`;
        });
        
        linksMessage += `Which one interests you most? 😊`;
        addBotMessage(linksMessage);
        return;
      } else {
        addBotMessage(`I'd be happy to help you find links! 🔗 Could you tell me which book you're interested in? Or would you like me to give you some recommendations first? 📚`);
        return;
      }
    }
    
    // For other questions, use AI
    setIsTyping(true);
    
    try {
      const response = await openAIService.current.handleGeneralQuestion(input, userProfile);
      
      setTimeout(() => {
        setMessages(prev => [...prev, { 
          text: response, 
          sender: 'bot', 
          timestamp: new Date() 
        }]);
        setIsTyping(false);
      }, 1000);
      
    } catch (error) {
      addBotMessage(`Thanks for chatting, ${userProfile.name}! 😊 Is there anything specific about books or reading recommendations I can help you with? 📚`);
    }
  };

  const handleGenreSelection = (selectedGenres) => {
    const genreText = selectedGenres.join(', ');
    addUserMessage(genreText);
    
    const updatedProfile = { ...userProfile, genres: selectedGenres };
    setUserProfile(updatedProfile);
    
    setShowGenreSelector(false);
    setCurrentStep(currentStep + 1);
    addBotMessage(questions[currentStep + 1].text);
  };

  const formatMessageWithLinks = (text) => {
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = linkRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index));
      }
      
      parts.push(
        <a 
          key={match.index} 
          href={match[2]} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-800 underline inline-flex items-center"
        >
          {match[1]} <ExternalLink className="w-3 h-3 ml-1" />
        </a>
      );
      
      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }

    return parts.length > 1 ? parts : text;
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
            <h1 className="text-xl font-semibold text-gray-800">BookBot AI</h1>
            <p className="text-sm text-gray-500">
              {setupComplete ? `Chatting with ${userProfile.name}` : 'Getting to know you...'}
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => (
          <div key={index}>
            {/* Regular Message */}
            {!message.type && (
              <div className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl ${
                  message.sender === 'user'
                    ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white'
                    : 'bg-white text-gray-800 shadow-md border border-gray-100'
                }`}>
                  {message.sender === 'bot' && (
                    <div className="flex items-center space-x-2 mb-2">
                      <Sparkles className="w-4 h-4 text-purple-500" />
                      <span className="text-xs font-medium text-purple-600">BookBot AI</span>
                    </div>
                  )}
                  <div className="whitespace-pre-line">
                    {message.text.split('\n').map((line, i) => (
                      <div key={i}>
                        {typeof formatMessageWithLinks(line) === 'object' ? 
                          formatMessageWithLinks(line) : line}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
            
            {/* Quick Action Buttons */}
            {message.type === 'quick-actions' && (
              <div className="flex justify-start">
                <div className="bg-white p-3 rounded-2xl shadow-md border border-gray-100">
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setInput("I want links for all books")}
                      className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                    >
                      Get Links 🔗
                    </button>
                    <button
                      onClick={() => {
                        if (recommendedBooks.length > 0) {
                          setInput(`Tell me more about ${recommendedBooks[0]}`);
                        }
                      }}
                      className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                    >
                      Learn More 📚
                    </button>
                    <button
                      onClick={() => setInput("Give me different recommendations")}
                      className="px-3 py-1 text-sm bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors"
                    >
                      Different Books 🔄
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
        
        {/* Genre Selection - Only show during step 1 setup */}
        {showGenreSelector && currentStep === 1 && !setupComplete && (
          <div className="flex justify-start">
            <div className="bg-white p-4 rounded-2xl shadow-md border border-gray-100 max-w-md">
              <div className="grid grid-cols-2 gap-2">
                {questions[1].options.map((genre) => (
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
                className="w-full mt-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white py-2 px-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:from-purple-600 hover:to-blue-600 transition-colors"
              >
                Continue with selected genres ({userProfile.genres.length})
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
            placeholder={setupComplete ? "Ask about books or request new recommendations..." : "Type your answer..."}
            className="flex-1 px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
            disabled={isTyping}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isTyping}
            className="bg-gradient-to-r from-purple-500 to-blue-500 text-white p-3 rounded-full hover:from-purple-600 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
        
        {!setupComplete && (
          <p className="text-xs text-gray-500 mt-2 text-center">
            Step {currentStep + 1} of {questions.length}
          </p>
        )}
      </div>
    </div>
  );
};

export default BookRecommendationBot;

