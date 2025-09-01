import React, { useState, useEffect } from 'react';
import { User, Phone, Award, Clock, CheckCircle, TrendingUp, Save, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useAppStore } from '@/store/useAppStore';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format, isToday, startOfWeek, endOfWeek, differenceInDays } from 'date-fns';

const Profile = () => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { tasks, sessions } = useAppStore();

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .limit(1)
        .single();
      
      if (data) {
        setName(data.name || '');
        setPhone(data.phone || '');
      }
    } catch (error) {
      // Profile doesn't exist yet, that's fine
    }
  };

  const saveProfile = async () => {
    setLoading(true);
    try {
      const profileData = { name, phone };
      
      // Try to update first, then insert if not exists
      const { error: updateError } = await supabase
        .from('profiles')
        .update(profileData)
        .limit(1);

      if (updateError) {
        const { error: insertError } = await supabase
          .from('profiles')
          .insert([profileData]);
        
        if (insertError) throw insertError;
      }

      toast({
        title: "Profile saved",
        description: "Your profile has been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Error saving profile",
        description: "There was an error saving your profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Calculate stats
  const getStats = () => {
    const today = new Date();
    const weekStart = startOfWeek(today);
    const weekEnd = endOfWeek(today);

    // Today's stats
    const todayTasks = tasks.filter(task => 
      task.completedAt && isToday(new Date(task.completedAt))
    );
    const todaySessions = sessions.filter(session =>
      isToday(new Date(session.startedAt))
    );
    const todayMinutes = todaySessions.reduce((acc, session) => acc + (session.workSeconds / 60), 0);

    // Week's stats
    const weekTasks = tasks.filter(task => {
      if (!task.completedAt) return false;
      const completedDate = new Date(task.completedAt);
      return completedDate >= weekStart && completedDate <= weekEnd;
    });
    const weekSessions = sessions.filter(session => {
      const sessionDate = new Date(session.startedAt);
      return sessionDate >= weekStart && sessionDate <= weekEnd;
    });
    const weekMinutes = weekSessions.reduce((acc, session) => acc + (session.workSeconds / 60), 0);

    // Calculate current streak
    let streak = 0;
    let currentDate = new Date();
    while (true) {
      const dayTasks = tasks.filter(task => {
        if (!task.completedAt) return false;
        const completedDate = new Date(task.completedAt);
        return completedDate.toDateString() === currentDate.toDateString();
      });
      
      if (dayTasks.length === 0) break;
      streak++;
      currentDate.setDate(currentDate.getDate() - 1);
    }

    return {
      todayTasks: todayTasks.length,
      totalTasks: tasks.length,
      todayHours: todayMinutes / 60,
      weekTasks: weekTasks.length,
      weekHours: weekMinutes / 60,
      streak
    };
  };

  const stats = getStats();

  return (
    <div className="min-h-screen bg-gradient-surface p-6 overflow-y-auto">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Button variant="outline" onClick={() => window.location.href = '/'} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Home
          </Button>
          <div className="flex-1 text-center">
            <div className="w-24 h-24 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4 shadow-elegant">
              <User className="h-12 w-12 text-primary-foreground" />
            </div>
            <h1 className="text-3xl font-bold">Profile</h1>
            <p className="text-muted-foreground">Manage your profile and view your progress</p>
          </div>
          <div className="w-20"></div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Profile Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your full name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Enter your phone number"
                />
              </div>
              <Button onClick={saveProfile} disabled={loading} className="w-full gap-2">
                <Save className="h-4 w-4" />
                {loading ? 'Saving...' : 'Save Profile'}
              </Button>
            </CardContent>
          </Card>

          {/* Current Streak */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                Current Streak
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center space-y-2">
                <div className="text-4xl font-bold text-primary">{stats.streak}</div>
                <div className="text-muted-foreground">
                  {stats.streak === 1 ? 'day' : 'days'} in a row
                </div>
                <Badge variant="secondary" className="gap-1">
                  <TrendingUp className="h-3 w-3" />
                  Keep it up!
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Progress Reports */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Today's Progress */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Today's Progress
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Tasks Completed</span>
                <Badge variant="outline">{stats.todayTasks}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Productive Hours</span>
                <Badge variant="outline">{stats.todayHours.toFixed(1)}h</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Completion Rate</span>
                <Badge variant="outline">
                  {stats.totalTasks > 0 ? Math.round((stats.todayTasks / stats.totalTasks) * 100) : 0}%
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* This Week's Progress */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                This Week's Progress
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Tasks Completed</span>
                <Badge variant="outline">{stats.weekTasks}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Productive Hours</span>
                <Badge variant="outline">{stats.weekHours.toFixed(1)}h</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Average per Day</span>
                <Badge variant="outline">{(stats.weekHours / 7).toFixed(1)}h</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Profile;