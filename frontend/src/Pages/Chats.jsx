import React, { useState, useRef, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { ChatState } from '../context/ChatProvider';

const BACKEND_URL = (import.meta.env.VITE_BACKEND_URL || `http://${window.location.hostname}:5000`).replace(/\/$/, '');
const API = `${BACKEND_URL}/api`;
const SOCKET_ENDPOINT = BACKEND_URL;
let socket;

function getInitials(name = '') {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}
function getSenderName(chat, meId) {
  if (chat.isGroupChat) return chat.chatName;
  const other = chat.users?.find(u => u._id !== meId);
  return other?.name || chat.chatName;
}
function getSenderPic(chat, meId) {
  if (chat.isGroupChat) return chat.groupPic || null;
  return chat.users?.find(u => u._id !== meId)?.pic || null;
}

function Avatar({ name, src, size = 36 }) {
  return src ? (
    <img src={src} alt={name} style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
  ) : (
    <div style={{ width: size, height: size, borderRadius: '50%', background: '#d0d0d0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.38, fontWeight: 600, color: '#555', flexShrink: 0 }}>
      {getInitials(name)}
    </div>
  );
}

function ProfileDropdown({ user, onClose, onLogout, onPicUpdate }) {
  const ref = useRef(null);
  const fileRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  const handlePicChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.append('pic', file);
      const res = await axios.put(`${API}/user/pic`, form, {
        headers: { Authorization: `Bearer ${user.token}`, 'Content-Type': 'multipart/form-data' },
      });
      onPicUpdate(res.data);
    } catch (e) { console.error('pic update failed', e); }
    finally { setUploading(false); }
  };

  return (
    <div ref={ref} style={{
      position: 'fixed', top: 58, right: 16, zIndex: 99999,
      background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
      border: '1px solid rgba(255,255,255,0.6)', borderRadius: 16,
      boxShadow: '0 8px 32px rgba(0,0,0,0.22)',
      padding: '20px 24px', minWidth: 220,
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
      animation: 'fadeSlideDown 0.18s ease'
    }}>
      <style>{`@keyframes fadeSlideDown { from { opacity:0; transform:translateY(-8px);} to { opacity:1; transform:translateY(0);} }`}</style>

      <div style={{ position: 'relative', cursor: 'pointer' }} onClick={() => fileRef.current?.click()} title="Change photo">
        {user?.pic
          ? <img src={user.pic} alt={user?.name} style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover', border: '3px solid rgba(255,255,255,0.8)', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }} />
          : <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'linear-gradient(135deg,#a8d8d8,#7bb8c0)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, fontWeight: 700, color: '#fff', border: '3px solid rgba(255,255,255,0.8)', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
              {getInitials(user?.name)}
            </div>
        }
        <div style={{ position: 'absolute', bottom: 0, right: 0, width: 22, height: 22, borderRadius: '50%', background: '#4db6ac', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #fff' }}>
          {uploading
            ? <div style={{ width: 10, height: 10, border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin .6s linear infinite' }} />
            : <svg width="10" height="10" fill="white" viewBox="0 0 24 24"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
          }
        </div>
      </div>
      <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePicChange} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      <div style={{ textAlign: 'center' }}>
        <div style={{ fontWeight: 700, fontSize: 16, color: '#111', marginBottom: 4 }}>{user?.name}</div>
        <div style={{ fontSize: 13, color: '#666', wordBreak: 'break-all' }}>{user?.email}</div>
      </div>
      <div style={{ width: '100%', height: 1, background: 'rgba(0,0,0,0.08)', margin: '4px 0' }} />
      <button
        onClick={onLogout}
        style={{
          width: '100%', padding: '8px 0', border: 'none', borderRadius: 10,
          background: 'linear-gradient(135deg,#ff6b6b,#ee5a24)',
          color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          boxShadow: '0 2px 8px rgba(238,90,36,0.25)', transition: 'opacity 0.15s'
        }}
        onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
        onMouseLeave={e => e.currentTarget.style.opacity = '1'}
      >
        <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
          <polyline points="16 17 21 12 16 7" />
          <line x1="21" y1="12" x2="9" y2="12" />
        </svg>
        Logout
      </button>
    </div>
  );
}

function SearchDrawer({ open, onClose, token, onChatOpen }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
    else { setQuery(''); setResults([]); }
  }, [open]);

  const search = async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const { data } = await axios.get(`${API}/user?search=${query}`, { headers: { Authorization: `Bearer ${token}` } });
      setResults(data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.25)', zIndex: 100, opacity: open ? 1 : 0, pointerEvents: open ? 'all' : 'none', transition: 'opacity 0.2s' }} />
      <div style={{ position: 'fixed', top: 0, left: 0, bottom: 0, width: 300, background: '#fff', zIndex: 101, transform: open ? 'translateX(0)' : 'translateX(-100%)', transition: 'transform 0.25s cubic-bezier(.4,0,.2,1)', display: 'flex', flexDirection: 'column', padding: '24px 20px', boxShadow: '4px 0 24px rgba(0,0,0,0.1)' }}>
        <h2 style={{ margin: '0 0 20px', fontSize: 18, fontWeight: 600, color: '#111' }}>Search Users</h2>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <input ref={inputRef} value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && search()} placeholder="Search by name or email" style={{ flex: 1, padding: '8px 12px', border: '1px solid #e0e0e0', borderRadius: 8, fontSize: 14, outline: 'none', color: '#111' }} />
          <button onClick={search} style={{ padding: '8px 14px', background: '#111', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, cursor: 'pointer' }}>Go</button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {loading && <p style={{ fontSize: 13, color: '#888', textAlign: 'center', marginTop: 20 }}>Searching...</p>}
          {!loading && results.map(u => (
            <div key={u._id} onClick={() => { onChatOpen(u._id); onClose(); }} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 8px', borderRadius: 8, cursor: 'pointer' }}>
              <Avatar name={u.name} src={u.pic} size={38} />
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#111' }}>{u.name}</div>
                <div style={{ fontSize: 12, color: '#888' }}>Email : {u.email}</div>
              </div>
            </div>
          ))}
          {!loading && query && results.length === 0 && <p style={{ fontSize: 13, color: '#888', textAlign: 'center', marginTop: 20 }}>No users found</p>}
        </div>
      </div>
    </>
  );
}

