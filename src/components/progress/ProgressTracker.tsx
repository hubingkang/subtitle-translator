'use client';

import { CheckCircle, Clock, XCircle, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { TranslationProgress } from '@/types/translation';

interface ProgressTrackerProps {
  progress: TranslationProgress;
  isActive: boolean;
}

export function ProgressTracker({ progress, isActive }: ProgressTrackerProps) {
  const { total, completed, failed, current } = progress;
  const remaining = total - completed - failed;
  const completionRate = total > 0 ? ((completed + failed) / total) * 100 : 0;
  const successRate = total > 0 ? (completed / total) * 100 : 0;

  if (!isActive && total === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Translation Progress</CardTitle>
          {isActive && (
            <Badge variant="secondary" className="flex items-center gap-2">
              <Loader2 className="h-3 w-3 animate-spin" />
              <span className="text-xs">Translating...</span>
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Overall Progress */}
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="font-medium">Overall Progress</span>
            <span className="text-muted-foreground">{Math.round(completionRate)}%</span>
          </div>
          <Progress value={completionRate} className="h-2" />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <div className="text-2xl font-bold">{total}</div>
            <div className="text-xs text-muted-foreground uppercase tracking-wide">Total</div>
          </div>
          
          <div className="text-center p-3 rounded-lg bg-green-50 dark:bg-green-950/20">
            <div className="flex items-center justify-center gap-1 text-green-600 dark:text-green-400">
              <CheckCircle className="h-4 w-4" />
              <span className="text-2xl font-bold">{completed}</span>
            </div>
            <div className="text-xs text-green-600 dark:text-green-400 uppercase tracking-wide">Completed</div>
          </div>
          
          <div className="text-center p-3 rounded-lg bg-yellow-50 dark:bg-yellow-950/20">
            <div className="flex items-center justify-center gap-1 text-yellow-600 dark:text-yellow-400">
              <Clock className="h-4 w-4" />
              <span className="text-2xl font-bold">{remaining}</span>
            </div>
            <div className="text-xs text-yellow-600 dark:text-yellow-400 uppercase tracking-wide">Remaining</div>
          </div>
          
          <div className="text-center p-3 rounded-lg bg-red-50 dark:bg-red-950/20">
            <div className="flex items-center justify-center gap-1 text-red-600 dark:text-red-400">
              <XCircle className="h-4 w-4" />
              <span className="text-2xl font-bold">{failed}</span>
            </div>
            <div className="text-xs text-red-600 dark:text-red-400 uppercase tracking-wide">Failed</div>
          </div>
        </div>

        {/* Success Rate */}
        {completed + failed > 0 && (
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="font-medium">Success Rate</span>
              <span className="text-muted-foreground">{Math.round(successRate)}%</span>
            </div>
            <Progress value={successRate} className="h-2" />
          </div>
        )}

        {/* Current Translation */}
        {isActive && current && (
          <>
            <Separator />
            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground">Currently translating:</div>
              <div className="text-sm bg-muted/50 p-3 rounded-md border-l-2 border-primary">
                {current}
              </div>
            </div>
          </>
        )}

        {/* Completion Message */}
        {!isActive && total > 0 && completed + failed === total && (
          <>
            <Separator />
            <div className={`p-4 rounded-lg border ${
              failed === 0 
                ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800'
                : 'bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800'
            }`}>
              <div className={`flex items-center gap-2 mb-2 ${
                failed === 0 ? 'text-green-700 dark:text-green-400' : 'text-yellow-700 dark:text-yellow-400'
              }`}>
                {failed === 0 ? (
                  <CheckCircle className="h-5 w-5" />
                ) : (
                  <Clock className="h-5 w-5" />
                )}
                <span className="font-medium">
                  {failed === 0 ? 'Translation Completed!' : 'Translation Completed with Errors'}
                </span>
              </div>
              <div className={`text-sm ${
                failed === 0 ? 'text-green-600 dark:text-green-300' : 'text-yellow-600 dark:text-yellow-300'
              }`}>
                {failed === 0 
                  ? `All ${completed} entries translated successfully`
                  : `${completed} successful, ${failed} failed translations`
                }
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}