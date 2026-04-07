import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { ExternalLink, Lock } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";

interface TalentCardProps {
  xUserId: string;
  handle?: string;
  displayName?: string;
  profileImageUrl?: string;
  roleTags: string[];
  profileScore?: number;
  bluechipScore?: number;
  bluechipVerified?: boolean;
  analysisSummary?: string;
  portfolioUrl?: string;
  matchScore?: number;
  matchReason?: string;
  isPaid?: boolean;
  fullProfile?: any;
  onViewProfile?: () => void;
}

const TalentCard = ({ xUserId, handle, displayName, profileImageUrl, roleTags, profileScore, bluechipScore, bluechipVerified, analysisSummary, portfolioUrl, matchScore, matchReason, isPaid = false, fullProfile, onViewProfile }: TalentCardProps) => {
  const showFullDetails = isPaid && fullProfile;
  return (
    <Card className={`hover:border-primary transition-colors ${!isPaid ? 'relative overflow-hidden' : ''}`}>
      {!isPaid && <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background/95 backdrop-blur-[2px] z-10" />}
      <CardHeader>
        <div className="flex items-start gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={profileImageUrl} alt={displayName || handle} />
            <AvatarFallback>{(displayName || handle || '?')[0].toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              {matchScore && <Badge variant="outline" className="text-primary">{matchScore}% Match</Badge>}
              {bluechipVerified && <Badge variant="secondary">✓ Bluechip</Badge>}
            </div>
            <CardTitle className="text-xl">{displayName || handle || 'Anonymous'}</CardTitle>
            {handle && <CardDescription>@{handle}</CardDescription>}
          </div>
          {profileScore && (
            <div className="text-right">
              <div className="text-2xl font-bold text-primary">{profileScore.toFixed(1)}</div>
              <div className="text-xs text-muted-foreground">Profile Score</div>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {roleTags.length > 0 && (
          <div><p className="text-sm text-muted-foreground mb-2">Roles</p>
            <div className="flex flex-wrap gap-2">{roleTags.map((tag, index) => <Badge key={index} variant="default">{tag}</Badge>)}</div>
          </div>
        )}
        {matchReason && <div className="bg-primary/10 p-3 rounded-lg"><p className="text-sm text-primary font-medium mb-1">Why this matches:</p><p className="text-sm">{matchReason}</p></div>}
        {showFullDetails ? (
          <>
            <div><p className="text-sm text-muted-foreground mb-2">Analysis Summary</p><p className="text-sm">{fullProfile.analysis_summary || analysisSummary}</p></div>
            {fullProfile.profile_analysis?.notable_interactions && <div><p className="text-sm text-muted-foreground mb-2">Notable Interactions</p><p className="text-sm">{fullProfile.profile_analysis.notable_interactions}</p></div>}
            {(fullProfile.portfolio_url || portfolioUrl) && <Button className="w-full" variant="outline" asChild><a href={fullProfile.portfolio_url || portfolioUrl} target="_blank" rel="noopener noreferrer">View Portfolio <ExternalLink className="ml-2 h-4 w-4" /></a></Button>}
            <div className="text-xs text-muted-foreground text-center pt-2 border-t">Full profile unlocked</div>
          </>
        ) : (
          <>
            {analysisSummary && <div><p className="text-sm text-muted-foreground mb-2">Summary</p><p className="text-sm line-clamp-2">{analysisSummary}</p></div>}
            {bluechipScore !== undefined && <div className="flex justify-between text-sm"><span className="text-muted-foreground">Bluechip Score</span><span className="font-medium">{bluechipScore.toFixed(1)}/10</span></div>}
            <Button className="w-full" onClick={onViewProfile} disabled={!onViewProfile}><Lock className="mr-2 h-4 w-4" />View Full Profile - $5 SOL</Button>
            <div className="text-xs text-muted-foreground text-center">Payment required to view full details</div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default TalentCard;