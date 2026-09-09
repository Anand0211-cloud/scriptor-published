import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthLayout } from '../auth/AuthLayout';
import { Button } from '../components/ui/Button';
import { CheckCircle2, ArrowRight } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function EmailConfirmed() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        // Check if user session was automatically established upon redirect
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) {
                setIsLoggedIn(true);
            }
        });
    }, []);

    return (
        <AuthLayout
            title="Email Confirmed"
            subtitle="Your Cinemar Scripter account has been verified."
        >
            <div className="space-y-6 text-center">
                <div className="flex justify-center">
                    <div className="h-16 w-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-500/10 animate-fade-in">
                        <CheckCircle2 className="h-9 w-9" />
                    </div>
                </div>

                <div className="space-y-2">
                    <h3 className="text-lg font-bold text-white">
                        Ready to Start Writing
                    </h3>
                    <p className="text-sm text-gray-400 leading-relaxed max-w-sm mx-auto">
                        Your email address has been successfully verified. You now have full access to your screenplay writing studio.
                    </p>
                </div>

                <div className="pt-4">
                    {isLoggedIn ? (
                        <Button
                            onClick={() => navigate('/')}
                            variant="primary"
                            size="lg"
                            className="w-full text-base font-semibold gap-2 shadow-lg shadow-accent-500/20"
                        >
                            Open Studio &rarr;
                        </Button>
                    ) : (
                        <Link to="/login" className="block w-full">
                            <Button
                                variant="primary"
                                size="lg"
                                className="w-full text-base font-semibold gap-2 shadow-lg shadow-accent-500/20"
                            >
                                <span>Sign In to Your Account</span>
                                <ArrowRight className="h-4 w-4" />
                            </Button>
                        </Link>
                    )}
                </div>
            </div>
        </AuthLayout>
    );
}
