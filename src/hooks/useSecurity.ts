/**
 * React hook for managing prompt injection detection and user cooldown state.
 * Used in the frontend chat interface to block malicious inputs before sending.
 */

import { useState, useCallback, useRef } from 'react';
import { detectPromptInjection, sanitizeMessage, getBlockMessage } from '@/lib/security/promptInjectionDetector';
import { toast } from 'sonner';

export interface SecurityState {
    isBlocked: boolean;
    blockedUntil: Date | null;
    attemptCount: number;
    lastCategory: string | null;
    minutesRemaining: number;
}

const COOLDOWN_MS = 15 * 60 * 1000; // 15 minutes in milliseconds
const STORAGE_KEY = 'fitia_security_block';

function loadBlockState(): SecurityState {
    try {
        const stored = sessionStorage.getItem(STORAGE_KEY);
        if (!stored) return { isBlocked: false, blockedUntil: null, attemptCount: 0, lastCategory: null, minutesRemaining: 0 };
        const parsed = JSON.parse(stored);
        const blockedUntil = parsed.blockedUntil ? new Date(parsed.blockedUntil) : null;
        const isBlocked = blockedUntil ? blockedUntil > new Date() : false;
        const minutesRemaining = blockedUntil
            ? Math.max(0, (blockedUntil.getTime() - Date.now()) / 60000)
            : 0;
        return { ...parsed, isBlocked, blockedUntil, minutesRemaining };
    } catch {
        return { isBlocked: false, blockedUntil: null, attemptCount: 0, lastCategory: null, minutesRemaining: 0 };
    }
}

function saveBlockState(state: SecurityState) {
    try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify({
            ...state,
            blockedUntil: state.blockedUntil?.toISOString() ?? null,
        }));
    } catch {
        // sessionStorage not available
    }
}

export function useSecurity() {
    const [security, setSecurity] = useState<SecurityState>(loadBlockState);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Update remaining time every 10 seconds
    const startCountdown = useCallback((until: Date) => {
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = setInterval(() => {
            const remaining = Math.max(0, (until.getTime() - Date.now()) / 60000);
            setSecurity(prev => {
                if (remaining <= 0) {
                    if (timerRef.current) clearInterval(timerRef.current);
                    const next = { ...prev, isBlocked: false, minutesRemaining: 0 };
                    saveBlockState(next);
                    toast.success('El asistente está disponible nuevamente.');
                    return next;
                }
                return { ...prev, minutesRemaining: remaining };
            });
        }, 10000);
    }, []);

    /**
     * Validates a message before sending. Returns:
     * - { safe: true, sanitized: string } if OK
     * - { safe: false, message: string }  if blocked/injection detected
     */
    const validateMessage = useCallback((rawInput: string): { safe: boolean; sanitized?: string; message?: string } => {
        // Check existing cooldown first
        const currentState = loadBlockState();
        if (currentState.isBlocked && currentState.blockedUntil) {
            const mins = Math.ceil((currentState.blockedUntil.getTime() - Date.now()) / 60000);
            return {
                safe: false,
                message: getBlockMessage(mins, currentState.attemptCount),
            };
        }

        // Sanitize input
        const sanitized = sanitizeMessage(rawInput);

        // Detect injection
        const detection = detectPromptInjection(sanitized);

        if (detection.isInjection) {
            const existing = loadBlockState();
            const newCount = existing.attemptCount + 1;
            // Escalating cooldown: 15min * min(attempts, 4)
            const cooldownMs = COOLDOWN_MS * Math.min(newCount, 4);
            const blockedUntil = new Date(Date.now() + cooldownMs);
            const minutesRemaining = cooldownMs / 60000;

            const newState: SecurityState = {
                isBlocked: true,
                blockedUntil,
                attemptCount: newCount,
                lastCategory: detection.category,
                minutesRemaining,
            };

            setSecurity(newState);
            saveBlockState(newState);
            startCountdown(blockedUntil);

            // Log for debugging (sanitized, no PII)
            console.warn(`[Security] Injection detected: category=${detection.category} confidence=${detection.confidence} attempt=${newCount}`);

            toast.error(`⚠️ Mensaje bloqueado por seguridad. Cooldown: ${Math.ceil(minutesRemaining)} minutos.`, {
                duration: 8000,
            });

            return {
                safe: false,
                message: getBlockMessage(minutesRemaining, newCount),
            };
        }

        return { safe: true, sanitized };
    }, [startCountdown]);

    /** Manually clear block (for testing purposes only) */
    const clearBlock = useCallback(() => {
        if (timerRef.current) clearInterval(timerRef.current);
        const cleared: SecurityState = { isBlocked: false, blockedUntil: null, attemptCount: 0, lastCategory: null, minutesRemaining: 0 };
        setSecurity(cleared);
        sessionStorage.removeItem(STORAGE_KEY);
    }, []);

    return { security, validateMessage, clearBlock };
}
