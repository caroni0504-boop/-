/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  User, 
  BookOpen, 
  Image as ImageIcon, 
  Plus, 
  Trash2, 
  ChevronRight, 
  LayoutDashboard, 
  Save,
  Type,
  Layers,
  Sparkles,
  Link as LinkIcon,
  Camera,
  Home,
  ArrowLeft,
  FolderOpen,
  Download
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import html2canvas from 'html2canvas';

/// --- Types ---

interface ImageReference {
  id: string;
  url: string; // base64 or URL
  description: string;
  sourceType: 'character_profile' | 'character_ref' | 'story_ref' | 'background_ref';
  sourceId?: string; // character id or story beat id if applicable
}

interface Relationship {
  id: string;
  fromId: string;
  toId: string;
  type: string;
}

interface DesiredScene {
  id: string;
  title: string;
  location: string;
  involvedCharacters: string;
  content: string;
  image?: string;
}

interface EpisodeTreatment {
  id: string;
  episodeNumber: number;
  title: string;
  content: string;
}

interface Country {
  id: string;
  name: string;
  era: string;
  space: string;
  races: string;
  history: string;
  society: string;
  environment: string;
  notes: string;
  references: { id: string, url: string, description: string }[];
}

interface Organization {
  id: string;
  name: string;
  logo?: string;
  purpose: string;
  structure: string;
  symbol: string;
  costume: string;
  memberIds: string[];
}

interface Terminology {
  id: string;
  term: string;
  definition: string;
}

interface Character {
  id: string;
  name: string;
  role: string;
  keywords: string;
  catchphrase?: string;
  desire?: string;
  belief?: string;
  personality: string;
  appearance: string;
  ability?: string;
  notes: string;
  profileImage?: string;
  references: { id: string, url: string }[];
}

interface StoryBeat {
  id: string;
  title: string;
  content: string;
}

interface ProgressEntry {
  id: string;
  date: string;
  memo: string;
  image?: string;
}

interface ProjectData {
  id: string;
  title: string;
  basicSettings: {
    intention: string;
    logline: string;
    synopsis: string;
    genre: string;
    keywords: string;
    message: string;
    target: string;
  };
  world: {
    mapImage?: string;
    countries: Country[];
    terminology: Terminology[];
    abilitySystem: string;
    organizations: Organization[];
  };
  characters: Character[];
  relationshipMapImage?: string;
  story: {
    beats: StoryBeat[];
    episodes: EpisodeTreatment[];
    timelineImage?: string;
    desiredScenes: DesiredScene[];
    references: string[];
    imageReferences: { id: string, url: string, description: string }[];
  };
  progress: ProgressEntry[];
  backgroundReferences?: { id: string, url: string, description: string }[];
}

// --- Initial Data ---

const INITIAL_DATA: ProjectData = {
  id: 'default',
  title: "나의 새로운 만화 프로젝트",
  basicSettings: {
    intention: "현대 사회에서의 진정한 용기를 보여주고자 함",
    logline: "평범한 고등학생이 우연히 마법 세계의 비밀을 알게 되며 벌어지는 모험",
    synopsis: "평범한 일상을 살아가던 주인공은 어느 날 낡은 서점에서 발견한 책을 통해 마법의 존재를 깨닫게 된다. 제국의 감시를 피해 자신의 능력을 키워나가며, 잃어버린 가족의 비밀과 세계의 진실에 다가가는 여정을 그린다.",
    genre: "판타지 / 로맨스",
    keywords: "성장, 마법, 우정, 비밀",
    message: "진정한 힘은 내면에서 나온다",
    target: "10-20대 만화 독자층"
  },
  world: {
    mapImage: undefined,
    countries: [
      {
        id: 'c1',
        name: "에테리아 제국",
        era: "근미래 마법 문명",
        space: "공중 부유 도시들",
        races: "인간, 정령",
        history: "대마법사 에테르가 건국한 500년 역사의 제국",
        society: "마력 보유량에 따른 계급 사회",
        environment: "항상 맑은 하늘과 구름 위",
        notes: "최근 마력 고갈 문제가 대두됨",
        references: [
          { id: 'g1', url: 'https://picsum.photos/seed/global1/400/300', description: '배경 무드보드' }
        ]
      }
    ],
    terminology: [
      { id: 't1', term: "마나 코어", definition: "마법을 사용하기 위한 신체 내 에너지 기관" }
    ],
    abilitySystem: "마나 코어의 색상에 따라 속성이 결정되며, 숙련도에 따라 1~9성으로 나뉨.",
    organizations: [
      {
        id: 'o1',
        name: "그림자 파수꾼",
        logo: undefined,
        purpose: "제국의 어두운 면을 감시하고 위협을 제거",
        structure: "단장 - 4인의 간부 - 일반 단원",
        symbol: "푸른 불꽃",
        costume: "검은색 후드 망토와 은색 가면",
        memberIds: ['1']
      }
    ]
  },
  characters: [
    {
      id: '1',
      name: "주인공 A",
      role: "주연",
      keywords: "열혈, 천재, 트라우마",
      catchphrase: "포기하는 순간이 진짜 끝이다.",
      desire: "잃어버린 가족을 되찾는 것",
      belief: "모든 생명은 평등하다",
      personality: "열정적이고 정의로운 성격",
      appearance: "검은 머리, 푸른 눈, 활동적인 복장",
      ability: "중력 제어",
      notes: "과거의 비밀을 간직하고 있음",
      profileImage: 'https://picsum.photos/seed/char1/300/300',
      references: [
        { id: 'r1', url: 'https://picsum.photos/seed/ref1/300/300' }
      ]
    }
  ],
  story: {
    beats: Array.from({ length: 15 }, (_, i) => ({
      id: `beat-${i + 1}`,
      title: `${i + 1}단계: ${getBeatName(i + 1)}`,
      content: ""
    })),
    episodes: [
      { id: 'ep1', episodeNumber: 1, title: "프롤로그: 운명의 시작", content: "주인공이 자신의 능력을 처음으로 자각하게 되는 사건..." },
      { id: 'ep2', episodeNumber: 2, title: "새로운 만남", content: "조력자 B를 만나 세계관의 비밀에 대해 듣게 됨..." }
    ],
    desiredScenes: [
      { 
        id: 'ds1', 
        title: "비 오는 날의 첫 만남", 
        location: "편의점 앞",
        involvedCharacters: "주인공 A, 조력자 B",
        content: "두 주인공이 우연히 편의점 앞에서 마주치는 장면. 빗소리와 네온사인이 강조됨.", 
        image: 'https://picsum.photos/seed/scene1/600/400' 
      }
    ],
    references: ["반지의 제왕", "슬램덩크"],
    imageReferences: []
  },
  progress: [
    { id: 'p1', date: "2024-03-11", memo: "캐릭터 초기 설정 완료", image: undefined }
  ],
  backgroundReferences: []
};

function getBeatName(step: number): string {
  const beats = [
    "오프닝 이미지", "주제 제시", "설정", "기폭제", "토론", 
    "2막 진입", "B 스토리", "재미와 놀이", "중간점", "악당의 역습", 
    "모든 것을 잃음", "영혼의 어두운 밤", "3막 진입", "피날레", "최종 이미지"
  ];
  return beats[step - 1] || `단계 ${step}`;
}

// --- Components ---

