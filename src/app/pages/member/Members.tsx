import { Users, Mail, Phone, Github, Linkedin, Search, Filter } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";

export default function Members() {
  const members = [
    {
      id: 1,
      name: "Sarah Kim",
      avatar: "SK",
      role: "President",
      year: "4th Year",
      major: "Computer Science",
      email: "sarah.kim@example.com",
      skills: ["ROS2", "SLAM", "Python", "C++"],
      projects: 8,
      contributions: 124,
      joinedDate: "2023-03",
    },
    {
      id: 2,
      name: "John Doe",
      avatar: "JD",
      role: "Technical Lead",
      year: "3rd Year",
      major: "Robotics Engineering",
      email: "john.doe@example.com",
      skills: ["Computer Vision", "AI/ML", "TensorFlow"],
      projects: 6,
      contributions: 98,
      joinedDate: "2023-09",
    },
    {
      id: 3,
      name: "Mike Lee",
      avatar: "ML",
      role: "Member",
      year: "2nd Year",
      major: "Mechanical Engineering",
      email: "mike.lee@example.com",
      skills: ["CAD", "Arduino", "Embedded Systems"],
      projects: 4,
      contributions: 45,
      joinedDate: "2024-03",
    },
    {
      id: 4,
      name: "Emily Park",
      avatar: "EP",
      role: "Member",
      year: "3rd Year",
      major: "Electrical Engineering",
      email: "emily.park@example.com",
      skills: ["PCB Design", "Sensors", "Control Systems"],
      projects: 5,
      contributions: 67,
      joinedDate: "2023-09",
    },
    {
      id: 5,
      name: "Alex Chen",
      avatar: "AC",
      role: "Member",
      year: "2nd Year",
      major: "Computer Science",
      email: "alex.chen@example.com",
      skills: ["ROS", "Python", "Web Development"],
      projects: 3,
      contributions: 34,
      joinedDate: "2024-09",
    },
    {
      id: 6,
      name: "David Park",
      avatar: "DP",
      role: "Member",
      year: "4th Year",
      major: "Software Engineering",
      email: "david.park@example.com",
      skills: ["Backend", "Database", "DevOps"],
      projects: 7,
      contributions: 89,
      joinedDate: "2022-09",
    },
  ];

  return (
    <div className="max-w-7xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-1">Members Directory</h1>
          <p className="text-gray-600">Connect with fellow club members</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-600 mb-1">Total Members</p>
            <p className="text-2xl font-bold text-[#103078]">32</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-600 mb-1">Active This Month</p>
            <p className="text-2xl font-bold text-[#2048A0]">28</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-600 mb-1">New Members</p>
            <p className="text-2xl font-bold text-green-600">4</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-600 mb-1">Alumni</p>
            <p className="text-2xl font-bold text-gray-600">15</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <div className="flex gap-3 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="search"
            placeholder="Search members by name, skills, or major..."
            className="pl-10"
          />
        </div>
        <Button variant="outline">
          <Filter className="h-4 w-4 mr-2" />
          Filters
        </Button>
      </div>

      <Tabs defaultValue="all" className="mb-6">
        <TabsList>
          <TabsTrigger value="all">All Members</TabsTrigger>
          <TabsTrigger value="leadership">Leadership</TabsTrigger>
          <TabsTrigger value="active">Most Active</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {members.map((member) => (
              <Card key={member.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex flex-col items-center text-center">
                    <div className="w-20 h-20 rounded-full bg-[#103078] flex items-center justify-center text-white text-2xl font-bold mb-3">
                      {member.avatar}
                    </div>
                    <CardTitle className="text-lg">{member.name}</CardTitle>
                    <div className="flex flex-col gap-1 mt-1">
                      <Badge className="bg-[#2048A0]">{member.role}</Badge>
                      <p className="text-sm text-gray-600">{member.year} • {member.major}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs font-medium text-gray-500 mb-2">Skills</p>
                      <div className="flex flex-wrap gap-1.5">
                        {member.skills.map((skill) => (
                          <Badge key={skill} variant="outline" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-center py-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="text-xl font-bold text-[#103078]">{member.projects}</p>
                        <p className="text-xs text-gray-600">Projects</p>
                      </div>
                      <div>
                        <p className="text-xl font-bold text-[#2048A0]">{member.contributions}</p>
                        <p className="text-xs text-gray-600">Contributions</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1">
                        <Mail className="h-3.5 w-3.5 mr-1" />
                        Email
                      </Button>
                      <Button variant="outline" size="icon" className="h-9 w-9">
                        <Github className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="icon" className="h-9 w-9">
                        <Linkedin className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500 text-center">
                      Member since {new Date(member.joinedDate).toLocaleDateString('en-US', {
                        month: 'short',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="leadership" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {members
              .filter((m) => m.role !== "Member")
              .map((member) => (
                <Card key={member.id} className="hover:shadow-md transition-shadow border-[#2048A0]">
                  <CardHeader>
                    <div className="flex flex-col items-center text-center">
                      <div className="w-20 h-20 rounded-full bg-[#103078] flex items-center justify-center text-white text-2xl font-bold mb-3">
                        {member.avatar}
                      </div>
                      <CardTitle className="text-lg">{member.name}</CardTitle>
                      <div className="flex flex-col gap-1 mt-1">
                        <Badge className="bg-[#2048A0]">{member.role}</Badge>
                        <p className="text-sm text-gray-600">{member.year} • {member.major}</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <p className="text-xs font-medium text-gray-500 mb-2">Skills</p>
                        <div className="flex flex-wrap gap-1.5">
                          {member.skills.map((skill) => (
                            <Badge key={skill} variant="outline" className="text-xs">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-center py-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="text-xl font-bold text-[#103078]">{member.projects}</p>
                          <p className="text-xs text-gray-600">Projects</p>
                        </div>
                        <div>
                          <p className="text-xl font-bold text-[#2048A0]">{member.contributions}</p>
                          <p className="text-xs text-gray-600">Contributions</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="flex-1">
                          <Mail className="h-3.5 w-3.5 mr-1" />
                          Email
                        </Button>
                        <Button variant="outline" size="icon" className="h-9 w-9">
                          <Github className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="icon" className="h-9 w-9">
                          <Linkedin className="h-4 w-4" />
                        </Button>
                      </div>
                      <p className="text-xs text-gray-500 text-center">
                        Member since {new Date(member.joinedDate).toLocaleDateString('en-US', {
                          month: 'short',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </TabsContent>

        <TabsContent value="active" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {members
              .sort((a, b) => b.contributions - a.contributions)
              .map((member) => (
                <Card key={member.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex flex-col items-center text-center">
                      <div className="w-20 h-20 rounded-full bg-[#103078] flex items-center justify-center text-white text-2xl font-bold mb-3">
                        {member.avatar}
                      </div>
                      <CardTitle className="text-lg">{member.name}</CardTitle>
                      <div className="flex flex-col gap-1 mt-1">
                        <Badge className="bg-[#2048A0]">{member.role}</Badge>
                        <p className="text-sm text-gray-600">{member.year} • {member.major}</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <p className="text-xs font-medium text-gray-500 mb-2">Skills</p>
                        <div className="flex flex-wrap gap-1.5">
                          {member.skills.map((skill) => (
                            <Badge key={skill} variant="outline" className="text-xs">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-center py-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="text-xl font-bold text-[#103078]">{member.projects}</p>
                          <p className="text-xs text-gray-600">Projects</p>
                        </div>
                        <div>
                          <p className="text-xl font-bold text-[#2048A0]">{member.contributions}</p>
                          <p className="text-xs text-gray-600">Contributions</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="flex-1">
                          <Mail className="h-3.5 w-3.5 mr-1" />
                          Email
                        </Button>
                        <Button variant="outline" size="icon" className="h-9 w-9">
                          <Github className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="icon" className="h-9 w-9">
                          <Linkedin className="h-4 w-4" />
                        </Button>
                      </div>
                      <p className="text-xs text-gray-500 text-center">
                        Member since {new Date(member.joinedDate).toLocaleDateString('en-US', {
                          month: 'short',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
