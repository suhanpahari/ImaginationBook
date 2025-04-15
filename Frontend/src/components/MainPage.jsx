import React, { useState, useEffect } from 'react';
import { Book, LogOut, History, Star, Edit, Image, PlayCircle, Sparkles, Rocket, Zap } from 'lucide-react';
import { useNavigate } from "react-router-dom"
import { useSelector, useDispatch } from 'react-redux';
import { setUserEmail, setUserPassword, clearCredentials } from '../Redux/slices/user/user';


export default function ImaginationBookHome() {
  const [activeTab, setActiveTab] = useState('explore');
  const [animateBackground, setAnimateBackground] = useState(0);
  const navigate = useNavigate(); 
  
  const email = useSelector((state) => state.user.userEmail)
  const password = useSelector((state) => state.user.userPassword);

  if(!email && !password)
  {
    navigate("/") ; 
  }

  // Animated background effect
  useEffect(() => {
    const interval = setInterval(() => {
      setAnimateBackground(prev => (prev + 1) % 100);
    }, 100);
    return () => clearInterval(interval);
  }, []);
  
  // Sample draft data
  const draftItems = [
    { id: 1, title: "Space Adventure", type: "story", date: "Apr 8" },
    { id: 2, title: "Magic Forest", type: "art", date: "Apr 9" },
    { id: 3, title: "Dancing Dragons", type: "animation", date: "Apr 10" }
  ];

  return (
    <div className="relative min-h-screen overflow-hidden font-sans bg-white">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Animated color dots */}
        {[...Array(20)].map((_, i) => (
          <div 
            key={i}
            className="absolute rounded-full mix-blend-multiply"
            style={{
              left: `${(i * 7 + animateBackground) % 100}%`,
              top: `${(i * 13 + animateBackground/2) % 100}%`,
              width: `${20 + (i % 7) * 5}px`,
              height: `${20 + (i % 7) * 5}px`,
              backgroundColor: `hsl(${(i * 20) % 360}, 90%, 85%)`,
              filter: 'blur(8px)',
              opacity: 0.4,
              transform: `translateY(${Math.sin((animateBackground + i) / 10) * 10}px)`,
              transition: 'transform 0.5s ease-out'
            }}
          />
        ))}
        
        {/* Gradient waves */}
        <div className="absolute bottom-0 left-0 w-full h-20 opacity-10"
             style={{
               backgroundImage: 'linear-gradient(90deg, rgba(129,80,255,1) 0%, rgba(236,64,122,1) 50%, rgba(66,165,245,1) 100%)',
               backgroundSize: '200% 100%',
               backgroundPosition: `${animateBackground}% 0`,
               transition: 'background-position 0.5s ease-out'
             }}></div>
      </div>

      {/* 3D Floating Objects */}
      <div className="absolute transform top-1/4 left-10 -rotate-12 animate-float">
        <div className="w-16 h-16 transform rounded-lg shadow-xl bg-gradient-to-br from-blue-300 to-purple-300 perspective-800 rotateY-20 rotateX-10" 
             style={{boxShadow: '0 10px 30px -5px rgba(129,80,255,0.3), 0 5px 15px rgba(0, 0, 0, 0.1)'}}></div>
      </div>
      
      <div className="absolute transform bottom-1/3 right-10 rotate-12 animate-float-slow">
        <div className="w-12 h-12 rounded-full shadow-xl bg-gradient-to-br from-pink-300 to-purple-300" 
             style={{boxShadow: '0 10px 30px -5px rgba(236,64,122,0.3), 0 5px 15px rgba(0, 0, 0, 0.1)'}}></div>
      </div>

      {/* Header */}
      <header className="relative z-10 p-4 shadow-lg bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500">
        <div className="container flex items-center justify-between mx-auto">
          <div className="flex items-center space-x-3">
            <div className="p-2 transform bg-white rounded-full shadow-lg rotate-3">
              <Book className="text-purple-600" size={28} />
            </div>
            <div className="relative">
              <span className="text-3xl font-bold text-white">ImaginationBook</span>
              <Sparkles className="absolute text-yellow-300 -top-2 -right-6" size={16} />
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-pink-400 to-purple-500 animate-spin-slow opacity-70"></div>
              <img
                src="https://static.vecteezy.com/system/resources/previews/021/548/095/non_2x/default-profile-picture-avatar-user-avatar-icon-person-icon-head-icon-profile-picture-icons-default-anonymous-user-male-and-female-businessman-photo-placeholder-social-network-avatar-portrait-free-vector.jpg"
                alt="user"
                className="relative z-10 w-10 h-10 border-2 border-white rounded-full"
              />

              <span className="absolute bottom-0 right-0 z-20 w-3 h-3 bg-green-400 border-2 border-white rounded-full"></span>
            </div>
            <button className="text-white transition-colors hover:text-yellow-300">
              <LogOut size={22} />
            </button>
          </div>
        </div>
      </header>

      {/* Navigation Bar */}
      <nav className="sticky top-0 z-20 py-2 bg-white border-b border-purple-100 shadow-lg bg-opacity-80 backdrop-filter backdrop-blur-md">
        <div className="container flex justify-center mx-auto">
          <div className="flex p-1 space-x-2 bg-gray-100 rounded-full shadow-inner">
            <button 
              onClick={() => setActiveTab('explore')}
              className={`py-2 px-6 rounded-full flex items-center transition-all transform ${activeTab === 'explore' 
                ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-md scale-105' 
                : 'text-gray-600 hover:bg-gray-200'}`}
            >
              <Rocket size={18} className={`mr-2 ${activeTab === 'explore' ? 'animate-pulse' : ''}`} />
              Explore
            </button>
            <button 
              onClick={() => setActiveTab('history')}
              className={`py-2 px-6 rounded-full flex items-center transition-all transform ${activeTab === 'history' 
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md scale-105' 
                : 'text-gray-600 hover:bg-gray-200'}`}
            >
              <History size={18} className={`mr-2 ${activeTab === 'history' ? 'animate-pulse' : ''}`} />
              My Creations
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container relative z-10 p-4 pt-8 mx-auto">
        {/* Welcome Banner */}
        {activeTab === 'explore' && (
          <div className="relative p-6 mb-8 overflow-hidden text-white transition-all transform shadow-xl bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-3xl hover:scale-102">
            <div className="absolute -right-10 -top-10 opacity-20">
              <div className="w-40 h-40 bg-white rounded-full filter blur-xl"></div>
            </div>
            <div className="absolute -bottom-8 -left-8 opacity-20">
              <div className="w-32 h-32 bg-yellow-300 rounded-full filter blur-xl"></div>
            </div>
            <div className="relative z-10 flex flex-col items-center justify-between md:flex-row">
              <div>
                <h1 className="flex items-center mb-2 text-3xl font-bold md:text-4xl">
                  Welcome, Space Explorer! <Sparkles className="ml-2 text-yellow-300 animate-pulse" size={24} />
                </h1>
                <p className="mb-4 text-lg">Ready to blast off into a galaxy of imagination?</p>
                <button className="flex items-center px-8 py-3 font-bold text-purple-600 transition-all transform bg-white rounded-full shadow-lg hover:shadow-xl hover:scale-105">
                  <Zap className="mr-2" size={18} />
                  Start Creating
                </button>
              </div>
              <div className="mt-4 md:mt-0">
                <div className="relative w-32 h-32">
                  <div className="absolute inset-0 rounded-full opacity-50 bg-gradient-to-br from-yellow-300 to-pink-500 animate-pulse-slow"></div>
                  <div className="absolute flex items-center justify-center bg-white rounded-full inset-4 bg-opacity-20 backdrop-filter backdrop-blur-sm">
                    <Star className="text-yellow-300" size={48} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Canvas Templates Section */}
        {activeTab === 'explore' && (
          <div className="grid grid-cols-1 gap-6 mb-8 md:grid-cols-3">
            {/* Story Canvas */}
            <div className="overflow-hidden transition-all transform bg-white border border-blue-100 shadow-xl cursor-pointer group rounded-3xl hover:scale-105">
              <div className="relative flex items-center justify-center h-48 overflow-hidden bg-gradient-to-br from-blue-100 to-blue-50">
                <div className="absolute inset-0 transition-opacity transform scale-110 translate-x-20 skew-x-12 bg-blue-200 opacity-20 group-hover:opacity-30 rotate-12 group-hover:translate-x-0"></div>
                <div className="absolute bottom-0 right-0 w-20 h-20 bg-yellow-300 rounded-full opacity-10 filter blur-md"></div>
                <div className="relative z-10 p-6 transition-transform transform rounded-full shadow-lg bg-gradient-to-br from-blue-500 to-blue-600 group-hover:rotate-12">
                  <Edit size={48} className="text-white" />
                </div>
              </div>
              <div className="p-6">
                <h3 className="flex items-center mb-2 text-xl font-bold text-blue-600">
                  Create Stories
                  <Sparkles className="ml-2 text-yellow-500" size={16} />
                </h3>
                <p className="text-gray-600">Write your story and watch it transform into magical animations and illustrations!</p>
                <div className="flex justify-end mt-4">
                  <button 
                    onClick={() => navigate("/board1")}
                    className="flex items-center px-6 py-2 text-sm text-white transition-all transform bg-blue-500 rounded-full shadow-lg hover:bg-blue-400 hover:scale-105"
                  >
                    <Zap className="mr-1" size={14} />
                    Open Canvas
                  </button>
                </div>
              </div>
            </div>

            {/* Art Canvas */}
            <div className="overflow-hidden transition-all transform bg-white border border-purple-100 shadow-xl cursor-pointer group rounded-3xl hover:scale-105">
              <div className="relative flex items-center justify-center h-48 overflow-hidden bg-gradient-to-br from-purple-100 to-purple-50">
                <div className="absolute inset-0 transition-opacity transform scale-110 -translate-x-20 skew-x-12 bg-purple-200 opacity-20 group-hover:opacity-30 -rotate-12 group-hover:translate-x-0"></div>
                <div className="absolute top-0 left-0 w-20 h-20 bg-pink-300 rounded-full opacity-10 filter blur-md"></div>
                <div className="relative z-10 p-6 transition-transform transform rounded-full shadow-lg bg-gradient-to-br from-purple-500 to-purple-600 group-hover:-rotate-12">
                  <Image size={48} className="text-white" />
                </div>
              </div>
              <div className="p-6">
                <h3 className="flex items-center mb-2 text-xl font-bold text-purple-600">
                  See AI Art
                  <Sparkles className="ml-2 text-yellow-500" size={16} />
                </h3>
                <p className="text-gray-600">Describe what you imagine and watch as AI creates amazing artwork from your ideas!</p>
                <div className="flex justify-end mt-4">
                  <button 
                    onClick={() => navigate("/board2")}
                    className="flex items-center px-6 py-2 text-sm text-white transition-all transform bg-purple-500 rounded-full shadow-lg hover:bg-purple-400 hover:scale-105"
                  >
                    <Zap className="mr-1" size={14} />
                    Open Canvas
                  </button>
                </div>
              </div>
            </div>

            {/* Animation Canvas */}
            <div className="overflow-hidden transition-all transform bg-white border border-pink-100 shadow-xl cursor-pointer group rounded-3xl hover:scale-105">
              <div className="relative flex items-center justify-center h-48 overflow-hidden bg-gradient-to-br from-pink-100 to-pink-50">
                <div className="absolute inset-0 transition-opacity transform scale-110 translate-y-10 skew-y-6 bg-pink-200 opacity-20 group-hover:opacity-30 rotate-6 group-hover:translate-y-0"></div>
                <div className="absolute w-16 h-16 bg-yellow-300 rounded-full bottom-4 right-4 opacity-10 filter blur-md"></div>
                <div className="relative z-10 p-6 transition-transform transform rounded-full shadow-lg bg-gradient-to-br from-pink-500 to-pink-600 group-hover:rotate-6">
                  <PlayCircle size={48} className="text-white" />
                </div>
              </div>
              <div className="p-6">
                <h3 className="flex items-center mb-2 text-xl font-bold text-pink-600">
                  Animated Magic
                  <Sparkles className="ml-2 text-yellow-500" size={16} />
                </h3>
                <p className="text-gray-600">Create amazing moving stories with sounds and music that bring your ideas to life!</p>
                <div className="flex justify-end mt-4">
                  <button 
                    onClick={() => navigate("/board3")}
                    className="flex items-center px-6 py-2 text-sm text-white transition-all transform bg-pink-500 rounded-full shadow-lg hover:bg-pink-400 hover:scale-105"
                  >
                    <Zap className="mr-1" size={14} />
                    Open Canvas
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* History/Drafts Section */}
        {activeTab === 'history' && (
          <div className="p-6 bg-white border border-purple-100 shadow-xl rounded-3xl">
            <h2 className="flex items-center mb-6 text-2xl font-bold text-purple-600">
              <Star className="mr-2 text-yellow-500" size={24} />
              My Magical Creations
            </h2>
            
            {draftItems.length > 0 ? (
              <div className="space-y-4">
                {draftItems.map(draft => (
                  <div key={draft.id} className="flex items-center justify-between p-4 transition-all transform border border-gray-200 cursor-pointer bg-gray-50 rounded-2xl hover:bg-gray-100 hover:scale-102 hover:shadow-md">
                    <div className="flex items-center">
                      <div className={`p-4 rounded-full mr-4 shadow-inner ${
                        draft.type === 'story' ? 'bg-gradient-to-br from-blue-500 to-blue-400' : 
                        draft.type === 'art' ? 'bg-gradient-to-br from-purple-500 to-purple-400' : 
                        'bg-gradient-to-br from-pink-500 to-pink-400'
                      }`}>
                        {draft.type === 'story' ? <Edit size={24} className="text-white" /> : 
                         draft.type === 'art' ? <Image size={24} className="text-white" /> : 
                         <PlayCircle size={24} className="text-white" />}
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-800">{draft.title}</h3>
                        <p className="text-sm text-gray-500">Last edited: {draft.date}</p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button className="flex items-center px-6 py-2 text-sm text-white transition-all transform rounded-full shadow-md bg-gradient-to-r from-purple-500 to-pink-500 hover:shadow-lg hover:scale-105">
                        <Zap className="mr-1" size={14} />
                        Continue
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center">
                <div className="inline-block p-8 mb-4 rounded-full shadow-lg bg-gradient-to-br from-purple-500 to-pink-500">
                  <History size={64} className="text-white" />
                </div>
                <h3 className="text-2xl font-medium text-gray-800">No creations yet</h3>
                <p className="mb-6 text-gray-600">Your adventure is just beginning!</p>
                <button 
                  onClick={() => setActiveTab('explore')}
                  className="px-8 py-3 text-white transition-all transform rounded-full shadow-lg bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 hover:shadow-xl hover:scale-105"
                >
                  Start Your First Creation
                </button>
              </div>
            )}
          </div>
        )}

        {/* Featured Creations (visible in Explore tab) */}
        {activeTab === 'explore' && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="flex items-center text-2xl font-bold text-gray-800">
                <Star className="mr-2 text-yellow-500" size={24} />
                Featured Space Creations
              </h2>
              <button className="px-4 py-2 text-sm font-medium text-purple-600 bg-gray-100 rounded-full hover:bg-gray-200">
                See All
              </button>
            </div>
            
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="overflow-hidden transition-all transform bg-white border border-blue-100 shadow-lg cursor-pointer rounded-2xl hover:shadow-xl hover:scale-105">
                  <div className="relative overflow-hidden h-36 bg-gradient-to-br from-blue-100 to-purple-100">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-full h-full bg-white bg-opacity-10" 
                           style={{
                             backgroundImage: `radial-gradient(circle at ${50 + (i*10)}% ${30 + (i*15)}%, rgba(129,80,255,0.4) 0%, rgba(129,80,255,0) 60%)`
                           }}></div>
                    </div>
                    <div className="absolute bottom-2 right-2">
                      <Sparkles className="text-yellow-500" size={16} />
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-gray-800 truncate">Cosmic Journey #{i}</h3>
                    <p className="text-sm text-purple-600">By Space Explorer #{i}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Floating Action Button */}
      <div className="fixed z-30 bottom-8 right-8">
        <button className="relative p-4 text-white transition-all transform rounded-full shadow-lg bg-gradient-to-r from-purple-500 to-pink-500 hover:shadow-xl hover:scale-110">
          <div className="absolute inset-0 bg-pink-400 rounded-full animate-ping-slow opacity-30"></div>
          <Rocket size={24} className="animate-slight-shake" />
        </button>
      </div>

      {/* Global CSS for custom animations */}
      <style jsx global>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(-12deg); }
          50% { transform: translateY(-15px) rotate(-8deg); }
        }
        @keyframes float-slow {
          0%, 100% { transform: translateY(0) rotate(12deg); }
          50% { transform: translateY(-10px) rotate(16deg); }
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 0.8; }
        }
        @keyframes ping-slow {
          0% { transform: scale(1); opacity: 0.8; }
          75%, 100% { transform: scale(1.5); opacity: 0; }
        }
        @keyframes slight-shake {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(3deg); }
          75% { transform: rotate(-3deg); }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        .animate-float-slow {
          animation: float-slow 8s ease-in-out infinite;
        }
        .animate-spin-slow {
          animation: spin-slow 10s linear infinite;
        }
        .animate-pulse-slow {
          animation: pulse-slow 3s ease-in-out infinite;
        }
        .animate-ping-slow {
          animation: ping-slow 2s cubic-bezier(0, 0, 0.2, 1) infinite;
        }
        .animate-slight-shake {
          animation: slight-shake 2s ease-in-out infinite;
        }
        .hover\:scale-102:hover {
          transform: scale(1.02);
        }
        .hover\:scale-105:hover {
          transform: scale(1.05);
        }
        .perspective-800 {
          perspective: 800px;
        }
        .rotateY-20 {
          transform: rotateY(20deg);
        }
        .rotateX-10 {
          transform: rotateX(10deg);
        }
      `}</style>
    </div>
  );
}