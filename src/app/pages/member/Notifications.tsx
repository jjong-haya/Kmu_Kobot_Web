import { Bell, Check, Trash2, Settings, Filter } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";

export default function Notifications() {
  const notifications = [
    {
      id: 1,
      type: "event",
      title: "New Event: ROS Workshop",
      message: "A new workshop has been scheduled for next Wednesday",
      time: "2 hours ago",
      unread: true,
      category: "Events",
    },
    {
      id: 2,
      type: "announcement",
      title: "Important: Project Submission Deadline",
      message: "All mid-term project reports are due by Feb 28",
      time: "5 hours ago",
      unread: true,
      category: "Announcements",
    },
    {
      id: 3,
      type: "mention",
      title: "John mentioned you in a comment",
      message: "On project: Autonomous Navigation System",
      time: "1 day ago",
      unread: true,
      category: "Mentions",
    },
    {
      id: 4,
      type: "system",
      title: "Your office hours booking is confirmed",
      message: "Meeting with Prof. Kim on Feb 18, 2:00 PM",
      time: "2 days ago",
      unread: false,
      category: "System",
    },
    {
      id: 5,
      type: "review",
      title: "You received a peer review",
      message: "Sarah reviewed your presentation: Robotics Fundamentals",
      time: "3 days ago",
      unread: false,
      category: "Reviews",
    },
  ];

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-1">Notifications</h1>
          <p className="text-gray-600">Stay updated with latest activities</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Check className="h-4 w-4 mr-2" />
            Mark all read
          </Button>
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Tabs defaultValue="all" className="mb-6">
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="unread">
            Unread <Badge className="ml-2 bg-[#103078]">3</Badge>
          </TabsTrigger>
          <TabsTrigger value="mentions">Mentions</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-3 mt-6">
          {notifications.map((notif) => (
            <Card
              key={notif.id}
              className={`${
                notif.unread ? "border-l-4 border-l-[#2048A0] bg-blue-50/30" : ""
              }`}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      notif.unread ? "bg-[#2048A0]" : "bg-gray-200"
                    }`}
                  >
                    <Bell
                      className={`h-5 w-5 ${
                        notif.unread ? "text-white" : "text-gray-500"
                      }`}
                    />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-semibold mb-1">{notif.title}</h3>
                        <p className="text-sm text-gray-600 mb-2">
                          {notif.message}
                        </p>
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                          <span>{notif.time}</span>
                          <Badge variant="outline" className="text-xs">
                            {notif.category}
                          </Badge>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Trash2 className="h-4 w-4 text-gray-400" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="unread" className="space-y-3 mt-6">
          {notifications
            .filter((n) => n.unread)
            .map((notif) => (
              <Card
                key={notif.id}
                className="border-l-4 border-l-[#2048A0] bg-blue-50/30"
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center bg-[#2048A0]">
                      <Bell className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-semibold mb-1">{notif.title}</h3>
                          <p className="text-sm text-gray-600 mb-2">
                            {notif.message}
                          </p>
                          <div className="flex items-center gap-3 text-xs text-gray-500">
                            <span>{notif.time}</span>
                            <Badge variant="outline" className="text-xs">
                              {notif.category}
                            </Badge>
                          </div>
                        </div>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Trash2 className="h-4 w-4 text-gray-400" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
        </TabsContent>

        <TabsContent value="mentions" className="space-y-3 mt-6">
          {notifications
            .filter((n) => n.type === "mention")
            .map((notif) => (
              <Card
                key={notif.id}
                className={`${
                  notif.unread
                    ? "border-l-4 border-l-[#2048A0] bg-blue-50/30"
                    : ""
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        notif.unread ? "bg-[#2048A0]" : "bg-gray-200"
                      }`}
                    >
                      <Bell
                        className={`h-5 w-5 ${
                          notif.unread ? "text-white" : "text-gray-500"
                        }`}
                      />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-semibold mb-1">{notif.title}</h3>
                          <p className="text-sm text-gray-600 mb-2">
                            {notif.message}
                          </p>
                          <div className="flex items-center gap-3 text-xs text-gray-500">
                            <span>{notif.time}</span>
                            <Badge variant="outline" className="text-xs">
                              {notif.category}
                            </Badge>
                          </div>
                        </div>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Trash2 className="h-4 w-4 text-gray-400" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
        </TabsContent>
      </Tabs>

      <Card className="border-[#103078]/20 bg-gradient-to-br from-white to-blue-50/30">
        <CardHeader>
          <CardTitle className="text-base">Notification Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 mb-4">
            Customize how you receive notifications for different activities
          </p>
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Manage Settings
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