function ProfileModal({ chat, meId, onClose }) {
  if (!chat || chat.isGroupChat) return null;
  const name  = getSenderName(chat, meId);
  const pic   = getSenderPic(chat, meId);
  const email = chat.users?.find(u => u._id !== meId)?.email;
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 16, padding: '32px 40px', minWidth: 320, textAlign: 'center', position: 'relative', boxShadow: '0 8px 40px rgba(0,0,0,0.12)' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: 14, right: 16, background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: '#888' }}>✕</button>
        <Avatar name={name} src={pic} size={90} />
        <h2 style={{ margin: '16px 0 4px', fontSize: 20, fontWeight: 700 }}>{name}</h2>
        {email && <p style={{ margin: 0, color: '#666', fontSize: 14 }}>{email}</p>}
        <button onClick={onClose} style={{ marginTop: 20, padding: '8px 28px', border: '1px solid #ccc', borderRadius: 8, cursor: 'pointer', fontSize: 14, background: '#fff' }}>Close</button>
      </div>
    </div>
  );
}

function GroupInfoModal({ chat, token, meId, onClose, onUpdated, onNewMessage }) {
  const [newName, setNewName]       = useState(chat.chatName || '');
  const [query, setQuery]           = useState('');
  const [results, setResults]       = useState([]);
  const [searching, setSearching]   = useState(false);
  const [saving, setSaving]         = useState(false);
  const [uploadingPic, setUploadingPic] = useState(false);
  const [err, setErr]               = useState('');
  const picRef = useRef(null);
  const isAdmin = chat.groupAdmin?._id === meId || chat.groupAdmin === meId;

  const searchUsers = async q => {
    if (!q.trim()) { setResults([]); return; }
    setSearching(true);
    try {
      const { data } = await axios.get(`${API}/user?search=${q}`, { headers: { Authorization: `Bearer ${token}` } });
      setResults(data.filter(u => !chat.users.find(m => m._id === u._id)));
    } catch {} finally { setSearching(false); }
  };

  const notifyUpdate = (data) => {
    if (socket) socket.emit('update group', data);
    onUpdated(data);
  };

  const rename = async () => {
    if (!newName.trim() || newName === chat.chatName) return;
    setSaving(true);
    try {
      const { data } = await axios.put(`${API}/chat/rename`, { chatId: chat._id, chatName: newName }, { headers: { Authorization: `Bearer ${token}` } });
      notifyUpdate(data); setErr('');
    } catch (e) { setErr(e.response?.data?.message || 'Rename failed'); }
    finally { setSaving(false); }
  };

  const handleGroupPic = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingPic(true);
    try {
      const form = new FormData();
      form.append('pic', file);
      form.append('chatId', chat._id);
      const { data } = await axios.put(`${API}/chat/grouppic`, form, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' },
      });
      notifyUpdate(data);
    } catch (e) { setErr('Failed to upload group pic'); }
    finally { setUploadingPic(false); }
  };

  const addUser = async u => {
    try {
      const { data } = await axios.put(`${API}/chat/groupadd`, { chatId: chat._id, userId: u._id }, { headers: { Authorization: `Bearer ${token}` } });
      if (socket) socket.emit('add user', { addedUserId: u._id, chat: data });
      const msgRes = await axios.post(`${API}/message`, { content: `${u.name} joined the group`, chatId: chat._id, isSystem: true }, { headers: { Authorization: `Bearer ${token}` } });
      if (socket) socket.emit('new message', msgRes.data);
      if (onNewMessage) onNewMessage(msgRes.data);
      notifyUpdate(data); setQuery(''); setResults([]);
    } catch (e) { setErr(e.response?.data?.message || 'Failed to add user'); }
  };

  const removeUser = async u => {
    try {
      const { data } = await axios.put(`${API}/chat/groupremove`, { chatId: chat._id, userId: u._id }, { headers: { Authorization: `Bearer ${token}` } });
      if (socket) socket.emit('remove user', { removedUserId: u._id, chatId: chat._id });
      const isLeave = u._id === meId;
      const msgContent = isLeave ? `${u.name} left the group` : `${u.name} was removed`;
      const msgRes = await axios.post(`${API}/message`, { content: msgContent, chatId: chat._id, isSystem: true }, { headers: { Authorization: `Bearer ${token}` } });
      if (socket) socket.emit('new message', msgRes.data);
      if (onNewMessage && !isLeave) onNewMessage(msgRes.data);
      notifyUpdate(data);
    } catch (e) { setErr(e.response?.data?.message || 'Failed to remove user'); }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300 }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 18, width: 400, maxWidth: '95vw', maxHeight: '85vh', overflowY: 'auto', position: 'relative', boxShadow: '0 12px 48px rgba(0,0,0,0.18)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '22px 24px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Group Info</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#888', lineHeight: 1 }}>✕</button>
        </div>

        <div style={{ padding: '16px 24px 24px', display: 'flex', flexDirection: 'column', gap: 18 }}>
          {err && <div style={{ padding: '8px 12px', background: '#fdecea', borderRadius: 8, color: '#c62828', fontSize: 13 }}>{err}</div>}

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <div style={{ position: 'relative', cursor: 'pointer' }} onClick={() => picRef.current?.click()} title="Change group photo">
              {chat.groupPic
                ? <img src={chat.groupPic} alt="group" style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover', border: '3px solid #e0f2f1' }} />
                : <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'linear-gradient(135deg,#4db6ac,#00897b)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30, fontWeight: 700, color: '#fff' }}>
                    {getInitials(chat.chatName)}
                  </div>
              }
              <div style={{ position: 'absolute', bottom: 0, right: 0, width: 24, height: 24, borderRadius: '50%', background: '#4db6ac', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #fff' }}>
                {uploadingPic
                  ? <div style={{ width: 10, height: 10, border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin .6s linear infinite' }} />
                  : <svg width="11" height="11" fill="white" viewBox="0 0 24 24"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
                }
              </div>
            </div>
            <input ref={picRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleGroupPic} />
            <span style={{ fontSize: 11, color: '#aaa' }}>Click to change group photo</span>
          </div>

          {isAdmin && (
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: 1 }}>Group Name</label>
              <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                <input
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && rename()}
                  style={{ flex: 1, padding: '8px 12px', border: '1px solid #e0e0e0', borderRadius: 8, fontSize: 14, outline: 'none' }}
                />
                <button onClick={rename} disabled={saving} style={{ padding: '8px 14px', background: '#4db6ac', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                  {saving ? '...' : 'Save'}
                </button>
              </div>
            </div>
          )}

          {isAdmin && (
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: 1 }}>Add Member</label>
              <input
                value={query}
                onChange={e => { setQuery(e.target.value); searchUsers(e.target.value); }}
                placeholder="Search by name or email"
                style={{ width: '100%', marginTop: 6, padding: '8px 12px', border: '1px solid #e0e0e0', borderRadius: 8, fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
              />
              {searching && <p style={{ fontSize: 12, color: '#888', margin: '4px 0 0' }}>Searching...</p>}
              {results.length > 0 && (
                <div style={{ border: '1px solid #eee', borderRadius: 8, marginTop: 6, maxHeight: 140, overflowY: 'auto' }}>
                  {results.map(u => (
                    <div key={u._id} onClick={() => addUser(u)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid #f5f5f5' }}>
                      <Avatar name={u.name} src={u.pic} size={32} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>{u.name}</div>
                        <div style={{ fontSize: 11, color: '#888' }}>{u.email}</div>
                      </div>
                      <span style={{ fontSize: 12, color: '#4db6ac', fontWeight: 600 }}>+ Add</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: 1 }}>Members ({chat.users?.length})</label>
            <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {chat.users?.map(u => (
                <div key={u._id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 10, background: '#f9f9f9' }}>
                  <Avatar name={u.name} src={u.pic} size={34} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#111' }}>
                      {u.name}
                      {(u._id === chat.groupAdmin?._id || u._id === chat.groupAdmin) && (
                        <span style={{ marginLeft: 6, fontSize: 10, background: '#4db6ac', color: '#fff', borderRadius: 4, padding: '1px 5px' }}>Admin</span>
                      )}
                    </div>
                    <div style={{ fontSize: 11, color: '#888' }}>{u.email}</div>
                  </div>
                  {isAdmin && u._id !== meId && (
                    <button onClick={() => removeUser(u)} style={{ background: 'none', border: '1px solid #ffcdd2', borderRadius: 6, color: '#e53935', fontSize: 11, padding: '3px 8px', cursor: 'pointer', fontWeight: 600 }}>Remove</button>
                  )}
                  {u._id === meId && (
                    <button onClick={() => removeUser(u)} style={{ background: 'none', border: '1px solid #ffcdd2', borderRadius: 6, color: '#e53935', fontSize: 11, padding: '3px 8px', cursor: 'pointer', fontWeight: 600 }}>Leave</button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function GroupChatModal({ token, meId, onCreated, onClose }) {
  const [chatName, setChatName] = useState('');
  const [userQuery, setUserQuery] = useState('');
  const [searchRes, setSearchRes] = useState([]);
  const [selected, setSelected]   = useState([]);
  const [loading, setLoading]     = useState(false);
  const [creating, setCreating]   = useState(false);
  const [error, setError]         = useState('');

  const searchUsers = async q => {
    if (!q.trim()) { setSearchRes([]); return; }
    setLoading(true);
    try {
      const { data } = await axios.get(`${API}/user?search=${q}`, { headers: { Authorization: `Bearer ${token}` } });
      setSearchRes(data.filter(u => u._id !== meId && !selected.find(s => s._id === u._id)));
    } catch {} finally { setLoading(false); }
  };

  const toggle = u => {
    setSelected(prev => prev.find(s => s._id === u._id) ? prev.filter(s => s._id !== u._id) : [...prev, u]);
    setSearchRes(prev => prev.filter(s => s._id !== u._id));
  };

  const create = async () => {
    if (!chatName.trim()) { setError('Enter a group name'); return; }
    if (selected.length < 2) { setError('Add at least 2 other members'); return; }
    setCreating(true);
    try {
      const { data } = await axios.post(`${API}/chat/group`, { name: chatName, users: selected.map(u => u._id) }, { headers: { Authorization: `Bearer ${token}` } });
      if (socket) {
        selected.forEach(u => socket.emit('add user', { addedUserId: u._id, chat: data }));
      }
      onCreated(data); onClose();
    } catch (e) { setError(e.response?.data?.message || 'Failed to create group'); }
    finally { setCreating(false); }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 18, width: 400, maxWidth: '95vw', maxHeight: '85vh', overflowY: 'auto', position: 'relative', boxShadow: '0 12px 48px rgba(0,0,0,0.18)' }}>
        <div style={{ padding: '22px 24px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>New Group Chat</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#888' }}>✕</button>
        </div>

        <div style={{ padding: '16px 24px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {error && <div style={{ padding: '8px 12px', background: '#fdecea', borderRadius: 8, color: '#c62828', fontSize: 13 }}>{error}</div>}

          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: 1 }}>Group Name</label>
            <input
              placeholder="Group name"
              value={chatName}
              onChange={e => { setChatName(e.target.value); setError(''); }}
              style={{ width: '100%', marginTop: 6, padding: '9px 12px', border: '1px solid #e0e0e0', borderRadius: 8, fontSize: 14, boxSizing: 'border-box', outline: 'none' }}
            />
          </div>

          {selected.length > 0 && (
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: 1 }}>Selected ({selected.length})</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                {selected.map(u => (
                  <span key={u._id} onClick={() => toggle(u)}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px 4px 6px', background: '#e0f2f1', borderRadius: 20, fontSize: 12, cursor: 'pointer', border: '1px solid #b2dfdb' }}>
                    <Avatar name={u.name} src={u.pic} size={18} />
                    <span style={{ color: '#00695c', fontWeight: 600 }}>{u.name}</span>
                    <span style={{ color: '#00897b', fontSize: 14, lineHeight: 1 }}>×</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: 1 }}>Add Members</label>
            <input
              placeholder="Search by name or email"
              value={userQuery}
              onChange={e => { setUserQuery(e.target.value); searchUsers(e.target.value); }}
              style={{ width: '100%', marginTop: 6, padding: '9px 12px', border: '1px solid #e0e0e0', borderRadius: 8, fontSize: 14, boxSizing: 'border-box', outline: 'none' }}
            />
            {loading && <p style={{ fontSize: 12, color: '#888', margin: '4px 0 0' }}>Searching...</p>}
            {!loading && userQuery && searchRes.length === 0 && <p style={{ fontSize: 12, color: '#aaa', margin: '4px 0 0' }}>No users found</p>}
            {searchRes.length > 0 && (
              <div style={{ border: '1px solid #eee', borderRadius: 8, marginTop: 6, maxHeight: 160, overflowY: 'auto' }}>
                {searchRes.map(u => (
                  <div key={u._id} onClick={() => toggle(u)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', cursor: 'pointer', borderBottom: '1px solid #f5f5f5' }}>
                    <Avatar name={u.name} src={u.pic} size={34} />
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#111' }}>{u.name}</div>
                      <div style={{ fontSize: 11, color: '#888' }}>{u.email}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button onClick={create} disabled={creating}
            style={{ width: '100%', padding: '11px', background: '#4db6ac', color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: creating ? 'not-allowed' : 'pointer', opacity: creating ? 0.7 : 1, marginTop: 4 }}>
            {creating ? 'Creating...' : 'Create Group'}
          </button>
        </div>
      </div>
    </div>
  );
}

function NotifDropdown({ notifications, onClose, onClickNotif }) {
  const ref = useRef(null);
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  return (
    <div ref={ref} style={{
      position: 'fixed', top: 58, right: 72, zIndex: 99999,
      background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
      border: '1px solid rgba(255,255,255,0.6)', borderRadius: 16,
      boxShadow: '0 8px 32px rgba(0,0,0,0.22)',
      padding: '12px', minWidth: 240, maxHeight: 300, overflowY: 'auto',
      display: 'flex', flexDirection: 'column', gap: 6,
      animation: 'fadeSlideDown 0.18s ease'
    }}>
      <div style={{ fontWeight: 600, fontSize: 14, color: '#111', padding: '4px 8px' }}>Notifications</div>
      {notifications.length === 0 ? (
        <div style={{ fontSize: 13, color: '#888', padding: '8px', textAlign: 'center' }}>No new notifications</div>
      ) : (
        notifications.map(n => (
          <div key={n.id} onClick={() => onClickNotif(n)} style={{ padding: '10px', background: '#f5f5f5', borderRadius: 8, cursor: 'pointer', fontSize: 13, color: '#333' }}>
            {n.text}
          </div>
        ))
      )}
    </div>
  );
}

export default function Chats() {
  const { user, setUser } = ChatState() || {};
  const navigate = useNavigate();
  const token = user?.token;
  const meId  = user?._id;

  const handleLogout = () => {
    localStorage.removeItem('userInfo');
    setUser(null);
    navigate('/login');
  };

  const [chats, setChats]               = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [chatsLoading, setChatsLoading] = useState(false);
  const [searchOpen, setSearchOpen]     = useState(false);
  const [profileModal, setProfileModal] = useState(null);
  const [groupInfoModal, setGroupInfoModal] = useState(false);
  const [groupModal, setGroupModal]     = useState(false);
  const [profileOpen, setProfileOpen]   = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notifOpen, setNotifOpen]       = useState(false);
  const [messages, setMessages]         = useState([]);
  const [msgsLoading, setMsgsLoading]   = useState(false);
  const [input, setInput]               = useState('');
  const msgEndRef = useRef(null);

  const fetchChats = useCallback(async () => {
    if (!token) return;
    setChatsLoading(true);
    try {
      const { data } = await axios.get(`${API}/chat`, { headers: { Authorization: `Bearer ${token}` } });
      setChats(data);
    } catch (e) { console.error('fetchChats', e); }
    finally { setChatsLoading(false); }
  }, [token]);

  useEffect(() => { fetchChats(); }, [fetchChats]);
  useEffect(() => { msgEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  useEffect(() => {
    if (!user) return;
    socket = io(SOCKET_ENDPOINT);
    socket.emit('setup', user);
    return () => { socket.disconnect(); };
  }, [user]);

  useEffect(() => {
    if (!selectedChat) return;
    const fetchMessages = async () => {
      setMsgsLoading(true);
      try {
        const { data } = await axios.get(`${API}/message/${selectedChat._id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setMessages(data);
        socket.emit('join chat', selectedChat._id);
      } catch (e) { console.error('fetchMessages', e); }
      finally { setMsgsLoading(false); }
    };
    fetchMessages();
  }, [selectedChat, token]);

  const openChat = async userId => {
    try {
      const { data } = await axios.post(`${API}/chat`, { userId }, { headers: { Authorization: `Bearer ${token}` } });
      setChats(prev => prev.find(c => c._id === data._id) ? prev : [data, ...prev]);
      setSelectedChat(data);
    } catch (e) { console.error('openChat', e); }
  };

  useEffect(() => {
    if (!socket) return;
    const msgHandler = (newMessage) => {
      if (!selectedChat || selectedChat._id !== newMessage.chat._id) {
        setNotifications(prev => [{ id: newMessage._id, chat: newMessage.chat, text: `New message from ${newMessage.sender.name}` }, ...prev.filter(n => n.id !== newMessage._id)]);
        return;
      }
      setMessages(prev => [...prev, newMessage]);
    };
    const removedHandler = (chatId) => {
      setChats(prev => prev.filter(c => c._id !== chatId));
      setSelectedChat(prev => prev?._id === chatId ? null : prev);
    };
    const addedHandler = (newChat) => {
      setChats(prev => [newChat, ...prev.filter(c => c._id !== newChat._id)]);
      setNotifications(prev => [{ id: newChat._id, chat: newChat, text: `You were added to group ${newChat.chatName}` }, ...prev.filter(n => n.id !== newChat._id)]);
    };
    const groupUpdatedHandler = (updatedChat) => {
      setChats(prev => prev.map(c => c._id === updatedChat._id ? updatedChat : c));
      setSelectedChat(prev => prev?._id === updatedChat._id ? updatedChat : prev);
    };
    socket.on('message received', msgHandler);
    socket.on('removed from group', removedHandler);
    socket.on('added to group', addedHandler);
    socket.on('group updated', groupUpdatedHandler);
    return () => {
      socket.off('message received', msgHandler);
      socket.off('removed from group', removedHandler);
      socket.off('added to group', addedHandler);
      socket.off('group updated', groupUpdatedHandler);
    };
  });

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || !selectedChat) return;
    setInput('');
    try {
      const { data } = await axios.post(
        `${API}/message`,
        { content: text, chatId: selectedChat._id },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessages(prev => [...prev, data]);
      socket.emit('new message', data);
    } catch (e) { console.error('sendMessage', e); setInput(text); }
  };

  const handleKey = e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } };

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#a8d8d8', display: 'flex', flexDirection: 'column', fontFamily: '"Google Sans", sans-serif' }}>
      <style>{`
        @media (max-width: 768px) {
          .chat-sidebar { width: 100% !important; display: ${selectedChat ? 'none' : 'flex'} !important; }
          .chat-main { display: ${!selectedChat ? 'none' : 'flex'} !important; }
          .chat-back-btn { display: flex !important; }
        }
        .chat-back-btn { display: none; align-items: center; justify-content: center; background: none; border: none; cursor: pointer; padding: 4px; margin-right: 8px; color: #444; }
      `}</style>

      <header style={{ height: 52, display: 'flex', alignItems: 'center', padding: '0 20px', background: 'rgba(255,255,255,0.55)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(255,255,255,0.4)', flexShrink: 0, gap: 16, position: 'relative', zIndex: 1000 }}>
        <button onClick={() => setSearchOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: '#444', padding: 0 }}>
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
          Search User
        </button>
        <span style={{ flex: 1, textAlign: 'center', fontWeight: 600, fontSize: 16, color: '#111' }}>My Chats</span>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <button onClick={() => setNotifOpen(o => !o)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#444', padding: '4px 6px', display: 'flex' }}>
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>
            {notifications.length > 0 && (
              <span style={{ position: 'absolute', top: 2, right: 2, background: '#e53935', color: '#fff', fontSize: 10, fontWeight: 700, borderRadius: '50%', padding: '0 4px', minWidth: 14, height: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {notifications.length}
              </span>
            )}
          </button>
          {notifOpen && (
            <NotifDropdown 
              notifications={notifications} 
              onClose={() => setNotifOpen(false)} 
              onClickNotif={(n) => {
                setSelectedChat(n.chat);
                setNotifications(prev => prev.filter(notif => notif.id !== n.id));
                setNotifOpen(false);
              }} 
            />
          )}
        </div>
        <div onClick={() => setProfileOpen(o => !o)} style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
          <Avatar name={user?.name || ''} src={user?.pic} size={32} />
          <svg width="12" height="12" fill="currentColor" viewBox="0 0 24 24" style={{ color: '#666', transition: 'transform 0.2s', transform: profileOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}><path d="M7 10l5 5 5-5z" /></svg>
        </div>
      </header>
      {profileOpen && <ProfileDropdown user={user} onClose={() => setProfileOpen(false)} onLogout={handleLogout} onPicUpdate={updatedUser => { setUser(updatedUser); localStorage.setItem('userInfo', JSON.stringify(updatedUser)); }} />}

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', padding: 12, gap: 12 }}>

        <aside className="chat-sidebar" style={{ width: 290, flexShrink: 0, display: 'flex', flexDirection: 'column', background: 'rgba(255,255,255,0.55)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)', border: '1px solid rgba(255,255,255,0.5)', borderRadius: 14, overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
            <span style={{ fontWeight: 600, fontSize: 15, color: '#111' }}>My Chats</span>
            <button onClick={() => setGroupModal(true)} style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: '1px solid #bbb', borderRadius: 8, padding: '4px 10px', fontSize: 12, cursor: 'pointer', color: '#333' }}>
              New Group Chat
              <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
            </button>
          </div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {chatsLoading && <p style={{ fontSize: 13, color: '#888', textAlign: 'center', padding: 20 }}>Loading...</p>}
            {!chatsLoading && chats.length === 0 && <p style={{ fontSize: 13, color: '#888', textAlign: 'center', padding: 20 }}>No chats yet</p>}
            {!chatsLoading && chats.map(chat => {
              const active = selectedChat?._id === chat._id;
              const name   = getSenderName(chat, meId);
              const pic    = getSenderPic(chat, meId);
              const last   = chat.latestMessage;
              return (
                <div key={chat._id} onClick={() => setSelectedChat(chat)} style={{ padding: '11px 16px', cursor: 'pointer', background: active ? '#4db6ac' : 'transparent', borderBottom: '1px solid rgba(0,0,0,0.04)', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Avatar name={name} src={pic} size={34} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: active ? '#fff' : '#111', marginBottom: 2 }}>{name}</div>
                    {last && <div style={{ fontSize: 11.5, color: active ? 'rgba(255,255,255,0.85)' : '#777', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}><strong>{last.sender?.name} :</strong> {last.content}</div>}
                  </div>
                </div>
              );
            })}
          </div>
        </aside>

        <main className="chat-main" style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'rgba(255,255,255,0.55)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)', border: '1px solid rgba(255,255,255,0.5)', borderRadius: 14, overflow: 'hidden' }}>
          {selectedChat ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 18px', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <button className="chat-back-btn" onClick={() => setSelectedChat(null)} title="Back to chats">
                    <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>
                  </button>
                  <Avatar name={getSenderName(selectedChat, meId)} src={getSenderPic(selectedChat, meId)} size={34} />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 15, color: '#111' }}>{getSenderName(selectedChat, meId)}</div>
                    {selectedChat.isGroupChat && <div style={{ fontSize: 11, color: '#888' }}>{selectedChat.users?.length} members</div>}
                  </div>
                </div>
                <button
                  onClick={() => selectedChat.isGroupChat ? setGroupInfoModal(true) : setProfileModal(selectedChat)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#555', padding: 4 }}
                  title={selectedChat.isGroupChat ? 'Group Info' : 'Profile'}
                >
                  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                </button>
              </div>
              <div style={{ flex: 1, overflowY: 'auto', padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 8, background: 'rgba(240,240,240,0.35)' }}>
                {msgsLoading && <p style={{ textAlign: 'center', color: '#888', fontSize: 13 }}>Loading messages...</p>}
                {messages.map((msg, idx) => {
                  if (msg.isSystem) {
                    return (
                      <div key={msg._id} style={{ alignSelf: 'center', background: 'rgba(0,0,0,0.06)', padding: '4px 12px', borderRadius: 12, fontSize: 11, color: '#555', margin: '6px 0', fontWeight: 600 }}>
                        {msg.content}
                      </div>
                    );
                  }
                  const isMe = msg.sender?._id === meId;
                  const showTag = selectedChat.isGroupChat && !isMe;
                  const prevMsg = messages[idx - 1];
                  const sameAsPrev = prevMsg && !prevMsg.isSystem && prevMsg.sender?._id === msg.sender?._id;
                  return (
                    <div key={msg._id} style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start', gap: 2 }}>
                      {showTag && !sameAsPrev && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 4 }}>
                          <Avatar name={msg.sender?.name || ''} src={msg.sender?.pic} size={18} />
                          <span style={{ fontSize: 11, fontWeight: 600, color: '#00897b' }}>{msg.sender?.name}</span>
                        </div>
                      )}
                      <div style={{ background: isMe ? '#e8f5e9' : '#fff', border: '1px solid rgba(0,0,0,0.07)', borderRadius: isMe ? '14px 14px 4px 14px' : '14px 14px 14px 4px', padding: '8px 14px', maxWidth: '60%', fontSize: 13.5, color: '#111', lineHeight: 1.5, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>{msg.content}</div>
                    </div>
                  );
                })}
                {!msgsLoading && messages.length === 0 && <p style={{ textAlign: 'center', color: '#aaa', fontSize: 13, marginTop: 40 }}>No messages yet.</p>}
                <div ref={msgEndRef} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderTop: '1px solid rgba(0,0,0,0.06)', background: 'rgba(255,255,255,0.6)' }}>
                <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKey} placeholder="Enter a message..." style={{ flex: 1, padding: '9px 14px', border: '1px solid rgba(0,0,0,0.12)', borderRadius: 10, fontSize: 13.5, outline: 'none', background: 'rgba(255,255,255,0.8)', color: '#111' }} />
                <button onClick={sendMessage} style={{ width: 38, height: 38, borderRadius: '50%', border: 'none', background: '#4db6ac', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="16" height="16" fill="none" stroke="#fff" strokeWidth="2.5" viewBox="0 0 24 24"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
                </button>
              </div>
            </>
          ) : (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888', fontSize: 15 }}>Select a chat to start messaging</div>
          )}
        </main>
      </div>

      <SearchDrawer open={searchOpen} onClose={() => setSearchOpen(false)} token={token} onChatOpen={openChat} />
      {profileModal && <ProfileModal chat={profileModal} meId={meId} onClose={() => setProfileModal(null)} />}
      {groupInfoModal && selectedChat?.isGroupChat && (
        <GroupInfoModal
          chat={selectedChat}
          token={token}
          meId={meId}
          onClose={() => setGroupInfoModal(false)}
          onNewMessage={msg => setMessages(prev => [...prev, msg])}
          onUpdated={updatedChat => {
            if (!updatedChat.users.find(u => u._id === meId)) {
              setGroupInfoModal(false);
              setSelectedChat(null);
              setChats(prev => prev.filter(c => c._id !== updatedChat._id));
            } else {
              setSelectedChat(updatedChat);
              setChats(prev => prev.map(c => c._id === updatedChat._id ? updatedChat : c));
            }
          }}
        />
      )}
      {groupModal && <GroupChatModal token={token} meId={meId} onCreated={chat => { setChats(p => [chat, ...p]); setSelectedChat(chat); }} onClose={() => setGroupModal(false)} />}
    </div>
  );
}
