import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { AuthLayout } from '../auth/AuthLayout';
import { Button } from '../components/ui/Button';
import { supabase } from '../lib/supabase';
import { Mail, CheckCircle2, ArrowLeft, RefreshCw, KeyRound, AlertCircle, Loader2 } from 'lucide-react';

export default function VerifyEmail() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const queryEmail = searchParams.get('email') || '';

    const [email, setEmail] = useState(queryEmail);
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [verifying, setVerifying] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const [resending, setResending] = useState(false);
    const [resendSuccess, setResendSuccess] = useState(false);
    const [countdown, setCountdown] = useState(0);

    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    useEffect(() => {
        if (queryEmail) {
            setEmail(queryEmail);
        }
    }, [queryEmail]);

    useEffect(() => {
        if (countdown <= 0) return;
        const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
        return () => clearTimeout(timer);
    }, [countdown]);

    // Handle single digit changes
    const handleOtpChange = (index: number, value: string) => {
        // Handle multi-character paste or typed character
        const cleanVal = value.replace(/[^0-9a-zA-Z]/g, '');
        
        if (cleanVal.length > 1) {
            // User pasted into a box
            handlePasteData(cleanVal);
            return;
        }

        const newOtp = [...otp];
        newOtp[index] = cleanVal.slice(-1);
        setOtp(newOtp);
        setErrorMsg(null);

        // Auto focus next input
        if (cleanVal && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }

        // Auto submit if all 6 filled
        if (cleanVal && index === 5) {
            const fullCode = newOtp.join('');
            if (fullCode.length === 6) {
                verifyCode(fullCode);
            }
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handlePaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text').trim();
        handlePasteData(pastedData);
    };

    const handlePasteData = (data: string) => {
        const digits = data.replace(/[^0-9a-zA-Z]/g, '').slice(0, 6).split('');
        if (digits.length === 0) return;

        const newOtp = ['', '', '', '', '', ''];
        digits.forEach((d, i) => {
            if (i < 6) newOtp[i] = d;
        });
        setOtp(newOtp);
        setErrorMsg(null);

        const focusIndex = Math.min(digits.length, 5);
        inputRefs.current[focusIndex]?.focus();

        if (digits.length === 6) {
            verifyCode(newOtp.join(''));
        }
    };

    const verifyCode = async (codeToVerify?: string) => {
        const token = (codeToVerify || otp.join('')).trim();
        const targetEmail = email.trim();

        if (!targetEmail) {
            setErrorMsg('Please enter your email address.');
            return;
        }

        if (token.length < 6) {
            setErrorMsg('Please enter the full 6-digit confirmation code.');
            return;
        }

        setVerifying(true);
        setErrorMsg(null);

        try {
            // Attempt signup verification first
            let result = await supabase.auth.verifyOtp({
                email: targetEmail,
                token: token,
                type: 'signup'
            });

            // If failed with signup type, try 'email' type as fallback
            if (result.error) {
                const retryResult = await supabase.auth.verifyOtp({
                    email: targetEmail,
                    token: token,
                    type: 'email'
                });
                if (!retryResult.error) {
                    result = retryResult;
                }
            }

            if (result.error) {
                throw result.error;
            }

            // Successfully verified! Redirect to Email Confirmed page
            navigate('/email-confirmed');
        } catch (err: any) {
            console.error('OTP Verification error:', err);
            setErrorMsg(err.message || 'Invalid or expired confirmation code. Please check and try again.');
        } finally {
            setVerifying(false);
        }
    };

    const handleResend = async () => {
        if (!email.trim() || countdown > 0) return;
        setResending(true);
        setResendSuccess(false);
        setErrorMsg(null);

        try {
            const { error } = await supabase.auth.resend({
                type: 'signup',
                email: email.trim(),
            });

            if (error) throw error;
            setResendSuccess(true);
            setCountdown(60); // 60s cooldown
        } catch (err: any) {
            console.error('Error resending confirmation code:', err);
            setErrorMsg(err.message || 'Failed to resend confirmation email.');
        } finally {
            setResending(false);
        }
    };

    const isCodeComplete = otp.every(digit => digit.length === 1);

    return (
        <AuthLayout
            title="Confirm your email"
            subtitle="Enter the 6-digit code or click the confirmation link in your email."
        >
            <div className="space-y-6">
                {/* Header Icon */}
                <div className="flex justify-center">
                    <div className="h-16 w-16 rounded-2xl bg-accent-500/10 border border-accent-500/20 text-accent-400 flex items-center justify-center shadow-lg shadow-accent-500/10">
                        <Mail className="h-8 w-8" />
                    </div>
                </div>

                {/* Email Display */}
                <div className="text-center space-y-1">
                    <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">
                        Verification sent to
                    </p>
                    {queryEmail ? (
                        <p className="text-sm font-semibold text-white font-mono bg-gray-900/60 border border-gray-800 rounded-lg py-1.5 px-3 inline-block max-w-full truncate">
                            {email}
                        </p>
                    ) : (
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Enter your email address"
                            className="w-full bg-gray-900/60 border border-gray-800 rounded-lg py-2 px-3 text-sm text-white text-center focus:outline-none focus:border-accent-500 transition-colors"
                        />
                    )}
                </div>

                {/* Error & Success Messages */}
                {errorMsg && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-xs flex items-start gap-2 animate-shake">
                        <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                        <span>{errorMsg}</span>
                    </div>
                )}

                {resendSuccess && (
                    <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-3 rounded-lg text-xs flex items-center justify-center gap-2">
                        <CheckCircle2 className="h-4 w-4 shrink-0" />
                        <span>A fresh code & confirmation link has been sent!</span>
                    </div>
                )}

                {/* 6-Digit OTP Input Form */}
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        verifyCode();
                    }}
                    className="space-y-4"
                >
                    <div>
                        <label className="block text-xs font-semibold text-gray-300 text-center mb-3">
                            Enter 6-Digit Confirmation Code
                        </label>
                        <div className="flex justify-center gap-2 sm:gap-3" onPaste={handlePaste}>
                            {otp.map((digit, idx) => (
                                <input
                                    key={idx}
                                    ref={(el) => { inputRefs.current[idx] = el; }}
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={1}
                                    value={digit}
                                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                                    onKeyDown={(e) => handleKeyDown(idx, e)}
                                    className={`w-11 h-13 sm:w-12 sm:h-14 text-center text-xl sm:text-2xl font-bold font-mono rounded-xl border transition-all duration-200 outline-none
                                        ${digit
                                            ? 'border-accent-500 bg-accent-500/10 text-white shadow-sm shadow-accent-500/20'
                                            : 'border-gray-800 bg-gray-900/60 text-gray-200 focus:border-accent-500/60 focus:bg-gray-900'
                                        }
                                    `}
                                />
                            ))}
                        </div>
                    </div>

                    <Button
                        type="submit"
                        variant="primary"
                        size="lg"
                        disabled={verifying || !isCodeComplete}
                        className="w-full text-sm font-semibold gap-2 shadow-lg shadow-accent-500/20 mt-2"
                    >
                        {verifying ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                <span>Verifying code...</span>
                            </>
                        ) : (
                            <>
                                <KeyRound className="h-4 w-4" />
                                <span>Verify Code</span>
                            </>
                        )}
                    </Button>
                </form>

                {/* Divider / Info */}
                <div className="relative flex py-1 items-center">
                    <div className="flex-grow border-t border-gray-800"></div>
                    <span className="flex-shrink mx-3 text-[11px] text-gray-500 uppercase tracking-wider font-medium">Or</span>
                    <div className="flex-grow border-t border-gray-800"></div>
                </div>

                <div className="text-center">
                    <p className="text-xs text-gray-400 leading-relaxed max-w-xs mx-auto">
                        You can also click the <strong>Confirm your email</strong> link sent to your inbox.
                    </p>
                </div>

                {/* Resend & Back to Login */}
                <div className="space-y-3 pt-1">
                    {email && (
                        <Button
                            type="button"
                            variant="secondary"
                            size="default"
                            disabled={resending || countdown > 0}
                            onClick={handleResend}
                            className="w-full text-xs font-semibold gap-2 border-gray-800 bg-gray-900/50 hover:bg-gray-800 text-gray-300"
                        >
                            <RefreshCw className={`h-3.5 w-3.5 ${resending ? 'animate-spin' : ''}`} />
                            {countdown > 0 ? `Resend code in ${countdown}s` : 'Resend confirmation code'}
                        </Button>
                    )}

                    <div className="text-center pt-2">
                        <Link
                            to="/login"
                            className="inline-flex items-center justify-center gap-2 text-xs font-semibold text-gray-400 hover:text-white transition-colors"
                        >
                            <ArrowLeft className="h-3.5 w-3.5" />
                            Back to Login
                        </Link>
                    </div>
                </div>
            </div>
        </AuthLayout>
    );
}
