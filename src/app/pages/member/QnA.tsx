import { HelpCircle, Plus, Search, ThumbsUp, MessageCircle, Tag, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Input } from "../../components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";

export default function QnA() {
  const questions = [
    {
      id: 1,
      title: "How to set up ROS2 on Ubuntu 22.04?",
      content: "I'm having trouble installing ROS2 Humble. Has anyone successfully done this?",
      author: "Sarah Kim",
      authorAvatar: "SK",
      date: "2 hours ago",
      tags: ["ROS", "Setup", "Ubuntu"],
      answers: 3,
      likes: 8,
      views: 45,
      status: "answered",
    },
    {
      id: 2,
      title: "Best practices for robot arm kinematics?",
      content: "What's the recommended approach for calculating inverse kinematics for a 6-DOF arm?",
      author: "John Doe",
      authorAvatar: "JD",
      date: "5 hours ago",
      tags: ["Kinematics", "Robot Arm", "Mathematics"],
      answers: 5,
      likes: 12,
      views: 67,
      status: "answered",
    },
    {
      id: 3,
      title: "Equipment room booking not working",
      content: "I can't book the oscilloscope for tomorrow. Is the system down?",
      author: "Emily Park",
      authorAvatar: "EP",
      date: "1 day ago",
      tags: ["Equipment", "Help", "Urgent"],
      answers: 1,
      likes: 3,
      views: 23,
      status: "answered",
    },
    {
      id: 4,
      title: "Looking for team members for autonomous driving project",
      content: "Need 2 more people skilled in computer vision. Interested?",
      author: "Mike Lee",
      authorAvatar: "ML",
      date: "2 days ago",
      tags: ["Collaboration", "Computer Vision", "Projects"],
      answers: 0,
      likes: 5,
      views: 34,
      status: "open",
    },
  ];

  const popularTags = [
    { name: "ROS", count: 45 },
    { name: "Python", count: 38 },
    { name: "Computer Vision", count: 32 },
    { name: "Arduino", count: 28 },
    { name: "Projects", count: 25 },
    { name: "Setup", count: 22 },
  ];

  return (
    <div className="max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-1">Q&A / Help Desk</h1>
          <p className="text-gray-600">Ask questions and help others</p>
        </div>
        <Button className="bg-[#103078] hover:bg-[#2048A0]">
          <Plus className="h-4 w-4 mr-2" />
          Ask Question
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2">
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="search"
                placeholder="Search questions..."
                className="pl-10"
              />
            </div>
          </div>

          <Tabs defaultValue="all" className="mb-6">
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="unanswered">Unanswered</TabsTrigger>
              <TabsTrigger value="trending">
                <TrendingUp className="h-3.5 w-3.5 mr-1" />
                Trending
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-4 mt-6">
              {questions.map((question) => (
                <Card key={question.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex gap-4">
                      <div className="flex flex-col items-center gap-2 min-w-[60px]">
                        <div className="text-center">
                          <div className="flex items-center gap-1 text-gray-500">
                            <ThumbsUp className="h-4 w-4" />
                            <span className="text-sm font-medium">{question.likes}</span>
                          </div>
                        </div>
                        <div className="text-center">
                          <div className={`flex items-center gap-1 ${question.answers > 0 ? 'text-green-600' : 'text-gray-500'}`}>
                            <MessageCircle className="h-4 w-4" />
                            <span className="text-sm font-medium">{question.answers}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex-1">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h3 className="font-semibold text-lg hover:text-[#2048A0] cursor-pointer">
                            {question.title}
                          </h3>
                          {question.status === "answered" && (
                            <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                              Answered
                            </Badge>
                          )}
                        </div>
                        <p className="text-gray-600 text-sm mb-3">{question.content}</p>
                        <div className="flex flex-wrap gap-2 mb-3">
                          {question.tags.map((tag) => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              <Tag className="h-3 w-3 mr-1" />
                              {tag}
                            </Badge>
                          ))}
                        </div>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-[#103078] flex items-center justify-center text-white text-[10px]">
                              {question.authorAvatar}
                            </div>
                            <span>{question.author}</span>
                          </div>
                          <span>{question.date}</span>
                          <span>{question.views} views</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="unanswered" className="space-y-4 mt-6">
              {questions
                .filter((q) => q.status === "open")
                .map((question) => (
                  <Card key={question.id} className="hover:shadow-md transition-shadow border-orange-200">
                    <CardContent className="p-6">
                      <div className="flex gap-4">
                        <div className="flex flex-col items-center gap-2 min-w-[60px]">
                          <div className="text-center">
                            <div className="flex items-center gap-1 text-gray-500">
                              <ThumbsUp className="h-4 w-4" />
                              <span className="text-sm font-medium">{question.likes}</span>
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="flex items-center gap-1 text-orange-500">
                              <MessageCircle className="h-4 w-4" />
                              <span className="text-sm font-medium">{question.answers}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex-1">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <h3 className="font-semibold text-lg hover:text-[#2048A0] cursor-pointer">
                              {question.title}
                            </h3>
                            <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100">
                              Needs Answer
                            </Badge>
                          </div>
                          <p className="text-gray-600 text-sm mb-3">{question.content}</p>
                          <div className="flex flex-wrap gap-2 mb-3">
                            {question.tags.map((tag) => (
                              <Badge key={tag} variant="outline" className="text-xs">
                                <Tag className="h-3 w-3 mr-1" />
                                {tag}
                              </Badge>
                            ))}
                          </div>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-[#103078] flex items-center justify-center text-white text-[10px]">
                                {question.authorAvatar}
                              </div>
                              <span>{question.author}</span>
                            </div>
                            <span>{question.date}</span>
                            <span>{question.views} views</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </TabsContent>

            <TabsContent value="trending" className="space-y-4 mt-6">
              {questions
                .sort((a, b) => b.likes - a.likes)
                .map((question) => (
                  <Card key={question.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex gap-4">
                        <div className="flex flex-col items-center gap-2 min-w-[60px]">
                          <div className="text-center">
                            <div className="flex items-center gap-1 text-[#2048A0]">
                              <ThumbsUp className="h-4 w-4" />
                              <span className="text-sm font-medium">{question.likes}</span>
                            </div>
                          </div>
                          <div className="text-center">
                            <div className={`flex items-center gap-1 ${question.answers > 0 ? 'text-green-600' : 'text-gray-500'}`}>
                              <MessageCircle className="h-4 w-4" />
                              <span className="text-sm font-medium">{question.answers}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex-1">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <h3 className="font-semibold text-lg hover:text-[#2048A0] cursor-pointer">
                              {question.title}
                            </h3>
                            {question.status === "answered" && (
                              <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                                Answered
                              </Badge>
                            )}
                          </div>
                          <p className="text-gray-600 text-sm mb-3">{question.content}</p>
                          <div className="flex flex-wrap gap-2 mb-3">
                            {question.tags.map((tag) => (
                              <Badge key={tag} variant="outline" className="text-xs">
                                <Tag className="h-3 w-3 mr-1" />
                                {tag}
                              </Badge>
                            ))}
                          </div>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-[#103078] flex items-center justify-center text-white text-[10px]">
                                {question.authorAvatar}
                              </div>
                              <span>{question.author}</span>
                            </div>
                            <span>{question.date}</span>
                            <span>{question.views} views</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </TabsContent>
          </Tabs>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Popular Tags</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {popularTags.map((tag) => (
                  <Button
                    key={tag.name}
                    variant="outline"
                    size="sm"
                    className="text-xs"
                  >
                    {tag.name} ({tag.count})
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-[#103078]/20 bg-gradient-to-br from-white to-blue-50/30">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <HelpCircle className="h-5 w-5 text-[#103078]" />
                Asking Guidelines
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>• Be specific and clear</li>
                <li>• Include relevant details</li>
                <li>• Add appropriate tags</li>
                <li>• Search before asking</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
