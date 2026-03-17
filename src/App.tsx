import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  ChevronRight, 
  ChevronLeft, 
  BookOpen, 
  Layers, 
  FileText, 
  Save, 
  Trash2, 
  Menu,
  X,
  Edit3,
  LayoutGrid,
  Network,
  ArrowLeft,
  Maximize2,
  Minimize2,
  Download,
  Printer
} from 'lucide-react';
import { Project, Season, Chapter, Episode, TimelineNode } from './types';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const STORAGE_KEY = 'comic_script_projects_v2';

const createInitialProject = (title: string = '새로운 프로젝트'): Project => ({
  id: Date.now().toString(),
  title,
  logline: '',
  timeline: [],
  seasons: [
    {
      id: 's1',
      title: '시즌 1',
      treatment: '',
      chapters: [
        {
          id: 'c1',
          title: '챕터 1',
          content: '',
          episodes: [
            { id: 'e1', title: '1화', content: '', cuts: [] }
          ]
        }
      ]
    }
  ]
});

export default function App() {
  const [projects, setProjects] = useState<Project[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Migration: Ensure timeline is an array
      return parsed.map((p: any) => ({
        ...p,
        timeline: Array.isArray(p.timeline) ? p.timeline : []
      }));
    }
    return [createInitialProject()];
  });

  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [activeSeasonId, setActiveSeasonId] = useState<string>('');
  const [activeChapterId, setActiveChapterId] = useState<string>('');
  const [activeEpisodeId, setActiveEpisodeId] = useState<string>('');
  
  const [view, setView] = useState<'project' | 'timeline' | 'season' | 'chapter' | 'episode'>('project');
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 1024);
  const [showMindMap, setShowMindMap] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  const askConfirm = (title: string, message: string, onConfirm: () => void) => {
    setConfirmModal({ title, message, onConfirm });
  };

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  }, [projects]);

  const activeProject = projects.find(p => p.id === activeProjectId);
  const activeSeason = activeProject?.seasons.find(s => s.id === activeSeasonId);
  const activeChapter = activeSeason?.chapters.find(c => c.id === activeChapterId);
  const activeEpisode = activeChapter?.episodes.find(e => e.id === activeEpisodeId);

  // Sequential naming helpers
  const getNextSeasonTitle = (seasons: Season[]) => `시즌 ${seasons.length + 1}`;
  const getNextChapterTitle = (chapters: Chapter[]) => `챕터 ${chapters.length + 1}`;
  const getNextEpisodeTitle = (episodes: Episode[]) => `${episodes.length + 1}화`;

  const addProject = () => {
    const newProject = createInitialProject(`프로젝트 ${projects.length + 1}`);
    setProjects(prev => [...prev, newProject]);
    setActiveProjectId(newProject.id);
    setView('project');
  };

  const deleteProject = (id: string) => {
    askConfirm(
      '프로젝트 삭제',
      '이 프로젝트를 삭제하시겠습니까? 모든 데이터가 영구적으로 삭제됩니다.',
      () => {
        setProjects(prev => prev.filter(p => p.id !== id));
        if (activeProjectId === id) setActiveProjectId(null);
      }
    );
  };

  const addSeason = () => {
    if (!activeProjectId) return;
    const newSeason: Season = {
      id: Date.now().toString(),
      title: getNextSeasonTitle(activeProject!.seasons),
      treatment: '',
      chapters: []
    };
    setProjects(prev => prev.map(p => p.id === activeProjectId ? { ...p, seasons: [...p.seasons, newSeason] } : p));
    setActiveSeasonId(newSeason.id);
    setView('season');
  };

  const addChapter = (seasonId: string) => {
    if (!activeProjectId) return;
    const season = activeProject?.seasons.find(s => s.id === seasonId);
    const newChapter: Chapter = {
      id: Date.now().toString(),
      title: getNextChapterTitle(season?.chapters || []),
      content: '',
      episodes: []
    };
    setProjects(prev => prev.map(p => p.id === activeProjectId ? {
      ...p,
      seasons: p.seasons.map(s => s.id === seasonId ? { ...s, chapters: [...s.chapters, newChapter] } : s)
    } : p));
    setActiveChapterId(newChapter.id);
    setView('chapter');
  };

  const deleteSeason = (seasonId: string) => {
    askConfirm(
      '시즌 삭제',
      '시즌을 삭제하시겠습니까? 모든 챕터와 에피소드가 삭제됩니다.',
      () => {
        setProjects(prev => prev.map(p => p.id === activeProjectId ? {
          ...p,
          seasons: p.seasons.filter(s => s.id !== seasonId)
        } : p));
        if (activeSeasonId === seasonId) {
          setView('project');
          setActiveSeasonId('');
        }
      }
    );
  };

  const deleteChapter = (seasonId: string, chapterId: string) => {
    askConfirm(
      '챕터 삭제',
      '챕터를 삭제하시겠습니까? 모든 에피소드가 삭제됩니다.',
      () => {
        setProjects(prev => prev.map(p => p.id === activeProjectId ? {
          ...p,
          seasons: p.seasons.map(s => s.id === seasonId ? {
            ...s,
            chapters: s.chapters.filter(c => c.id !== chapterId)
          } : s)
        } : p));
        if (activeChapterId === chapterId) {
          setView('season');
          setActiveChapterId('');
        }
      }
    );
  };

  const deleteEpisode = (seasonId: string, chapterId: string, episodeId: string) => {
    askConfirm(
      '에피소드 삭제',
      '에피소드를 삭제하시겠습니까?',
      () => {
        setProjects(prev => prev.map(p => p.id === activeProjectId ? {
          ...p,
          seasons: p.seasons.map(s => s.id === seasonId ? {
            ...s,
            chapters: s.chapters.map(c => c.id === chapterId ? {
              ...c,
              episodes: c.episodes.filter(e => e.id !== episodeId)
            } : c)
          } : s)
        } : p));
        if (activeEpisodeId === episodeId) {
          setView('chapter');
          setActiveEpisodeId('');
        }
      }
    );
  };

  const addEpisode = (seasonId: string, chapterId: string) => {
    if (!activeProjectId) return;
    const season = activeProject?.seasons.find(s => s.id === seasonId);
    const chapter = season?.chapters.find(c => c.id === chapterId);
    const newEpisode: Episode = {
      id: Date.now().toString(),
      title: getNextEpisodeTitle(chapter?.episodes || []),
      content: '',
      cuts: []
    };
    setProjects(prev => prev.map(p => p.id === activeProjectId ? {
      ...p,
      seasons: p.seasons.map(s => s.id === seasonId ? {
        ...s,
        chapters: s.chapters.map(c => c.id === chapterId ? { ...c, episodes: [...c.episodes, newEpisode] } : c)
      } : s)
    } : p));
    setActiveEpisodeId(newEpisode.id);
    setView('episode');
  };

  const updateActiveProject = (updates: Partial<Project>) => {
    setProjects(prev => prev.map(p => p.id === activeProjectId ? { ...p, ...updates } : p));
  };

  const updateSeason = (id: string, updates: Partial<Season>) => {
    setProjects(prev => prev.map(p => p.id === activeProjectId ? {
      ...p,
      seasons: p.seasons.map(s => s.id === id ? { ...s, ...updates } : s)
    } : p));
  };

  const updateChapter = (seasonId: string, chapterId: string, updates: Partial<Chapter>) => {
    setProjects(prev => prev.map(p => p.id === activeProjectId ? {
      ...p,
      seasons: p.seasons.map(s => s.id === seasonId ? {
        ...s,
        chapters: s.chapters.map(c => c.id === chapterId ? { ...c, ...updates } : c)
      } : s)
    } : p));
  };

  const updateEpisode = (seasonId: string, chapterId: string, episodeId: string, updates: Partial<Episode>) => {
    setProjects(prev => prev.map(p => p.id === activeProjectId ? {
      ...p,
      seasons: p.seasons.map(s => s.id === seasonId ? {
        ...s,
        chapters: s.chapters.map(c => c.id === chapterId ? {
          ...c,
          episodes: c.episodes.map(e => e.id === episodeId ? { ...e, ...updates } : e)
        } : c)
      } : s)
    } : p));
  };

  const addCut = (seasonId: string, chapterId: string, episodeId: string) => {
    if (!activeProjectId) return;
    const newCut = { id: Date.now().toString(), content: '' };
    setProjects(prev => prev.map(p => p.id === activeProjectId ? {
      ...p,
      seasons: p.seasons.map(s => s.id === seasonId ? {
        ...s,
        chapters: s.chapters.map(c => c.id === chapterId ? {
          ...c,
          episodes: c.episodes.map(e => e.id === episodeId ? { ...e, cuts: [...(e.cuts || []), newCut] } : e)
        } : c)
      } : s)
    } : p));
  };

  const updateCut = (seasonId: string, chapterId: string, episodeId: string, cutId: string, content: string) => {
    setProjects(prev => prev.map(p => p.id === activeProjectId ? {
      ...p,
      seasons: p.seasons.map(s => s.id === seasonId ? {
        ...s,
        chapters: s.chapters.map(c => c.id === chapterId ? {
          ...c,
          episodes: c.episodes.map(e => e.id === episodeId ? {
            ...e,
            cuts: (e.cuts || []).map(cut => cut.id === cutId ? { ...cut, content } : cut)
          } : e)
        } : c)
      } : s)
    } : p));
  };

  const deleteCut = (seasonId: string, chapterId: string, episodeId: string, cutId: string) => {
    setProjects(prev => prev.map(p => p.id === activeProjectId ? {
      ...p,
      seasons: p.seasons.map(s => s.id === seasonId ? {
        ...s,
        chapters: s.chapters.map(c => c.id === chapterId ? {
          ...c,
          episodes: c.episodes.map(e => e.id === episodeId ? {
            ...e,
            cuts: (e.cuts || []).filter(cut => cut.id !== cutId)
          } : e)
        } : c)
      } : s)
    } : p));
  };

  const addTimelineNode = () => {
    if (!activeProjectId) return;
    const newNode: TimelineNode = {
      id: Date.now().toString(),
      title: '새로운 사건',
      description: '사건에 대한 설명을 입력하세요.'
    };
    setProjects(prev => prev.map(p => p.id === activeProjectId ? { ...p, timeline: [...p.timeline, newNode] } : p));
  };

  const updateTimelineNode = (nodeId: string, updates: Partial<TimelineNode>) => {
    setProjects(prev => prev.map(p => p.id === activeProjectId ? {
      ...p,
      timeline: p.timeline.map(node => node.id === nodeId ? { ...node, ...updates } : node)
    } : p));
  };

  const deleteTimelineNode = (nodeId: string) => {
    setProjects(prev => prev.map(p => p.id === activeProjectId ? {
      ...p,
      timeline: p.timeline.filter(node => node.id !== nodeId)
    } : p));
  };

  const [isExporting, setIsExporting] = useState(false);

  const exportToImage = async () => {
    if (!activeProject) return;
    setIsExporting(true);
    
    // Create a temporary container for content
    const element = document.createElement('div');
    element.style.position = 'absolute';
    element.style.left = '-9999px';
    element.style.top = '0';
    element.style.width = '900px'; 
    element.style.backgroundColor = '#F5F5F0'; // App background color
    element.style.padding = '60px';
    element.style.color = '#1A1A1A';
    element.style.fontFamily = "'Cormorant Garamond', serif";
    
    // Build the content with app-like styling - NO page breaks
    let contentHtml = `
      <div style="margin-bottom: 60px; background: white; padding: 40px; border-radius: 32px; box-shadow: 0 4px 20px rgba(0,0,0,0.05); border: 1px solid #D1D1C1;">
        <label style="display: block; font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em; color: #8E8E7E; font-weight: bold; margin-bottom: 8px;">PROJECT OVERVIEW</label>
        <h1 style="font-size: 48px; margin: 0 0 16px 0; font-weight: 300; line-height: 1.1;">${activeProject.title}</h1>
        <div style="height: 1px; background: #D1D1C1; margin: 24px 0;"></div>
        <p style="font-size: 18px; line-height: 1.6; color: #4A4A4A; font-style: italic;">"${activeProject.logline || '로그라인이 없습니다.'}"</p>
      </div>
      
      <div style="margin-bottom: 60px; background: white; padding: 40px; border-radius: 32px; box-shadow: 0 4px 20px rgba(0,0,0,0.05); border: 1px solid #D1D1C1;">
        <h2 style="font-size: 32px; color: #1A1A1A; margin-bottom: 32px; font-weight: 300;">타임라인</h2>
        <div style="position: relative; padding-left: 40px;">
          <div style="position: absolute; left: 19px; top: 0; bottom: 0; width: 2px; background: #D1D1C1;"></div>
          ${activeProject.timeline.map(node => `
            <div style="margin-bottom: 32px; position: relative;">
              <div style="position: absolute; left: -27px; top: 8px; width: 16px; height: 16px; border-radius: 50%; background: #5A5A40; border: 4px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.1);"></div>
              <h3 style="font-size: 22px; margin: 0; font-weight: 600;">${node.title}</h3>
              <p style="font-size: 16px; color: #8E8E7E; margin: 8px 0 0 0; line-height: 1.5;">${node.description}</p>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    activeProject.seasons.forEach(season => {
      contentHtml += `
        <div style="margin-bottom: 60px;">
          <div style="background: white; padding: 40px; border-radius: 32px; box-shadow: 0 4px 20px rgba(0,0,0,0.05); border: 1px solid #D1D1C1; margin-bottom: 40px;">
            <label style="display: block; font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em; color: #8E8E7E; font-weight: bold; margin-bottom: 8px;">SEASON TREATMENT</label>
            <h2 style="font-size: 40px; color: #1A1A1A; margin: 0 0 24px 0; font-weight: 300;">${season.title}</h2>
            <div style="background: #F5F5F0; padding: 32px; border-radius: 24px; font-size: 20px; line-height: 1.8; color: #1A1A1A;">
              ${season.treatment || '트리트먼트 내용이 없습니다.'}
            </div>
          </div>
          
          ${season.chapters.map(chapter => `
            <div style="margin-bottom: 40px; padding-left: 20px;">
              <div style="display: flex; align-items: center; gap: 16px; margin-bottom: 24px;">
                <div style="height: 1px; flex: 1; background: #D1D1C1;"></div>
                <h3 style="font-size: 24px; color: #5A5A40; font-weight: 400; text-transform: uppercase; letter-spacing: 0.1em;">${chapter.title}</h3>
                <div style="height: 1px; flex: 1; background: #D1D1C1;"></div>
              </div>
              
              ${chapter.episodes.map(episode => `
                <div style="margin-bottom: 32px; background: white; padding: 32px; border-radius: 24px; border: 1px solid #E6E6D6; box-shadow: 0 2px 10px rgba(0,0,0,0.02);">
                  <h4 style="font-size: 22px; margin: 0 0 16px 0; color: #1A1A1A; font-weight: 600;">${episode.title}</h4>
                  <p style="font-size: 17px; line-height: 1.7; color: #4A4A4A; margin-bottom: 24px;">${episode.content || '에피소드 개요가 없습니다.'}</p>
                  
                  ${(episode.cuts || []).length > 0 ? `
                    <div style="margin-top: 24px; border-top: 1px solid #F5F5F0; padding-top: 24px;">
                      <label style="display: block; font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: #8E8E7E; font-weight: bold; margin-bottom: 16px;">SCENE BREAKDOWN (CUTS)</label>
                      <div style="display: flex; flex-direction: column; gap: 12px;">
                        ${episode.cuts.map((cut, idx) => `
                          <div style="display: flex; gap: 16px; align-items: flex-start;">
                            <div style="flex-shrink: 0; width: 44px; height: 24px; background: #5A5A40; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: bold; color: white;">${idx + 1}컷</div>
                            <div style="font-size: 15px; line-height: 1.6; color: #1A1A1A; padding-top: 2px;">${cut.content}</div>
                          </div>
                        `).join('')}
                      </div>
                    </div>
                  ` : ''}
                </div>
              `).join('')}
            </div>
          `).join('')}
        </div>
      `;
    });

    element.innerHTML = contentHtml;
    document.body.appendChild(element);

    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        windowWidth: 900
      });
      
      const imgData = canvas.toDataURL('image/jpeg', 0.9);
      const link = document.createElement('a');
      link.href = imgData;
      link.download = `${activeProject.title}_전체시나리오.jpg`;
      link.click();
    } catch (error) {
      console.error('Image Export Error:', error);
      alert('이미지 생성 중 오류가 발생했습니다.');
    } finally {
      document.body.removeChild(element);
      setIsExporting(false);
    }
  };

  // Project Selection View
  if (!activeProjectId) {
    return (
      <div className="min-h-screen bg-[#F5F5F0] p-8 md:p-16 font-serif">
        <div className="max-w-6xl mx-auto space-y-12">
          <header className="flex justify-between items-end border-b border-[#D1D1C1] pb-8">
            <div>
              <h1 className="text-6xl font-bold tracking-tighter">글콘티</h1>
              <p className="text-[#8E8E7E] mt-4 font-sans uppercase tracking-widest text-sm">내 프로젝트 보관함</p>
            </div>
            <button 
              onClick={addProject}
              className="flex items-center gap-2 bg-[#5A5A40] text-white px-6 py-3 rounded-full hover:bg-[#4A4A30] transition-all shadow-lg font-sans font-bold"
            >
              <Plus size={20} /> 새 프로젝트 시작
            </button>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {projects.map(p => (
              <motion.div 
                key={p.id}
                whileHover={{ y: -5 }}
                className="bg-white p-8 rounded-[32px] border border-[#D1D1C1] shadow-sm hover:shadow-xl transition-all group relative"
              >
                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <BookOpen className="text-[#5A5A40]" size={24} />
                    <button 
                      onClick={(e) => { e.stopPropagation(); deleteProject(p.id); }}
                      className="p-2 text-[#D1D1C1] hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                  <h2 className="text-2xl font-bold leading-tight">{p.title}</h2>
                  <p className="text-[#8E8E7E] text-sm line-clamp-2 font-sans italic">
                    {p.logline || '로그라인이 작성되지 않았습니다.'}
                  </p>
                  <div className="pt-4 flex items-center gap-4 text-xs font-sans font-bold text-[#5A5A40]">
                    <span>시즌 {p.seasons.length}</span>
                    <span className="w-1 h-1 bg-[#D1D1C1] rounded-full" />
                    <span>총 {p.seasons.reduce((acc, s) => acc + s.chapters.reduce((acc2, c) => acc2 + c.episodes.length, 0), 0)}화</span>
                  </div>
                </div>
                <button 
                  onClick={() => {
                    setActiveProjectId(p.id);
                    setActiveSeasonId(p.seasons[0]?.id || '');
                    setActiveChapterId(p.seasons[0]?.chapters[0]?.id || '');
                    setActiveEpisodeId(p.seasons[0]?.chapters[0]?.episodes[0]?.id || '');
                    setView('project');
                  }}
                  className="absolute inset-0 rounded-[32px]"
                />
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#F5F5F0] text-[#1A1A1A] font-serif overflow-hidden">
      {/* Sidebar */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.aside
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            className="w-80 bg-white border-r border-[#D1D1C1] flex flex-col z-20 shadow-2xl lg:shadow-none"
          >
            <div className="p-6 border-b border-[#D1D1C1] flex justify-between items-center">
              <button 
                onClick={() => setActiveProjectId(null)}
                className="flex items-center gap-2 text-sm font-sans font-bold text-[#5A5A40] hover:underline"
              >
                <ArrowLeft size={16} /> 목록으로
              </button>
              <button onClick={() => setIsSidebarOpen(false)} className="p-1 hover:bg-[#F5F5F0] rounded-full lg:hidden">
                <X size={20} />
              </button>
            </div>

            <div className="p-6">
              <h1 className="text-2xl font-bold tracking-tight">글콘티</h1>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              <div className="space-y-2">
                <button 
                  onClick={() => setView('project')}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors ${view === 'project' ? 'bg-[#5A5A40] text-white' : 'hover:bg-[#F5F5F0]'}`}
                >
                  <BookOpen size={18} />
                  <span className="font-medium">프로젝트 정보</span>
                </button>
                <button 
                  onClick={() => setView('timeline')}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors ${view === 'timeline' ? 'bg-[#5A5A40] text-white' : 'hover:bg-[#F5F5F0]'}`}
                >
                  <LayoutGrid size={18} />
                  <span className="font-medium">타임라인</span>
                </button>
                <button 
                  onClick={() => setShowMindMap(true)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-[#F5F5F0] transition-colors text-[#5A5A40]"
                >
                  <Network size={18} />
                  <span className="font-medium">마인드맵 보기</span>
                </button>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center px-3 mb-2">
                  <span className="text-xs uppercase tracking-widest text-[#8E8E7E] font-sans font-bold">시즌</span>
                  <button onClick={addSeason} className="p-1 hover:bg-[#F5F5F0] rounded-full text-[#5A5A40]">
                    <Plus size={16} />
                  </button>
                </div>
                {activeProject.seasons.map(season => (
                  <div key={season.id} className="space-y-1">
                    <div 
                      role="button"
                      onClick={() => {
                        setActiveSeasonId(season.id);
                        setView('season');
                      }}
                      className={`w-full flex items-center justify-between p-3 rounded-xl transition-colors cursor-pointer group ${view === 'season' && activeSeasonId === season.id ? 'bg-[#5A5A40] text-white' : 'hover:bg-[#F5F5F0]'}`}
                    >
                      <div className="flex items-center gap-3">
                        <Layers size={18} />
                        <span className="truncate">{season.title}</span>
                      </div>
                      <button 
                        onClick={(e) => { e.stopPropagation(); deleteSeason(season.id); }}
                        className="p-1 text-[#D1D1C1] hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                    {activeSeasonId === season.id && (
                      <div className="ml-6 space-y-1 border-l-2 border-[#D1D1C1] pl-2">
                        {season.chapters.map(chapter => (
                          <div key={chapter.id} className="space-y-1">
                            <div 
                              role="button"
                              onClick={() => {
                                setActiveChapterId(chapter.id);
                                setView('chapter');
                              }}
                              className={`w-full flex items-center justify-between p-2 rounded-lg transition-colors text-sm cursor-pointer group/chapter ${view === 'chapter' && activeChapterId === chapter.id ? 'bg-[#E6E6D6]' : 'hover:bg-[#F5F5F0]'}`}
                            >
                              <span className="truncate">{chapter.title}</span>
                              <button 
                                onClick={(e) => { e.stopPropagation(); deleteChapter(season.id, chapter.id); }}
                                className="p-1 text-[#D1D1C1] hover:text-red-500 opacity-0 group-hover/chapter:opacity-100 transition-opacity"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>

                            {activeChapterId === chapter.id && (
                              <div className="ml-4 space-y-1 border-l border-[#D1D1C1] pl-2">
                                {chapter.episodes.map(episode => (
                                  <div 
                                    key={episode.id}
                                    role="button"
                                    onClick={() => {
                                      setActiveEpisodeId(episode.id);
                                      setView('episode');
                                    }}
                                    className={`w-full flex items-center justify-between p-2 rounded-lg transition-colors text-xs cursor-pointer group/episode ${view === 'episode' && activeEpisodeId === episode.id ? 'bg-[#D1D1C1]' : 'hover:bg-[#F5F5F0]'}`}
                                  >
                                    <span className="truncate">{episode.title}</span>
                                    <button 
                                      onClick={(e) => { e.stopPropagation(); deleteEpisode(season.id, chapter.id, episode.id); }}
                                      className="p-1 text-[#D1D1C1] hover:text-red-500 opacity-0 group-hover/episode:opacity-100 transition-opacity"
                                    >
                                      <Trash2 size={10} />
                                    </button>
                                  </div>
                                ))}
                                <button 
                                  onClick={() => addEpisode(season.id, chapter.id)}
                                  className="w-full text-left p-2 rounded-lg text-xs text-[#5A5A40] hover:bg-[#F5F5F0] flex items-center gap-1"
                                >
                                  <Plus size={12} /> 화 추가
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                        <button 
                          onClick={() => addChapter(season.id)}
                          className="w-full text-left p-2 rounded-lg text-sm text-[#5A5A40] hover:bg-[#F5F5F0] flex items-center gap-1"
                        >
                          <Plus size={14} /> 챕터 추가
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="mt-auto pt-6 border-t border-[#D1D1C1]">
                <button 
                  onClick={exportToImage}
                  disabled={isExporting}
                  className="w-full flex items-center justify-center gap-2 p-3 bg-[#5A5A40] text-white rounded-xl hover:bg-[#4A4A30] transition-all shadow-md font-sans font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isExporting ? (
                    <>이미지 생성 중...</>
                  ) : (
                    <>
                      <Download size={18} />
                      전체 이미지 저장 (JPG)
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative overflow-hidden">
        <header className="h-16 bg-white border-b border-[#D1D1C1] flex items-center justify-between px-6 z-10">
          <div className="flex items-center gap-4">
            {!isSidebarOpen && (
              <button onClick={() => setIsSidebarOpen(true)} className="p-2 hover:bg-[#F5F5F0] rounded-lg">
                <Menu size={20} />
              </button>
            )}
            <div className="flex items-center gap-2 text-sm text-[#8E8E7E] font-sans">
              <span className="hidden md:inline">{activeProject.title}</span>
              {view !== 'project' && (
                <>
                  <ChevronRight size={14} className="hidden md:inline" />
                  <span>{activeSeason?.title}</span>
                </>
              )}
              {view === 'chapter' && (
                <>
                  <ChevronRight size={14} />
                  <span>{activeChapter?.title}</span>
                </>
              )}
              {view === 'episode' && (
                <>
                  <ChevronRight size={14} />
                  <span className="hidden md:inline">{activeChapter?.title}</span>
                  <ChevronRight size={14} className="hidden md:inline" />
                  <span className="font-bold text-[#1A1A1A]">{activeEpisode?.title}</span>
                </>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="p-2 bg-[#5A5A40] text-white rounded-full hover:bg-[#4A4A30] transition-colors shadow-lg">
              <Save size={18} />
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 md:p-12 lg:p-20 flex justify-center">
          <div className="w-full max-w-4xl space-y-12">
            <AnimatePresence mode="wait">
              {view === 'project' && (
                <motion.div 
                  key="project"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-8"
                >
                  <div className="space-y-2">
                    <label className="text-xs uppercase tracking-widest text-[#8E8E7E] font-sans font-bold">프로젝트 제목</label>
                    <input 
                      type="text" 
                      value={activeProject.title}
                      onChange={(e) => updateActiveProject({ title: e.target.value })}
                      className="w-full text-5xl font-bold bg-transparent border-none outline-none focus:ring-0 placeholder-[#D1D1C1]"
                      placeholder="제목을 입력하세요"
                    />
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Edit3 size={18} className="text-[#5A5A40]" />
                      <label className="text-xs uppercase tracking-widest text-[#8E8E7E] font-sans font-bold">로그라인</label>
                    </div>
                    <textarea 
                      value={activeProject.logline}
                      onChange={(e) => updateActiveProject({ logline: e.target.value })}
                      className="w-full min-h-[200px] text-xl leading-relaxed bg-white p-10 rounded-[40px] border border-[#D1D1C1] shadow-sm outline-none focus:border-[#5A5A40] transition-colors placeholder-[#D1D1C1] resize-none"
                      placeholder="이야기의 핵심 로그라인을 작성하세요..."
                    />
                  </div>
                </motion.div>
              )}

              {view === 'timeline' && (
                <motion.div 
                  key="timeline"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-12 w-full"
                >
                  <div className="flex justify-between items-end">
                    <div className="space-y-2">
                      <label className="text-xs uppercase tracking-widest text-[#8E8E7E] font-sans font-bold">프로젝트 타임라인</label>
                      <h2 className="text-4xl font-bold">타임라인</h2>
                    </div>
                    <button 
                      onClick={addTimelineNode}
                      className="flex items-center gap-2 bg-[#5A5A40] text-white px-4 py-2 rounded-full hover:bg-[#4A4A30] transition-all shadow-md font-sans font-bold text-sm"
                    >
                      <Plus size={16} /> 노드 추가
                    </button>
                  </div>

                  <div className="relative py-12 min-h-[400px]">
                    {/* The Vertical Line */}
                    <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-[#D1D1C1] -translate-x-1/2" />
                    
                    <div className="space-y-24 relative">
                      {activeProject.timeline.map((node, index) => {
                        const isLeft = index % 2 === 0;
                        return (
                          <div key={node.id} className="relative flex items-center w-full">
                            {/* The Dot on the Line */}
                            <div className="absolute left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-[#5A5A40] border-4 border-white shadow-md z-10" />
                            
                            {/* Node Content */}
                            <div className={`w-1/2 flex ${isLeft ? 'justify-end pr-12' : 'justify-start pl-12'} ${isLeft ? 'mr-auto' : 'ml-auto'}`}>
                              <div className={`max-w-md w-full p-6 bg-white rounded-[24px] border border-[#D1D1C1] shadow-sm hover:shadow-md transition-shadow relative ${isLeft ? 'text-right' : 'text-left'}`}>
                                <div className="flex flex-col gap-2">
                                  <input 
                                    type="text"
                                    value={node.title}
                                    onChange={(e) => updateTimelineNode(node.id, { title: e.target.value })}
                                    className={`text-xl font-bold bg-transparent border-none outline-none focus:ring-0 w-full ${isLeft ? 'text-right' : 'text-left'}`}
                                    placeholder="제목"
                                  />
                                  <textarea 
                                    value={node.description}
                                    onChange={(e) => updateTimelineNode(node.id, { description: e.target.value })}
                                    className={`text-sm text-[#8E8E7E] bg-transparent border-none outline-none focus:ring-0 w-full resize-none font-sans ${isLeft ? 'text-right' : 'text-left'}`}
                                    placeholder="설명"
                                    rows={3}
                                  />
                                  <div className={`flex ${isLeft ? 'justify-start' : 'justify-end'}`}>
                                    <button 
                                      onClick={() => deleteTimelineNode(node.id)}
                                      className="p-1 text-[#D1D1C1] hover:text-red-500 transition-colors"
                                    >
                                      <Trash2 size={16} />
                                    </button>
                                  </div>
                                </div>
                                
                                {/* Connector Line to the Dot */}
                                <div className={`absolute top-1/2 -translate-y-1/2 w-12 h-px bg-[#D1D1C1] ${isLeft ? '-right-12' : '-left-12'}`} />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      {activeProject.timeline.length === 0 && (
                        <div className="text-center py-20 text-[#8E8E7E] font-sans italic">
                          아직 타임라인 노드가 없습니다. '노드 추가' 버튼을 눌러보세요.
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

              {view === 'season' && activeSeason && (
                <motion.div 
                  key="season"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-8"
                >
                  <div className="space-y-2">
                    <label className="text-xs uppercase tracking-widest text-[#8E8E7E] font-sans font-bold">시즌 제목</label>
                    <input 
                      type="text" 
                      value={activeSeason.title}
                      onChange={(e) => updateSeason(activeSeason.id, { title: e.target.value })}
                      className="w-full text-5xl font-bold bg-transparent border-none outline-none focus:ring-0"
                    />
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <FileText size={18} className="text-[#5A5A40]" />
                      <label className="text-xs uppercase tracking-widest text-[#8E8E7E] font-sans font-bold">트리트먼트</label>
                    </div>
                    <textarea 
                      value={activeSeason.treatment}
                      onChange={(e) => updateSeason(activeSeason.id, { treatment: e.target.value })}
                      className="w-full min-h-[400px] text-lg leading-relaxed bg-white p-10 rounded-[40px] border border-[#D1D1C1] shadow-sm outline-none focus:border-[#5A5A40] transition-colors placeholder-[#D1D1C1] resize-none"
                      placeholder="시즌의 전체적인 흐름과 트리트먼트를 작성하세요..."
                    />
                  </div>
                </motion.div>
              )}

              {view === 'chapter' && activeSeason && activeChapter && (
                <motion.div 
                  key="chapter"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-8"
                >
                  <div className="space-y-2">
                    <label className="text-xs uppercase tracking-widest text-[#8E8E7E] font-sans font-bold">챕터 제목</label>
                    <div className="flex justify-between items-center">
                      <input 
                        type="text" 
                        value={activeChapter.title}
                        onChange={(e) => updateChapter(activeSeason.id, activeChapter.id, { title: e.target.value })}
                        className="text-5xl font-bold bg-transparent border-none outline-none focus:ring-0 flex-1"
                      />
                      <button 
                        onClick={() => deleteChapter(activeSeason.id, activeChapter.id)}
                        className="p-3 text-[#D1D1C1] hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={24} />
                      </button>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <FileText size={18} className="text-[#5A5A40]" />
                      <label className="text-xs uppercase tracking-widest text-[#8E8E7E] font-sans font-bold">챕터 개요 / 노트</label>
                    </div>
                    <textarea 
                      value={activeChapter.content}
                      onChange={(e) => updateChapter(activeSeason.id, activeChapter.id, { content: e.target.value })}
                      className="w-full min-h-[200px] text-lg leading-relaxed bg-white p-10 rounded-[40px] border border-[#D1D1C1] shadow-sm outline-none focus:border-[#5A5A40] transition-colors placeholder-[#D1D1C1] resize-none"
                      placeholder="챕터의 핵심 내용이나 작업 노트를 작성하세요..."
                    />
                  </div>
                  <div className="space-y-4">
                    <label className="text-xs uppercase tracking-widest text-[#8E8E7E] font-sans font-bold">에피소드 목록</label>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {activeChapter.episodes.map(ep => (
                        <div 
                          key={ep.id}
                          role="button"
                          onClick={() => {
                            setActiveEpisodeId(ep.id);
                            setView('episode');
                          }}
                          className="p-8 bg-white rounded-[32px] border border-[#D1D1C1] hover:border-[#5A5A40] transition-all text-left shadow-sm hover:shadow-xl group relative cursor-pointer"
                        >
                          <button 
                            onClick={(e) => { e.stopPropagation(); deleteEpisode(activeSeason.id, activeChapter.id, ep.id); }}
                            className="absolute top-4 right-4 p-2 text-[#D1D1C1] hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 size={16} />
                          </button>
                          <span className="text-xs text-[#8E8E7E] font-sans mb-2 block">{activeChapter.title}</span>
                          <h3 className="text-2xl font-bold group-hover:text-[#5A5A40]">{ep.title}</h3>
                          <p className="text-sm text-[#8E8E7E] mt-4 line-clamp-3 font-sans leading-relaxed">
                            {ep.content || '내용이 없습니다.'}
                          </p>
                        </div>
                      ))}
                      <button 
                        onClick={() => addEpisode(activeSeason.id, activeChapter.id)}
                        className="p-8 border-2 border-dashed border-[#D1D1C1] rounded-[32px] hover:border-[#5A5A40] hover:bg-white transition-all flex flex-col items-center justify-center gap-2 text-[#8E8E7E] hover:text-[#5A5A40]"
                      >
                        <Plus size={32} />
                        <span className="font-sans font-bold text-sm">새 화 추가</span>
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}

              {view === 'episode' && activeSeason && activeChapter && activeEpisode && (
                <motion.div 
                  key="episode"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-8"
                >
                  <div className="space-y-2">
                    <label className="text-xs uppercase tracking-widest text-[#8E8E7E] font-sans font-bold">화 제목</label>
                    <input 
                      type="text" 
                      value={activeEpisode.title}
                      onChange={(e) => updateEpisode(activeSeason.id, activeChapter.id, activeEpisode.id, { title: e.target.value })}
                      className="w-full text-5xl font-bold bg-transparent border-none outline-none focus:ring-0"
                    />
                  </div>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <FileText size={18} className="text-[#5A5A40]" />
                          <label className="text-xs uppercase tracking-widest text-[#8E8E7E] font-sans font-bold">글콘티 내용</label>
                        </div>
                        <div className="text-xs text-[#8E8E7E] font-sans font-bold">
                          글자 수: {activeEpisode.content.length.toLocaleString()}
                        </div>
                      </div>
                      <textarea 
                        value={activeEpisode.content}
                        onChange={(e) => updateEpisode(activeSeason.id, activeChapter.id, activeEpisode.id, { content: e.target.value })}
                        className="w-full min-h-[300px] text-xl leading-[2] bg-white p-12 md:p-20 rounded-[60px] border border-[#D1D1C1] shadow-sm outline-none focus:border-[#5A5A40] transition-colors placeholder-[#D1D1C1] resize-none"
                        placeholder="여기에 글콘티를 작성하세요... (예: S#1. 학교 옥상 / 낮)"
                      />
                    </div>

                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <LayoutGrid size={18} className="text-[#5A5A40]" />
                          <label className="text-xs uppercase tracking-widest text-[#8E8E7E] font-sans font-bold">컷 구성</label>
                        </div>
                        <button 
                          onClick={() => addCut(activeSeason.id, activeChapter.id, activeEpisode.id)}
                          className="flex items-center gap-2 text-[#5A5A40] hover:underline font-sans font-bold text-sm"
                        >
                          <Plus size={16} /> 컷 추가
                        </button>
                      </div>
                      
                      <div className="space-y-4">
                        {activeEpisode.cuts?.map((cut, index) => (
                          <div key={cut.id} className="flex gap-4 group">
                            <div className="flex-shrink-0 w-12 h-12 bg-[#E6E6D6] rounded-full flex items-center justify-center font-bold text-[#5A5A40] font-sans text-xs">
                              {index + 1}컷
                            </div>
                            <div className="flex-1 relative">
                              <textarea 
                                value={cut.content}
                                onChange={(e) => updateCut(activeSeason.id, activeChapter.id, activeEpisode.id, cut.id, e.target.value)}
                                className="w-full min-h-[100px] bg-white p-6 rounded-[24px] border border-[#D1D1C1] shadow-sm outline-none focus:border-[#5A5A40] transition-colors placeholder-[#D1D1C1] resize-none font-sans"
                                placeholder={`${index + 1}컷 내용을 입력하세요...`}
                              />
                              <button 
                                onClick={() => deleteCut(activeSeason.id, activeChapter.id, activeEpisode.id, cut.id)}
                                className="absolute top-4 right-4 p-2 text-[#D1D1C1] hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                        ))}
                        {(!activeEpisode.cuts || activeEpisode.cuts.length === 0) && (
                          <div className="text-center py-12 border-2 border-dashed border-[#D1D1C1] rounded-[40px] text-[#8E8E7E] font-sans italic">
                            아직 추가된 컷이 없습니다. '컷 추가' 버튼을 눌러보세요.
                          </div>
                        )}
                      </div>
                    </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Floating Navigation */}
        <div className="absolute bottom-8 right-8 flex gap-3">
           {view !== 'project' && (
             <button 
              onClick={() => {
                if (view === 'episode') setView('chapter');
                else if (view === 'chapter') setView('season');
                else if (view === 'season') setView('project');
              }}
              className="w-16 h-16 bg-white border border-[#D1D1C1] rounded-full flex items-center justify-center shadow-xl hover:bg-[#F5F5F0] transition-colors"
             >
               <ChevronLeft size={28} />
             </button>
           )}
        </div>
      </main>

      {/* Mind Map Modal */}
      <AnimatePresence>
        {showMindMap && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 md:p-12"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-[#F5F5F0] w-full max-w-6xl h-full max-h-[80vh] rounded-[40px] shadow-2xl overflow-hidden flex flex-col border border-[#D1D1C1]"
            >
              <div className="p-8 border-b border-[#D1D1C1] flex justify-between items-center bg-white">
                <div>
                  <h2 className="text-3xl font-bold">마인드맵</h2>
                  <p className="text-[#8E8E7E] font-sans text-sm uppercase tracking-widest mt-1">프로젝트 구조 한눈에 보기</p>
                </div>
                <button onClick={() => setShowMindMap(false)} className="p-3 hover:bg-[#F5F5F0] rounded-full">
                  <X size={24} />
                </button>
              </div>
              
              <div className="flex-1 overflow-auto p-12 bg-[#F5F5F0]">
                <div className="flex flex-col items-center min-w-max">
                  {/* Root Project */}
                  <button 
                    onClick={() => { setView('project'); setShowMindMap(false); }}
                    className="bg-[#5A5A40] text-white px-8 py-4 rounded-full font-bold text-xl shadow-lg mb-16 relative hover:scale-105 transition-transform"
                  >
                    {activeProject.title}
                    <div className="absolute top-full left-1/2 w-px h-16 bg-[#D1D1C1]" />
                  </button>

                  {/* Seasons */}
                  <div className="flex gap-12 items-start">
                    {activeProject.seasons.map((s, sIdx) => (
                      <div key={s.id} className="flex flex-col items-center">
                        <button 
                          onClick={() => { setActiveSeasonId(s.id); setView('season'); setShowMindMap(false); }}
                          className="bg-white border-2 border-[#5A5A40] px-6 py-3 rounded-2xl font-bold shadow-md mb-12 relative hover:scale-105 transition-transform"
                        >
                          {s.title}
                          <div className="absolute top-full left-1/2 w-px h-12 bg-[#D1D1C1]" />
                        </button>

                        {/* Chapters */}
                        <div className="flex gap-6 items-start">
                          {s.chapters.map((c, cIdx) => (
                            <div key={c.id} className="flex flex-col items-center">
                              <button 
                                onClick={() => { setActiveSeasonId(s.id); setActiveChapterId(c.id); setView('chapter'); setShowMindMap(false); }}
                                className="bg-[#E6E6D6] px-4 py-2 rounded-xl font-bold text-sm shadow-sm mb-8 relative hover:scale-105 transition-transform"
                              >
                                {c.title}
                                <div className="absolute top-full left-1/2 w-px h-8 bg-[#D1D1C1]" />
                              </button>

                              {/* Episodes */}
                              <div className="flex flex-col gap-2">
                                {c.episodes.map(e => (
                                  <button 
                                    key={e.id} 
                                    onClick={() => { setActiveSeasonId(s.id); setActiveChapterId(c.id); setActiveEpisodeId(e.id); setView('episode'); setShowMindMap(false); }}
                                    className="bg-white px-3 py-1 rounded-lg text-xs border border-[#D1D1C1] shadow-sm hover:border-[#5A5A40] transition-colors"
                                  >
                                    {e.title}
                                  </button>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirm Modal */}
      <AnimatePresence>
        {confirmModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-[40px] p-10 max-w-md w-full shadow-2xl space-y-6"
            >
              <div className="space-y-2">
                <h3 className="text-2xl font-bold">{confirmModal.title}</h3>
                <p className="text-[#8E8E7E] font-sans">{confirmModal.message}</p>
              </div>
              <div className="flex gap-3 pt-4">
                <button 
                  onClick={() => setConfirmModal(null)}
                  className="flex-1 py-4 rounded-full border border-[#D1D1C1] font-sans font-bold hover:bg-[#F5F5F0] transition-colors"
                >
                  취소
                </button>
                <button 
                  onClick={() => {
                    confirmModal.onConfirm();
                    setConfirmModal(null);
                  }}
                  className="flex-1 py-4 rounded-full bg-red-500 text-white font-sans font-bold hover:bg-red-600 transition-colors shadow-lg shadow-red-200"
                >
                  삭제
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