export default function App() {
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'world' | 'characters' | 'story' | 'references' | 'progress'>('overview');
  const [worldSubTab, setWorldSubTab] = useState<'basic' | 'map' | 'countries' | 'organizations'>('basic');
  const [refSubTab, setRefSubTab] = useState<'character' | 'story' | 'background'>('character');

  // Persistence (Local Storage)
  useEffect(() => {
    const saved = localStorage.getItem('manhwa_planner_projects_v1');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setProjects(parsed);
        } else {
          setProjects([INITIAL_DATA]);
        }
      } catch (e) {
        console.error("Failed to load projects", e);
        setProjects([INITIAL_DATA]);
      }
    } else {
      // Migration from old storage if exists
      const oldSaved = localStorage.getItem('webtoon_planner_data_v4');
      if (oldSaved) {
        try {
          const oldData = JSON.parse(oldSaved);
          const migrated = { ...INITIAL_DATA, ...oldData, id: 'default' };
          setProjects([migrated]);
        } catch (e) {
          setProjects([INITIAL_DATA]);
        }
      } else {
        setProjects([INITIAL_DATA]);
      }
    }
  }, []);

  const data = projects.find(p => p.id === currentProjectId) || INITIAL_DATA;

  const saveData = (newData: ProjectData) => {
    const updatedProjects = projects.map(p => p.id === newData.id ? newData : p);
    setProjects(updatedProjects);
    localStorage.setItem('manhwa_planner_projects_v1', JSON.stringify(updatedProjects));
  };

  const createNewProject = () => {
    const newProject: ProjectData = {
      ...INITIAL_DATA,
      id: Date.now().toString(),
      title: "새로운 프로젝트"
    };
    const updatedProjects = [...projects, newProject];
    setProjects(updatedProjects);
    localStorage.setItem('manhwa_planner_projects_v1', JSON.stringify(updatedProjects));
    setCurrentProjectId(newProject.id);
  };

  const deleteProject = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm("정말로 이 프로젝트를 삭제하시겠습니까?")) {
      const updatedProjects = projects.filter(p => p.id !== id);
      setProjects(updatedProjects);
      localStorage.setItem('manhwa_planner_projects_v1', JSON.stringify(updatedProjects));
      if (currentProjectId === id) {
        setCurrentProjectId(null);
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, callback: (base64: string) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        callback(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const addCountry = () => {
    const newCountry: Country = {
      id: Date.now().toString(),
      name: "새 나라",
      era: "",
      space: "",
      races: "",
      history: "",
      society: "",
      environment: "",
      notes: "",
      references: []
    };
    saveData({ ...data, world: { ...data.world, countries: [...data.world.countries, newCountry] } });
  };

  const updateCountry = (id: string, updates: Partial<Country>) => {
    const newCountries = data.world.countries.map(c => c.id === id ? { ...c, ...updates } : c);
    saveData({ ...data, world: { ...data.world, countries: newCountries } });
  };

  const deleteCountry = (id: string) => {
    saveData({ ...data, world: { ...data.world, countries: data.world.countries.filter(c => c.id !== id) } });
  };

  const addTerminology = () => {
    const newTerm: Terminology = { id: Date.now().toString(), term: "", definition: "" };
    saveData({ ...data, world: { ...data.world, terminology: [...data.world.terminology, newTerm] } });
  };

  const updateTerminology = (id: string, updates: Partial<Terminology>) => {
    const newTerms = data.world.terminology.map(t => t.id === id ? { ...t, ...updates } : t);
    saveData({ ...data, world: { ...data.world, terminology: newTerms } });
  };

  const deleteTerminology = (id: string) => {
    saveData({ ...data, world: { ...data.world, terminology: data.world.terminology.filter(t => t.id !== id) } });
  };

  const addOrganization = () => {
    const newOrg: Organization = {
      id: Date.now().toString(),
      name: "새 조직",
      purpose: "",
      structure: "",
      symbol: "",
      costume: "",
      memberIds: []
    };
    saveData({ ...data, world: { ...data.world, organizations: [...data.world.organizations, newOrg] } });
  };

  const updateOrganization = (id: string, updates: Partial<Organization>) => {
    const newOrgs = data.world.organizations.map(o => o.id === id ? { ...o, ...updates } : o);
    saveData({ ...data, world: { ...data.world, organizations: newOrgs } });
  };

  const deleteOrganization = (id: string) => {
    saveData({ ...data, world: { ...data.world, organizations: data.world.organizations.filter(o => o.id !== id) } });
  };
  const addCharacter = () => {
    const newChar: Character = {
      id: Date.now().toString(),
      name: "새 캐릭터",
      role: "조연",
      keywords: "",
      catchphrase: "",
      desire: "",
      belief: "",
      personality: "",
      appearance: "",
      ability: "",
      notes: "",
      references: []
    };
    saveData({ ...data, characters: [...data.characters, newChar] });
  };

  const updateCharacter = (id: string, updates: Partial<Character>) => {
    const newChars = data.characters.map(c => c.id === id ? { ...c, ...updates } : c);
    saveData({ ...data, characters: newChars });
  };

  const deleteCharacter = (id: string) => {
    saveData({ ...data, characters: data.characters.filter(c => c.id !== id) });
  };

  const updateStory = (field: keyof ProjectData['story'], value: any) => {
    saveData({ ...data, story: { ...data.story, [field]: value } });
  };

  const addStoryReference = (url: string) => {
    const newRef = {
      id: Date.now().toString(),
      url,
      description: "스토리 레퍼런스"
    };
    saveData({ ...data, story: { ...data.story, imageReferences: [...data.story.imageReferences, newRef] } });
  };

  const addBackgroundReference = (url: string) => {
    const newRef = {
      id: Date.now().toString(),
      url,
      description: "배경 레퍼런스"
    };
    saveData({ ...data, backgroundReferences: [...data.backgroundReferences, newRef] });
  };

  const addEpisode = () => {
    const nextNum = (data.story.episodes?.length || 0) + 1;
    const newEp: EpisodeTreatment = {
      id: Date.now().toString(),
      episodeNumber: nextNum,
      title: `${nextNum}화 제목`,
      content: ""
    };
    saveData({ ...data, story: { ...data.story, episodes: [...(data.story.episodes || []), newEp] } });
  };

  const updateEpisode = (id: string, updates: Partial<EpisodeTreatment>) => {
    const newEps = data.story.episodes.map(ep => ep.id === id ? { ...ep, ...updates } : ep);
    saveData({ ...data, story: { ...data.story, episodes: newEps } });
  };

  const deleteEpisode = (id: string) => {
    saveData({ ...data, story: { ...data.story, episodes: data.story.episodes.filter(ep => ep.id !== id) } });
  };

  const addProgressEntry = () => {
    const newEntry: ProgressEntry = {
      id: Date.now().toString(),
      date: new Date().toISOString().split('T')[0],
      memo: "",
      image: undefined
    };
    saveData({ ...data, progress: [newEntry, ...(data.progress || [])] });
  };

  const updateProgressEntry = (id: string, updates: Partial<ProgressEntry>) => {
    saveData({
      ...data,
      progress: data.progress.map(p => p.id === id ? { ...p, ...updates } : p)
    });
  };

  const deleteProgressEntry = (id: string) => {
    saveData({
      ...data,
      progress: data.progress.filter(p => p.id !== id)
    });
  };

  const exportJPG = async () => {
    const element = document.getElementById('full-export-content');
    if (!element) return;
    
    // Temporarily make it visible for html2canvas
    const originalStyle = element.style.display;
    element.style.display = 'block';
    
    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#FDFCFB',
        windowWidth: 1200,
      });
      const imgData = canvas.toDataURL('image/jpeg', 0.9);
      const link = document.createElement('a');
      link.href = imgData;
      link.download = `${data.title}_전체_기획안.jpg`;
      link.click();
    } catch (error) {
      console.error('JPG export failed:', error);
    } finally {
      element.style.display = originalStyle;
    }
  };

  const addDesiredScene = () => {
    const newScene: DesiredScene = {
      id: Date.now().toString(),
      title: "새 장면",
      location: "",
      involvedCharacters: "",
      content: ""
    };
    saveData({ ...data, story: { ...data.story, desiredScenes: [...(data.story.desiredScenes || []), newScene] } });
  };

  const updateDesiredScene = (id: string, updates: Partial<DesiredScene>) => {
    const newScenes = data.story.desiredScenes.map(s => s.id === id ? { ...s, ...updates } : s);
    saveData({ ...data, story: { ...data.story, desiredScenes: newScenes } });
  };

  const deleteDesiredScene = (id: string) => {
    saveData({ ...data, story: { ...data.story, desiredScenes: data.story.desiredScenes.filter(s => s.id !== id) } });
  };

  // Collect all images for the Reference Board
  const allImageReferences: ImageReference[] = [
    ...data.characters.filter(c => c.profileImage).map(c => ({
      id: `profile-${c.id}`,
      url: c.profileImage!,
      description: `${c.name} 프로필`,
      sourceType: 'character_profile' as const,
      sourceId: c.id
    })),
    ...data.characters.flatMap(c => (c.references || []).map(r => ({
      id: r.id,
      url: r.url,
      description: `${c.name} 레퍼런스`,
      sourceType: 'character_ref' as const,
      sourceId: c.id
    }))),
    ...(data.story?.imageReferences || []).map(s => ({
      id: s.id,
      url: s.url,
      description: s.description,
      sourceType: 'story_ref' as const
    })),
    ...data.world.countries.flatMap(c => (c.references || []).map(r => ({
      id: r.id,
      url: r.url,
      description: `${c.name} 레퍼런스`,
      sourceType: 'background_ref' as const,
      sourceId: c.id
    })))
  ];

  const filteredReferences = allImageReferences.filter(ref => {
    if (refSubTab === 'character') return ref.sourceType === 'character_profile' || ref.sourceType === 'character_ref';
    if (refSubTab === 'story') return ref.sourceType === 'story_ref';
    if (refSubTab === 'background') return ref.sourceType === 'background_ref';
    return true;
  });

  return (
    <AnimatePresence mode="wait">
      {!currentProjectId ? (
        <motion.div 
          key="project-list"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="min-h-screen bg-[#FDFCFB] text-[#1D1D1F] font-sans p-8 md:p-12"
        >
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
              <div>
                <h1 className="text-4xl font-bold tracking-tight mb-2 flex items-center gap-3">
                  <Sparkles className="text-[#5A5A40] w-10 h-10" />
                  만화/웹툰 기획
                </h1>
                <p className="text-[#86868B] text-lg">당신의 상상을 체계적인 기획으로 만들어보세요.</p>
              </div>
              <button 
                onClick={createNewProject}
                className="flex items-center gap-2 px-8 py-4 bg-[#5A5A40] text-white rounded-full font-bold hover:bg-[#4A4A30] transition-all shadow-xl shadow-[#E5E1DA]"
              >
                <Plus size={24} />
                새 프로젝트 시작
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project) => (
                <motion.div
                  key={project.id}
                  whileHover={{ y: -5 }}
                  onClick={() => setCurrentProjectId(project.id)}
                  className="bg-white rounded-3xl p-8 border border-[#E5E1DA] shadow-sm hover:shadow-md transition-all cursor-pointer group relative"
                >
                  <div className="flex justify-between items-start mb-6">
                    <div className="p-3 bg-[#F5F5F0] rounded-2xl text-[#5A5A40] group-hover:bg-[#5A5A40] group-hover:text-white transition-colors">
                      <FolderOpen size={32} />
                    </div>
                    <button 
                      onClick={(e) => deleteProject(e, project.id)}
                      className="p-2 text-[#86868B] hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                  <h3 className="text-2xl font-bold mb-2 group-hover:text-[#5A5A40] transition-colors">{project.title}</h3>
                  <p className="text-[#86868B] text-sm line-clamp-2">{project.basicSettings.intention || "기획 의도가 설정되지 않았습니다."}</p>
                  <div className="mt-6 pt-6 border-t border-[#FDFCFB] flex items-center justify-between text-[#86868B] text-xs font-bold uppercase tracking-wider">
                    <span>{project.basicSettings.genre || "장르 미정"}</span>
                    <ChevronRight size={16} />
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      ) : (
        <motion.div 
          key="planner"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="min-h-screen bg-[#FDFCFB] text-[#1D1D1F] font-sans flex w-full"
        >
          {/* Sidebar */}
          <aside className="w-64 bg-white border-r border-[#E5E1DA] flex flex-col sticky top-0 h-screen shrink-0">
            <div className="p-4 border-b border-[#E5E1DA]">
              <button 
                onClick={() => setCurrentProjectId(null)}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#FDFCFB] text-[#1D1D1F] rounded-xl font-bold hover:bg-[#F5F5F0] transition-all mb-4 border border-[#E5E1DA]"
              >
                <ArrowLeft size={18} />
                목록으로 돌아가기
              </button>
              <h1 className="text-lg font-bold tracking-tight flex items-center gap-2 px-2">
                <Sparkles className="text-[#5A5A40] w-5 h-5" />
                <span className="truncate">{data.title}</span>
              </h1>
            </div>
            
            <nav className="flex-1 px-4 py-4 space-y-1">
              <TabButton 
                active={activeTab === 'overview'} 
                onClick={() => setActiveTab('overview')} 
                icon={<LayoutDashboard size={20} />} 
                label="기본 설정" 
              />
          <TabButton 
            active={activeTab === 'progress'} 
            onClick={() => setActiveTab('progress')} 
            icon={<Layers size={20} />} 
            label="진행 상황" 
          />
          <TabButton 
            active={activeTab === 'world'} 
            onClick={() => setActiveTab('world')} 
            icon={<Sparkles size={20} />} 
            label="세계관 설정" 
          />
          <TabButton 
            active={activeTab === 'characters'} 
            onClick={() => setActiveTab('characters')} 
            icon={<User size={20} />} 
            label="캐릭터 시트" 
          />
          <TabButton 
            active={activeTab === 'story'} 
            onClick={() => setActiveTab('story')} 
            icon={<BookOpen size={20} />} 
            label="스토리 기획" 
          />
          <TabButton 
            active={activeTab === 'references'} 
            onClick={() => setActiveTab('references')} 
            icon={<ImageIcon size={20} />} 
            label="레퍼런스 보드" 
          />
        </nav>

        <div className="p-4 border-t border-[#E5E1DA]">
          <div className="bg-[#F5F5F0] rounded-xl p-4">
            <p className="text-xs font-semibold text-[#5A5A40] uppercase tracking-wider mb-1">Project Status</p>
            <p className="text-sm font-medium">기획 단계 (Drafting)</p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <header className="bg-white/80 backdrop-blur-md border-b border-[#D2D2D7] sticky top-0 z-10 px-8 py-4 flex justify-between items-center">
          <div>
            <input 
              value={data.title}
              onChange={(e) => saveData({ ...data, title: e.target.value })}
              className="text-2xl font-bold bg-transparent border-none focus:ring-0 p-0 w-full"
            />
            <p className="text-sm text-[#86868B]">{data.basicSettings.genre}</p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={exportJPG}
              className="flex items-center gap-2 px-4 py-2 bg-[#5A5A40] text-white rounded-full text-sm font-medium hover:bg-[#4A4A30] transition-colors shadow-md"
            >
              <Download size={16} />
              이미지로 저장
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-[#E5E1DA] rounded-full text-sm font-medium hover:bg-[#FDFCFB] transition-colors">
              <Save size={16} />
              저장됨
            </button>
          </div>
        </header>

        <div id="planner-content" className="p-8 max-w-6xl mx-auto bg-[#FDFCFB]">
          <AnimatePresence mode="wait">
            {activeTab === 'overview' && (
              <motion.div 
                key="overview"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-8"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <StatCard title="캐릭터 수" value={data.characters.length} icon={<User className="text-[#5A5A40]" />} />
                  <StatCard title="에피소드 수" value={data.story.episodes.length} icon={<BookOpen className="text-[#5A5A40]" />} />
                  <StatCard title="스토리 비트" value={`${data.story.beats.filter(b => b.content).length} / 15`} icon={<Layers className="text-[#5A5A40]" />} />
                  <StatCard title="총 이미지 레퍼런스" value={allImageReferences.length} icon={<ImageIcon className="text-[#5A5A40]" />} />
                </div>

                  <div className="bg-white rounded-2xl p-8 border border-[#E5E1DA] shadow-sm space-y-8">
                    <div className="flex justify-between items-center">
                      <h2 className="text-2xl font-bold flex items-center gap-2">
                        <Sparkles className="text-[#5A5A40]" />
                        기본 설정 (Basic Settings)
                      </h2>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-[#86868B] uppercase tracking-wider">작품 제목</label>
                      <input 
                        value={data.title}
                        onChange={(e) => saveData({ ...data, title: e.target.value })}
                        className="w-full text-2xl font-bold bg-[#FDFCFB] rounded-xl p-4 border-none focus:ring-2 focus:ring-[#5A5A40]"
                        placeholder="작품 제목을 입력하세요"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-[#86868B] uppercase tracking-wider">로그라인 (Logline)</label>
                      <textarea 
                        value={data.basicSettings.logline}
                        onChange={(e) => saveData({ ...data, basicSettings: { ...data.basicSettings, logline: e.target.value } })}
                        className="w-full h-20 bg-[#FDFCFB] rounded-xl p-4 border-none focus:ring-2 focus:ring-[#5A5A40] resize-none text-sm font-medium"
                        placeholder="작품의 핵심 내용을 한 문장으로 요약해주세요."
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-[#86868B] uppercase tracking-wider">요약 시놉시스 (Summary Synopsis)</label>
                      <textarea 
                        value={data.basicSettings.synopsis}
                        onChange={(e) => saveData({ ...data, basicSettings: { ...data.basicSettings, synopsis: e.target.value } })}
                        className="w-full h-40 bg-[#FDFCFB] rounded-xl p-4 border-none focus:ring-2 focus:ring-[#5A5A40] resize-none text-sm leading-relaxed"
                        placeholder="전체적인 줄거리를 요약하여 입력해주세요."
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-[#86868B] uppercase tracking-wider">기획 의도</label>
                        <textarea 
                          value={data.basicSettings.intention}
                          onChange={(e) => saveData({ ...data, basicSettings: { ...data.basicSettings, intention: e.target.value } })}
                          className="w-full h-32 bg-[#FDFCFB] rounded-xl p-4 border-none focus:ring-2 focus:ring-[#5A5A40] resize-none text-sm leading-relaxed"
                          placeholder="작품을 기획하게 된 동기와 목적을 입력하세요."
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-[#86868B] uppercase tracking-wider">핵심 메시지</label>
                        <textarea 
                          value={data.basicSettings.message}
                          onChange={(e) => saveData({ ...data, basicSettings: { ...data.basicSettings, message: e.target.value } })}
                          className="w-full h-32 bg-[#FDFCFB] rounded-xl p-4 border-none focus:ring-2 focus:ring-[#5A5A40] resize-none text-sm leading-relaxed"
                          placeholder="독자에게 전달하고 싶은 메시지를 입력하세요."
                        />
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-[#86868B] uppercase tracking-wider">장르</label>
                        <input 
                          value={data.basicSettings.genre}
                          onChange={(e) => saveData({ ...data, basicSettings: { ...data.basicSettings, genre: e.target.value } })}
                          className="w-full bg-[#FDFCFB] rounded-xl p-4 border-none focus:ring-2 focus:ring-[#5A5A40] text-sm font-medium"
                          placeholder="예: 판타지, 로맨스, 스릴러..."
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-[#86868B] uppercase tracking-wider">타겟 독자</label>
                        <input 
                          value={data.basicSettings.target}
                          onChange={(e) => saveData({ ...data, basicSettings: { ...data.basicSettings, target: e.target.value } })}
                          className="w-full bg-[#FDFCFB] rounded-xl p-4 border-none focus:ring-2 focus:ring-[#5A5A40] text-sm font-medium"
                          placeholder="예: 10대 후반 남성, 직장인 여성..."
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-[#86868B] uppercase tracking-wider">키워드</label>
                        <input 
                          value={data.basicSettings.keywords}
                          onChange={(e) => saveData({ ...data, basicSettings: { ...data.basicSettings, keywords: e.target.value } })}
                          className="w-full bg-[#FDFCFB] rounded-xl p-4 border-none focus:ring-2 focus:ring-[#5A5A40] text-sm font-medium"
                          placeholder="예: 성장, 복수, 우정, 비밀..."
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'world' && (
              <motion.div 
                key="world"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <div className="flex border-b border-[#E5E1DA] gap-8 mb-4 overflow-x-auto no-scrollbar">
                  <SubTabButton active={worldSubTab === 'basic'} onClick={() => setWorldSubTab('basic')} label="기본 세계관" />
                  <SubTabButton active={worldSubTab === 'map'} onClick={() => setWorldSubTab('map')} label="지도" />
                  <SubTabButton active={worldSubTab === 'countries'} onClick={() => setWorldSubTab('countries')} label="국가/지역" />
                  <SubTabButton active={worldSubTab === 'organizations'} onClick={() => setWorldSubTab('organizations')} label="조직/단체" />
                </div>

                {worldSubTab === 'basic' && (
                  <div className="space-y-8">
                    <div className="bg-white rounded-2xl p-8 border border-[#E5E1DA] shadow-sm">
                      <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold">용어 정리</h3>
                        <button onClick={addTerminology} className="flex items-center gap-1 text-sm font-bold text-[#5A5A40] hover:underline">
                          <Plus size={16} /> 용어 추가
                        </button>
                      </div>
                      <div className="space-y-4">
                        {data.world.terminology.map((t) => (
                          <div key={t.id} className="flex gap-4 items-start group">
                            <input 
                              value={t.term}
                              onChange={(e) => updateTerminology(t.id, { term: e.target.value })}
                              className="w-48 font-bold bg-[#FDFCFB] rounded-lg p-3 border-none focus:ring-2 focus:ring-[#5A5A40] text-sm"
                              placeholder="용어"
                            />
                            <textarea 
                              value={t.definition}
                              onChange={(e) => updateTerminology(t.id, { definition: e.target.value })}
                              className="flex-1 bg-[#FDFCFB] rounded-lg p-3 border-none focus:ring-2 focus:ring-[#5A5A40] text-sm h-20 resize-none"
                              placeholder="설명"
                            />
                            <button onClick={() => deleteTerminology(t.id)} className="p-2 text-[#86868B] hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Trash2 size={18} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-white rounded-2xl p-8 border border-[#E5E1DA] shadow-sm">
                      <h3 className="text-xl font-bold mb-6">능력 시스템</h3>
                      <textarea 
                        value={data.world.abilitySystem}
                        onChange={(e) => saveData({ ...data, world: { ...data.world, abilitySystem: e.target.value } })}
                        className="w-full h-64 bg-[#FDFCFB] rounded-2xl p-6 border-none focus:ring-2 focus:ring-[#5A5A40] resize-none leading-relaxed"
                        placeholder="세계관 내의 마법, 초능력, 기술 체계 등을 상세히 기록하세요..."
                      />
                    </div>
                  </div>
                )}

                {worldSubTab === 'map' && (
                  <div className="bg-white rounded-2xl p-8 border border-[#E5E1DA] shadow-sm">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-xl font-bold">세계 지도</h3>
                      <label className="flex items-center gap-1 text-xs font-bold text-[#5A5A40] hover:underline cursor-pointer">
                        <Camera size={14} /> 지도 업로드
                        <input 
                          type="file" 
                          accept="image/*" 
                          className="hidden" 
                          onChange={(e) => handleFileUpload(e, (base64) => saveData({ ...data, world: { ...data.world, mapImage: base64 } }))} 
                        />
                      </label>
                    </div>
                    <div className="w-full aspect-video bg-[#FDFCFB] rounded-2xl overflow-hidden border border-[#E5E1DA] flex items-center justify-center relative group">
                      {data.world.mapImage ? (
                        <img src={data.world.mapImage} alt="World Map" className="w-full h-full object-contain" />
                      ) : (
                        <div className="text-center text-[#86868B]">
                          <ImageIcon size={48} className="mx-auto mb-2 opacity-20" />
                          <p className="text-sm">세계 지도를 업로드해주세요.</p>
                        </div>
                      )}
                      {data.world.mapImage && (
                        <button 
                          onClick={() => saveData({ ...data, world: { ...data.world, mapImage: undefined } })}
                          className="absolute top-4 right-4 p-2 bg-white/80 rounded-full text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {worldSubTab === 'countries' && (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <h3 className="text-xl font-bold">국가 및 지역 설정</h3>
                      <button onClick={addCountry} className="flex items-center gap-1 text-sm font-bold text-[#5A5A40] hover:underline">
                        <Plus size={16} /> 국가 추가
                      </button>
                    </div>
                    <div className="grid grid-cols-1 gap-6">
                      {data.world.countries.map((country) => (
                        <div key={country.id} className="bg-white rounded-2xl p-6 border border-[#E5E1DA] shadow-sm">
                          <div className="flex justify-between items-center mb-6">
                            <input 
                              value={country.name}
                              onChange={(e) => updateCountry(country.id, { name: e.target.value })}
                              className="text-xl font-bold bg-transparent border-b border-transparent focus:border-[#5A5A40] focus:ring-0 p-0"
                              placeholder="국가명"
                            />
                            <button onClick={() => deleteCountry(country.id)} className="text-[#86868B] hover:text-red-500">
                              <Trash2 size={18} />
                            </button>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <WorldField label="시대 배경" value={country.era} onChange={(val) => updateCountry(country.id, { era: val })} placeholder="예: 중세 판타지, 사이버펑크..." />
                            <WorldField label="공간 배경" value={country.space} onChange={(val) => updateCountry(country.id, { space: val })} placeholder="예: 숲의 도시, 지하 기지..." />
                            <WorldField label="주요 종족" value={country.races} onChange={(val) => updateCountry(country.id, { races: val })} placeholder="예: 인간, 엘프, 드워프..." />
                            <WorldField label="역사" value={country.history} onChange={(val) => updateCountry(country.id, { history: val })} placeholder="주요 역사적 사건..." />
                            <WorldField label="사회/문화" value={country.society} onChange={(val) => updateCountry(country.id, { society: val })} placeholder="정치 체제, 풍습..." />
                            <WorldField label="환경" value={country.environment} onChange={(val) => updateCountry(country.id, { environment: val })} placeholder="기후, 지형적 특성..." />
                            <div className="md:col-span-2 lg:col-span-3">
                              <WorldField label="기타 특징" value={country.notes} onChange={(val) => updateCountry(country.id, { notes: val })} placeholder="그 외 특이사항..." />
                            </div>
                          </div>

                          {/* Background References Section */}
                          <div className="mt-8 pt-6 border-t border-[#FDFCFB]">
                            <div className="flex justify-between items-center mb-4">
                              <h4 className="text-sm font-bold flex items-center gap-2">
                                <ImageIcon size={16} className="text-[#5A5A40]" />
                                배경 레퍼런스
                              </h4>
                              <label className="text-xs font-medium text-[#5A5A40] hover:underline cursor-pointer flex items-center gap-1">
                                <Plus size={14} /> 추가하기
                                <input 
                                  type="file" 
                                  accept="image/*" 
                                  className="hidden" 
                                  onChange={(e) => handleFileUpload(e, (base64) => {
                                    const newRefs = [...(country.references || []), { id: Date.now().toString(), url: base64, description: "배경 레퍼런스" }];
                                    updateCountry(country.id, { references: newRefs });
                                  })} 
                                />
                              </label>
                            </div>
                            <div className="flex flex-wrap gap-4">
                              {(country.references || []).map((ref) => (
                                <div key={ref.id} className="relative w-24 h-24 rounded-lg overflow-hidden border border-[#E5E1DA] group/ref">
                                  <img src={ref.url} alt="ref" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                  <button 
                                    onClick={() => {
                                      const newRefs = country.references.filter(r => r.id !== ref.id);
                                      updateCountry(country.id, { references: newRefs });
                                    }}
                                    className="absolute top-1 right-1 p-1 bg-white/80 rounded-full text-red-500 opacity-0 group-hover/ref:opacity-100 transition-opacity"
                                  >
                                    <Trash2 size={10} />
                                  </button>
                                </div>
                              ))}
                              {(country.references || []).length === 0 && (
                                <p className="text-xs text-[#86868B] italic">등록된 배경 레퍼런스가 없습니다.</p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {worldSubTab === 'organizations' && (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <h3 className="text-xl font-bold">조직 및 단체</h3>
                      <button onClick={addOrganization} className="flex items-center gap-1 text-sm font-bold text-[#5A5A40] hover:underline">
                        <Plus size={16} /> 조직 추가
                      </button>
                    </div>
                    <div className="grid grid-cols-1 gap-8">
                      {data.world.organizations.map((org) => (
                        <div key={org.id} className="bg-white rounded-2xl p-8 border border-[#E5E1DA] shadow-sm">
                          <div className="flex flex-col md:flex-row gap-8">
                            <div className="w-full md:w-48 flex flex-col items-center gap-4">
                              <div className="relative w-40 h-40 bg-[#FDFCFB] rounded-2xl overflow-hidden border border-[#E5E1DA] group/logo">
                                {org.logo ? (
                                  <img src={org.logo} alt={org.name} className="w-full h-full object-contain" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-[#86868B]">
                                    <Sparkles size={48} />
                                  </div>
                                )}
                                <label className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/logo:opacity-100 transition-opacity cursor-pointer text-white text-xs font-bold">
                                  로고 업로드
                                  <input 
                                    type="file" 
                                    accept="image/*" 
                                    className="hidden" 
                                    onChange={(e) => handleFileUpload(e, (base64) => updateOrganization(org.id, { logo: base64 }))} 
                                  />
                                </label>
                              </div>
                              <p className="text-[10px] font-bold text-[#86868B] uppercase tracking-widest">Organization Logo</p>
                            </div>
                            <div className="flex-1 space-y-6">
                              <div className="flex justify-between items-center">
                                <input 
                                  value={org.name}
                                  onChange={(e) => updateOrganization(org.id, { name: e.target.value })}
                                  className="text-2xl font-bold bg-transparent border-b border-transparent focus:border-[#5A5A40] focus:ring-0 p-0"
                                  placeholder="조직명"
                                />
                                <button onClick={() => deleteOrganization(org.id)} className="text-[#86868B] hover:text-red-500">
                                  <Trash2 size={20} />
                                </button>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <WorldField label="목적" value={org.purpose} onChange={(val) => updateOrganization(org.id, { purpose: val })} placeholder="조직의 설립 목적..." />
                                <WorldField label="구조" value={org.structure} onChange={(val) => updateOrganization(org.id, { structure: val })} placeholder="계급 체계, 부서..." />
                                <WorldField label="상징" value={org.symbol} onChange={(val) => updateOrganization(org.id, { symbol: val })} placeholder="문양, 색상, 구호..." />
                                <WorldField label="복장" value={org.costume} onChange={(val) => updateOrganization(org.id, { costume: val })} placeholder="유니폼, 장비..." />
                              </div>
                              
                              <div className="pt-4 border-t border-[#FDFCFB]">
                                <label className="text-xs font-bold text-[#86868B] uppercase tracking-wider mb-3 block">소속 캐릭터 (클릭하여 추가/제거)</label>
                                <div className="flex flex-wrap gap-2">
                                  {data.characters.map(char => (
                                    <button 
                                      key={char.id}
                                      onClick={() => {
                                        const isMember = org.memberIds.includes(char.id);
                                        const newMemberIds = isMember 
                                          ? org.memberIds.filter(id => id !== char.id)
                                          : [...org.memberIds, char.id];
                                        updateOrganization(org.id, { memberIds: newMemberIds });
                                      }}
                                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 ${
                                        org.memberIds.includes(char.id)
                                          ? 'bg-[#5A5A40] text-white'
                                          : 'bg-[#FDFCFB] text-[#424245] hover:bg-[#F5F5F0]'
                                      }`}
                                    >
                                      {char.name}
                                      {org.memberIds.includes(char.id) && (
                                        <span 
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setActiveTab('characters');
                                          }}
                                          className="ml-1 p-0.5 bg-white/20 rounded-full hover:bg-white/40"
                                          title="캐릭터 시트로 이동"
                                        >
                                          <ChevronRight size={10} />
                                        </span>
                                      )}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'characters' && (
              <motion.div 
                key="characters"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-10"
              >
                {/* Relationship Map Section */}
                <section className="bg-white rounded-2xl p-6 border border-[#E5E1DA] shadow-sm">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold flex items-center gap-2">
                      <Layers size={20} className="text-[#5A5A40]" />
                      인물 관계도 (이미지)
                    </h3>
                    <label className="flex items-center gap-1 text-xs font-bold text-[#5A5A40] hover:underline cursor-pointer">
                      <Camera size={14} /> 이미지 업로드
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={(e) => handleFileUpload(e, (base64) => saveData({ ...data, relationshipMapImage: base64 }))} 
                      />
                    </label>
                  </div>
                  
                  <div className="w-full aspect-[21/9] bg-[#FDFCFB] rounded-2xl overflow-hidden border border-[#E5E1DA] flex items-center justify-center relative group">
                    {data.relationshipMapImage ? (
                      <img src={data.relationshipMapImage} alt="Relationship Map" className="w-full h-full object-contain" />
                    ) : (
                      <div className="text-center text-[#86868B]">
                        <ImageIcon size={48} className="mx-auto mb-2 opacity-20" />
                        <p className="text-sm">직접 그린 관계도 이미지를 업로드해주세요.</p>
                      </div>
                    )}
                    {data.relationshipMapImage && (
                      <button 
                        onClick={() => saveData({ ...data, relationshipMapImage: undefined })}
                        className="absolute top-4 right-4 p-2 bg-white/80 rounded-full text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>
                </section>

                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold">캐릭터 리스트</h2>
                  <button 
                    onClick={addCharacter}
                    className="flex items-center gap-2 px-4 py-2 bg-[#5A5A40] text-white rounded-full text-sm font-medium hover:bg-[#4A4A30] transition-colors shadow-md"
                  >
                    <Plus size={18} />
                    캐릭터 추가
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-6">
                  {data.characters.map((char) => (
                    <div key={char.id} className="bg-white rounded-2xl p-6 border border-[#E5E1DA] shadow-sm group">
                      <div className="flex flex-col md:flex-row gap-8">
                        {/* Profile Image Section */}
                        <div className="w-full md:w-48 flex flex-col items-center gap-4">
                          <div className="relative w-40 h-40 bg-[#FDFCFB] rounded-2xl overflow-hidden border border-[#E5E1DA] group/img">
                            {char.profileImage ? (
                              <img src={char.profileImage} alt={char.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-[#86868B]">
                                <User size={48} />
                              </div>
                            )}
                            <label className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity cursor-pointer text-white text-xs font-bold">
                              <Camera size={20} className="mr-2" />
                              변경하기
                              <input 
                                type="file" 
                                accept="image/*" 
                                className="hidden" 
                                onChange={(e) => handleFileUpload(e, (base64) => updateCharacter(char.id, { profileImage: base64 }))} 
                              />
                            </label>
                          </div>
                          <p className="text-[10px] font-bold text-[#86868B] uppercase tracking-widest">Profile Image</p>
                        </div>

                        {/* Info Section */}
                        <div className="flex-1">
                          <div className="flex justify-between items-start mb-4">
                            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                              <input 
                                value={char.name}
                                onChange={(e) => updateCharacter(char.id, { name: e.target.value })}
                                className="text-xl font-bold bg-transparent border-b border-transparent focus:border-[#5A5A40] focus:ring-0 p-0"
                                placeholder="이름"
                              />
                              <input 
                                value={char.role}
                                onChange={(e) => updateCharacter(char.id, { role: e.target.value })}
                                className="text-sm font-medium text-[#5A5A40] bg-transparent border-b border-transparent focus:border-[#5A5A40] focus:ring-0 p-0"
                                placeholder="역할 (예: 주연, 조연)"
                              />
                            </div>
                            <button 
                              onClick={() => deleteCharacter(char.id)}
                              className="text-[#86868B] hover:text-red-500 transition-colors p-2"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                            <CharacterField 
                              label="캐치프레이즈" 
                              value={char.catchphrase || ""} 
                              onChange={(val) => updateCharacter(char.id, { catchphrase: val })} 
                              placeholder="대표 대사..."
                            />
                            <CharacterField 
                              label="욕망" 
                              value={char.desire || ""} 
                              onChange={(val) => updateCharacter(char.id, { desire: val })} 
                              placeholder="캐릭터가 원하는 것..."
                            />
                            <CharacterField 
                              label="신념" 
                              value={char.belief || ""} 
                              onChange={(val) => updateCharacter(char.id, { belief: val })} 
                              placeholder="캐릭터의 가치관..."
                            />
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            <CharacterField 
                              label="키워드" 
                              value={char.keywords || ""} 
                              onChange={(val) => updateCharacter(char.id, { keywords: val })} 
                              placeholder="예: 열혈, 천재, 트라우마..."
                            />
                            <CharacterField 
                              label="성격" 
                              value={char.personality} 
                              onChange={(val) => updateCharacter(char.id, { personality: val })} 
                              placeholder="성격 묘사..."
                            />
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            <CharacterField 
                              label="외양" 
                              value={char.appearance} 
                              onChange={(val) => updateCharacter(char.id, { appearance: val })} 
                              placeholder="신체적 특징, 복장..."
                            />
                            <CharacterField 
                              label="능력 (선택)" 
                              value={char.ability || ""} 
                              onChange={(val) => updateCharacter(char.id, { ability: val })} 
                              placeholder="캐릭터의 특수 능력이나 기술..."
                            />
                          </div>
                          <div className="grid grid-cols-1 gap-6 mb-6">
                            <CharacterField 
                              label="기타 메모" 
                              value={char.notes} 
                              onChange={(val) => updateCharacter(char.id, { notes: val })} 
                              placeholder="배경 설정 등..."
                            />
                          </div>
                        </div>
                      </div>

                      {/* Character References Section */}
                      <div className="mt-8 pt-6 border-t border-[#FDFCFB]">
                        <div className="flex justify-between items-center mb-4">
                          <h4 className="text-sm font-bold flex items-center gap-2">
                            <LinkIcon size={16} className="text-[#5A5A40]" />
                            캐릭터 레퍼런스
                          </h4>
                          <label className="text-xs font-medium text-[#5A5A40] hover:underline cursor-pointer flex items-center gap-1">
                            <Plus size={14} /> 추가하기
                            <input 
                              type="file" 
                              accept="image/*" 
                              className="hidden" 
                              onChange={(e) => handleFileUpload(e, (base64) => {
                                const newRefs = [...char.references, { id: Date.now().toString(), url: base64 }];
                                updateCharacter(char.id, { references: newRefs });
                              })} 
                            />
                          </label>
                        </div>
                        <div className="flex flex-wrap gap-4">
                          {char.references.map((ref) => (
                            <div key={ref.id} className="relative w-24 h-24 rounded-lg overflow-hidden border border-[#E5E1DA] group/ref">
                              <img src={ref.url} alt="ref" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                              <button 
                                onClick={() => {
                                  const newRefs = char.references.filter(r => r.id !== ref.id);
                                  updateCharacter(char.id, { references: newRefs });
                                }}
                                className="absolute top-1 right-1 p-1 bg-white/80 rounded-full text-red-500 opacity-0 group-hover/ref:opacity-100 transition-opacity"
                              >
                                <Trash2 size={10} />
                              </button>
                            </div>
                          ))}
                          {char.references.length === 0 && (
                            <p className="text-xs text-[#86868B] italic">등록된 레퍼런스가 없습니다.</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === 'story' && (
              <motion.div 
                key="story"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-10"
              >
                <section>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold flex items-center gap-2">
                      <Sparkles size={20} className="text-[#5A5A40]" />
                      요약 시놉시스 (Summary Synopsis)
                    </h3>
                  </div>
                  <div className="bg-white rounded-2xl p-6 border border-[#E5E1DA] shadow-sm">
                    <textarea 
                      value={data.basicSettings.synopsis}
                      onChange={(e) => saveData({ ...data, basicSettings: { ...data.basicSettings, synopsis: e.target.value } })}
                      className="w-full h-32 bg-[#FDFCFB] rounded-xl p-4 border-none focus:ring-2 focus:ring-[#5A5A40] resize-none text-sm leading-relaxed"
                      placeholder="전체적인 줄거리를 요약하여 입력해주세요."
                    />
                  </div>
                </section>

                <section>
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <Layers size={20} className="text-[#5A5A40]" />
                    3막 15장 (Save the Cat)
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {data.story.beats.map((beat, idx) => (
                      <div key={beat.id} className="bg-white rounded-xl p-4 border border-[#E5E1DA] shadow-sm">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs font-bold bg-[#FDFCFB] text-[#86868B] w-6 h-6 rounded-full flex items-center justify-center">
                            {idx + 1}
                          </span>
                          <h4 className="text-sm font-bold">{beat.title}</h4>
                        </div>
                        <textarea 
                          value={beat.content}
                          onChange={(e) => {
                            const newBeats = data.story.beats.map(b => b.id === beat.id ? { ...b, content: e.target.value } : b);
                            updateStory('beats', newBeats);
                          }}
                          className="w-full h-24 text-sm bg-transparent border-none focus:ring-0 p-0 resize-none"
                          placeholder="내용을 입력하세요..."
                        />
                      </div>
                    ))}
                  </div>
                </section>

                <section>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold flex items-center gap-2">
                      <ImageIcon size={20} className="text-[#5A5A40]" />
                      타임라인 이미지
                    </h3>
                    <label className="flex items-center gap-1 text-xs font-bold text-[#5A5A40] hover:underline cursor-pointer">
                      <Camera size={14} /> 업로드
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={(e) => handleFileUpload(e, (base64) => updateStory('timelineImage', base64))} 
                      />
                    </label>
                  </div>
                  <div className="w-full aspect-[21/5] bg-white rounded-2xl overflow-hidden border border-[#E5E1DA] flex items-center justify-center relative group">
                    {data.story.timelineImage ? (
                      <img src={data.story.timelineImage} alt="Timeline" className="w-full h-full object-contain" />
                    ) : (
                      <div className="text-center text-[#86868B]">
                        <ImageIcon size={32} className="mx-auto mb-2 opacity-20" />
                        <p className="text-xs">타임라인 이미지를 업로드하세요.</p>
                      </div>
                    )}
                    {data.story.timelineImage && (
                      <button 
                        onClick={() => updateStory('timelineImage', undefined)}
                        className="absolute top-4 right-4 p-2 bg-white/80 rounded-full text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>
                </section>

                <section>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold flex items-center gap-2">
                      <BookOpen size={20} className="text-[#5A5A40]" />
                      트리트먼트 (화별 요약)
                    </h3>
                    <button 
                      onClick={addEpisode}
                      className="flex items-center gap-1 text-xs font-bold text-[#5A5A40] hover:underline"
                    >
                      <Plus size={14} /> 화 추가
                    </button>
                  </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {(data.story.episodes || []).map((ep) => (
                        <div key={ep.id} className="bg-white rounded-xl p-4 border border-[#E5E1DA] shadow-sm">
                          <div className="flex justify-between items-center mb-3">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold bg-[#FDFCFB] text-[#5A5A40] px-2 py-0.5 rounded-full">{ep.episodeNumber}화</span>
                              <input 
                                value={ep.title}
                                onChange={(e) => updateEpisode(ep.id, { title: e.target.value })}
                                className="text-xs font-bold bg-transparent border-none focus:ring-0 p-0 w-32"
                                placeholder="제목"
                              />
                            </div>
                            <button onClick={() => deleteEpisode(ep.id)} className="text-[#86868B] hover:text-red-500">
                              <Trash2 size={14} />
                            </button>
                          </div>
                          <textarea 
                            value={ep.content}
                            onChange={(e) => updateEpisode(ep.id, { content: e.target.value })}
                            className="w-full h-20 bg-[#FDFCFB] rounded-lg p-2 border-none focus:ring-1 focus:ring-[#5A5A40] resize-none text-[10px] leading-tight"
                            placeholder="줄거리 요약..."
                          />
                        </div>
                      ))}
                    </div>
                </section>

                <section>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold flex items-center gap-2">
                      <Sparkles size={20} className="text-[#5A5A40]" />
                      보고 싶은 장면 (상세)
                    </h3>
                    <button 
                      onClick={addDesiredScene}
                      className="flex items-center gap-1 text-xs font-bold text-[#5A5A40] hover:underline"
                    >
                      <Plus size={14} /> 장면 추가
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {(data.story.desiredScenes || []).map((scene) => (
                      <div key={scene.id} className="bg-white rounded-2xl p-5 border border-[#E5E1DA] shadow-sm flex flex-col gap-3">
                        <div className="flex justify-between items-start">
                          <input 
                            value={scene.title}
                            onChange={(e) => updateDesiredScene(scene.id, { title: e.target.value })}
                            className="text-base font-bold bg-transparent border-none focus:ring-0 p-0 w-full"
                            placeholder="장면 제목"
                          />
                          <button onClick={() => deleteDesiredScene(scene.id)} className="text-[#86868B] hover:text-red-500 ml-2">
                            <Trash2 size={16} />
                          </button>
                        </div>
                        <textarea 
                          value={scene.content}
                          onChange={(e) => updateDesiredScene(scene.id, { content: e.target.value })}
                          className="w-full h-24 bg-[#FDFCFB] rounded-xl p-3 border-none focus:ring-1 focus:ring-[#5A5A40] resize-none text-xs leading-relaxed"
                          placeholder="장면에 대한 설명을 입력하세요..."
                        />
                      </div>
                    ))}
                  </div>
                </section>

                  <section>
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                      <LinkIcon size={20} className="text-[#5A5A40]" />
                      레퍼런스 (텍스트)
                    </h3>
                    <div className="bg-white rounded-2xl p-6 border border-[#E5E1DA] grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
                      {data.story.references.map((ref, i) => (
                        <div key={i} className="flex items-center gap-2 py-2 border-b border-[#FDFCFB] last:border-0">
                          <LinkIcon size={14} className="text-[#5A5A40]" />
                          <input 
                            value={ref}
                            onChange={(e) => {
                              const newRefs = [...data.story.references];
                              newRefs[i] = e.target.value;
                              updateStory('references', newRefs);
                            }}
                            className="flex-1 text-sm bg-transparent border-none focus:ring-0 p-0"
                            placeholder="레퍼런스 제목/링크"
                          />
                          <button 
                            onClick={() => {
                              const newRefs = data.story.references.filter((_, idx) => idx !== i);
                              updateStory('references', newRefs);
                            }}
                            className="text-[#86868B] hover:text-red-500"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      ))}
                      <button 
                        onClick={() => updateStory('references', [...data.story.references, ""])}
                        className="mt-2 text-sm text-[#5A5A40] font-medium flex items-center gap-1 hover:underline col-span-full"
                      >
                        <Plus size={14} /> 추가하기
                      </button>
                    </div>
                  </section>
              </motion.div>
            )}

            {activeTab === 'progress' && (
              <motion.div 
                key="progress"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-8"
              >
                <div className="flex justify-between items-center">
                  <h2 className="text-3xl font-bold tracking-tight">진행 상황 (Progress Log)</h2>
                  <button 
                    onClick={addProgressEntry}
                    className="flex items-center gap-2 px-6 py-3 bg-[#5A5A40] text-white rounded-full font-bold hover:bg-[#4A4A30] transition-all shadow-lg shadow-[#E5E1DA]"
                  >
                    <Plus size={20} />
                    새 로그 추가
                  </button>
                </div>

                <div className="space-y-6">
                  {(data.progress || []).map((entry) => (
                    <div key={entry.id} className="bg-white rounded-2xl p-6 border border-[#E5E1DA] shadow-sm flex flex-col md:flex-row gap-6">
                      <div className="w-full md:w-48 aspect-square bg-[#FDFCFB] rounded-xl overflow-hidden border border-[#E5E1DA] relative group shrink-0">
                        {entry.image ? (
                          <img src={entry.image} alt="Progress" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[#86868B]">
                            <ImageIcon size={32} />
                          </div>
                        )}
                        <label className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white text-xs font-bold">
                          이미지 첨부
                          <input 
                            type="file" 
                            accept="image/*" 
                            className="hidden" 
                            onChange={(e) => handleFileUpload(e, (base64) => updateProgressEntry(entry.id, { image: base64 }))} 
                          />
                        </label>
                      </div>
                      <div className="flex-1 space-y-4">
                        <div className="flex justify-between items-start">
                          <input 
                            type="date"
                            value={entry.date}
                            onChange={(e) => updateProgressEntry(entry.id, { date: e.target.value })}
                            className="text-xl font-bold bg-transparent border-none focus:ring-0 p-0 text-[#5A5A40]"
                          />
                          <button onClick={() => deleteProgressEntry(entry.id)} className="text-[#86868B] hover:text-red-500">
                            <Trash2 size={20} />
                          </button>
                        </div>
                        <textarea 
                          value={entry.memo}
                          onChange={(e) => updateProgressEntry(entry.id, { memo: e.target.value })}
                          className="w-full h-32 bg-[#FDFCFB] rounded-xl p-4 border-none focus:ring-2 focus:ring-[#5A5A40] resize-none text-sm"
                          placeholder="오늘의 진행 상황이나 메모를 남겨주세요..."
                        />
                      </div>
                    </div>
                  ))}
                  {(!data.progress || data.progress.length === 0) && (
                    <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-[#E5E1DA]">
                      <LayoutDashboard size={48} className="mx-auto mb-4 text-[#86868B] opacity-20" />
                      <p className="text-[#86868B]">아직 기록된 진행 상황이 없습니다.</p>
                      <button 
                        onClick={addProgressEntry}
                        className="mt-4 text-[#5A5A40] font-bold hover:underline"
                      >
                        첫 로그 작성하기
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === 'references' && (
              <motion.div 
                key="references"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-8"
              >
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold">레퍼런스 보드</h2>
                  <div className="flex gap-2">
                    <label className="flex items-center gap-2 px-4 py-2 bg-[#5A5A40] text-white rounded-full text-sm font-medium hover:bg-[#4A4A30] transition-colors cursor-pointer">
                      <Camera size={18} />
                      {refSubTab === 'character' ? '캐릭터 이미지' : refSubTab === 'story' ? '스토리 이미지' : '배경 이미지'} 추가
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={(e) => handleFileUpload(e, (base64) => {
                          if (refSubTab === 'character') {
                            // Default to first character if exists
                            if (data.characters.length > 0) {
                              const char = data.characters[0];
                              const newRefs = [...char.references, { id: Date.now().toString(), url: base64 }];
                              updateCharacter(char.id, { references: newRefs });
                            }
                          } else if (refSubTab === 'story') {
                            addStoryReference(base64);
                          } else {
                            addBackgroundReference(base64);
                          }
                        })} 
                      />
                    </label>
                  </div>
                </div>

                {/* Sub-tabs for Reference Board */}
                <div className="flex border-b border-[#E5E1DA] gap-8">
                  <button 
                    onClick={() => setRefSubTab('character')}
                    className={`pb-4 text-sm font-semibold transition-all relative ${refSubTab === 'character' ? 'text-[#5A5A40]' : 'text-[#86868B]'}`}
                  >
                    캐릭터 시트
                    {refSubTab === 'character' && <motion.div layoutId="refTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#5A5A40]" />}
                  </button>
                  <button 
                    onClick={() => setRefSubTab('story')}
                    className={`pb-4 text-sm font-semibold transition-all relative ${refSubTab === 'story' ? 'text-[#5A5A40]' : 'text-[#86868B]'}`}
                  >
                    스토리
                    {refSubTab === 'story' && <motion.div layoutId="refTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#5A5A40]" />}
                  </button>
                  <button 
                    onClick={() => setRefSubTab('background')}
                    className={`pb-4 text-sm font-semibold transition-all relative ${refSubTab === 'background' ? 'text-[#5A5A40]' : 'text-[#86868B]'}`}
                  >
                    배경
                    {refSubTab === 'background' && <motion.div layoutId="refTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#5A5A40]" />}
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
                  {filteredReferences.map((ref) => (
                    <div key={ref.id} className="bg-white rounded-2xl overflow-hidden border border-[#E5E1DA] shadow-sm group">
                      <div className="relative aspect-square bg-[#FDFCFB]">
                        <img 
                          src={ref.url} 
                          alt={ref.description} 
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute top-2 left-2">
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full ${
                            ref.sourceType === 'character_profile' ? 'bg-blue-100 text-blue-700' : 
                            ref.sourceType === 'character_ref' ? 'bg-purple-100 text-purple-700' : 
                            ref.sourceType === 'story_ref' ? 'bg-amber-100 text-amber-700' :
                            'bg-emerald-100 text-emerald-700'
                          }`}>
                            {ref.sourceType === 'character_profile' ? 'Profile' : 
                             ref.sourceType === 'character_ref' ? 'Char Ref' : 
                             ref.sourceType === 'story_ref' ? 'Story' : 'Background'}
                          </span>
                        </div>
                        {(ref.sourceType === 'background_ref' || ref.sourceType === 'story_ref') && (
                          <button 
                            onClick={() => {
                              if (ref.sourceType === 'background_ref') {
                                saveData({ ...data, backgroundReferences: data.backgroundReferences.filter(g => g.id !== ref.id) });
                              } else {
                                saveData({ ...data, story: { ...data.story, imageReferences: data.story.imageReferences.filter(s => s.id !== ref.id) } });
                              }
                            }}
                            className="absolute top-2 right-2 p-2 bg-white/80 backdrop-blur-sm rounded-full text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                      <div className="p-3">
                        <p className="text-xs font-medium text-[#424245] truncate">{ref.description}</p>
                      </div>
                    </div>
                  ))}
                  {filteredReferences.length === 0 && (
                    <div className="col-span-full py-20 text-center text-[#86868B]">
                      <ImageIcon size={48} className="mx-auto mb-4 opacity-20" />
                      <p>이 카테고리에 등록된 이미지가 없습니다.</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Hidden container for full export */}
      <div id="full-export-content" style={{ display: 'none', position: 'absolute', left: '-9999px', top: 0, width: '1200px', backgroundColor: '#FDFCFB' }}>
        <FullExportView data={data} />
      </div>
    </motion.div>
  )}
</AnimatePresence>
);
}

// --- Full Export View Component ---

function FullExportView({ data }: { data: ProjectData }) {
  return (
    <div className="p-12 space-y-16 text-[#424245]">
      {/* Header */}
      <div className="border-b-2 border-[#5A5A40] pb-8">
        <h1 className="text-5xl font-bold mb-4">{data.title}</h1>
        <p className="text-xl text-[#86868B] italic">전체 기획안 리포트</p>
      </div>

      {/* Basic Settings */}
      <section className="space-y-8">
        <h2 className="text-3xl font-bold border-l-8 border-[#5A5A40] pl-4">기본 설정</h2>
        <div className="grid grid-cols-1 gap-6">
          <ExportField label="기획 의도" value={data.basicSettings.intention} />
          <ExportField label="로그라인" value={data.basicSettings.logline} />
          <ExportField label="요약 시놉시스" value={data.basicSettings.synopsis} />
          <div className="grid grid-cols-2 gap-6">
            <ExportField label="장르" value={data.basicSettings.genre} />
            <ExportField label="타겟" value={data.basicSettings.target} />
          </div>
          <ExportField label="메시지" value={data.basicSettings.message} />
          <ExportField label="핵심 키워드" value={data.basicSettings.keywords} />
        </div>
      </section>

      {/* World Setting */}
      <section className="space-y-8">
        <h2 className="text-3xl font-bold border-l-8 border-[#5A5A40] pl-4">세계관 설정</h2>
        
        {data.world.mapImage && (
          <div className="bg-white p-4 rounded-2xl border border-[#E5E1DA]">
            <p className="text-xs font-bold text-[#86868B] uppercase mb-2">세계관 지도</p>
            <img src={data.world.mapImage} className="w-full rounded-xl" />
          </div>
        )}

        <div className="space-y-6">
          <h3 className="text-xl font-bold">국가 및 지역</h3>
          <div className="grid grid-cols-1 gap-6">
            {data.world.countries.map(country => (
              <div key={country.id} className="bg-white p-6 rounded-2xl border border-[#E5E1DA]">
                <h4 className="text-lg font-bold mb-4">{country.name}</h4>
                <div className="grid grid-cols-2 gap-4">
                  <ExportField label="시대" value={country.era} />
                  <ExportField label="공간" value={country.space} />
                  <ExportField label="종족" value={country.races} />
                  <ExportField label="역사" value={country.history} />
                  <ExportField label="사회" value={country.society} />
                  <ExportField label="환경" value={country.environment} />
                  <ExportField label="비고" value={country.notes} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <h3 className="text-xl font-bold">용어 및 설정</h3>
          <div className="grid grid-cols-2 gap-4">
            {data.world.terminology.map(term => (
              <div key={term.id} className="bg-white p-4 rounded-xl border border-[#E5E1DA]">
                <p className="font-bold text-[#5A5A40]">{term.term}</p>
                <p className="text-sm mt-1">{term.definition}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <h3 className="text-xl font-bold">능력 체계</h3>
          <div className="bg-white p-6 rounded-2xl border border-[#E5E1DA]">
            <p className="text-sm whitespace-pre-wrap">{data.world.abilitySystem}</p>
          </div>
        </div>

        <div className="space-y-6">
          <h3 className="text-xl font-bold">조직 및 단체</h3>
          <div className="grid grid-cols-1 gap-6">
            {data.world.organizations.map(org => (
              <div key={org.id} className="bg-white p-6 rounded-2xl border border-[#E5E1DA] flex gap-6">
                {org.logo && <img src={org.logo} className="w-24 h-24 object-contain rounded-xl border border-[#E5E1DA]" />}
                <div className="flex-1 space-y-2">
                  <h4 className="text-lg font-bold">{org.name}</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <p><span className="font-bold text-[#86868B]">목적:</span> {org.purpose}</p>
                    <p><span className="font-bold text-[#86868B]">상징:</span> {org.symbol}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Characters */}
      <section className="space-y-8">
        <h2 className="text-3xl font-bold border-l-8 border-[#5A5A40] pl-4">캐릭터 설정</h2>
        <div className="grid grid-cols-1 gap-12">
          {data.characters.map(char => (
            <div key={char.id} className="bg-white p-8 rounded-3xl border border-[#E5E1DA] flex flex-col md:flex-row gap-8">
              <div className="w-full md:w-64">
                {char.profileImage ? (
                  <img src={char.profileImage} className="w-full aspect-[3/4] object-cover rounded-2xl shadow-md" />
                ) : (
                  <div className="w-full aspect-[3/4] bg-[#FDFCFB] rounded-2xl border border-dashed border-[#E5E1DA] flex items-center justify-center text-[#86868B]">
                    이미지 없음
                  </div>
                )}
              </div>
              <div className="flex-1 space-y-6">
                <div className="flex justify-between items-end border-b-2 border-[#F5F5F0] pb-2">
                  <h3 className="text-3xl font-bold">{char.name}</h3>
                  <p className="text-[#86868B] font-medium">{char.role}</p>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  <ExportField label="성격" value={char.personality} />
                  <ExportField label="외양" value={char.appearance} />
                  {char.ability && <ExportField label="능력/특징" value={char.ability} />}
                  <ExportField label="비고" value={char.notes} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {data.relationshipMapImage && (
          <div className="bg-white p-6 rounded-2xl border border-[#E5E1DA]">
            <h3 className="text-xl font-bold mb-4">인물 관계도</h3>
            <img src={data.relationshipMapImage} className="w-full rounded-xl" />
          </div>
        )}
      </section>

      {/* Story */}
      <section className="space-y-8">
        <h2 className="text-3xl font-bold border-l-8 border-[#5A5A40] pl-4">스토리 전개</h2>
        
        <div className="space-y-6">
          <h3 className="text-xl font-bold">스토리 비트</h3>
          <div className="space-y-4">
            {data.story.beats.map((beat, idx) => (
              <div key={beat.id} className="bg-white p-6 rounded-2xl border border-[#E5E1DA]">
                <p className="text-xs font-bold text-[#5A5A40] mb-1">BEAT {idx + 1}</p>
                <h4 className="font-bold mb-2">{beat.title}</h4>
                <p className="text-sm whitespace-pre-wrap">{beat.content}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <h3 className="text-xl font-bold">에피소드 트리트먼트</h3>
          <div className="space-y-4">
            {data.story.episodes.map(ep => (
              <div key={ep.id} className="bg-white p-6 rounded-2xl border border-[#E5E1DA]">
                <h4 className="font-bold mb-2">{ep.title}</h4>
                <p className="text-sm whitespace-pre-wrap">{ep.content}</p>
              </div>
            ))}
          </div>
        </div>

        {data.story.timelineImage && (
          <div className="bg-white p-6 rounded-2xl border border-[#E5E1DA]">
            <h3 className="text-xl font-bold mb-4">스토리 타임라인</h3>
            <img src={data.story.timelineImage} className="w-full rounded-xl" />
          </div>
        )}

        <div className="space-y-6">
          <h3 className="text-xl font-bold">주요 장면 (Desired Scenes)</h3>
          <div className="grid grid-cols-1 gap-6">
            {data.story.desiredScenes.map(scene => (
              <div key={scene.id} className="bg-white p-6 rounded-2xl border border-[#E5E1DA]">
                <h4 className="font-bold mb-2">{scene.title}</h4>
                <div className="grid grid-cols-2 gap-4 text-xs text-[#86868B] mb-3">
                  <p><span className="font-bold">장소:</span> {scene.location}</p>
                  <p><span className="font-bold">등장인물:</span> {scene.involvedCharacters}</p>
                </div>
                <p className="text-sm whitespace-pre-wrap mb-4">{scene.content}</p>
                {scene.image && <img src={scene.image} className="w-full rounded-xl border border-[#E5E1DA]" />}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Progress */}
      <section className="space-y-8">
        <h2 className="text-3xl font-bold border-l-8 border-[#5A5A40] pl-4">작업 로그</h2>
        <div className="space-y-4">
          {data.progress.map(entry => (
            <div key={entry.id} className="bg-white p-6 rounded-2xl border border-[#E5E1DA] flex gap-6">
              <div className="w-32 shrink-0">
                <p className="text-sm font-bold text-[#5A5A40]">{entry.date}</p>
              </div>
              <div className="flex-1">
                <p className="text-sm whitespace-pre-wrap">{entry.memo}</p>
                {entry.image && <img src={entry.image} className="mt-4 max-w-md rounded-xl border border-[#E5E1DA]" />}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* References */}
      <section className="space-y-8">
        <h2 className="text-3xl font-bold border-l-8 border-[#5A5A40] pl-4">이미지 레퍼런스 보드</h2>
        <div className="grid grid-cols-3 gap-6">
          {[...(data.backgroundReferences || []), ...data.story.imageReferences].map(ref => (
            <div key={ref.id} className="bg-white rounded-2xl border border-[#E5E1DA] overflow-hidden">
              <img src={ref.url} className="w-full aspect-video object-cover" />
              <div className="p-3">
                <p className="text-xs font-medium truncate">{ref.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <div className="pt-12 border-t border-[#E5E1DA] text-center">
        <p className="text-sm text-[#86868B]">© {new Date().getFullYear()} {data.title} Story Planner Report</p>
      </div>
    </div>
  );
}

function ExportField({ label, value }: { label: string, value: string }) {
  if (!value) return null;
  return (
    <div className="space-y-1">
      <p className="text-[10px] font-bold text-[#86868B] uppercase tracking-widest">{label}</p>
      <p className="text-sm leading-relaxed whitespace-pre-wrap">{value}</p>
    </div>
  );
}

// --- Sub-components ---

function SubTabButton({ active, onClick, label }: { active: boolean, onClick: () => void, label: string }) {
  return (
    <button 
      onClick={onClick}
      className={`pb-3 text-sm font-semibold transition-all relative whitespace-nowrap ${active ? 'text-[#5A5A40]' : 'text-[#86868B]'}`}
    >
      {label}
      {active && <motion.div layoutId="subTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#5A5A40]" />}
    </button>
  );
}

function WorldField({ label, value, onChange, placeholder }: { label: string, value: string, onChange: (val: string) => void, placeholder: string }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[10px] font-bold text-[#86868B] uppercase tracking-wider">{label}</label>
      <textarea 
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-20 text-xs bg-[#FDFCFB] rounded-xl p-3 border-none focus:ring-2 focus:ring-[#5A5A40] resize-none"
        placeholder={placeholder}
      />
    </div>
  );
}

function TabButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
        active 
          ? 'bg-[#F5F5F0] text-[#5A5A40]' 
          : 'text-[#424245] hover:bg-[#FDFCFB]'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function StatCard({ title, value, icon }: { title: string, value: string | number, icon: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl p-6 border border-[#E5E1DA] shadow-sm flex items-center gap-4">
      <div className="p-3 bg-[#FDFCFB] rounded-xl">
        {icon}
      </div>
      <div>
        <p className="text-xs font-semibold text-[#86868B] uppercase tracking-wider">{title}</p>
        <p className="text-2xl font-bold">{value}</p>
      </div>
    </div>
  );
}

function CharacterField({ label, value, onChange, placeholder }: { label: string, value: string, onChange: (val: string) => void, placeholder: string }) {
  return (
    <div className="space-y-2">
      <label className="text-xs font-bold text-[#86868B] uppercase tracking-wider">{label}</label>
      <textarea 
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-24 text-sm bg-[#FDFCFB] rounded-xl p-3 border-none focus:ring-2 focus:ring-[#5A5A40] resize-none"
        placeholder={placeholder}
      />
    </div>
  );
}
