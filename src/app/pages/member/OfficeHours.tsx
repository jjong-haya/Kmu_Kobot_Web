import { Clock, User, Calendar, MapPin, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";

export default function OfficeHours() {
  const mentors = [
    {
      id: 1,
      name: "Prof. Kim",
      role: "Faculty Advisor",
      avatar: "PK",
      expertise: ["ROS", "Control Systems", "Research"],
      availability: "Mon, Wed 2-4 PM",
      nextSlot: "2026-02-18 14:00",
    },
    {
      id: 2,
      name: "Sarah Kim",
      role: "President",
      avatar: "SK",
      expertise: ["SLAM", "Navigation", "Project Management"],
      availability: "Tue, Thu 3-5 PM",
      nextSlot: "2026-02-17 15:00",
    },
    {
      id: 3,
      name: "John Doe",
      role: "Technical Lead",
      avatar: "JD",
      expertise: ["Computer Vision", "AI/ML", "Python"],
      availability: "Wed, Fri 4-6 PM",
      nextSlot: "2026-02-18 16:00",
    },
  ];

  const upcomingBookings = [
    {
      id: 1,
      mentor: "Sarah Kim",
      mentorAvatar: "SK",
      date: "2026-02-18",
      time: "15:00 - 15:30",
      topic: "SLAM Implementation Review",
      location: "Online",
      status: "confirmed",
    },
    {
      id: 2,
      mentor: "Prof. Kim",
      mentorAvatar: "PK",
      date: "2026-02-20",
      time: "14:30 - 15:00",
      topic: "Research Paper Discussion",
      location: "Office 301",
      status: "pending",
    },
  ];

  return (
    <div className="max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-1">Office Hours</h1>
          <p className="text-gray-600">Book consultation slots with mentors</p>
        </div>
      </div>

      {/* My Upcoming Bookings */}
      <Card className="mb-6 border-[#2048A0]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-[#2048A0]" />
            My Upcoming Bookings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {upcomingBookings.map((booking) => (
              <div
                key={booking.id}
                className="flex items-center gap-4 p-4 bg-blue-50 rounded-lg"
              >
                <div className="w-12 h-12 rounded-full bg-[#103078] flex items-center justify-center text-white font-medium">
                  {booking.mentorAvatar}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold">{booking.mentor}</h4>
                    <Badge
                      className={
                        booking.status === "confirmed"
                          ? "bg-green-100 text-green-700 hover:bg-green-100"
                          : "bg-yellow-100 text-yellow-700 hover:bg-yellow-100"
                      }
                    >
                      {booking.status}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {booking.date}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {booking.time}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" />
                      {booking.location}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 mt-1">{booking.topic}</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline">
                    Reschedule
                  </Button>
                  <Button size="sm" variant="outline" className="text-red-600">
                    Cancel
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Available Mentors */}
      <Tabs defaultValue="all" className="mb-6">
        <TabsList>
          <TabsTrigger value="all">All Mentors</TabsTrigger>
          <TabsTrigger value="faculty">Faculty</TabsTrigger>
          <TabsTrigger value="students">Student Leaders</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mentors.map((mentor) => (
              <Card key={mentor.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex flex-col items-center text-center">
                    <div className="w-20 h-20 rounded-full bg-[#103078] flex items-center justify-center text-white text-2xl font-bold mb-3">
                      {mentor.avatar}
                    </div>
                    <CardTitle className="text-lg">{mentor.name}</CardTitle>
                    <p className="text-sm text-gray-600">{mentor.role}</p>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs font-medium text-gray-500 mb-2">Expertise</p>
                      <div className="flex flex-wrap gap-1.5">
                        {mentor.expertise.map((skill) => (
                          <Badge key={skill} variant="outline" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500 mb-1">Availability</p>
                      <p className="text-sm text-gray-700">{mentor.availability}</p>
                    </div>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-2">
                      <p className="text-xs text-green-700">
                        Next available: {new Date(mentor.nextSlot).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                    <Button className="w-full bg-[#103078] hover:bg-[#2048A0]">
                      <Plus className="h-4 w-4 mr-2" />
                      Book Slot
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="faculty" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mentors
              .filter((m) => m.role.includes("Faculty") || m.role.includes("Prof"))
              .map((mentor) => (
                <Card key={mentor.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex flex-col items-center text-center">
                      <div className="w-20 h-20 rounded-full bg-[#103078] flex items-center justify-center text-white text-2xl font-bold mb-3">
                        {mentor.avatar}
                      </div>
                      <CardTitle className="text-lg">{mentor.name}</CardTitle>
                      <p className="text-sm text-gray-600">{mentor.role}</p>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <p className="text-xs font-medium text-gray-500 mb-2">Expertise</p>
                        <div className="flex flex-wrap gap-1.5">
                          {mentor.expertise.map((skill) => (
                            <Badge key={skill} variant="outline" className="text-xs">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-500 mb-1">Availability</p>
                        <p className="text-sm text-gray-700">{mentor.availability}</p>
                      </div>
                      <div className="bg-green-50 border border-green-200 rounded-lg p-2">
                        <p className="text-xs text-green-700">
                          Next available: {new Date(mentor.nextSlot).toLocaleString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                      <Button className="w-full bg-[#103078] hover:bg-[#2048A0]">
                        <Plus className="h-4 w-4 mr-2" />
                        Book Slot
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </TabsContent>

        <TabsContent value="students" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mentors
              .filter((m) => !m.role.includes("Faculty") && !m.role.includes("Prof"))
              .map((mentor) => (
                <Card key={mentor.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex flex-col items-center text-center">
                      <div className="w-20 h-20 rounded-full bg-[#103078] flex items-center justify-center text-white text-2xl font-bold mb-3">
                        {mentor.avatar}
                      </div>
                      <CardTitle className="text-lg">{mentor.name}</CardTitle>
                      <p className="text-sm text-gray-600">{mentor.role}</p>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <p className="text-xs font-medium text-gray-500 mb-2">Expertise</p>
                        <div className="flex flex-wrap gap-1.5">
                          {mentor.expertise.map((skill) => (
                            <Badge key={skill} variant="outline" className="text-xs">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-500 mb-1">Availability</p>
                        <p className="text-sm text-gray-700">{mentor.availability}</p>
                      </div>
                      <div className="bg-green-50 border border-green-200 rounded-lg p-2">
                        <p className="text-xs text-green-700">
                          Next available: {new Date(mentor.nextSlot).toLocaleString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                      <Button className="w-full bg-[#103078] hover:bg-[#2048A0]">
                        <Plus className="h-4 w-4 mr-2" />
                        Book Slot
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Info Card */}
      <Card className="border-[#103078]/20 bg-gradient-to-br from-white to-blue-50/30">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <User className="h-5 w-5 text-[#103078]" />
            Booking Guidelines
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="text-sm text-gray-600 space-y-2">
            <li>📅 Book at least 24 hours in advance</li>
            <li>⏱️ Each slot is 30 minutes</li>
            <li>📝 Prepare specific questions/topics</li>
            <li>🔔 You'll receive reminders via email</li>
            <li>❌ Cancel at least 12 hours before if needed</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
