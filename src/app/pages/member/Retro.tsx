import { MessageSquare, Plus, ThumbsUp, ThumbsDown, Lightbulb } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";

export default function Retro() {
  const retrospectives = [
    {
      id: 1,
      title: "Q1 2026 Retrospective",
      date: "2026-03-31",
      project: "All Projects",
      participants: 24,
      status: "completed",
      summary: {
        went_well: 12,
        to_improve: 8,
        action_items: 6,
      },
    },
    {
      id: 2,
      title: "Autonomous Navigation Project Retro",
      date: "2026-02-28",
      project: "Autonomous Navigation",
      participants: 6,
      status: "completed",
      summary: {
        went_well: 8,
        to_improve: 5,
        action_items: 4,
      },
    },
    {
      id: 3,
      title: "ROS2 Workshop Series Retro",
      date: "2026-02-20",
      project: "Workshop",
      participants: 18,
      status: "completed",
      summary: {
        went_well: 15,
        to_improve: 7,
        action_items: 3,
      },
    },
  ];

  const retroTemplates = [
    {
      name: "Start, Stop, Continue",
      description: "Classic retrospective format focusing on behaviors",
      columns: ["Start Doing", "Stop Doing", "Continue Doing"],
    },
    {
      name: "What Went Well / To Improve",
      description: "Simple and effective two-column retrospective",
      columns: ["What Went Well", "What To Improve"],
    },
    {
      name: "4Ls: Liked, Learned, Lacked, Longed For",
      description: "Comprehensive retrospective covering multiple perspectives",
      columns: ["Liked", "Learned", "Lacked", "Longed For"],
    },
  ];

  // Sample retro content
  const sampleRetro = {
    wentWell: [
      { text: "Great team collaboration on SLAM integration", votes: 12 },
      { text: "Improved code review process", votes: 8 },
      { text: "Weekly sync meetings were productive", votes: 7 },
    ],
    toImprove: [
      { text: "Documentation needs more detail", votes: 9 },
      { text: "Testing coverage is insufficient", votes: 6 },
      { text: "Communication with external teams", votes: 5 },
    ],
    actionItems: [
      { text: "Create documentation template", owner: "Sarah", status: "done" },
      { text: "Set up automated testing pipeline", owner: "John", status: "in-progress" },
      { text: "Schedule bi-weekly sync with partners", owner: "Mike", status: "todo" },
    ],
  };

  return (
    <div className="max-w-7xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-1">Retrospectives</h1>
          <p className="text-gray-600">Reflect and improve continuously</p>
        </div>
        <Button className="bg-[#103078] hover:bg-[#2048A0]">
          <Plus className="h-4 w-4 mr-2" />
          New Retrospective
        </Button>
      </div>

      <Tabs defaultValue="recent" className="mb-6">
        <TabsList>
          <TabsTrigger value="recent">Recent Retros</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="recent" className="mt-6">
          {/* Most Recent Retro Detail */}
          <Card className="mb-6 border-[#2048A0]">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-[#2048A0]" />
                    {retrospectives[0].title}
                  </CardTitle>
                  <p className="text-sm text-gray-600 mt-1">
                    {retrospectives[0].date} • {retrospectives[0].participants} participants
                  </p>
                </div>
                <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                  Completed
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* What Went Well */}
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2 text-green-700">
                    <ThumbsUp className="h-4 w-4" />
                    What Went Well
                  </h3>
                  <div className="space-y-2">
                    {sampleRetro.wentWell.map((item, index) => (
                      <div
                        key={index}
                        className="p-3 bg-green-50 border border-green-200 rounded-lg"
                      >
                        <p className="text-sm">{item.text}</p>
                        <div className="flex items-center gap-1 mt-1 text-xs text-green-700">
                          <ThumbsUp className="h-3 w-3" />
                          <span>{item.votes} votes</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* To Improve */}
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2 text-orange-700">
                    <ThumbsDown className="h-4 w-4" />
                    What To Improve
                  </h3>
                  <div className="space-y-2">
                    {sampleRetro.toImprove.map((item, index) => (
                      <div
                        key={index}
                        className="p-3 bg-orange-50 border border-orange-200 rounded-lg"
                      >
                        <p className="text-sm">{item.text}</p>
                        <div className="flex items-center gap-1 mt-1 text-xs text-orange-700">
                          <ThumbsUp className="h-3 w-3" />
                          <span>{item.votes} votes</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Items */}
              <div className="mt-6">
                <h3 className="font-semibold mb-3 flex items-center gap-2 text-[#103078]">
                  <Lightbulb className="h-4 w-4" />
                  Action Items
                </h3>
                <div className="space-y-2">
                  {sampleRetro.actionItems.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg"
                    >
                      <div className="flex-1">
                        <p className="text-sm font-medium">{item.text}</p>
                        <p className="text-xs text-gray-600 mt-1">
                          Owner: {item.owner}
                        </p>
                      </div>
                      <Badge
                        className={
                          item.status === "done"
                            ? "bg-green-100 text-green-700 hover:bg-green-100"
                            : item.status === "in-progress"
                            ? "bg-blue-100 text-blue-700 hover:bg-blue-100"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-100"
                        }
                      >
                        {item.status === "done"
                          ? "Done"
                          : item.status === "in-progress"
                          ? "In Progress"
                          : "To Do"}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* All Retrospectives */}
          <h2 className="text-lg font-semibold mb-4">All Retrospectives</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {retrospectives.map((retro) => (
              <Card key={retro.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between mb-2">
                    <Badge variant="outline">{retro.project}</Badge>
                    <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                      {retro.status}
                    </Badge>
                  </div>
                  <CardTitle className="text-base">{retro.title}</CardTitle>
                  <p className="text-sm text-gray-600">{retro.date}</p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <p className="text-sm text-gray-600">
                      {retro.participants} participants
                    </p>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="p-2 bg-green-50 rounded">
                        <p className="text-lg font-bold text-green-700">
                          {retro.summary.went_well}
                        </p>
                        <p className="text-xs text-gray-600">Went Well</p>
                      </div>
                      <div className="p-2 bg-orange-50 rounded">
                        <p className="text-lg font-bold text-orange-700">
                          {retro.summary.to_improve}
                        </p>
                        <p className="text-xs text-gray-600">To Improve</p>
                      </div>
                      <div className="p-2 bg-blue-50 rounded">
                        <p className="text-lg font-bold text-blue-700">
                          {retro.summary.action_items}
                        </p>
                        <p className="text-xs text-gray-600">Actions</p>
                      </div>
                    </div>
                    <Button size="sm" variant="outline" className="w-full">
                      View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="templates" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {retroTemplates.map((template, index) => (
              <Card key={index} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="text-base">{template.name}</CardTitle>
                  <p className="text-sm text-gray-600">{template.description}</p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs font-medium text-gray-500 mb-2">
                        Columns
                      </p>
                      <div className="space-y-1">
                        {template.columns.map((column) => (
                          <div
                            key={column}
                            className="text-sm bg-gray-50 p-2 rounded"
                          >
                            {column}
                          </div>
                        ))}
                      </div>
                    </div>
                    <Button size="sm" className="w-full bg-[#103078] hover:bg-[#2048A0]">
                      Use Template
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Info */}
      <Card className="border-[#103078]/20 bg-gradient-to-br from-white to-blue-50/30">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-[#103078]" />
            Retrospective Best Practices
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="text-sm text-gray-600 space-y-2">
            <li>🎯 Focus on actionable improvements</li>
            <li>🤝 Create a safe, blameless environment</li>
            <li>⏱️ Keep it time-boxed (60-90 minutes)</li>
            <li>📝 Document and follow up on action items</li>
            <li>🔄 Review previous action items first</li>
            <li>✨ Celebrate wins and progress</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
