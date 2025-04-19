import { useState, useEffect } from 'react';
import { BookOpen, X, LogIn, UserPlus, Mail, Lock, User, Home, Bold } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { setUserEmail, setUserPassword } from '../Redux/slices/user/user';
import toast, { Toaster } from 'react-hot-toast'; // For better notifications

// Utility to generate floating elements
const generateFloatingElements = () => {
  const shapes = ['book', 'star', 'cloud', 'pencil', 'rocket'];
  const colors = ['bg-pink-400', 'bg-purple-400', 'bg-blue-400', 'bg-green-400', 'bg-yellow-400'];
  const elements = [];

  for (let i = 0; i < 10; i++) {
    elements.push({
      id: i,
      shape: shapes[Math.floor(Math.random() * shapes.length)],
      color: colors[Math.floor(Math.random() * colors.length)],
      size: Math.floor(Math.random() * 40) + 20,
      x: Math.floor(Math.random() * 90) + 5,
      y: Math.floor(Math.random() * 90) + 5,
      animationDuration: Math.floor(Math.random() * 20) + 10,
      rotation: Math.floor(Math.random() * 360),
    });
  }
  return elements;
};

// Floating Element Component
const FloatingElement = ({ element }) => {
  const renderShape = (shape, size, color) => {
    switch (shape) {
      case 'book':
        return (
          <div className={`${color} w-full h-full rounded-md transform rotate-3 shadow-md flex items-center justify-center`}>
            <BookOpen className="w-1/2 text-white h-1/2" />
          </div>
        );
      case 'star':
        return <div className={`${color} w-full h-full landing-clip-path-star transform shadow-md`} />;
      case 'cloud':
        return (
          <div className={`${color} w-full h-full rounded-full shadow-md flex flex-row items-center`}>
            <div className={`${color} rounded-full w-2/3 h-2/3 -ml-1/4`} />
            <div className={`${color} rounded-full w-2/3 h-2/3 -ml-1/4`} />
          </div>
        );
      case 'pencil':
        return (
          <div className={`${color} w-full h-full transform rotate-45 rounded-t-md shadow-md`}>
            <div className="w-full bg-yellow-200 h-1/5 rounded-t-md" />
          </div>
        );
      case 'rocket':
        return (
          <div className={`${color} w-full h-full rounded-t-full shadow-md`}>
            <div className="w-1/2 mx-auto bg-red-400 rounded-t-full h-1/4" />
            <div className="flex justify-between mt-auto">
              <div className={`${color} w-1/4 h-1/3 rounded-b-full -mb-1`} />
              <div className={`${color} w-1/4 h-1/3 rounded-b-full -mb-1`} />
            </div>
          </div>
        );
      default:
        return <div className={`${color} w-full h-full rounded-full shadow-md`} />;
    }
  };

  return (
    <div
      className="absolute transition-transform landing-animate-float"
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
  );
};

// Feature Card Component
const FeatureCard = ({ icon, title, description, color }) => (
  <div className="p-6 transition-all transform bg-white shadow-md bg-opacity-80 rounded-xl backdrop-blur-sm hover:scale-105">
    <div className={`flex items-center justify-center w-16 h-16 mx-auto mb-4 ${color} rounded-full`}>
      {icon}
    </div>
    <h3 className={`text-xl font-bold ${color.replace('bg', 'text')}`}>{title}</h3>
    <p className="mt-2 text-gray-600">{description}</p>
  </div>
);

