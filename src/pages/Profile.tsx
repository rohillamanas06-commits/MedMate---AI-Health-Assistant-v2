import { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, Calendar, Camera, Loader2, Upload, X, Trash2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { toast } from 'sonner';

export default function Profile() {
  const { user, logout, checkAuth } = useAuth();
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [removingPicture, setRemovingPicture] = useState(false);
  const [profileData, setProfileData] = useState({
    username: user?.username || '',
    email: user?.email || '',
  });
  const [profilePicture, setProfilePicture] = useState(user?.profile_picture_url || '');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);

  // Update profile picture and data when user data changes
  useEffect(() => {
    if (user) {
      setProfileData({
        username: user.username || '',
        email: user.email || '',
      });
      if (user.profile_picture_url) {
        setProfilePicture(user.profile_picture_url);
      }
    }
  }, [user]);

  if (!user) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size must be less than 5MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async () => {
    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      toast.error('Please select an image');
      return;
    }

    setUploading(true);
    try {
      const result: any = await api.uploadProfilePicture(file);
      setProfilePicture(result.image_url);
      setPreview(null);
      
      // Refresh user data to get updated profile picture
      await checkAuth();
      
      toast.success('Profile picture uploaded successfully!');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to upload picture');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveProfilePicture = async () => {
    if (!profilePicture) {
      toast.error('No profile picture to delete');
      return;
    }

    setRemovingPicture(true);
    try {
      await api.deleteProfilePicture();
      setProfilePicture('');
      setPreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      await checkAuth();
      toast.success('Profile picture removed');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete picture');
    } finally {
      setRemovingPicture(false);
    }
  };

  const handleUpdate = async () => {
    setLoading(true);
    try {
      await api.updateProfile(profileData);
      
      // Refresh user data to get updated info
      await checkAuth();
      
      toast.success('Profile updated successfully!');
      setEditMode(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background py-4 px-4 sm:py-8">
      <div className="container max-w-4xl mx-auto">
        <div className="mb-6 sm:mb-8 text-center animate-slide-up">
          <h1 className="text-2xl sm:text-4xl font-bold mb-2 gradient-text">Your Profile</h1>
          <p className="text-muted-foreground text-sm sm:text-lg">
            Manage your account information
          </p>
        </div>

        <div className="grid gap-4 sm:gap-6">
          {/* Profile Picture Section */}
          <Card className="p-4 sm:p-8 glass animate-fade-in">
            <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 mb-6">
              <div className="relative">
                <Avatar className="h-20 w-20 sm:h-32 sm:w-32 border-4 border-primary/20">
                  {profilePicture ? (
                    <AvatarImage src={profilePicture} alt={user.username} />
                  ) : (
                    <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-white text-2xl sm:text-4xl font-bold">
                      {user.username.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  )}
                </Avatar>
                {preview && (
                  <div className="absolute inset-0 rounded-full border-4 border-primary animate-pulse" />
                )}
              </div>
              <div className="text-center sm:text-left flex-1">
                <h2 className="text-xl sm:text-3xl font-bold mb-1">{user.username}</h2>
                <p className="text-muted-foreground text-sm sm:text-base break-all">{user.email}</p>
                <div className="mt-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      className="mt-2"
                    >
                      <Camera className="h-4 w-4 mr-1" />
                      Choose Photo
                    </Button>
                    {profilePicture && !preview && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={handleRemoveProfilePicture}
                        disabled={removingPicture}
                        className="mt-2 text-destructive hover:text-destructive"
                      >
                        {removingPicture ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                            Removing...
                          </>
                        ) : (
                          <>
                            <Trash2 className="h-4 w-4 mr-1" />
                            Remove Photo
                          </>
                        )}
                      </Button>
                    )}
                    {preview && (
                      <>
                        <Button
                          size="sm"
                          onClick={handleUpload}
                          disabled={uploading}
                          className="mt-2"
                        >
                          {uploading ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                              Uploading...
                            </>
                          ) : (
                            <>
                              <Upload className="h-4 w-4 mr-1" />
                              Upload
                            </>
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setPreview(null);
                            if (fileInputRef.current) fileInputRef.current.value = '';
                          }}
                          className="mt-2"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Profile Information */}
          <Card className="p-4 sm:p-8 glass animate-fade-in">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold">Profile Information</h3>
              <Button
                onClick={() => editMode ? handleUpdate() : setEditMode(true)}
                disabled={loading}
                size="sm"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    Saving...
                  </>
                ) : editMode ? (
                  'Save Changes'
                ) : (
                  'Edit Profile'
                )}
              </Button>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  value={profileData.username}
                  onChange={(e) => setProfileData({ ...profileData, username: e.target.value })}
                  disabled={!editMode}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={profileData.email}
                  onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                  disabled={!editMode}
                  className="mt-1"
                />
              </div>

              {editMode && (
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setEditMode(false);
                      setProfileData({ username: user.username, email: user.email });
                    }}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6 pt-6 border-t">
              <Card className="p-4 bg-muted/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10 flex-shrink-0">
                    <Calendar className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Member Since</p>
                    <p className="font-semibold">
                      {user.created_at
                        ? new Date(user.created_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })
                        : 'N/A'}
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-4 bg-muted/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10 flex-shrink-0">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Account ID</p>
                    <p className="font-semibold">#{user.id}</p>
                  </div>
                </div>
              </Card>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
