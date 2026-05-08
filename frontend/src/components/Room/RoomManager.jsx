import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { apiService } from '../../services/api';
import { 
  Users, 
  Plus, 
  Copy, 
  Share, 
  Code, 
  Globe, 
  Lock, 
  Home,
  AlertCircle,
  Loader,
  LogIn,
  Trash2,
  MoreVertical
} from 'lucide-react';
import toast from 'react-hot-toast';

const RoomManager = ({ onRoomSelect, currentRoomId, userDefaultRoom, onRoomCreated }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [roomToDelete, setRoomToDelete] = useState(null);
  const [userRooms, setUserRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [activeMenu, setActiveMenu] = useState(null);
  
  const [newRoomData, setNewRoomData] = useState({
    name: '',
    description: '',
    isPrivate: false
  });
  
  const [joinRoomData, setJoinRoomData] = useState({
    roomId: ''
  });

  useEffect(() => {
    loadUserRooms();
  }, []);

  const loadUserRooms = async () => {
    try {
      setLoading(true);
      const response = await apiService.getRooms();
      
      if (response.success) {
        const filteredRooms = response.data.rooms.filter(room => {

          if (room.isWorkspace) return false;
          
          const isOwner = room.owner._id === user._id || room.owner === user._id;
          
          const isParticipant = room.participants?.some(p => {
            const participantId = typeof p.user === 'object' ? p.user._id : p.user;
            return participantId === user._id;
          });
          
          return isOwner || isParticipant;
        });
        
        filteredRooms.sort((a, b) => new Date(b.lastActivity || b.createdAt) - new Date(a.lastActivity || a.createdAt));
        
        console.log(`Loaded ${filteredRooms.length} additional rooms for user ${user.username}`);
        setUserRooms(filteredRooms);
      }
    } catch (error) {
      console.error('Error loading rooms:', error);
      showToast('Failed to load rooms', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRoom = async () => {
    if (!newRoomData.name.trim()) {
      showToast('Room name is required', 'error');
      return;
    }

    setCreating(true);
    try {
      const response = await apiService.createRoom({
        ...newRoomData,
        name: newRoomData.name.trim(),
        description: newRoomData.description.trim()
      });

      if (response.success) {
        const newRoom = response.data.room;
        showToast(`Room "${newRoom.name}" created successfully!`, 'success');
        
        const roomWithOwner = {
          ...newRoom,
          owner: { _id: user._id, username: user.username },
          participants: [],
          activeParticipants: []
        };
        setUserRooms(prev => [roomWithOwner, ...prev]);
        
        setShowCreateModal(false);
        setNewRoomData({ name: '', description: '', isPrivate: false });
        
        if (onRoomCreated) {
          onRoomCreated(newRoom);
        }
        
        showToast(
          `Room created! Share your Room ID: ${newRoom.roomId}`,
          'success'
        );
      } else {
        showToast(response.message || 'Failed to create room', 'error');
      }
    } catch (error) {
      console.error('Error creating room:', error);
      showToast('Failed to create room', 'error');
    } finally {
      setCreating(false);
    }
  };

  const handleJoinRoom = async () => {
    if (!joinRoomData.roomId.trim()) {
      showToast('Room ID is required', 'error');
      return;
    }

    setJoining(true);
    try {
      const response = await apiService.joinRoom(joinRoomData.roomId.trim());

      if (response.success) {
        showToast('Joined room successfully!', 'success');
        setShowJoinModal(false);
        setJoinRoomData({ roomId: '' });
        
        await loadUserRooms();
        
        navigate(`/editor/${joinRoomData.roomId.trim()}`);
        
        if (onRoomSelect) {
          onRoomSelect(joinRoomData.roomId.trim());
        }
      } else {
        showToast(response.message || 'Failed to join room', 'error');
      }
    } catch (error) {
      console.error('Error joining room:', error);
      if (error.response?.status === 404) {
        showToast('Room not found. Please check the Room ID.', 'error');
      } else {
        showToast('Failed to join room', 'error');
      }
    } finally {
      setJoining(false);
    }
  };

  const handleDeleteRoom = (room) => {
    const isOwner = room.owner._id === user._id || room.owner === user._id;
    
    if (!isOwner) {
      showToast('Only the room owner can delete this room', 'error');
      return;
    }
    
    setRoomToDelete(room);
    setShowDeleteConfirm(true);
    setActiveMenu(null);
  };

  const confirmDeleteRoom = async () => {
    if (!roomToDelete) return;

    setDeleting(true);
    try {
      console.log(`Deleting room: ${roomToDelete.name} (${roomToDelete.roomId})`);
      
      const response = await apiService.deleteRoom(roomToDelete.roomId);
      
      if (response.success) {
        showToast(`Room "${roomToDelete.name}" deleted successfully`, 'success');
        
        setUserRooms(prev => prev.filter(r => r.roomId !== roomToDelete.roomId));
        
        setShowDeleteConfirm(false);
        setRoomToDelete(null);
        
        console.log(`Successfully deleted room ${roomToDelete.roomId}`);
      } else {
        showToast(response.message || 'Failed to delete room', 'error');
      }
    } catch (error) {
      console.error('Error deleting room:', error);
      showToast(error.response?.data?.message || 'Failed to delete room', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const copyRoomId = (roomId) => {
    navigator.clipboard.writeText(roomId);
    showToast('Room ID copied to clipboard!', 'success');
  };

  const shareRoom = (room) => {
    const shareText = `Join my coding room on CodeCollab!\n\nRoom Name: ${room.name}\nRoom ID: ${room.roomId}\n\nJoin at: ${window.location.origin}/editor/${room.roomId}`;
    
    if (navigator.share) {
      navigator.share({
        title: `Join ${room.name} on CodeCollab`,
        text: shareText,
        url: `${window.location.origin}/editor/${room.roomId}`
      });
    } else {
      navigator.clipboard.writeText(shareText);
      showToast('Room details copied to clipboard!', 'success');
    }
  };

  const showToast = (message, type = 'info') => {
    const toastId = toast[type](message, {
      duration: 3000,
      position: 'top-right'
    });
    setTimeout(() => toast.dismiss(toastId), 3000);
  };

  const isRoomOwner = (room) => {
    return room.owner._id === user._id || room.owner === user._id;
  };

  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.035] p-4 sm:p-6">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-medium text-emerald-300">Rooms</p>
            <h2 className="mt-1 text-2xl font-semibold text-white">My coding spaces</h2>
            <p className="mt-1 text-sm text-zinc-400">Enter your workspace, create a focused room, or join a collaborator.</p>
          </div>
          
          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              onClick={() => setShowJoinModal(true)}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/[0.06] px-4 py-2 text-sm font-semibold text-zinc-100 transition hover:border-white/20 hover:bg-white/[0.1]"
            >
              <LogIn className="w-4 h-4" />
              <span>Join Room</span>
            </button>
            
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-400 px-4 py-2 text-sm font-semibold text-zinc-950 transition hover:bg-emerald-300"
            >
              <Plus className="w-4 h-4" />
              <span>Create Room</span>
            </button>
          </div>
        </div>

  
        {userDefaultRoom && (
          <div className="mb-8 rounded-lg border border-emerald-400/20 bg-emerald-400/10 p-5">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex-1">
                <div className="mb-2 flex items-center gap-3">
                  <Home className="h-6 w-6 text-emerald-300" />
                  <h3 className="text-xl font-semibold text-white">My Workspace</h3>
                </div>
                <p className="mb-4 max-w-2xl text-sm leading-6 text-emerald-50/80">
                  Your personal workspace. Files persist forever and collaborators can always find you here.
                </p>
                <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-3">
                  <div>
                    <span className="text-emerald-200/80">Room ID</span>
                    <div className="mt-1 flex items-center gap-2">
                      <code className="rounded bg-black/25 px-2 py-1 font-mono text-emerald-100">{userDefaultRoom.roomId}</code>
                      <button
                        onClick={() => copyRoomId(userDefaultRoom.roomId)}
                        className="text-emerald-200 hover:text-white"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                  <div>
                    <span className="text-emerald-200/80">Status</span>
                    <p className="mt-1 font-medium text-emerald-100">Always Available</p>
                  </div>
                  <div>
                    <span className="text-emerald-200/80">Visibility</span>
                    <p className="mt-1 font-medium text-emerald-100">
                      {userDefaultRoom.isPrivate ? 'Private' : 'Public'}
                    </p>
                  </div>
                </div>
              </div>
              <button
                onClick={() => navigate(`/editor/${userDefaultRoom.roomId}`)}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-300 px-5 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-emerald-200"
              >
                <Code className="w-5 h-5" />
                <span>Enter Workspace</span>
              </button>
            </div>
          </div>
        )}

      
        <div className="mb-6">
          <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
            <Users className="w-5 h-5 text-sky-300" />
            <span>Additional Rooms</span>
          </h3>
          
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <Loader className="w-8 h-8 text-purple-500 animate-spin" />
            </div>
          ) : userRooms.length === 0 ? (
            <div className="rounded-lg border border-dashed border-white/15 bg-white/[0.03] p-8 text-center">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h4 className="text-lg font-semibold text-white mb-2">No additional rooms</h4>
              <p className="text-gray-400 mb-4">
                Create rooms for different projects or join others' rooms to collaborate.
              </p>
              <div className="flex flex-col justify-center gap-3 sm:flex-row">
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-400 px-4 py-2 text-sm font-semibold text-zinc-950 transition hover:bg-emerald-300"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Room</span>
                </button>
                <button
                  onClick={() => setShowJoinModal(true)}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/[0.06] px-4 py-2 text-sm font-semibold text-zinc-100 transition hover:border-white/20 hover:bg-white/[0.1]"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Join Room</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {userRooms.map((room) => {
                const isOwner = isRoomOwner(room);
                
                return (
                  <div key={room.roomId} className="relative rounded-lg border border-white/10 bg-[#15171c] p-4 transition hover:border-white/20">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className="text-lg font-semibold text-white truncate">{room.name}</h4>
                          {room.isPrivate ? (
                            <Lock className="w-4 h-4 text-yellow-400" />
                          ) : (
                            <Globe className="w-4 h-4 text-green-400" />
                          )}
                          {isOwner && (
                            <span className="bg-purple-600/20 text-purple-300 px-2 py-0.5 rounded text-xs">
                              Owner
                            </span>
                          )}
                        </div>
                        {room.description && (
                          <p className="text-gray-400 text-sm mb-2 line-clamp-2">{room.description}</p>
                        )}
                      </div>
                  
                      {isOwner && (
                        <div className="relative">
                          <button
                            onClick={() => setActiveMenu(activeMenu === room.roomId ? null : room.roomId)}
                            className="p-1 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>
                          
                          {activeMenu === room.roomId && (
                            <>
                              <div 
                                className="fixed inset-0 z-10" 
                                onClick={() => setActiveMenu(null)}
                              />
                              <div className="absolute right-0 top-8 z-20 w-40 rounded-lg border border-white/10 bg-[#1c1f26] shadow-lg">
                                <button
                                  onClick={() => handleDeleteRoom(room)}
                                  className="w-full text-left px-3 py-2 text-red-300 hover:text-red-200 hover:bg-red-500/10 rounded-lg transition-colors flex items-center space-x-2"
                                >
                                  <Trash2 className="w-4 h-4" />
                                  <span>Delete Room</span>
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-400">Room ID:</span>
                        <div className="flex items-center space-x-1">
                          <code className="rounded bg-black/25 px-2 py-1 font-mono text-xs text-emerald-200">{room.roomId}</code>
                          <button
                            onClick={() => copyRoomId(room.roomId)}
                            className="text-gray-400 hover:text-white"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-400">Active Users:</span>
                        <span className="text-green-400">{room.activeParticipants?.length || 0}</span>
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      <button
                        onClick={() => navigate(`/editor/${room.roomId}`)}
                        className={`flex-1 flex items-center justify-center space-x-2 py-2 px-3 rounded-lg transition-colors ${
                          currentRoomId === room.roomId
                            ? 'bg-emerald-400 text-zinc-950'
                            : 'bg-white/[0.06] hover:bg-white/[0.1] text-gray-300 hover:text-white'
                        }`}
                      >
                        <Code className="w-4 h-4" />
                        <span>{currentRoomId === room.roomId ? 'Current' : 'Enter'}</span>
                      </button>
                      
                      <button
                        onClick={() => shareRoom(room)}
                        className="rounded-lg bg-white/[0.06] p-2 text-gray-300 transition-colors hover:bg-white/[0.1] hover:text-white"
                        title="Share Room"
                      >
                        <Share className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="rounded-lg border border-sky-400/20 bg-sky-400/10 p-4">
          <div className="flex items-start space-x-3">
            <AlertCircle className="mt-0.5 h-5 w-5 text-sky-300" />
            <div>
              <h4 className="mb-1 font-semibold text-sky-200">Privacy Note</h4>
              <p className="text-sm leading-6 text-sky-100/80">
                Only YOU can see your rooms listed here. Others cannot see your workspace or rooms unless you share the Room ID with them. Once you leave a room, you can rejoin anytime using the Room ID.
              </p>
            </div>
          </div>
        </div>

        {showCreateModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-lg p-6 w-96 border border-gray-600 shadow-2xl">
              <h3 className="text-white text-xl font-semibold mb-4">Create New Room</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-gray-300 text-sm mb-2">Room Name *</label>
                  <input
                    type="text"
                    value={newRoomData.name}
                    onChange={(e) => setNewRoomData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full bg-gray-700 text-white px-3 py-2 rounded border border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="My Coding Room"
                    maxLength={50}
                  />
                </div>
                
                <div>
                  <label className="block text-gray-300 text-sm mb-2">Description</label>
                  <textarea
                    value={newRoomData.description}
                    onChange={(e) => setNewRoomData(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full bg-gray-700 text-white px-3 py-2 rounded border border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                    placeholder="What are you working on?"
                    rows="3"
                    maxLength={200}
                  />
                </div>
                
                <div>
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={newRoomData.isPrivate}
                      onChange={(e) => setNewRoomData(prev => ({ ...prev, isPrivate: e.target.checked }))}
                      className="w-4 h-4 text-purple-600 bg-gray-700 border-gray-600 rounded focus:ring-purple-500"
                    />
                    <div>
                      <span className="text-white font-medium">Private Room</span>
                      <p className="text-gray-400 text-sm">Only people with Room ID can join</p>
                    </div>
                  </label>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setNewRoomData({ name: '', description: '', isPrivate: false });
                  }}
                  className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateRoom}
                  disabled={creating || !newRoomData.name.trim()}
                  className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {creating ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      <span>Creating...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      <span>Create Room</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {showJoinModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-lg p-6 w-96 border border-gray-600 shadow-2xl">
              <h3 className="text-white text-xl font-semibold mb-4">Join Room</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-gray-300 text-sm mb-2">Room ID *</label>
                  <input
                    type="text"
                    value={joinRoomData.roomId}
                    onChange={(e) => setJoinRoomData({ roomId: e.target.value })}
                    className="w-full bg-gray-700 text-white px-3 py-2 rounded border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter Room ID"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Ask someone to share their Room ID
                  </p>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowJoinModal(false);
                    setJoinRoomData({ roomId: '' });
                  }}
                  className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleJoinRoom}
                  disabled={joining || !joinRoomData.roomId.trim()}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {joining ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      <span>Joining...</span>
                    </>
                  ) : (
                    <>
                      <LogIn className="w-4 h-4" />
                      <span>Join Room</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {showDeleteConfirm && roomToDelete && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-lg p-6 w-96 border border-red-600 shadow-2xl">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center">
                  <Trash2 className="w-5 h-5 text-red-400" />
                </div>
                <h3 className="text-white text-lg font-medium">Delete Room</h3>
              </div>
              
              <div className="mb-6">
                <p className="text-gray-300 mb-2">
                  Are you sure you want to delete "<span className="font-medium text-white">{roomToDelete.name}</span>"?
                </p>
                <div className="bg-red-900/20 border border-red-700/30 rounded p-3">
                  <p className="text-red-300 text-sm font-medium mb-1">This action cannot be undone!</p>
                  <p className="text-red-400 text-sm">
                    All files, folders, chat history, and participants will lose access to this room permanently.
                  </p>
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setRoomToDelete(null);
                  }}
                  disabled={deleting}
                  className="px-4 py-2 text-gray-300 hover:text-white transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteRoom}
                  disabled={deleting}
                  className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {deleting ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      <span>Deleting...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      <span>Delete Room</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RoomManager;
