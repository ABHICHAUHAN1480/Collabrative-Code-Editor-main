import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  ArrowRight,
  CheckCircle,
  Code,
  Eye,
  EyeOff,
  Lock,
  Mail,
  ShieldCheck,
  Terminal,
  User,
  Users,
  Zap,
  AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

const LoginPage = () => {
  const { isAuthenticated, login, register, loading } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    username: '',
    fullName: ''
  });
  const [validationErrors, setValidationErrors] = useState({});
  const [fieldTouched, setFieldTouched] = useState({});

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const validateEmail = (email) => {
    if (!email) return 'Email is required';
    
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
    
    if (!emailRegex.test(email)) {
      return 'Please enter a valid email address (e.g., user@gmail.com)';
    }
    
    const parts = email.split('@');
    if (parts.length !== 2) return 'Invalid email format';
    
    const [localPart, domainPart] = parts;
    
    if (localPart.length === 0 || localPart.length > 64) {
      return 'Email local part must be 1-64 characters';
    }
    if (localPart.startsWith('.') || localPart.endsWith('.')) {
      return 'Email cannot start or end with a dot';
    }
    if (localPart.includes('..')) {
      return 'Email cannot contain consecutive dots';
    }
    
    if (domainPart.length === 0 || domainPart.length > 253) {
      return 'Email domain is too long';
    }
    if (domainPart.startsWith('-') || domainPart.endsWith('-')) {
      return 'Email domain cannot start or end with a hyphen';
    }
    if (domainPart.startsWith('.') || domainPart.endsWith('.')) {
      return 'Email domain cannot start or end with a dot';
    }
    
    const domainParts = domainPart.split('.');
    if (domainParts.length < 2) {
      return 'Email must have a valid domain with extension (e.g., .com, .org)';
    }
    
    for (const part of domainParts) {
      if (part.length === 0 || part.length > 63) {
        return 'Invalid domain format';
      }
      if (part.startsWith('-') || part.endsWith('-')) {
        return 'Invalid domain format';
      }
      if (!/^[a-zA-Z0-9-]+$/.test(part)) {
        return 'Domain contains invalid characters';
      }
    }
    
    const tld = domainParts[domainParts.length - 1];
    if (tld.length < 2 || !/^[a-zA-Z]+$/.test(tld)) {
      return 'Email must have a valid domain extension (e.g., .com, .org, .net)';
    }
    
    const invalidTlds = ['co', 'c', 'o', 'gmai', 'yaho', 'hotmai'];
    if (invalidTlds.includes(tld.toLowerCase())) {
      return 'Please complete the email domain (e.g., gmail.com instead of gmai)';
    }
    
    const blockedPatterns = [
      /^test@/i,
      /^admin@/i,
      /^noreply@/i,
      /example\.com$/i,
      /\.test$/i
    ];
    
    for (const pattern of blockedPatterns) {
      if (pattern.test(email)) {
        return 'Please use a real email address';
      }
    }
    
    return '';
  };

  const validatePassword = (password) => {
    if (!password) return 'Password is required';
    if (password.length < 8) return 'Password must be at least 8 characters long';
    if (!/(?=.*[a-z])/.test(password)) return 'Password must contain at least one lowercase letter';
    if (!/(?=.*[A-Z])/.test(password)) return 'Password must contain at least one uppercase letter';
    if (!/(?=.*\d)/.test(password)) return 'Password must contain at least one number';
    return '';
  };

  const validateUsername = (username) => {
    if (!username) return 'Username is required';
    if (username.length < 3) return 'Username must be at least 3 characters long';
    if (username.length > 30) return 'Username must be less than 30 characters';
    const usernameRegex = /^[a-zA-Z0-9_-]+$/;
    if (!usernameRegex.test(username)) {
      return 'Username can only contain letters, numbers, underscores, and hyphens';
    }
    
    const reservedNames = [
      'admin', 'administrator', 'root', 'system', 'api', 'www', 'mail',
      'support', 'help', 'info', 'contact', 'service', 'noreply', 'test'
    ];
    
    if (reservedNames.includes(username.toLowerCase())) {
      return 'Username is reserved. Please choose another.';
    }
    
    if (username.startsWith('_') || username.startsWith('-') || 
        username.endsWith('_') || username.endsWith('-')) {
      return 'Username cannot start or end with underscore or hyphen';
    }
    
    return '';
  };

  const validateFullName = (fullName) => {
    if (!fullName) return 'Full name is required';
    if (fullName.length < 2) return 'Full name must be at least 2 characters long';
    if (fullName.length > 100) return 'Full name must be less than 100 characters';
    return '';
  };

  const validateField = (name, value) => {
    switch (name) {
      case 'email':
        return validateEmail(value);
      case 'password':
        return validatePassword(value);
      case 'username':
        return validateUsername(value);
      case 'fullName':
        return validateFullName(value);
      default:
        return '';
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    if (fieldTouched[name]) {
      const error = validateField(name, value);
      setValidationErrors(prev => ({
        ...prev,
        [name]: error
      }));
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setFieldTouched(prev => ({
      ...prev,
      [name]: true
    }));

    const error = validateField(name, value);
    setValidationErrors(prev => ({
      ...prev,
      [name]: error
    }));
  };

  const validateForm = () => {
    const errors = {};
    
    errors.email = validateEmail(formData.email);
    errors.password = validatePassword(formData.password);
    
    if (!isLogin) {
      errors.username = validateUsername(formData.username);
      errors.fullName = validateFullName(formData.fullName);
    }
    
    setValidationErrors(errors);
    
    return Object.values(errors).every(error => !error);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const touchedFields = {};
    Object.keys(formData).forEach(key => {
      if (isLogin && (key === 'email' || key === 'password')) {
        touchedFields[key] = true;
      } else if (!isLogin) {
        touchedFields[key] = true;
      }
    });
    setFieldTouched(touchedFields);
    
    if (!validateForm()) {
      toast.error('Please correct the errors below');
      return;
    }
    
    if (isLogin) {
      const result = await login({ 
        email: formData.email.trim(), 
        password: formData.password 
      });
      
      if (!result.success && result.message) {
        if (result.message.includes('not found') || result.message.includes('No account found')) {
          toast.error('No account found with this email address. Please check your email or sign up.');
        } else if (result.message.includes('password') || result.message.includes('Incorrect password')) {
          toast.error('Incorrect password. Please check your password and try again.');
        } else if (result.message.includes('locked') || result.message.includes('suspended')) {
          toast.error(result.message);
        } else {
          toast.error(result.message);
        }
      }
    } else {
      const result = await register(formData);
      
      if (!result.success && result.message) {
        if (result.message.includes('already exists') || result.message.includes('already taken')) {
          if (result.message.includes('email')) {
            toast.error('An account with this email already exists. Try logging in instead.');
          } else if (result.message.includes('username')) {
            toast.error('This username is already taken. Please choose a different username.');
          } else {
            toast.error(result.message);
          }
        } else {
          toast.error(result.message);
        }
      }
    }
  };

  const switchMode = () => {
    setIsLogin(!isLogin);
    setValidationErrors({});
    setFieldTouched({});
    setShowPassword(false);
    setFormData({
      email: '',
      password: '',
      username: '',
      fullName: ''
    });
  };

  const getFieldError = (fieldName) => {
    return fieldTouched[fieldName] && validationErrors[fieldName];
  };

  const isFieldValid = (fieldName) => {
    return fieldTouched[fieldName] && !validationErrors[fieldName] && formData[fieldName];
  };

  const authHighlights = [
    {
      icon: Users,
      title: 'Collaborate live',
      description: 'Work in persistent rooms with shared files and conversation.'
    },
    {
      icon: Terminal,
      title: 'Run from the editor',
      description: 'Execute code and review output without switching tools.'
    },
    {
      icon: ShieldCheck,
      title: 'Keep work private',
      description: 'Authenticated rooms keep access intentional and trackable.'
    }
  ];

  const getInputClassName = (fieldName) => {
    const hasError = getFieldError(fieldName);
    const valid = isFieldValid(fieldName);

    return `w-full rounded-lg border bg-white/[0.06] py-3 text-white placeholder-zinc-500 outline-none transition focus:ring-2 ${
      fieldName === 'password' ? 'pl-10 pr-12' : 'pl-10 pr-10'
    } ${
      hasError
        ? 'border-red-400/70 focus:border-red-300 focus:ring-red-400/30'
        : valid
          ? 'border-emerald-400/70 focus:border-emerald-300 focus:ring-emerald-400/30'
          : 'border-white/10 focus:border-emerald-300/60 focus:ring-emerald-400/20'
    }`;
  };

  const renderFieldStatus = (fieldName) => {
    if (isFieldValid(fieldName)) {
      return <CheckCircle className="absolute right-3 top-3.5 h-5 w-5 text-emerald-300" />;
    }

    if (getFieldError(fieldName)) {
      return <AlertCircle className="absolute right-3 top-3.5 h-5 w-5 text-red-300" />;
    }

    return null;
  };

  return (
    <div className="login-page min-h-screen bg-[#101114] text-white">
      <div className="mx-auto grid min-h-screen max-w-7xl lg:grid-cols-[0.95fr_1.05fr]">
        <aside className="hidden border-r border-white/10 bg-[#141519] px-10 py-8 lg:flex lg:flex-col lg:justify-between">
          <div>
            <div className="mb-14 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-white/10 bg-white/[0.06]">
                <Code className="h-6 w-6 text-emerald-300" />
              </div>
              <div>
                <h1 className="text-lg font-semibold leading-tight">CodeCollab</h1>
                <p className="text-xs text-zinc-500">Collaborative code workspace</p>
              </div>
            </div>

            <div className="max-w-xl">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-sm text-emerald-200">
                <Zap className="h-4 w-4" />
                Workspace-ready after sign in
              </div>
              <h2 className="text-4xl font-semibold leading-tight text-white">
                Sign in to your room, your files, and your team context.
              </h2>
              <p className="mt-5 text-base leading-7 text-zinc-400">
                CodeCollab keeps collaboration close to the editor: persistent rooms, shared files, chat, AI help, and code execution in one focused workspace.
              </p>
            </div>

            <div className="mt-10 space-y-4">
              {authHighlights.map(({ icon: Icon, title, description }) => (
                <div key={title} className="rounded-lg border border-white/10 bg-white/[0.035] p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-white/[0.06] text-emerald-300">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-white">{title}</h3>
                      <p className="mt-1 text-sm leading-6 text-zinc-500">{description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 border-t border-white/10 pt-6">
            <div>
              <p className="text-xl font-semibold text-white">5+</p>
              <p className="text-xs text-zinc-500">languages</p>
            </div>
            <div>
              <p className="text-xl font-semibold text-white">Live</p>
              <p className="text-xs text-zinc-500">sync</p>
            </div>
            <div>
              <p className="text-xl font-semibold text-white">Saved</p>
              <p className="text-xs text-zinc-500">rooms</p>
            </div>
          </div>
        </aside>

        <main className="flex min-h-screen items-center justify-center px-5 py-8 sm:px-8">
          <div className="w-full max-w-md">
            <div className="mb-8 flex items-center justify-center gap-3 lg:hidden">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-white/10 bg-white/[0.06]">
                <Code className="h-6 w-6 text-emerald-300" />
              </div>
              <div>
                <h1 className="text-lg font-semibold leading-tight">CodeCollab</h1>
                <p className="text-xs text-zinc-500">Collaborative code workspace</p>
              </div>
            </div>

            <section className="rounded-lg border border-white/10 bg-white/[0.04] p-5 shadow-2xl shadow-black/30 sm:p-7">
              <div className="mb-6">
                <div className="mb-5 grid grid-cols-2 rounded-lg border border-white/10 bg-black/20 p-1">
                  <button
                    type="button"
                    onClick={() => !isLogin && switchMode()}
                    className={`rounded-md px-3 py-2 text-sm font-semibold transition ${
                      isLogin ? 'bg-emerald-400 text-zinc-950' : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    Sign in
                  </button>
                  <button
                    type="button"
                    onClick={() => isLogin && switchMode()}
                    className={`rounded-md px-3 py-2 text-sm font-semibold transition ${
                      !isLogin ? 'bg-emerald-400 text-zinc-950' : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    Sign up
                  </button>
                </div>

                <h2 className="text-2xl font-semibold text-white">
                  {isLogin ? 'Welcome back' : 'Create your workspace account'}
                </h2>
                <p className="mt-2 text-sm leading-6 text-zinc-400">
                  {isLogin
                    ? 'Continue to your persistent coding rooms and projects.'
                    : 'Set up an account to save files, rooms, messages, and collaborators.'}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {!isLogin && (
                  <>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-zinc-200">Full Name *</label>
                      <div className="relative">
                        <User className="absolute left-3 top-3.5 h-5 w-5 text-zinc-500" />
                        <input
                          type="text"
                          name="fullName"
                          value={formData.fullName}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          className={getInputClassName('fullName')}
                          placeholder="Enter your full name"
                        />
                        {renderFieldStatus('fullName')}
                      </div>
                      {getFieldError('fullName') && (
                        <p className="mt-2 flex items-center gap-1 text-sm text-red-300">
                          <AlertCircle className="h-4 w-4" />
                          {getFieldError('fullName')}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-zinc-200">Username *</label>
                      <div className="relative">
                        <User className="absolute left-3 top-3.5 h-5 w-5 text-zinc-500" />
                        <input
                          type="text"
                          name="username"
                          value={formData.username}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          className={getInputClassName('username')}
                          placeholder="Choose a username"
                        />
                        {renderFieldStatus('username')}
                      </div>
                      {getFieldError('username') && (
                        <p className="mt-2 flex items-center gap-1 text-sm text-red-300">
                          <AlertCircle className="h-4 w-4" />
                          {getFieldError('username')}
                        </p>
                      )}
                    </div>
                  </>
                )}

                <div>
                  <label className="mb-2 block text-sm font-medium text-zinc-200">Email Address *</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3.5 h-5 w-5 text-zinc-500" />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={getInputClassName('email')}
                      placeholder="you@example.com"
                    />
                    {renderFieldStatus('email')}
                  </div>
                  {getFieldError('email') && (
                    <p className="mt-2 flex items-center gap-1 text-sm text-red-300">
                      <AlertCircle className="h-4 w-4" />
                      {getFieldError('email')}
                    </p>
                  )}
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-zinc-200">Password *</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3.5 h-5 w-5 text-zinc-500" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={getInputClassName('password')}
                      placeholder="Enter your password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3.5 text-zinc-500 transition hover:text-zinc-200"
                      title={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  {getFieldError('password') && (
                    <p className="mt-2 flex items-center gap-1 text-sm text-red-300">
                      <AlertCircle className="h-4 w-4" />
                      {getFieldError('password')}
                    </p>
                  )}
                  {!isLogin && (
                    <p className="mt-2 text-xs leading-5 text-zinc-500">
                      Use at least 8 characters with uppercase, lowercase, and a number.
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-emerald-400 px-4 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? (
                    <>
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-950 border-t-transparent"></div>
                      <span>Please wait...</span>
                    </>
                  ) : (
                    <>
                      <span>{isLogin ? 'Sign in' : 'Create account'}</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </form>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
};

export default LoginPage;
