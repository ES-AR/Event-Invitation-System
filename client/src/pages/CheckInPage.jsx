import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { uploadClient } from '../api';

export default function CheckInPage() {
  const [params] = useSearchParams();
  const [email, setEmail] = useState('');
  const [photo, setPhoto] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const code = params.get('code') || '';

  useEffect(() => {
    setMessage('');
    setError('');
  }, [code]);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');
    try {
      const formData = new FormData();
      formData.append('code', code);
      formData.append('email', email.toLowerCase());
      if (photo) formData.append('photo', photo);
      const res = await uploadClient.post('/checkin', formData);
      setMessage(res.data.message);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to verify check-in.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="card space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-sm text-gray-500">Secure Verification</p>
            <h2 className="text-xl font-semibold text-secondary">Check-in with your personalized link</h2>
          </div>
          <span className="px-3 py-1 rounded-full bg-muted text-secondary text-sm font-semibold">Photo required</span>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <label className="flex flex-col gap-2 text-sm font-medium text-secondary">
              Invitation Code
              <input value={code} readOnly className="rounded-lg border border-gray-200 px-3 py-2 bg-gray-50 text-gray-600" />
            </label>
            <label className="flex flex-col gap-2 text-sm font-medium text-secondary">
              Email used for registration
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="rounded-lg border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-secondary/40"
              />
            </label>
          </div>
          <label className="flex flex-col gap-2 text-sm font-medium text-secondary">
            Upload a clear selfie for verification
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setPhoto(e.target.files[0])}
              className="rounded-lg border border-gray-200 px-3 py-2 bg-white"
              required
            />
          </label>
          {message && <div className="bg-green-50 text-green-900 border border-green-200 rounded-lg p-3">{message}</div>}
          {error && <div className="bg-danger text-secondary border border-red-300 rounded-lg p-3">{error}</div>}
          <div className="flex gap-3">
            <button type="submit" className="btn btn-primary" disabled={loading || !code}>
              {loading ? 'Verifying...' : 'Submit Check-in'}
            </button>
            <p className="text-sm text-gray-600">We will match your email and photo with the approved invitation.</p>
          </div>
        </form>
      </div>
    </div>
  );
}
