import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/api';
import RoomManager from '../components/Room/RoomManager';
import {
  Activity,
  AlertCircle,
  ArrowRight,
  Code,
  Files,
  FolderKanban,
  Home,
  Loader,
  Lock,
  LogOut,
  MessageCircle,
  Play,
  ShieldCheck,
  Users,
  Zap
} from 'lucide-react';
import toast from 'react-hot-toast';

const HomePage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [userWorkspace, setUserWorkspace] = useState(null);
  const [loadingWorkspace, setLoadingWorkspace] = useState(false);
  const [workspaceError, setWorkspaceError] = useState(null);

  useEffect(() => {
    initializeUserWorkspace();
  }, []);

  const initializeUserWorkspace = async () => {
    try {
      setLoadingWorkspace(true);
      setWorkspaceError(null);

      try {
        const response = await apiService.getUserWorkspace();
        if (response.success) {
          console.log('Found existing workspace:', response.data.room.roomId);
          setUserWorkspace(response.data.room);
          return;
        }
      } catch (error) {
        console.log('No existing workspace found, creating new one...');
      }

      const response = await apiService.initializeWorkspace();
      if (response.success) {
        console.log('Workspace initialized:', response.data.room.roomId);
        setUserWorkspace(response.data.room);
        showToast('Welcome! Your persistent workspace is ready.', 'success');
      } else {
        throw new Error(response.message || 'Failed to initialize workspace');
      }
    } catch (error) {
      console.error('Error initializing workspace:', error);
      setWorkspaceError('Failed to initialize workspace');
      showToast('Failed to initialize your workspace. Please try refreshing the page.', 'error');
    } finally {
      setLoadingWorkspace(false);
    }
  };

  const handleQuickStart = () => {
    if (!userWorkspace) {
      if (workspaceError) {
        initializeUserWorkspace();
      } else {
        showToast('Workspace not ready yet, please wait...', 'info');
      }
      return;
    }

    console.log('Navigating to workspace:', userWorkspace.roomId);
    navigate(`/editor/${userWorkspace.roomId}`);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/auth');
  };

  const showToast = (message, type = 'info') => {
    const toastId = toast[type](message, {
      duration: 3000,
      position: 'top-right'
    });
    setTimeout(() => toast.dismiss(toastId), 3000);
  };

  const workspaceStatus = loadingWorkspace
    ? 'Preparing'
    : workspaceError
      ? 'Needs attention'
      : userWorkspace
        ? 'Ready'
        : 'Pending';

  const featureHighlights = [
    {
      icon: Users,
      title: 'Live editing',
      description: 'Collaborators can join the same room, edit together, and keep context in one place.',
      tone: 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300'
    },
    {
      icon: Zap,
      title: 'Run code fast',
      description: 'Execute JavaScript, Python, Java, C, and C++ without leaving the editor.',
      tone: 'border-amber-400/20 bg-amber-400/10 text-amber-300'
    },
    {
      icon: MessageCircle,
      title: 'Chat with context',
      description: 'Keep decisions, questions, and AI help beside the files they belong to.',
      tone: 'border-sky-400/20 bg-sky-400/10 text-sky-300'
    },
    {
      icon: Files,
      title: 'Persistent files',
      description: 'Rooms keep code, folders, chat history, and collaborators across sessions.',
      tone: 'border-rose-400/20 bg-rose-400/10 text-rose-300'
    }
  ];

  return (
    <div className="min-h-screen bg-[#101114] text-white">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#101114]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-white/10 bg-white/[0.06]">
              <Code className="h-6 w-6 text-emerald-300" />
            </div>
            <div>
              <h1 className="text-lg font-semibold leading-tight text-white">CodeCollab</h1>
              <p className="text-xs text-zinc-400">Collaborative code workspace</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-3 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 sm:flex">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-emerald-400/15 text-emerald-200">
                <span className="text-sm font-semibold">
                  {user?.username?.charAt(0)?.toUpperCase() || 'U'}
                </span>
              </div>
              <span className="max-w-36 truncate text-sm text-zinc-200">{user?.username}</span>
            </div>
            <button
              onClick={handleLogout}
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-red-400/20 bg-red-500/10 text-red-200 transition hover:bg-red-500/20 hover:text-red-100"
              title="Logout"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      <main>
        <section className="border-b border-white/10">
          <div className="mx-auto grid max-w-7xl gap-8 px-5 py-10 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:py-14">
            <div className="space-y-7">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-sm text-emerald-200">
                <Activity className="h-4 w-4" />
                <span>{workspaceStatus} workspace</span>
              </div>

              <div className="space-y-4">
                <h2 className="max-w-3xl text-4xl font-semibold leading-tight text-white sm:text-5xl">
                  A cleaner place to build, run, and discuss code together.
                </h2>
                <p className="max-w-2xl text-base leading-7 text-zinc-300 sm:text-lg">
                  Open your permanent workspace, spin up rooms for focused collaborations, and keep code, chat, and output in one durable flow.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  onClick={handleQuickStart}
                  disabled={loadingWorkspace}
                  className="inline-flex min-h-12 items-center justify-center gap-3 rounded-lg bg-emerald-400 px-5 py-3 text-sm font-semibold text-zinc-950 shadow-lg shadow-emerald-950/30 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loadingWorkspace ? (
                    <>
                      <Loader className="h-5 w-5 animate-spin" />
                      <span>Setting up workspace</span>
                    </>
                  ) : workspaceError ? (
                    <>
                      <AlertCircle className="h-5 w-5" />
                      <span>Retry setup</span>
                    </>
                  ) : userWorkspace ? (
                    <>
                      <Home className="h-5 w-5" />
                      <span>Enter workspace</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  ) : (
                    <>
                      <Play className="h-5 w-5" />
                      <span>Start coding</span>
                    </>
                  )}
                </button>

                <a
                  href="#rooms"
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-semibold text-zinc-100 transition hover:border-white/20 hover:bg-white/[0.08]"
                >
                  <FolderKanban className="h-5 w-5 text-amber-300" />
                  Manage rooms
                </a>
              </div>

              {workspaceError && (
                <div className="max-w-xl rounded-lg border border-red-400/25 bg-red-500/10 p-4 text-sm text-red-100">
                  <div className="flex items-center gap-2 font-medium">
                    <AlertCircle className="h-5 w-5" />
                    <span>{workspaceError}</span>
                  </div>
                  <button
                    onClick={initializeUserWorkspace}
                    className="mt-2 text-xs font-semibold text-red-100 underline-offset-4 hover:underline"
                  >
                    Try again
                  </button>
                </div>
              )}
            </div>

            <div className="rounded-lg border border-white/10 bg-white/[0.045] p-5 shadow-2xl shadow-black/30">
              <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-5">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Personal workspace</p>
                  <h3 className="mt-2 text-2xl font-semibold text-white">My Workspace</h3>
                  <p className="mt-2 text-sm leading-6 text-zinc-400">
                    Your stable home base for files, messages, project rooms, and returning collaborators.
                  </p>
                </div>
                <div className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  workspaceError
                    ? 'bg-red-400/10 text-red-200'
                    : userWorkspace
                      ? 'bg-emerald-400/10 text-emerald-200'
                      : 'bg-amber-400/10 text-amber-200'
                }`}>
                  {workspaceStatus}
                </div>
              </div>

              <div className="grid gap-4 py-5 sm:grid-cols-3">
                <div>
                  <p className="text-xs text-zinc-500">Room ID</p>
                  <p className="mt-1 truncate font-mono text-sm text-zinc-100">
                    {userWorkspace?.roomId || 'Creating...'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500">Access</p>
                  <p className="mt-1 text-sm font-medium text-zinc-100">
                    {userWorkspace?.isPrivate ? 'Private' : 'Shareable'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500">Persistence</p>
                  <p className="mt-1 text-sm font-medium text-zinc-100">Always saved</p>
                </div>
              </div>

              <div className="rounded-lg border border-white/10 bg-[#15171c] p-4">
                <div className="flex items-center gap-3">
                  <ShieldCheck className="h-5 w-5 text-emerald-300" />
                  <p className="text-sm font-medium text-white">Same room, every session</p>
                </div>
                <p className="mt-2 text-sm leading-6 text-zinc-400">
                  Share this ID once. Your collaborators can return later without chasing a new invite.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-white/10 bg-[#141519]">
          <div className="mx-auto grid max-w-7xl gap-4 px-5 py-6 sm:grid-cols-3 sm:px-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-400/10 text-emerald-300">
                <Home className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xl font-semibold text-white">Permanent</p>
                <p className="text-sm text-zinc-400">workspace identity</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-400/10 text-amber-300">
                <Code className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xl font-semibold text-white">5+</p>
                <p className="text-sm text-zinc-400">supported languages</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-rose-400/10 text-rose-300">
                <Lock className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xl font-semibold text-white">Private</p>
                <p className="text-sm text-zinc-400">room sharing controls</p>
              </div>
            </div>
          </div>
        </section>

        <section id="rooms" className="bg-[#101114]">
          <div className="mx-auto max-w-7xl px-5 py-10 sm:px-6">
            <RoomManager
              userDefaultRoom={userWorkspace}
              onRoomCreated={(room) => {
                console.log('New room created:', room.roomId);
                showToast(`Room "${room.name}" created successfully!`, 'success');
              }}
            />
          </div>
        </section>

        <section className="border-t border-white/10 bg-[#141519]">
          <div className="mx-auto max-w-7xl px-5 py-10 sm:px-6">
            <div className="mb-6 flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
              <div>
                <p className="text-sm font-medium text-emerald-300">Workflow</p>
                <h3 className="mt-2 text-2xl font-semibold text-white">Tools arranged around coding</h3>
              </div>
              <p className="max-w-xl text-sm leading-6 text-zinc-400">
                The main actions stay close, supporting details are quieter, and room management behaves like an operational dashboard.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {featureHighlights.map(({ icon: Icon, title, description, tone }) => (
                <div key={title} className="rounded-lg border border-white/10 bg-white/[0.04] p-5">
                  <div className={`mb-4 flex h-10 w-10 items-center justify-center rounded-lg border ${tone}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <h4 className="text-base font-semibold text-white">{title}</h4>
                  <p className="mt-2 text-sm leading-6 text-zinc-400">{description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default HomePage;
