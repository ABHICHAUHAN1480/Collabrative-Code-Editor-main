import React, { useEffect, useRef, useState } from 'react';
import Editor from '@monaco-editor/react';
import { useEditor } from '../../context/EditorContext';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import { apiService } from '../../services/api';
import {
  Download,
  Copy,
  Check,
  FileCode,
  FolderPlus,
  FilePlus
} from 'lucide-react';
import toast from 'react-hot-toast';

const CodeEditor = ({ roomId, projectId }) => {
  const { currentFile, updateFile, setCurrentFile } = useEditor();
  const { socket, connected } = useSocket();
  const { user } = useAuth();
  const editorRef = useRef(null);
  const [copied, setCopied] = useState(false);
  const lastSyncRef = useRef(null);
  const syncTimeoutRef = useRef(null);
  const isUpdatingFromRemoteRef = useRef(false);
  const saveTimeoutRef = useRef(null);
  console.log('🔍 CodeEditor render:', { currentFile: currentFile?.name, roomId, projectId });

   const saveFileToDB = async (fileId, content, language) => {
      try {
        const payload = {
          content,
          fileType: language,
          room: roomId || null
        };

        await apiService.updateFile(fileId, payload);

        console.log("💾 File saved to DB");
      } catch (error) {
        console.error("❌ Failed to save file:", error);
        toast.error("Failed to save file");
      }
    };
  useEffect(() => {
    if (!currentFile && editorRef.current) {
      console.log('📄 No file selected, clearing editor');
      editorRef.current.setValue('');
    }
  }, [currentFile]);

  useEffect(() => {
    if (!socket || !connected || !currentFile || !user) {
      console.log('⏳ Not ready for code sync:', {
        hasSocket: !!socket,
        connected,
        hasFile: !!currentFile,
        hasUser: !!user
      });
      return;
    }

    console.log('🔌 Setting up code sync listener:', {
      file: currentFile.name,
      fileId: currentFile.id,
      userId: user._id,
      projectId,
      roomId
    });
    const handleCodeUpdate = (data) => {
      console.log('📥 RECEIVE: code-updated', {
        fileId: data.fileId,
        currentFileId: currentFile?.id,
        fromUserId: data.user?.id,
        myUserId: user?._id,
        fromUser: data.user?.username,
        contentLength: data.content?.length
      });

      const incomingUserId = data.user?.id?.toString();
      const myUserId = user?._id?.toString();

      console.log('🔍 User ID comparison:', {
        incoming: incomingUserId,
        mine: myUserId,
        match: incomingUserId === myUserId
      });

      if (incomingUserId === myUserId) {
        console.log('⏭️ Ignoring - OWN change detected');
        return;
      }

      if (data.fileId !== currentFile?.id) {
        console.log('⏭️ Ignoring - different file');
        return;
      }

      console.log('🔔 CODE UPDATE RECEIVED from:', data.user?.username);

      if (editorRef.current && data.content !== undefined) {
        isUpdatingFromRemoteRef.current = true;

        const currentPosition = editorRef.current.getPosition();
        console.log('✅ APPLYING REMOTE UPDATE from:', data.user?.username);
        editorRef.current.setValue(data.content);
        if (currentPosition) {
          editorRef.current.setPosition(currentPosition);
        }

        updateFile({ id: currentFile.id, content: data.content });
        console.log('✅ Editor updated from remote');

        setTimeout(() => {
          isUpdatingFromRemoteRef.current = false;
        }, 100);
      }
    };

    socket.on('code-updated', handleCodeUpdate);
    console.log('✅ Code sync listeners registered for:', currentFile.name);

    return () => {
      socket.off('code-updated', handleCodeUpdate);
      console.log('🧹 Code sync listener removed for:', currentFile.name);
    };
  }, [socket, connected, currentFile, user, projectId, roomId, updateFile]);

  const handleEditorDidMount = (editor) => {
    editorRef.current = editor;
    console.log('✅ Editor mounted');
  };

  const handleEditorChange = (value) => {
    if (isUpdatingFromRemoteRef.current) {
      console.log('⏭️ Skipping - change from remote update');
      return;
    }

    if (!currentFile) {
      console.log('⏭️ No file selected, ignoring change');
      return;
    }

    console.log('📝 Local change, length:', value?.length);

    updateFile({ id: currentFile.id, content: value });
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      saveFileToDB(currentFile.id, value, currentFile.language);
    }, 1000);

    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }

    syncTimeoutRef.current = setTimeout(() => {
      if (socket && connected && value !== lastSyncRef.current) {
        console.log('📡 Broadcasting code change:', {
          fileId: currentFile.id,
          contentLength: value?.length,
          roomId,
          projectId,
          userId: user._id
        });

        socket.emit('code-change', {
          fileId: currentFile.id,
          content: value,
          language: currentFile.language || 'javascript',
          roomId: roomId,
          projectId: projectId,
          user: {
            id: user._id,
            username: user.username
          }
        });

        lastSyncRef.current = value;
        console.log('📤 Code change emitted');
      }
    }, 300);
  };

  const handleDownloadFile = () => {
    if (!currentFile) {
      toast.error('No file selected');
      return;
    }

    const blob = new Blob([currentFile.content || ''], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = currentFile.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('File downloaded');
  };

  const handleCopyCode = () => {
    if (!currentFile) {
      toast.error('No file selected');
      return;
    }

    navigator.clipboard.writeText(currentFile.content || '');
    setCopied(true);
    toast.success('Code copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  if (!currentFile) {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-[#0f1013] text-zinc-400">
        <div className="max-w-md space-y-6 px-8 text-center">
          <div className="flex justify-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04]">
              <FileCode className="h-10 w-10 text-emerald-300" />
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-semibold text-white">
              No File Selected
            </h2>
            <p className="text-sm leading-6 text-zinc-500">
              Select a file from the explorer to open it in the editor.
            </p>
          </div>

          <div className="grid gap-3 pt-2 sm:grid-cols-2">
            <div className="rounded-lg border border-white/10 bg-white/[0.035] p-4 text-left">
              <FilePlus className="mb-3 h-5 w-5 text-emerald-300" />
              <p className="text-sm font-medium text-white">Files</p>
              <p className="mt-1 text-xs leading-5 text-zinc-500">Workspace and project files appear in the left panel.</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/[0.035] p-4 text-left">
              <FolderPlus className="mb-3 h-5 w-5 text-amber-300" />
              <p className="text-sm font-medium text-white">Projects</p>
              <p className="mt-1 text-xs leading-5 text-zinc-500">Group files by collaboration or feature work.</p>
            </div>
          </div>

          <div className="border-t border-white/10 pt-5">
            <p className="text-xs text-zinc-600">
              Changes sync automatically when collaborators are connected.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-[#0f1013]">
      <div className="flex flex-shrink-0 items-center justify-between border-b border-white/10 bg-[#15171c] px-4 py-2">
        <div className="flex min-w-0 items-center gap-3">
          <FileCode className="h-4 w-4 flex-shrink-0 text-emerald-300" />
          <span className="truncate text-sm font-medium text-white">
            {currentFile.name}
          </span>
          <span className="rounded bg-white/[0.06] px-2 py-0.5 text-xs text-zinc-400">
            {currentFile.language || 'text'}
          </span>
          {connected && (
            <span className="flex items-center gap-1 text-xs text-emerald-300">
              <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
              <span>Live</span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyCode}
            className="rounded-md p-1.5 text-zinc-400 transition-colors hover:bg-white/[0.08] hover:text-white"
            title="Copy Code"
          >
            {copied ? (
              <Check className="w-4 h-4 text-green-400" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </button>

          <button
            onClick={handleDownloadFile}
            className="rounded-md p-1.5 text-zinc-400 transition-colors hover:bg-white/[0.08] hover:text-white"
            title="Download File"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <Editor
          height="100%"
          language={currentFile.language || 'javascript'}
          value={currentFile.content || ''}
          onChange={handleEditorChange}
          onMount={handleEditorDidMount}
          theme="vs-dark"
          options={{
            minimap: { enabled: true },
            fontSize: 14,
            lineNumbers: 'on',
            roundedSelection: true,
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 2,
            wordWrap: 'on',
            formatOnPaste: true,
            formatOnType: true,
            suggestOnTriggerCharacters: true,
            acceptSuggestionOnEnter: 'on',
            quickSuggestions: true,
          }}
        />

      </div>
    </div>
  );
};

export default CodeEditor;
