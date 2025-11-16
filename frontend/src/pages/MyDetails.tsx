import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import api from '@/lib/api';
import { toast } from 'sonner';

const MyDetails = () => {
  const [loading, setLoading] = useState(false);
  const [kyc, setKyc] = useState<any>(null);
  const [nameOnId, setNameOnId] = useState('');
  const [aadharNumber, setAadharNumber] = useState('');
  const [aadharMobile, setAadharMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);

  const loadKyc = async () => {
    try {
      const res = await api.get('/kyc');
      setKyc(res.data.kyc || null);
      if (res.data.kyc) {
        setNameOnId(res.data.kyc.nameOnId || '');
        setAadharNumber(res.data.kyc.aadharNumber || '');
        setAadharMobile(res.data.kyc.aadharMobile || '');
        setOtpSent(false);
      }
    } catch (err: any) {
      console.error('Load KYC error', err);
    }
  };

  useEffect(() => {
    loadKyc();
  }, []);

  const handleRequestOtp = async (e: any) => {
    e?.preventDefault();
    setLoading(true);
    try {
      await api.post('/kyc', { nameOnId, aadharNumber, aadharMobile });
      toast.success('OTP sent to the provided mobile (mock)');
      setOtpSent(true);
      await loadKyc();
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.message || 'Failed to request OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: any) => {
    e?.preventDefault();
    if (!otp) return toast.error('Enter OTP');
    setLoading(true);
    try {
      await api.post('/kyc/verify', { otp });
      toast.success('KYC verified');
      setOtp('');
      setOtpSent(false);
      await loadKyc();
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.message || 'OTP verification failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold mb-4">My Details (KYC)</h1>
        <p className="text-muted-foreground mb-6">Provide your details as on government ID and verify via OTP sent to registered mobile.</p>

        <Card className="p-6 mb-6">
          <form onSubmit={handleRequestOtp} className="space-y-4">
            <div>
              <label className="block text-sm mb-1">Name (as on government ID)</label>
              <input value={nameOnId} onChange={(e) => setNameOnId(e.target.value)} className="w-full p-2 border rounded" required />
            </div>

            <div>
              <label className="block text-sm mb-1">Aadhar Number</label>
              <input value={aadharNumber} onChange={(e) => setAadharNumber(e.target.value)} className="w-full p-2 border rounded" required />
            </div>

            <div>
              <label className="block text-sm mb-1">Registered Aadhar Mobile Number</label>
              <input value={aadharMobile} onChange={(e) => setAadharMobile(e.target.value)} className="w-full p-2 border rounded" required />
            </div>

            <div className="flex gap-2 justify-end">
              <Button type="submit" disabled={loading}>{loading ? 'Sending...' : 'Request OTP'}</Button>
            </div>
          </form>
        </Card>

        {otpSent && (
          <Card className="p-6">
            <h3 className="font-semibold mb-3">Enter OTP</h3>
            <div className="space-y-4">
              <input value={otp} onChange={(e) => setOtp(e.target.value)} className="w-full p-2 border rounded" placeholder="6-digit code" />
              <div className="flex gap-2 justify-end">
                <Button onClick={handleVerifyOtp} disabled={loading}>{loading ? 'Verifying...' : 'Verify OTP'}</Button>
              </div>
            </div>
          </Card>
        )}

        {kyc && (
          <Card className="p-6 mt-6">
            <h3 className="font-semibold mb-3">KYC Status</h3>
            <p className="text-sm">Name: {kyc.nameOnId}</p>
            <p className="text-sm">Aadhar: {kyc.aadharNumber}</p>
            <p className="text-sm">Mobile: {kyc.aadharMobile}</p>
            <p className="text-sm">Verified: {kyc.verified ? new Date(kyc.verifiedAt).toLocaleString() : 'No'}</p>
          </Card>
        )}
      </div>
    </div>
  );
};

export default MyDetails;
