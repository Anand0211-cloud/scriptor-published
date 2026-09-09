import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { AuthLayout } from '../auth/AuthLayout';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Lock, KeyRound, Mail, CheckCircle2, Moon, Sun } from 'lucide-react';
import { useTheme } from '../components/ThemeProvider';

export default function ResetPassword() {
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [hasSession, setHasSession] = useState(false);
    const navigate = useNavigate();
    const { theme, setTheme } = useTheme();

    useEffect(() => {
        // Check if user already has an active session from clicking email magic link
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session?.user) {
                setHasSession(true);
            }
        });

        // Listen for PASSWORD_RECOVERY event
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'PASSWORD_RECOVERY' || session?.user) {
                setHasSession(true);
                setError(null);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const handleUpdatePassword = async (e: React.FormEvent) => {
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

        try {
            if (!hasSession && otp.trim() && email.trim()) {
                // Verify OTP code first
                const { error: otpError } = await supabase.auth.verifyOtp({
                    email: email.trim(),
                    token: otp.trim(),
                    type: 'recovery',
                });
                if (otpError) throw otpError;
            }

            // Update user password
            const { error: updateError } = await supabase.auth.updateUser({
                password,
            });

            if (updateError) throw updateError;

            setSuccess(true);
            setTimeout(() => {
                navigate('/');
            }, 2500);
        } catch (err: any) {
            setError(err.message || 'Failed to update password. Please check your reset link or code.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthLayout
            title="Set New Password"
            subtitle="Please enter a new password for your account."
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
                            <p className="font-semibold text-emerald-300">Password updated successfully!</p>
                            <p className="mt-1 text-emerald-400/90">
                                You are being redirected to your dashboard...
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
            ) : (
                <form className="space-y-5" onSubmit={handleUpdatePassword}>
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-3 rounded-lg text-sm flex items-center gap-2">
                            <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                            {error}
                        </div>
                    )}

                    {!hasSession && (
                        <div className="space-y-3 pb-2 border-b border-gray-700/50">
                            <p className="text-xs text-gray-400">
                                Enter your email and the 6-digit code received in your inbox:
                            </p>
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
                        </div>
                    )}

                    <div className="space-y-3">
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
                            Update Password
                        </Button>
                    </div>

                    <div className="pt-2 text-center">
                        <Link
                            to="/login"
                            className="text-sm font-semibold text-accent-400 hover:text-accent-300 transition-colors"
                        >
                            Back to Sign In
                        </Link>
                    </div>
                </form>
            )}
        </AuthLayout>
    );
}
