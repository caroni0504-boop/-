import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search,
  Tag,
  FolderPlus,
  Image as ImageIcon,
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
  ArrowRight,
  Maximize2,
  Minimize2,
  Download,
  Printer,
  Settings,
  Globe,
  Users,
  TrendingUp,
  CheckCircle,
  GripVertical,
  Camera,
  Upload,
  FileJson
} from 'lucide-react';
import { Project, Season, Chapter, Episode, EpisodeCut, TimelineNode, ReferenceCategory, ReferenceImage, Nation, Organization, Character } from './types';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';

const STORAGE_KEY = 'comic_script_projects_v2';

const SortableItem: React.FC<{ id: string; children: React.ReactNode }> = ({ id, children }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 'auto',
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {children}
    </div>
  );
};

const createInitialProject = (title: string = '새로운 프로젝트'): Project => ({
  id: Date.now().toString(),
  title,
  logline: '',
  synopsis: '',
  intent: '',
  message: '',
  genre: '',
  keywords: '',
  target: '',
  worldBasic: '',
  worldTerminology: '',
  worldAbilitySystem: '',
  worldOtherSettings: '',
  worldMap: '',
  worldRegions: '',
  worldOrgs: '',
  nations: [],
  organizations: [],
  relationshipImages: [],
  characters: [],
  storyActs: [
    { 
      id: 'act1', 
      title: '1막 (도입)', 
      chapters: [
        { id: 'act1-c1', title: '오프닝 이미지', content: '' },
        { id: 'act1-c2', title: '주제 제시', content: '' },
        { id: 'act1-c3', title: '설정', content: '' },
        { id: 'act1-c4', title: '기폭제', content: '' },
        { id: 'act1-c5', title: '토론', content: '' },
      ] 
    },
    { 
      id: 'act2', 
      title: '2막 (전개)', 
      chapters: [
        { id: 'act2-c1', title: '2막 진입', content: '' },
        { id: 'act2-c2', title: 'B 스토리', content: '' },
        { id: 'act2-c3', title: '재미와 놀이', content: '' },
        { id: 'act2-c4', title: '중간점', content: '' },
        { id: 'act2-c5', title: '악당이 다가오다', content: '' },
        { id: 'act2-c6', title: '모든 것을 잃다', content: '' },
        { id: 'act2-c7', title: '영혼의 어두운 밤', content: '' },
      ] 
    },
    { 
      id: 'act3', 
      title: '3막 (결말)', 
      chapters: [
        { id: 'act3-c1', title: '3막 진입', content: '' },
        { id: 'act3-c2', title: '피날레', content: '' },
        { id: 'act3-c3', title: '최종 이미지', content: '' },
      ] 
    },
  ],
  basicSettings: '',
  worldSettings: '',
  characterSettings: '',
  storyDevelopment: '',
  memo: '',
  progress: 0,
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
  ],
  referenceCategories: []
});

const AutoResizeTextarea = ({ 
  value, 
  onChange, 
  placeholder, 
  className = "",
  minHeight = "100px"
}: { 
  value: string; 
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void; 
  placeholder?: string;
  className?: string;
  minHeight?: string;
}) => {
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  React.useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [value]);

  return (
    <textarea
      ref={textareaRef}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={`w-full overflow-hidden transition-colors ${className}`}
      style={{ minHeight }}
    />
  );
};

