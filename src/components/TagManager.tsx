import React, { useState } from 'react';
import { Tag, Plus, X, Hash, Palette } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useAppStore } from '@/store/useAppStore';

const TAG_COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16',
  '#22c55e', '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9',
  '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef',
  '#ec4899', '#f43f5e', '#64748b', '#6b7280', '#374151'
];

interface TagManagerProps {
  trigger?: React.ReactNode;
  selectedTags?: string[];
  onTagsChange?: (tagIds: string[]) => void;
  mode?: 'manage' | 'select';
}

export const TagManager = ({ 
  trigger, 
  selectedTags = [], 
  onTagsChange,
  mode = 'manage' 
}: TagManagerProps) => {
  const [open, setOpen] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState(TAG_COLORS[0]);
  const [showColorPicker, setShowColorPicker] = useState(false);

  // For now, we'll use local state. In a real app, this would come from the store
  const [tags, setTags] = useState([
    { id: '1', name: 'urgent', color: '#ef4444', createdAt: new Date(), updatedAt: new Date() },
    { id: '2', name: 'design', color: '#8b5cf6', createdAt: new Date(), updatedAt: new Date() },
    { id: '3', name: 'development', color: '#3b82f6', createdAt: new Date(), updatedAt: new Date() },
    { id: '4', name: 'meeting', color: '#f59e0b', createdAt: new Date(), updatedAt: new Date() },
    { id: '5', name: 'research', color: '#10b981', createdAt: new Date(), updatedAt: new Date() }
  ]);

  const createTag = async () => {
    if (!newTagName.trim()) return;
    
    const newTag = {
      id: Date.now().toString(),
      name: newTagName.trim().toLowerCase(),
      color: newTagColor,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    setTags(prev => [...prev, newTag]);
    setNewTagName('');
    setNewTagColor(TAG_COLORS[0]);
  };

  const deleteTag = async (tagId: string) => {
    setTags(prev => prev.filter(tag => tag.id !== tagId));
    if (onTagsChange && selectedTags.includes(tagId)) {
      onTagsChange(selectedTags.filter(id => id !== tagId));
    }
  };

  const toggleTag = (tagId: string) => {
    if (!onTagsChange) return;
    
    const newSelection = selectedTags.includes(tagId)
      ? selectedTags.filter(id => id !== tagId)
      : [...selectedTags, tagId];
    
    onTagsChange(newSelection);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createTag();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="gap-2">
            <Tag className="h-4 w-4" />
            {mode === 'select' ? 'Tags' : 'Manage Tags'}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Hash className="h-5 w-5" />
            {mode === 'select' ? 'Select Tags' : 'Manage Tags'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Create New Tag */}
          <form onSubmit={handleSubmit} className="flex items-center gap-2">
            <div className="flex-1 flex items-center gap-2">
              <Input
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                placeholder="Enter tag name..."
                className="flex-1"
              />
              
              <Popover open={showColorPicker} onOpenChange={setShowColorPicker}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-10 h-10 p-0"
                    style={{ backgroundColor: newTagColor }}
                  >
                    <Palette className="h-4 w-4" style={{ color: '#ffffff' }} />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64">
                  <div className="grid grid-cols-5 gap-2">
                    {TAG_COLORS.map((color, index) => (
                      <button
                        key={index}
                        type="button"
                        className="w-8 h-8 rounded-full border-2 border-transparent hover:border-border"
                        style={{ backgroundColor: color }}
                        onClick={() => {
                          setNewTagColor(color);
                          setShowColorPicker(false);
                        }}
                      />
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            
            <Button type="submit" size="sm" disabled={!newTagName.trim()}>
              <Plus className="h-4 w-4" />
            </Button>
          </form>

          {/* Existing Tags */}
          {tags.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Tag className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No tags created yet</p>
              <p className="text-sm">Create your first tag above</p>
            </div>
          ) : (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-muted-foreground">
                {mode === 'select' ? 'Available Tags' : 'Your Tags'}
              </h4>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <div key={tag.id} className="flex items-center gap-1">
                    {mode === 'select' ? (
                      <Badge
                        variant={selectedTags.includes(tag.id) ? "default" : "secondary"}
                        className="cursor-pointer transition-all"
                        style={selectedTags.includes(tag.id) ? {
                          backgroundColor: tag.color,
                          color: '#ffffff'
                        } : {
                          backgroundColor: `${tag.color}20`,
                          color: tag.color
                        }}
                        onClick={() => toggleTag(tag.id)}
                      >
                        #{tag.name}
                      </Badge>
                    ) : (
                      <Badge
                        variant="secondary"
                        className="pr-1"
                        style={{
                          backgroundColor: `${tag.color}20`,
                          color: tag.color
                        }}
                      >
                        #{tag.name}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-4 w-4 p-0 ml-1 hover:bg-destructive hover:text-destructive-foreground"
                          onClick={() => deleteTag(tag.id)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {mode === 'select' && selectedTags.length > 0 && (
            <div className="pt-4 border-t">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  Selected: {selectedTags.length} tag{selectedTags.length !== 1 ? 's' : ''}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onTagsChange?.([])}
                >
                  Clear All
                </Button>
              </div>
            </div>
          )}

          {mode === 'select' && (
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => setOpen(false)}>
                Apply Tags
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
