import { useState, useEffect, useRef, useCallback } from "react";
import Icon from "@/components/ui/icon";

const BANNER_URL =
  "https://cdn.poehali.dev/projects/1d9a2050-217f-4d55-bb71-bc10e4d3a90b/files/df199173-0b63-41a9-b736-33dc192548cd.jpg";

const LEADER_PASSWORD = "HORDE_LEADER_2024";
const CHAT_API = "https://functions.poehali.dev/444170fe-dc70-4101-8fb6-cb0a715663e2";

const RANKS = [
  { name: "Новобранец", icon: "⚔️", min: 0, color: "#9ca3af" },
  { name: "Воин", icon: "🛡️", min: 100, color: "#60a5fa" },
  { name: "Ветеран", icon: "🗡️", min: 500, color: "#34d399" },
  { name: "Элита", icon: "🔱", min: 1000, color: "#fbbf24" },
  { name: "Чемпион", icon: "👑", min: 5000, color: "#f87171" },
  { name: "Легенда", icon: "🌟", min: 10000, color: "#c084fc" },
];

const ACHIEVEMENTS = [
  { id: "first_join", icon: "🏆", name: "Первый шаг", desc: "Вступить в альянс" },
  { id: "chat_100", icon: "💬", name: "Говорун", desc: "Отправить 100 сообщений" },
  { id: "upload_file", icon: "📁", name: "Хранитель", desc: "Загрузить файл" },
  { id: "photo_10", icon: "📸", name: "Фотограф", desc: "Загрузить 10 скринов" },
  { id: "veteran", icon: "⚔️", name: "Ветеран Орды", desc: "Провести 30 дней в альянсе" },
  { id: "top_rank", icon: "👑", name: "Легенда", desc: "Достичь ранга Легенда" },
];

const INITIAL_MEMBERS = [
  { id: 1, name: "ВождьОрды", role: "leader", rank: 5, power: 25000, joinDate: "2024-01-15", achievements: ["first_join", "chat_100", "upload_file", "photo_10", "veteran", "top_rank"] },
  { id: 2, name: "ЧёрныйВолк", role: "officer", rank: 4, power: 8500, joinDate: "2024-02-01", achievements: ["first_join", "chat_100", "veteran"] },
  { id: 3, name: "СтальнойКулак", role: "officer", rank: 3, power: 3200, joinDate: "2024-02-20", achievements: ["first_join", "upload_file"] },
  { id: 4, name: "БурыйМедведь", role: "member", rank: 2, power: 750, joinDate: "2024-03-10", achievements: ["first_join"] },
  { id: 5, name: "ТёмныйЛис", role: "member", rank: 1, power: 320, joinDate: "2024-04-05", achievements: ["first_join"] },
];

type ChatMessage = { id: number; author: string; text: string; time: string; translated: Record<string, string> };

const INITIAL_RULES = `⚔️ ПРАВИЛА АЛЬЯНСА «ОРДА» ⚔️

1. АКТИВНОСТЬ
   • Минимум 1 вход в день во время войны
   • Уведомляй о своём отсутствии заранее
   • Участие в событиях альянса обязательно

2. ЧЕСТЬ И УВАЖЕНИЕ
   • Оскорбления запрещены — нарушителей исключаем
   • Помогай новобранцам — мы одна семья
   • Не атакуй союзников без разрешения

3. РЕСУРСЫ
   • Донат в казну альянса поощряется
   • Запрашивать помощь могут все
   • Распределение трофеев по рангу

4. ВОЙНА
   • Обязательное участие в войнах альянса
   • Атакуй только назначенные цели
   • Ждёшь приказа — не своевольничаешь

5. ПРОДВИЖЕНИЕ В РАНГАХ
   • Ранги даются за активность и победы
   • Офицеры назначаются главой лично
   • Неактивных понижают в звании

🔥 ОРДА ЕДИНА — ОРДА НЕПОБЕДИМА! 🔥`;

const LANGS: Record<string, string> = {
  "ru": "🇷🇺 Русский",
  "en": "🇬🇧 English",
  "de": "🇩🇪 Deutsch",
  "fr": "🇫🇷 Français",
  "es": "🇪🇸 Español",
  "zh": "🇨🇳 中文",
  "tr": "🇹🇷 Türkçe",
  "pt": "🇧🇷 Português",
  "ar": "🇸🇦 العربية",
  "uk": "🇺🇦 Українська",
};

const FAKE_TRANSLATIONS: Record<string, Record<string, string>> = {
  "en": {
    "Приветствую всех воинов! Орда непобедима! ⚔️": "Greetings all warriors! The Horde is invincible! ⚔️",
    "Готов к бою! Кто идёт на рейд?": "Ready for battle! Who's going on the raid?",
    "Я в деле! Сегодня захватим новые территории.": "I'm in! Today we conquer new territories.",
  },
  "de": {
    "Приветствую всех воинов! Орда непобедима! ⚔️": "Ich grüße alle Krieger! Die Horde ist unbesiegbar! ⚔️",
    "Готов к бою! Кто идёт на рейд?": "Kampfbereit! Wer geht auf den Überfall?",
    "Я в деле! Сегодня захватим новые территории.": "Ich bin dabei! Heute erobern wir neue Gebiete.",
  },
};

function getRankObj(rankIdx: number) {
  return RANKS[Math.min(rankIdx, RANKS.length - 1)];
}

function generateInviteLink() {
  return `${window.location.origin}?invite=HORDE_${Math.random().toString(36).substr(2, 8).toUpperCase()}`;
}

