import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { ExternalLink } from "lucide-react";

interface JobCardProps {
  type: 'job' | 'task';
  title: string;
  description: string;
  requirements?: string;
  link?: string;
  roleTags: string[];
  compensation?: string;
  matchScore?: number;
  matchReason?: string;
}

const JobCard = ({ type, title, description, requirements, link, roleTags, compensation, matchScore, matchReason }: JobCardProps) => {
  return (
    <Card className="hover:border-primary transition-colors">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant={type === 'job' ? 'default' : 'secondary'}>{type === 'job' ? 'Job' : 'Task'}</Badge>
              {matchScore && <Badge variant="outline" className="text-primary">{matchScore}% Match</Badge>}
            </div>
            <CardTitle className="text-xl">{title}</CardTitle>
            {compensation && <CardDescription className="mt-1 font-medium">{compensation}</CardDescription>}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div><p className="text-sm text-muted-foreground mb-2">Description</p><p className="text-sm">{description}</p></div>
        {requirements && <div><p className="text-sm text-muted-foreground mb-2">Requirements</p><p className="text-sm">{requirements}</p></div>}
        {roleTags.length > 0 && (
          <div><p className="text-sm text-muted-foreground mb-2">Role Tags</p>
            <div className="flex flex-wrap gap-2">{roleTags.map((tag, index) => <Badge key={index} variant="secondary">{tag}</Badge>)}</div>
          </div>
        )}
        {matchReason && <div className="bg-primary/10 p-3 rounded-lg"><p className="text-sm text-primary font-medium mb-1">Why this matches:</p><p className="text-sm">{matchReason}</p></div>}
        {link && <Button className="w-full" asChild><a href={link} target="_blank" rel="noopener noreferrer">View Details <ExternalLink className="ml-2 h-4 w-4" /></a></Button>}
      </CardContent>
    </Card>
  );
};

export default JobCard;