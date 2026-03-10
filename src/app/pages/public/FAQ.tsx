import { useState } from 'react';
import { Link } from 'react-router';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '../../components/ui/accordion';

const faqs = [
  {
    q: "비전공자도 지원할 수 있나요?",
    a: "네! 열정과 배우려는 의지가 있다면 전공 무관하게 환영합니다. 기초부터 체계적으로 교육하며, 선배 멘토가 1:1로 도와드립니다.",
    link: { text: "지원하기", url: "/recruit" },
    category: "지원",
  },
  {
    q: "면접이나 과제가 있나요?",
    a: "네, 간단한 면접이 있습니다. 기술 지식보다는 동기와 열정을 중심으로 진행되며, 사전 과제는 없습니다.",
    link: { text: "모집요강 보기", url: "/recruit" },
    category: "지원",
  },
  {
    q: "신입은 무엇부터 배우나요?",
    a: "첫 달은 Git/GitHub, Linux 기초부터 시작합니다. 이후 관심 트랙에 맞춰 ROS, Arduino, Vision 중 선택하여 진행합니다.",
    link: { text: "커리큘럼 보기", url: "/#playbook" },
    category: "활동",
  },
  {
    q: "활동 시간은 어떻게 되나요?",
    a: "정기 세션은 주 1-2회(주로 저녁 시간)이며, 프로젝트는 팀별로 자율적으로 진행됩니다. 시험기간에는 활동을 최소화합니다.",
    link: { text: "일정 보기", url: "/#calendar" },
    category: "운영",
  },
  {
    q: "활동 장소는 어디인가요?",
    a: "주로 과학기술관 310호 동아리실에서 활동합니다. 프로젝트실과 하드웨어 장비를 갖추고 있으며, 24시간 이용 가능합니다.",
    link: { text: "오시는 길", url: "/contact" },
    category: "장소",
  },
  {
    q: "회비나 참가비가 있나요?",
    a: "학기당 소정의 회비(3만원)가 있으며, 프로젝트 재료비와 대회 출전비는 동아리 예산으로 지원됩니다.",
    link: { text: "회비 안내", url: "/recruit#fee" },
    category: "비용",
  },
  {
    q: "필요한 장비가 있나요?",
    a: "개인 노트북이 필요하며, 로봇 개발용 하드웨어(Arduino, 센서, 모터 등)는 동아리에서 지원합니다. 고가 장비도 대여 가능합니다.",
    link: { text: "장비 목록", url: "/#equipment" },
    category: "비용",
  },
  {
    q: "어떤 프로젝트를 하나요?",
    a: "자율주행 로봇, 드론, 로봇팔 제어, 물체 인식 등 다양한 분야의 프로젝트를 진행합니다. 본인의 아이디어로 새 프로젝트를 제안할 수도 있습니다.",
    link: { text: "프로젝트 보기", url: "/#projects" },
    category: "활동",
  },
  {
    q: "대회 참가 기회가 있나요?",
    a: "네, 국내외 로봇 경진대회에 정기적으로 참가하며 여러 수상 경력이 있습니다. 대회 준비비와 참가비는 동아리에서 지원합니다.",
    link: { text: "수상 이력", url: "/#showcase" },
    category: "활동",
  },
  {
    q: "스터디는 어떻게 운영되나요?",
    a: "ROS, Vision, IoT 등 트랙별로 스터디를 운영하며, 멤버가 직접 주제를 제안할 수 있습니다. 주 1회 발표와 실습으로 진행됩니다.",
    link: { text: "트랙 보기", url: "/#tracks" },
    category: "운영",
  },
  {
    q: "졸업 후 진로는 어떤가요?",
    a: "삼성전자, 네이버, 현대자동차 등 대기업 및 로봇 스타트업으로 다수 취업하고 있습니다. 대학원 진학도 활발합니다.",
    link: { text: "진로 통계", url: "/notice#career" },
    category: "활동",
  },
];

const categories = ['전체', '지원', '운영', '활동', '비용', '장소'];

export default function FAQ() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('전체');

  // Filter FAQs
  const filteredFaqs = faqs.filter(faq => {
    const matchesSearch = 
      faq.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.a.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === '전체' || faq.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation Header */}
      <div className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-6 py-4">
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
        <div className="max-w-4xl mx-auto px-6 py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              자주 묻는 질문
            </h1>
            <p className="text-lg text-gray-600 mb-8">
              K⚙️BOT에 대해 궁금하신 점을 찾아보세요
            </p>

            {/* Search Bar */}
            <div className="relative max-w-2xl mx-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                type="text"
                placeholder="궁금한 내용을 검색해보세요 (예: 비전공자, 회비, 활동시간)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-14 text-base"
              />
            </div>
          </motion.div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Category Filters */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="flex flex-wrap gap-2 mb-8 justify-center"
        >
          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(category)}
              className={selectedCategory === category 
                ? 'bg-[#103078] hover:bg-[#2048A0] text-white' 
                : 'text-gray-600 hover:text-[#103078] hover:border-[#103078]'}
            >
              {category}
            </Button>
          ))}
        </motion.div>

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-sm text-gray-500 text-center">
            {filteredFaqs.length}개의 질문이 있습니다
          </p>
        </div>

        {/* FAQ Accordion */}
        {filteredFaqs.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-500">검색 결과가 없습니다.</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('전체');
              }}
            >
              필터 초기화
            </Button>
          </div>
        ) : (
          <Accordion type="single" collapsible className="space-y-3">
            {filteredFaqs.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.03 }}
                className="border border-gray-200 rounded-lg bg-white hover:border-[#2048A0]/60 transition-all data-[state=open]:bg-[#103078]/[0.02] data-[state=open]:border-[#2048A0] overflow-hidden"
              >
                <AccordionItem
                  value={`item-${index}`}
                  className="!border-0 !border-b-0"
                >
                  <AccordionTrigger className="text-left font-semibold text-gray-900 hover:text-[#2048A0] px-5 py-4 hover:no-underline group">
                    <div className="flex items-start justify-between gap-3 w-full pr-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge 
                            variant="secondary" 
                            className="text-xs px-2 py-0.5 bg-[#103078]/5 text-[#103078] border-0"
                          >
                            {faq.category}
                          </Badge>
                        </div>
                        <span className="text-base">{faq.q}</span>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="text-gray-600 px-5 pb-5 pt-0">
                    <div className="space-y-3">
                      <p className="leading-relaxed">{faq.a}</p>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </motion.div>
            ))}
          </Accordion>
        )}

        {/* Additional Help Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-16 p-8 bg-gradient-to-br from-[#103078]/5 to-[#2048A0]/5 rounded-2xl border border-[#103078]/10 text-center"
        >
          <h3 className="text-xl font-bold text-gray-900 mb-3">
            찾으시는 답변이 없으신가요?
          </h3>
          <p className="text-gray-600 mb-6">
            언제든지 문의해주세요. 빠르게 답변드리겠습니다.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link to="/contact">
              <Button className="bg-[#103078] hover:bg-[#2048A0] text-white">
                문의하기
              </Button>
            </Link>
            <Link to="/recruit">
              <Button variant="outline" className="border-[#103078] text-[#103078] hover:bg-[#103078]/5">
                지원하기
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}