import { BookOpen, Plus, Heart, MessageCircle, Eye, Calendar, User, Tag } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";

export default function StudyLog() {
  const studyPosts = [
    {
      id: 1,
      title: "ROS2 Navigation Stack Deep Dive",
      excerpt: "Today I explored the Nav2 stack in detail. Here's what I learned about behavior trees and recovery behaviors...",
      author: "Sarah Kim",
      authorAvatar: "SK",
      date: "2026-02-15",
      readTime: "8 min read",
      likes: 24,
      comments: 5,
      views: 156,
      tags: ["ROS2", "Navigation", "Tutorial"],
      featured: true,
    },
    {
      id: 2,
      title: "Computer Vision Basics for Robotics",
      excerpt: "A beginner-friendly guide to understanding OpenCV and its applications in robot perception...",
      author: "John Doe",
      authorAvatar: "JD",
      date: "2026-02-14",
      readTime: "12 min read",
      likes: 31,
      comments: 8,
      views: 203,
      tags: ["Computer Vision", "OpenCV", "Beginner"],
      featured: true,
    },
    {
      id: 3,
      title: "My Journey Learning SLAM",
      excerpt: "Week 3 of learning SLAM algorithms. Today I implemented EKF-SLAM from scratch...",
      author: "Mike Lee",
      authorAvatar: "ML",
      date: "2026-02-13",
      readTime: "6 min read",
      likes: 18,
      comments: 3,
      views: 92,
      tags: ["SLAM", "Learning Journey", "Algorithm"],
      featured: false,
    },
    {
      id: 4,
      title: "Python Tips for Robotics Programming",
      excerpt: "Collection of useful Python patterns and libraries I use in robotics projects...",
      author: "Emily Park",
      authorAvatar: "EP",
      date: "2026-02-12",
      readTime: "5 min read",
      likes: 27,
      comments: 6,
      views: 178,
      tags: ["Python", "Tips", "Programming"],
      featured: false,
    },
    {
      id: 5,
      title: "Understanding PID Control Intuitively",
      excerpt: "Breaking down PID controllers with real examples from our line-following robot...",
      author: "Alex Chen",
      authorAvatar: "AC",
      date: "2026-02-11",
      readTime: "10 min read",
      likes: 35,
      comments: 9,
      views: 241,
      tags: ["Control", "PID", "Tutorial"],
      featured: false,
    },
    {
      id: 6,
      title: "Setting Up a Robotics Dev Environment",
      excerpt: "Complete guide to setting up VS Code, ROS2, and useful tools for robot development...",
      author: "David Park",
      authorAvatar: "DP",
      date: "2026-02-10",
      readTime: "7 min read",
      likes: 22,
      comments: 4,
      views: 134,
      tags: ["Setup", "Tools", "Guide"],
      featured: false,
    },
  ];

  const trendingTags = [
    "ROS2", "Python", "SLAM", "Computer Vision", "Arduino", "Machine Learning", 
    "Control Theory", "Sensors", "Tutorial", "Project Log"
  ];

  return (
    <div className="max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-1">Study Log</h1>
          <p className="text-gray-600">Share your learning journey and insights</p>
        </div>
        <Button className="bg-[#103078] hover:bg-[#2048A0]">
          <Plus className="h-4 w-4 mr-2" />
          Write Post
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Featured Posts */}
          <div>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-[#2048A0]" />
              Featured Posts
            </h2>
            <div className="space-y-4">
              {studyPosts
                .filter((post) => post.featured)
                .map((post) => (
                  <Card
                    key={post.id}
                    className="hover:shadow-lg transition-shadow border-[#2048A0]/30"
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-full bg-[#103078] flex items-center justify-center text-white font-medium">
                          {post.authorAvatar}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2 text-sm text-gray-500">
                            <span>{post.author}</span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3.5 w-3.5" />
                              {post.date}
                            </span>
                            <span>•</span>
                            <span>{post.readTime}</span>
                          </div>
                          <h3 className="text-xl font-semibold mb-2 hover:text-[#2048A0] cursor-pointer">
                            {post.title}
                          </h3>
                          <p className="text-gray-600 mb-3">{post.excerpt}</p>
                          <div className="flex flex-wrap gap-2 mb-3">
                            {post.tags.map((tag) => (
                              <Badge key={tag} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <button className="flex items-center gap-1 hover:text-[#2048A0]">
                              <Heart className="h-4 w-4" />
                              {post.likes}
                            </button>
                            <button className="flex items-center gap-1 hover:text-[#2048A0]">
                              <MessageCircle className="h-4 w-4" />
                              {post.comments}
                            </button>
                            <span className="flex items-center gap-1">
                              <Eye className="h-4 w-4" />
                              {post.views}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </div>

          {/* All Posts */}
          <div>
            <h2 className="text-lg font-semibold mb-4">Recent Posts</h2>
            <Tabs defaultValue="recent">
              <TabsList className="mb-4">
                <TabsTrigger value="recent">Recent</TabsTrigger>
                <TabsTrigger value="popular">Popular</TabsTrigger>
                <TabsTrigger value="following">Following</TabsTrigger>
              </TabsList>

              <TabsContent value="recent" className="space-y-4">
                {studyPosts.map((post) => (
                  <Card key={post.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-5">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#103078] flex items-center justify-center text-white text-sm font-medium">
                          {post.authorAvatar}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1 text-xs text-gray-500">
                            <span>{post.author}</span>
                            <span>•</span>
                            <span>{post.date}</span>
                            <span>•</span>
                            <span>{post.readTime}</span>
                          </div>
                          <h3 className="font-semibold mb-2 hover:text-[#2048A0] cursor-pointer">
                            {post.title}
                          </h3>
                          <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                            {post.excerpt}
                          </p>
                          <div className="flex flex-wrap gap-2 mb-2">
                            {post.tags.map((tag) => (
                              <Badge key={tag} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                          <div className="flex items-center gap-3 text-xs text-gray-500">
                            <button className="flex items-center gap-1 hover:text-[#2048A0]">
                              <Heart className="h-3.5 w-3.5" />
                              {post.likes}
                            </button>
                            <button className="flex items-center gap-1 hover:text-[#2048A0]">
                              <MessageCircle className="h-3.5 w-3.5" />
                              {post.comments}
                            </button>
                            <span className="flex items-center gap-1">
                              <Eye className="h-3.5 w-3.5" />
                              {post.views}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>

              <TabsContent value="popular" className="space-y-4">
                {studyPosts
                  .sort((a, b) => b.likes - a.likes)
                  .map((post) => (
                    <Card key={post.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-5">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-full bg-[#103078] flex items-center justify-center text-white text-sm font-medium">
                            {post.authorAvatar}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1 text-xs text-gray-500">
                              <span>{post.author}</span>
                              <span>•</span>
                              <span>{post.date}</span>
                              <span>•</span>
                              <span>{post.readTime}</span>
                            </div>
                            <h3 className="font-semibold mb-2 hover:text-[#2048A0] cursor-pointer">
                              {post.title}
                            </h3>
                            <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                              {post.excerpt}
                            </p>
                            <div className="flex flex-wrap gap-2 mb-2">
                              {post.tags.map((tag) => (
                                <Badge key={tag} variant="outline" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                            <div className="flex items-center gap-3 text-xs text-gray-500">
                              <button className="flex items-center gap-1 hover:text-[#2048A0]">
                                <Heart className="h-3.5 w-3.5" />
                                {post.likes}
                              </button>
                              <button className="flex items-center gap-1 hover:text-[#2048A0]">
                                <MessageCircle className="h-3.5 w-3.5" />
                                {post.comments}
                              </button>
                              <span className="flex items-center gap-1">
                                <Eye className="h-3.5 w-3.5" />
                                {post.views}
                              </span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </TabsContent>

              <TabsContent value="following" className="space-y-4">
                <Card className="border-dashed">
                  <CardContent className="p-8 text-center">
                    <User className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 mb-2">Follow members to see their posts here</p>
                    <Button variant="outline" size="sm">Discover Members</Button>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Trending Tags</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {trendingTags.map((tag) => (
                  <Button
                    key={tag}
                    variant="outline"
                    size="sm"
                    className="text-xs"
                  >
                    <Tag className="h-3 w-3 mr-1" />
                    {tag}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-[#103078]/20 bg-gradient-to-br from-white to-blue-50/30">
            <CardHeader>
              <CardTitle className="text-base">Writing Tips</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>✍️ Share your learning process</li>
                <li>💡 Include code examples</li>
                <li>🖼️ Add diagrams if helpful</li>
                <li>🏷️ Use relevant tags</li>
                <li>💬 Engage with comments</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Top Contributors</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { name: "Sarah Kim", posts: 12, avatar: "SK" },
                  { name: "John Doe", posts: 10, avatar: "JD" },
                  { name: "Mike Lee", posts: 8, avatar: "ML" },
                ].map((contributor) => (
                  <div
                    key={contributor.name}
                    className="flex items-center gap-3"
                  >
                    <div className="w-8 h-8 rounded-full bg-[#103078] flex items-center justify-center text-white text-xs font-medium">
                      {contributor.avatar}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{contributor.name}</p>
                      <p className="text-xs text-gray-500">
                        {contributor.posts} posts
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
