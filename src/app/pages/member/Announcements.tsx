import { Megaphone, Plus, Calendar, Eye, Pin, Edit, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";

export default function Announcements() {
  const announcements = [
    {
      id: 1,
      title: "2026 Spring Semester Kickoff",
      content: "Welcome back! Let's make this semester amazing with new projects and learning opportunities.",
      author: "Admin",
      date: "2026-02-15",
      views: 45,
      pinned: true,
      status: "published",
      category: "General",
    },
    {
      id: 2,
      title: "Project Submission Guidelines Updated",
      content: "New guidelines for project documentation and code reviews are now available.",
      author: "Admin",
      date: "2026-02-14",
      views: 32,
      pinned: true,
      status: "published",
      category: "Projects",
    },
    {
      id: 3,
      title: "Equipment Room Schedule Change",
      content: "The equipment room will be closed on Feb 20 for maintenance.",
      author: "Admin",
      date: "2026-02-13",
      views: 28,
      pinned: false,
      status: "published",
      category: "Facilities",
    },
    {
      id: 4,
      title: "Upcoming: Guest Lecture Series",
      content: "Industry experts will share insights on AI in robotics. Save the dates!",
      author: "Admin",
      date: "2026-02-25",
      views: 0,
      pinned: false,
      status: "scheduled",
      category: "Events",
    },
  ];

  return (
    <div className="max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-1">Announcements</h1>
          <p className="text-gray-600">Important updates and news</p>
        </div>
        <Button className="bg-[#103078] hover:bg-[#2048A0]">
          <Plus className="h-4 w-4 mr-2" />
          New Announcement
        </Button>
      </div>

      <Tabs defaultValue="all" className="mb-6">
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="pinned">Pinned</TabsTrigger>
          <TabsTrigger value="scheduled">
            Scheduled <Badge className="ml-2 bg-[#103078]">1</Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4 mt-6">
          {announcements.map((announcement) => (
            <Card
              key={announcement.id}
              className={`${
                announcement.pinned ? "border-[#2048A0] shadow-md" : ""
              }`}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {announcement.pinned && (
                        <Pin className="h-4 w-4 text-[#2048A0]" />
                      )}
                      <CardTitle className="text-lg">
                        {announcement.title}
                      </CardTitle>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {announcement.date}
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye className="h-3.5 w-3.5" />
                        {announcement.views} views
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {announcement.category}
                      </Badge>
                      {announcement.status === "scheduled" && (
                        <Badge className="bg-[#2048A0] text-xs">Scheduled</Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Edit className="h-4 w-4 text-gray-500" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Trash2 className="h-4 w-4 text-gray-500" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700">{announcement.content}</p>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-sm text-gray-500">
                    by {announcement.author}
                  </span>
                  <Button variant="outline" size="sm">
                    Read More
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="pinned" className="space-y-4 mt-6">
          {announcements
            .filter((a) => a.pinned)
            .map((announcement) => (
              <Card
                key={announcement.id}
                className="border-[#2048A0] shadow-md"
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Pin className="h-4 w-4 text-[#2048A0]" />
                        <CardTitle className="text-lg">
                          {announcement.title}
                        </CardTitle>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          {announcement.date}
                        </span>
                        <span className="flex items-center gap-1">
                          <Eye className="h-3.5 w-3.5" />
                          {announcement.views} views
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {announcement.category}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Edit className="h-4 w-4 text-gray-500" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Trash2 className="h-4 w-4 text-gray-500" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700">{announcement.content}</p>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-sm text-gray-500">
                      by {announcement.author}
                    </span>
                    <Button variant="outline" size="sm">
                      Read More
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
        </TabsContent>

        <TabsContent value="scheduled" className="space-y-4 mt-6">
          {announcements
            .filter((a) => a.status === "scheduled")
            .map((announcement) => (
              <Card key={announcement.id} className="border-[#2048A0]/30">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <CardTitle className="text-lg">
                          {announcement.title}
                        </CardTitle>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          Scheduled for {announcement.date}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {announcement.category}
                        </Badge>
                        <Badge className="bg-[#2048A0] text-xs">Scheduled</Badge>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Edit className="h-4 w-4 text-gray-500" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Trash2 className="h-4 w-4 text-gray-500" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700">{announcement.content}</p>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-sm text-gray-500">
                      by {announcement.author}
                    </span>
                    <Button variant="outline" size="sm">
                      Edit Schedule
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
        </TabsContent>
      </Tabs>

      <Card className="border-[#103078]/20 bg-gradient-to-br from-white to-blue-50/30">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Megaphone className="h-5 w-5 text-[#103078]" />
            Announcement Templates
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 mb-4">
            Use pre-made templates for common announcements to save time
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">Event</Button>
            <Button variant="outline" size="sm">Deadline</Button>
            <Button variant="outline" size="sm">Maintenance</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
