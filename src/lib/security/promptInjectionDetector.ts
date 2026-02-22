/**
 * Prompt Injection Detection Engine
 * 
 * Detects attempts to:
 * - Override system instructions ("ignore previous instructions", "new prompt")
 * - Exfiltrate system context ("what are your instructions", "show system prompt")
 * - Jailbreak ("DAN mode", "pretend you are", "act as if")
 * - Social engineering ("your real self", "without restrictions")
 * - Data extraction ("list all users", "show all members", "database query")
 */

export interface DetectionResult {
    isInjection: boolean;
    category: string | null;
    confidence: 'high' | 'medium' | 'low' | null;
    matchedPattern: string | null;
}

// High-confidence injection patterns (regex)
const HIGH_CONFIDENCE_PATTERNS: Array<{ pattern: RegExp; category: string }> = [
    // Classic prompt injection
    { pattern: /ignore\s+(all\s+)?(previous|prior|above|your)\s+(instructions?|prompts?|rules?|constraints?)/gi, category: 'instruction_override' },
    { pattern: /disregard\s+(all\s+)?(previous|prior|above|your)\s+(instructions?|prompts?|rules?)/gi, category: 'instruction_override' },
    { pattern: /forget\s+(everything|all)\s+(you|you've|you have)\s+(learned|been told|been instructed)/gi, category: 'instruction_override' },
    { pattern: /new\s+(instruction|prompt|task|directive|goal|objective)s?:/gi, category: 'instruction_override' },
    { pattern: /\[\s*system\s*\]/gi, category: 'system_tag_injection' },
    { pattern: /<<\s*system\s*>>/gi, category: 'system_tag_injection' },
    { pattern: /<\s*system\s*>/gi, category: 'system_tag_injection' },

    // Jailbreak attempts
    { pattern: /\bDAN\b.*mode/gi, category: 'jailbreak' },
    { pattern: /pretend\s+(you\s+)?(are|you['']?re)\s+(not\s+an?\s+ai|a\s+human|without\s+(limits|restrictions|rules))/gi, category: 'jailbreak' },
    { pattern: /act\s+as\s+(if\s+)?(you\s+)?(are|were|have\s+no)\s+(no\s+(rules|restrictions|limits)|a\s+different)/gi, category: 'jailbreak' },
    { pattern: /you\s+are\s+now\s+(in\s+)?(developer|god|admin|root|superuser|unrestricted)\s+mode/gi, category: 'jailbreak' },
    { pattern: /enable\s+(developer|debug|admin|god|unrestricted)\s+mode/gi, category: 'jailbreak' },
    { pattern: /jailbreak/gi, category: 'jailbreak' },

    // System prompt extraction
    { pattern: /(show|print|output|display|reveal|tell me|give me|what (is|are))\s+(your\s+)?(system\s+prompt|instructions?|rules?|constraints?|initial\s+prompt)/gi, category: 'system_extraction' },
    { pattern: /what\s+(were\s+)?(you|your)\s+(told|instructed|programmed|trained)\s+to/gi, category: 'system_extraction' },
    { pattern: /repeat\s+(your|the)\s+(system|initial|original|base)\s+(prompt|instructions?|message)/gi, category: 'system_extraction' },

    // Data extraction
    { pattern: /(list|show|dump|export|output)\s+all\s+(users?|members?|emails?|phones?|passwords?|data|records?)/gi, category: 'data_extraction' },
    { pattern: /SELECT\s+\*\s+FROM/gi, category: 'sql_injection' },
    { pattern: /DROP\s+TABLE/gi, category: 'sql_injection' },
    { pattern: /INSERT\s+INTO.*VALUES/gi, category: 'sql_injection' },
    { pattern: /UNION\s+(ALL\s+)?SELECT/gi, category: 'sql_injection' },

    // Role manipulation
    { pattern: /you\s+(are|must\s+be|should\s+be)\s+(now\s+)?(a\s+)?(human|person|real|unrestricted|free)\s*(ai|assistant|bot)?/gi, category: 'role_manipulation' },
    { pattern: /your\s+true\s+self|without\s+(your\s+)?(restrictions?|limitations?|rules?|filters?|guardrails?)/gi, category: 'role_manipulation' },
    { pattern: /override\s+(your\s+)?(safety|ethical|moral|guardrail|filter|restriction)/gi, category: 'role_manipulation' },
];

// Medium confidence patterns
const MEDIUM_CONFIDENCE_PATTERNS: Array<{ pattern: RegExp; category: string }> = [
    { pattern: /do\s+anything\s+now\s*(mode)?/gi, category: 'jailbreak' },
    { pattern: /\bhypothetically\b.*(would\s+you|could\s+you|can\s+you)\s+(tell|show|give|provide)/gi, category: 'social_engineering' },
    { pattern: /for\s+(educational|research|testing|academic)\s+purposes?,?\s+(tell|show|give|explain|describe|how\s+to)/gi, category: 'social_engineering' },
    { pattern: /base64|rot13|hex\s+encode|cipher/gi, category: 'obfuscation' },
    { pattern: /translate\s+this\s+(to|into)\s+(another\s+language|code|pig\s+latin)/gi, category: 'obfuscation' },
    { pattern: /(what|who|how)\s+(can|could|should)\s+I\s+hack/gi, category: 'malicious_intent' },
    { pattern: /bypass\s+(the\s+)?(filter|restriction|rule|check|validation|limit)/gi, category: 'bypass_attempt' },
    { pattern: /you\s+(can|could|should|must)\s+break\s+(your\s+)?(rules|restrictions|protocol)/gi, category: 'rule_breaking' },
];

/**
 * Analyzes a message for prompt injection / adversarial patterns.
 * Uses multi-layer detection with confidence scoring.
 */
export function detectPromptInjection(message: string): DetectionResult {
    if (!message || message.trim().length === 0) {
        return { isInjection: false, category: null, confidence: null, matchedPattern: null };
    }

    const normalized = message.toLowerCase().trim();

    // Check high-confidence patterns first
    for (const { pattern, category } of HIGH_CONFIDENCE_PATTERNS) {
        const match = normalized.match(pattern);
        if (match) {
            return {
                isInjection: true,
                category,
                confidence: 'high',
                matchedPattern: match[0].substring(0, 50),
            };
        }
    }

    // Check medium-confidence patterns
    for (const { pattern, category } of MEDIUM_CONFIDENCE_PATTERNS) {
        const match = normalized.match(pattern);
        if (match) {
            return {
                isInjection: true,
                category,
                confidence: 'medium',
                matchedPattern: match[0].substring(0, 50),
            };
        }
    }

    // Heuristic checks:
    // 1. Unusually long message (>2000 chars) — possible padding attack
    if (message.length > 2000) {
        return {
            isInjection: true,
            category: 'padding_attack',
            confidence: 'low',
            matchedPattern: `message_length=${message.length}`,
        };
    }

    // 2. High density of special characters (encoded payloads)
    const specialCharCount = (message.match(/[<>{}\[\]\\\/\|;'"=%@`~]/g) || []).length;
    const specialCharDensity = specialCharCount / message.length;
    if (specialCharDensity > 0.15 && message.length > 50) {
        return {
            isInjection: true,
            category: 'encoded_payload',
            confidence: 'low',
            matchedPattern: `special_char_density=${(specialCharDensity * 100).toFixed(1)}%`,
        };
    }

    return { isInjection: false, category: null, confidence: null, matchedPattern: null };
}

/**
 * Sanitizes a message for safe storage and display.
 * Removes null bytes, control chars, and trims excessive whitespace.
 */
export function sanitizeMessage(message: string): string {
    return message
        .replace(/\0/g, '') // Remove null bytes
        .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Remove control chars except \t \n \r
        .replace(/\s{3,}/g, '  ') // Collapse excessive whitespace
        .trim()
        .substring(0, 4000); // Hard cap at 4000 chars
}

/**
 * Generates a block response message for the user.
 */
export function getBlockMessage(minutesRemaining: number, attemptCount: number): string {
    const mins = Math.ceil(minutesRemaining);

    if (attemptCount >= 3) {
        return `⛔ Tu acceso ha sido suspendido por actividad sospechosa. Por favor contacta al gimnasio directamente. Tiempo restante: ${mins} minutos.`;
    }

    return `🚫 Hemos detectado un mensaje no permitido. El agente ha sido pausado por ${mins} minutos por seguridad. Si esto fue un error, intenta de nuevo más tarde.`;
}
