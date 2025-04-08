import { useState } from 'react';
import { BookOpen, Brush, Clock, Home, Star, Users } from 'lucide-react';

export default function MainPage() {
  const [currentPage, setCurrentPage] = useState('home');

  // Canvas template data
  const canvasTemplates = [
    {
      id: 1,
      title: "Story Adventure",
      description: "Turn your stories into magical animated scenes!",
      color: "bg-purple-500",
      icon: <BookOpen className="w-8 h-8 text-white" />
    },
    {
      id: 2,
      title: "Poetry Painter",
      description: "Watch your poems transform into beautiful artwork!",
      color: "bg-pink-500",
      icon: <Brush className="w-8 h-8 text-white" />
    },
    {
      id: 3,
      title: "3D Dream World",
      description: "Create amazing 3D worlds from your imagination!",
      color: "bg-blue-500",
      icon: <Star className="w-8 h-8 text-white" />
    },
    {
      id: 4,
      title: "Animation Studio",
      description: "Bring your characters to life with animations!",
      color: "bg-green-500",
      icon: <Users className="w-8 h-8 text-white" />
    }
  ];

  // Navigation links
  const navLinks = [
    { name: 'Home', icon: <Home />, target: 'home' },
    { name: 'Canvas', icon: <Brush />, target: 'canvas' },
    { name: 'How It Works', icon: <Star />, target: 'how-it-works' },
    { name: 'History', icon: <Clock />, target: 'history' }
  ];

  return (
    <div className="min-h-screen font-sans bg-blue-50">
      {/* Header & Navigation */}
      <header className="shadow-md bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">
        <div className="container px-4 py-4 mx-auto">
          {/* Logo */}
          <div className="flex items-center justify-center mb-4">
            <div className="p-2 mr-3 bg-white rounded-full shadow-md">
              <BookOpen className="w-8 h-8 text-purple-600" />
            </div>
            <h1 className="text-3xl font-bold text-white md:text-4xl drop-shadow-md">
              ImaginationBook
            </h1>
          </div>
          
          {/* Navigation */}
          <nav className="max-w-3xl mx-auto bg-white rounded-full bg-opacity-20">
            <ul className="flex justify-center p-1 space-x-1 md:space-x-4">
              {navLinks.map((link) => (
                <li key={link.name}>
                  <button
                    onClick={() => setCurrentPage(link.target)}
                    className={`flex items-center space-x-1 px-3 py-2 rounded-full text-white transition-all ${
                      currentPage === link.target 
                        ? 'bg-white bg-opacity-30 shadow-md' 
                        : 'hover:bg-white hover:bg-opacity-20'
                    }`}
                  >
                    <span className="hidden md:block">{link.icon}</span>
                    <span>{link.name}</span>
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main>
        {/* Hero Section */}
        {currentPage === 'home' && (
          <>
            <section className="relative py-16 overflow-hidden md:py-24">
              <div className="absolute inset-0 z-0 bg-indigo-600 opacity-90"></div>
              <div className="container relative z-10 px-4 mx-auto text-center text-white">
                <h2 className="mb-4 text-3xl font-bold md:text-5xl">Where Words Come to Life!</h2>
                <p className="max-w-2xl mx-auto mb-8 text-lg md:text-xl">
                  Write your stories and poems, then watch as our AI transforms them into beautiful images, 
                  3D scenes, and animations! Perfect for kids and creative minds of all ages.
                </p>
                <button 
                  onClick={() => setCurrentPage('canvas')}
                  className="px-8 py-3 font-bold text-white transition-all transform bg-pink-500 rounded-full shadow-lg hover:bg-pink-600 hover:-translate-y-1"
                >
                  Start Creating
                </button>
              </div>
            </section>

            {/* Canvas Templates Section */}
            <section className="px-4 py-16">
              <div className="container mx-auto text-center">
                <h2 className="mb-4 text-3xl font-bold text-indigo-700">Choose Your Canvas</h2>
                <p className="max-w-2xl mx-auto mb-12 text-lg text-gray-600">
                  Pick from our magical canvas templates and start creating. Your words will transform into art!
                </p>
                
                <div className="grid max-w-6xl grid-cols-1 gap-8 mx-auto md:grid-cols-2 lg:grid-cols-4">
                  {canvasTemplates.map((template) => (
                    <div 
                      key={template.id} 
                      className="overflow-hidden transition-all transform bg-white shadow-lg rounded-2xl hover:-translate-y-2 hover:shadow-xl"
                    >
                      <div className={`${template.color} p-6`}>
                        <div className="flex justify-center">
                          {template.icon}
                        </div>
                      </div>
                      <div className="p-6">
                        <h3 className="mb-2 text-xl font-bold text-indigo-700">{template.title}</h3>
                        <p className="mb-4 text-gray-600">{template.description}</p>
                        <button className="px-4 py-2 text-sm text-white transition-colors bg-indigo-500 rounded-full hover:bg-indigo-600">
                          Open Canvas
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </>
        )}

        {/* Canvas Page */}
        {currentPage === 'canvas' && (
          <section className="px-4 py-16">
            <div className="container mx-auto text-center">
              <h2 className="mb-6 text-3xl font-bold text-indigo-700">Creative Canvas Templates</h2>
              <p className="max-w-2xl mx-auto mb-12 text-lg text-gray-600">
                Select one of our four magical canvases to begin your creative journey!
              </p>
              
              <div className="grid max-w-6xl grid-cols-1 gap-8 mx-auto md:grid-cols-2 lg:grid-cols-4">
                {canvasTemplates.map((template) => (
                  <div 
                    key={template.id} 
                    className="overflow-hidden transition-all transform bg-white shadow-lg cursor-pointer rounded-2xl hover:-translate-y-2 hover:shadow-xl"
                  >
                    <div className={`${template.color} p-8`}>
                      <div className="flex justify-center">
                        {template.icon}
                      </div>
                    </div>
                    <div className="p-6">
                      <h3 className="mb-2 text-xl font-bold text-indigo-700">{template.title}</h3>
                      <p className="mb-4 text-gray-600">{template.description}</p>
                      <button className="px-6 py-2 text-white transition-colors bg-indigo-500 rounded-full hover:bg-indigo-600">
                        Start Creating
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* How It Works Section */}
        {currentPage === 'how-it-works' && (
          <section className="px-4 py-16 bg-blue-100">
            <div className="container mx-auto text-center">
              <h2 className="mb-12 text-3xl font-bold text-indigo-700">How ImaginationBook Works</h2>
              
              <div className="grid max-w-4xl grid-cols-1 gap-8 mx-auto md:grid-cols-3">
                <div className="p-6 bg-white shadow-md rounded-xl">
                  <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 text-xl font-bold text-white bg-pink-500 rounded-full">1</div>
                  <h3 className="mb-3 text-xl font-bold text-indigo-700">Write Your Story</h3>
                  <p className="text-gray-600">Write a poem, story, or describe an amazing world from your imagination!</p>
                </div>
                
                <div className="p-6 bg-white shadow-md rounded-xl">
                  <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 text-xl font-bold text-white bg-purple-500 rounded-full">2</div>
                  <h3 className="mb-3 text-xl font-bold text-indigo-700">AI Magic</h3>
                  <p className="text-gray-600">Our AI reads your words and begins creating art that matches your ideas!</p>
                </div>
                
                <div className="p-6 bg-white shadow-md rounded-xl">
                  <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 text-xl font-bold text-white bg-blue-500 rounded-full">3</div>
                  <h3 className="mb-3 text-xl font-bold text-indigo-700">See It Come to Life</h3>
                  <p className="text-gray-600">Watch as your story transforms into beautiful pictures, 3D worlds, and animations!</p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* History Section */}
        {currentPage === 'history' && (
          <section className="px-4 py-16 bg-gray-50">
            <div className="container mx-auto text-center">
              <h2 className="mb-4 text-3xl font-bold text-indigo-700">Our Story</h2>
              <p className="max-w-2xl mx-auto mb-12 text-lg text-gray-600">
                How ImaginationBook grew from a small idea to a magical creative platform for kids around the world.
              </p>
              
              <div className="max-w-3xl mx-auto space-y-12">
                <div className="p-6 bg-white shadow-md rounded-xl">
                  <h3 className="mb-2 text-xl font-bold text-pink-500">2023: The Beginning</h3>
                  <p className="text-gray-600">
                    ImaginationBook started as a school project to help children express themselves through creative writing.
                  </p>
                </div>
                
                <div className="p-6 bg-white shadow-md rounded-xl">
                  <h3 className="mb-2 text-xl font-bold text-purple-500">2024: Growing Magic</h3>
                  <p className="text-gray-600">
                    We added AI technology to transform children's stories into images, making creativity even more exciting!
                  </p>
                </div>
                
                <div className="p-6 bg-white shadow-md rounded-xl">
                  <h3 className="mb-2 text-xl font-bold text-blue-500">2025: Full of Wonder</h3>
                  <p className="text-gray-600">
                    Today, ImaginationBook helps thousands of kids turn their ideas into amazing artworks, animations, and 3D worlds!
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="py-8 text-white bg-indigo-900">
        <div className="container px-4 mx-auto text-center">
          <h2 className="mb-4 text-2xl font-bold">ImaginationBook</h2>
          <p className="mb-6">Where young imaginations come to life!</p>
          <p className="text-sm text-indigo-200">&copy; 2025 ImaginationBook. Created for creative kids everywhere.</p>
        </div>
      </footer>
    </div>
  );
}