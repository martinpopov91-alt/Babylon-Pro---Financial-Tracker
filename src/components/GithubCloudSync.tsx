import React, { useState, useEffect } from 'react';
import { Cloud, UploadCloud, DownloadCloud, Key, Check, AlertCircle } from 'lucide-react';
import { AppState } from '../types';

interface GithubCloudSyncProps {
  appState: AppState;
  onSyncPull: (newState: AppState) => void;
  lang: string;
}

export const GithubCloudSync: React.FC<GithubCloudSyncProps> = ({ appState, onSyncPull, lang }) => {
  const [token, setToken] = useState('');
  const [gistId, setGistId] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState('');

  useEffect(() => {
    const savedToken = localStorage.getItem('github_sync_token');
    const savedGistId = localStorage.getItem('github_sync_gist_id');
    if (savedToken) setToken(savedToken);
    if (savedGistId) setGistId(savedGistId);
  }, []);

  const handleSaveKeys = () => {
    localStorage.setItem('github_sync_token', token);
    localStorage.setItem('github_sync_gist_id', gistId);
    setStatus('success');
    setStatusMessage(lang === 'bg' ? 'Ключовете са запазени.' : 'Keys saved successfully.');
    setTimeout(() => setStatus('idle'), 3000);
  };

  const handlePush = async () => {
    if (!token || !gistId) {
      setStatus('error');
      setStatusMessage(lang === 'bg' ? 'Моля, въведете Token и Gist ID.' : 'Please enter Token and Gist ID.');
      return;
    }
    setStatus('loading');
    setStatusMessage(lang === 'bg' ? 'Качване...' : 'Pushing to cloud...');

    try {
      const response = await fetch(`https://api.github.com/gists/${gistId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `token ${token}`,
          'Accept': 'application/vnd.github.v3+json',
        },
        body: JSON.stringify({
          files: {
            'financial_app_data.json': {
              content: JSON.stringify(appState, null, 2)
            }
          }
        })
      });

      if (!response.ok) throw new Error('Failed to push data');

      setStatus('success');
      setStatusMessage(lang === 'bg' ? 'Синхронизирано успешно.' : 'Pushed successfully.');
    } catch (err: any) {
      setStatus('error');
      setStatusMessage(err.message || 'Error pushing data');
    }
  };

  const handlePull = async () => {
    if (!token || !gistId) {
      setStatus('error');
      setStatusMessage(lang === 'bg' ? 'Моля, въведете Token и Gist ID.' : 'Please enter Token and Gist ID.');
      return;
    }
    setStatus('loading');
    setStatusMessage(lang === 'bg' ? 'Сваляне...' : 'Pulling from cloud...');

    try {
      const response = await fetch(`https://api.github.com/gists/${gistId}`, {
        method: 'GET',
        headers: {
          'Authorization': `token ${token}`,
          'Accept': 'application/vnd.github.v3+json',
        }
      });

      if (!response.ok) throw new Error('Failed to fetch data');

      const data = await response.json();
      const file = data.files['financial_app_data.json'];
      
      if (!file || !file.content) throw new Error('Data file not found in gist');

      const newState = JSON.parse(file.content) as AppState;
      onSyncPull(newState);
      
      setStatus('success');
      setStatusMessage(lang === 'bg' ? 'Данните са обновени.' : 'Pulled successfully.');
    } catch (err: any) {
      setStatus('error');
      setStatusMessage(err.message || 'Error pulling data');
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
            <Cloud className="w-5 h-5 text-indigo-400" />
            <span>{lang === 'bg' ? 'GitHub Облачна Синхронизация' : 'GitHub Cloud Sync'}</span>
          </h3>
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-400">
              {status === 'loading' && (lang === 'bg' ? 'Зареждане...' : 'Loading...')}
              {status === 'success' && statusMessage}
              {status === 'error' && <span className="text-rose-400">{statusMessage}</span>}
            </span>
            <div className={`w-2.5 h-2.5 rounded-full ${
              status === 'success' ? 'bg-emerald-500' :
              status === 'error' ? 'bg-rose-500' :
              status === 'loading' ? 'bg-amber-500 animate-pulse' : 'bg-zinc-600'
            }`} />
          </div>
        </div>
        
        <p className="text-xs text-zinc-400">
          {lang === 'bg' 
            ? 'Синхронизирайте данните си с GitHub Gist. Нужен ви е Personal Access Token (PAT) с права за Gists и ID на съществуващ Gist.' 
            : 'Back up and sync your app state using a GitHub Gist. You need a Personal Access Token (PAT) with gist scope and an existing Gist ID.'}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-zinc-400">GitHub PAT</label>
            <div className="relative">
              <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                type="password"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="ghp_..."
                className="w-full pl-9 pr-4 py-2 bg-zinc-900 border border-zinc-700 rounded-xl text-sm text-zinc-200 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-zinc-400">Gist ID</label>
            <div className="relative">
              <Cloud className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                type="text"
                value={gistId}
                onChange={(e) => setGistId(e.target.value)}
                placeholder="e.g. 1a2b3c4d..."
                className="w-full pl-9 pr-4 py-2 bg-zinc-900 border border-zinc-700 rounded-xl text-sm text-zinc-200 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            onClick={handleSaveKeys}
            className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-zinc-200 rounded-xl text-xs font-bold transition-colors"
          >
            {lang === 'bg' ? 'Запази Ключовете' : 'Save Keys'}
          </button>
          
          <div className="flex-1" />

          <button
            onClick={handlePull}
            disabled={status === 'loading'}
            className="flex items-center gap-2 px-4 py-2 bg-zinc-900 border border-indigo-500/30 hover:bg-indigo-500/10 text-indigo-400 rounded-xl text-xs font-bold transition-all disabled:opacity-50"
          >
            <DownloadCloud className="w-4 h-4" />
            <span>{lang === 'bg' ? 'Свали (Pull)' : 'Pull'}</span>
          </button>
          <button
            onClick={handlePush}
            disabled={status === 'loading'}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-400 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50 shadow-md shadow-indigo-500/20"
          >
            <UploadCloud className="w-4 h-4" />
            <span>{lang === 'bg' ? 'Качи (Push)' : 'Push'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
