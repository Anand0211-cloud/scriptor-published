import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { AuthLayout } from '../auth/AuthLayout';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Mail, Lock } from 'lucide-react';

export default function SignUp() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    const handleSignUp = async (e: React.FormEvent) => {
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
            const { error } = await supabase.auth.signUp({
                email,
                password,
            });

            if (error) throw error;

            // For now, redirect to login or dashboard. 
            navigate('/');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthLayout
            title="Create your Studio"
            subtitle="Start writing your next blockbuster today."
        >
            <form className="space-y-5" onSubmit={handleSignUp}>
                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-3 rounded-lg text-sm flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                        {error}
                    </div>
                )}

                <Input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    variant="glass"
                    placeholder="Email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    startIcon={<Mail className="h-4 w-4" />}
                />

                <Input
                    id="password"
                    name="password"
                    type="password"
                    required
                    variant="glass"
                    placeholder="Password (min 6 chars)"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    startIcon={<Lock className="h-4 w-4" />}
                />

                <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    required
                    variant="glass"
                    placeholder="Confirm Password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    startIcon={<Lock className="h-4 w-4" />}
                />

                <div className="pt-2">
                    <Button
                        type="submit"
                        disabled={loading}
                        isLoading={loading}
                        className="w-full text-base"
                        variant="primary"
                        size="lg"
                    >
                        Create Account
                    </Button>
                </div>
            </form>

            <div className="mt-8">
                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-700" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="px-4 bg-[#030712] text-gray-500">
                            Already have an account?
                        </span>
                    </div>
                </div>

                <div className="mt-6 flex justify-center">
                    <Link
                        to="/login"
                        className="text-sm font-semibold text-accent-400 hover:text-accent-300 transition-colors"
                    >
                        Sign in to your account &rarr;
                    </Link>
                </div>
            </div>
        </AuthLayout>
    );
}
