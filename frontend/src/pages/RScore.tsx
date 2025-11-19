import { useParams, useNavigate, Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, TrendingUp, Award, CheckCircle, XCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";

const RScore = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // Determine current user id from token
  const getCurrentUserId = () => {
    const token = localStorage.getItem("token");
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.id || payload.userId || payload.sub || null;
    } catch (e) {
      return null;
    }
  };

  const currentUserId = getCurrentUserId();
  const targetUserId = id || currentUserId;

  // Fetch R-Score
  const { data: rscoreData, isLoading: isLoadingRScore, isError: isErrorRScore } = useQuery({
    queryKey: ["rscore", targetUserId],
    queryFn: async () => {
      const res = await api.get(`/rscore/${targetUserId}`);
      return res.data;
    },
    enabled: !!targetUserId,
  });

  // Fetch user details
  const { data: user, isLoading: isLoadingUser } = useQuery({
    queryKey: ["user", targetUserId],
    queryFn: async () => {
      const res = await api.get(`/users/${targetUserId}`);
      return res.data;
    },
    enabled: !!targetUserId,
  });

  // Fetch reviews received by this user
  const { data: reviews, isLoading: isLoadingReviews } = useQuery({
    queryKey: ["reviews", "user", targetUserId],
    queryFn: async () => {
      const res = await api.get(`/reviews/user/${targetUserId}`);
      return Array.isArray(res.data) ? res.data : [];
    },
    enabled: !!targetUserId,
  });

  const rscore = rscoreData?.rscore || 0;
  const level = rscoreData?.level || "N/A";

  // Score color
  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-500";
    if (score >= 75) return "text-blue-500";
    if (score >= 50) return "text-yellow-500";
    return "text-red-500";
  };

  // Badge variant
  const getBadgeVariant = (score: number): "default" | "secondary" | "destructive" | "outline" => {
    if (score >= 90) return "default";
    if (score >= 75) return "secondary";
    if (score >= 50) return "outline";
    return "destructive";
  };

  const isLoading = isLoadingRScore || isLoadingUser || isLoadingReviews;

  if (!targetUserId) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <p className="text-red-500">Please login to view R-Score</p>
          <Link to="/login">
            <Button className="mt-4">Login</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <p className="text-muted-foreground">Loading R-Score...</p>
        </div>
      </div>
    );
  }

  if (isErrorRScore) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <p className="text-red-500">Failed to load R-Score</p>
          <Button onClick={() => navigate(-1)} className="mt-4">Go Back</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center text-muted-foreground hover:text-foreground mb-8"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </button>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Score Card */}
          <div className="lg:col-span-1">
            <Card className="p-8 border-2 border-primary/20 text-center space-y-6">
              <div className="flex justify-center">
                <Award className="h-16 w-16 text-primary" />
              </div>
              
              <div>
                <h2 className="text-lg text-muted-foreground mb-2">Reliability Score</h2>
                <div className={`text-6xl font-bold ${getScoreColor(rscore)}`}>
                  {rscore.toFixed(0)}
                </div>
                <p className="text-sm text-muted-foreground mt-1">out of 100</p>
              </div>

              <Badge variant={getBadgeVariant(rscore)} className="text-lg px-4 py-2">
                {level}
              </Badge>

              <Progress value={rscore} className="h-3" />

              {user && (
                <div className="pt-4 border-t border-border">
                  <p className="text-sm text-muted-foreground">User</p>
                  <p className="font-semibold">{user.name || user.email}</p>
                </div>
              )}
            </Card>
          </div>

          {/* Right Column - Details */}
          <div className="lg:col-span-2 space-y-8">
            {/* Statistics */}
            <Card className="p-6">
              <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <TrendingUp className="h-6 w-6 text-primary" />
                Statistics
              </h3>
              
              {user && (
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-green-500/10 rounded-lg">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <span className="text-sm">On-Time Returns</span>
                      </div>
                      <span className="font-bold text-green-500">{user.onTimeReturns || 0}</span>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-blue-500/10 rounded-lg">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-blue-500" />
                        <span className="text-sm">Good Condition Returns</span>
                      </div>
                      <span className="font-bold text-blue-500">{user.goodConditionReturns || 0}</span>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-purple-500/10 rounded-lg">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-purple-500" />
                        <span className="text-sm">Completed Leases</span>
                      </div>
                      <span className="font-bold text-purple-500">{user.completedLeases || 0}</span>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-green-500/10 rounded-lg">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <span className="text-sm">Disputes Won</span>
                      </div>
                      <span className="font-bold text-green-500">{user.disputesWon || 0}</span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-yellow-500/10 rounded-lg">
                      <div className="flex items-center gap-2">
                        <XCircle className="h-5 w-5 text-yellow-500" />
                        <span className="text-sm">Late Returns</span>
                      </div>
                      <span className="font-bold text-yellow-500">{user.lateReturns || 0}</span>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-orange-500/10 rounded-lg">
                      <div className="flex items-center gap-2">
                        <XCircle className="h-5 w-5 text-orange-500" />
                        <span className="text-sm">Damage Reports</span>
                      </div>
                      <span className="font-bold text-orange-500">{user.damageReports || 0}</span>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-red-500/10 rounded-lg">
                      <div className="flex items-center gap-2">
                        <XCircle className="h-5 w-5 text-red-500" />
                        <span className="text-sm">Lost Items</span>
                      </div>
                      <span className="font-bold text-red-500">{user.lostItems || 0}</span>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-red-500/10 rounded-lg">
                      <div className="flex items-center gap-2">
                        <XCircle className="h-5 w-5 text-red-500" />
                        <span className="text-sm">Disputes Lost</span>
                      </div>
                      <span className="font-bold text-red-500">{user.disputesLost || 0}</span>
                    </div>
                  </div>
                </div>
              )}
            </Card>

            {/* Reviews */}
            <Card className="p-6">
              <h3 className="text-2xl font-bold mb-6">Reviews Received</h3>
              
              {reviews && reviews.length > 0 ? (
                <div className="space-y-4">
                  {reviews.map((review: any) => (
                    <div key={review.id} className="p-4 bg-secondary/20 rounded-lg border border-border">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-semibold">{review.reviewer?.name || "Anonymous"}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(review.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <span
                              key={star}
                              className={`text-sm ${
                                star <= review.rating ? "text-yellow-400" : "text-gray-300"
                              }`}
                            >
                              ★
                            </span>
                          ))}
                        </div>
                      </div>
                      {review.comment && (
                        <p className="text-sm text-muted-foreground mt-2">{review.comment}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">No reviews yet</p>
              )}
            </Card>

            {/* How it works */}
            <Card className="p-6 bg-muted/30">
              <h3 className="text-xl font-bold mb-4">How R-Score Works</h3>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>✓ On-time return: <span className="text-green-500 font-semibold">+5 points</span></p>
                <p>✓ Good condition return: <span className="text-green-500 font-semibold">+3 points</span></p>
                <p>✓ Every 5 completed leases: <span className="text-green-500 font-semibold">+10 points</span></p>
                <p>✓ Dispute won: <span className="text-green-500 font-semibold">+10 points</span></p>
                <p>✓ Positive rating: <span className="text-green-500 font-semibold">+(rating-3) × 2.5 points</span></p>
                <p className="pt-2">✗ Late return: <span className="text-red-500 font-semibold">-10 points</span></p>
                <p>✗ Item damaged: <span className="text-red-500 font-semibold">-15 points</span></p>
                <p>✗ Item lost: <span className="text-red-500 font-semibold">-40 points</span></p>
                <p>✗ Dispute lost: <span className="text-red-500 font-semibold">-20 points</span></p>
                <p className="pt-2 text-xs">Score is capped between 0 and 100. Default starting score is 80.</p>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RScore;
