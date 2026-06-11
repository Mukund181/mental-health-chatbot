/* ===========================================================
   SafeSpace — Client Script
   Auth flow + empathetic chatbot. Nothing extra.
   =========================================================== */

// ── State ──
const API_BASE = '';
let isGuest = true;
let user = { username: null };

// ── Init ──
document.addEventListener('DOMContentLoaded', () => {
    // Restore theme
    const dark = localStorage.getItem('ss-dark') === '1';
    if (dark) document.documentElement.classList.add('dark');
    updateThemeIcon(dark);

    // Auto-login — check if a session cookie exists by hitting the profile endpoint
    checkSession();
});

// ── Theme ──
function toggleTheme() {
    const dark = document.documentElement.classList.toggle('dark');
    localStorage.setItem('ss-dark', dark ? '1' : '0');
    updateThemeIcon(dark);
}
function updateThemeIcon(dark) {
    const el = document.getElementById('icon-theme');
    if (!el) return;
    el.innerHTML = dark
        ? '<circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>'
        : '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>';
}

// ── Auth UI ──
function switchAuthTab(tab) {
    document.getElementById('field-username').style.display = tab === 'register' ? 'block' : 'none';
    document.getElementById('auth-submit').textContent = tab === 'register' ? 'Create Account' : 'Sign In';
    document.getElementById('tab-login').classList.toggle('active', tab === 'login');
    document.getElementById('tab-register').classList.toggle('active', tab === 'register');
    hideError();
}

async function handleAuth(e) {
    e.preventDefault();
    hideError();
    const isReg = document.getElementById('tab-register').classList.contains('active');
    const email = document.getElementById('auth-email').value.trim();
    const pw = document.getElementById('auth-password').value;
    const uname = document.getElementById('auth-username').value.trim();

    try {
        const endpoint = isReg ? '/auth/register' : '/auth/login';
        const body = isReg ? { username: uname, email, password: pw } : { email, password: pw };
        const res = await fetch(API_BASE + endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(body)
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Authentication failed');

        isGuest = false;
        user.username = data.username || uname || email.split('@')[0];
        enterApp(user.username);
    } catch (err) {
        showError(err.message);
    }
}

function enterAsGuest() {
    isGuest = true;
    user = { username: 'Guest' };
    enterApp('Guest');
}

function enterApp(name) {
    document.getElementById('auth-screen').classList.add('hidden');
    document.getElementById('app').classList.remove('hidden');
    document.getElementById('uname').textContent = name;
    document.getElementById('avatar').textContent = name[0].toUpperCase();

    // First bot greeting after a beat
    setTimeout(() => addBot("Hey there. I'm glad you're here. How are you feeling right now?"), 600);
}

function signOut() {
    // Ask backend to clear the cookie (fire-and-forget)
    fetch(API_BASE + '/auth/logout', { method: 'POST', credentials: 'include' }).catch(() => {});
    user = { username: null };
    isGuest = true;

    // Reset chat
    document.getElementById('messages').innerHTML = `
        <div class="welcome-card">
            <div class="welcome-icon">🌿</div>
            <h2>Welcome to SafeSpace</h2>
            <p>I'm <strong>Aura</strong>, your empathetic companion. I'm not a therapist, but I'm here to listen without judgment and help you find calm. What's on your mind?</p>
        </div>`;
    document.getElementById('prompts').classList.remove('hidden');

    document.getElementById('app').classList.add('hidden');
    document.getElementById('auth-screen').classList.remove('hidden');
}

async function checkSession() {
    try {
        const res = await fetch(API_BASE + '/auth/profile', { credentials: 'include' });
        if (res.ok) {
            const data = await res.json();
            isGuest = false;
            user.username = data.username || data.email || 'User';
            enterApp(user.username);
        }
    } catch (_) {
        // No valid session cookie — stay on auth screen
    }
}

function showError(msg) {
    const el = document.getElementById('auth-error');
    el.textContent = msg;
    el.classList.remove('hidden');
}
function hideError() {
    document.getElementById('auth-error').classList.add('hidden');
}

// ── Chat ──
let botBusy = false;

function autoGrow(el) {
    el.style.height = 'auto';
    el.style.height = el.scrollHeight + 'px';
}
function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
}

function sendQuick(text) {
    document.getElementById('msg-input').value = text;
    send();
}

async function send() {
    const input = document.getElementById('msg-input');
    const text = input.value.trim();
    if (!text || botBusy) return;

    addUser(text);
    input.value = '';
    input.style.height = 'auto';

    document.getElementById('prompts').classList.add('hidden');
    botBusy = true;
    showTyping();

    try {
        const res = await fetch(API_BASE + '/messages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ message: text })
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Server error');

        hideTyping();
        addBot(data.botResponse);
    } catch (err) {
        hideTyping();
        const localReply = respond(text);
        addBot(localReply);
    } finally {
        botBusy = false;
    }
}

function formatMarkdown(text) {
    let html = esc(text);
    
    // Bold: **text** -> <strong>text</strong>
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // Italic: *text* -> <em>text</em>
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
    
    // Inline code: `text` -> <code>text</code>
    html = html.replace(/`(.*?)`/g, '<code>$1</code>');
    
    // Lists: Lines starting with "- " or "* "
    const lines = html.split('\n');
    let inList = false;
    const formattedLines = [];
    
    for (let line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
            if (!inList) {
                formattedLines.push('<ul class="chat-list">');
                inList = true;
            }
            formattedLines.push(`<li>${trimmed.substring(2)}</li>`);
        } else {
            if (inList) {
                formattedLines.push('</ul>');
                inList = false;
            }
            formattedLines.push(line);
        }
    }
    if (inList) {
        formattedLines.push('</ul>');
    }
    
    return formattedLines.join('\n')
        .replace(/\n/g, '<br>')
        .replace(/<\/ul><br>/g, '</ul>')
        .replace(/<ul class="chat-list"><br>/g, '<ul class="chat-list">');
}

