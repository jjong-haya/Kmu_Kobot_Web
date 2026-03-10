import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import {
  Search,
  FileText,
  Download,
  Star,
  Folder,
  Upload,
  File,
} from "lucide-react";
import { toast } from "sonner";

export default function Resources() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFolder, setSelectedFolder] = useState("전체");

  const folders = [
    { name: "전체", count: 24 },
    { name: "세미나 자료", count: 8 },
    { name: "프로젝트 코드", count: 6 },
    { name: "논문 & 문서", count: 5 },
    { name: "강의 영상", count: 3 },
    { name: "기타", count: 2 },
  ];

  const resources = [
    {
      id: 1,
      title: "ROS 2 Navigation Stack 완벽 가이드",
      type: "PDF",
      folder: "세미나 자료",
      size: "2.4 MB",
      uploadDate: "2026.02.14",
      uploader: "김철수",
      downloads: 15,
      isFavorite: true,
      tags: ["ROS", "Navigation", "튜토리얼"],
    },
    {
      id: 2,
      title: "자율주행 프로젝트 전체 코드",
      type: "ZIP",
      folder: "프로젝트 코드",
      size: "15.6 MB",
      uploadDate: "2026.02.13",
      uploader: "이영희",
      downloads: 12,
      isFavorite: true,
      tags: ["ROS", "Python", "SLAM"],
    },
    {
      id: 3,
      title: "로봇팔 제어 시뮬레이션",
      type: "VIDEO",
      folder: "강의 영상",
      size: "125 MB",
      uploadDate: "2026.02.12",
      uploader: "박민수",
      downloads: 8,
      isFavorite: false,
      tags: ["Control", "Simulation"],
    },
    {
      id: 4,
      title: "SLAM 알고리즘 비교 논문",
      type: "PDF",
      folder: "논문 & 문서",
      size: "3.2 MB",
      uploadDate: "2026.02.10",
      uploader: "정지훈",
      downloads: 10,
      isFavorite: false,
      tags: ["SLAM", "논문", "알고리즘"],
    },
    {
      id: 5,
      title: "딥러닝 기반 물체 인식 코드",
      type: "ZIP",
      folder: "프로젝트 코드",
      size: "8.9 MB",
      uploadDate: "2026.02.08",
      uploader: "최서연",
      downloads: 18,
      isFavorite: true,
      tags: ["Deep Learning", "YOLO", "Python"],
    },
    {
      id: 6,
      title: "컴퓨터 비전 기초 세미나",
      type: "PDF",
      folder: "세미나 자료",
      size: "5.1 MB",
      uploadDate: "2026.02.05",
      uploader: "김철수",
      downloads: 22,
      isFavorite: false,
      tags: ["Computer Vision", "OpenCV"],
    },
    {
      id: 7,
      title: "ROS 기초 강의 영상",
      type: "VIDEO",
      folder: "강의 영상",
      size: "250 MB",
      uploadDate: "2026.02.01",
      uploader: "운영진",
      downloads: 35,
      isFavorite: true,
      tags: ["ROS", "기초", "강의"],
    },
    {
      id: 8,
      title: "제어 이론 정리 노트",
      type: "PDF",
      folder: "논문 & 문서",
      size: "1.8 MB",
      uploadDate: "2026.01.28",
      uploader: "이영희",
      downloads: 14,
      isFavorite: false,
      tags: ["Control", "이론"],
    },
  ];

  const filteredResources = resources.filter((resource) => {
    const matchesFolder =
      selectedFolder === "전체" || resource.folder === selectedFolder;
    const matchesSearch =
      searchQuery === "" ||
      resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      resource.tags.some((tag) =>
        tag.toLowerCase().includes(searchQuery.toLowerCase())
      );
    return matchesFolder && matchesSearch;
  });

  const favoriteResources = resources.filter((r) => r.isFavorite);

  const handleDownload = (resourceId: number) => {
    toast.success("다운로드를 시작합니다");
  };

  const toggleFavorite = (resourceId: number) => {
    toast.success("즐겨찾기에 추가되었습니다");
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case "PDF":
        return <FileText className="h-5 w-5 text-red-600" />;
      case "ZIP":
        return <File className="h-5 w-5 text-blue-600" />;
      case "VIDEO":
        return <File className="h-5 w-5 text-purple-600" />;
      default:
        return <File className="h-5 w-5 text-gray-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-2">자료실</h1>
          <p className="text-gray-600">학습 자료와 프로젝트 파일을 관리하세요</p>
        </div>
        <Button className="bg-[#103078] hover:bg-[#2048A0]">
          <Upload className="mr-2 h-4 w-4" />
          업로드
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="자료 검색..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Folders */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {folders.map((folder) => (
          <Card
            key={folder.name}
            className={`cursor-pointer transition-all ${
              selectedFolder === folder.name
                ? "border-[#103078] bg-blue-50"
                : "border-gray-200 hover:border-[#2048A0]"
            }`}
            onClick={() => setSelectedFolder(folder.name)}
          >
            <CardContent className="p-4 text-center">
              <Folder
                className={`h-8 w-8 mx-auto mb-2 ${
                  selectedFolder === folder.name
                    ? "text-[#103078]"
                    : "text-gray-400"
                }`}
              />
              <p className="text-sm font-medium mb-1">{folder.name}</p>
              <p className="text-xs text-gray-500">{folder.count}개</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">전체 ({filteredResources.length})</TabsTrigger>
          <TabsTrigger value="favorites">
            즐겨찾기 ({favoriteResources.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-3 mt-6">
          {filteredResources.map((resource) => (
            <Card key={resource.id} className="border-gray-200 hover:shadow-lg transition-all">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                    {getFileIcon(resource.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg mb-1">
                          {resource.title}
                        </h3>
                        <div className="flex flex-wrap gap-2 mb-2">
                          {resource.tags.map((tag) => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => toggleFavorite(resource.id)}
                      >
                        <Star
                          className={`h-5 w-5 ${
                            resource.isFavorite
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-gray-400"
                          }`}
                        />
                      </Button>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                      <span>{resource.type}</span>
                      <span>•</span>
                      <span>{resource.size}</span>
                      <span>•</span>
                      <span>{resource.uploader}</span>
                      <span>•</span>
                      <span>{resource.uploadDate}</span>
                      <span>•</span>
                      <span>{resource.downloads}회 다운로드</span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownload(resource.id)}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      다운로드
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {filteredResources.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">검색 결과가 없습니다</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="favorites" className="space-y-3 mt-6">
          {favoriteResources.map((resource) => (
            <Card key={resource.id} className="border-gray-200 hover:shadow-lg transition-all">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                    {getFileIcon(resource.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg mb-1">
                          {resource.title}
                        </h3>
                        <div className="flex flex-wrap gap-2 mb-2">
                          {resource.tags.map((tag) => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => toggleFavorite(resource.id)}
                      >
                        <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                      </Button>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                      <span>{resource.type}</span>
                      <span>•</span>
                      <span>{resource.size}</span>
                      <span>•</span>
                      <span>{resource.uploader}</span>
                      <span>•</span>
                      <span>{resource.uploadDate}</span>
                      <span>•</span>
                      <span>{resource.downloads}회 다운로드</span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownload(resource.id)}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      다운로드
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {favoriteResources.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">즐겨찾기한 자료가 없습니다</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
