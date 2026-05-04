import { MessageSquare, Star, ThumbsUp, FileText, Code, Presentation } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";

export default function PeerReview() {
  const reviewRequests = [
    {
      id: 1,
      type: "code",
      title: "SLAM Implementation Review",
      author: "Mike Lee",
      authorAvatar: "ML",
      description: "Need feedback on my EKF-SLAM implementation in Python",
      language: "Python",
      date: "2 hours ago",
      reviewers: 2,
      status: "in-review",
    },
    {
      id: 2,
      type: "presentation",
      title: "Robot Kinematics Presentation",
      author: "Sarah Kim",
      authorAvatar: "SK",
      description: "Preparing for mid-term presentation, need suggestions",
      date: "5 hours ago",
      reviewers: 3,
      status: "reviewed",
      rating: 4.5,
    },
    {
      id: 3,
      type: "document",
      title: "Project Proposal: Autonomous Drone",
      author: "Emily Park",
      authorAvatar: "EP",
      description: "Looking for feedback on project scope and feasibility",
      date: "1 day ago",
      reviewers: 1,
      status: "in-review",
    },
  ];

  const myReviews = [
    {
      id: 1,
      target: "Computer Vision Pipeline",
      targetAuthor: "John Doe",
      rating: 5,
      comment: "Excellent implementation! The edge detection algorithm is particularly well-optimized.",
      date: "Yesterday",
      helpful: 8,
    },
    {
      id: 2,
      target: "ROS2 Navigation Tutorial",
      targetAuthor: "Alex Chen",
      rating: 4,
      comment: "Very clear explanation. Would be great to add more examples.",
      date: "2 days ago",
      helpful: 5,
    },
  ];

  return (
    <div className="max-w-7xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-1">Peer Review</h1>
          <p className="text-gray-600">Give and receive constructive feedback</p>
        </div>
        <Button className="bg-[#103078] hover:bg-[#2048A0]">
          Request Review
        </Button>
      </div>

      <Tabs defaultValue="requests" className="mb-6">
        <TabsList>
          <TabsTrigger value="requests">Review Requests</TabsTrigger>
          <TabsTrigger value="my-reviews">My Reviews</TabsTrigger>
          <TabsTrigger value="received">Received</TabsTrigger>
        </TabsList>

        <TabsContent value="requests" className="mt-6">
          <div className="grid grid-cols-1 gap-4">
            {reviewRequests.map((request) => (
              <Card key={request.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div
                      className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                        request.type === "code"
                          ? "bg-purple-100"
                          : request.type === "presentation"
                          ? "bg-blue-100"
                          : "bg-green-100"
                      }`}
                    >
                      {request.type === "code" ? (
                        <Code
                          className={`h-6 w-6 ${
                            request.type === "code"
                              ? "text-purple-600"
                              : request.type === "presentation"
                              ? "text-blue-600"
                              : "text-green-600"
                          }`}
                        />
                      ) : request.type === "presentation" ? (
                        <Presentation
                          className={`h-6 w-6 ${
                            request.type === "code"
                              ? "text-purple-600"
                              : request.type === "presentation"
                              ? "text-blue-600"
                              : "text-green-600"
                          }`}
                        />
                      ) : (
                        <FileText
                          className={`h-6 w-6 ${
                            request.type === "code"
                              ? "text-purple-600"
                              : request.type === "presentation"
                              ? "text-blue-600"
                              : "text-green-600"
                          }`}
                        />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-semibold text-lg mb-1">
                            {request.title}
                          </h3>
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <div className="flex items-center gap-1">
                              <div className="w-6 h-6 rounded-full bg-[#103078] flex items-center justify-center text-white text-[12px]">
                                {request.authorAvatar}
                              </div>
                              <span>{request.author}</span>
                            </div>
                            <span>•</span>
                            <span>{request.date}</span>
                          </div>
                        </div>
                        <Badge
                          className={
                            request.status === "in-review"
                              ? "bg-yellow-100 text-yellow-700 hover:bg-yellow-100"
                              : "bg-green-100 text-green-700 hover:bg-green-100"
                          }
                        >
                          {request.status === "in-review"
                            ? "In Review"
                            : "Reviewed"}
                        </Badge>
                      </div>
                      <p className="text-gray-600 mb-3">{request.description}</p>
                      <div className="flex items-center gap-4">
                        {request.language && (
                          <Badge variant="outline" className="text-xs">
                            {request.language}
                          </Badge>
                        )}
                        <span className="text-sm text-gray-500">
                          {request.reviewers} reviewer(s)
                        </span>
                        {request.rating && (
                          <div className="flex items-center gap-1 text-sm">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            <span className="font-medium">{request.rating}</span>
                          </div>
                        )}
                      </div>
                      <div className="mt-4">
                        <Button size="sm" variant="outline">
                          {request.status === "in-review"
                            ? "Provide Review"
                            : "View Reviews"}
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="my-reviews" className="mt-6">
          <div className="space-y-4">
            {myReviews.map((review) => (
              <Card key={review.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold mb-1">{review.target}</h3>
                      <p className="text-sm text-gray-500">
                        by {review.targetAuthor} • {review.date}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${
                            i < review.rating
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-gray-300"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-gray-700 mb-4">{review.comment}</p>
                  <div className="flex items-center gap-4 text-sm">
                    <button className="flex items-center gap-1 text-gray-500 hover:text-[#2048A0]">
                      <ThumbsUp className="h-4 w-4" />
                      <span>{review.helpful} found helpful</span>
                    </button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="received" className="mt-6">
          <Card className="border-dashed">
            <CardContent className="p-8 text-center">
              <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 mb-2">No reviews received yet</p>
              <p className="text-sm text-gray-400 mb-4">
                Request reviews for your code, presentations, or documents
              </p>
              <Button variant="outline" size="sm">
                Request Your First Review
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Review Guidelines */}
      <Card className="border-[#103078]/20 bg-gradient-to-br from-white to-blue-50/30">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-[#103078]" />
            Review Guidelines
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="text-sm text-gray-600 space-y-2">
            <li>✅ Be constructive and respectful</li>
            <li>💡 Provide specific suggestions</li>
            <li>🎯 Focus on the work, not the person</li>
            <li>📝 Use examples to clarify points</li>
            <li>⭐ Rate honestly and fairly</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
