import { Target, Plus, TrendingUp, Circle, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Progress } from "../../components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";

export default function Roadmap() {
  const quarters = [
    {
      name: "Q1 2026",
      period: "Jan - Mar",
      objectives: [
        {
          id: 1,
          title: "Complete ROS2 Migration",
          description: "Migrate all existing projects to ROS2 Humble",
          owner: "Technical Team",
          progress: 75,
          status: "in-progress",
          keyResults: [
            { text: "5 projects migrated", completed: 4, total: 5 },
            { text: "Documentation updated", completed: true },
            { text: "Training sessions held", completed: 3, total: 4 },
          ],
        },
        {
          id: 2,
          title: "Win Regional Robot Competition",
          description: "Prepare and compete in the Spring Regional Championship",
          owner: "Competition Team",
          progress: 60,
          status: "in-progress",
          keyResults: [
            { text: "Robot design finalized", completed: true },
            { text: "Practice sessions completed", completed: 8, total: 12 },
            { text: "Achieve top 3 ranking", completed: false },
          ],
        },
      ],
    },
    {
      name: "Q2 2026",
      period: "Apr - Jun",
      objectives: [
        {
          id: 3,
          title: "Launch AI/ML Study Track",
          description: "Establish structured AI/ML learning program",
          owner: "Education Team",
          progress: 0,
          status: "planned",
          keyResults: [
            { text: "Curriculum developed", completed: false },
            { text: "20+ members enrolled", completed: false },
            { text: "2 demo projects completed", completed: false },
          ],
        },
        {
          id: 4,
          title: "Upgrade Lab Equipment",
          description: "Modernize lab with new sensors and computing hardware",
          owner: "Admin",
          progress: 0,
          status: "planned",
          keyResults: [
            { text: "Budget approved", completed: false },
            { text: "Equipment purchased", completed: false },
            { text: "Setup and training complete", completed: false },
          ],
        },
      ],
    },
  ];

  return (
    <div className="max-w-7xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-1">Roadmap & OKRs</h1>
          <p className="text-gray-600">Club objectives and key results</p>
        </div>
        <Button className="bg-[#103078] hover:bg-[#2048A0]">
          <Plus className="h-4 w-4 mr-2" />
          Add Objective
        </Button>
      </div>

      {/* Overall Progress */}
      <Card className="mb-6 border-[#2048A0]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-[#2048A0]" />
            2026 Progress Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-gray-600 mb-2">Total Objectives</p>
              <p className="text-3xl font-bold text-[#103078]">4</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-2">In Progress</p>
              <p className="text-3xl font-bold text-[#2048A0]">2</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-2">Average Progress</p>
              <p className="text-3xl font-bold text-green-600">34%</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quarters */}
      <Tabs defaultValue={quarters[0].name} className="mb-6">
        <TabsList>
          {quarters.map((q) => (
            <TabsTrigger key={q.name} value={q.name}>
              {q.name}
            </TabsTrigger>
          ))}
        </TabsList>

        {quarters.map((quarter) => (
          <TabsContent key={quarter.name} value={quarter.name} className="mt-6">
            <div className="mb-4">
              <h2 className="text-lg font-semibold">{quarter.name}</h2>
              <p className="text-sm text-gray-600">{quarter.period}</p>
            </div>

            <div className="space-y-6">
              {quarter.objectives.map((objective) => (
                <Card
                  key={objective.id}
                  className={`${
                    objective.status === "in-progress"
                      ? "border-[#2048A0]"
                      : ""
                  }`}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Target className="h-5 w-5 text-[#103078]" />
                          <CardTitle className="text-lg">
                            {objective.title}
                          </CardTitle>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">
                          {objective.description}
                        </p>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">
                            Owner: {objective.owner}
                          </Badge>
                          <Badge
                            className={
                              objective.status === "in-progress"
                                ? "bg-blue-100 text-blue-700 hover:bg-blue-100"
                                : "bg-gray-100 text-gray-700 hover:bg-gray-100"
                            }
                          >
                            {objective.status === "in-progress"
                              ? "In Progress"
                              : "Planned"}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Progress */}
                      <div>
                        <div className="flex items-center justify-between text-sm mb-2">
                          <span className="font-medium">Overall Progress</span>
                          <span className="font-bold text-[#2048A0]">
                            {objective.progress}%
                          </span>
                        </div>
                        <Progress value={objective.progress} className="h-2" />
                      </div>

                      {/* Key Results */}
                      <div>
                        <h4 className="text-sm font-semibold mb-3">
                          Key Results
                        </h4>
                        <div className="space-y-3">
                          {objective.keyResults.map((kr, index) => (
                            <div
                              key={index}
                              className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
                            >
                              <div
                                className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                                  kr.completed === true ||
                                  (typeof kr.completed === "number" &&
                                    kr.completed === kr.total)
                                    ? "bg-green-100"
                                    : "bg-gray-200"
                                }`}
                              >
                                {kr.completed === true ||
                                (typeof kr.completed === "number" &&
                                  kr.completed === kr.total) ? (
                                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                                ) : (
                                  <Circle className="h-4 w-4 text-gray-400" />
                                )}
                              </div>
                              <div className="flex-1">
                                <p className="text-sm font-medium">
                                  {kr.text}
                                </p>
                                {typeof kr.completed === "number" && (
                                  <p className="text-xs text-gray-500 mt-1">
                                    Progress: {kr.completed}/{kr.total}
                                  </p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <Button size="sm" variant="outline">
                        View Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>

      {/* Info */}
      <Card className="border-[#103078]/20 bg-gradient-to-br from-white to-blue-50/30">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Target className="h-5 w-5 text-[#103078]" />
            About OKRs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 mb-3">
            OKRs (Objectives and Key Results) help us set ambitious goals and
            track our progress transparently.
          </p>
          <ul className="text-sm text-gray-600 space-y-2">
            <li>🎯 <strong>Objectives:</strong> What we want to achieve</li>
            <li>📊 <strong>Key Results:</strong> How we measure success</li>
            <li>📈 <strong>Progress:</strong> Updated weekly</li>
            <li>🔄 <strong>Reviews:</strong> Quarterly retrospectives</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
