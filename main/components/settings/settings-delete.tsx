"use client"
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2 } from 'lucide-react';

interface SettingsDeleteProps {
  title: string;
  description: string;
  onDelete: () => void;
  loading?: boolean;
  disabled?: boolean;
  itemType?: string; // 'team', 'account', etc.
}

export default function SettingsDelete({
  title,
  description,
  onDelete,
  loading = false,
  disabled = false,
  itemType = 'team'
}: SettingsDeleteProps) {
  return (
    <Card className="border-red-600 bg-red-50">
      <CardHeader variant="delete">
        <CardTitle className="text-red-700 flex items-center gap-2">
          <Trash2 className="h-5 w-5" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm text-red-600">
              {description}
            </p>
          </div>
          <Button
            variant="destructive"
            onClick={onDelete}
            disabled={disabled || loading}
            className="ml-6"
          >
            {loading ? 'Deleting...' : `Delete ${itemType}`}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}