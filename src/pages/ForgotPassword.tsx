import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { AuthLayout } from '../auth/AuthLayout';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Mail, Lock, KeyRound, ArrowLeft, CheckCircle2, Moon, Sun } from 'lucide-react';
import { useTheme } from '../components/ThemeProvider';

export default function ForgotPassword() {
    const [step, setStep] = useState<'request' | 'verify'>('request');
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const navigate = useNavigate();
    const { theme, setTheme } = useTheme();

    // Step 1: Send reset email / OTP code
    const handleSendResetEmail = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const redirectTo = `${window.location.origin}/reset-password`;
            const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
                redirectTo,
            });

            if (error) throw error;
            setStep('verify');
        } catch (err: any) {
            setError(err.message || 'Failed to send password reset email.');
        } finally {
            setLoading(false);
        }
    };

    // Step 2: Verify 6-digit OTP code & set new password
    const handleVerifyOtpAndReset = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        if (password !== confirmPassword) {
            setError("Passwords don't match");
            setLoading(false);
            return;
        }

        if (password.length < 6) {
            setError("Password must be at least 6 characters");
            setLoading(false);
            return;
        }

        if (!otp.trim()) {
            setError("Please enter the 6-digit code received in your email");
            setLoading(false);
            return;
        }

        try {
            // 1. Verify OTP with Supabase Recovery flow
            const { error: otpError } = await supabase.auth.verifyOtp({
                email: email.trim(),
                token: otp.trim(),
                type: 'recovery',
            });

            if (otpError) throw otpError;

            // 2. Set the new password for the authenticated user
            const { error: updateError } = await supabase.auth.updateUser({
                password,
            });

            if (updateError) throw updateError;

            setSuccess(true);
            setTimeout(() => {
                navigate('/');
            }, 2500);
        } catch (err: any) {
            setError(err.message || 'Invalid or expired code. Please try requesting a new one.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthLayout
            title={step === 'request' ? "Reset Password" : "Enter Reset Code"}
            subtitle={
                step === 'request'
                    ? "Enter your email to receive a password reset code or link."
                    : `We sent a 6-digit code to ${email}`
            }
        >
            <Button
                variant="ghost"
                size="sm"
                className="absolute top-4 right-4 h-9 w-9 p-0"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            >
                {theme === 'dark' ? (
                    <Sun className="h-4 w-4" />
                ) : (
                    <Moon className="h-4 w-4" />
                )}
                <span className="sr-only">Toggle theme</span>
            </Button>

            {success ? (
                <div className="space-y-6">
                    <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-xl flex items-start gap-3">
                        <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
                        <div className="text-sm">
                            <p className="font-semibold text-emerald-300">Password Reset Successfully!</p>
                            <p className="mt-1 text-emerald-400/90">
                                Your password has been updated. Redirecting you to the studio...
                            </p>
                        </div>
                    </div>

                    <Button
                        variant="primary"
                        className="w-full"
                        onClick={() => navigate('/')}
                    >
                        Go to Dashboard
                    </Button>
                </div>
            ) : step === 'request' ? (
                <form className="space-y-6" onSubmit={handleSendResetEmail}>
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-3 rounded-lg text-sm flex items-center gap-2">
                            <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                            {error}
                        </div>
                    )}

                    <div className="space-y-4">
                        <Input
                            id="email"
                            name="email"
                            type="email"
                            autoComplete="email"
                            required
                            variant="glass"
                            label="Email address"
                            placeholder="writer@studio.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            startIcon={<Mail className="h-4 w-4" />}
                        />
                    </div>

                    <div className="pt-2">
                        <Button
                            type="submit"
                            disabled={loading}
                            isLoading={loading}
                            className="w-full text-base"
                            variant="primary"
                            size="lg"
                        >
                            Send Reset Code / Link
                        </Button>
                    </div>

                    <div className="flex items-center justify-between text-xs text-gray-500 pt-2">
                        <button
                            type="button"
                            onClick={() => setStep('verify')}
                            className="text-accent-400 hover:text-accent-300 transition-colors"
                        >
                            Already have a code? Enter it here &rarr;
                        </button>
                    </div>

                    <div className="pt-2 text-center">
                        <Link
                            to="/login"
                            className="inline-flex items-center gap-2 text-sm font-semibold text-accent-400 hover:text-accent-300 transition-colors"
                        >
                            <ArrowLeft className="h-4 w-4" /> Back to Sign In
                        </Link>
                    </div>
                </form>
            ) : (
                <form className="space-y-5" onSubmit={handleVerifyOtpAndReset}>
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-3 rounded-lg text-sm flex items-center gap-2">
                            <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                            {error}
                        </div>
                    )}

                    <div className="bg-accent-500/10 border border-accent-500/20 text-accent-300 p-3 rounded-lg text-xs">
                        Check your email for the 6-digit code (or click the link inside the email).
                    </div>

                    <div className="space-y-3">
                        <Input
                            id="email"
                            name="email"
                            type="email"
                            autoComplete="email"
                            required
                            variant="glass"
                            label="Email address"
                            placeholder="writer@studio.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            startIcon={<Mail className="h-4 w-4" />}
                        />

                        <Input
                            id="otp"
                            name="otp"
                            type="text"
                            inputMode="numeric"
                            required
                            variant="glass"
                            label="6-Digit Reset Code"
                            placeholder="123456"
                            maxLength={8}
                            value={otp}
                            onChange={(e) => setOtp(e.target.value)}
                            startIcon={<KeyRound className="h-4 w-4" />}
                        />

                        <Input
                            id="password"
                            name="password"
                            type="password"
                            autoComplete="new-password"
                            required
                            variant="glass"
                            label="New Password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            startIcon={<Lock className="h-4 w-4" />}
                        />

                        <Input
                            id="confirmPassword"
                            name="confirmPassword"
                            type="password"
                            autoComplete="new-password"
                            required
                            variant="glass"
                            label="Confirm New Password"
                            placeholder="••••••••"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            startIcon={<Lock className="h-4 w-4" />}
                        />
                    </div>

                    <div className="pt-2">
                        <Button
                            type="submit"
                            disabled={loading}
                            isLoading={loading}
                            className="w-full text-base"
                            variant="primary"
                            size="lg"
                        >
                            Reset Password
                        </Button>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1">
                        <button
                            type="button"
                            onClick={() => setStep('request')}
                            className="text-gray-400 hover:text-gray-200 transition-colors inline-flex items-center gap-1"
                        >
                            <ArrowLeft className="h-3 w-3" /> Resend Code
                        </button>
                        <Link
                            to="/login"
                            className="text-accent-400 hover:text-accent-300 transition-colors"
                        >
                            Back to Sign In
                        </Link>
                    </div>
                </form>
            )}
        </AuthLayout>
    );
}
