import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router';
import { Search, X, ChevronLeft, ChevronRight, ExternalLink, Calendar, Tag } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Masonry, { ResponsiveMasonry } from 'react-responsive-masonry';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';

interface Activity {
  id: string;
  title: string;
  date: string;
  month: string;
  tags: string[];
  image: string;
  description: string;
  links?: {
    notion?: string;
    github?: string;
    blog?: string;
  };
  height: number; // for masonry layout variety
}

const activities: Activity[] = [
  // 2026.02
  {
    id: 'act-1',
    title: 'ROS2 워크샵 - 자율주행 시뮬레이션',
    date: '2026.02.15',
    month: '2026.02',
    tags: ['ROS', '워크샵'],
    image: 'https://images.unsplash.com/photo-1755053757912-a63da9d6e0e2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800',
    description: 'ROS2 Gazebo를 활용한 자율주행 로봇 시뮬레이션 실습. Navigation2 스택 구축 및 SLAM 실습 진행.',
    links: {
      notion: '#',
      github: '#',
    },
    height: 320,
  },
  {
    id: 'act-2',
    title: '임베디드 시스템 스터디 - ARM Cortex-M',
    date: '2026.02.08',
    month: '2026.02',
    tags: ['임베디드', '스터디'],
    image: 'https://images.unsplash.com/photo-1769148023257-02df7ec903be?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800',
    description: 'ARM Cortex-M 시리즈 마이크로컨트롤러 아키텍처 학습. 인터럽트, 타이머, DMA 실습.',
    links: {
      notion: '#',
    },
    height: 280,
  },
  {
    id: 'act-3',
    title: '2026 Winter Hackathon',
    date: '2026.02.01',
    month: '2026.02',
    tags: ['해커톤', '대회'],
    image: 'https://images.unsplash.com/photo-1638029202288-451a89e0d55f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800',
    description: '24시간 해커톤. IoT 기반 스마트 홈 자동화 프로젝트로 우수상 수상.',
    links: {
      notion: '#',
      github: '#',
      blog: '#',
    },
    height: 360,
  },
  // 2026.01
  {
    id: 'act-4',
    title: 'Arduino 입문 세미나',
    date: '2026.01.25',
    month: '2026.01',
    tags: ['임베디드', '세미나'],
    image: 'https://images.unsplash.com/photo-1553408226-42ecf81a214c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800',
    description: '신입 부원 대상 Arduino 기초 세미나. 센서 인터페이싱 및 시리얼 통신 실습.',
    links: {
      notion: '#',
    },
    height: 300,
  },
  {
    id: 'act-5',
    title: '로봇 팔 제어 프로젝트',
    date: '2026.01.18',
    month: '2026.01',
    tags: ['ROS', '프로젝트'],
    image: 'https://images.unsplash.com/photo-1768323275769-6615e7cfcbe4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800',
    description: '6축 로봇 팔 역기구학 구현 및 ROS MoveIt 연동. Pick & Place 작업 자동화.',
    links: {
      github: '#',
      blog: '#',
    },
    height: 340,
  },
  {
    id: 'act-6',
    title: '코딩 세션 - Python 알고리즘',
    date: '2026.01.12',
    month: '2026.01',
    tags: ['스터디', '알고리즘'],
    image: 'https://images.unsplash.com/photo-1632910121591-29e2484c0259?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800',
    description: '동적 프로그래밍 및 그래프 알고리즘 학습. 백준 골드 문제 풀이 세션.',
    links: {
      notion: '#',
    },
    height: 260,
  },
  {
    id: 'act-7',
    title: '신년 네트워킹 밋업',
    date: '2026.01.05',
    month: '2026.01',
    tags: ['네트워킹', '행사'],
    image: 'https://images.unsplash.com/photo-1560439514-0fc9d2cd5e1b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800',
    description: '2026년 첫 모임. 올해 활동 계획 공유 및 팀 빌딩 활동.',
    links: {
      notion: '#',
    },
    height: 320,
  },
  // 2025.12
  {
    id: 'act-8',
    title: '로보틱스 랩 투어',
    date: '2025.12.20',
    month: '2025.12',
    tags: ['견학', '행사'],
    image: 'https://images.unsplash.com/photo-1708728428891-ce375314e569?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800',
    description: '대학 로보틱스 연구실 견학. 최신 연구 동향 및 실험 장비 체험.',
    links: {
      notion: '#',
    },
    height: 300,
  },
  {
    id: 'act-9',
    title: 'AI Conference 2025 참관',
    date: '2025.12.15',
    month: '2025.12',
    tags: ['AI', '컨퍼런스'],
    image: 'https://images.unsplash.com/photo-1762968269894-1d7e1ce8894e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800',
    description: 'AI & 로보틱스 융합 세션 참석. 강화학습 기반 로봇 제어 발표 청강.',
    links: {
      blog: '#',
    },
    height: 280,
  },
  {
    id: 'act-10',
    title: '드론 조종 워크샵',
    date: '2025.12.08',
    month: '2025.12',
    tags: ['드론', '워크샵'],
    image: 'https://images.unsplash.com/photo-1697122171927-c79709030f1d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800',
    description: '쿼드콥터 조종 기초 및 PID 제어 이론 학습. 실외 비행 실습.',
    links: {
      notion: '#',
      github: '#',
    },
    height: 340,
  },
  {
    id: 'act-11',
    title: '임베디드 리눅스 스터디',
    date: '2025.12.01',
    month: '2025.12',
    tags: ['임베디드', '리눅스', '스터디'],
    image: 'https://images.unsplash.com/photo-1733222765056-b0790217baa9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800',
    description: 'Raspberry Pi 기반 임베디드 리눅스 커널 빌드 및 디바이스 드라이버 개발.',
    links: {
      notion: '#',
      github: '#',
    },
    height: 310,
  },
];

