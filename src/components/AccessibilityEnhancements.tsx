import React, { useEffect, useState } from 'react';
import { Eye, Moon, Sun, Type, Volume2, VolumeX, Focus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/hooks/use-toast';

type ColorScheme = 'light' | 'dark' | 'high-contrast';
type FontSize = 'small' | 'medium' | 'large' | 'extra-large';
type MotionPreference = 'no-preference' | 'reduce';

interface AccessibilitySettings {
  colorScheme: ColorScheme;
  fontSize: FontSize;
  highContrast: boolean;
  reduceMotion: boolean;
  soundEnabled: boolean;
  focusIndicators: boolean;
  screenReaderOptimized: boolean;
  keyboardNavigation: boolean;
}

export const AccessibilityEnhancements = () => {
  const { toast } = useToast();
  const [settings, setSettings] = useState<AccessibilitySettings>({
    colorScheme: 'light',
    fontSize: 'medium',
    highContrast: false,
    reduceMotion: false,
    soundEnabled: true,
    focusIndicators: true,
    screenReaderOptimized: false,
    keyboardNavigation: true,
  });

  // Load settings from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('accessibilitySettings');
    if (stored) {
      try {
        const parsedSettings = JSON.parse(stored);
        setSettings(parsedSettings);
        applySettings(parsedSettings);
      } catch (error) {
        console.error('Failed to load accessibility settings:', error);
      }
    } else {
      // Detect system preferences
      detectSystemPreferences();
    }
  }, []);

  const detectSystemPreferences = () => {
    const newSettings = { ...settings };

    // Detect dark mode preference
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      newSettings.colorScheme = 'dark';
    }

    // Detect high contrast preference
    if (window.matchMedia('(prefers-contrast: high)').matches) {
      newSettings.highContrast = true;
    }

    // Detect reduced motion preference
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      newSettings.reduceMotion = true;
    }

    setSettings(newSettings);
    applySettings(newSettings);
  };

  const updateSetting = <K extends keyof AccessibilitySettings>(
    key: K, 
    value: AccessibilitySettings[K]
  ) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    applySettings(newSettings);
    localStorage.setItem('accessibilitySettings', JSON.stringify(newSettings));
    
    toast({
      title: "Settings updated",
      description: `${key} preference has been saved.`,
      variant: "default",
    });
  };

  const applySettings = (newSettings: AccessibilitySettings) => {
    const root = document.documentElement;

    // Apply color scheme
    root.setAttribute('data-theme', newSettings.colorScheme);
    if (newSettings.colorScheme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    // Apply font size
    const fontSizeMap = {
      small: '14px',
      medium: '16px',
      large: '18px',
      'extra-large': '20px'
    };
    root.style.fontSize = fontSizeMap[newSettings.fontSize];

    // Apply high contrast
    if (newSettings.highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }

    // Apply reduced motion
    if (newSettings.reduceMotion) {
      root.classList.add('reduce-motion');
    } else {
      root.classList.remove('reduce-motion');
    }

    // Apply focus indicators
    if (newSettings.focusIndicators) {
      root.classList.add('enhanced-focus');
    } else {
      root.classList.remove('enhanced-focus');
    }

    // Apply screen reader optimizations
    if (newSettings.screenReaderOptimized) {
      root.classList.add('screen-reader-optimized');
    } else {
      root.classList.remove('screen-reader-optimized');
    }
  };

  const resetToDefaults = () => {
    const defaultSettings: AccessibilitySettings = {
      colorScheme: 'light',
      fontSize: 'medium',
      highContrast: false,
      reduceMotion: false,
      soundEnabled: true,
      focusIndicators: true,
      screenReaderOptimized: false,
      keyboardNavigation: true,
    };

    setSettings(defaultSettings);
    applySettings(defaultSettings);
    localStorage.setItem('accessibilitySettings', JSON.stringify(defaultSettings));
    
    toast({
      title: "Settings reset",
      description: "All accessibility settings have been reset to defaults.",
      variant: "default",
    });
  };

  const testScreenReader = () => {
    // Create a live region announcement for screen readers
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.style.position = 'absolute';
    announcement.style.left = '-10000px';
    announcement.style.width = '1px';
    announcement.style.height = '1px';
    announcement.style.overflow = 'hidden';
    
    announcement.textContent = 'Screen reader test: Accessibility features are working correctly.';
    document.body.appendChild(announcement);
    
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);

    toast({
      title: "Screen reader test",
      description: "Accessibility announcement sent.",
      variant: "default",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Eye className="h-5 w-5 text-primary" />
        <h2 className="text-2xl font-bold">Accessibility Settings</h2>
      </div>

      {/* Visual Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Visual Preferences
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="color-scheme">Color Scheme</Label>
              <Select 
                value={settings.colorScheme} 
                onValueChange={(value: ColorScheme) => updateSetting('colorScheme', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select color scheme" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">
                    <div className="flex items-center gap-2">
                      <Sun className="h-4 w-4" />
                      Light
                    </div>
                  </SelectItem>
                  <SelectItem value="dark">
                    <div className="flex items-center gap-2">
                      <Moon className="h-4 w-4" />
                      Dark
                    </div>
                  </SelectItem>
                  <SelectItem value="high-contrast">
                    <div className="flex items-center gap-2">
                      <Focus className="h-4 w-4" />
                      High Contrast
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="font-size">Font Size</Label>
              <Select 
                value={settings.fontSize} 
                onValueChange={(value: FontSize) => updateSetting('fontSize', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select font size" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="small">Small</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="large">Large</SelectItem>
                  <SelectItem value="extra-large">Extra Large</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="high-contrast">High Contrast Mode</Label>
              <p className="text-sm text-muted-foreground">
                Increases contrast for better visibility
              </p>
            </div>
            <Switch
              id="high-contrast"
              checked={settings.highContrast}
              onCheckedChange={(checked) => updateSetting('highContrast', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="reduce-motion">Reduce Motion</Label>
              <p className="text-sm text-muted-foreground">
                Minimizes animations and transitions
              </p>
            </div>
            <Switch
              id="reduce-motion"
              checked={settings.reduceMotion}
              onCheckedChange={(checked) => updateSetting('reduceMotion', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Audio Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Volume2 className="h-4 w-4" />
            Audio Preferences
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="sound-enabled">Sound Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Enable audio feedback and notifications
              </p>
            </div>
            <Switch
              id="sound-enabled"
              checked={settings.soundEnabled}
              onCheckedChange={(checked) => updateSetting('soundEnabled', checked)}
              aria-describedby="sound-enabled-description"
            />
          </div>
        </CardContent>
      </Card>

      {/* Navigation Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Focus className="h-4 w-4" />
            Navigation & Focus
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="focus-indicators">Enhanced Focus Indicators</Label>
              <p className="text-sm text-muted-foreground">
                Makes keyboard focus more visible
              </p>
            </div>
            <Switch
              id="focus-indicators"
              checked={settings.focusIndicators}
              onCheckedChange={(checked) => updateSetting('focusIndicators', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="keyboard-navigation">Keyboard Navigation</Label>
              <p className="text-sm text-muted-foreground">
                Enable full keyboard navigation support
              </p>
            </div>
            <Switch
              id="keyboard-navigation"
              checked={settings.keyboardNavigation}
              onCheckedChange={(checked) => updateSetting('keyboardNavigation', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="screen-reader">Screen Reader Optimizations</Label>
              <p className="text-sm text-muted-foreground">
                Enhanced support for screen readers
              </p>
            </div>
            <Switch
              id="screen-reader"
              checked={settings.screenReaderOptimized}
              onCheckedChange={(checked) => updateSetting('screenReaderOptimized', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Testing & Reset */}
      <Card>
        <CardHeader>
          <CardTitle>Testing & Reset</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button 
              onClick={testScreenReader}
              variant="outline"
              className="gap-2"
            >
              <Volume2 className="h-4 w-4" />
              Test Screen Reader
            </Button>
            
            <Button 
              onClick={resetToDefaults}
              variant="outline"
              className="gap-2"
            >
              Reset to Defaults
            </Button>
          </div>
          
          <p className="text-sm text-muted-foreground">
            Settings are automatically saved and will persist across sessions.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};