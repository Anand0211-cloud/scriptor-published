import DashboardLayout from '../dashboard/DashboardLayout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { User, Monitor, Moon, Sun, Key, CheckCircle, AlertCircle } from 'lucide-react';
import { useTheme } from '../components/ThemeProvider';
import { useAuth } from '../components/AuthProvider';
import { useState } from 'react';
import { supabase } from '../lib/supabase';

export default function Settings() {
    const { theme, setTheme } = useTheme();
    const { user } = useAuth();

    // Password change states
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [otpSent, setOtpSent] = useState(false);
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [loadingPw, setLoadingPw] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    const handleSendOtp = async () => {
        if (!user?.email) return;
        setLoadingPw(true);
        setMessage({ type: '', text: '' });

        const { error } = await supabase.auth.resetPasswordForEmail(user.email);

        if (error) {
            setMessage({ type: 'error', text: error.message });
        } else {
            setOtpSent(true);
            setMessage({ type: 'success', text: 'Reset link/OTP sent to your email.' });
        }
        setLoadingPw(false);
    };

    const handleVerifyAndChangePassword = async () => {
        if (!otp || !newPassword) {
            setMessage({ type: 'error', text: 'Please enter both OTP and new password.' });
            return;
        }
        setLoadingPw(true);
        setMessage({ type: '', text: '' });

        // First verify the OTP
        const { error: verifyError } = await supabase.auth.verifyOtp({
            email: user?.email || '',
            token: otp,
            type: 'recovery'
        });

        if (verifyError) {
            setMessage({ type: 'error', text: verifyError.message });
            setLoadingPw(false);
            return;
        }

        // Then update the password
        const { error: updateError } = await supabase.auth.updateUser({
            password: newPassword
        });

        if (updateError) {
            setMessage({ type: 'error', text: updateError.message });
        } else {
            setMessage({ type: 'success', text: 'Password successfully updated!' });
            setIsChangingPassword(false);
            setOtpSent(false);
            setOtp('');
            setNewPassword('');
        }
        setLoadingPw(false);
    };

    return (
        <DashboardLayout>
            <div className="p-6 md:p-12 max-w-4xl mx-auto animate-fade-in space-y-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Settings</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-2">Manage your account preferences and studio settings.</p>
                </div>

                <div className="grid gap-6">
                    {/* Profile Section */}
                    <Card className="p-6 space-y-6">
                        <div className="flex items-center gap-4 border-b border-gray-200 dark:border-gray-800 pb-4">
                            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/20 rounded-lg text-indigo-600 dark:text-indigo-400">
                                <User className="h-5 w-5" />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Profile Settings</h2>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Manage your account details and security</p>
                            </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-4">
                            <Input label="Email" type="email" value={user?.email || ''} disabled />

                            <div className="flex flex-col gap-2">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
                                {!isChangingPassword ? (
                                    <Button
                                        variant="outline"
                                        onClick={() => setIsChangingPassword(true)}
                                        className="w-full justify-start text-gray-600 dark:text-gray-400"
                                    >
                                        <Key className="h-4 w-4 mr-2" />
                                        Change Password
                                    </Button>
                                ) : (
                                    <Button
                                        variant="ghost"
                                        onClick={() => {
                                            setIsChangingPassword(false);
                                            setOtpSent(false);
                                            setMessage({ type: '', text: '' });
                                        }}
                                        className="w-full justify-start text-gray-500"
                                    >
                                        Cancel Password Change
                                    </Button>
                                )}
                            </div>
                        </div>

                        {isChangingPassword && (
                            <div className="mt-4 p-4 border border-gray-200 dark:border-gray-800 rounded-lg bg-gray-50 dark:bg-gray-900/50 space-y-4">
                                <h3 className="text-sm font-medium text-gray-900 dark:text-white flex items-center gap-2">
                                    <Key className="h-4 w-4" />
                                    Update Password
                                </h3>

                                {message.text && (
                                    <div className={`p-3 rounded-md text-sm flex items-center gap-2 ${message.type === 'error'
                                        ? 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400'
                                        : 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400'
                                        }`}>
                                        {message.type === 'error' ? <AlertCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                                        {message.text}
                                    </div>
                                )}

                                {!otpSent ? (
                                    <div className="space-y-4">
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            We will send a one-time password (OTP) to <strong>{user?.email}</strong> to verify your identity.
                                        </p>
                                        <Button
                                            onClick={handleSendOtp}
                                            disabled={loadingPw}
                                        >
                                            {loadingPw ? 'Sending...' : 'Send OTP'}
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <Input
                                            label="Enter OTP"
                                            placeholder="6-digit code"
                                            value={otp}
                                            onChange={(e) => setOtp(e.target.value)}
                                        />
                                        <Input
                                            label="New Password"
                                            type="password"
                                            placeholder="Enter new password"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                        />
                                        <Button
                                            onClick={handleVerifyAndChangePassword}
                                            disabled={loadingPw || !otp || !newPassword}
                                        >
                                            {loadingPw ? 'Updating...' : 'Verify & Update Password'}
                                        </Button>
                                    </div>
                                )}
                            </div>
                        )}
                    </Card>

                    {/* Appearance Section */}
                    <Card className="p-6 space-y-6">
                        <div className="flex items-center gap-4 border-b border-gray-200 dark:border-gray-800 pb-4">
                            <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg text-purple-600 dark:text-purple-400">
                                <Monitor className="h-5 w-5" />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Appearance</h2>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Customize your workspace</p>
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium text-gray-900 dark:text-white">Theme Preference</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Choose your preferred theme.</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant={theme === 'light' ? 'primary' : 'outline'}
                                    size="sm"
                                    onClick={() => setTheme('light')}
                                    className="gap-2"
                                >
                                    <Sun className="h-4 w-4" />
                                    Light
                                </Button>
                                <Button
                                    variant={theme === 'dark' ? 'primary' : 'outline'}
                                    size="sm"
                                    onClick={() => setTheme('dark')}
                                    className="gap-2"
                                >
                                    <Moon className="h-4 w-4" />
                                    Dark
                                </Button>
                                <Button
                                    variant={theme === 'system' ? 'primary' : 'outline'}
                                    size="sm"
                                    onClick={() => setTheme('system')}
                                >
                                    System
                                </Button>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </DashboardLayout>
    );
}
