import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { AuthLayout } from '../auth/AuthLayout';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Mail, Lock } from 'lucide-react';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) throw error;
            navigate('/');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthLayout
            title="Welcome Back"
            subtitle="Continue your storytelling journey."
        >
            <form className="space-y-6" onSubmit={handleLogin}>
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

                    <div className="space-y-1">
                        <div className="flex items-center justify-end">
                            <a href="#" className="text-xs font-medium text-accent-400 hover:text-accent-300 transition-colors">
                                Forgot password?
                            </a>
                        </div>
                        <Input
                            id="password"
                            name="password"
                            type="password"
                            autoComplete="current-password"
                            required
                            variant="glass"
                            label="Password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            startIcon={<Lock className="h-4 w-4" />}
                        />
                    </div>
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
                        Sign In
                    </Button>
                </div>
            </form>

            <div className="mt-8">
                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-200 dark:border-gray-700" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="px-4 bg-paper dark:bg-bg-primary text-gray-500">
                            Don't have an account?
                        </span>
                    </div>
                </div>

                <div className="mt-6 flex justify-center">
                    <Link
                        to="/signup"
                        className="text-sm font-semibold text-accent-400 hover:text-accent-300 transition-colors"
                    >
                        Create your account &rarr;
                    </Link>
                </div>
            </div>
        </AuthLayout>
    );
}
