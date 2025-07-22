'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface LanguageInputProps {
  value: string;
  onChange: (value: string) => void;
  label: string;
  placeholder?: string;
  disabled?: boolean;
}

export function LanguageInput({ 
  value, 
  onChange, 
  label, 
  placeholder = "Enter language",
  disabled = false 
}: LanguageInputProps) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">
        {label}
      </Label>
      <Input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full"
      />
    </div>
  );
}