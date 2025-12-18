import React, { useState, useEffect, useRef } from 'react';
import { Youtube, Tv, Music, ExternalLink, PlayCircle, PauseCircle, ArrowLeft, ArrowRight, Disc, Mic2, User, SkipBack, SkipForward } from 'lucide-react';
import { WordVideoData, VideoSentsData, MusicSentsData, MusicSentItem } from '../../types/youdao';
import { SourceBadge } from './SourceBadge';
import { playUrl, stopAudio as stopGlobalAudio } from '../../utils/audio';

// --- 1. 视频讲解组件 (Video Lectures) ---
export const VideoLectureSection: React.FC<{ wordVideos?: WordVideoData }> = ({ wordVideos }) => {
    const videos = wordVideos?.word_videos || [];
    const [activeIdx, setActiveIdx] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);

    // 切换视频时重置播放状态并通知其他媒体停止
    useEffect(() => {
        stopGlobalAudio();
        setIsPlaying(false);
    }, [activeIdx]);

    // 监听全局停止信号
    useEffect(() => {
        const handleStop = () => setIsPlaying(false);
        window.addEventListener('reword:stop-media', handleStop);
        return () => window.removeEventListener('reword:stop-media', handleStop);
    }, []);

    if (videos.length === 0) return null;

    const current = videos[activeIdx];

    const handlePlayClick = () => {
        if (!isPlaying) {
            stopGlobalAudio(); // 停止其他媒体
            setIsPlaying(true);
        } else {
            setIsPlaying(false);
        }
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="flex items-center gap-2 px-8 py-5 border-b border-slate-100 bg-red-50/30">
                <Youtube className="w-5 h-5 text-red-600" />
                <h3 className="text-lg font-bold text-slate-800">视频讲解</h3>
                <span className="text-xs text-red-500 font-medium bg-red-50 px-2 py-0.5 rounded-full ml-auto">
                    {activeIdx + 1} / {videos.length}
                </span>
            </div>
            
            <div className="relative w-full h-[500px] bg-slate-900 flex items-center justify-center overflow-hidden group select-none">
                <div className="absolute inset-0 bg-gradient-to-b from-slate-900 to-slate-800">
                    {current?.video?.cover && <img src={current.video.cover} className="w-full h-full object-cover opacity-10 blur-xl" />}
                </div>

                <div className="relative w-full max-w-3xl aspect-video bg-black rounded-xl shadow-2xl overflow-hidden border border-white/10">
                    {isPlaying ? (
                        <video src={current.video?.url} controls autoPlay className="w-full h-full object-contain" onEnded={() => setIsPlaying(false)} />
                    ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            {current.video?.cover && <img src={current.video.cover} className="absolute inset-0 w-full h-full object-cover opacity-60" />}
                            <div className="relative z-10 p-6 text-center max-w-md">
                                <h4 className="text-white font-bold text-xl mb-6 line-clamp-2 drop-shadow-md">{current.video?.title || '视频播放'}</h4>
                                <button 
                                    onClick={handlePlayClick}
                                    className="p-5 bg-red-600 hover:bg-red-700 text-white rounded-full transition-all transform hover:scale-110 active:scale-95 shadow-xl shadow-red-900/40"
                                >
                                    <PlayCircle className="w-12 h-12 fill-current" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {videos.length > 1 && (
                    <div className="absolute bottom-6 left-0 right-0 flex justify-center items-center gap-6 z-20">
                        <button onClick={() => setActiveIdx(p => Math.max(0, p - 1))} disabled={activeIdx === 0} className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-full disabled:opacity-20"><ArrowLeft className="w-6 h-6"/></button>
                        <div className="flex gap-2">
                            {videos.map((_, i) => (
                                <div key={i} className={`h-1.5 rounded-full transition-all ${i === activeIdx ? 'w-8 bg-red-500' : 'w-1.5 bg-white/20'}`} />
                            ))}
                        </div>
                        <button onClick={() => setActiveIdx(p => Math.min(videos.length - 1, p + 1))} disabled={activeIdx === videos.length - 1} className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-full disabled:opacity-20"><ArrowRight className="w-6 h-6"/></button>
                    </div>
                )}
            </div>
            <SourceBadge source="word_video" />
        </div>
    );
};

// --- 2. 实景视频组件 (Video Scenes) ---
export const VideoSceneSection: React.FC<{ videoSents?: VideoSentsData }> = ({ videoSents }) => {
    const sents = videoSents?.sents_data || videoSents?.video_sent || [];
    const [playingId, setPlayingId] = useState<number | null>(null);

    // 监听全局停止信号
    useEffect(() => {
        const handleStop = () => setPlayingId(null);
        window.addEventListener('reword:stop-media', handleStop);
        return () => window.removeEventListener('reword:stop-media', handleStop);
    }, []);

    if (sents.length === 0) return null;

    const handlePlay = (idx: number) => {
        if (playingId === idx) {
            setPlayingId(null);
        } else {
            stopGlobalAudio(); // 停止其他媒体
            setPlayingId(idx);
        }
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
            <div className="flex items-center gap-2 mb-6 pb-4 border-b border-slate-100">
                <Tv className="w-5 h-5 text-indigo-500" />
                <h3 className="text-lg font-bold text-slate-800">实景视频 (Scene)</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {sents.map((item, idx) => (
                    <div key={idx} className="flex flex-col rounded-xl overflow-hidden border border-slate-100 bg-slate-50 group hover:border-indigo-200 transition-all">
                        <div className="relative aspect-video bg-black flex items-center justify-center">
                            {playingId === idx ? (
                                <video src={item.url || item.video} controls autoPlay className="w-full h-full" onEnded={() => setPlayingId(null)} />
                            ) : (
                                <>
                                    {(item.cover || item.video_cover) && <img src={item.cover || item.video_cover} className="absolute inset-0 w-full h-full object-cover opacity-70" />}
                                    <button onClick={() => handlePlay(idx)} className="relative z-10 p-3 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/40 transition">
                                        <PlayCircle className="w-10 h-10 fill-current" />
                                    </button>
                                </>
                            )}
                        </div>
                        <div className="p-4">
                            <p className="text-sm font-bold text-slate-800 line-clamp-1 mb-1">{item.sents?.[0]?.eng}</p>
                            <p className="text-xs text-slate-500 line-clamp-1">{item.sents?.[0]?.chn}</p>
                            <div className="mt-3 pt-3 border-t border-slate-200/50 flex justify-between items-center">
                                <span className="text-[10px] text-slate-400 font-medium bg-white px-2 py-0.5 rounded-full border border-slate-100 uppercase tracking-tighter">{item.source || item.contributor || '未知来源'}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            <SourceBadge source="video_sents" />
        </div>
    );
};

// --- 3. 原声歌曲组件 (Music Player) ---
export const MusicSection: React.FC<{ musicSents?: MusicSentsData }> = ({ musicSents }) => {
    const sents = musicSents?.sents_data || musicSents?.music_sent || [];
    const [activeIdx, setActiveIdx] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // 监听全局停止信号
    useEffect(() => {
        const handleStop = () => {
            if (audioRef.current) audioRef.current.pause();
            setIsPlaying(false);
        };
        window.addEventListener('reword:stop-media', handleStop);
        return () => window.removeEventListener('reword:stop-media', handleStop);
    }, []);

    if (sents.length === 0) return null;

    const current = sents[activeIdx];

    const togglePlay = () => {
        if (!audioRef.current) return;
        if (isPlaying) {
            audioRef.current.pause();
            setIsPlaying(false);
        } else {
            stopGlobalAudio(); // 停止其他播放中的媒体
            audioRef.current.play().catch(console.error);
            setIsPlaying(true);
        }
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
            <div className="flex items-center gap-2 mb-6 pb-4 border-b border-slate-100">
                <Music className="w-5 h-5 text-fuchsia-600" />
                <h3 className="text-lg font-bold text-slate-800">原声歌曲</h3>
            </div>

            <div className="bg-gradient-to-br from-fuchsia-50 to-indigo-50 rounded-2xl p-8 flex flex-col md:flex-row gap-10 items-center">
                {/* Vinyl Disc Animation */}
                <div className="relative group shrink-0">
                    <div className={`w-48 h-48 rounded-full bg-slate-900 shadow-2xl relative flex items-center justify-center border-4 border-slate-800 transition-transform duration-[20s] linear infinite ${isPlaying ? 'animate-spin' : ''}`}>
                         <div className="absolute inset-0 rounded-full border-4 border-slate-700/50 scale-95" />
                         <div className="w-16 h-16 rounded-full bg-white relative z-10 flex items-center justify-center overflow-hidden border-2 border-slate-800">
                            {(current.coverImg || current.cover) ? (
                                <img src={current.coverImg || current.cover} className="w-full h-full object-cover" />
                            ) : (
                                <Disc className="w-10 h-10 text-slate-300" />
                            )}
                         </div>
                    </div>
                    {/* Tonearm */}
                    <div className={`absolute -top-2 -right-4 w-20 h-4 bg-slate-300 rounded-full origin-left transition-transform duration-500 ${isPlaying ? 'rotate-[25deg]' : 'rotate-0'}`} style={{ transformOrigin: '0% 50%' }} />
                </div>

                <div className="flex-1 space-y-6 w-full">
                    <div>
                        <h4 className="text-2xl font-bold text-slate-800 mb-1">{current.songName || current.song_name || '未知曲目'}</h4>
                        <div className="flex items-center text-slate-500 gap-2 font-medium">
                            <User className="w-4 h-4" />
                            <span>{current.singer || '未知歌手'}</span>
                        </div>
                    </div>

                    <div className="bg-white/60 backdrop-blur-sm p-4 rounded-xl border border-white/80 min-h-[100px] flex flex-col justify-center">
                        <p className="text-base text-slate-700 font-medium italic leading-relaxed mb-2" dangerouslySetInnerHTML={{ __html: current.lyric || current.sents?.[0]?.eng || '暂无歌词' }} />
                        <p className="text-sm text-slate-500">{current.lyricTranslation || current.sents?.[0]?.chn}</p>
                    </div>

                    <div className="flex items-center gap-6">
                        <button onClick={togglePlay} className="p-4 bg-fuchsia-600 hover:bg-fuchsia-700 text-white rounded-full transition shadow-lg shadow-fuchsia-200">
                            {isPlaying ? <PauseCircle className="w-8 h-8 fill-current" /> : <PlayCircle className="w-8 h-8 fill-current" />}
                        </button>
                        <audio 
                            ref={audioRef} 
                            src={current.playUrl || current.url} 
                            onEnded={() => setIsPlaying(false)} 
                        />
                        
                        {sents.length > 1 && (
                            <div className="flex gap-2">
                                <button onClick={() => setActiveIdx(p => Math.max(0, p - 1))} disabled={activeIdx === 0} className="p-2 text-slate-400 hover:text-fuchsia-600 disabled:opacity-20"><ArrowLeft className="w-6 h-6"/></button>
                                <button onClick={() => setActiveIdx(p => Math.min(sents.length - 1, p + 1))} disabled={activeIdx === sents.length - 1} className="p-2 text-slate-400 hover:text-fuchsia-600 disabled:opacity-20"><ArrowRight className="w-6 h-6"/></button>
                            </div>
                        )}

                        {current.link && (
                            <a href={current.link} target="_blank" rel="noopener noreferrer" className="ml-auto text-xs text-slate-400 hover:text-fuchsia-600 flex items-center gap-1">
                                <ExternalLink className="w-3 h-3" />
                                完整版
                            </a>
                        )}
                    </div>
                </div>
            </div>
            <SourceBadge source="music_sents" />
        </div>
    );
};
