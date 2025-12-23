import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface MetricsCardProps {
     title: string;
     value: string | number;
     description?: string;
     className?: string;
     onClick?: () => void;
}

export function MetricsCard({
     title,
     value,
     description,
     className,
     onClick,
}: MetricsCardProps) {
     return (
          <Card
               className={cn(className)}
               onClick={onClick}
          >
               <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                         {title}
                    </CardTitle>
               </CardHeader>
               <CardContent>
                    <div className="text-2xl font-bold">{value}</div>
                    {description && (
                         <p className="text-xs text-muted-foreground mt-1">
                              {description}
                         </p>
                    )}
               </CardContent>
          </Card>
     );
}