export default function Index() {
  const [page, setPage] = useState("home");
  const [members, setMembers] = useState(INITIAL_MEMBERS);
  const [chat, setChat] = useState<ChatMessage[]>([]);
  const [chatLoading, setChatLoading] = useState(true);
  const [chatSending, setChatSending] = useState(false);
  const [rules, setRules] = useState(INITIAL_RULES);
  const [chatInput, setChatInput] = useState("");
  const [chatLang, setChatLang] = useState("ru");
  const [isLeader, setIsLeader] = useState(false);
  const [leaderPassword, setLeaderPassword] = useState("");
  const [leaderLoginOpen, setLeaderLoginOpen] = useState(false);
  const [leaderError, setLeaderError] = useState(false);
  const [editingRules, setEditingRules] = useState(false);
  const [rulesInput, setRulesInput] = useState(rules);
  const [inviteLink, setInviteLink] = useState("");
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [joinModalOpen, setJoinModalOpen] = useState(false);
  const [joinSuccess, setJoinSuccess] = useState(false);
  const [playerName, setPlayerName] = useState("");
  const [playerNameSet, setPlayerNameSet] = useState(false);
  const [files, setFiles] = useState<{ name: string; size: string; date: string; type: string; url: string }[]>([]);
  const [gallery, setGallery] = useState<{ url: string; author: string; date: string; title: string }[]>([]);
  const [galleryTitle, setGalleryTitle] = useState("");
  const [selectedMember, setSelectedMember] = useState<number | null>(null);
  const [notification, setNotification] = useState<string | null>(null);
  const [welcomeShown, setWelcomeShown] = useState(false);
  const [messageTranslated, setMessageTranslated] = useState<Record<number, boolean>>({});
  const [editingName, setEditingName] = useState(false);
  const [newNameInput, setNewNameInput] = useState("");
  const [isOfficer, setIsOfficer] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("invite")) {
      setJoinModalOpen(true);
    }
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat]);

  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch(CHAT_API);
      const data = await res.json();
      setChat(data.messages.map((m: { id: number; author: string; text: string; time: string }) => ({ ...m, translated: {} })));
    } catch (e) { console.warn(e); }
    finally { setChatLoading(false); }
  }, []);

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, [fetchMessages]);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const playWelcome = () => {
    try {
      const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const notes = [261.63, 329.63, 392, 523.25, 659.25, 784];
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = "sine";
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.3, ctx.currentTime + i * 0.15);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.15 + 0.4);
        osc.start(ctx.currentTime + i * 0.15);
        osc.stop(ctx.currentTime + i * 0.15 + 0.4);
      });
    } catch (e) { console.warn(e); }
  };

  const handleJoin = () => {
    if (!playerName.trim()) return;
    playWelcome();
    setJoinSuccess(true);
    setPlayerNameSet(true);
    const newMember = {
      id: members.length + 1,
      name: playerName,
      role: "member",
      rank: 0,
      power: 0,
      joinDate: new Date().toISOString().split("T")[0],
      achievements: ["first_join"],
    };
    setMembers(prev => [...prev, newMember]);
    setTimeout(() => {
      setJoinModalOpen(false);
      setJoinSuccess(false);
      setWelcomeShown(true);
      showNotification("🔥 Добро пожаловать в Орду, " + playerName + "!");
    }, 3500);
  };

  const handleLeaderLogin = () => {
    if (leaderPassword === LEADER_PASSWORD) {
      setIsLeader(true);
      setIsOfficer(false);
      setLeaderLoginOpen(false);
      setLeaderError(false);
      setLeaderPassword("");
      showNotification("⚔️ Доступ Главы открыт!");
    } else {
      setLeaderError(true);
    }
  };

  const handleOfficerCheck = () => {
    if (!playerNameSet) return;
    const member = members.find(m => m.name === playerName && (m.role === "officer" || m.role === "leader"));
    if (member) {
      setIsOfficer(true);
      showNotification(`🛡️ Офицерский доступ активирован, ${playerName}!`);
    } else {
      showNotification("⛔ Ваш никнейм не найден среди офицеров");
    }
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim() || chatSending) return;
    const name = playerNameSet ? playerName : "Воин";
    const text = chatInput;
    setChatInput("");
    setChatSending(true);
    try {
      const res = await fetch(CHAT_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ author: name, text }),
      });
      const newMsg = await res.json();
      setChat(prev => [...prev, { ...newMsg, translated: {} }]);
    } catch (e) {
      console.warn(e);
      showNotification("⚠️ Ошибка отправки сообщения");
      setChatInput(text);
    } finally {
      setChatSending(false);
    }
  };

  const handleTranslate = (msgId: number) => {
    setMessageTranslated(prev => ({ ...prev, [msgId]: !prev[msgId] }));
  };

  const getTranslated = (text: string, lang: string) => {
    if (lang === "ru") return text;
    return FAKE_TRANSLATIONS[lang]?.[text] || `[${LANGS[lang]?.split(" ")[1] || lang}] ${text}`;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFiles(prev => [...prev, {
      name: f.name,
      size: (f.size / 1024).toFixed(1) + " KB",
      date: new Date().toLocaleDateString("ru-RU"),
      type: f.type.split("/")[0],
      url: URL.createObjectURL(f),
    }]);
    showNotification("📁 Файл загружен: " + f.name);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleGalleryUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const url = URL.createObjectURL(f);
    setGallery(prev => [...prev, {
      url,
      author: playerNameSet ? playerName : "Воин",
      date: new Date().toLocaleDateString("ru-RU"),
      title: galleryTitle || f.name,
    }]);
    setGalleryTitle("");
    showNotification("📸 Скрин добавлен в галерею!");
    if (galleryInputRef.current) galleryInputRef.current.value = "";
  };

  const handleSetOfficer = (id: number) => {
    const m = members.find(m => m.id === id);
    setMembers(prev => prev.map(mem =>
      mem.id === id ? { ...mem, role: mem.role === "officer" ? "member" : "officer" } : mem
    ));
    showNotification(m?.role === "officer" ? `${m?.name} разжалован` : `${m?.name} назначен Офицером`);
  };

  const handleKickMember = (id: number) => {
    const m = members.find(m => m.id === id);
    setMembers(prev => prev.filter(mem => mem.id !== id));
    setSelectedMember(null);
    showNotification(`${m?.name} исключён из Орды`);
  };

  const handleRankChange = (id: number, delta: number) => {
    setMembers(prev => prev.map(m =>
      m.id === id ? { ...m, rank: Math.max(0, Math.min(5, m.rank + delta)) } : m
    ));
  };

  const handleCopyInvite = () => {
    const link = generateInviteLink();
    setInviteLink(link);
    navigator.clipboard.writeText(link).then(() => showNotification("🔗 Ссылка скопирована в буфер!"));
  };

  const handleDeleteMessage = async (id: number) => {
    setChat(prev => prev.filter(m => m.id !== id));
    try {
      await fetch(`${CHAT_API}?id=${id}`, { method: "DELETE" });
    } catch (e) { console.warn(e); }
  };

  const canModerateChat = isLeader || isOfficer;

  const handleSaveName = () => {
    const trimmed = newNameInput.trim();
    if (!trimmed || trimmed.length < 2) return;
    setPlayerName(trimmed);
    setPlayerNameSet(true);
    setEditingName(false);
    setNewNameInput("");
    showNotification(`✅ Имя изменено на «${trimmed}»`);
  };

  const roleLabel = (role: string) => {
    if (role === "leader") return { label: "Глава", color: "text-amber-400" };
    if (role === "officer") return { label: "Офицер", color: "text-purple-400" };
    return { label: "Воин", color: "text-gray-400" };
  };

  const navItems = [
    { id: "home", label: "Главная", icon: "Home" },
    { id: "chat", label: "Чат", icon: "MessageSquare" },
    { id: "members", label: "Участники", icon: "Users" },
    { id: "files", label: "Файлы", icon: "FolderOpen" },
    { id: "rules", label: "Правила", icon: "ScrollText" },
    { id: "officers", label: "Офицеры", icon: "Shield" },
    { id: "gallery", label: "Галерея", icon: "Image" },
  ];

  return (
    <div className="min-h-screen bg-horde-bg font-orb text-horde-text">

      {/* Notification */}
      {notification && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-horde-accent text-black font-bold px-6 py-3 rounded-full shadow-glow animate-fade-in text-sm whitespace-nowrap">
          {notification}
        </div>
      )}

      {/* Join Modal */}
      {joinModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm">
          <div className="bg-horde-card border-2 border-horde-accent rounded-2xl p-8 max-w-sm w-full mx-4 text-center shadow-glow animate-scale-in">
            {!joinSuccess ? (
              <>
                <div className="text-6xl mb-4">⚔️</div>
                <h2 className="text-2xl font-black text-horde-accent mb-2 uppercase tracking-widest">Орда зовёт!</h2>
                <p className="text-gray-300 mb-2 text-sm">Тебя приглашают вступить в альянс</p>
                <p className="text-horde-accent font-black text-xl mb-5">«ОРДА»</p>
                <p className="text-gray-500 text-xs mb-4">Puzzles & Conquest</p>
                <input
                  className="w-full bg-horde-bg border border-horde-border rounded-xl px-4 py-3 mb-4 text-center text-horde-text placeholder-gray-600 outline-none focus:border-horde-accent transition-colors"
                  placeholder="Введи своё игровое имя..."
                  value={playerName}
                  onChange={e => setPlayerName(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleJoin()}
                />
                <div className="flex gap-3">
                  <button
                    onClick={handleJoin}
                    className="flex-1 bg-horde-accent text-black font-black py-3 rounded-xl hover:scale-105 transition-transform uppercase tracking-wider text-sm"
                  >
                    🔥 Вступить!
                  </button>
                  <button
                    onClick={() => setJoinModalOpen(false)}
                    className="flex-1 bg-horde-border/60 text-gray-300 font-bold py-3 rounded-xl hover:bg-gray-600 transition-colors text-sm"
                  >
                    Отказаться
                  </button>
                </div>
              </>
            ) : (
              <div className="animate-fade-in py-4">
                <div className="text-7xl mb-4 animate-bounce">🏆</div>
                <h2 className="text-3xl font-black text-horde-accent mb-3 uppercase tracking-widest">
                  Добро пожаловать<br />в Орду!
                </h2>
                <p className="text-gray-300 text-lg">Воин <span className="text-white font-black">{playerName}</span></p>
                <p className="text-gray-500 text-sm mt-1">присоединился к альянсу!</p>
                <div className="mt-5 text-3xl tracking-widest">⚔️ 🔥 🛡️</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Leader Login Modal */}
      {leaderLoginOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm">
          <div className="bg-horde-card border-2 border-purple-500 rounded-2xl p-8 max-w-sm w-full mx-4 shadow-glow-purple animate-scale-in">
            <div className="text-center mb-6">
              <div className="text-5xl mb-3">👑</div>
              <h2 className="text-xl font-black text-purple-400 uppercase tracking-widest">Вход для Главы</h2>
              <p className="text-gray-500 text-xs mt-1">Специальный доступ</p>
            </div>
            <input
              type="password"
              className="w-full bg-horde-bg border border-purple-600 rounded-xl px-4 py-3 mb-3 text-horde-text placeholder-gray-600 outline-none focus:border-purple-400 transition-colors"
              placeholder="Секретный пароль..."
              value={leaderPassword}
              onChange={e => { setLeaderPassword(e.target.value); setLeaderError(false); }}
              onKeyDown={e => e.key === "Enter" && handleLeaderLogin()}
            />
            {leaderError && <p className="text-red-400 text-sm mb-3 text-center">❌ Неверный пароль</p>}
            <div className="flex gap-3">
              <button onClick={handleLeaderLogin} className="flex-1 bg-purple-600 text-white font-black py-2.5 rounded-xl hover:bg-purple-500 transition-colors">
                Войти
              </button>
              <button onClick={() => { setLeaderLoginOpen(false); setLeaderError(false); setLeaderPassword(""); }} className="flex-1 bg-horde-border/60 text-gray-300 font-bold py-2.5 rounded-xl hover:bg-gray-600 transition-colors">
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="relative overflow-hidden h-56 md:h-72">
        <img src={BANNER_URL} alt="Орда баннер" className="absolute inset-0 w-full h-full object-cover opacity-55" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-horde-bg/30 to-horde-bg" />
        <div className="relative z-10 flex flex-col items-center justify-center h-full">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-4xl drop-shadow-lg">⚔️</span>
            <h1 className="text-5xl md:text-7xl font-black text-horde-accent tracking-widest uppercase" style={{ textShadow: "0 0 30px #e85c0d, 0 0 60px #e85c0d80, 0 2px 4px rgba(0,0,0,0.8)" }}>
              ОРДА
            </h1>
            <span className="text-4xl drop-shadow-lg">🔥</span>
          </div>
          <p className="text-gray-300 text-sm md:text-base tracking-widest uppercase opacity-80 font-semibold">
            Альянс · Puzzles & Conquest
          </p>
          <div className="flex gap-4 mt-3 text-sm">
            <span className="text-horde-accent font-bold">{members.length} воинов</span>
            <span className="text-gray-600">|</span>
            <span className="text-gray-400">Активный альянс</span>
            <span className="text-gray-600">|</span>
            <span className="text-green-400 font-semibold">● Онлайн</span>
          </div>
        </div>
        <div className="absolute top-3 right-3 flex gap-2 z-20">
          {!isLeader ? (
            <button
              onClick={() => setLeaderLoginOpen(true)}
              className="bg-black/60 border border-purple-500/70 text-purple-400 text-xs px-3 py-1.5 rounded-full hover:bg-purple-900/40 transition-colors flex items-center gap-1 font-semibold"
            >
              👑 Глава
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <span className="bg-purple-900/80 border border-purple-400 text-purple-300 text-xs px-3 py-1.5 rounded-full flex items-center gap-1 font-semibold">
                👑 Режим Главы активен
              </span>
              <button onClick={() => setIsLeader(false)} className="bg-black/60 text-gray-400 text-xs px-2 py-1.5 rounded-full border border-gray-600 hover:border-red-500 hover:text-red-400 transition-colors">
                Выйти
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Nav */}
      <nav className="sticky top-0 z-30 bg-horde-bg/97 backdrop-blur-md border-b border-horde-border">
        <div className="flex overflow-x-auto gap-1 px-3 py-2 max-w-5xl mx-auto scrollbar-hide">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => setPage(item.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all flex-shrink-0 ${page === item.id
                ? "bg-horde-accent text-black"
                : "text-gray-400 hover:text-horde-text hover:bg-horde-card"
                }`}
            >
              <Icon name={item.icon} size={14} />
              {item.label}
            </button>
          ))}
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-5xl mx-auto px-4 py-6">

        {/* HOME */}
        {page === "home" && (
          <div className="space-y-6 animate-fade-in">
            {welcomeShown && (
              <div className="bg-horde-accent/10 border border-horde-accent rounded-2xl p-4 text-center">
                <p className="text-horde-accent font-bold">🔥 Добро пожаловать в Орду, <span className="text-white">{playerName}</span>! Ты теперь воин!</p>
              </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Участников", value: members.length, icon: "Users", color: "text-blue-400" },
                { label: "Офицеров", value: members.filter(m => m.role === "officer").length, icon: "Shield", color: "text-purple-400" },
                { label: "Сообщений", value: chat.length, icon: "MessageSquare", color: "text-green-400" },
                { label: "Файлов", value: files.length, icon: "FolderOpen", color: "text-amber-400" },
              ].map(s => (
                <div key={s.label} className="bg-horde-card border border-horde-border rounded-2xl p-4 text-center hover:border-horde-accent transition-colors cursor-pointer" onClick={() => setPage(s.label === "Участников" ? "members" : s.label === "Офицеров" ? "officers" : s.label === "Сообщений" ? "chat" : "files")}>
                  <Icon name={s.icon} size={20} className={`mx-auto mb-2 ${s.color}`} />
                  <div className={`text-3xl font-black ${s.color}`}>{s.value}</div>
                  <div className="text-gray-500 text-xs mt-1">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Invite */}
            <div className="bg-horde-card border border-horde-border rounded-2xl p-5">
              <h3 className="text-horde-accent font-black text-base uppercase tracking-wider mb-1 flex items-center gap-2">
                <Icon name="Link" size={16} /> Пригласить воина
              </h3>
              <p className="text-gray-500 text-xs mb-4">Поделись ссылкой — новый воин сможет вступить в Орду</p>
              <div className="flex gap-2">
                <input
                  readOnly
                  value={inviteLink || "Нажми кнопку чтобы сгенерировать ссылку..."}
                  className="flex-1 bg-horde-bg border border-horde-border rounded-xl px-4 py-2.5 text-sm text-gray-400 outline-none"
                />
                <button
                  onClick={handleCopyInvite}
                  className="bg-horde-accent text-black font-bold px-4 py-2.5 rounded-xl hover:scale-105 transition-transform text-sm whitespace-nowrap flex items-center gap-2"
                >
                  <Icon name="Copy" size={14} /> Скопировать
                </button>
              </div>
            </div>

            {/* Ranks */}
            <div className="bg-horde-card border border-horde-border rounded-2xl p-5">
              <h3 className="text-horde-accent font-black text-base uppercase tracking-wider mb-4 flex items-center gap-2">
                <span>🏅</span> Система рангов
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {RANKS.map(r => (
                  <div key={r.name} className="flex items-center gap-3 bg-horde-bg border border-horde-border rounded-xl p-3 hover:border-gray-500 transition-colors">
                    <span className="text-2xl">{r.icon}</span>
                    <div>
                      <div className="font-bold text-sm" style={{ color: r.color }}>{r.name}</div>
                      <div className="text-xs text-gray-600">{r.min > 0 ? `от ${r.min.toLocaleString()} силы` : "Начальный ранг"}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Achievements */}
            <div className="bg-horde-card border border-horde-border rounded-2xl p-5">
              <h3 className="text-horde-accent font-black text-base uppercase tracking-wider mb-4 flex items-center gap-2">
                <span>🏆</span> Достижения
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {ACHIEVEMENTS.map(a => (
                  <div key={a.id} className="flex items-center gap-3 bg-horde-bg border border-horde-border rounded-xl p-3">
                    <span className="text-2xl">{a.icon}</span>
                    <div>
                      <div className="font-bold text-sm text-gray-200">{a.name}</div>
                      <div className="text-xs text-gray-600">{a.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* CHAT */}
        {page === "chat" && (
          <div className="animate-fade-in flex flex-col" style={{ height: "70vh" }}>
            <div className="flex items-center justify-between mb-3 flex-shrink-0">
              <h2 className="text-horde-accent font-black text-xl uppercase tracking-wider flex items-center gap-2">
                <Icon name="MessageSquare" size={20} /> Чат Орды
              </h2>
              <div className="flex items-center gap-2">
                <Icon name="Globe" size={14} className="text-gray-500" />
                <select
                  value={chatLang}
                  onChange={e => setChatLang(e.target.value)}
                  className="bg-horde-card border border-horde-border text-sm rounded-xl px-3 py-1.5 text-gray-300 outline-none cursor-pointer"
                >
                  {Object.entries(LANGS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto space-y-3 bg-horde-card border border-horde-border rounded-2xl p-4 mb-3 min-h-0">
              {chatLoading && (
                <div className="flex items-center justify-center h-full text-gray-500 gap-2">
                  <Icon name="Loader" size={16} className="animate-spin" />
                  <span className="text-sm">Загрузка чата...</span>
                </div>
              )}
              {!chatLoading && chat.length === 0 && (
                <div className="flex items-center justify-center h-full text-gray-600 text-sm">
                  Пока нет сообщений. Напишите первым! ⚔️
                </div>
              )}
              {chat.map(msg => {
                const showTranslated = messageTranslated[msg.id] && chatLang !== "ru";
                return (
                  <div key={msg.id} className="flex gap-3 group">
                    <div className="w-9 h-9 rounded-full bg-horde-accent/15 flex items-center justify-center text-sm font-black text-horde-accent flex-shrink-0 border border-horde-accent/30">
                      {msg.author[0]?.toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-bold text-sm text-gray-200">{msg.author}</span>
                        <span className="text-xs text-gray-600">{msg.time}</span>
                        {chatLang !== "ru" && (
                          <button
                            onClick={() => handleTranslate(msg.id)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
                          >
                            <Icon name="Globe" size={11} />
                            {showTranslated ? "Оригинал" : "Перевести"}
                          </button>
                        )}
                        {canModerateChat && (
                          <button
                            onClick={() => handleDeleteMessage(msg.id)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity ml-auto text-red-500 hover:text-red-400 flex items-center gap-1 text-xs"
                            title="Удалить сообщение"
                          >
                            <Icon name="Trash2" size={13} />
                          </button>
                        )}
                      </div>
                      <p className="text-gray-300 text-sm break-words">
                        {showTranslated ? getTranslated(msg.text, chatLang) : msg.text}
                      </p>
                      {showTranslated && <p className="text-xs text-gray-700 mt-0.5">Перевод: {LANGS[chatLang]}</p>}
                    </div>
                  </div>
                );
              })}
              <div ref={chatEndRef} />
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <input
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSendMessage()}
                placeholder={playerNameSet ? `Пишет ${playerName}...` : "Напиши сообщение..."}
                className="flex-1 bg-horde-card border border-horde-border rounded-xl px-4 py-3 text-horde-text placeholder-gray-600 outline-none focus:border-horde-accent transition-colors text-sm"
              />
              <button
                onClick={handleSendMessage}
                disabled={chatSending}
                className="bg-horde-accent text-black font-bold px-4 py-3 rounded-xl hover:scale-105 transition-transform disabled:opacity-50 disabled:scale-100"
              >
                <Icon name={chatSending ? "Loader" : "Send"} size={18} className={chatSending ? "animate-spin" : ""} />
              </button>
            </div>
            {chatLang !== "ru" && (
              <p className="text-xs text-gray-700 mt-1.5 text-center">
                Наведи на сообщение → кнопка «Перевести» на {LANGS[chatLang]}
              </p>
            )}

            {/* Name edit & officer access */}
            <div className="flex items-center gap-2 mt-1 flex-shrink-0 flex-wrap">
              {!editingName ? (
                <button
                  onClick={() => { setEditingName(true); setNewNameInput(playerNameSet ? playerName : ""); }}
                  className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 transition-colors border border-horde-border rounded-lg px-3 py-1.5"
                >
                  <Icon name="Pencil" size={12} />
                  {playerNameSet ? `Имя: ${playerName}` : "Установить имя"}
                </button>
              ) : (
                <div className="flex items-center gap-1.5">
                  <input
                    autoFocus
                    value={newNameInput}
                    onChange={e => setNewNameInput(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") handleSaveName(); if (e.key === "Escape") setEditingName(false); }}
                    placeholder="Новое имя..."
                    maxLength={30}
                    className="bg-horde-bg border border-horde-accent rounded-lg px-3 py-1.5 text-xs text-horde-text placeholder-gray-600 outline-none w-36"
                  />
                  <button onClick={handleSaveName} className="bg-horde-accent text-black text-xs font-bold px-2.5 py-1.5 rounded-lg hover:scale-105 transition-transform">
                    ОК
                  </button>
                  <button onClick={() => setEditingName(false)} className="text-gray-500 hover:text-white text-xs px-2 py-1.5 transition-colors">
                    ✕
                  </button>
                </div>
              )}
              {!isLeader && !isOfficer && playerNameSet && (
                <button
                  onClick={handleOfficerCheck}
                  className="flex items-center gap-1.5 text-xs text-purple-500 hover:text-purple-300 transition-colors border border-purple-800/50 rounded-lg px-3 py-1.5"
                >
                  <Icon name="Shield" size={12} />
                  Офицерский доступ
                </button>
              )}
              {isOfficer && !isLeader && (
                <span className="flex items-center gap-1.5 text-xs text-purple-400 border border-purple-600/40 rounded-lg px-3 py-1.5">
                  <Icon name="Shield" size={12} />
                  Офицер
                </span>
              )}
            </div>
          </div>
        )}

        {/* MEMBERS */}
        {page === "members" && (
          <div className="animate-fade-in space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-horde-accent font-black text-xl uppercase tracking-wider flex items-center gap-2">
                <Icon name="Users" size={20} /> Воины Орды
              </h2>
              <button
                onClick={() => { setInviteModalOpen(true); handleCopyInvite(); }}
                className="bg-horde-accent text-black text-sm font-bold px-4 py-2 rounded-xl hover:scale-105 transition-transform flex items-center gap-2"
              >
                <Icon name="UserPlus" size={15} /> Добавить воина
              </button>
            </div>

            {inviteModalOpen && (
              <div className="bg-horde-card border border-horde-accent rounded-2xl p-4 animate-fade-in">
                <p className="text-sm text-gray-300 mb-2 font-semibold">🔗 Ссылка для вступления (скопирована в буфер):</p>
                <div className="flex gap-2">
                  <input readOnly value={inviteLink} className="flex-1 bg-horde-bg border border-horde-border rounded-xl px-3 py-2 text-sm text-gray-400 outline-none" />
                  <button onClick={handleCopyInvite} className="bg-horde-accent text-black text-sm font-bold px-3 py-2 rounded-xl hover:scale-105 transition-transform">
                    Скопировать
                  </button>
                  <button onClick={() => setInviteModalOpen(false)} className="text-gray-500 hover:text-white px-2 transition-colors">✕</button>
                </div>
                <p className="text-xs text-gray-600 mt-2">Отправь эту ссылку игроку — он увидит приглашение вступить в Орду</p>
              </div>
            )}

            <div className="space-y-2">
              {members.map(m => {
                const rank = getRankObj(m.rank);
                const role = roleLabel(m.role);
                return (
                  <div
                    key={m.id}
                    onClick={() => setSelectedMember(selectedMember === m.id ? null : m.id)}
                    className={`bg-horde-card border rounded-2xl p-4 cursor-pointer transition-all ${selectedMember === m.id ? "border-horde-accent shadow-glow-sm" : "border-horde-border hover:border-gray-500"}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-full flex items-center justify-center text-xl flex-shrink-0 border-2" style={{ borderColor: rank.color + "60", backgroundColor: rank.color + "15" }}>
                        {rank.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-black text-gray-100">{m.name}</span>
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full bg-black/30 ${role.color}`}>{role.label}</span>
                          <span className="text-xs font-semibold" style={{ color: rank.color }}>{rank.icon} {rank.name}</span>
                        </div>
                        <div className="flex items-center gap-3 mt-0.5">
                          <span className="text-xs text-gray-500">⚡ {m.power.toLocaleString()} силы</span>
                          <span className="text-xs text-gray-600">с {m.joinDate}</span>
                        </div>
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        {m.achievements.slice(0, 3).map(achId => {
                          const ach = ACHIEVEMENTS.find(a => a.id === achId);
                          return ach ? <span key={achId} title={ach.name} className="text-base">{ach.icon}</span> : null;
                        })}
                        {m.achievements.length > 3 && <span className="text-xs text-gray-600">+{m.achievements.length - 3}</span>}
                      </div>
                    </div>

                    {selectedMember === m.id && (
                      <div className="mt-4 pt-4 border-t border-horde-border animate-fade-in">
                        <div className="flex flex-wrap gap-1.5 mb-3">
                          <span className="text-xs text-gray-500 mr-1">Достижения:</span>
                          {m.achievements.map(achId => {
                            const ach = ACHIEVEMENTS.find(a => a.id === achId);
                            return ach ? (
                              <span key={achId} className="bg-horde-bg border border-horde-border text-xs px-2 py-0.5 rounded-full text-gray-300">
                                {ach.icon} {ach.name}
                              </span>
                            ) : null;
                          })}
                        </div>
                        {isLeader && m.role !== "leader" && (
                          <div className="flex flex-wrap gap-2">
                            <button
                              onClick={e => { e.stopPropagation(); handleSetOfficer(m.id); }}
                              className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-colors ${m.role === "officer" ? "bg-gray-700 text-gray-200 hover:bg-gray-600" : "bg-purple-700 text-white hover:bg-purple-600"}`}
                            >
                              {m.role === "officer" ? "🔻 Разжаловать" : "⬆️ Назначить офицером"}
                            </button>
                            <button
                              onClick={e => { e.stopPropagation(); handleRankChange(m.id, 1); }}
                              className="text-xs font-bold px-3 py-1.5 rounded-xl bg-green-900 text-green-300 hover:bg-green-800 transition-colors"
                            >
                              ⬆️ Ранг +1
                            </button>
                            <button
                              onClick={e => { e.stopPropagation(); handleRankChange(m.id, -1); }}
                              className="text-xs font-bold px-3 py-1.5 rounded-xl bg-yellow-900 text-yellow-300 hover:bg-yellow-800 transition-colors"
                            >
                              ⬇️ Ранг −1
                            </button>
                            <button
                              onClick={e => { e.stopPropagation(); handleKickMember(m.id); }}
                              className="text-xs font-bold px-3 py-1.5 rounded-xl bg-red-900/80 text-red-300 hover:bg-red-800 transition-colors"
                            >
                              🚫 Исключить
                            </button>
                          </div>
                        )}
                        {!isLeader && (
                          <p className="text-xs text-gray-700">Войдите как Глава чтобы управлять участниками</p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* FILES */}
        {page === "files" && (
          <div className="animate-fade-in space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-horde-accent font-black text-xl uppercase tracking-wider flex items-center gap-2">
                <Icon name="FolderOpen" size={20} /> Файлы Орды
              </h2>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="bg-horde-accent text-black text-sm font-bold px-4 py-2 rounded-xl hover:scale-105 transition-transform flex items-center gap-2"
              >
                <Icon name="Upload" size={15} /> Загрузить файл
              </button>
            </div>
            <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileUpload} />
            {files.length === 0 ? (
              <div
                className="bg-horde-card border-2 border-dashed border-horde-border rounded-2xl p-12 text-center cursor-pointer hover:border-horde-accent transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="text-5xl mb-3 opacity-30">📂</div>
                <p className="text-gray-500 mb-1">Нет загруженных файлов</p>
                <p className="text-horde-accent text-sm">Нажми чтобы загрузить первый файл</p>
              </div>
            ) : (
              <div className="space-y-2">
                {files.map((f, i) => (
                  <div key={i} className="bg-horde-card border border-horde-border rounded-2xl p-4 flex items-center gap-3 hover:border-horde-accent transition-colors">
                    <div className="text-2xl flex-shrink-0">
                      {f.type === "image" ? "🖼️" : f.type === "video" ? "🎬" : f.type === "audio" ? "🎵" : "📄"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-gray-200 text-sm truncate">{f.name}</div>
                      <div className="text-xs text-gray-500">{f.size} · {f.date}</div>
                    </div>
                    <a
                      href={f.url}
                      download={f.name}
                      className="flex-shrink-0 bg-horde-bg border border-horde-border text-gray-400 text-xs px-3 py-1.5 rounded-xl hover:text-horde-accent hover:border-horde-accent transition-colors"
                      onClick={e => e.stopPropagation()}
                    >
                      <Icon name="Download" size={12} className="inline mr-1" />
                      Скачать
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* RULES */}
        {page === "rules" && (
          <div className="animate-fade-in space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-horde-accent font-black text-xl uppercase tracking-wider flex items-center gap-2">
                <Icon name="ScrollText" size={20} /> Правила Орды
              </h2>
              {isLeader && !editingRules && (
                <button
                  onClick={() => { setEditingRules(true); setRulesInput(rules); }}
                  className="bg-purple-700 text-white text-sm font-bold px-4 py-2 rounded-xl hover:bg-purple-600 transition-colors flex items-center gap-2"
                >
                  <Icon name="Pencil" size={15} /> Редактировать
                </button>
              )}
              {!isLeader && (
                <button onClick={() => setLeaderLoginOpen(true)} className="text-xs text-gray-600 hover:text-purple-400 transition-colors">
                  👑 Войти как Глава
                </button>
              )}
            </div>
            {!editingRules ? (
              <div className="bg-horde-card border border-horde-border rounded-2xl p-6">
                <pre className="text-gray-300 text-sm whitespace-pre-wrap font-orb leading-relaxed">{rules}</pre>
              </div>
            ) : (
              <div className="space-y-3 animate-fade-in">
                <textarea
                  value={rulesInput}
                  onChange={e => setRulesInput(e.target.value)}
                  rows={20}
                  className="w-full bg-horde-card border border-purple-500 rounded-2xl p-5 text-gray-300 text-sm outline-none focus:border-purple-300 resize-none font-orb leading-relaxed transition-colors"
                />
                <div className="flex gap-3">
                  <button
                    onClick={() => { setRules(rulesInput); setEditingRules(false); showNotification("📜 Правила обновлены!"); }}
                    className="bg-horde-accent text-black font-black px-6 py-2.5 rounded-xl hover:scale-105 transition-transform"
                  >
                    ✅ Сохранить
                  </button>
                  <button
                    onClick={() => setEditingRules(false)}
                    className="bg-horde-border/60 text-gray-300 font-bold px-6 py-2.5 rounded-xl hover:bg-gray-700 transition-colors"
                  >
                    Отмена
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* OFFICERS */}
        {page === "officers" && (
          <div className="animate-fade-in space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-horde-accent font-black text-xl uppercase tracking-wider flex items-center gap-2">
                <Icon name="Shield" size={20} /> Офицеры Орды
              </h2>
              {!isLeader && (
                <button
                  onClick={() => setLeaderLoginOpen(true)}
                  className="bg-purple-900/50 border border-purple-500/70 text-purple-400 text-sm font-bold px-4 py-2 rounded-xl hover:bg-purple-900/80 transition-colors flex items-center gap-2"
                >
                  👑 Войти как Глава
                </button>
              )}
            </div>

            {/* Leader card */}
            {members.filter(m => m.role === "leader").map(m => {
              const rank = getRankObj(m.rank);
              return (
                <div key={m.id} className="bg-gradient-to-r from-amber-900/40 to-horde-card border-2 border-amber-500/70 rounded-2xl p-5">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-amber-500/20 flex items-center justify-center text-3xl border-2 border-amber-500/50">👑</div>
                    <div>
                      <div className="text-amber-400 font-black text-xl">{m.name}</div>
                      <div className="text-amber-600/80 text-sm font-semibold">Глава альянса</div>
                      <div className="text-gray-400 text-xs mt-0.5">⚡ {m.power.toLocaleString()} силы · {rank.icon} {rank.name}</div>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Officers */}
            <div className="space-y-2">
              {members.filter(m => m.role === "officer").map(m => {
                const rank = getRankObj(m.rank);
                return (
                  <div key={m.id} className="bg-gradient-to-r from-purple-900/20 to-horde-card border border-purple-600/60 rounded-2xl p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center text-xl border border-purple-500/40">🛡️</div>
                    <div className="flex-1">
                      <div className="text-purple-300 font-bold">{m.name}</div>
                      <div className="text-gray-500 text-xs">⚡ {m.power.toLocaleString()} силы · {rank.icon} {rank.name}</div>
                    </div>
                    {isLeader && (
                      <button
                        onClick={() => handleSetOfficer(m.id)}
                        className="text-xs bg-gray-800 text-gray-400 px-3 py-1.5 rounded-xl hover:bg-gray-700 hover:text-red-400 transition-colors"
                      >
                        Разжаловать
                      </button>
                    )}
                  </div>
                );
              })}
              {members.filter(m => m.role === "officer").length === 0 && (
                <div className="text-center text-gray-600 py-8 bg-horde-card border border-horde-border rounded-2xl">
                  Нет назначенных офицеров
                </div>
              )}
            </div>

            {/* Assign from members */}
            {isLeader && members.filter(m => m.role === "member").length > 0 && (
              <div className="bg-horde-card border border-purple-800/50 rounded-2xl p-5">
                <h3 className="text-purple-400 font-black mb-4 flex items-center gap-2">
                  <Icon name="UserCheck" size={16} /> Назначить офицера из воинов
                </h3>
                <div className="space-y-2">
                  {members.filter(m => m.role === "member").map(m => {
                    const rank = getRankObj(m.rank);
                    return (
                      <div key={m.id} className="flex items-center justify-between bg-horde-bg rounded-xl p-3">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{rank.icon}</span>
                          <div>
                            <span className="text-gray-200 font-semibold text-sm">{m.name}</span>
                            <div className="text-xs text-gray-600">⚡ {m.power.toLocaleString()} силы</div>
                          </div>
                        </div>
                        <button
                          onClick={() => handleSetOfficer(m.id)}
                          className="text-xs bg-purple-700 text-white font-bold px-3 py-1.5 rounded-xl hover:bg-purple-600 transition-colors"
                        >
                          ⬆️ Назначить
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* GALLERY */}
        {page === "gallery" && (
          <div className="animate-fade-in space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-horde-accent font-black text-xl uppercase tracking-wider flex items-center gap-2">
                <Icon name="Image" size={20} /> Галерея Орды
              </h2>
              <button
                onClick={() => galleryInputRef.current?.click()}
                className="bg-horde-accent text-black text-sm font-bold px-4 py-2 rounded-xl hover:scale-105 transition-transform flex items-center gap-2"
              >
                <Icon name="Plus" size={15} /> Добавить скрин
              </button>
            </div>
            <input ref={galleryInputRef} type="file" accept="image/*" className="hidden" onChange={handleGalleryUpload} />
            <div className="flex gap-2">
              <input
                value={galleryTitle}
                onChange={e => setGalleryTitle(e.target.value)}
                placeholder="Название скрина (необязательно)..."
                className="flex-1 bg-horde-card border border-horde-border rounded-xl px-4 py-2.5 text-sm text-horde-text placeholder-gray-600 outline-none focus:border-horde-accent transition-colors"
              />
            </div>
            {gallery.length === 0 ? (
              <div
                className="bg-horde-card border-2 border-dashed border-horde-border rounded-2xl p-12 text-center cursor-pointer hover:border-horde-accent transition-colors"
                onClick={() => galleryInputRef.current?.click()}
              >
                <div className="text-5xl mb-3 opacity-30">📸</div>
                <p className="text-gray-500 mb-1">Нет скринов в галерее</p>
                <p className="text-horde-accent text-sm">Нажми чтобы загрузить первый скрин</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {gallery.map((img, i) => (
                  <div key={i} className="bg-horde-card border border-horde-border rounded-2xl overflow-hidden group hover:border-horde-accent transition-colors cursor-pointer">
                    <div className="aspect-video bg-horde-bg overflow-hidden">
                      <img src={img.url} alt={img.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    </div>
                    <div className="p-2.5">
                      <div className="font-semibold text-xs text-gray-200 truncate">{img.title}</div>
                      <div className="text-xs text-gray-600">{img.author} · {img.date}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="text-center py-6 text-gray-700 text-xs mt-8 border-t border-horde-border">
        ⚔️ ОРДА · Альянс Puzzles & Conquest · {new Date().getFullYear()}
      </footer>
    </div>
  );
}