let cachedVoices: SpeechSynthesisVoice[] = [];
let isLoaded = false;
let currentAudio: HTMLAudioElement | null = null; // 追踪当前正在播放的 HTML5 Audio 对象

/**
 * 尽早预加载 TTS 语音
 */
export const preloadVoices = () => {
  const synth = window.speechSynthesis;
  const updateVoices = () => {
    const voices = synth.getVoices();
    if (voices.length > 0) {
      cachedVoices = voices;
      isLoaded = true;
    }
  };
  updateVoices();
  if (synth.onvoiceschanged !== undefined) {
    synth.onvoiceschanged = updateVoices;
  }
};

/**
 * 停止所有当前正在播放的音频（包括 TTS 和全局追踪的 HTML5 Audio）
 * 并广播全局信号停止其他本地媒体组件（如视频标签）
 */
export const stopAudio = () => {
  // 1. 停止系统 TTS
  const synth = window.speechSynthesis;
  synth.cancel();
  
  // 2. 停止全局追踪的 HTML5 Audio
  if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0; // 重置进度
      currentAudio = null;
  }

  // 3. 分发全局信号，通知视频、歌曲等本地媒体组件停止播放
  window.dispatchEvent(new CustomEvent('reword:stop-media'));
};

export const unlockAudio = () => {
    const synth = window.speechSynthesis;
    if (synth.paused) synth.resume();
    const u = new SpeechSynthesisUtterance('');
    u.volume = 0; u.rate = 10; u.text = ' '; 
    synth.speak(u);
};

const waitForVoices = (): Promise<SpeechSynthesisVoice[]> => {
  if (isLoaded && cachedVoices.length > 0) return Promise.resolve(cachedVoices);
  return new Promise((resolve) => {
    const synth = window.speechSynthesis;
    const v = synth.getVoices();
    if (v.length > 0) { cachedVoices = v; isLoaded = true; resolve(v); return; }
    const handler = () => {
      const v = synth.getVoices();
      if (v.length > 0) { cachedVoices = v; isLoaded = true; synth.removeEventListener('voiceschanged', handler); resolve(v); }
    };
    synth.addEventListener('voiceschanged', handler);
    setTimeout(() => { synth.removeEventListener('voiceschanged', handler); resolve(synth.getVoices()); }, 2000);
  });
};

/**
 * 播放任意 URL 音频并返回 Promise
 * 播放前会自动调用 stopAudio()
 */
export const playUrl = (url: string, playbackRate: number = 1.0): Promise<void> => {
    stopAudio(); // 停止所有冲突音频

    return new Promise((resolve, reject) => {
        const audio = new Audio(url);
        currentAudio = audio; // 注册为当前播放音频
        
        audio.playbackRate = playbackRate;
        
        audio.onended = () => {
            if (currentAudio === audio) currentAudio = null;
            resolve();
        };
        
        audio.onerror = (e) => {
            if (currentAudio === audio) currentAudio = null;
            reject(e);
        };
        
        const playPromise = audio.play();
        if (playPromise !== undefined) {
            playPromise.catch(error => {
                if (currentAudio === audio) currentAudio = null;
                reject(error);
            });
        }
    });
};

/**
 * 标准浏览器 TTS 朗读
 */
export const playTextToSpeech = async (text: string, accent: 'US' | 'UK' = 'US', rate: number = 1.0, repeat: number = 1) => {
  if (!text || repeat <= 0) return;
  stopAudio(); // 确保其他音频停止

  const synth = window.speechSynthesis;
  if (synth.paused) synth.resume();

  try {
      const voices = await waitForVoices();
      const langTag = accent === 'UK' ? 'en-GB' : 'en-US';
      const targetVoice = voices.find(v => v.lang === langTag) || voices.find(v => v.lang.startsWith('en'));

      for (let i = 0; i < repeat; i++) {
        const utterance = new SpeechSynthesisUtterance(text);
        const safeRate = Math.max(0.1, Math.min(10, rate)); 
        utterance.rate = safeRate;
        utterance.pitch = 1.0;
        if (targetVoice) { utterance.voice = targetVoice; utterance.lang = targetVoice.lang; } 
        else { utterance.lang = langTag; }
        synth.speak(utterance);
      }
  } catch (err) {
      console.error("TTS Error", err);
  }
};

/**
 * 智能音频播放：优先有道在线流，失败则回退到 TTS
 */
export const playWordAudio = async (text: string, accent: 'US' | 'UK' = 'US', speed: number = 1.0) => {
    if (!text) return;
    
    const type = accent === 'UK' ? 1 : 2;
    const url = `https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(text)}&type=${type}`;

    try {
        await playUrl(url, speed);
    } catch (e) {
        console.warn(`Online audio failed for ${text}, falling back to TTS`, e);
        playTextToSpeech(text, accent, speed);
    }
};

/**
 * 智能句子播放
 */
export const playSentenceAudio = async (text: string, explicitUrl?: string, accent: 'US' | 'UK' = 'US', speed: number = 1.0) => {
    if (explicitUrl) {
        try {
            await playUrl(explicitUrl, speed);
            return;
        } catch(e) { console.warn("Explicit URL failed"); }
    }

    const type = accent === 'UK' ? 1 : 2;
    const url = `https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(text)}&type=${type}`;
    
    try {
        await playUrl(url, speed);
    } catch (e) {
        playTextToSpeech(text, accent, speed);
    }
};