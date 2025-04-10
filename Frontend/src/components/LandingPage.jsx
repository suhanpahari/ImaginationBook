import { useState, useEffect } from 'react';
import { BookOpen, X, LogIn, UserPlus, Mail, Lock, User, Home } from 'lucide-react';

export default function LandingPage() {
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'signup'
  const [floatingElements, setFloatingElements] = useState([]);

  // signup form
  const [emailSignup, setEmailSignup] = useState('');
  const [passwordSignup, setPasswordSignup] = useState('');
  const [nameSignup, setNameSignup] = useState('');
  const [confirmPasswordSignup, setConfirmPasswordSignup] = useState('');
  const [signupFire,setSignupFire] = useState(false);


  // login form
  const [emailLogin, setEmailLogin] = useState('');
  const [passwordLogin, setPasswordLogin] = useState('');
  const [loginFire,setLoginFire] = useState(false);
  

  // Generate random floating elements
  useEffect(() => {
    const elements = [];
    const shapes = ['book', 'star', 'cloud', 'pencil', 'rocket'];
    const colors = ['bg-pink-400', 'bg-purple-400', 'bg-blue-400', 'bg-green-400', 'bg-yellow-400'];
    
    for (let i = 0; i < 15; i++) {
      elements.push({
        id: i,
        shape: shapes[Math.floor(Math.random() * shapes.length)],
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.floor(Math.random() * 40) + 20, // 20px to 60px
        x: Math.floor(Math.random() * 90) + 5, // 5% to 95% of screen width
        y: Math.floor(Math.random() * 90) + 5, // 5% to 95% of screen height
        animationDuration: Math.floor(Math.random() * 20) + 10, // 10s to 30s
        rotation: Math.floor(Math.random() * 360),
      });
    }
    
    setFloatingElements(elements);
  }, []);

  // Handle signup API call
  useEffect(() => {
    const signupUser = async () => {
      if (
        emailSignup &&
        passwordSignup &&
        nameSignup &&
        confirmPasswordSignup &&
        passwordSignup === confirmPasswordSignup
      ) {
        try {
          const response = await fetch(`http://localhost:3000/signup?email=${emailSignup}&password=${passwordSignup}&name=${nameSignup}&confirmPassword=${confirmPasswordSignup}`);
          const data = await response.json();
          console.log(data);
          console.log(response);
        } catch (error) {
          console.error('Error:', error);
        }
      }
    };
  
    signupUser();
  }, [signupFire]);



  useEffect(() => {
    const loginUser = async () => {
      if (emailLogin && passwordLogin) {
        try {
          const response = await fetch(`http://localhost:3000/login?email=${emailLogin}&password=${passwordLogin}`);
          console.log(response);
          const data = await response.json();
          console.log(data);
        } 
        catch (error) 
        {
          console.error('Error:', error);
          alert("Invalid email or password");
        }
      }
    };
  
    loginUser();
  }, [loginFire]);
  

  // Function to render different shapes
  const renderShape = (shape, size, color) => {
    switch (shape) {
      case 'book':
        return (
          <div className={`${color} w-full h-full rounded-md transform rotate-3 shadow-md flex items-center justify-center`}>
            <BookOpen className="w-1/2 text-white h-1/2" />
          </div>
        );
      case 'star':
        return (
          <div className={`${color} w-full h-full clip-path-star transform shadow-md`}></div>
        );
      case 'cloud':
        return (
          <div className={`${color} w-full h-full rounded-full shadow-md flex flex-row items-center`}>
            <div className={`${color} rounded-full w-2/3 h-2/3 -ml-1/4`}></div>
            <div className={`${color} rounded-full w-2/3 h-2/3 -ml-1/4`}></div>
          </div>
        );
      case 'pencil':
        return (
          <div className={`${color} w-full h-full transform rotate-45 rounded-t-md shadow-md`}>
            <div className="w-full bg-yellow-200 h-1/5 rounded-t-md"></div>
          </div>
        );
      case 'rocket':
        return (
          <div className={`${color} w-full h-full rounded-t-full shadow-md`}>
            <div className="w-1/2 mx-auto bg-red-400 rounded-t-full h-1/4"></div>
            <div className="flex justify-between mt-auto">
              <div className={`${color} w-1/4 h-1/3 rounded-b-full -mb-1`}></div>
              <div className={`${color} w-1/4 h-1/3 rounded-b-full -mb-1`}></div>
            </div>
          </div>
        );
      default:
        return <div className={`${color} w-full h-full rounded-full shadow-md`}></div>;
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* 3D Floating Elements */}
      {floatingElements.map((element) => (
        <div
          key={element.id}
          className="absolute transition-transform transform animate-float"
          style={{
            left: `${element.x}%`,
            top: `${element.y}%`,
            width: `${element.size}px`,
            height: `${element.size}px`,
            animationDuration: `${element.animationDuration}s`,
            transform: `rotate(${element.rotation}deg)`,
            zIndex: 0,
          }}
        >
          {renderShape(element.shape, element.size, element.color)}
        </div>
      ))}

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 text-center">
        {/* Logo & Title */}
        <div className="flex flex-col items-center mb-8 animate-float" style={{ animationDuration: '6s' }}>
          <div className="relative w-32 h-32 mb-4">
            <div className="absolute inset-0 bg-blue-400 rounded-full opacity-30 animate-ping" style={{ animationDuration: '3s' }}></div>
            <div className="absolute inset-0 flex items-center justify-center rounded-full shadow-lg bg-gradient-to-br from-purple-500 to-pink-500">
              <BookOpen className="w-16 h-16 text-white" />
            </div>
          </div>
          <h1 className="text-5xl font-bold text-transparent md:text-6xl bg-clip-text bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 drop-shadow-md">
            ImaginationBook
          </h1>
          <p className="max-w-md mt-4 text-xl text-gray-700">
            Where words transform into magical worlds and amazing adventures!
          </p>
        </div>

        {/* Buttons */}
        <div className="flex flex-col gap-4 mt-6 sm:flex-row">
          <button 
            onClick={() => { setShowAuth(true); setAuthMode('login'); }}
            className="flex items-center justify-center gap-2 px-8 py-3 text-lg font-bold text-white transition-all transform rounded-full shadow-lg bg-gradient-to-r from-blue-500 to-blue-700 hover:scale-105 hover:shadow-xl"
          >
            <LogIn className="w-5 h-5" />
            Login
          </button>
          <button 
            onClick={() => { setShowAuth(true); setAuthMode('signup'); }}
            className="flex items-center justify-center gap-2 px-8 py-3 text-lg font-bold text-white transition-all transform rounded-full shadow-lg bg-gradient-to-r from-purple-500 to-pink-600 hover:scale-105 hover:shadow-xl"
          >
            <UserPlus className="w-5 h-5" />
            Sign Up
          </button>
        </div>

        {/* Animated Get Started Button */}
        <button className="relative px-10 py-4 mt-16 overflow-hidden text-xl font-bold text-white transition-all transform rounded-full shadow-lg bg-gradient-to-r from-green-500 to-teal-500 hover:scale-105 hover:shadow-xl group">
          <span className="relative z-10 flex items-center gap-2">
            <Home className="w-6 h-6" />
            Start Exploring
          </span>
          <span className="absolute inset-0 transition-transform duration-500 origin-left transform scale-x-0 bg-white opacity-25 group-hover:scale-x-100"></span>
        </button>

        {/* Features/Benefits */}
        <div className="grid max-w-4xl grid-cols-1 gap-8 mt-16 md:grid-cols-3">
          <div className="p-6 transition-all transform bg-white shadow-md bg-opacity-80 rounded-xl backdrop-blur-sm hover:scale-105">
            <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 text-blue-600 bg-blue-100 rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-blue-700">Create Stories</h3>
            <p className="mt-2 text-gray-600">Write poems and stories that come to life with magic!</p>
          </div>
          
          <div className="p-6 transition-all transform bg-white shadow-md bg-opacity-80 rounded-xl backdrop-blur-sm hover:scale-105">
            <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 text-purple-600 bg-purple-100 rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-purple-700">See AI Art</h3>
            <p className="mt-2 text-gray-600">Watch as AI transforms your words into amazing pictures!</p>
          </div>
          
          <div className="p-6 transition-all transform bg-white shadow-md bg-opacity-80 rounded-xl backdrop-blur-sm hover:scale-105">
            <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 text-pink-600 bg-pink-100 rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-pink-700">Animated Magic</h3>
            <p className="mt-2 text-gray-600">Bring your stories to life with movement and 3D worlds!</p>
          </div>
        </div>
      </div>

      {/* Auth Modal */}
      {showAuth && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="w-full max-w-md overflow-hidden bg-white shadow-2xl rounded-2xl animate-scale-in">
            {/* Modal Header */}
            <div className="relative p-6 text-white bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500">
              <button 
                onClick={() => setShowAuth(false)}
                className="absolute text-white transition-colors top-4 right-4 hover:text-pink-200"
              >
                <X className="w-6 h-6" />
              </button>
              <h2 className="text-2xl font-bold text-center">
                {authMode === 'login' ? 'Welcome Back!' : 'Join the Adventure!'}
              </h2>
            </div>
            
            {/* Modal Body */}
            <div className="p-6">
              {/* Tab Navigation */}
              <div className="flex mb-6">
                <button 
                  onClick={() => setAuthMode('login')}
                  className={`flex-1 py-2 text-center font-bold transition-colors ${
                    authMode === 'login' 
                      ? 'text-blue-600 border-b-2 border-blue-600' 
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  Login
                </button>
                <button 
                  onClick={() => setAuthMode('signup')}
                  className={`flex-1 py-2 text-center font-bold transition-colors ${
                    authMode === 'signup' 
                      ? 'text-pink-600 border-b-2 border-pink-600' 
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  Sign Up
                </button>
              </div>
              
              {/* Login Form */}
              {authMode === 'login' && (
                <form className="space-y-6">
                  <div>
                    <label htmlFor="email" className="block mb-1 text-sm font-medium text-gray-700">
                      Email
                    </label>
                    <div className="relative">
                      <Mail className="absolute w-5 h-5 text-gray-400 transform -translate-y-1/2 left-3 top-1/2" />
                      <input
                        id="email"
                        name="email"
                        type="email"
                        value = {emailLogin}
                        onChange = {(e) => setEmailLogin(e.target.value)}
                        required
                        className="w-full px-4 py-2 pl-10 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter your email"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="password" className="block mb-1 text-sm font-medium text-gray-700">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute w-5 h-5 text-gray-400 transform -translate-y-1/2 left-3 top-1/2" />
                      <input
                        id="password"
                        name="password"
                        type="password"
                        value = {passwordLogin}
                        onChange = {(e) => setPasswordLogin(e.target.value)}
                        required
                        className="w-full px-4 py-2 pl-10 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter your password"
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <input
                        id="remember-me"
                        name="remember-me"
                        type="checkbox"
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <label htmlFor="remember-me" className="block ml-2 text-sm text-gray-700">
                        Remember me
                      </label>
                    </div>
                    
                    <div className="text-sm">
                      <a href="#" className="font-medium text-blue-600 hover:text-blue-500">
                        Forgot password?
                      </a>
                    </div>
                  </div>
                  
                  <button
                    type="submit"
                    onClick={() => setLoginFire(true)}
                    className="w-full px-4 py-3 text-white transition transform rounded-lg shadow bg-gradient-to-r from-blue-500 to-blue-700 hover:scale-105"
                  >
                    Login
                  </button>
                </form>
              )}
              
              {/* Sign Up Form */}
              {authMode === 'signup' && (
                <form className="space-y-4">
                  <div>
                    <label htmlFor="name" className="block mb-1 text-sm font-medium text-gray-700">
                      Full Name
                    </label>
                    <div className="relative">
                      <User className="absolute w-5 h-5 text-gray-400 transform -translate-y-1/2 left-3 top-1/2" />
                      <input
                        id="name"
                        name="name"
                        type="text"
                        value = {nameSignup}
                        onChange = {(e) => setNameSignup(e.target.value)}
                        required
                        className="w-full px-4 py-2 pl-10 border rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                        placeholder="Enter your name"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="signup-email" className="block mb-1 text-sm font-medium text-gray-700">
                      Email
                    </label>
                    <div className="relative">
                      <Mail className="absolute w-5 h-5 text-gray-400 transform -translate-y-1/2 left-3 top-1/2" />
                      <input
                        id="signup-email"
                        name="email"
                        type="email"
                        value = {emailSignup}
                        onChange = {(e) => setEmailSignup(e.target.value)}
                        required
                        className="w-full px-4 py-2 pl-10 border rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                        placeholder="Enter your email"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="signup-password" className="block mb-1 text-sm font-medium text-gray-700">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute w-5 h-5 text-gray-400 transform -translate-y-1/2 left-3 top-1/2" />
                      <input
                        id="signup-password"
                        name="password"
                        type="password"
                        value = {passwordSignup}
                        onChange = {(e) => setPasswordSignup(e.target.value)}
                        required
                        className="w-full px-4 py-2 pl-10 border rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                        placeholder="Create a password"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="confirm-password" className="block mb-1 text-sm font-medium text-gray-700">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute w-5 h-5 text-gray-400 transform -translate-y-1/2 left-3 top-1/2" />
                      <input
                        id="confirm-password"
                        name="confirmPassword"
                        type="password"
                        value = {confirmPasswordSignup}
                        onChange = {(e) => setConfirmPasswordSignup(e.target.value)}
                        required
                        className="w-full px-4 py-2 pl-10 border rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                        placeholder="Confirm your password"
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      id="agree-terms"
                      name="agreeTerms"
                      type="checkbox"
                      required
                      className="w-4 h-4 text-pink-600 border-gray-300 rounded focus:ring-pink-500"
                    />
                    <label htmlFor="agree-terms" className="block ml-2 text-sm text-gray-700">
                      I agree to the <a href="#" className="text-pink-600 hover:text-pink-500">Terms and Conditions</a>
                    </label>
                  </div>
                  
                  <button
                    type="submit"
                    onClick={() => setSignupFire(true)}
                    className="w-full px-4 py-3 text-white transition transform rounded-lg shadow bg-gradient-to-r from-purple-500 to-pink-600 hover:scale-105"
                  >
                    Create Account
                  </button>
                </form>
              )}
              
              {/* Social Login */}
              {/* <div className="mt-6">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 text-gray-500 bg-white">Or continue with</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-3 mt-6">
                  <button className="flex items-center justify-center w-full px-4 py-2 bg-white border rounded-md shadow-sm hover:bg-gray-50">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M22.675 0h-21.35c-.732 0-1.325.593-1.325 1.325v21.351c0 .731.593 1.324 1.325 1.324h11.495v-9.294h-3.128v-3.622h3.128v-2.671c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.795.143v3.24l-1.918.001c-1.504 0-1.795.715-1.795 1.763v2.313h3.587l-.467 3.622h-3.12v9.293h6.116c.73 0 1.323-.593 1.323-1.325v-21.35c0-.732-.593-1.325-1.325-1.325z" fill="#1877F2" />
                    </svg>
                  </button>
                  
                  <button className="flex items-center justify-center w-full px-4 py-2 bg-white border rounded-md shadow-sm hover:bg-gray-50">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12.545 10.239v3.821h5.445c-.712 2.315-2.647 3.972-5.445 3.972-3.332 0-6.033-2.701-6.033-6.032s2.701-6.032 6.033-6.032c1.498 0 2.866.554 3.921 1.465l2.814-2.814c-1.798-1.678-4.203-2.707-6.735-2.707-5.522 0-9.999 4.477-9.999 9.999s4.477 9.999 9.999 9.999c8.396 0 10.089-7.931 9.325-11.63l-9.336-.041z" fill="#EA4335" />
                      <path d="M12.545 10.239v3.821h5.445c-.712 2.315-2.647 3.972-5.445 3.972-3.332 0-6.033-2.701-6.033-6.032s2.701-6.032 6.033-6.032c1.498 0 2.866.554 3.921 1.465l2.814-2.814c-1.798-1.678-4.203-2.707-6.735-2.707-5.522 0-9.999 4.477-9.999 9.999s4.477 9.999 9.999 9.999c8.396 0 10.089-7.931 9.325-11.63l-9.336-.041z" fill="#FBBC05" />
                      <path d="M12.545 10.239v3.821h5.445c-.712 2.315-2.647 3.972-5.445 3.972-3.332 0-6.033-2.701-6.033-6.032s2.701-6.032 6.033-6.032c1.498 0 2.866.554 3.921 1.465l2.814-2.814c-1.798-1.678-4.203-2.707-6.735-2.707-5.522 0-9.999 4.477-9.999 9.999s4.477 9.999 9.999 9.999c8.396 0 10.089-7.931 9.325-11.63l-9.336-.041z" fill="#4285F4" />
                      <path d="M12.545 10.239v3.821h5.445c-.712 2.315-2.647 3.972-5.445 3.972-3.332 0-6.033-2.701-6.033-6.032s2.701-6.032 6.033-6.032c1.498 0 2.866.554 3.921 1.465l2.814-2.814c-1.798-1.678-4.203-2.707-6.735-2.707-5.522 0-9.999 4.477-9.999 9.999s4.477 9.999 9.999 9.999c8.396 0 10.089-7.931 9.325-11.63l-9.336-.041z" fill="#34A853" />
                    </svg>
                  </button>
                  
                  <button className="flex items-center justify-center w-full px-4 py-2 bg-white border rounded-md shadow-sm hover:bg-gray-50">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M22.05 7.53c0-.78-.07-1.53-.14-2.26h-9.46v4.29h5.36c-.25 1.33-.93 2.45-2.01 3.2v2.64h3.27c1.91-1.76 3-4.35 3-7.44z" fill="#4285F4" />
                      <path d="M12.5 23c2.73 0 5-91-.82 7.68-2.15l-3.27-2.54c-1.44.97-3.27 1.54-5.4 1.54-4.15 0-7.67-2.8-8.92-6.55h-3.38v2.64c2.62 5.21 8.01 8.77 14.19 8.77z" fill="#34A853" />
                      <path d="M3.58 13.8c-.32-.95-.5-1.97-.5-3.01s.18-2.06.5-3.01v-2.64h-3.38c-.68 1.35-1.07 2.87-1.07 4.46s.39 3.11 1.07 4.46l3.38-2.64z" fill="#FBBC05" />
                      <path d="M12.5 5.27c2.33 0 4.41.8 6.07 2.37l2.9-2.9c-2.75-2.56-6.34-4.12-10.97-4.12-6.18 0-11.57 3.56-14.19 8.77l3.38 2.64c1.25-3.76 4.77-6.55 8.92-6.55z" fill="#EA4335" />
                    </svg>
                  </button>
                </div>
              </div> */}
            </div>
          </div>
        </div>
      )}

      {/* CSS Animation Classes */}
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-20px); }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        @keyframes scale-in {
          from { transform: scale(0.9); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .animate-scale-in {
          animation: scale-in 0.3s ease-out forwards;
        }
        .clip-path-star {
          clip-path: polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%);
        }
      `}</style>
    </div>
  );
}