import { useState, useCallback, useEffect } from 'react';

const CLIENT_ID = import.meta.env.VITE_BOX_CLIENT_ID;

const KEYS = {
  access:   'box_access_token',
  refresh:  'box_refresh_token',
  expiry:   'box_token_expiry',
  folder:   'box_folder_id',
  folderName: 'box_folder_name',
  fileIds:  'box_file_ids',
};

function stored(key) {
  try { return localStorage.getItem(key); } catch { return null; }
}
function store(key, val) {
  try { localStorage.setItem(key, val); } catch {}
}
function clear(...keys) {
  try { keys.forEach(k => localStorage.removeItem(k)); } catch {}
}

export function parseFolderIdFromUrl(url) {
  const match = url.match(/\/folder\/(\d+)/);
  return match ? match[1] : url.trim().replace(/\D/g, '') || null;
}

export function useBoxAuth() {
  const [connected, setConnected]   = useState(() => !!stored(KEYS.access));
  const [folderId,  setFolderIdState]  = useState(() => stored(KEYS.folder));
  const [folderName, setFolderNameState] = useState(() => stored(KEYS.folderName));

  // Re-check on storage events (e.g. callback page wrote tokens)
  useEffect(() => {
    const sync = () => {
      setConnected(!!stored(KEYS.access));
      setFolderIdState(stored(KEYS.folder));
      setFolderNameState(stored(KEYS.folderName));
    };
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, []);

  const setFolder = useCallback((url) => {
    const id = parseFolderIdFromUrl(url);
    if (!id) return false;
    store(KEYS.folder, id);
    store(KEYS.folderName, url);
    setFolderIdState(id);
    setFolderNameState(url);
    return true;
  }, []);

  const connect = useCallback(() => {
    if (!CLIENT_ID) { alert('Box Client ID not configured.'); return; }
    const state = crypto.randomUUID();
    sessionStorage.setItem('box_oauth_state', state);
    sessionStorage.setItem('box_return_url', window.location.href);
    const params = new URLSearchParams({
      response_type: 'code',
      client_id:     CLIENT_ID,
      redirect_uri:  `${window.location.origin}/box-callback`,
      state,
    });
    window.location.href = `https://account.box.com/api/oauth2/authorize?${params}`;
  }, []);

  const disconnect = useCallback(() => {
    clear(KEYS.access, KEYS.refresh, KEYS.expiry);
    setConnected(false);
  }, []);

  // Returns a valid access token, refreshing if needed
  const getToken = useCallback(async () => {
    const accessToken  = stored(KEYS.access);
    const refreshToken = stored(KEYS.refresh);
    const expiry       = parseInt(stored(KEYS.expiry) || '0', 10);

    if (!accessToken) return null;
    if (Date.now() < expiry) return accessToken;
    if (!refreshToken) { disconnect(); return null; }

    try {
      const res  = await fetch('/api/box-token', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ action: 'refresh', refresh_token: refreshToken }),
      });
      const data = await res.json();
      if (data.access_token) {
        store(KEYS.access,  data.access_token);
        store(KEYS.refresh, data.refresh_token);
        store(KEYS.expiry,  Date.now() + (data.expires_in - 60) * 1000);
        return data.access_token;
      }
    } catch {}

    disconnect();
    return null;
  }, [disconnect]);

  // Returns stored Box file ID for a project (for versioning)
  const getFileId = useCallback((projectId) => {
    try {
      const map = JSON.parse(stored(KEYS.fileIds) || '{}');
      return map[projectId] || null;
    } catch { return null; }
  }, []);

  const setFileId = useCallback((projectId, fileId) => {
    try {
      const map = JSON.parse(stored(KEYS.fileIds) || '{}');
      map[projectId] = fileId;
      store(KEYS.fileIds, JSON.stringify(map));
    } catch {}
  }, []);

  return {
    connected,
    folderId,
    folderName,
    connect,
    disconnect,
    setFolder,
    getToken,
    getFileId,
    setFileId,
  };
}
