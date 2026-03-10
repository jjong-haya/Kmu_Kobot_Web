import { ListChecks, Play, CheckCircle2, Clock, BookOpen } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Progress } from "../../components/ui/progress";
import { Button } from "../../components/ui/button";

export default function StudyPlaylist() {
  const playlists = [
    {
      id: 1,
      title: "ROS2 Fundamentals",
      description: "Complete guide to ROS2 from basics to advanced topics",
      weeks: 8,
      totalLessons: 24,
      completed: 12,
      progress: 50,
      status: "in-progress",
      difficulty: "Beginner",
    },
    {
      id: 2,
      title: "Computer Vision for Robotics",
      description: "Master OpenCV and deep learning for robot perception",
      weeks: 10,
      totalLessons: 30,
      completed: 5,
      progress: 17,
      status: "in-progress",
      difficulty: "Intermediate",
    },
    {
      id: 3,
      title: "Robot Kinematics & Dynamics",
      description: "Mathematical foundations for robot motion",
      weeks: 6,
      totalLessons: 18,
      completed: 18,
      progress: 100,
      status: "completed",
      difficulty: "Advanced",
    },
    {
      id: 4,
      title: "Embedded Systems with Arduino",
      description: "Hands-on microcontroller programming",
      weeks: 4,
      totalLessons: 12,
      completed: 0,
      progress: 0,
      status: "not-started",
      difficulty: "Beginner",
    },
  ];

  const currentWeekLessons = [
    {
      id: 1,
      title: "Introduction to ROS2 Nodes",
      duration: "25 min",
      type: "video",
      completed: true,
    },
    {
      id: 2,
      title: "Creating Your First Publisher",
      duration: "30 min",
      type: "tutorial",
      completed: true,
    },
    {
      id: 3,
      title: "Subscriber Implementation",
      duration: "28 min",
      type: "tutorial",
      completed: false,
    },
    {
      id: 4,
      title: "Quiz: ROS2 Communication",
      duration: "15 min",
      type: "quiz",
      completed: false,
    },
  ];

  return (
    <div className="max-w-6xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-1">Study Playlist</h1>
        <p className="text-gray-600">Structured learning paths and curriculum</p>
      </div>

      {/* Current Week */}
      <Card className="mb-6 border-[#2048A0]">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>This Week's Lessons</CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                ROS2 Fundamentals - Week 4
              </p>
            </div>
            <Badge className="bg-[#2048A0]">In Progress</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {currentWeekLessons.map((lesson) => (
              <div
                key={lesson.id}
                className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg"
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    lesson.completed
                      ? "bg-green-100 text-green-600"
                      : "bg-gray-200 text-gray-400"
                  }`}
                >
                  {lesson.completed ? (
                    <CheckCircle2 className="h-5 w-5" />
                  ) : (
                    <Play className="h-5 w-5" />
                  )}
                </div>
                <div className="flex-1">
                  <h4 className="font-medium">{lesson.title}</h4>
                  <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {lesson.duration}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {lesson.type}
                    </Badge>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant={lesson.completed ? "outline" : "default"}
                  className={
                    !lesson.completed ? "bg-[#103078] hover:bg-[#2048A0]" : ""
                  }
                >
                  {lesson.completed ? "Review" : "Start"}
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* All Playlists */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {playlists.map((playlist) => (
          <Card
            key={playlist.id}
            className={`hover:shadow-md transition-shadow ${
              playlist.status === "in-progress" ? "border-[#2048A0]/30" : ""
            }`}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <BookOpen className="h-5 w-5 text-[#103078]" />
                    <CardTitle className="text-lg">{playlist.title}</CardTitle>
                  </div>
                  <p className="text-sm text-gray-600">{playlist.description}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-4 text-sm">
                  <Badge
                    variant="outline"
                    className={
                      playlist.difficulty === "Beginner"
                        ? "border-green-300 text-green-700"
                        : playlist.difficulty === "Intermediate"
                        ? "border-yellow-300 text-yellow-700"
                        : "border-red-300 text-red-700"
                    }
                  >
                    {playlist.difficulty}
                  </Badge>
                  <span className="text-gray-600">{playlist.weeks} weeks</span>
                  <span className="text-gray-600">
                    {playlist.totalLessons} lessons
                  </span>
                </div>

                <div>
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-gray-600">Progress</span>
                    <span className="font-medium">{playlist.progress}%</span>
                  </div>
                  <Progress value={playlist.progress} className="h-2" />
                  <p className="text-xs text-gray-500 mt-1">
                    {playlist.completed} of {playlist.totalLessons} completed
                  </p>
                </div>

                <Button
                  className={`w-full ${
                    playlist.status === "in-progress"
                      ? "bg-[#103078] hover:bg-[#2048A0]"
                      : playlist.status === "completed"
                      ? ""
                      : ""
                  }`}
                  variant={
                    playlist.status === "completed" ? "outline" : "default"
                  }
                >
                  {playlist.status === "not-started"
                    ? "Start Learning"
                    : playlist.status === "in-progress"
                    ? "Continue"
                    : "Review"}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Study Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">This Week</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-[#103078]">4.5</p>
            <p className="text-sm text-gray-600">hours studied</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">35</p>
            <p className="text-sm text-gray-600">lessons finished</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Streak</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-[#2048A0]">12</p>
            <p className="text-sm text-gray-600">days in a row</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
