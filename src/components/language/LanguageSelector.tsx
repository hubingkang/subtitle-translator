'use client';

import { useState, useEffect, useCallback } from 'react';
import { Check, ChevronDown, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { LanguageOption } from '@/types/translation';
import langs from 'langs';

// Type definition for langs library
interface LangItem {
  '1': string;
  '2B': string;
  '2T': string;
  '3': string;
  name: string;
  local: string;
}

interface LanguageSelectorProps {
  value: string;
  onChange: (value: string) => void;
  label: string;
  placeholder?: string;
  disabled?: boolean;
}

export function LanguageSelector({ 
  value, 
  onChange, 
  label, 
  placeholder = "Select language",
  disabled = false 
}: LanguageSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [languages, setLanguages] = useState<LanguageOption[]>([]);
  const [filteredLanguages, setFilteredLanguages] = useState<LanguageOption[]>([]);

  // Helper functions
  const getPopularLanguages = useCallback((): LanguageOption[] => {
    const popularCodes = [
      'eng', // English
      'spa', // Spanish
      'fra', // French
      'deu', // German
      'ita', // Italian
      'por', // Portuguese
      'rus', // Russian
      'jpn', // Japanese
      'kor', // Korean
      'cmn', // Chinese (Mandarin)
      'ara', // Arabic
      'hin', // Hindi
      'tha', // Thai
      'vie', // Vietnamese
      'nld', // Dutch
      'pol', // Polish
      'tur', // Turkish
      'swe', // Swedish
      'nor', // Norwegian
      'dan', // Danish
      'fin', // Finnish
      'heb', // Hebrew
      'ces', // Czech
      'hun', // Hungarian
      'ron', // Romanian
      'bul', // Bulgarian
      'hrv', // Croatian
      'slv', // Slovenian
      'est', // Estonian
      'lav', // Latvian
      'lit', // Lithuanian
      'ell', // Greek
      'ukr', // Ukrainian
    ];

    return popularCodes
      .map(code => {
        const lang = langs.where('3', code);
        if (!lang) return null;
        
        return {
          code,
          name: lang.name,
          native: lang.local || lang.name
        };
      })
      .filter((lang): lang is LanguageOption => lang !== null)
      .sort((a, b) => a.name.localeCompare(b.name));
  }, []);

  const getAllLanguages = useCallback((): LanguageOption[] => {
    return langs.all()
      .filter((lang: LangItem) => lang['3'] && lang.name) // Only languages with ISO 639-3 codes
      .map((lang: LangItem) => ({
        code: lang['3'],
        name: lang.name,
        native: lang.local || lang.name
      }))
      .sort((a: LanguageOption, b: LanguageOption) => a.name.localeCompare(b.name));
  }, []);

  const searchLanguages = useCallback((query: string): LanguageOption[] => {
    if (!query || query.length < 2) {
      return [];
    }

    const searchTerm = query.toLowerCase();
    const allLanguages = getAllLanguages();
    
    return allLanguages
      .filter(lang => 
        lang.name.toLowerCase().includes(searchTerm) ||
        lang.native.toLowerCase().includes(searchTerm) ||
        lang.code.toLowerCase().includes(searchTerm)
      )
      .slice(0, 20); // Limit results
  }, [getAllLanguages]);

  // Load popular languages on mount
  useEffect(() => {
    const popularLanguages = getPopularLanguages();
    setLanguages(popularLanguages);
    setFilteredLanguages(popularLanguages);
  }, [getPopularLanguages]);

  // Filter languages based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredLanguages(languages);
    } else {
      const filtered = searchLanguages(searchQuery);
      setFilteredLanguages(filtered);
    }
  }, [searchQuery, languages, searchLanguages]);

  const selectedLanguage = languages.find(lang => lang.code === value);

  const handleSelect = (languageCode: string) => {
    onChange(languageCode);
    setIsOpen(false);
    setSearchQuery('');
  };

  return (
    <div className="relative space-y-2">
      <Label className="text-sm font-medium">
        {label}
      </Label>
      
      <div className="relative">
        <Button
          variant="outline"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className="w-full justify-between h-10"
        >
          <span className={selectedLanguage ? 'text-foreground' : 'text-muted-foreground'}>
            {selectedLanguage ? (
              <div className="flex items-center gap-2">
                <span>{selectedLanguage.name}</span>
                <Badge variant="secondary" className="text-xs">
                  {selectedLanguage.native}
                </Badge>
              </div>
            ) : (
              placeholder
            )}
          </span>
          <ChevronDown className={`h-4 w-4 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`} />
        </Button>

        {isOpen && (
          <Card className="absolute z-50 w-full mt-1 shadow-lg">
            <CardContent className="p-0">
              {/* Search Input */}
              <div className="p-3 border-b">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Search languages..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                    autoFocus
                  />
                </div>
              </div>

              {/* Language List */}
              <div className="max-h-60 overflow-y-auto">
                {filteredLanguages.length > 0 ? (
                  <div className="py-1">
                    {filteredLanguages.map((language) => (
                      <button
                        key={language.code}
                        onClick={() => handleSelect(language.code)}
                        className="w-full px-3 py-2 text-left hover:bg-accent focus:bg-accent focus:outline-none flex items-center justify-between group"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">
                            {language.name}
                          </div>
                          <div className="text-xs text-muted-foreground truncate">
                            {language.native} • {language.code}
                          </div>
                        </div>
                        {value === language.code && (
                          <Check className="h-4 w-4 text-primary ml-2 flex-shrink-0" />
                        )}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="px-3 py-8 text-center text-muted-foreground">
                    <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm font-medium">No languages found</p>
                    <p className="text-xs">Try a different search term</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Overlay to close dropdown */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}