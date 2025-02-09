import React, { useState, useEffect } from 'react';
import { Upload, Video, AlertCircle, Lock } from 'lucide-react';
import type { VideoGenerationResponse } from '../types';
import { getClerk, initClerk } from '../lib/clerk';

export function VideoGenerator() {
  const [loading, setLoading] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    let mounted = true;

    const initializeClerk = async () => {
      try {
        const clerk = await initClerk();
        if (!mounted) return;
        
        setIsAuthenticated(!!clerk.session);
        
        // Listen for auth changes
        clerk.addListener((state: any) => {
          if (mounted) {
            setIsAuthenticated(!!state.session);
          }
        });
      } catch (error) {
        console.error('Auth check error:', error);
        if (mounted) {
          setIsAuthenticated(false);
          setError('Failed to initialize authentication. Please refresh the page.');
        }
      } finally {
        if (mounted) {
          setIsInitializing(false);
        }
      }
    };
    
    initializeClerk();

    return () => {
      mounted = false;
    };
  }, []);

  const handleSignIn = async () => {
    try {
      const clerk = getClerk();
      await clerk.openSignIn();
    } catch (error) {
      console.error('Sign in error:', error);
      setError('Failed to open sign in. Please try again.');
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!isAuthenticated) {
      setError('Please sign in to generate videos');
      return;
    }

    setLoading(true);
    setError(null);
    setVideoUrl(null);

    const formData = new FormData(e.currentTarget);
    const prompt = formData.get('prompt');

    if (!prompt) {
      setError('Please enter a text prompt for the video');
      setLoading(false);
      return;
    }

    try {
      const clerk = getClerk();
      const token = await clerk.session?.getToken();
      
      if (!token) {
        throw new Error('Authentication token not available');
      }
      
      const response = await fetch('https://dreammachineai.io/api/generate-video', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `HTTP error! status: ${response.status}`);
      }
      
      const result: VideoGenerationResponse = await response.json();
      
      if (!result.video_url) {
        throw new Error('No video URL received from the server');
      }

      setVideoUrl(result.video_url);
    } catch (error) {
      console.error('Error generating video:', error);
      setError(
        error instanceof Error 
          ? error.message 
          : 'Failed to generate video. Please try again later.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        setError('Image size must be less than 10MB');
        e.target.value = '';
        return;
      }
      if (!file.type.startsWith('image/')) {
        setError('Please upload an image file');
        e.target.value = '';
        return;
      }
      setUploadedFile(file);
      setError(null);
    }
  };

  if (isInitializing) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center space-y-4 p-8 bg-gray-50 rounded-lg">
        <Lock className="w-12 h-12 text-gray-400" />
        <h2 className="text-xl font-semibold text-gray-700">Authentication Required</h2>
        <p className="text-gray-600 text-center">
          Please sign in to access the video generator
        </p>
        <button
          onClick={handleSignIn}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          Sign In
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="prompt" className="block text-sm font-medium text-gray-700">
            Enter Text for Video
          </label>
          <input
            type="text"
            id="prompt"
            name="prompt"
            required
            placeholder="Describe the video you want to generate..."
            className="mt-1 block w-full rounded-lg border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor="image" className="block text-sm font-medium text-gray-700">
            Upload an Image (Optional)
          </label>
          <div className="mt-1 flex items-center justify-center w-full">
            <label className={`w-full flex flex-col items-center px-4 py-6 bg-white rounded-lg border border-gray-300 cursor-pointer hover:bg-gray-50 ${
              uploadedFile ? 'border-blue-500' : ''
            }`}>
              <Upload className={`h-8 w-8 ${uploadedFile ? 'text-blue-500' : 'text-gray-400'}`} />
              <span className="mt-2 text-sm text-gray-500">
                {uploadedFile ? uploadedFile.name : 'Click to upload'}
              </span>
              <input 
                type="file" 
                id="image" 
                name="image" 
                accept="image/*"
                onChange={handleFileChange}
                className="hidden" 
              />
            </label>
          </div>
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 p-4 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-blue-500 p-3 text-white hover:bg-blue-600 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <Video className="h-5 w-5" />
          {loading ? 'Generating...' : 'Generate Video'}
        </button>
      </form>

      {videoUrl && (
        <div className="rounded-lg overflow-hidden bg-gray-50 p-4">
          <video 
            controls 
            src={videoUrl} 
            className="w-full rounded-lg"
            onError={() => setError('Failed to load the generated video')}
          />
        </div>
      )}
    </div>
  );
}