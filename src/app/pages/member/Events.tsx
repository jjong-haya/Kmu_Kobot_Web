import { Calendar, Plus, Users, MapPin, Clock, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";

export default function Events() {
  const events = [
    {
      id: 1,
      title: "ROS2 Workshop: Advanced Navigation",
      date: "2026-02-18",
      time: "14:00 - 17:00",
      location: "Lab 201",
      organizer: "Sarah Kim",
      capacity: 20,
      registered: 15,
      category: "Workshop",
      description: "Deep dive into ROS2 Nav2 stack with hands-on exercises",
      status: "upcoming",
    },
    {
      id: 2,
      title: "Guest Lecture: AI in Robotics",
      date: "2026-02-20",
      time: "15:00 - 16:30",
      location: "Auditorium",
      organizer: "Admin",
      capacity: 50,
      registered: 32,
      category: "Lecture",
      description: "Industry expert sharing insights on AI applications",
      status: "upcoming",
    },
    {
      id: 3,
      title: "Weekly Project Sync",
      date: "2026-02-16",
      time: "18:00 - 19:00",
      location: "Online",
      organizer: "John Doe",
      capacity: 30,
      registered: 22,
      category: "Meeting",
      description: "Regular sync-up for all ongoing projects",
      status: "upcoming",
    },
    {
      id: 4,
      title: "Robot Competition Prep Session",
      date: "2026-02-22",
      time: "13:00 - 18:00",
      location: "Workshop Area",
      organizer: "Mike Lee",
      capacity: 25,
      registered: 18,
      category: "Competition",
      description: "Final preparation before the regional competition",
      status: "upcoming",
    },
    {
      id: 5,
      title: "Computer Vision Study Group",
      date: "2026-02-12",
      time: "16:00 - 18:00",
      location: "Lab 203",
      organizer: "Emily Park",
      capacity: 15,
      registered: 15,
      category: "Study Group",
      description: "Weekly study session on OpenCV and deep learning",
      status: "past",
    },
  ];

  const upcomingEvents = events.filter(e => e.status === "upcoming");
  const pastEvents = events.filter(e => e.status === "past");

  return (
    <div className="max-w-7xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-1">Events & Sessions</h1>
          <p className="text-gray-600">Workshops, lectures, and club activities</p>
        </div>
        <Button className="bg-[#103078] hover:bg-[#2048A0]">
          <Plus className="h-4 w-4 mr-2" />
          Create Event
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Upcoming</p>
                <p className="text-2xl font-bold text-[#103078]">{upcomingEvents.length}</p>
              </div>
              <Calendar className="h-8 w-8 text-[#103078]/20" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">This Week</p>
                <p className="text-2xl font-bold text-[#2048A0]">3</p>
              </div>
              <Clock className="h-8 w-8 text-[#2048A0]/20" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">My Registrations</p>
                <p className="text-2xl font-bold text-green-600">2</p>
              </div>
              <Users className="h-8 w-8 text-green-600/20" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="upcoming" className="mb-6">
        <TabsList>
          <TabsTrigger value="upcoming">
            Upcoming <Badge className="ml-2 bg-[#103078]">{upcomingEvents.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="past">Past Events</TabsTrigger>
          <TabsTrigger value="calendar">Calendar View</TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="mt-6 space-y-4">
          {upcomingEvents.map((event) => (
            <Card key={event.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-lg bg-[#103078] flex flex-col items-center justify-center text-white">
                    <span className="text-xs font-medium">
                      {new Date(event.date).toLocaleDateString('en-US', { month: 'short' }).toUpperCase()}
                    </span>
                    <span className="text-2xl font-bold">
                      {new Date(event.date).getDate()}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-lg">{event.title}</h3>
                          <Badge variant="outline">{event.category}</Badge>
                        </div>
                        <p className="text-gray-600 text-sm mb-3">{event.description}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4 text-sm">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Clock className="h-4 w-4" />
                        <span>{event.time}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <MapPin className="h-4 w-4" />
                        <span>{event.location}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <Users className="h-4 w-4" />
                        <span>{event.registered}/{event.capacity} registered</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <span className="text-sm">Organizer: {event.organizer}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Button 
                        size="sm"
                        className="bg-[#103078] hover:bg-[#2048A0]"
                        disabled={event.registered >= event.capacity}
                      >
                        {event.registered >= event.capacity ? 'Full' : 'Register'}
                      </Button>
                      <Button size="sm" variant="outline">
                        View Details <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                      <div className="ml-auto">
                        <div className="w-full bg-gray-200 rounded-full h-2 w-32">
                          <div
                            className="bg-[#2048A0] h-2 rounded-full"
                            style={{ width: `${(event.registered / event.capacity) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="past" className="mt-6 space-y-4">
          {pastEvents.map((event) => (
            <Card key={event.id} className="opacity-75">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-lg bg-gray-200 flex flex-col items-center justify-center text-gray-600">
                    <span className="text-xs font-medium">
                      {new Date(event.date).toLocaleDateString('en-US', { month: 'short' }).toUpperCase()}
                    </span>
                    <span className="text-2xl font-bold">
                      {new Date(event.date).getDate()}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-lg">{event.title}</h3>
                          <Badge variant="outline">{event.category}</Badge>
                        </div>
                        <p className="text-gray-600 text-sm mb-3">{event.description}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4 text-sm">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Clock className="h-4 w-4" />
                        <span>{event.time}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <MapPin className="h-4 w-4" />
                        <span>{event.location}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <Users className="h-4 w-4" />
                        <span>{event.registered}/{event.capacity} attended</span>
                      </div>
                    </div>
                    <Button size="sm" variant="outline">
                      View Summary <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="calendar" className="mt-6">
          <Card>
            <CardContent className="p-8 text-center">
              <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">Calendar view coming soon</p>
              <p className="text-sm text-gray-500">Full calendar integration with iCal export</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Quick Actions */}
      <Card className="border-[#103078]/20 bg-gradient-to-br from-white to-blue-50/30">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="h-5 w-5 text-[#103078]" />
            Event Management Tips
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="text-sm text-gray-600 space-y-2">
            <li>📅 Register early to secure your spot</li>
            <li>🔔 Enable notifications for event reminders</li>
            <li>📍 Check location details before attending</li>
            <li>💬 Use Q&A section for event questions</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