// Auth Modal Component
const AuthModal = ({ showAuth, setShowAuth, authMode, setAuthMode }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [isLoading, setIsLoading] = useState(false);
  // Signup form
  const [emailSignup, setEmailSignup] = useState('');
  const [passwordSignup, setPasswordSignup] = useState('');
  const [nameSignup, setNameSignup] = useState('');
  const [confirmPasswordSignup, setConfirmPasswordSignup] = useState('');
  const [signupError, setSignupError] = useState('');
  // Login form
  const [emailLogin, setEmailLogin] = useState('');
  const [passwordLogin, setPasswordLogin] = useState('');

  // Email validation regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // Password strength validation
  const isPasswordStrong = (password) => password.length >= 5;



  // Localstorage add

  useEffect(() => {
    const storedEmail = localStorage.getItem('email');
    const storedPassword = localStorage.getItem('password');
  
    if (storedEmail && storedPassword) {
       dispatch(setUserEmail(storedEmail));
      dispatch(setUserPassword(storedPassword));
  
      navigate('/home'); 
    }
  }, []);

  
  

  // Real-time password confirmation validation
  useEffect(() => {
    if (passwordSignup && confirmPasswordSignup) {
      if (passwordSignup !== confirmPasswordSignup) {
        setSignupError('Passwords do not match.');
      } else if (!isPasswordStrong(passwordSignup)) {
        setSignupError('Password must be at least 5 characters long.');
      } else {
        setSignupError('');
      }
    } else {
      setSignupError('');
    }
  }, [passwordSignup, confirmPasswordSignup]);


  // Signup and login functions

  const signupUser = async () => {
    if (!emailRegex.test(emailSignup)) {
      toast.error('Please enter a valid email.');
      return;
    }
    if (!nameSignup || !emailSignup || !passwordSignup || !confirmPasswordSignup) {
      toast.error('Please fill in all fields.');
      return;
    }
    if (passwordSignup !== confirmPasswordSignup) {
      toast.error('Passwords do not match.');
      return;
    }
    if (!isPasswordStrong(passwordSignup)) {
      toast.error('Password must be at least 5 characters long.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`http://localhost:3000/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: emailSignup,
          password: passwordSignup,
          name: nameSignup,
          confirmPassword: confirmPasswordSignup,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        dispatch(setUserEmail(emailSignup));
        dispatch(setUserPassword(passwordSignup));
    
        toast.success('Signup successful! Please log in.');
        setAuthMode('login');
        setEmailSignup('');
        setPasswordSignup('');
        setNameSignup('');
        setConfirmPasswordSignup('');
      } else {
        toast.error(data.message || 'Signup failed. Please try again.');
      }
    } catch (error) {
      console.error('Signup error:', error);
      toast.error('An error occurred. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const loginUser = async () => {
    if (!emailRegex.test(emailLogin)) {
      toast.error('Please enter a valid email.');
      return;
    }
    if (!emailLogin || !passwordLogin) {
      toast.error('Please fill in all fields.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`http://localhost:3000/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: emailLogin,
          password: passwordLogin,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        // Store token securely (consider using httpOnly cookies instead)
        localStorage.setItem('email',emailLogin);
        localStorage.setItem('password', passwordLogin) ; 
        // Dispatch the actions to update Redux state
        dispatch(setUserEmail(emailLogin));
        dispatch(setUserPassword(passwordLogin));
        toast.success('Login successful!');
        navigate('/home');
      } else {
        toast.error(data.message || 'Invalid email or password.');
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error('An error occurred. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    showAuth && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
        <div className="w-full max-w-md overflow-hidden bg-white shadow-2xl rounded-2xl landing-animate-scale-in">
          <div className="relative p-6 text-white bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500">
            <button
              onClick={() => setShowAuth(false)}
              className="absolute text-white transition-colors top-4 right-4 hover:text-pink-200"
              aria-label="Close authentication modal"
            >
              <X className="w-6 h-6" />
            </button>
            <h2 className="text-2xl font-bold text-center">
              {authMode === 'login' ? 'Welcome Back!' : 'Join the Adventure!'}
            </h2>
          </div>
          <div className="p-6">
            <div className="flex mb-6">
              <button
                onClick={() => setAuthMode('login')}
                className={`flex-1 py-2 text-center font-bold transition-colors ${
                  authMode === 'login' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-400 hover:text-gray-600'
                }`}
                aria-label="Switch to login form"
              >
                Login
              </button>
              <button
                onClick={() => setAuthMode('signup')}
                className={`flex-1 py-2 text-center font-bold transition-colors ${
                  authMode === 'signup' ? 'text-pink-600 border-b-2 border-pink-600' : 'text-gray-400 hover:text-gray-600'
                }`}
                aria-label="Switch to sign up form"
              >
                Sign Up
              </button>
            </div>

            {authMode === 'login' && (
              <form onSubmit={(e) => { e.preventDefault(); loginUser(); }} className="space-y-6">
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
                      value={emailLogin}
                      onChange={(e) => setEmailLogin(e.target.value)}
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
                      value={passwordLogin}
                      onChange={(e) => setPasswordLogin(e.target.value)}
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
                    <a href="/forgot-password" className="font-medium text-blue-600 hover:text-blue-500">
                      Forgot password?
                    </a>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className={`w-full px-4 py-3 text-white transition transform rounded-lg shadow bg-gradient-to-r from-blue-500 to-blue-700 hover:scale-105 ${
                    isLoading ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center">
                      <svg className="w-5 h-5 mr-2 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Logging in...
                    </span>
                  ) : (
                    'Login'
                  )}
                </button>
              </form>
            )}

            {authMode === 'signup' && (
              <form onSubmit={(e) => { e.preventDefault(); signupUser(); }} className="space-y-4">
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
                      value={nameSignup}
                      onChange={(e) => setNameSignup(e.target.value)}
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
                      value={emailSignup}
                      onChange={(e) => setEmailSignup(e.target.value)}
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
                      value={passwordSignup}
                      onChange={(e) => setPasswordSignup(e.target.value)}
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
                      value={confirmPasswordSignup}
                      onChange={(e) => setConfirmPasswordSignup(e.target.value)}
                      required
                      className="w-full px-4 py-2 pl-10 border rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                      placeholder="Confirm your password"
                    />
                  </div>
                  {signupError && <p className="mt-1 text-sm text-red-600">{signupError}</p>}
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
                    I agree to the{' '}
                    <a href="/terms" className="text-pink-600 hover:text-pink-500">
                      Terms and Conditions
                    </a>
                  </label>
                </div>
                <button
                  type="submit"
                  disabled={
                    isLoading ||
                    !emailSignup ||
                    !passwordSignup ||
                    !nameSignup ||
                    !confirmPasswordSignup ||
                    signupError ||
                    !document.getElementById('agree-terms')?.checked
                  }
                  className={`w-full px-4 py-3 text-white transition transform rounded-lg shadow bg-gradient-to-r from-purple-500 to-pink-600 hover:scale-105 ${
                    isLoading ||
                    !emailSignup ||
                    !passwordSignup ||
                    !nameSignup ||
                    !confirmPasswordSignup ||
                    signupError ||
                    !document.getElementById('agree-terms')?.checked
                      ? 'opacity-50 cursor-not-allowed'
                      : ''
                  }`}
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center">
                      <svg className="w-5 h-5 mr-2 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Creating Account...
                    </span>
                  ) : (
                    'Create Account'
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    )
  );
};

// Main Landing Page Component
export default function LandingPage() {
  // const dispatch = useDispatch();
  const navigate = useNavigate();
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [floatingElements, setFloatingElements] = useState([]);

  useEffect(() => {
    setFloatingElements(generateFloatingElements());
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <Toaster position="top-right" />
      {floatingElements.map((element) => (
        <FloatingElement key={element.id} element={element} />
      ))}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 text-center">
        <div className="flex flex-col items-center mb-8 landing-animate-float" style={{ animationDuration: '6s' }}>
          <div className="relative w-32 h-32 mb-4">
            <div
              className="absolute inset-0 bg-blue-400 rounded-full opacity-30 animate-ping"
              style={{ animationDuration: '3s' }}
            />
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
        <div className="flex flex-col gap-4 mt-6 sm:flex-row">
          <button
            onClick={() => {
              setShowAuth(true);
              setAuthMode('login');
            }}
            className="flex items-center justify-center gap-2 px-8 py-3 text-lg font-bold text-white transition-all transform rounded-full shadow-lg bg-gradient-to-r from-blue-500 to-blue-700 hover:scale-105 hover:shadow-xl"
            aria-label="Open login modal"
          >
            <LogIn className="w-5 h-5" />
            Login
          </button>
          <button
            onClick={() => {
              setShowAuth(true);
              setAuthMode('signup');
            }}
            className="flex items-center justify-center gap-2 px-8 py-3 text-lg font-bold text-white transition-all transform rounded-full shadow-lg bg-gradient-to-r from-purple-500 to-pink-600 hover:scale-105 hover:shadow-xl"
            aria-label="Open sign up modal"
          >
            <UserPlus className="w-5 h-5" />
            Sign Up
          </button>
        </div>
        <span
          onClick={() => navigate('/')}
          className="relative px-10 py-4 mt-16 overflow-hidden text-xl font-bold text-white transition-all transform rounded-full shadow-lg bg-gradient-to-r from-green-500 to-teal-500 hover:scale-105 hover:shadow-xl group"
          aria-label="Start exploring ImaginationBook"
        >
          <span className="relative z-10 flex items-center gap-2">
            <Home className="w-6 h-6" />
            "Ready to explore? <b>Log in</b> or <b>sign up</b>to begin the adventure!"
            </span>
          <span className="absolute inset-0 transition-transform duration-500 origin-left transform scale-x-0 bg-white opacity-25 group-hover:scale-x-100" />
        </span>
        <div className="grid max-w-4xl grid-cols-1 gap-8 mt-16 md:grid-cols-3">
          <FeatureCard
            icon={
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-8 h-8"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                />
              </svg>
            }
            title="Create Stories"
            description="Write poems and stories that come to life with magic!"
            color="bg-blue-100 text-blue-600"
          />
          <FeatureCard
            icon={
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-8 h-8"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            }
            title="See AI Art"
            description="Watch as AI transforms your words into amazing pictures!"
            color="bg-purple-100 text-purple-600"
          />
          <FeatureCard
            icon={
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-8 h-8"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            }
            title="Animated Magic"
            description="Bring your stories to life with movement and 3D worlds!"
            color="bg-pink-100 text-pink-600"
          />
        </div>
      </div>
      <AuthModal
        showAuth={showAuth}
        setShowAuth={setShowAuth}
        authMode={authMode}
        setAuthMode={setAuthMode}
      />
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .landing-animate-float {
          animation: float 6s ease-in-out infinite;
        }
        @keyframes scale-in {
          from { transform: scale(0.9); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .landing-animate-scale-in {
          animation: scale-in 0.3s ease-out forwards;
        }
        .landing-clip-path-star {
          clip-path: polygon(
            50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%,
            50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%
          );
        }
      `}</style>
    </div>
  );
}