function addUser(text) {
    const el = document.createElement('div');
    el.className = 'bubble user';
    el.innerHTML = `${formatMarkdown(text)}<div class="meta">${timeNow()}</div>`;
    msgs().appendChild(el);
    scrollDown();
}

function addBot(text) {
    const el = document.createElement('div');
    el.className = 'bubble bot';
    el.innerHTML = `<div class="meta">${timeNow()}</div>`;
    msgs().appendChild(el);
    scrollDown();

    let index = 0;
    const speed = 15;
    const interval = setInterval(() => {
        if (index < text.length) {
            index += 2; // Type 2 characters at a time for a snappy, premium feel
            if (index > text.length) index = text.length;
            el.innerHTML = `${formatMarkdown(text.substring(0, index))}<div class="meta">${timeNow()}</div>`;
            scrollDown();
        } else {
            clearInterval(interval);
        }
    }, speed);
}

function showTyping() {
    const el = document.createElement('div');
    el.className = 'bubble bot typing';
    el.id = 'typing';
    el.innerHTML = '<div class="typing-dots"><span></span><span></span><span></span></div>';
    msgs().appendChild(el);
    scrollDown();
}
function hideTyping() {
    const el = document.getElementById('typing');
    if (el) el.remove();
}

function msgs() { return document.getElementById('messages'); }
function scrollDown() {
    const m = msgs();
    m.scrollTop = m.scrollHeight;
}
function timeNow() {
    return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
function esc(s) {
    return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

// ── Local Empathetic Responses ──
function respond(text) {
    const t = text.toLowerCase();

    if (/\b(anxious|anxiety|nervous|panic|worried|worry)\b/.test(t))
        return "Anxiety can feel overwhelming, but you're safe right now. Try placing one hand on your chest and breathing slowly — in for 4 counts, out for 6. You're doing better than you think. Want to tell me more about what's causing it?";

    if (/\b(sad|depressed|lonely|alone|cry|crying|hopeless)\b/.test(t))
        return "I'm really sorry you're carrying that weight. It's okay to feel this way — your feelings are valid. You don't have to push through alone. What's one small thing that usually brings you a little comfort?";

    if (/\b(stress|stressed|overwhelm|burnout|burnt out|exhausted|tired)\b/.test(t))
        return "It sounds like you've been running on fumes. That takes real strength, but you deserve rest too. What if we paused everything for just 60 seconds? Close your eyes and take three deep breaths. I'll be right here when you come back.";

    if (/\b(sleep|insomnia|can'?t sleep|awake|restless)\b/.test(t))
        return "Not being able to sleep is so frustrating. Try this: focus on relaxing one body part at a time, starting from your toes. Don't force sleep — just let your body feel safe. Sometimes a warm drink and dimming the lights can also help signal your body it's time to rest.";

    if (/\b(angry|anger|furious|frustrated|mad|rage)\b/.test(t))
        return "Anger is a completely valid emotion — it often shows us where our boundaries have been crossed. You're allowed to feel this. Want to type out exactly what happened? Sometimes putting it into words takes away some of its power.";

    if (/\b(calm|relax|peace|breathe|breathing)\b/.test(t))
        return "Let's ground ourselves together. Try the 5-4-3-2-1 technique: notice 5 things you can see, 4 you can touch, 3 you can hear, 2 you can smell, and 1 you can taste. It gently brings your mind back to the present.";

    if (/\b(thank|thanks|thx|appreciate)\b/.test(t))
        return "You don't need to thank me — showing up for yourself like this is already brave. I'm glad I could be here for you. Is there anything else on your mind?";

    if (/\b(hello|hey|hi|good morning|good evening)\b/.test(t))
        return "Hey, I'm glad you stopped by. This is your space — no pressure, no judgment. How has your day been treating you?";

    if (/\b(vent|rant|talk|share|rough day|bad day|tough day)\b/.test(t))
        return "I'm all ears. Go ahead and let it out — this is a safe space. Sometimes just putting words to what you're feeling can lighten the load, even a little.";

    if (/\b(happy|great|good|amazing|wonderful|better)\b/.test(t))
        return "That's really wonderful to hear. What's been going well? Celebrating the good moments, even small ones, helps build resilience for the harder days.";

    if (/\b(afraid|fear|scared|terrified)\b/.test(t))
        return "Fear can feel paralyzing, but acknowledging it is already a step forward. You're here, and that takes courage. Can you tell me more about what's frightening you? Sometimes naming it helps shrink it.";

    if (/\b(self[- ]?harm|hurt myself|suicide|kill myself|end it)\b/.test(t))
        return "I'm really glad you told me. What you're feeling is serious, and you deserve real support from a trained professional. Please reach out to a crisis helpline — you can call or text 988 (Suicide & Crisis Lifeline) anytime, or text HOME to 741741. You matter more than you know.";

    // Fallback — gentle, open-ended
    return "I hear you. It sounds like there's a lot going on. Take your time — there's no rush here. What feels most important to talk about right now?";
}
