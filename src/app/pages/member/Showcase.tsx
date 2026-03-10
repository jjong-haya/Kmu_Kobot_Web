import { Presentation, ExternalLink, Eye, Heart, Share2, Filter } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";

export default function Showcase() {
  const showcaseItems = [
    {
      id: 1,
      title: "Autonomous Navigation Robot",
      description: "SLAM-based indoor navigation system with obstacle avoidance",
      author: "Sarah Kim",
      authorAvatar: "SK",
      category: "Robotics",
      tags: ["ROS2", "SLAM", "Python"],
      image: "robot-nav",
      likes: 45,
      views: 234,
      isPublic: true,
      featured: true,
    },
    {
      id: 2,
      title: "Vision-based Object Detection",
      description: "Real-time object detection using YOLO for robot manipulation",
      author: "John Doe",
      authorAvatar: "JD",
      category: "AI/ML",
      tags: ["YOLO", "OpenCV", "TensorFlow"],
      image: "vision-detection",
      likes: 38,
      views: 189,
      isPublic: true,
      featured: true,
    },
    {
      id: 3,
      title: "6-DOF Robot Arm Controller",
      description: "Inverse kinematics solver with trajectory planning",
      author: "Mike Lee",
      authorAvatar: "ML",
      category: "Control Systems",
      tags: ["Kinematics", "MATLAB", "Control"],
      image: "robot-arm",
      likes: 32,
      views: 156,
      isPublic: false,
      featured: false,
    },
    {
      id: 4,
      title: "Swarm Robotics Simulation",
      description: "Multi-agent coordination algorithms for robot swarms",
      author: "Emily Park",
      authorAvatar: "EP",
      category: "Simulation",
      tags: ["Multi-Agent", "Python", "Simulation"],
      image: "swarm",
      likes: 41,
      views: 203,
      isPublic: true,
      featured: false,
    },
    {
      id: 5,
      title: "Drone Precision Landing",
      description: "Vision-guided landing system for quadcopters",
      author: "Alex Chen",
      authorAvatar: "AC",
      category: "Drones",
      tags: ["ArduPilot", "Computer Vision", "C++"],
      image: "drone",
      likes: 36,
      views: 178,
      isPublic: true,
      featured: false,
    },
    {
      id: 6,
      title: "Humanoid Walking Algorithm",
      description: "Bipedal locomotion with balance control",
      author: "David Park",
      authorAvatar: "DP",
      category: "Humanoid",
      tags: ["Walking", "Balance", "Control"],
      image: "humanoid",
      likes: 29,
      views: 142,
      isPublic: false,
      featured: false,
    },
  ];

  return (
    <div className="max-w-7xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-1">Showcase</h1>
          <p className="text-gray-600">Featured projects and achievements</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
          <Button className="bg-[#103078] hover:bg-[#2048A0]">
            Submit Project
          </Button>
        </div>
      </div>

      <Tabs defaultValue="all" className="mb-6">
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="featured">Featured</TabsTrigger>
          <TabsTrigger value="public">Public</TabsTrigger>
          <TabsTrigger value="my-projects">My Projects</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {showcaseItems.map((item) => (
              <Card
                key={item.id}
                className={`hover:shadow-lg transition-shadow ${
                  item.featured ? "border-[#2048A0]" : ""
                }`}
              >
                <div className="aspect-video bg-gradient-to-br from-[#103078] to-[#2048A0] relative overflow-hidden">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Presentation className="h-16 w-16 text-white/30" />
                  </div>
                  {item.featured && (
                    <Badge className="absolute top-3 right-3 bg-yellow-500 text-white">
                      Featured
                    </Badge>
                  )}
                  {item.isPublic && (
                    <Badge className="absolute top-3 left-3 bg-white/90 text-[#103078]">
                      Public
                    </Badge>
                  )}
                </div>
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base">{item.title}</CardTitle>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {item.description}
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {item.tags.map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-[#103078] flex items-center justify-center text-white text-[10px] font-medium">
                        {item.authorAvatar}
                      </div>
                      <span className="text-sm text-gray-600">
                        {item.author}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <Heart className="h-4 w-4" />
                        {item.likes}
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye className="h-4 w-4" />
                        {item.views}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" className="flex-1" variant="outline">
                      <ExternalLink className="h-3.5 w-3.5 mr-1" />
                      View
                    </Button>
                    <Button size="sm" variant="ghost">
                      <Share2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="featured" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {showcaseItems
              .filter((item) => item.featured)
              .map((item) => (
                <Card
                  key={item.id}
                  className="hover:shadow-lg transition-shadow border-[#2048A0]"
                >
                  <div className="aspect-video bg-gradient-to-br from-[#103078] to-[#2048A0] relative overflow-hidden">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Presentation className="h-16 w-16 text-white/30" />
                    </div>
                    <Badge className="absolute top-3 right-3 bg-yellow-500 text-white">
                      Featured
                    </Badge>
                    {item.isPublic && (
                      <Badge className="absolute top-3 left-3 bg-white/90 text-[#103078]">
                        Public
                      </Badge>
                    )}
                  </div>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-base">{item.title}</CardTitle>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {item.description}
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {item.tags.map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-[#103078] flex items-center justify-center text-white text-[10px] font-medium">
                          {item.authorAvatar}
                        </div>
                        <span className="text-sm text-gray-600">
                          {item.author}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <Heart className="h-4 w-4" />
                          {item.likes}
                        </span>
                        <span className="flex items-center gap-1">
                          <Eye className="h-4 w-4" />
                          {item.views}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" className="flex-1" variant="outline">
                        <ExternalLink className="h-3.5 w-3.5 mr-1" />
                        View
                      </Button>
                      <Button size="sm" variant="ghost">
                        <Share2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </TabsContent>

        <TabsContent value="public" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {showcaseItems
              .filter((item) => item.isPublic)
              .map((item) => (
                <Card
                  key={item.id}
                  className={`hover:shadow-lg transition-shadow ${
                    item.featured ? "border-[#2048A0]" : ""
                  }`}
                >
                  <div className="aspect-video bg-gradient-to-br from-[#103078] to-[#2048A0] relative overflow-hidden">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Presentation className="h-16 w-16 text-white/30" />
                    </div>
                    {item.featured && (
                      <Badge className="absolute top-3 right-3 bg-yellow-500 text-white">
                        Featured
                      </Badge>
                    )}
                    <Badge className="absolute top-3 left-3 bg-white/90 text-[#103078]">
                      Public
                    </Badge>
                  </div>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-base">{item.title}</CardTitle>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {item.description}
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {item.tags.map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-[#103078] flex items-center justify-center text-white text-[10px] font-medium">
                          {item.authorAvatar}
                        </div>
                        <span className="text-sm text-gray-600">
                          {item.author}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <Heart className="h-4 w-4" />
                          {item.likes}
                        </span>
                        <span className="flex items-center gap-1">
                          <Eye className="h-4 w-4" />
                          {item.views}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" className="flex-1" variant="outline">
                        <ExternalLink className="h-3.5 w-3.5 mr-1" />
                        View
                      </Button>
                      <Button size="sm" variant="ghost">
                        <Share2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </TabsContent>

        <TabsContent value="my-projects" className="mt-6">
          <Card className="border-dashed">
            <CardContent className="p-8 text-center">
              <Presentation className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 mb-2">
                You haven't submitted any projects yet
              </p>
              <p className="text-sm text-gray-400 mb-4">
                Share your amazing work with the community
              </p>
              <Button className="bg-[#103078] hover:bg-[#2048A0]">
                Submit Your First Project
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