const allTags = ['전체', '임베디드', 'ROS', '해커톤', '워크샵', '스터디', '프로젝트', '세미나', '네트워킹', '행사', '대회', 'AI', '드론', '리눅스', '알고리즘', '컨퍼런스', '견학'];

export default function Activities() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState('전체');
  const [sortOrder, setSortOrder] = useState<'latest' | 'oldest'>('latest');
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [activeMonth, setActiveMonth] = useState('');

  const sectionRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  // Filter and sort activities
  const filteredActivities = activities
    .filter(act => {
      const matchesSearch = act.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           act.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesTag = selectedTag === '전체' || act.tags.includes(selectedTag);
      return matchesSearch && matchesTag;
    })
    .sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return sortOrder === 'latest' ? dateB - dateA : dateA - dateB;
    });

  // Group by month
  const groupedByMonth = filteredActivities.reduce((acc, act) => {
    if (!acc[act.month]) {
      acc[act.month] = [];
    }
    acc[act.month].push(act);
    return acc;
  }, {} as { [key: string]: Activity[] });

  const months = Object.keys(groupedByMonth).sort((a, b) => {
    return sortOrder === 'latest' 
      ? new Date(b).getTime() - new Date(a).getTime()
      : new Date(a).getTime() - new Date(b).getTime();
  });

  // Scroll spy for active month
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 200;

      for (const month of months) {
        const section = sectionRefs.current[month];
        if (section) {
          const { offsetTop, offsetHeight } = section;
          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
            setActiveMonth(month);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [months]);

  const scrollToMonth = (month: string) => {
    const section = sectionRefs.current[month];
    if (section) {
      const yOffset = -120; // sticky header height
      const y = section.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  const openLightbox = (activity: Activity) => {
    setSelectedActivity(activity);
    setCurrentImageIndex(0);
    document.body.style.overflow = 'hidden';
  };

  const closeLightbox = () => {
    setSelectedActivity(null);
    document.body.style.overflow = '';
  };

  // For demo: mock multiple images
  const getLightboxImages = (activity: Activity) => {
    return [activity.image]; // In real app, activities would have multiple images
  };

  const nextImage = () => {
    if (!selectedActivity) return;
    const images = getLightboxImages(selectedActivity);
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    if (!selectedActivity) return;
    const images = getLightboxImages(selectedActivity);
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedActivity) return;
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowRight') nextImage();
      if (e.key === 'ArrowLeft') prevImage();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedActivity]);

  return (
    <div className="min-h-screen bg-white">
      {/* Simple Navigation Header */}
      <div className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <Link 
            to="/" 
            className="inline-flex items-center text-sm font-medium text-gray-600 hover:text-[#103078] transition-colors"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            홈으로 돌아가기
          </Link>
        </div>
      </div>

      {/* Header Section */}
      <div className="bg-gradient-to-b from-gray-50 to-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="flex items-start justify-between gap-6 mb-8">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">활동 갤러리</h1>
              <p className="text-lg text-gray-600">K⚙️BOT 활동 기록</p>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant="secondary" className="text-sm px-4 py-2 h-9 bg-[#103078]/5 text-[#103078] border border-[#103078]/10">
                총 {filteredActivities.length}개
              </Badge>
            </div>
          </div>

          {/* Search Bar */}
          <div className="flex gap-2 max-w-md">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="활동 검색"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    // Search is already reactive, but can add custom logic here
                  }
                }}
                className="pl-10 h-11"
              />
            </div>
            <Button 
              className="h-11 bg-[#103078] hover:bg-[#2048A0] text-white px-6"
              onClick={() => {
                // Search is already reactive through searchQuery state
                // This button provides visual feedback for users
              }}
            >
              검색
            </Button>
          </div>
        </div>
      </div>

      {/* Sticky Filter Bar */}
      <div className="sticky top-[57px] z-40 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            {/* Tag Filters */}
            <div className="flex items-center gap-2 flex-wrap">
              {allTags.map((tag) => (
                <Button
                  key={tag}
                  variant={selectedTag === tag ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedTag(tag)}
                  className={selectedTag === tag 
                    ? 'bg-[#103078] hover:bg-[#2048A0] text-white' 
                    : 'text-gray-600 hover:text-[#103078] hover:border-[#103078]'}
                >
                  {tag}
                </Button>
              ))}
            </div>

            {/* Sort Dropdown */}
            <Select value={sortOrder} onValueChange={(value: 'latest' | 'oldest') => setSortOrder(value)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="latest">최신순</SelectItem>
                <SelectItem value="oldest">오래된순</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12 flex gap-8">
        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {months.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-gray-500">검색 결과가 없습니다.</p>
            </div>
          ) : (
            <div className="space-y-16">
              {months.map((month) => (
                <motion.div
                  key={month}
                  ref={(el) => { sectionRefs.current[month] = el; }}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5 }}
                >
                  {/* Month Header */}
                  <div className="flex items-center justify-between mb-6 pb-3 border-b border-gray-200">
                    <h2 className="text-2xl font-bold text-gray-900">{month}</h2>
                    <span className="text-sm text-gray-500">{groupedByMonth[month].length}개 활동</span>
                  </div>

                  {/* Masonry Grid */}
                  <ResponsiveMasonry columnsCountBreakPoints={{ 350: 1, 640: 2, 1024: 3, 1280: 4 }}>
                    <Masonry gutter="20px">
                      {groupedByMonth[month].map((activity) => (
                        <motion.div
                          key={activity.id}
                          className="group cursor-pointer"
                          whileHover={{ y: -4 }}
                          transition={{ duration: 0.2 }}
                          onClick={() => openLightbox(activity)}
                        >
                          <div className="bg-white rounded-2xl overflow-hidden border border-gray-200 hover:border-[#103078] hover:shadow-lg transition-all duration-200">
                            {/* Image */}
                            <div className="relative overflow-hidden" style={{ height: `${activity.height}px` }}>
                              <img
                                src={activity.image}
                                alt={activity.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                            </div>

                            {/* Meta */}
                            <div className="p-4">
                              <h3 className="font-semibold text-gray-900 mb-2 line-clamp-1 group-hover:text-[#103078] transition-colors">
                                {activity.title}
                              </h3>
                              <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
                                <Calendar className="h-3.5 w-3.5" />
                                <span>{activity.date}</span>
                              </div>
                              <div className="flex flex-wrap gap-1.5">
                                {activity.tags.slice(0, 2).map((tag, idx) => (
                                  <Badge
                                    key={idx}
                                    variant="secondary"
                                    className="text-xs px-2 py-0.5 bg-[#103078]/5 text-[#103078] border-0"
                                  >
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </Masonry>
                  </ResponsiveMasonry>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Floating Month Navigation - Desktop Only */}
        <div className="hidden xl:block sticky top-32 h-fit">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 w-40">
            <p className="text-xs font-medium text-gray-500 mb-3 px-2">빠른 이동</p>
            <div className="space-y-1">
              {months.map((month) => (
                <button
                  key={month}
                  onClick={() => scrollToMonth(month)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeMonth === month
                      ? 'bg-[#103078] text-white'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-[#103078]'
                  }`}
                >
                  {month}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Lightbox Modal */}
      <AnimatePresence>
        {selectedActivity && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
            onClick={closeLightbox}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', damping: 25 }}
              className="relative w-full max-w-6xl max-h-[90vh] flex flex-col md:flex-row gap-6"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                onClick={closeLightbox}
                className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors z-10"
              >
                <X className="h-8 w-8" />
              </button>

              {/* Image Viewer */}
              <div className="flex-1 relative bg-black rounded-lg overflow-hidden flex items-center justify-center">
                <img
                  src={getLightboxImages(selectedActivity)[currentImageIndex]}
                  alt={selectedActivity.title}
                  className="max-w-full max-h-[70vh] object-contain"
                />

                {/* Navigation Arrows (if multiple images) */}
                {getLightboxImages(selectedActivity).length > 1 && (
                  <>
                    <button
                      onClick={prevImage}
                      className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white rounded-full p-2 transition-colors"
                    >
                      <ChevronLeft className="h-6 w-6" />
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white rounded-full p-2 transition-colors"
                    >
                      <ChevronRight className="h-6 w-6" />
                    </button>
                  </>
                )}
              </div>

              {/* Info Panel */}
              <div className="w-full md:w-96 bg-white rounded-lg p-6 overflow-y-auto max-h-[70vh]">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  {selectedActivity.title}
                </h2>

                <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                  <Calendar className="h-4 w-4" />
                  <span>{selectedActivity.date}</span>
                </div>

                <div className="flex flex-wrap gap-2 mb-6">
                  {selectedActivity.tags.map((tag, idx) => (
                    <Badge
                      key={idx}
                      variant="secondary"
                      className="text-sm px-3 py-1 bg-[#103078]/5 text-[#103078] border-0"
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>

                <p className="text-gray-700 leading-relaxed mb-6">
                  {selectedActivity.description}
                </p>

                {/* Links */}
                {selectedActivity.links && (
                  <div className="space-y-2 pt-4 border-t border-gray-200">
                    <p className="text-xs font-medium text-gray-500 mb-3">관련 링크</p>
                    {selectedActivity.links.notion && (
                      <Button variant="outline" size="sm" asChild className="w-full justify-start">
                        <a href={selectedActivity.links.notion} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Notion 페이지
                        </a>
                      </Button>
                    )}
                    {selectedActivity.links.github && (
                      <Button variant="outline" size="sm" asChild className="w-full justify-start">
                        <a href={selectedActivity.links.github} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4 mr-2" />
                          GitHub 저장소
                        </a>
                      </Button>
                    )}
                    {selectedActivity.links.blog && (
                      <Button variant="outline" size="sm" asChild className="w-full justify-start">
                        <a href={selectedActivity.links.blog} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4 mr-2" />
                          활동 후기
                        </a>
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}