export default function App() {
  const [projects, setProjects] = useState<Project[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Migration: Ensure all new fields are initialized for existing projects
      return parsed.map((p: any) => {
        const defaultProject = createInitialProject(p.title || '새로운 프로젝트');
        return {
          ...defaultProject,
          ...p,
          timeline: Array.isArray(p.timeline) ? p.timeline : [],
          relationshipImages: Array.isArray(p.relationshipImages) ? p.relationshipImages : [],
          characters: Array.isArray(p.characters) ? p.characters : [],
          storyActs: Array.isArray(p.storyActs) ? p.storyActs : defaultProject.storyActs,
          seasons: Array.isArray(p.seasons) ? p.seasons : defaultProject.seasons,
          nations: Array.isArray(p.nations) ? p.nations : [],
          organizations: Array.isArray(p.organizations) ? p.organizations : [],
          progress: typeof p.progress === 'number' ? p.progress : 0,
        };
      });
    }
    return [createInitialProject()];
  });

  const exportToJson = () => {
    try {
      const dataStr = JSON.stringify(projects, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      
      const exportFileDefaultName = `comic_script_backup_${new Date().toISOString().split('T')[0]}.json`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
    } catch (error) {
      console.error('Export Error:', error);
      alert('내보내기 중 오류가 발생했습니다.');
    }
  };

  const importFromJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (!Array.isArray(json)) {
          throw new Error('올바른 백업 파일 형식이 아닙니다.');
        }

        if (confirm('파일에서 프로젝트를 불러오시겠습니까? 기존 데이터와 병합됩니다.')) {
          setProjects(prev => {
            const merged = [...prev];
            json.forEach((newP: Project) => {
              const index = merged.findIndex(p => p.id === newP.id);
              if (index === -1) {
                merged.push(newP);
              } else {
                merged[index] = newP;
              }
            });
            return merged;
          });
          alert('프로젝트를 성공적으로 불러왔습니다.');
        }
      } catch (error) {
        console.error('Import Error:', error);
        alert('파일을 읽는 중 오류가 발생했습니다. 올바른 JSON 파일인지 확인해주세요.');
      }
    };
    reader.readAsText(file);
    // Reset input
    e.target.value = '';
  };

  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [activeSeasonId, setActiveSeasonId] = useState<string>('');
  const [activeChapterId, setActiveChapterId] = useState<string>('');
  const [activeEpisodeId, setActiveEpisodeId] = useState<string>('');
  
  const [view, setView] = useState<'project' | 'timeline' | 'season' | 'chapter' | 'episode' | 'basicSettings' | 'worldSettings' | 'characterSettings' | 'storyDevelopment' | 'seasonTreatments' | 'summaryView' | 'referenceBoard'>('project');
  const [searchTag, setSearchTag] = useState('');
  const [selectedImage, setSelectedImage] = useState<{ categoryId: string, image: ReferenceImage } | null>(null);
  const [storageMode, setStorageMode] = useState<'planning' | 'script'>('planning');
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 1024);
  const [showMindMap, setShowMindMap] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [tempTitle, setTempTitle] = useState('');
  const [worldTab, setWorldTab] = useState<'basic' | 'map' | 'regions' | 'orgs'>('basic');
  const [characterTab, setCharacterTab] = useState<'relationships' | 'list'>('relationships');
  const [confirmModal, setConfirmModal] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        delay: 500,
        tolerance: 10,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent, listKey: 'nations' | 'organizations' | 'characters') => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      const oldIndex = activeProject[listKey].findIndex((item: any) => item.id === active.id);
      const newIndex = activeProject[listKey].findIndex((item: any) => item.id === over?.id);
      const newItems = arrayMove(activeProject[listKey], oldIndex, newIndex);
      updateActiveProject({ [listKey]: newItems });
    }
  };

  const handleCutDragEnd = (event: DragEndEvent, seasonId: string, chapterId: string, episodeId: string) => {
    const { active, over } = event;
    if (active.id !== over?.id && activeProject) {
      const season = activeProject.seasons.find(s => s.id === seasonId);
      const chapter = season?.chapters.find(c => c.id === chapterId);
      const episode = chapter?.episodes.find(e => e.id === episodeId);
      if (episode && episode.cuts) {
        const oldIndex = episode.cuts.findIndex(item => item.id === active.id);
        const newIndex = episode.cuts.findIndex(item => item.id === over?.id);
        const newCuts = arrayMove(episode.cuts, oldIndex, newIndex) as EpisodeCut[];
        updateEpisode(seasonId, chapterId, episodeId, { cuts: newCuts });
      }
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, callback: (base64: string) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        callback(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleMultipleImagesUpload = (e: React.ChangeEvent<HTMLInputElement>, callback: (base64s: string[]) => void) => {
    const files = Array.from(e.target.files || []) as File[];
    const promises = files.map(file => {
      return new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
    });
    Promise.all(promises).then(callback);
  };

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

  const isPlanningView = storageMode === 'planning';

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

  const startEditing = (id: string, title: string) => {
    setEditingProjectId(id);
    setTempTitle(title);
  };

  const saveTitle = (id: string) => {
    if (tempTitle.trim()) {
      setProjects(prev => prev.map(p => p.id === id ? { ...p, title: tempTitle.trim() } : p));
    }
    setEditingProjectId(null);
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
    let contentHtml = '';
    
    if (isPlanningView) {
      contentHtml = `
        <div style="margin-bottom: 60px; background: white; padding: 40px; border-radius: 32px; box-shadow: 0 4px 20px rgba(0,0,0,0.05); border: 1px solid #D1D1C1;">
          <label style="display: block; font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em; color: #8E8E7E; font-weight: bold; margin-bottom: 8px;">PROJECT OVERVIEW</label>
          <h1 style="font-size: 48px; margin: 0 0 16px 0; font-weight: 300; line-height: 1.1;">${activeProject.title}</h1>
          <div style="height: 1px; background: #D1D1C1; margin: 24px 0;"></div>
          <p style="font-size: 18px; line-height: 1.6; color: #4A4A4A; font-style: italic;">"${activeProject.logline || ''}"</p>
          
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-top: 32px;">
            ${[
              { label: '장르', value: activeProject.genre },
              { label: '키워드', value: activeProject.keywords },
              { label: '타겟', value: activeProject.target },
              { label: '기획 의도', value: activeProject.intent },
              { label: '전달 메시지', value: activeProject.message }
            ].map(f => `
              <div>
                <span style="font-weight: bold; color: #8E8E7E; font-size: 11px; text-transform: uppercase;">${f.label}:</span>
                <span style="display: block; margin-top: 4px; font-size: 15px;">${f.value || ''}</span>
              </div>
            `).join('')}
          </div>
          <div style="margin-top: 24px;">
            <span style="font-weight: bold; color: #8E8E7E; font-size: 11px; text-transform: uppercase;">시놉시스:</span>
            <div style="margin-top: 8px; font-size: 16px; line-height: 1.6; white-space: pre-wrap;">${activeProject.synopsis || ''}</div>
          </div>
        </div>
        
        <div style="margin-bottom: 60px; background: white; padding: 40px; border-radius: 32px; box-shadow: 0 4px 20px rgba(0,0,0,0.05); border: 1px solid #D1D1C1;">
          <h2 style="font-size: 32px; color: #1A1A1A; margin-bottom: 32px; font-weight: 300;">타임라인</h2>
          <div style="position: relative; padding-left: 40px;">
            <div style="position: absolute; left: 19px; top: 0; bottom: 0; width: 2px; background: #D1D1C1;"></div>
            ${activeProject.timeline.length > 0 ? activeProject.timeline.map(node => `
              <div style="margin-bottom: 32px; position: relative;">
                <div style="position: absolute; left: -27px; top: 8px; width: 16px; height: 16px; border-radius: 50%; background: #5A5A40; border: 4px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.1);"></div>
                <h3 style="font-size: 22px; margin: 0; font-weight: 600;">${node.title}</h3>
                <p style="font-size: 16px; color: #8E8E7E; margin: 8px 0 0 0; line-height: 1.5;">${node.description}</p>
              </div>
            `).join('') : '<p style="color: #8E8E7E; font-style: italic;">등록된 타임라인이 없습니다.</p>'}
          </div>
        </div>

        <div style="margin-bottom: 60px; background: white; padding: 40px; border-radius: 32px; box-shadow: 0 4px 20px rgba(0,0,0,0.05); border: 1px solid #D1D1C1;">
          <h2 style="font-size: 32px; color: #1A1A1A; margin-bottom: 32px; font-weight: 300;">세계관 설정</h2>
          <div style="display: grid; grid-cols-1 gap-8;">
            ${[
              { label: '기본 세계관', value: activeProject.worldBasic },
              { label: '용어 설정', value: activeProject.worldTerminology },
              { label: '능력 체계', value: activeProject.worldAbilitySystem },
              { label: '기타 설정', value: activeProject.worldOtherSettings },
              { label: '지리/지역', value: activeProject.worldRegions },
              { label: '조직/단체', value: activeProject.worldOrgs }
            ].map(f => `
              <div style="margin-bottom: 24px; border-bottom: 1px solid #F5F5F0; pb-4;">
                <label style="display: block; font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: #8E8E7E; font-weight: bold; margin-bottom: 8px;">${f.label}</label>
                <div style="font-size: 16px; line-height: 1.6; color: #1A1A1A; white-space: pre-wrap; min-height: 24px;">${f.value || ''}</div>
              </div>
            `).join('')}
          </div>
        </div>

        <div style="margin-bottom: 60px; background: white; padding: 40px; border-radius: 32px; box-shadow: 0 4px 20px rgba(0,0,0,0.05); border: 1px solid #D1D1C1;">
          <h2 style="font-size: 32px; color: #1A1A1A; margin-bottom: 32px; font-weight: 300;">캐릭터 설정</h2>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px;">
            ${activeProject.characters.length > 0 ? activeProject.characters.map(char => `
              <div style="padding: 24px; background: #F5F5F0; border-radius: 24px;">
                <h3 style="font-size: 20px; margin: 0 0 8px 0; font-weight: 600;">${char.name}</h3>
                <p style="font-size: 14px; color: #5A5A40; margin-bottom: 12px; font-weight: bold;">${char.role}</p>
                <div style="font-size: 14px; color: #4A4A4A; space-y-2">
                  ${[
                    { label: '성격', value: char.personality },
                    { label: '외양', value: char.appearance },
                    { label: '능력', value: char.ability },
                    { label: '특이사항', value: char.specialNotes }
                  ].map(f => `
                    <div style="margin-bottom: 8px;">
                      <span style="font-weight: bold; color: #8E8E7E; font-size: 11px; text-transform: uppercase;">${f.label}:</span>
                      <span style="display: block; margin-top: 2px;">${f.value || ''}</span>
                    </div>
                  `).join('')}
                  ${(char.infoItems || []).map(item => `
                    <div style="margin-bottom: 8px;">
                      <span style="font-weight: bold; color: #8E8E7E; font-size: 11px; text-transform: uppercase;">${item.label}:</span>
                      <span style="display: block; margin-top: 2px;">${item.value || ''}</span>
                    </div>
                  `).join('')}
                </div>
              </div>
            `).join('') : '<p style="color: #8E8E7E; font-style: italic;">등록된 캐릭터가 없습니다.</p>'}
          </div>
        </div>
      `;
    } else {
      activeProject.seasons.forEach(season => {
        contentHtml += `
          <div style="margin-bottom: 60px;">
            <div style="background: white; padding: 40px; border-radius: 32px; box-shadow: 0 4px 20px rgba(0,0,0,0.05); border: 1px solid #D1D1C1; margin-bottom: 40px;">
              <label style="display: block; font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em; color: #8E8E7E; font-weight: bold; margin-bottom: 8px;">SEASON TREATMENT</label>
              <h2 style="font-size: 40px; color: #1A1A1A; margin: 0 0 24px 0; font-weight: 300;">${season.title}</h2>
              <div style="background: #F5F5F0; padding: 32px; border-radius: 24px; font-size: 20px; line-height: 1.8; color: #1A1A1A;">
                ${season.treatment || ''}
              </div>
            </div>
            
            ${season.chapters.length > 0 ? season.chapters.map(chapter => `
              <div style="margin-bottom: 40px; padding-left: 20px;">
                <div style="display: flex; align-items: center; gap: 16px; margin-bottom: 24px;">
                  <div style="height: 1px; flex: 1; background: #D1D1C1;"></div>
                  <h3 style="font-size: 24px; color: #5A5A40; font-weight: 400; text-transform: uppercase; letter-spacing: 0.1em;">${chapter.title}</h3>
                  <div style="height: 1px; flex: 1; background: #D1D1C1;"></div>
                </div>
                
                ${chapter.episodes.length > 0 ? chapter.episodes.map(episode => `
                  <div style="margin-bottom: 32px; background: white; padding: 32px; border-radius: 24px; border: 1px solid #E6E6D6; box-shadow: 0 2px 10px rgba(0,0,0,0.02);">
                    <h4 style="font-size: 22px; margin: 0 0 16px 0; color: #1A1A1A; font-weight: 600;">${episode.title}</h4>
                    <p style="font-size: 17px; line-height: 1.7; color: #4A4A4A; margin-bottom: 24px;">${episode.content || ''}</p>
                    
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
                    ` : '<p style="color: #8E8E7E; font-style: italic; font-size: 12px;">등록된 컷이 없습니다.</p>'}
                  </div>
                `).join('') : '<p style="color: #8E8E7E; font-style: italic;">등록된 에피소드가 없습니다.</p>'}
              </div>
            `).join('') : '<p style="color: #8E8E7E; font-style: italic;">등록된 챕터가 없습니다.</p>'}
          </div>
        `;
      });
    }

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
      <div className="min-h-screen bg-[#F5F5F0] transition-colors duration-500 p-8 md:p-16 font-serif">
        <div className="max-w-6xl mx-auto space-y-12">
          <header className={`flex flex-col md:flex-row justify-between items-start md:items-end border-b pb-8 gap-6 transition-colors ${storageMode === 'planning' ? 'border-[#3E5C45]/30' : 'border-[#5A5A40]/30'}`}>
            <div>
              <h1 className="text-6xl font-bold tracking-tighter text-[#1A1A1A]">
                {storageMode === 'planning' ? '기획' : '글콘티'}
              </h1>
              <p className="text-[#8E8E7E] mt-4 font-sans uppercase tracking-widest text-sm">내 프로젝트 보관함</p>
            </div>
            <div className="flex items-center gap-4 w-full md:w-auto">
              <div className="flex flex-col items-end gap-2">
                <div className="flex gap-2">
                  {/* File Export/Import (No Firebase) */}
                  <div className="flex bg-white rounded-full border border-[#D1D1C1] p-1 shadow-sm">
                    <button 
                      onClick={exportToJson}
                      className="flex items-center gap-2 px-4 py-2 text-[#3E5C45] hover:bg-[#F5F5F0] rounded-full transition-colors font-sans font-bold text-xs"
                      title="파일로 내보내기 (JSON)"
                    >
                      <Upload size={16} />
                      <span>내보내기</span>
                    </button>
                    <div className="w-[1px] h-4 bg-[#D1D1C1] self-center mx-1"></div>
                    <label className="flex items-center gap-2 px-4 py-2 text-[#5A5A40] hover:bg-[#F5F5F0] rounded-full transition-colors cursor-pointer font-sans font-bold text-xs" title="파일에서 불러오기 (JSON)">
                      <Download size={16} />
                      <span>불러오기</span>
                      <input type="file" accept=".json" onChange={importFromJson} className="hidden" />
                    </label>
                  </div>
                </div>
                <p className="text-[10px] text-[#8E8E7E] font-sans italic hidden md:block">파일 내보내기/불러오기를 통해 기기 간 이동이 가능합니다.</p>
              </div>

              <div className="flex p-1 rounded-full shadow-inner bg-[#E6E6D6]">
                <button 
                  onClick={() => setStorageMode('planning')}
                  className={`flex items-center gap-2 px-6 py-2 rounded-full font-sans font-bold text-sm transition-all ${storageMode === 'planning' ? 'bg-[#3E5C45] text-white shadow-md' : 'text-[#8E8E7E] hover:text-[#3E5C45]'}`}
                >
                  <LayoutGrid size={16} /> 기획
                </button>
                <button 
                  onClick={() => setStorageMode('script')}
                  className={`flex items-center gap-2 px-6 py-2 rounded-full font-sans font-bold text-sm transition-all ${storageMode === 'script' ? 'bg-[#5A5A40] text-white shadow-md' : 'text-[#8E8E7E] hover:text-[#5A5A40]'}`}
                >
                  <Edit3 size={16} /> 글콘티
                </button>
              </div>
              <button 
                onClick={addProject}
                className={`flex items-center gap-2 text-white px-6 py-3 rounded-full transition-all shadow-lg font-sans font-bold ${storageMode === 'planning' ? 'bg-[#3E5C45] hover:bg-[#2D4A35]' : 'bg-[#5A5A40] hover:bg-[#4A4A30]'}`}
              >
                <Plus size={20} /> 새 프로젝트
              </button>
            </div>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {projects.map(p => (
              <motion.div 
                key={p.id}
                whileHover={{ y: -5 }}
                className={`p-8 rounded-[32px] border transition-all group relative overflow-hidden bg-white ${storageMode === 'planning' ? 'border-[#3E5C45]/20 hover:border-[#3E5C45]/50' : 'border-[#5A5A40]/20 hover:border-[#5A5A40]/50'}`}
              >
                <div className="space-y-4 relative z-10">
                  <div className="flex justify-between items-start">
                    <div className={`p-2 rounded-xl ${storageMode === 'planning' ? 'bg-[#3E5C45] text-white' : 'bg-[#5A5A40] text-white'}`}>
                      {storageMode === 'planning' ? <BookOpen size={20} /> : <Edit3 size={20} />}
                    </div>
                    <div className="flex gap-1">
                      <button 
                        onClick={(e) => { e.stopPropagation(); startEditing(p.id, p.title); }}
                        className="p-2 text-[#8E8E7E] hover:text-[#1A1A1A] transition-colors"
                      >
                        <Edit3 size={18} />
                      </button>
                      <button 
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          e.preventDefault();
                          deleteProject(p.id); 
                        }}
                        className="p-2 text-[#8E8E7E] hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>

                  {editingProjectId === p.id ? (
                    <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                      <input 
                        autoFocus
                        value={tempTitle}
                        onChange={(e) => setTempTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') saveTitle(p.id);
                          if (e.key === 'Escape') setEditingProjectId(null);
                        }}
                        onBlur={() => saveTitle(p.id)}
                        className="bg-[#F5F5F0] text-[#1A1A1A] px-3 py-1 rounded-lg border border-[#3E5C45] w-full font-bold text-xl"
                      />
                    </div>
                  ) : (
                    <h2 className="text-2xl font-bold leading-tight text-[#1A1A1A]">{p.title}</h2>
                  )}
                  
                  {storageMode === 'planning' ? (
                    <p className="text-[#8E8E7E] text-sm line-clamp-3 font-sans italic min-h-[60px]">
                      {p.logline || '로그라인이 작성되지 않았습니다.'}
                    </p>
                  ) : (
                    <div className="space-y-3 min-h-[60px]">
                      <div className="flex items-center gap-2 text-xs font-sans text-[#8E8E7E]">
                        <Layers size={14} />
                        <span>시즌 {p.seasons.length}개</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs font-sans text-[#8E8E7E]">
                        <Edit3 size={14} />
                        <span>총 {p.seasons.reduce((acc, s) => acc + s.chapters.reduce((acc2, c) => acc2 + c.episodes.length, 0), 0)}화 작성 중</span>
                      </div>
                    </div>
                  )}

                  <div className="pt-6">
                    <button 
                      onClick={() => {
                        setActiveProjectId(p.id);
                        if (storageMode === 'planning') {
                          setView('project');
                        } else {
                          const firstSeason = p.seasons[0];
                          const firstChapter = firstSeason?.chapters[0];
                          const firstEpisode = firstChapter?.episodes[0];
                          
                          if (firstEpisode) {
                            setActiveSeasonId(firstSeason.id);
                            setActiveChapterId(firstChapter.id);
                            setActiveEpisodeId(firstEpisode.id);
                            setView('episode');
                          } else if (firstChapter) {
                            setActiveSeasonId(firstSeason.id);
                            setActiveChapterId(firstChapter.id);
                            setView('chapter');
                          } else if (firstSeason) {
                            setActiveSeasonId(firstSeason.id);
                            setView('season');
                          } else {
                            setView('project');
                          }
                        }
                      }}
                      className={`w-full py-4 rounded-2xl font-sans font-bold text-sm transition-all flex items-center justify-center gap-2 ${storageMode === 'planning' ? 'bg-[#3E5C45] text-white hover:bg-[#2D4A35]' : 'bg-[#5A5A40] text-white hover:bg-[#4A4A30]'}`}
                    >
                      {storageMode === 'planning' ? '기획 열기' : '글콘티 열기'}
                      <ArrowRight size={16} />
                    </button>
                  </div>
                </div>
                
                {/* Background Accent */}
                <div className={`absolute -right-8 -bottom-8 w-32 h-32 rounded-full opacity-[0.05] transition-all group-hover:scale-150 ${storageMode === 'planning' ? 'bg-[#3E5C45]' : 'bg-[#5A5A40]'}`} />
              </motion.div>
            ))}
          </div>
        </div>

        {/* Confirm Modal for Storage View */}
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
            <div className="p-6 border-b border-[#D1D1C1] space-y-4">
              <button 
                onClick={() => setActiveProjectId(null)}
                className={`flex items-center gap-2 text-sm font-sans font-bold hover:underline ${isPlanningView ? 'text-[#3E5C45]' : 'text-[#5A5A40]'}`}
              >
                <ArrowLeft size={16} /> 목록으로
              </button>
              
              <div className="flex bg-[#F5F5F0] p-1 rounded-xl shadow-inner">
                <button 
                  onClick={() => {
                    setStorageMode('planning');
                    setView('project');
                  }}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg font-sans font-bold text-xs transition-all ${isPlanningView ? 'bg-white text-[#3E5C45] shadow-sm' : 'text-[#8E8E7E] hover:text-[#3E5C45]'}`}
                >
                  <LayoutGrid size={14} /> 기획
                </button>
                <button 
                  onClick={() => {
                    setStorageMode('script');
                    const firstSeason = activeProject.seasons[0];
                    if (firstSeason) {
                      setActiveSeasonId(firstSeason.id);
                      setView('season');
                    } else {
                      setView('season');
                    }
                  }}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg font-sans font-bold text-xs transition-all ${!isPlanningView ? 'bg-white text-[#5A5A40] shadow-sm' : 'text-[#8E8E7E] hover:text-[#5A5A40]'}`}
                >
                  <Edit3 size={14} /> 글콘티
                </button>
              </div>
            </div>

            <div className="p-6">
              <h1 className={`text-2xl font-bold tracking-tight ${isPlanningView ? 'text-[#3E5C45]' : 'text-[#5A5A40]'}`}>
                {isPlanningView ? '기획' : '글콘티'}
              </h1>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {isPlanningView ? (
                <div className="space-y-2">
                  <button 
                    onClick={() => setView('project')}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors ${view === 'project' ? 'bg-[#3E5C45] text-white' : 'hover:bg-[#F5F5F0]'}`}
                  >
                    <BookOpen size={18} />
                    <span className="font-medium">프로젝트 정보</span>
                  </button>
                  <button 
                    onClick={() => setView('basicSettings')}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors ${view === 'basicSettings' ? 'bg-[#3E5C45] text-white' : 'hover:bg-[#F5F5F0]'}`}
                  >
                    <Settings size={18} />
                    <span className="font-medium">기본 설정</span>
                  </button>
                  <button 
                    onClick={() => setView('worldSettings')}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors ${view === 'worldSettings' ? 'bg-[#3E5C45] text-white' : 'hover:bg-[#F5F5F0]'}`}
                  >
                    <Globe size={18} />
                    <span className="font-medium">세계관 설정</span>
                  </button>
                  <button 
                    onClick={() => setView('characterSettings')}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors ${view === 'characterSettings' ? 'bg-[#3E5C45] text-white' : 'hover:bg-[#F5F5F0]'}`}
                  >
                    <Users size={18} />
                    <span className="font-medium">캐릭터 설정</span>
                  </button>
                  <button 
                    onClick={() => setView('storyDevelopment')}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors ${view === 'storyDevelopment' ? 'bg-[#3E5C45] text-white' : 'hover:bg-[#F5F5F0]'}`}
                  >
                    <TrendingUp size={18} />
                    <span className="font-medium">스토리 전개</span>
                  </button>
                  <button 
                    onClick={() => setView('referenceBoard')}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors ${view === 'referenceBoard' ? 'bg-[#3E5C45] text-white' : 'hover:bg-[#F5F5F0]'}`}
                  >
                    <ImageIcon size={18} />
                    <span className="font-medium">레퍼런스 보드</span>
                  </button>
                  <div className="h-px bg-[#D1D1C1] my-2 mx-3" />
                  <button 
                    onClick={() => setView('timeline')}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors ${view === 'timeline' ? 'bg-[#3E5C45] text-white' : 'hover:bg-[#F5F5F0]'}`}
                  >
                    <LayoutGrid size={18} />
                    <span className="font-medium">타임라인</span>
                  </button>
                  <button 
                    onClick={() => setShowMindMap(true)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors ${showMindMap ? 'bg-[#3E5C45] text-white' : 'hover:bg-[#F5F5F0] text-[#3E5C45]'}`}
                  >
                    <Network size={18} />
                    <span className="font-medium">마인드맵 보기</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center px-3 mb-2">
                      <span className="text-xs uppercase tracking-widest text-[#8E8E7E] font-sans font-bold">시작하기</span>
                    </div>
                    <button 
                      onClick={() => setShowMindMap(true)}
                      className="w-full flex items-center gap-3 p-3 rounded-xl transition-colors hover:bg-[#F5F5F0]"
                    >
                      <Network size={18} />
                      <span className="font-medium">마인드맵 보기</span>
                    </button>
                    <button 
                      onClick={() => setView('timeline')}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors ${view === 'timeline' ? 'bg-[#5A5A40] text-white' : 'hover:bg-[#F5F5F0]'}`}
                    >
                      <LayoutGrid size={18} />
                      <span className="font-medium">타임라인</span>
                    </button>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center px-3 mb-2">
                      <span className="text-xs uppercase tracking-widest text-[#8E8E7E] font-sans font-bold">시즌</span>
                      <div className="flex items-center gap-1">
                        <button 
                          onClick={() => setView('seasonTreatments')}
                          className={`p-1 rounded-full transition-colors ${view === 'seasonTreatments' ? 'bg-[#5A5A40] text-white' : 'hover:bg-[#F5F5F0] text-[#8E8E7E]'}`}
                          title="시즌별 트리트먼트 모아보기"
                        >
                          <BookOpen size={16} />
                        </button>
                        <button onClick={addSeason} className="p-1 hover:bg-[#F5F5F0] rounded-full text-[#5A5A40]">
                          <Plus size={16} />
                        </button>
                      </div>
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
                </div>
              )}

              <div className="mt-auto pt-6 border-t border-[#D1D1C1]">
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
              <button 
                onClick={() => setView('project')}
                className="hover:text-[#3E5C45] hover:underline transition-colors"
              >
                {activeProject.title}
              </button>
              {view !== 'project' && (
                <>
                  <ChevronRight size={14} className="hidden md:inline" />
                  <span className="capitalize">
                    {view === 'basicSettings' ? '기본 설정' : 
                     view === 'worldSettings' ? '세계관 설정' : 
                     view === 'characterSettings' ? '캐릭터 설정' : 
                     view === 'storyDevelopment' ? '스토리 전개' : 
                     view === 'timeline' ? '타임라인' :
                     activeSeason?.title}
                  </span>
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
            <button 
              onClick={() => setShowMindMap(true)}
              className="p-2 hover:bg-[#F5F5F0] rounded-lg text-[#5A5A40]"
              title="마인드맵 보기"
            >
              <Network size={20} />
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
                  className="space-y-12"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-[32px] border border-[#D1D1C1] shadow-sm">
                    <div className="space-y-4 flex-1">
                      <div className="flex justify-between items-center">
                        <label className="text-xs uppercase tracking-widest text-[#8E8E7E] font-sans font-bold">프로젝트 진행도</label>
                        <div className="flex items-center gap-1">
                          <input 
                            type="number"
                            min="0"
                            max="100"
                            value={activeProject.progress || 0}
                            onChange={(e) => updateActiveProject({ progress: Math.min(100, Math.max(0, parseInt(e.target.value) || 0)) })}
                            className="w-12 text-right font-bold text-[#3E5C45] bg-transparent border-none outline-none focus:ring-0 p-0"
                          />
                          <span className="font-bold text-[#3E5C45]">%</span>
                        </div>
                      </div>
                        <div className="relative h-4 mt-4 flex items-center bg-[#E6E6D6] rounded-full overflow-hidden border border-[#D1D1C1]">
                          <div 
                            className="absolute inset-y-0 left-0 bg-[#3E5C45] transition-all duration-300"
                            style={{ width: `${activeProject.progress || 0}%` }}
                          />
                          <input 
                            type="range"
                            min="0"
                            max="100"
                            value={activeProject.progress || 0}
                            onChange={(e) => updateActiveProject({ progress: parseInt(e.target.value) })}
                            className="absolute inset-0 w-full h-full cursor-pointer z-10 accent-[#3E5C45]"
                          />
                        </div>
                    </div>
                  </div>

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

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <label className="text-xs uppercase tracking-widest text-[#8E8E7E] font-sans font-bold">로그라인</label>
                      <p className="text-lg text-[#4A4A4A] leading-relaxed italic">
                        {activeProject.logline || '로그라인이 없습니다.'}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs uppercase tracking-widest text-[#8E8E7E] font-sans font-bold">장르 / 키워드</label>
                      <p className="text-lg text-[#4A4A4A] leading-relaxed">
                        {activeProject.genre || '장르 미정'} · {activeProject.keywords || '키워드 없음'}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs uppercase tracking-widest text-[#8E8E7E] font-sans font-bold">요약 시놉시스</label>
                    <p className="text-base text-[#4A4A4A] leading-relaxed whitespace-pre-wrap">
                      {activeProject.synopsis || '시놉시스가 없습니다.'}
                    </p>
                  </div>

                  {/* Memo Section */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <FileText size={18} className="text-[#3E5C45]" />
                      <label className="text-xs uppercase tracking-widest text-[#8E8E7E] font-sans font-bold">프로젝트 메모</label>
                    </div>
                    <AutoResizeTextarea 
                      value={activeProject.memo || ''}
                      onChange={(e) => updateActiveProject({ memo: e.target.value })}
                      className="w-full text-lg leading-relaxed bg-white p-10 rounded-[40px] border border-[#D1D1C1] shadow-sm outline-none focus:border-[#3E5C45] transition-colors placeholder-[#D1D1C1] resize-none"
                      placeholder="자유롭게 메모를 작성하세요..."
                      minHeight="300px"
                    />
                  </div>
                </motion.div>
              )}

              {view === 'basicSettings' && (
                <motion.div 
                  key="basicSettings"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-12"
                >
                  <div className="flex items-center gap-3">
                    <Settings size={32} className="text-[#3E5C45]" />
                    <h2 className="text-4xl font-bold">기본 설정</h2>
                  </div>
                  
                  <div className="bg-white p-10 rounded-[40px] border border-[#D1D1C1] shadow-sm space-y-8">
                    <div className="space-y-2">
                      <label className="text-xs uppercase tracking-widest text-[#8E8E7E] font-sans font-bold">작품 제목</label>
                      <input 
                        type="text" 
                        value={activeProject.title}
                        onChange={(e) => updateActiveProject({ title: e.target.value })}
                        className="w-full text-4xl font-bold bg-transparent border-none outline-none focus:ring-0 placeholder-[#D1D1C1]"
                        placeholder="제목을 입력하세요"
                      />
                    </div>
                    <div className="h-px bg-[#D1D1C1]/30" />
                    <div className="space-y-2">
                      <label className="text-xs uppercase tracking-widest text-[#8E8E7E] font-sans font-bold">로그라인</label>
                      <AutoResizeTextarea 
                        value={activeProject.logline}
                        onChange={(e) => updateActiveProject({ logline: e.target.value })}
                        className="w-full text-xl bg-transparent border-none outline-none focus:ring-0 placeholder-[#D1D1C1] resize-none italic"
                        placeholder="한 문장으로 작품을 설명하세요"
                        minHeight="60px"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <label className="text-xs uppercase tracking-widest text-[#8E8E7E] font-sans font-bold">기획 의도</label>
                      <AutoResizeTextarea 
                        value={activeProject.intent}
                        onChange={(e) => updateActiveProject({ intent: e.target.value })}
                        className="w-full text-lg leading-relaxed bg-white p-8 rounded-3xl border border-[#D1D1C1] outline-none focus:border-[#3E5C45] transition-colors placeholder-[#D1D1C1] resize-none"
                        placeholder="작품을 기획하게 된 동기와 목표를 작성하세요"
                        minHeight="150px"
                      />
                    </div>
                    <div className="space-y-4">
                      <label className="text-xs uppercase tracking-widest text-[#8E8E7E] font-sans font-bold">핵심 메시지</label>
                      <AutoResizeTextarea 
                        value={activeProject.message}
                        onChange={(e) => updateActiveProject({ message: e.target.value })}
                        className="w-full text-lg leading-relaxed bg-white p-8 rounded-3xl border border-[#D1D1C1] outline-none focus:border-[#3E5C45] transition-colors placeholder-[#D1D1C1] resize-none"
                        placeholder="독자에게 전달하고 싶은 핵심 메시지를 작성하세요"
                        minHeight="150px"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="space-y-2">
                      <label className="text-xs uppercase tracking-widest text-[#8E8E7E] font-sans font-bold">장르</label>
                      <input 
                        type="text" 
                        value={activeProject.genre}
                        onChange={(e) => updateActiveProject({ genre: e.target.value })}
                        className="w-full text-lg bg-white p-6 rounded-2xl border border-[#D1D1C1] outline-none focus:border-[#3E5C45] transition-colors"
                        placeholder="예: 판타지, 로맨스"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs uppercase tracking-widest text-[#8E8E7E] font-sans font-bold">키워드</label>
                      <input 
                        type="text" 
                        value={activeProject.keywords}
                        onChange={(e) => updateActiveProject({ keywords: e.target.value })}
                        className="w-full text-lg bg-white p-6 rounded-2xl border border-[#D1D1C1] outline-none focus:border-[#3E5C45] transition-colors"
                        placeholder="예: 성장물, 복수, 마법"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs uppercase tracking-widest text-[#8E8E7E] font-sans font-bold">타겟층</label>
                      <input 
                        type="text" 
                        value={activeProject.target}
                        onChange={(e) => updateActiveProject({ target: e.target.value })}
                        className="w-full text-lg bg-white p-6 rounded-2xl border border-[#D1D1C1] outline-none focus:border-[#3E5C45] transition-colors"
                        placeholder="예: 20대 여성, 판타지 마니아"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="text-xs uppercase tracking-widest text-[#8E8E7E] font-sans font-bold">요약 시놉시스</label>
                    <AutoResizeTextarea 
                      value={activeProject.synopsis}
                      onChange={(e) => updateActiveProject({ synopsis: e.target.value })}
                      className="w-full text-lg leading-relaxed bg-white p-8 rounded-3xl border border-[#D1D1C1] outline-none focus:border-[#3E5C45] transition-colors placeholder-[#D1D1C1] resize-none"
                      placeholder="작품의 전체적인 줄거리를 요약하세요"
                      minHeight="150px"
                    />
                  </div>
                </motion.div>
              )}

              {view === 'worldSettings' && (
                <motion.div 
                  key="worldSettings"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-8"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Globe size={32} className="text-[#3E5C45]" />
                      <h2 className="text-4xl font-bold">세계관 설정</h2>
                    </div>
                  </div>

                  {/* Tabs */}
                  <div className="flex gap-2 p-1 bg-[#F5F5F0] rounded-2xl w-fit">
                    {[
                      { id: 'basic', label: '기본 세계관' },
                      { id: 'map', label: '지도' },
                      { id: 'regions', label: '국가/지역' },
                      { id: 'orgs', label: '조직/단체' }
                    ].map(tab => (
                      <button
                        key={tab.id}
                        onClick={() => setWorldTab(tab.id as any)}
                        className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${worldTab === tab.id ? 'bg-[#3E5C45] text-white shadow-md' : 'text-[#8E8E7E] hover:bg-white'}`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  <div className="min-h-[500px]">
                    {worldTab === 'basic' && (
                      <div className="space-y-8">
                        <div className="space-y-4">
                          <label className="text-xs uppercase tracking-widest text-[#8E8E7E] font-sans font-bold">기본 세계관</label>
                          <AutoResizeTextarea 
                            value={activeProject.worldBasic}
                            onChange={(e) => updateActiveProject({ worldBasic: e.target.value })}
                            className="w-full min-h-[200px] text-lg leading-relaxed bg-white p-6 rounded-3xl border border-[#B1B1A1] outline-none focus:border-[#3E5C45] transition-colors placeholder-[#D1D1C1] resize-none"
                            placeholder="시대 배경, 장소, 사회 규칙 등 기본 세계관을 상세히 설정하세요..."
                          />
                        </div>
                        <div className="space-y-4">
                          <label className="text-xs uppercase tracking-widest text-[#8E8E7E] font-sans font-bold">용어 정리</label>
                          <AutoResizeTextarea 
                            value={activeProject.worldTerminology}
                            onChange={(e) => updateActiveProject({ worldTerminology: e.target.value })}
                            className="w-full min-h-[150px] text-lg leading-relaxed bg-white p-6 rounded-3xl border border-[#B1B1A1] outline-none focus:border-[#3E5C45] transition-colors placeholder-[#D1D1C1] resize-none"
                            placeholder="작품 고유의 용어나 개념을 정의하세요..."
                          />
                        </div>
                        <div className="space-y-4">
                          <label className="text-xs uppercase tracking-widest text-[#8E8E7E] font-sans font-bold">능력 시스템</label>
                          <AutoResizeTextarea 
                            value={activeProject.worldAbilitySystem}
                            onChange={(e) => updateActiveProject({ worldAbilitySystem: e.target.value })}
                            className="w-full min-h-[150px] text-lg leading-relaxed bg-white p-6 rounded-3xl border border-[#B1B1A1] outline-none focus:border-[#3E5C45] transition-colors placeholder-[#D1D1C1] resize-none"
                            placeholder="마법, 초능력 등 작품 내 능력 체계를 설정하세요..."
                          />
                        </div>
                        <div className="space-y-4">
                          <label className="text-xs uppercase tracking-widest text-[#8E8E7E] font-sans font-bold">기타 설정</label>
                          <AutoResizeTextarea 
                            value={activeProject.worldOtherSettings}
                            onChange={(e) => updateActiveProject({ worldOtherSettings: e.target.value })}
                            className="w-full min-h-[150px] text-lg leading-relaxed bg-white p-6 rounded-3xl border border-[#B1B1A1] outline-none focus:border-[#3E5C45] transition-colors placeholder-[#D1D1C1] resize-none"
                            placeholder="그 외 세계관 관련 추가 설정을 작성하세요..."
                          />
                        </div>
                      </div>
                    )}
                    {worldTab === 'map' && (
                      <div className="space-y-6">
                        <div className="flex items-center justify-between">
                          <label className="text-xs uppercase tracking-widest text-[#8E8E7E] font-sans font-bold">세계관 지도</label>
                          <label className="cursor-pointer bg-[#3E5C45] text-white px-4 py-2 rounded-full text-sm font-bold hover:bg-[#2E4C35] transition-colors">
                            <Download size={16} className="inline mr-2" /> 지도 업로드
                            <input 
                              type="file" 
                              className="hidden" 
                              accept="image/*"
                              onChange={(e) => handleImageUpload(e, (base64) => updateActiveProject({ worldMap: base64 }))}
                            />
                          </label>
                        </div>
                        {activeProject.worldMap ? (
                          <div className="relative group">
                            <img src={activeProject.worldMap} alt="World Map" className="w-full rounded-2xl border border-[#D1D1C1]" />
                            <button 
                              onClick={() => updateActiveProject({ worldMap: '' })}
                              className="absolute top-4 right-4 p-2 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        ) : (
                          <div className="h-[400px] border-2 border-dashed border-[#D1D1C1] rounded-2xl flex flex-col items-center justify-center text-[#8E8E7E] gap-4">
                            <Globe size={48} className="opacity-20" />
                            <p>지도를 업로드하여 세계관을 시각화하세요</p>
                          </div>
                        )}
                      </div>
                    )}
                    {worldTab === 'regions' && (
                      <div className="space-y-8">
                        <div className="flex items-center justify-end">
                          <button 
                            onClick={() => {
                              const newNation: Nation = { id: Date.now().toString(), name: '새 국가', era: '', space: '', races: '', history: '', culture: '', environment: '', other: '' };
                              updateActiveProject({ nations: [...activeProject.nations, newNation] });
                            }}
                            className="bg-[#3E5C45] text-white px-4 py-2 rounded-full text-sm font-bold hover:bg-[#2E4C35] transition-colors"
                          >
                            <Plus size={16} className="inline mr-2" /> 국가 추가
                          </button>
                        </div>
                        <DndContext 
                          sensors={sensors}
                          collisionDetection={closestCenter}
                          onDragEnd={(e) => handleDragEnd(e, 'nations')}
                          modifiers={[restrictToVerticalAxis]}
                        >
                          <SortableContext 
                            items={activeProject.nations.map(n => n.id)}
                            strategy={verticalListSortingStrategy}
                          >
                            <div className="space-y-6">
                              {activeProject.nations.map((nation, idx) => (
                                <SortableItem key={nation.id} id={nation.id}>
                                  <div className="p-8 bg-white rounded-[32px] border border-[#B1B1A1] space-y-6 relative group shadow-md overflow-hidden hover:border-[#3E5C45]/30 transition-all">
                                    <div className="absolute top-6 right-6 flex items-center gap-2 z-10">
                                      <div className="p-2 text-[#D1D1C1] opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing">
                                        <GripVertical size={18} />
                                      </div>
                                      <button 
                                        onClick={() => {
                                          const newNations = [...activeProject.nations];
                                          newNations.splice(idx, 1);
                                          updateActiveProject({ nations: newNations });
                                        }}
                                        className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                                      >
                                        <Trash2 size={18} />
                                      </button>
                                    </div>

                                    {/* Banner Image Section */}
                                    <div className="relative w-full h-64 -mt-8 -mx-8 mb-6 bg-[#F5F5F0] border-b border-[#B1B1A1] group/banner">
                                      {nation.banner ? (
                                        <img src={nation.banner} alt={nation.name} className="w-full h-full object-cover" />
                                      ) : (
                                        <div className="w-full h-full flex flex-col items-center justify-center text-[#D1D1C1] gap-2">
                                          <ImageIcon size={48} />
                                          <span className="text-xs font-bold uppercase tracking-widest">배너 이미지를 추가하세요</span>
                                        </div>
                                      )}
                                      <label className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover/banner:opacity-100 transition-opacity cursor-pointer">
                                        <div className="flex flex-col items-center text-white gap-2">
                                          <Camera size={32} />
                                          <span className="text-sm font-bold">이미지 업로드</span>
                                        </div>
                                        <input 
                                          type="file" 
                                          className="hidden" 
                                          accept="image/*"
                                          onChange={(e) => handleImageUpload(e, (base64) => {
                                            const newNations = [...activeProject.nations];
                                            newNations[idx] = { ...nation, banner: base64 };
                                            updateActiveProject({ nations: newNations });
                                          })}
                                        />
                                      </label>
                                      {nation.banner && (
                                        <button 
                                          onClick={() => {
                                            const newNations = [...activeProject.nations];
                                            newNations[idx] = { ...nation, banner: undefined };
                                            updateActiveProject({ nations: newNations });
                                          }}
                                          className="absolute top-4 left-4 p-2 bg-white/80 text-red-500 rounded-full opacity-0 group-hover/banner:opacity-100 transition-opacity hover:bg-white"
                                        >
                                          <Trash2 size={16} />
                                        </button>
                                      )}
                                    </div>

                                    <div className="space-y-2">
                                      <label className="text-xs uppercase tracking-widest text-[#8E8E7E] font-sans font-bold">국가/지역명</label>
                                      <input 
                                        type="text"
                                        value={nation.name}
                                        onChange={(e) => {
                                          const newNations = [...activeProject.nations];
                                          newNations[idx] = { ...nation, name: e.target.value };
                                          updateActiveProject({ nations: newNations });
                                        }}
                                        className="w-full text-2xl font-bold bg-transparent border-b border-[#D1D1C1] focus:border-[#3E5C45] outline-none transition-colors"
                                      />
                                    </div>
                                    <div className="grid grid-cols-1 gap-4">
                                      {[
                                        { id: 'era', label: '시대 배경', value: nation.era },
                                        { id: 'space', label: '공간 배경', value: nation.space },
                                        { id: 'races', label: '주요 종족', value: nation.races },
                                        { id: 'history', label: '역사', value: nation.history },
                                        { id: 'culture', label: '사회문화', value: nation.culture },
                                        { id: 'environment', label: '환경', value: nation.environment },
                                        { id: 'other', label: '기타 특징', value: nation.other }
                                      ].map(field => (
                                        <div key={field.id} className="flex flex-col md:flex-row md:items-start gap-4 border-b border-[#D1D1C1]/30 pb-4 last:border-0">
                                          <label className="w-full md:w-32 text-xs uppercase tracking-widest text-[#8E8E7E] font-sans font-bold pt-2">{field.label}</label>
                                          <AutoResizeTextarea 
                                            value={field.value}
                                            onChange={(e) => {
                                              const newNations = [...activeProject.nations];
                                              newNations[idx] = { ...nation, [field.id]: e.target.value };
                                              updateActiveProject({ nations: newNations });
                                            }}
                                            className="flex-1 text-sm bg-[#F5F5F0] p-4 rounded-xl border border-[#D1D1C1] outline-none focus:border-[#3E5C45] transition-colors resize-none"
                                            minHeight="44px"
                                          />
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </SortableItem>
                              ))}
                            </div>
                          </SortableContext>
                        </DndContext>
                        {activeProject.nations.length === 0 && (
                            <div className="h-[300px] border-2 border-dashed border-[#D1D1C1] rounded-2xl flex flex-col items-center justify-center text-[#8E8E7E] gap-4">
                              <Globe size={48} className="opacity-20" />
                              <p>국가나 지역을 추가하여 세계관을 구체화하세요</p>
                            </div>
                          )}
                        </div>
                      )}
                    {worldTab === 'orgs' && (
                      <div className="space-y-8">
                        <div className="flex items-center justify-end">
                          <button 
                            onClick={() => {
                              const newOrg: Organization = { id: Date.now().toString(), name: '새 조직', purpose: '', structure: '', symbol: '', clothing: '', memberIds: [] };
                              updateActiveProject({ organizations: [...activeProject.organizations, newOrg] });
                            }}
                            className="bg-[#3E5C45] text-white px-4 py-2 rounded-full text-sm font-bold hover:bg-[#2E4C35] transition-colors"
                          >
                            <Plus size={16} className="inline mr-2" /> 조직 추가
                          </button>
                        </div>
                        <DndContext 
                          sensors={sensors}
                          collisionDetection={closestCenter}
                          onDragEnd={(e) => handleDragEnd(e, 'organizations')}
                          modifiers={[restrictToVerticalAxis]}
                        >
                          <SortableContext 
                            items={activeProject.organizations.map(o => o.id)}
                            strategy={verticalListSortingStrategy}
                          >
                            <div className="space-y-6">
                              {activeProject.organizations.map((org, idx) => (
                                <SortableItem key={org.id} id={org.id}>
                                  <div className="p-8 bg-white rounded-[32px] border border-[#B1B1A1] space-y-6 relative group shadow-md hover:border-[#3E5C45]/30 transition-all">
                                    <div className="absolute top-6 right-6 flex items-center gap-2">
                                      <div className="p-2 text-[#D1D1C1] opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing">
                                        <GripVertical size={18} />
                                      </div>
                                      <button 
                                        onClick={() => {
                                          const newOrgs = [...activeProject.organizations];
                                          newOrgs.splice(idx, 1);
                                          updateActiveProject({ organizations: newOrgs });
                                        }}
                                        className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                                      >
                                        <Trash2 size={18} />
                                      </button>
                                    </div>
                                    
                                    <div className="flex gap-8 items-start">
                                      <div className="space-y-2">
                                        <label className="text-xs uppercase tracking-widest text-[#8E8E7E] font-sans font-bold">단체 로고</label>
                                        <div className="relative w-32 h-32 flex-shrink-0">
                                          {org.logo ? (
                                            <img src={org.logo} alt={org.name} className="w-full h-full object-cover rounded-2xl border border-[#D1D1C1]" />
                                          ) : (
                                            <div className="w-full h-full bg-[#F5F5F0] rounded-2xl border border-[#D1D1C1] flex items-center justify-center text-[#D1D1C1]">
                                              <LayoutGrid size={32} />
                                            </div>
                                          )}
                                          <label className="absolute -bottom-2 -right-2 p-2 bg-[#3E5C45] text-white rounded-full cursor-pointer shadow-md hover:scale-110 transition-transform">
                                            <Edit3 size={12} />
                                            <input 
                                              type="file" 
                                              className="hidden" 
                                              accept="image/*"
                                              onChange={(e) => handleImageUpload(e, (base64) => {
                                                const newOrgs = [...activeProject.organizations];
                                                newOrgs[idx] = { ...org, logo: base64 };
                                                updateActiveProject({ organizations: newOrgs });
                                              })}
                                            />
                                          </label>
                                        </div>
                                      </div>
                                      <div className="flex-1 space-y-2">
                                        <label className="text-xs uppercase tracking-widest text-[#8E8E7E] font-sans font-bold">조직/단체명</label>
                                        <input 
                                          type="text"
                                          value={org.name}
                                          onChange={(e) => {
                                            const newOrgs = [...activeProject.organizations];
                                            newOrgs[idx] = { ...org, name: e.target.value };
                                            updateActiveProject({ organizations: newOrgs });
                                          }}
                                          className="w-full text-2xl font-bold bg-transparent border-b border-[#D1D1C1] focus:border-[#3E5C45] outline-none transition-colors"
                                        />
                                      </div>
                                    </div>

                                    <div className="grid grid-cols-1 gap-4">
                                      {[
                                        { id: 'purpose', label: '목적', value: org.purpose },
                                        { id: 'structure', label: '구조', value: org.structure },
                                        { id: 'symbol', label: '상징', value: org.symbol },
                                        { id: 'clothing', label: '복장', value: org.clothing }
                                      ].map(field => (
                                        <div key={field.id} className="flex flex-col md:flex-row md:items-start gap-4 border-b border-[#D1D1C1]/30 pb-4 last:border-0">
                                          <label className="w-full md:w-32 text-xs uppercase tracking-widest text-[#8E8E7E] font-sans font-bold pt-2">{field.label}</label>
                                          <AutoResizeTextarea 
                                            value={field.value}
                                            onChange={(e) => {
                                              const newOrgs = [...activeProject.organizations];
                                              newOrgs[idx] = { ...org, [field.id]: e.target.value };
                                              updateActiveProject({ organizations: newOrgs });
                                            }}
                                            className="flex-1 text-sm bg-[#F5F5F0] p-4 rounded-xl border border-[#D1D1C1] outline-none focus:border-[#3E5C45] transition-colors resize-none"
                                            minHeight="44px"
                                          />
                                        </div>
                                      ))}
                                    </div>

                                    <div className="space-y-4">
                                      <label className="text-xs uppercase tracking-widest text-[#8E8E7E] font-sans font-bold">소속 인물</label>
                                      <div className="flex flex-wrap gap-2">
                                        {activeProject.characters.map(char => {
                                          const isMember = org.memberIds.includes(char.id);
                                          return (
                                            <button
                                              key={char.id}
                                              onClick={() => {
                                                const newOrgs = [...activeProject.organizations];
                                                const newMemberIds = isMember 
                                                  ? org.memberIds.filter(id => id !== char.id)
                                                  : [...org.memberIds, char.id];
                                                newOrgs[idx] = { ...org, memberIds: newMemberIds };
                                                updateActiveProject({ organizations: newOrgs });
                                              }}
                                              className={`px-4 py-2 rounded-full text-xs font-bold transition-all border ${isMember ? 'bg-[#3E5C45] text-white border-[#3E5C45]' : 'bg-white text-[#8E8E7E] border-[#D1D1C1] hover:border-[#3E5C45]'}`}
                                            >
                                              {char.name}
                                            </button>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  </div>
                                </SortableItem>
                              ))}
                            </div>
                          </SortableContext>
                        </DndContext>
                          {activeProject.organizations.length === 0 && (
                            <div className="h-[300px] border-2 border-dashed border-[#D1D1C1] rounded-2xl flex flex-col items-center justify-center text-[#8E8E7E] gap-4">
                              <LayoutGrid size={48} className="opacity-20" />
                              <p>조직이나 단체를 추가하여 세계관을 구체화하세요</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}

              {view === 'characterSettings' && (
                <motion.div 
                  key="characterSettings"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-8"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Users size={32} className="text-[#3E5C45]" />
                      <h2 className="text-4xl font-bold">캐릭터 설정</h2>
                    </div>
                  </div>

                  {/* Tabs */}
                  <div className="flex gap-2 p-1 bg-[#F5F5F0] rounded-2xl w-fit">
                    {[
                      { id: 'relationships', label: '인물 관계도' },
                      { id: 'list', label: '캐릭터 리스트' }
                    ].map(tab => (
                      <button
                        key={tab.id}
                        onClick={() => setCharacterTab(tab.id as any)}
                        className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${characterTab === tab.id ? 'bg-[#3E5C45] text-white shadow-md' : 'text-[#8E8E7E] hover:bg-white'}`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  <div className="space-y-12">
                    {characterTab === 'relationships' && (
                      <div className="space-y-8">
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <h3 className="text-xl font-bold">인물 관계도</h3>
                            <p className="text-sm text-[#8E8E7E]">관계도 이미지를 업로드하세요. 여러 장 업로드 시 아래로 이어집니다.</p>
                          </div>
                          <label className="cursor-pointer bg-[#3E5C45] text-white px-4 py-2 rounded-full text-sm font-bold hover:bg-[#2E4C35] transition-colors">
                            <Plus size={16} className="inline mr-2" /> 이미지 추가
                            <input 
                              type="file" 
                              className="hidden" 
                              multiple
                              accept="image/*"
                              onChange={(e) => handleMultipleImagesUpload(e, (base64s) => {
                                updateActiveProject({ relationshipImages: [...(activeProject.relationshipImages || []), ...base64s] });
                              })}
                            />
                          </label>
                        </div>
                        
                        <div className="space-y-4">
                          {(activeProject.relationshipImages || []).map((img, idx) => (
                            <div key={idx} className="relative group">
                              <img src={img} alt={`Relationship ${idx + 1}`} className="w-full rounded-2xl border border-[#D1D1C1]" />
                              <button 
                                onClick={() => {
                                  const newImages = [...activeProject.relationshipImages];
                                  newImages.splice(idx, 1);
                                  updateActiveProject({ relationshipImages: newImages });
                                }}
                                className="absolute top-4 right-4 p-2 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          ))}
                          {(!activeProject.relationshipImages || activeProject.relationshipImages.length === 0) && (
                            <div className="h-[300px] border-2 border-dashed border-[#D1D1C1] rounded-2xl flex flex-col items-center justify-center text-[#8E8E7E] gap-4">
                              <Network size={48} className="opacity-20" />
                              <p>인물 관계도 이미지를 업로드하세요</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    {characterTab === 'list' && (
                      <div className="space-y-8">
                        <div className="flex items-center justify-end">
                          <button 
                            onClick={() => {
                              const newChar = { id: Date.now().toString(), name: '새 캐릭터', role: '', description: '', infoItems: [] };
                              updateActiveProject({ characters: [...activeProject.characters, newChar] });
                            }}
                            className="bg-[#3E5C45] text-white px-4 py-2 rounded-full text-sm font-bold hover:bg-[#2E4C35] transition-colors"
                          >
                            <Plus size={16} className="inline mr-2" /> 캐릭터 추가
                          </button>
                        </div>

                        <DndContext 
                          sensors={sensors}
                          collisionDetection={closestCenter}
                          onDragEnd={(e) => handleDragEnd(e, 'characters')}
                          modifiers={[restrictToVerticalAxis]}
                        >
                          <SortableContext 
                            items={activeProject.characters.map(c => c.id)}
                            strategy={verticalListSortingStrategy}
                          >
                            <div className="grid grid-cols-1 gap-6">
                              {activeProject.characters.map((char, idx) => (
                                <SortableItem key={char.id} id={char.id}>
                                  <div className="p-8 bg-white rounded-[32px] border border-[#B1B1A1] shadow-md flex gap-8 items-start group relative hover:border-[#3E5C45]/30 transition-all">
                                    <div className="absolute top-6 right-6 flex items-center gap-2">
                                      <div className="p-2 text-[#D1D1C1] opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing">
                                        <GripVertical size={18} />
                                      </div>
                                      <button 
                                        onClick={() => {
                                          const newChars = activeProject.characters.filter(c => c.id !== char.id);
                                          updateActiveProject({ characters: newChars });
                                        }}
                                        className="p-2 text-[#D1D1C1] hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                      >
                                        <Trash2 size={18} />
                                      </button>
                                    </div>

                                    <div className="relative w-32 h-32 flex-shrink-0">
                                      {char.image ? (
                                        <img src={char.image} alt={char.name} className="w-full h-full object-cover rounded-2xl border border-[#D1D1C1]" />
                                      ) : (
                                        <div className="w-full h-full bg-[#F5F5F0] rounded-2xl border border-[#D1D1C1] flex items-center justify-center text-[#D1D1C1]">
                                          <Users size={48} />
                                        </div>
                                      )}
                                      <label className="absolute -bottom-2 -right-2 p-2 bg-[#3E5C45] text-white rounded-full cursor-pointer shadow-md hover:scale-110 transition-transform">
                                        <Edit3 size={12} />
                                        <input 
                                          type="file" 
                                          className="hidden" 
                                          accept="image/*"
                                          onChange={(e) => handleImageUpload(e, (base64) => {
                                            const newChars = [...activeProject.characters];
                                            newChars[idx] = { ...char, image: base64 };
                                            updateActiveProject({ characters: newChars });
                                          })}
                                        />
                                      </label>
                                    </div>

                                    <div className="flex-1 space-y-6">
                                      <div className="flex gap-6 items-end">
                                        <div className="flex-1 space-y-2">
                                          <label className="text-xs uppercase tracking-widest text-[#8E8E7E] font-sans font-bold">이름</label>
                                          <input 
                                            type="text"
                                            value={char.name}
                                            onChange={(e) => {
                                              const newChars = [...activeProject.characters];
                                              newChars[idx] = { ...char, name: e.target.value };
                                              updateActiveProject({ characters: newChars });
                                            }}
                                            className="w-full text-2xl font-bold bg-transparent border-b border-[#D1D1C1] focus:border-[#3E5C45] outline-none transition-colors"
                                            placeholder="이름을 입력하세요"
                                          />
                                        </div>
                                        <div className="flex-1 space-y-2">
                                          <label className="text-xs uppercase tracking-widest text-[#8E8E7E] font-sans font-bold">역할</label>
                                          <input 
                                            type="text"
                                            value={char.role}
                                            onChange={(e) => {
                                              const newChars = [...activeProject.characters];
                                              newChars[idx] = { ...char, role: e.target.value };
                                              updateActiveProject({ characters: newChars });
                                            }}
                                            className="w-full text-lg font-medium text-[#3E5C45] bg-transparent border-b border-[#D1D1C1] focus:border-[#3E5C45] outline-none transition-colors"
                                            placeholder="역할 (예: 주인공, 조연)"
                                          />
                                        </div>
                                      </div>

                                      <div className="space-y-4">
                                        <div className="flex items-center justify-between border-b border-[#D1D1C1] pb-2">
                                          <label className="text-xs uppercase tracking-widest text-[#8E8E7E] font-sans font-bold">정보란</label>
                                          <button 
                                            onClick={() => {
                                              const newChars = [...activeProject.characters];
                                              const newInfoItems = [...(char.infoItems || []), { label: '새 항목', value: '' }];
                                              newChars[idx] = { ...char, infoItems: newInfoItems };
                                              updateActiveProject({ characters: newChars });
                                            }}
                                            className="text-[10px] bg-[#3E5C45] text-white px-2 py-1 rounded-full hover:bg-[#2E4C35] transition-colors"
                                          >
                                            항목 추가
                                          </button>
                                        </div>
                                        
                                        <div className="grid grid-cols-1 gap-4">
                                          {[
                                            { id: 'personality', label: '성격', value: char.personality },
                                            { id: 'appearance', label: '외양', value: char.appearance },
                                            { id: 'ability', label: '능력', value: char.ability },
                                            { id: 'specialNotes', label: '기타 특이사항', value: char.specialNotes }
                                          ].map(field => (
                                            <div key={field.id} className="flex flex-col md:flex-row md:items-start gap-4 border-b border-[#D1D1C1]/30 pb-4 last:border-0">
                                              <label className="w-full md:w-32 text-xs uppercase tracking-widest text-[#8E8E7E] font-sans font-bold pt-2">{field.label}</label>
                                              <AutoResizeTextarea 
                                                value={field.value || ''}
                                                onChange={(e) => {
                                                  const newChars = [...activeProject.characters];
                                                  newChars[idx] = { ...char, [field.id]: e.target.value };
                                                  updateActiveProject({ characters: newChars });
                                                }}
                                                className="flex-1 text-sm bg-[#F5F5F0] p-4 rounded-xl border border-[#D1D1C1] outline-none focus:border-[#3E5C45] transition-colors resize-none"
                                                minHeight="44px"
                                              />
                                            </div>
                                          ))}
                                          
                                          {(char.infoItems || []).map((item, itemIdx) => (
                                            <div key={itemIdx} className="flex flex-col md:flex-row md:items-start gap-4 border-b border-[#D1D1C1]/30 pb-4 group/item">
                                              <div className="w-full md:w-32 space-y-1">
                                                <input 
                                                  type="text"
                                                  value={item.label}
                                                  onChange={(e) => {
                                                    const newChars = [...activeProject.characters];
                                                    const newInfoItems = [...(char.infoItems || [])];
                                                    newInfoItems[itemIdx] = { ...item, label: e.target.value };
                                                    newChars[idx] = { ...char, infoItems: newInfoItems };
                                                    updateActiveProject({ characters: newChars });
                                                  }}
                                                  className="w-full text-xs uppercase tracking-widest text-[#8E8E7E] font-sans font-bold bg-transparent border-none outline-none focus:text-[#3E5C45]"
                                                />
                                                <button 
                                                  onClick={() => {
                                                    const newChars = [...activeProject.characters];
                                                    const newInfoItems = char.infoItems?.filter((_, i) => i !== itemIdx);
                                                    newChars[idx] = { ...char, infoItems: newInfoItems };
                                                    updateActiveProject({ characters: newChars });
                                                  }}
                                                  className="text-[8px] text-red-400 opacity-0 group-hover/item:opacity-100 hover:text-red-600 transition-all"
                                                >
                                                  삭제
                                                </button>
                                              </div>
                                              <AutoResizeTextarea 
                                                value={item.value}
                                                onChange={(e) => {
                                                  const newChars = [...activeProject.characters];
                                                  const newInfoItems = [...(char.infoItems || [])];
                                                  newInfoItems[itemIdx] = { ...item, value: e.target.value };
                                                  newChars[idx] = { ...char, infoItems: newInfoItems };
                                                  updateActiveProject({ characters: newChars });
                                                }}
                                                className="flex-1 text-sm bg-[#F5F5F0] p-4 rounded-xl border border-[#D1D1C1] outline-none focus:border-[#3E5C45] transition-colors resize-none"
                                                minHeight="44px"
                                              />
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </SortableItem>
                              ))}
                            </div>
                          </SortableContext>
                        </DndContext>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}

              {view === 'storyDevelopment' && (
                <motion.div 
                  key="storyDevelopment"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-12"
                >
                  <div className="flex items-center gap-3">
                    <TrendingUp size={32} className="text-[#3E5C45]" />
                    <h2 className="text-4xl font-bold">스토리 전개</h2>
                  </div>

                  {/* Synopsis Summary */}
                  <div className="p-8 bg-[#F5F5F0] rounded-[32px] border border-[#B1B1A1] space-y-4">
                    <div className="flex items-center gap-2 text-[#3E5C45]">
                      <BookOpen size={18} />
                      <label className="text-xs uppercase tracking-widest font-sans font-bold">요약 시놉시스 (기본 설정)</label>
                    </div>
                    <p className="text-lg leading-relaxed text-[#1A1A1A] italic">
                      {activeProject.synopsis || '기본 설정에서 시놉시스를 작성하면 여기에 표시됩니다.'}
                    </p>
                  </div>

                  {/* 3 Acts 15 Chapters */}
                  <div className="space-y-12">
                    {activeProject.storyActs.map((act, actIdx) => (
                      <div key={act.id} className="space-y-6">
                        <div className="flex items-center gap-4">
                          <div className="h-px flex-1 bg-[#D1D1C1]" />
                          <h3 className="text-2xl font-bold text-[#3E5C45] px-4 py-2 bg-white rounded-full border border-[#D1D1C1] shadow-sm">
                            {act.title}
                          </h3>
                          <div className="h-px flex-1 bg-[#D1D1C1]" />
                        </div>

                        <div className="grid grid-cols-1 gap-6">
                          {act.chapters.map((chapter, chapIdx) => {
                            const chapterNumber = activeProject.storyActs
                              .slice(0, actIdx)
                              .reduce((acc, curr) => acc + curr.chapters.length, 0) + chapIdx + 1;
                            
                            return (
                              <div key={chapter.id} className="group bg-white p-8 rounded-[32px] border border-[#D1D1C1] shadow-sm hover:shadow-md transition-all space-y-4">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <span className="text-xl font-bold text-[#3E5C45] whitespace-nowrap">
                                      {chapterNumber}장:
                                    </span>
                                    <input 
                                      type="text"
                                      value={chapter.title}
                                      onChange={(e) => {
                                        const newActs = [...activeProject.storyActs];
                                        let newTitle = e.target.value;
                                        // Remove redundant "N장:" if the user typed it
                                        newTitle = newTitle.replace(new RegExp(`^${chapterNumber}장[:\s]*`), '');
                                        newActs[actIdx].chapters[chapIdx] = { ...chapter, title: newTitle };
                                        updateActiveProject({ storyActs: newActs });
                                      }}
                                      className="text-xl font-bold bg-transparent border-none outline-none focus:ring-0 p-0 w-full"
                                      placeholder="장 제목"
                                    />
                                  </div>
                                </div>
                                <AutoResizeTextarea 
                                  value={chapter.content}
                                  onChange={(e) => {
                                    const newActs = [...activeProject.storyActs];
                                    newActs[actIdx].chapters[chapIdx] = { ...chapter, content: e.target.value };
                                    updateActiveProject({ storyActs: newActs });
                                  }}
                                  placeholder="이 장에서 일어나는 주요 사건들을 기록하세요..."
                                  className="w-full bg-transparent border-none outline-none focus:ring-0 p-0 text-lg leading-relaxed resize-none"
                                  minHeight="120px"
                                />
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {view === 'referenceBoard' && (
                <motion.div 
                  key="referenceBoard"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-8"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-3">
                      <ImageIcon size={32} className="text-[#3E5C45]" />
                      <h2 className="text-4xl font-bold">레퍼런스 보드</h2>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8E8E7E]" />
                        <input 
                          type="text"
                          placeholder="태그로 검색..."
                          value={searchTag}
                          onChange={(e) => setSearchTag(e.target.value)}
                          className="pl-10 pr-4 py-2 bg-white border border-[#D1D1C1] rounded-full text-sm outline-none focus:border-[#3E5C45] transition-colors w-64"
                        />
                      </div>
                      <button 
                        onClick={() => {
                          const name = prompt('새 카테고리 이름을 입력하세요:');
                          if (name) {
                            const newCat: ReferenceCategory = {
                              id: Date.now().toString(),
                              name,
                              images: []
                            };
                            setProjects(prev => prev.map(p => p.id === activeProjectId ? {
                              ...p,
                              referenceCategories: [...(p.referenceCategories || []), newCat]
                            } : p));
                          }
                        }}
                        className="flex items-center gap-2 bg-[#3E5C45] text-white px-4 py-2 rounded-full text-sm font-bold hover:bg-[#2E4C35] transition-colors"
                      >
                        <FolderPlus size={16} /> 카테고리 추가
                      </button>
                    </div>
                  </div>

                  <div className="space-y-12">
                    {(activeProject.referenceCategories || []).map((cat, catIdx) => {
                      const filteredImages = searchTag 
                        ? cat.images.filter(img => img.tags.some(tag => tag.toLowerCase().includes(searchTag.toLowerCase())))
                        : cat.images;

                      if (searchTag && filteredImages.length === 0) return null;

                      return (
                        <div key={cat.id} className="space-y-6">
                          <div className="flex items-center justify-between border-b border-[#D1D1C1] pb-2">
                            <div className="flex items-center gap-3">
                              <h3 className="text-2xl font-bold">{cat.name}</h3>
                              <span className="text-sm text-[#8E8E7E] font-sans font-bold">({cat.images.length})</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <label className="cursor-pointer p-2 hover:bg-[#E6E6D6] rounded-full transition-colors text-[#3E5C45]" title="이미지 업로드">
                                <Plus size={20} />
                                <input 
                                  type="file" 
                                  className="hidden" 
                                  accept="image/*"
                                  multiple
                                  onChange={(e) => handleMultipleImagesUpload(e, (base64s) => {
                                    const newCats = [...(activeProject.referenceCategories || [])];
                                    const newImages = base64s.map(url => ({
                                      id: Math.random().toString(36).substr(2, 9),
                                      url,
                                      tags: []
                                    }));
                                    newCats[catIdx] = { ...cat, images: [...cat.images, ...newImages] };
                                    updateActiveProject({ referenceCategories: newCats });
                                  })}
                                />
                              </label>
                              <button 
                                onClick={() => {
                                  if (confirm('카테고리를 삭제하시겠습니까?')) {
                                    const newCats = activeProject.referenceCategories.filter(c => c.id !== cat.id);
                                    updateActiveProject({ referenceCategories: newCats });
                                  }
                                }}
                                className="p-2 hover:bg-red-50 rounded-full transition-colors text-red-400 hover:text-red-600"
                                title="카테고리 삭제"
                              >
                                <Trash2 size={20} />
                              </button>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                            {filteredImages.map((img) => (
                              <div 
                                key={img.id} 
                                className="relative aspect-square group cursor-pointer"
                                onClick={() => setSelectedImage({ categoryId: cat.id, image: img })}
                              >
                                <img 
                                  src={img.url} 
                                  alt="Reference" 
                                  className="w-full h-full object-cover rounded-2xl border border-[#D1D1C1] transition-transform group-hover:scale-[1.02]" 
                                />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors rounded-2xl" />
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (confirm('이미지를 삭제하시겠습니까?')) {
                                      const newCats = [...activeProject.referenceCategories];
                                      newCats[catIdx] = { ...cat, images: cat.images.filter(i => i.id !== img.id) };
                                      updateActiveProject({ referenceCategories: newCats });
                                    }
                                  }}
                                  className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            ))}
                            {filteredImages.length === 0 && (
                              <div className="col-span-full py-12 text-center border-2 border-dashed border-[#D1D1C1] rounded-2xl text-[#8E8E7E] italic">
                                {searchTag ? '검색 결과가 없습니다.' : '업로드된 이미지가 없습니다.'}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}

                    {(activeProject.referenceCategories || []).length === 0 && (
                      <div className="h-[400px] border-2 border-dashed border-[#D1D1C1] rounded-[40px] flex flex-col items-center justify-center text-[#8E8E7E] gap-4 bg-white/50">
                        <ImageIcon size={64} className="opacity-10" />
                        <div className="text-center space-y-2">
                          <p className="text-xl font-bold">레퍼런스 보드가 비어있습니다</p>
                          <p className="text-sm">카테고리를 생성하고 이미지를 업로드하여 영감을 기록하세요</p>
                        </div>
                        <button 
                          onClick={() => {
                            const name = prompt('새 카테고리 이름을 입력하세요:');
                            if (name) {
                              const newCat: ReferenceCategory = {
                                id: Date.now().toString(),
                                name,
                                images: []
                              };
                              setProjects(prev => prev.map(p => p.id === activeProjectId ? {
                                ...p,
                                referenceCategories: [...(p.referenceCategories || []), newCat]
                              } : p));
                            }
                          }}
                          className="mt-4 flex items-center gap-2 bg-[#3E5C45] text-white px-6 py-3 rounded-full font-bold hover:bg-[#2E4C35] transition-all shadow-md"
                        >
                          <FolderPlus size={20} /> 첫 카테고리 만들기
                        </button>
                      </div>
                    )}
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
                      className={`flex items-center gap-2 text-white px-4 py-2 rounded-full transition-all shadow-md font-sans font-bold text-sm ${isPlanningView ? 'bg-[#3E5C45] hover:bg-[#2D4A35]' : 'bg-[#5A5A40] hover:bg-[#4A4A30]'}`}
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
                            <div className={`absolute left-1/2 -translate-x-1/2 w-4 h-4 rounded-full border-4 border-white shadow-md z-10 ${isPlanningView ? 'bg-[#3E5C45]' : 'bg-[#5A5A40]'}`} />
                            
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
                                  <AutoResizeTextarea 
                                    value={node.description}
                                    onChange={(e) => updateTimelineNode(node.id, { description: e.target.value })}
                                    className={`text-sm text-[#8E8E7E] bg-transparent border-none outline-none focus:ring-0 w-full font-sans ${isLeft ? 'text-right' : 'text-left'}`}
                                    placeholder="설명"
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
                    <AutoResizeTextarea 
                      value={activeSeason.treatment}
                      onChange={(e) => updateSeason(activeSeason.id, { treatment: e.target.value })}
                      className="w-full min-h-[400px] text-lg leading-relaxed bg-white p-10 rounded-[40px] border border-[#D1D1C1] shadow-sm outline-none focus:border-[#5A5A40] transition-colors placeholder-[#D1D1C1]"
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
                    <AutoResizeTextarea 
                      value={activeChapter.content}
                      onChange={(e) => updateChapter(activeSeason.id, activeChapter.id, { content: e.target.value })}
                      className="w-full min-h-[200px] text-lg leading-relaxed bg-white p-10 rounded-[40px] border border-[#D1D1C1] shadow-sm outline-none focus:border-[#5A5A40] transition-colors placeholder-[#D1D1C1]"
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

              {view === 'seasonTreatments' && (
                <motion.div 
                  key="seasonTreatments"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-12"
                >
                  <div className="flex items-center gap-3">
                    <BookOpen size={32} className="text-[#5A5A40]" />
                    <h2 className="text-4xl font-bold">시즌별 트리트먼트</h2>
                  </div>

                  <div className="grid grid-cols-1 gap-8">
                    {activeProject.seasons.map((season, idx) => (
                      <div key={season.id} className="p-8 bg-white rounded-[40px] border border-[#D1D1C1] shadow-sm space-y-6">
                        <div className="flex items-center gap-4">
                          <span className="w-10 h-10 rounded-full bg-[#5A5A40] text-white flex items-center justify-center font-bold">
                            {idx + 1}
                          </span>
                          <h3 className="text-2xl font-bold">{season.title}</h3>
                        </div>
                        <div className="space-y-4">
                          <label className="text-xs uppercase tracking-widest text-[#8E8E7E] font-sans font-bold">트리트먼트</label>
                          <AutoResizeTextarea 
                            value={season.treatment}
                            onChange={(e) => updateSeason(season.id, { treatment: e.target.value })}
                            className="w-full min-h-[200px] text-lg leading-relaxed bg-[#F5F5F0] p-6 rounded-3xl border border-[#D1D1C1] outline-none focus:border-[#5A5A40] transition-colors placeholder-[#D1D1C1] resize-none"
                            placeholder="시즌 전체의 줄거리와 주요 전개를 작성하세요..."
                          />
                        </div>
                      </div>
                    ))}
                    {activeProject.seasons.length === 0 && (
                      <div className="h-[300px] border-2 border-dashed border-[#D1D1C1] rounded-2xl flex flex-col items-center justify-center text-[#8E8E7E] gap-4">
                        <Layers size={48} className="opacity-20" />
                        <p>시즌을 추가하여 트리트먼트를 작성하세요</p>
                      </div>
                    )}
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
                      <AutoResizeTextarea 
                        value={activeEpisode.content}
                        onChange={(e) => updateEpisode(activeSeason.id, activeChapter.id, activeEpisode.id, { content: e.target.value })}
                        className="w-full min-h-[300px] text-xl leading-[2] bg-white p-12 md:p-20 rounded-[60px] border border-[#D1D1C1] shadow-sm outline-none focus:border-[#5A5A40] transition-colors placeholder-[#D1D1C1]"
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
                        <DndContext 
                          sensors={sensors}
                          collisionDetection={closestCenter}
                          onDragEnd={(e) => handleCutDragEnd(e, activeSeason.id, activeChapter.id, activeEpisode.id)}
                        >
                          <SortableContext 
                            items={activeEpisode.cuts?.map(c => c.id) || []}
                            strategy={verticalListSortingStrategy}
                          >
                            {activeEpisode.cuts?.map((cut, index) => (
                              <SortableItem key={cut.id} id={cut.id}>
                                <div className="flex gap-4 group">
                                  <div className="flex-shrink-0 w-12 h-12 bg-[#E6E6D6] rounded-full flex items-center justify-center font-bold text-[#5A5A40] font-sans text-xs">
                                    {index + 1}컷
                                  </div>
                                  <div className="flex-1 relative">
                                    <AutoResizeTextarea 
                                      value={cut.content}
                                      onChange={(e) => updateCut(activeSeason.id, activeChapter.id, activeEpisode.id, cut.id, e.target.value)}
                                      className="w-full min-h-[100px] bg-white p-6 rounded-[24px] border border-[#D1D1C1] shadow-sm outline-none focus:border-[#5A5A40] transition-colors placeholder-[#D1D1C1] font-sans"
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
                              </SortableItem>
                            ))}
                          </SortableContext>
                        </DndContext>
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

      {/* Reference Image Detail Modal */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-12 bg-black/80 backdrop-blur-sm"
            onClick={() => setSelectedImage(null)}
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white w-full max-w-5xl max-h-full rounded-[40px] overflow-hidden flex flex-col md:flex-row shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex-1 bg-black flex items-center justify-center overflow-hidden">
                <img 
                  src={selectedImage.image.url} 
                  alt="Reference Detail" 
                  className="max-w-full max-h-full object-contain"
                />
              </div>
              <div className="w-full md:w-80 p-8 flex flex-col gap-8 bg-[#F5F5F0] border-l border-[#D1D1C1]">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold">이미지 정보</h3>
                  <button 
                    onClick={() => setSelectedImage(null)}
                    className="p-2 hover:bg-[#E6E6D6] rounded-full transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-[#3E5C45]">
                    <Tag size={18} />
                    <label className="text-xs uppercase tracking-widest font-sans font-bold">태그 관리</label>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selectedImage.image.tags.map((tag, idx) => (
                      <span 
                        key={idx} 
                        className="flex items-center gap-1 bg-white border border-[#D1D1C1] px-3 py-1 rounded-full text-xs font-bold text-[#3E5C45]"
                      >
                        #{tag}
                        <button 
                          onClick={() => {
                            const newCats = [...activeProject.referenceCategories];
                            const catIdx = newCats.findIndex(c => c.id === selectedImage.categoryId);
                            if (catIdx !== -1) {
                              const imgIdx = newCats[catIdx].images.findIndex(i => i.id === selectedImage.image.id);
                              if (imgIdx !== -1) {
                                const newTags = selectedImage.image.tags.filter((_, i) => i !== idx);
                                newCats[catIdx].images[imgIdx] = { ...selectedImage.image, tags: newTags };
                                updateActiveProject({ referenceCategories: newCats });
                                setSelectedImage({ ...selectedImage, image: { ...selectedImage.image, tags: newTags } });
                              }
                            }
                          }}
                          className="hover:text-red-500 transition-colors"
                        >
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                    <button 
                      onClick={() => {
                        const tag = prompt('새 태그를 입력하세요 (공백 없이):');
                        if (tag) {
                          const cleanTag = tag.trim().replace(/\s+/g, '');
                          if (cleanTag && !selectedImage.image.tags.includes(cleanTag)) {
                            const newCats = [...activeProject.referenceCategories];
                            const catIdx = newCats.findIndex(c => c.id === selectedImage.categoryId);
                            if (catIdx !== -1) {
                              const imgIdx = newCats[catIdx].images.findIndex(i => i.id === selectedImage.image.id);
                              if (imgIdx !== -1) {
                                const newTags = [...selectedImage.image.tags, cleanTag];
                                newCats[catIdx].images[imgIdx] = { ...selectedImage.image, tags: newTags };
                                updateActiveProject({ referenceCategories: newCats });
                                setSelectedImage({ ...selectedImage, image: { ...selectedImage.image, tags: newTags } });
                              }
                            }
                          }
                        }
                      }}
                      className="px-3 py-1 rounded-full text-xs font-bold border border-dashed border-[#3E5C45] text-[#3E5C45] hover:bg-[#3E5C45] hover:text-white transition-all"
                    >
                      <Plus size={12} className="inline mr-1" /> 태그 추가
                    </button>
                  </div>
                </div>

                <div className="mt-auto pt-8 border-t border-[#D1D1C1]">
                  <button 
                    onClick={() => {
                      if (confirm('이미지를 삭제하시겠습니까?')) {
                        const newCats = [...activeProject.referenceCategories];
                        const catIdx = newCats.findIndex(c => c.id === selectedImage.categoryId);
                        if (catIdx !== -1) {
                          newCats[catIdx] = { 
                            ...newCats[catIdx], 
                            images: newCats[catIdx].images.filter(i => i.id !== selectedImage.image.id) 
                          };
                          updateActiveProject({ referenceCategories: newCats });
                          setSelectedImage(null);
                        }
                      }
                    }}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-red-50 text-red-500 rounded-2xl font-bold hover:bg-red-500 hover:text-white transition-all"
                  >
                    <Trash2 size={18} /> 이미지 삭제
                  </button>
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
